import express from 'express';
import vision from '@google-cloud/vision';
import path from 'path';
import { config } from 'dotenv';
import OpenAI from 'openai';

config(); // .env 読み込み

const ocrRouter = express.Router();

const client = new vision.ImageAnnotatorClient({
  keyFilename: path.resolve(__dirname, 'vision-key.json'),
});

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

// ✅ 画像OCRエンドポイント（Vision API）
ocrRouter.post('/', async (req, res) => {
  const { imageBase64 } = req.body;
  console.log('📥 Received base64 length:', imageBase64?.length); // ← これを追加
  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing imageBase64' });
  }

  try {
    const [result] = await client.textDetection({ image: { content: imageBase64 } });
    const detections = result.textAnnotations;
    const text = detections?.[0]?.description || '';

    console.log('📄 Google OCR result:\n', text);
    return res.json({ text });
  } catch (err) {
    console.error('🧨 OCR error:', err);
    return res.status(500).json({ error: 'OCR failed' });
  }
});

// ✅ GPT分類エンドポイント（未使用だが残しておく）
ocrRouter.post('/classify', async (req, res) => {
  const { block } = req.body;
  if (!block || typeof block !== 'string') {
    return res.status(400).json({ error: 'Invalid block' });
  }

  try {
    const prompt = `
Classify the following text block from an invoice into one of four categories:
- item_info (if it's a product line like "Garlic 2 kg")
- address_info (if it's an address)
- meta_info (if it's invoice number, date, total, etc.)
- other (if none of the above)

Block:
${block}

Answer only with one of: item_info, address_info, meta_info, other.
`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const result = chat.choices[0]?.message?.content?.trim() || 'other';
    return res.json({ result });
  } catch (err) {
    console.error('GPT classification error:', err);
    return res.status(500).json({ error: 'GPT classification failed' });
  }
});

// ✅ ✅ Step B: プロンプト強化（数量と価格の混同防止）
ocrRouter.post('/parse', async (req, res) => {
  const { block } = req.body;
  if (!block || typeof block !== 'string') {
    return res.status(400).json({ error: 'Invalid block' });
  }

  try {
    const prompt = `
You are a highly accurate invoice parser.

From the following text block, extract all product items. The block may contain:
- Multiple products in one line
- Quantity/unit/price in mixed order (e.g., "3kg $9.50 Chicken")
- Prices always prefixed with a dollar sign ($)
- Irrelevant headers, addresses, or metadata (ignore them)

Instructions:
- Return a JSON array of items
- Each item must have: name (string), quantity (number), unit (string)
- Optionally: price (number), note (string), sourceText (string)
- Do not guess values. If missing, omit them
- Do not confuse quantity (number without $) and price (number with $)
- Separate items clearly even if they are in one line

Input:
${block}

JSON:
`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const text = chat.choices[0]?.message?.content || '[]';
    const cleaned = text.replace(/```json|```/g, '').trim();
    console.log('🔍 GPT multi-item response:\n', text);
    console.log('🧼 Cleaned JSON:\n', cleaned);

    const parsed = JSON.parse(cleaned);
    return res.json({ data: parsed });
  } catch (err) {
    console.error('🧨 GPT parsing error:', err);
    return res.status(500).json({ error: 'Parsing failed' });
  }
});

// ✅ 🆕 複数項目の構造解析（GPT）
ocrRouter.post('/gpt-parse', async (req, res) => {
  const { rawText } = req.body;
  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).json({ error: 'Missing rawText' });
  }

  try {
    const prompt = `
You are a precise invoice parser.

From the following OCR invoice text, extract all product item lines and return a JSON array.

Each item in the array must have the format:
{
  name: string,
  quantity: number,
  unit: string,
  price?: number,
  note?: string,
  sourceText: string
}

Only include items that appear to be products. Do not include headers, addresses, or invoice numbers.

Input:
${rawText}

JSON:
`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const text = chat.choices[0]?.message?.content || '[]';
    const cleaned = text.replace(/```json|```/g, '').trim();

    console.log('🔍 GPT raw multiline response:\n', text);
    console.log('🧼 Cleaned JSON:\n', cleaned);

    const parsed = JSON.parse(cleaned);
    return res.json({ data: parsed });
  } catch (err) {
    console.error('🧨 GPT multi-parse error:', err);
    return res.status(500).json({ error: 'GPT multi-parse failed' });
  }
});

export default ocrRouter;
