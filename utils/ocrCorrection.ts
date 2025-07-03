// utils/ocrCorrection.ts
import stringSimilarity from 'string-similarity';

export interface InventoryName {
  id?: string;
  name: string;
}

/**
 * 候補との類似度に基づいて商品名を補正
 * @param input - OCRで読み取った名前
 * @param inventoryNames - 在庫名リスト
 * @param threshold - 類似度スコアしきい値（0〜1）
 * @returns 最も近い名前 or 元のinput
 */
export function correctName(
  input: string,
  inventoryNames: InventoryName[],
  threshold = 0.7
): string {
  if (typeof input !== 'string' || !Array.isArray(inventoryNames)) {
    console.warn('❌ Invalid input or inventoryNames:', { input, inventoryNames });
    return input;
  }

  const inputLower = input.toLowerCase();
  const candidateNames = inventoryNames
    .map((item) => item?.name?.toLowerCase?.().trim?.())
    .filter((name): name is string => typeof name === 'string');

  if (candidateNames.length === 0) {
    console.warn('❌ No valid candidate names found');
    return input;
  }

  const { bestMatch } = stringSimilarity.findBestMatch(inputLower, candidateNames);
  console.log(`🔍 Matching "${input}" → "${bestMatch.target}" (score: ${bestMatch.rating})`);

  if (bestMatch.rating >= threshold) {
    return bestMatch.target;
  }

  return input;
}

export function cleanOCRLine(rawLine: string): string {
  return rawLine
    .split(/\n+/)
    .map((l) => l.trim())
    .join(' ')
    .replace(/0(?=\w)/g, 'o')
    .replace(/(?<=\w)0/g, 'o')
    .replace(/[=:_•■●◆★・▶️→~#※\\-]/g, '')
    .replace(/[^\w\d.,\s$]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
}

export function normalizeLine(rawLine: string): ParsedItem | null {
  const line = cleanOCRLine(rawLine);
  console.log(`🧪 normalizeLine(): "${rawLine}" → "${line}"`);

  if (line.length < 2) {
    console.warn(`🚫 Too short or empty line: "${line}"`);
    return null;
  }

  const unitPattern = /\b(kg|g|gram|gr|l|L|ml|cl|pcs?|packs?|袋|個|本|缶|bottle|box|ケース|パック)\b/i;
  const quantityPattern = /([\d.]+)\s*/;
  const pricePattern = /\$([\d.]+)/;

  const unitMatch = line.match(unitPattern);
  const quantityMatch = line.match(quantityPattern);
  const priceMatch = line.match(pricePattern);

  const quantity = quantityMatch ? parseFloat(quantityMatch[1].replace(',', '.')) : NaN;
  const unit = unitMatch ? unitMatch[1].toLowerCase() : 'unit';
  const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;

  // 数値部分や単位、$価格表記を除去した文字列を商品名に使う
  let namePart = line
    .replace(priceMatch?.[0] || '', '')
    .replace(quantityMatch?.[0] || '', '')
    .replace(unitMatch?.[0] || '', '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!namePart || isNaN(quantity)) {
    console.warn(`⚠️ Failed to parse cleaned line: "${line}"`);
    return null;
  }

  console.log(
    `✅ Parsed → name: "${namePart}", qty: ${quantity}, unit: "${unit}", price: ${price ?? '—'}`
  );

  return {
    name: namePart,
    quantity,
    unit,
    price,
  };
}
