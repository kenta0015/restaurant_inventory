// utils/processLines.ts
import { normalizeLine, ParsedItem } from '../utils/ocrCorrection';

export const processLines = (rawText: string): ParsedItem[] => {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const result: ParsedItem[] = [];

  const descriptionIndex = lines.findIndex((line) =>
    line.toLowerCase().includes('description')
  );
  const quantityIndex = lines.findIndex((line) =>
    line.toLowerCase().includes('quantity')
  );
  const unitIndex = lines.findIndex((line) =>
    line.toLowerCase().includes('unit')
  );

  const validIndexes = [descriptionIndex, quantityIndex, unitIndex].filter((i) => i !== -1);

  if (
    validIndexes.length === 3 &&
    descriptionIndex < quantityIndex &&
    quantityIndex < unitIndex
  ) {
    const descLines = lines.slice(descriptionIndex + 1, quantityIndex).filter((l) =>
      !['quantity', 'unit', 'description'].includes(l.toLowerCase())
    );

    const rawQtyUnitLines = lines.slice(quantityIndex + 1, lines.length).filter((l) =>
      !['quantity', 'unit', 'description'].includes(l.toLowerCase())
    );

    const quantityUnitPairs: { qty: string; unit: string }[] = [];
    for (let i = 0; i < rawQtyUnitLines.length - 1; i += 2) {
      quantityUnitPairs.push({
        qty: rawQtyUnitLines[i],
        unit: rawQtyUnitLines[i + 1],
      });
    }

    console.log('📦 Vertical Table (interleaved QTY+UNIT) Detected');
    console.log('🔹 descLines:', descLines);
    console.log('🔹 quantityUnitPairs:', quantityUnitPairs);

    const count = Math.min(descLines.length, quantityUnitPairs.length);

    for (let i = 0; i < count; i++) {
      const desc = descLines[i] || '';
      const qty = quantityUnitPairs[i]?.qty || '';
      const unit = quantityUnitPairs[i]?.unit || '';
      const combinedLine = `${desc} ${qty} ${unit}`;
      const parsed = normalizeLine(combinedLine);
      if (parsed) {
        result.push(parsed);
      }
    }

    return result;
  }

  // fallback
  for (const line of lines) {
    if (line.toLowerCase().includes('description')) continue;
    if (line.toLowerCase().includes('quantity')) continue;
    if (line.toLowerCase().includes('unit')) continue;

    const parsed = normalizeLine(line);
    if (parsed) {
      result.push(parsed);
    } else {
      console.warn(`❌ Skipped line [other]:\n${line}`);
    }
  }

  return result;
};
