/// hooks/useOCRProcessing.ts

import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { correctName } from '../utils/ocrCorrection';
import { InventoryItem, ParsedItem } from '../types/types';

console.log('✅ useOCRProcessing.ts loaded');

export function useOCRProcessing() {
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const processOCRText = async (rawText: string): Promise<ParsedItem[]> => {
    setLoading(true);

    try {
      // 🧠 Step C-1: GPT一括解析へ送信
      const parseRes = await fetch('http://localhost:3001/ocr/gpt-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });

      const parsedJson = await parseRes.json();
      console.log('🧠 GPT parsedJson:', parsedJson);

      const { data } = await supabase.from('inventory').select('id, name, quantity, category');
      const inventoryList = (data as InventoryItem[]) || [];
      const inventoryNames = inventoryList.map((i) => ({ id: i.id, name: String(i.name) }));

      const structured: ParsedItem[] = [];

      for (const item of parsedJson?.data || []) {
        const correctedName = correctName(item.name, inventoryNames, 0.7);
        const exists = inventoryList.find(
          (i) => String(i.name).toLowerCase() === correctedName.toLowerCase()
        );

        structured.push({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          note: item.note,
          sourceText: item.sourceText,
          correctedName,
          status: exists
            ? 'tracked'
            : correctedName === item.name
            ? 'unknown'
            : 'new',
          category: exists?.category || '',
          showNewCategoryInput: !exists,
          extraFields: item.extraFields || {},
          _newExtraKey: '',
          _newExtraValue: '',
        });
      }

      setParsedItems(structured);
      console.log('🧾 Final parsed items:', structured);
      setLoading(false);
      return structured;
    } catch (err) {
      console.error('🧨 processOCRText error:', err);
      setLoading(false);
      return [];
    }
  };

  return {
    parsedItems,
    setParsedItems,
    loading,
    setLoading,
    processOCRText,
  };
}
