

/*



export function joinVerticalLines(lines: string[]): string[] {
  const lowerLines = lines.map((line) => line.trim().toLowerCase());

  // 柔軟にカラムのインデックスを見つける
  const descIndex = lowerLines.findIndex((l) => l.includes('description'));
  const qtyUnitIndex = lowerLines.findIndex(
    (l) =>
      l.includes('qun unit') || l.includes('qty unit') || l.includes('quantity') || (l.includes('qun') && l.includes('unit'))
  );

  if (descIndex === -1 || qtyUnitIndex === -1) {
    console.log('⚠️ Header not found. descIndex:', descIndex, 'qtyUnitIndex:', qtyUnitIndex);
    return [];
  }

  // 品名は "DESCRIPTION" から "QUN UNIT" まで
  const descLines = lines.slice(descIndex + 1, qtyUnitIndex).map((l) => l.trim()).filter(Boolean);

  // 数量と単位以降の行すべて（price や余計な行も含むので注意）
  const qtyUnitLines = lines.slice(qtyUnitIndex + 1).map((l) => l.trim()).filter(Boolean);

  // 数値＋単位を抽出（kg, L など。$金額は除外）
  const qtys: string[] = [];
  const units: string[] = [];

  for (let i = 0; i < qtyUnitLines.length - 1; i++) {
    const qtyCandidate = qtyUnitLines[i].replace(',', '.'); // 1,5 → 1.5
    const unitCandidate = qtyUnitLines[i + 1];

    if (/^[\d.]+$/.test(qtyCandidate) && /^[a-zA-Z]+$/.test(unitCandidate) && !unitCandidate.startsWith('$')) {
      qtys.push(qtyCandidate);
      units.push(unitCandidate);
      i++; // skip unit
    }
  }

  // 名前と数値＋単位を結合
  const result: string[] = [];

  const count = Math.min(descLines.length, qtys.length);
  for (let i = 0; i < count; i++) {
    const name = descLines[i];
    const qty = qtys[i];
    const unit = units[i];
    result.push(`${name} ${qty} ${unit}`);
  }

  console.log('🧾 Final joined lines (ULTIMATE):', result);
  return result;
}

*/