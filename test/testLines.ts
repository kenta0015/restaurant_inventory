//import { isLikelyItemLine } from '../utils/isLikelyItemLine';

const lines = [
  'Tomato 2.0 kg',
  'Chicken 1.5 kg',
  'Blue Plate Bistro',
  'Suite 200 Miami, FL 33139',
  'INVOICE # 1045',
  'Soy Sauce 1 L',
  'THANK YOU FOR YOUR BUSINESS',
  'Garlic',
];

(async () => {
  for (const line of lines) {
    const result = await isLikelyItemLine(line);
    console.log(`"${line}" → ${result ? '✅ Likely item' : '❌ Not item'}`);
  }
})();
