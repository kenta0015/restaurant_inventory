// utils/ocrApi.ts
export async function sendToOCR(base64: string): Promise<string> {
  const response = await fetch('http://localhost:3001/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64 }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'OCR failed');
  return result.text;
}
