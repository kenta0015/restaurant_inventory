import { cleanOCRLine } from './ocrCorrection';

/**
 * GPT またはローカルAPIにブロックを送って分類する関数
 */
export async function classifyOCRBlock(
  block: string
): Promise<'item_info' | 'address_info' | 'meta_info' | 'other'> {
  try {
    const response = await fetch('http://localhost:3001/ocr/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ block }),
    });

    if (!response.ok) {
      console.error(`❌ classifyOCRBlock error: ${response.status}`);
      return 'other';
    }

    const data = await response.json();
    const result = data.result?.trim();
    if (
      result === 'item_info' ||
      result === 'address_info' ||
      result === 'meta_info' ||
      result === 'other'
    ) {
      return result;
    } else {
      console.warn('⚠️ Unexpected classification:', result);
      return 'other';
    }
  } catch (error) {
    console.error('❌ classifyOCRBlock fetch failed:', error);
    return 'other';
  }
}

/**
 * 1行が item 情報らしいかを判定（ルール強化版）
 */
export function isLikelyItemLine(line: string): boolean {
  const cleaned = cleanOCRLine(line).toLowerCase();

  // 除外パターン（ノイズやメタ情報）
  if (
    /^(invoice|total|date|thank|subtotal|address|no\.|tax|cash|tel|phone)/i.test(cleaned) ||
    /^[\d\s\-\/:.]+$/.test(cleaned)
  ) {
    return false;
  }

  const hasNumber = /\b\d+([.,]\d+)?\b/.test(cleaned);
  const hasUnit = /\b(kg|g|l|ml|pcs?|bottle|袋|本|個|箱|pack|ケース|缶)\b/.test(cleaned);
  const hasWords =
    /[a-zA-Z]/.test(cleaned) || /[\u3040-\u30FF\u4E00-\u9FAF]/.test(cleaned);

  return hasWords && hasNumber && hasUnit;
}

/**
 * item_info と見なせそうな行をグルーピングする関数
 */
export function groupLikelyItemBlocks(lines: string[]): string[] {
  const grouped: string[] = [];
  let currentGroup: string[] = [];

  for (const line of lines) {
    if (isLikelyItemLine(line)) {
      currentGroup.push(line);
    } else {
      if (currentGroup.length > 0) {
        grouped.push(currentGroup.join(' '));
        currentGroup = [];
      }
    }
  }

  if (currentGroup.length > 0) {
    grouped.push(currentGroup.join(' '));
  }

  return grouped;
}
