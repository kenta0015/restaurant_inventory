// utils/saveParsedItems.ts

import { supabase } from '../supabaseClient';
import type { ParsedItem, InventoryItem } from '../types/types';

type RegistrationResult = 'success' | 'skipped' | 'error';

export interface RegistrationFeedback {
  index: number;
  item: ParsedItem;
  status: RegistrationResult;
  message?: string;
  overwrite?: boolean;
}

export async function saveParsedItems(items: ParsedItem[]): Promise<{
  results: RegistrationFeedback[]; 
}> {
  const results: RegistrationFeedback[] = [];

  const { data: existingInventory, error: fetchError } = await supabase
    .from('inventory')
    .select('name, quantity');

  const existingMap = fetchError || !existingInventory
    ? new Map()
    : new Map(
        existingInventory.map((item) => [
          item.name.trim().toLowerCase(),
          item.quantity ?? 0,
        ])
      );

  const upsertData = items.map((item, index) => {
    const rawName = item.correctedName?.trim() || '';
    const name = rawName.toLowerCase(); // 🔁 小文字統一
    const unit = item.unit?.trim() || '';
    const price = item.price;
    const category = item.category?.trim() || 'Uncategorized';
    const quantity = item.quantity || 0;

    const needsReview = unit === '' || price === undefined;
    const existingNote = item.note?.trim() || '';
    const noteWithWarning =
      needsReview && !existingNote.includes('⚠️ low stock')
        ? existingNote.length > 0
          ? `${existingNote} ⚠️ low stock`
          : '⚠️ low stock'
        : existingNote || null;

    if (!name) {
      results.push({
        index,
        item,
        status: 'skipped',
        message: 'Name missing',
      });
      return null;
    }

    const existingQuantity = existingMap.get(name) || 0;
    const newQuantity = existingQuantity + quantity;
    const isOverwrite = existingMap.has(name);

    results.push({
      index,
      item,
      status: 'success',
      overwrite: isOverwrite,
    });

    return {
      name,
      quantity: newQuantity,
      unit,
      category,
      price: price ?? null,
      comment: noteWithWarning,
      alertLevel: 2,
      lastChecked: new Date().toISOString(),
      status: needsReview ? 'pending' : 'tracked',
    };
  });

  const validData = upsertData.filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  if (validData.length === 0) {
    console.warn('🟡 No valid items to upsert.');
    return { results };
  }

  try {
    const { data, error }: { data: InventoryItem[] | null; error: any } =
      await supabase
        .from('inventory')
        .upsert(validData, {
          onConflict: 'name',
          ignoreDuplicates: false,
        })
        .select();

    if (error) {
      console.error('❌ Supabase upsert failed:', error.message);
      results.forEach((r) => {
        if (r.status === 'success') {
          r.status = 'error';
          r.message = error.message;
        }
      });
      return { results };
    }

    if (data) {
      console.log(`✅ Supabase upsert success (${data.length} items)`);
    } else {
      console.warn('🟡 Supabase returned null data.');
    }

    return { results };
  } catch (err: any) {
    console.error('🔥 Unexpected error during Supabase upsert:', err);
    results.forEach((r) => {
      if (r.status === 'success') {
        r.status = 'error';
        r.message = err.message || 'Unknown error';
      }
    });
    return { results };
  }
}
