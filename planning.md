## some necessary modifications

-improvement 1 : Smart Invoice OCR Integration

-improvement2:in Prep sheet estimated time will be able to edited by input 

-improvement3:add the function that allows users to modify alert level

-improvement 4:POS Analysis Module

-⭐ improvement 5 Convert from Web to iOS(⭐ maybe this can be done before "improve 4" )


## the detalied steps for the improvement 1 to improvement 5


# ✅ Smart Invoice OCR Integration – 開発プラン（Web優先）

## 🎯 目的

- 請求書画像（JPEG/PNG）をアップロード  
- Google Vision OCR で文字を抽出  
- GPT-4o により「商品情報かどうか」を分類  
- 商品名・数量・単位を正規化して抽出  
- 必要に応じて修正・カテゴリ選択し、在庫に登録

---

## 📌 フェーズ別開発計画

## 📄 Smart OCR Invoice Extractor – AI分類と事前フィルタ戦略の統合設計
【1】AIベースの分類方針選択：processBlocks() ✅
本プロジェクトでは、以下の2種類の方法のうち、**GPTを用いたAI分類（柔軟対応）**を正式に採用した：

メソッド名	内容	採用状況
processLines()	各行をルールベースで解析・構文分解	❌ 採用せず（精度が限定的）
processBlocks()	複数行のブロックをAI分類（GPT）し意味を抽出	✅ 採用決定（柔軟で汎用性が高い）

この選択により、構成は以下のように確定：

scss
コピーする
編集する
joinVerticalLines() → processBlocks() → classifyOCRBlock() → normalizeLine()
【2】AI導入前に行った「手動フィルタ強化」 ✅
AI導入前の精度向上のため、以下のようにルールベースの前処理を強化した：

🔧 実装済の手動前処理（フィルタ強化）
関数	内容
joinVerticalLines()	縦3列構成（品名 / 数量 / 単位）を横1行に統合し、構造的なitem行に変換（例：Garlic 2 kg）
cleanOCRLine()	スペース除去・全角変換・ノイズ文字のクリーニング処理
normalizeLine()	Garlic 2 kg → {name: "Garlic", qty: 2, unit: "kg"} に構文解析
isLikelyItemLine()	数字・単位・品名を含む行だけを「アイテム候補」と判定
groupLikelyItemBlocks()	連続したitem行を「意味ブロック」に変換し、AI分類時の入力単位として活用

これらのルールにより、GPTが処理する前の 行数・ノイズの削減、構造化の自動化 に成功。
たとえば、以下のようなOCR出力から：

nginx
コピーする
編集する
Garlic
2
kg
↓ 自動的に：

nginx
コピーする
編集する
Garlic 2 kg
という1行構造に変換され、AI分類が容易になっている。

🧠 Phase 2: OCRテキストのAI分類と抽出処理（強化版）
以下は、事前処理の結果を活かしたAI分類の設計。
GPT分類ロジックは classifyOCRBlock() をブロック単位で使用。

ステップ	内容	補足・強化点
2.1	joinVerticalLines() により構造化されたアイテム行のセット（例：Garlic 2 kg）を生成	✅ 事前フィルタ済で構造安定
2.2	isLikelyItemLine() により明らかにノイズな行（住所・日付など）を除外	✅ GPTリクエスト数削減
2.3	各行を classifyOCRBlock() に渡し、GPT-4o で意味分類（例：item_info, vendor_info, other）	✅ 精度とコストの最適化両立
2.4	item_info のみを抽出して normalizeLine() に渡し、数量・単位などを構造化	✅ 精度高い正規化

🎯 例：
text
コピーする
編集する
OCR Raw Lines:
Garlic
2
kg

➡ joinVerticalLines() → "Garlic 2 kg"
➡ classifyOCRBlock() → type: "item_info"
➡ normalizeLine() → { name: "Garlic", qty: 2, unit: "kg" }
🖼️ Phase 3: UI 表示と登録処理
ステップ	内容
3.1	テーブル形式で抽出結果を表示（商品名・数量・単位・カテゴリ）
3.2	修正可能な入力欄とカテゴリ選択UIを提供
3.3	[登録]ボタンで Supabase inventory テーブルに追加

🧪 Phase 4: 精度テストと強化
テスト項目	内容
インボイス形式差異	複数の画像パターンで検証
ノイズ分類精度	THANK YOU 等の不要行を正しく other と判定できるか
GPTプロンプト調整	出力の安定性が悪い場合にプロンプト再設計
ローカルモデル検討	GPT使用量が多い場合、DistilBERT等への切り替えを検討

## ✅ Phase 5: AI構文抽出への移行プラン（柔軟列対応 + 将来拡張前提）

🎯 目的
GPT-4o を用いて、固定3列ではなく柔軟に構成されたインボイス項目（例：品目・数量・単位・金額・備考など）をJSON構造で抽出し、画面に表示・修正・登録できるようにする。










---

## step 7

✅ ユーザー方針の要点整理
🎯【最終目標（完成形）】
品目・数量・単位・価格・備考に 限定せず、将来的に「その他の項目」や「構造の変化」にも柔軟に対応したい

ユーザーが疑問点に答える「対話的UI」への発展も視野

最終的に「OCR画像 → 表形式の確認・編集 → Supabase登録」までが一連の自然な流れ

🧠【GPT依存ポリシー】
ルールベースが基本（約70〜80%）

GPTは保管的に使用（例：構造が崩れた、未分類、ルールで対応不可な行）

最終的には 安定性と拡張性のバランスをとる実験的フェーズも許容

📦【登録ルール】
unit/price/note は空欄でもOK（柔軟性重視）

ただし Supabase 登録時は「pending 状態」などで 後から修正可能な記録として保持



## 上記のアップデート版??


✅ 現在までに完了したステップ（Phase 2.1 + 2.2）
フェーズ	ステップID	内容
2.1: 入力補完UI強化	✅ UI-入力項目追加	ParsedItemCard.tsx に unit, price, note, extraFields を追加済み
2.2: Supabase登録処理改善	✅ API-登録関数作成	saveParsedItems.ts 作成 → Supabase inventory に upsert 対応済み
　　　　　　　　〃　　	✅ API-統合反映	RealOCRUploader.tsx から saveParsedItems() 使用で登録処理を統一＋エラー処理導入

🔜 次に進むべきステップ（Phase 2.3 → 3 → 4）
🟨 Phase 2.3: OCR分類ロジック再編（GPT精度・効率改善）✅ 完了!!
ステップID	優先度	内容
🟡 分類-前処理導入	★必須	isLikelyItemLine() による GPT送信前フィルター（導入済み、精度確認へ）
⏳ 分類-送信最適化	中	ruleConfidenceScore が低い行だけ GPT送信（トークン節約・高速化）
⏳ 分類-学習ログ構造	低	input_block, rule_result, gpt_result, user_final を Supabase に保存（学習用ログ）

⏳ 以下は “後回しでもOK” な強化案
1. ParsedItemCard で correctedName を手動修正
→ 中〜長期的には必要。ただし今は「正しい候補があれば自動補正」なので急務ではない。
（現状は編集不可だが、再確認時にユーザーが気づけば十分）

2. parsed_result_json を Supabase に保存し AI 学習へ
→ データがまだ少ないので、少し溜まってから一括投入で良い。現段階で実装しなくても困らない。

3. “誤爆しやすい” デモOCRパターン増やす
→ 重要ではあるが、「最初の学習ログ作成」と「現在の分類ロジックテスト」が優先。
OCR画像は必要になったときに随時追加でよい。



🟦 Phase 3: 登録後のUI改善フェーズ（登録結果表示・ユーザー体験改善）
ステップID	優先度	内容
🟡 登録-結果表示UI	★次に実装	登録成功 ✅ / スキップ ⚠ / エラー ❌ を視覚的に表示
⏳ 登録-一覧と編集	中	登録済みアイテムをその場で「編集 or 削除」できる画面構築（後工程）

(未実装)retryFailedItems 実行時にも成功／失敗数のサマリ表示追加（任意）
（未実装）登録後の ParsedItemCard 表示を非表示にするか選べるようにする（任意）




🟪 Phase 4: 柔軟項目対応フェーズ（構造保存と補完UI）
ステップID	優先度	内容
⏳ 項目-柔軟保存	中	extraFields を { key, value }[] 構造にして Supabase に保存可能に
⏳ 補完-空欄確認	低	unit, price などが空欄のとき「スキップしますか？」など確認表示（補助UI）







✅ 推奨の流れ
今後の流れとしては、次の順で進めるのが効果的です：

A（ブロック統合）でGPTの精度を改善

B（手動補完UI）で残りの情報を人間が補完できるように

C（登録ロジックの強化）でDBの整合性を保つ


次に対応すべきこと（残タスク）
タスク	ステータス	備考
Step A〜D（柔軟OCR抽出・UI統合）	✅ 完了	現在ここまで終了
Step C: /gpt-parse 一括抽出の検証	✅ 完了（今回）	問題なし
Step E: 正解データを Supabase に保存	⏳ 未実装	GPT結果とユーザー修正を記録して将来の学習へ
Step F: 重複登録防止とマージ機能	🔜 保留	既存アイテムと自動マッチ・統合機能
Step G: price/unit 補完 or 手動必須アラート	🔜 保留	price なしの場合の警告や補完支援
Step H	📦 インボイス履歴保存	OCRごとの履歴保存（ファイル名やアップロード日時付き）	中期的
Step I	🧠 GPT再学習支援	ocr_training_data を用途別分類＋CSV/JSONエクスポート	発展系（履歴ベース）




---

## 🔧 現在の構成と追加方針

### ✅ フロントエンド（既存）

- `components/RealOCRUploader.tsx`
- `utils/ocrCorrection.ts`
- `utils/ocrClassifier.ts`（GPT分類）

### ✅ バックエンド API（新規）

| 方法 | 説明 |
|------|------|
| ✅ Node.js + Express | `api-server/ocr.ts` を自作、Vision API と連携 |
| ✅ Vercel Serverless Function | `/api/ocr.ts` 形式でクラウドにデプロイ可能 |
| ✅ Google Cloud Function | GCP にまとめたい場合に使用可能 |

> ※現在は Express ローカル構成（A案）を採用予定

---

## 🆚 A案 vs B案 比較

| 観点 | A案: Node.js + Express API（ローカル） | B案: Vercel Serverless Function |
|------|----------------------------------------|-------------------------------|
| 🔧 セットアップ | ✅ すぐに開始できる（ローカルで動作） | ❌ 初回セットアップ必要 |
| 🔐 `vision-key.json` の扱い | ✅ ファイルで安全に扱える | ⚠️ 環境変数化やデプロイ時の対策必要 |
| 📦 npmパッケージ使用 | ✅ 制約なし | ⚠️ パッケージ制限・size制限あり |
| 🌐 デプロイ性 | ❌ ローカル限定 | ✅ 公開APIとして利用可能 |
| 🧪 テスト用途 | ✅ 開発向き | ⚠️ 外部連携が必要な場合限定的 |
| 🔮 将来性 | 本番前の検証・iOS開発に好適 | 本番用に切替可能（ロジック流用可） |

---

## ✅ 結論：まずは A案（Express ローカルAPI）から開始

- 現在のフェーズでは、ローカルで確実にOCR機能を検証することが重要
- `vision-key.json` を直接ファイルで扱えるため、セキュリティ上も安心
- 後に必要であれば B案へ切り替えればよく、ロジックも再利用可能


✅ 現状と照合：互換性チェックリスト
パッケージ名	現在	互換性ステータス	コメント
expo	52.x	✅ OK	最新の安定版
react-native	0.76.x	✅ OK	Expo SDK 52 に対応
react	18.2.0	✅ OK	18.3.x はNG なのでこのままでOK
expo-router	4.x	✅ OK	SDK 52には 4.x が対応（5.xはNG）
@react-native-picker/picker	2.9.x	✅ OK	問題なし
react-dom	18.2.0	✅ OK	Web互換もOK

⚠️ あなたに必要な対応は特になし
ただし、以下のような更新や作業をした際は、トラブル防止のため下記コマンドを使うのがベストです：

bash
コピーする
編集する
# パッケージの整合性リセット（Windows PowerShellの場合）
Remove-Item -Recurse -Force node_modules
del package-lock.json
npm install
npx expo start --clear
✅ まとめ
現状の構成は 完全に互換性あり

React 18.2.0 を維持

expo-router 4.x を維持

不要なアップグレードは避けることが安定動作のカギ

### Improvement 2: Editable Estimated Time


🛠️ Implementation Plan – 
🧩 Goal
Allow users to tap the prep time field on the Prep Sheet and input a custom value for estimated time per recipe. Save it to the recipes table.

✅ Step 1: Update Supabase Schema
Add a new column to the recipes table:

sql
コピーする
編集する
alter table recipes
add column estimated_time text;
Store as text (e.g., "30 min", "45min", or "00:30") for flexibility.
If you prefer a number (e.g., minutes), use integer.

✅ Step 2: Display Estimated Time in Prep Sheet
In RecipePrepTaskItem.tsx or PrepSheetSummary.tsx:

tsx
コピーする
編集する
<Text onPress={() => setEditMode(true)}>
  Estimated Time: {recipe.estimated_time ?? '—'}
</Text>
✅ Step 3: Input Modal or Inline Edit
You can use a simple input or modal:

tsx
コピーする
編集する
{editMode && (
  <TextInput
    value={tempValue}
    onChangeText={setTempValue}
    onBlur={handleSubmit}
    keyboardType="default"
/>
)}
✅ Step 4: Save to Supabase
ts
コピーする
編集する
await supabase
  .from('recipes')
  .update({ estimated_time: tempValue })
  .eq('id', recipe.id);
✅ Step 5: Sync Updated Time
Fetch updated estimated_time when rendering the Prep Sheet

Optional: add setRecipe() or trigger a refresh when user submits new value

✅ Final Outcome
Feature	Behavior
📱 Tappable field	Users tap estimated time directly in Prep Sheet
✏️ Editable input	Enter any human-readable value (e.g., "35 min")
💾 Persistent	Saves to recipes.estimated_time in Supabase
🔁 Shared across week	All prep suggestions of the same recipe share this time
🧠 Controlled by human insight	No algorithm, no automation – just flexibility




###improvement 3 Customizable Alert Level

🧩 Goal
Allow users to manually edit the alert threshold (e.g., "2kg") for each ingredient directly in the Inventory screen.
This threshold will control when a low-stock warning appears.

✅ Current Setup Summary
Factor	Value
Column exists?	✅ Yes (alertLevel in inventory table)
UI editable?	❌ Not yet
Save to Supabase?	🔜 Planned (on user input)
Scope?	✅ Per ingredient
Format?	Numeric (float or integer) depending on unit

✅ Step-by-Step Implementation Plan
✅ Step 1: Ensure alertLevel Exists in Supabase
Confirmed ✅
No changes needed here.

✅ Step 2: Show Alert Level Field in InventoryItem.tsx
Locate the InventoryItem component (likely used in a FlatList).

Add a section like this:

tsx
コピーする
編集する
<View className="flex-row items-center mt-2">
  <Text className="text-sm mr-2">Alert Below:</Text>
  <TextInput
    className="border px-2 py-1 w-16 rounded"
    value={String(alertLevel ?? '')}
    keyboardType="numeric"
    onChangeText={(val) => setTempAlertLevel(val)}
    onBlur={handleSaveAlertLevel}
  />
</View>
✅ Step 3: Save Updated Alert Level to Supabase
In the handleSaveAlertLevel function:

ts
コピーする
編集する
const handleSaveAlertLevel = async () => {
  const numericValue = parseFloat(tempAlertLevel);
  if (isNaN(numericValue)) return;

  await supabase
    .from('inventory')
    .update({ alertLevel: numericValue })
    .eq('id', item.id); // or item.uuid
};
✅ Step 4: Integrate with Low Stock Warning Logic
Update your stock check logic:

ts
コピーする
編集する
const isLow = item.stock < (item.alertLevel ?? defaultThreshold);
You can show a red banner or warning icon if isLow is true.

✅ Step 5: Optional – Add Placeholder or Default
If a user hasn’t set an alertLevel yet:

tsx
コピーする
編集する
<TextInput
  placeholder="e.g. 2"
  value={String(alertLevel ?? '')}
/>
Or fallback in logic:

ts
コピーする
編集する
const threshold = item.alertLevel ?? 1;
🧾 Final Outcome
Feature	Behavior
✏️ Editable alert level	Users can input a custom alert threshold for each ingredient
💾 Saved to Supabase	Stored in inventory.alertLevel
🧠 Human decision-making	Chef/staff decides based on storage patterns or usage
⚠️ Used in warning logic	Triggers low stock alerts when stock < alertLevel
📱 Shown inline	Appears directly in InventoryItem.tsx list entry





 ### improvement 4:POS Analysis Module – Implementation Plan

🧩 Goal
Create an Analysis tab that imports per-item sales (CSV or API), shows trends, prep forecasts, ingredient usage, and optionally staff timing insights.

🚧 Phase 1: Screen Setup
1. app/(tabs)/analysis.tsx

tsx
コピーする
編集する
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function AnalysisScreen() {
  return (
    <ScrollView className="p-4">
      <Text className="text-xl font-bold mb-4">📊 Sales Analysis</Text>
      {/* Upload + Insights components go here */}
    </ScrollView>
  );
}
📂 Phase 2: CSV Upload + Parsing
2. POS CSV Format

csv
コピーする
編集する
Date,Item Name,Quantity Sold,Table ID,Order Time
2025-06-01,Tomato Pasta,12,T8,18:47
2025-06-01,Garlic Bread,7,T4,18:49
➡️ Optional: Add Seated Time if available from SevenRooms

3. CSV Upload Modal
components/POSUploadModal.tsx

Use react-native-document-picker or Web <input>

Parse with PapaParse

Store in Supabase or local state

📊 Phase 3: Analytics Logic
4. Sales Summary

ts
コピーする
編集する
const getSalesSummary = (salesData) => {
  const summary = {};
  for (const { itemName, quantity } of salesData) {
    summary[itemName] = (summary[itemName] || 0) + quantity;
  }
  return summary;
};
5. Prep Planner

ts
コピーする
編集する
const suggestPrep = (salesData) => {
  const grouped = groupByItem(salesData);
  const prep = {};
  for (const item of Object.keys(grouped)) {
    const last7Days = getLastNDays(grouped[item], 7);
    prep[item] = Math.round(average(last7Days));
  }
  return prep;
};
6. AI Forecast (Weekly Trends)

ts
コピーする
編集する
const getWeekdayForecast = (salesData) => {
  const trends = {};
  for (const { date, itemName, quantity } of salesData) {
    const weekday = new Date(date).getDay(); // 0=Sun
    trends[itemName] ??= Array(7).fill(0);
    trends[itemName][weekday] += quantity;
  }
  return trends;
};
7. Ingredient Breakdown

Multiply forecasted prep quantity × recipe ingredients

8. Low-Mover Alert

Flag dishes with avg sales < 5 per day

9. ⏱️ Table-to-Order Timing (New)

ts
コピーする
編集する
const getAvgOrderDelay = (data) => {
  const delays = {};
  for (const entry of data) {
    if (!entry.seatedTime || !entry.orderTime) continue;
    const seated = new Date(`2025-06-01T${entry.seatedTime}`);
    const order = new Date(`2025-06-01T${entry.orderTime}`);
    const delay = (order - seated) / 60000; // minutes

    delays[entry.tableId] ??= [];
    delays[entry.tableId].push(delay);
  }
  return delays;
};
🧪 Phase 4: UI Layout
Section	Description
🗂 POS File Upload	Upload & preview parsed sales/timing CSV
📊 Sales Summary	Totals and averages per item
🧠 AI Forecast	Weekly sales trends by dish
🥘 Suggested Prep	Forecasted prep volumes
🧾 Ingredient Needs	Ingredient quantities needed for next day
⚠️ Low Movers	Dishes with low recent demand
⏱️ Order Timing Analysis	Avg time between seating and ordering per table

🔧 Final Deliverables
Feature	File
Analysis tab	app/(tabs)/analysis.tsx
Upload modal	components/POSUploadModal.tsx
CSV parser	utils/parsePOSCSV.ts
Analytics logic	utils/posAnalysisUtils.ts
Timing analysis logic	utils/posTimingUtils.ts
UI components	components/analysis/



## improve 5 📅 When Should You Convert from Web to iOS?
Here’s a smart transition rule:

Convert to iOS only when…
✅ All core inventory & prep logic is stable
✅ Photo-taking + OCR is working and needed in kitchen
✅ POS Analysis module is reading real restaurant data
✅ You need camera, file system, or touch input not testable on web

🧠 Recommendation:
Build and test logic-heavy features (like OCR parsing, ingredient mapping, POS analytics) on web.
Then switch to iOS after Improvement 4 — when web testing has reached its limit.




### ✅ Leveraging POS Data for Inventory + Operations
Since you're interested in:

✅ Per-Item Sales Data

✅ Table vs. Order Timing (for staff performance)

🎯 Here’s what you can track and how to use it:
Function	What It Tracks	How It Helps
📊 Sales Summary	How many of each dish sold per day/week	Helps estimate popular dishes, manage ingredient usage
🧠 AI Forecast	Weekday trends per dish (e.g., pasta sells more Fridays)	Improves batch planning and reduces waste
🥘 Suggested Prep Plan	Uses past sales data to auto-suggest tomorrow’s prep	Reduces guesswork in kitchen operations
🧾 Ingredient Breakdown	Calculates how much of each ingredient is needed based on forecasted sales	Connects POS to inventory depletion planning
⚠️ Low-Mover Alert	Detects consistently slow-selling dishes	Informs what to remove or prepare less of
⏱️ Order Timing Analysis (New)	Time between table seated → order placed	Tracks kitchen & service delay, flags performance issues
👨‍🍳 Staff Efficiency Metrics (New)	Avg time to order per server/table, per shift	Identifies where team performance lags or shines

🧠 Order Timing Metrics rely on having both reservation/seating timestamps (SevenRooms) and POS order time.



🧪 Best Tools to Test iOS More Effectively
Here are non-obvious tools & methods beyond "just updating Expo":

✅ 1. EAS Build + Apple TestFlight (Highly Recommended)
Use EAS Build to build a real .ipa file.

Upload to TestFlight (Apple’s beta testing app)

Test on iPhone like a real app — no Expo Go involved

Much faster and more stable than dev mode

bash
コピーする
編集する
eas build --platform ios
You’ll need:

Apple Developer account ($99/year)

EAS CLI setup

✅ 2. Expo Preview via QR Code + Web Debugger
If you must test via Expo Go:

Use Expo Preview mode, not Development

Turn off JS debugging and animations for speed

✅ 3. Use Simulator + Browser for Hybrid Testing
Logic/UI → test on Web (--web)

Camera/OCR → test on iOS simulator with mock files or virtual camera

You can simulate image uploads or camera responses without needing a real phone until the final stage.

📝 Summary
Task	Recommendation
iPhone camera support	✅ Already included in Improvement 1
When to convert to iOS	After Improvement 4 (POS Analysis)
iOS testing speed	Use EAS Build + TestFlight, or test logic on web first
Additional tools	Use Flipper or React DevTools to track slowness in rendering

