// utils/processBlocks.ts
import axios from 'axios';
import { OCRItem } from '../types/types';

export async function processBlocks(blocks: { text: string }[]): Promise<OCRItem[]> {
  const parsedItems: OCRItem[] = [];

  for (const block of blocks) {
    try {
      const res = await axios.post<{ data: OCRItem }>('http://localhost:3001/ocr/parse', {
        block: block.text,
      });

      const data = res.data.data;

      if (data?.name && data?.quantity && data?.unit) {
        parsedItems.push({
          ...data,
          sourceText: block.text,
        });
      }
    } catch (err) {
      console.warn('🟠 parse failed for block:', block.text);
    }
  }

  return parsedItems;
}
