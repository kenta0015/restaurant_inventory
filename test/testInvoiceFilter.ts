import fs from 'fs/promises';
import path from 'path';
import { isLikelyItemLine } from '../utils/ocrClassifier';
import { normalizeLine } from '../utils/ocrCorrection';

async function main() {
  const filePath = path.resolve(__dirname, '../data/invoice_sample.txt');
  const raw = await fs.readFile(filePath, 'utf-8');
  const lines = raw.split('\n').map(line => line.trim()).filter(line => line);

  console.log('--- Invoice OCR Filter Test Start ---\n');

  for (const line of lines) {
    const passed = isLikelyItemLine(line);
    if (passed) {
      const item = normalizeLine(line);
      if (item) {
        console.log(`✅ "${line}" →`, item);
      } else {
        console.log(`⚠️ "${line}" → Passed filter, but failed to normalize`);
      }
    } else {
      console.log(`❌ "${line}"`);
    }
  }

  console.log('\n--- Test Finished ---');
}

main().catch(console.error);
