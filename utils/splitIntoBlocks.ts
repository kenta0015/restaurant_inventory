// utils/splitIntoBlocks.ts

export function splitIntoBlocks(lines: string[]): string[] {
  const rawBlocks: string[] = [];
  let buffer: string[] = [];

  for (const line of lines) {
    const cleaned = line.trim();
    if (!cleaned) continue;
    buffer.push(cleaned);

    if (buffer.length >= 2 && /\$|\d/.test(cleaned)) {
      rawBlocks.push(buffer.join(' '));
      buffer = [];
    }
  }
  if (buffer.length > 0) {
    rawBlocks.push(buffer.join(' '));
  }

  // 2段階目のマージ（数値行との連結）
  const mergedBlocks: string[] = [];
  for (let i = 0; i < rawBlocks.length; i++) {
    const current = rawBlocks[i];
    const next = rawBlocks[i + 1];
    if (next && /\d|\$/.test(next) && !/\d|\$/.test(current)) {
      mergedBlocks.push(current + ' ' + next);
      i++; // skip next
    } else {
      mergedBlocks.push(current);
    }
  }

  return mergedBlocks;
}
