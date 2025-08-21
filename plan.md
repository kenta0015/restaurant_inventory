# Project Plan — Inventory & Ops Suite

Last updated: 2025-08-21

---

## 0) Overview
A unified roadmap covering **I-1 Smart Invoice OCR (core)**, **I-3 Alert Threshold Editing**, **I-2 Prep Sheet Estimated Time Editing**, **I-4 POS Analysis Module**, and **I-5 iOS (Expo)**. The plan prioritizes stability, cost, and human-in-the-loop (HITL) accuracy while keeping existing functionality intact.

---

## 1) Top-Level Roadmap (Summary)

| ID | Title | Goal | Depends | Status | Target Outcome |
|---|---|---|---|---|---|
| I-1 | Smart Invoice OCR (Core) | OCR→AI抽出→修正→登録を**高速・高精度・低コスト**で実現 | – | In progress | ≤10s/枚, GPT送信≦30%行, 学習ログ蓄積 |
| I-3 | Alert Threshold Editing | 在庫 `alertLevel` をUIから編集・即保存 | – | Ready | 低在庫警告の運用性UP |
| I-2 | Prep Estimated Time Editing | レシピ所要時間をPrepシートから編集 | – | Ready | 合計Prep時間の精度UP |
| I-4 | POS Analysis Module | 売上CSV/API→サマリ/曜日傾向/Prep提案/食材必要量 | I-2(推奨) | Planned | 需要予測と仕込み自動提案 |
| I-5 | iOS (Expo) | 実機カメラ/OCR運用・配布 | I-1安定 (I-4前倒し可) | Planned | TestFlight配布・現場実運用 |

**Build order (recommended)**: I-1 → I-3 → I-2 → I-4 → I-5  
*(iOSはI-1完了時点で前倒し可／既存機能を壊さないことが最優先)*

---

## 2) I-1 Smart Invoice OCR — Core Plan

### 2.1 Objectives (incl. non-functional)
- **Accuracy**: name/qty/unit/price extraction with high recall/precision.
- **Speed**: ≤ **10s**/invoice under typical network.
- **Cost**: GPT送信行を**≦30%**に削減（ルール優先→低確信のみGPT）。
- **Safety**: API鍵はサーバ側。RLS/PII最小保存。
- **Operations**: 失敗・重複・学習ログを可視化。HITLで補正。

### 2.2 Architecture
```
[Client]
  RealOCRUploader
    ├─ POST /ocr              → { rawText, blocks }
    ├─ POST /ocr/gpt-parse    → { items[], diag }
    └─ GET  /ocr/health

[Server (api-server)]
  vision.ts               (Google Vision wrapper)
  parseOrchestrator.ts    (joinVerticalLines / isLikelyItemLine / groupBlocks / normalizeLine)
  gpt.ts                  (low-confidence only, batch, backoff)
  costGuard.ts            (token estimate, budget gate)
  logs.ts                 (training logs, run summary)

[DB (Supabase)]
  inventory               (nameはlowerで一意運用)
  invoice_runs            (請求書単位の集計)
  ocr_training_data       (input/rule/gpt/user/label)
  ocr_classification_logs (任意, デバッグ)
```

### 2.3 Functional Blocks & KPIs
**A. Pre-filtering**
- `joinVerticalLines`, `cleanOCRLine`, `isLikelyItemLine`, `groupLikelyItemBlocks`
- **KPI**: GPT送信率 ≦30%

**B. Orchestration (Server)**
- ルールベース確信度 `ruleConfidence ≥ T` は確定。
- 低確信のみ GPT へ。batch化、429/5xxバックオフ。
- **KPI**: 平均token/請求書 ≤ 8k

**C. Normalization**
- name lower化・空白/記号圧縮（保存はlower、表示は元名）
- unit辞書（kg/g/l/ml/pc/pcs…）・price数値化

**D. UI / HITL**
- `ParsedItemCard`: name/qty/unit/price/note/category 編集。
- 登録結果UI: ✅/⚠️/❌ + サマリ、❌のみ再試行。
- 重複検知: 同名(lower) upsert/加算モード提示。
- 欠損支援: unit/price欠如→⚠️でスキップ表示。

**E. Persistence & Learning**
- `saveParsedItems`: upsert（name lower運用）。
- `invoice_runs`: 件数サマリ。
- `ocr_training_data`: `input_block, rule_result, gpt_result, user_final, feedback_label`。

### 2.4 API Spec
- **POST `/ocr`** → `{ rawText: string, blocks: string[] }` (from imageBase64)
- **POST `/ocr/gpt-parse`**  
  In: `{ blocks: string[], ruleHints?: {...} }`  
  Out: `{ items: Array<{ name, quantity, unit, price?, note? }>, diag: { usedTokens, ruleOnlyCount, gptCount } }`
- **GET `/ocr/health`** → `{ ok, version, limits }`

### 2.5 DB Migrations (Minimal)
```sql
-- invoice_runs: 1アップロード=1レコード
create table if not exists invoice_runs (
  id uuid primary key default gen_random_uuid(),
  file_name text,
  file_hash text,
  uploaded_at timestamptz default now(),
  total_items int,
  success int,
  skipped int,
  failed int
);

-- ocr_training_data: 学習用詳細
create table if not exists ocr_training_data (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references invoice_runs(id),
  input_block text,
  rule_result jsonb,
  gpt_result jsonb,
  user_final jsonb,
  feedback_label text,
  feedback_comment text,
  created_at timestamptz default now()
);
```

### 2.6 Acceptance Criteria (DoD)
- 画像→表示修正→登録→サマリ表示まで安定（E2E）。
- 抽出: 再現率≥95% / 適合率≥90%（社内サンプル≥10枚）。
- 速度: 平均≤10s/枚。コスト: 平均token≤8k/枚。
- ❌再試行が動作し、ログ（`invoice_runs`/`ocr_training_data`）保存。

### 2.7 Test Matrix (must)
- 縦3列/単一行/混在、日本語+英語、住所/小計/税/合計ノイズ、
  単位ゆれ（kg/KG/㎏, l/ℓ, pc/pcs）、数量小数・分数、価格記号、
  大文字小文字差、ネットワーク障害、429/5xx。

### 2.8 Implementation Steps
1) Server: `/ocr`, `/ocr/gpt-parse`, `costGuard`, バッチ&バックオフ  
2) Rules: join/likely/group/normalize 強化  
3) 低確信のみGPT送信 + token上限制御  
4) UI: HITL/結果UI/重複検知/再試行  
5) DB: `invoice_runs` + `ocr_training_data`  
6) メトリクス: 速度/コスト/精度ダッシュボード（簡易でOK）

### 2.9 Risks & Mitigations
- OCR品質低下 → 前処理強化・略称辞書・リトライ
- コスト逸脱 → 送信率制限・tokenガード・プロンプト短縮
- 同名異品 → カテゴリ/ノート補足 + HITL確定
- 多言語/単位揺れ → 正規化辞書の拡充

---

## 3) I-3 Alert Threshold Editing (Inventory)

### Scope
- 在庫行の `alertLevel` をインライン編集→即Supabase保存。

### UI
- `InventoryItem` の行に数値入力（onBlur保存、無効入力は無視）。

### Logic
```
const numeric = parseFloat(tempAlertLevel);
if (!isNaN(numeric)) supabase.from('inventory').update({ alertLevel: numeric }).eq('id', item.id);
const isLow = item.stock < (item.alertLevel ?? defaultThreshold);
```
- 変更即時に低在庫ハイライトを再計算。

### Acceptance
- 入力→保存→再描画で反映、無効値は保存されない。

---

## 4) I-2 Prep Sheet Estimated Time Editing

### Storage Option (choose **A**)
- **A. minutes(int)**: `recipes.estimated_time_minutes int`（集計が容易） ←推奨  
- B. text: `"30min"` 等（柔軟だが計算コスト）

### Migration (A)
```sql
alter table recipes add column if not exists estimated_time_minutes int;
```

### UI
- Prepシートで該当レシピの所要時間をタップ→インライン入力→onBlur保存。

### Acceptance
- 保存後、Prep合計時間が更新。0/空/大値/多件同時でも破綻しない。

---

## 5) I-4 POS Analysis Module

### Phases
1. **Screen**: `app/(tabs)/analysis.tsx`（土台）  
2. **CSV Upload**: `components/POSUploadModal.tsx` + `parsePOSCSV.ts`  
3. **Analytics**: `posAnalysisUtils.ts`（サマリ/曜日傾向/Prep提案/食材必要量）  
4. **Timing**(任意): `posTimingUtils.ts`（着席→注文遅延）

### Minimal CSV
```
Date,Item Name,Quantity Sold,Table ID,Order Time[,Seated Time]
2025-06-01,Tomato Pasta,12,T8,18:47
2025-06-01,Garlic Bread,7,T4,18:49
```

### Acceptance
- CSV投下→サマリ/曜日傾向/Prep提案/必要食材が表示。
- 低回転メニュー閾値でアラート抽出。

### (Optional) Schema
```sql
create table if not exists pos_sales (
  id uuid primary key default gen_random_uuid(),
  date date,
  item_name text,
  quantity int,
  table_id text,
  order_time text,
  seated_time text
);
```

---

## 6) I-5 iOS (Expo)

### Preconditions
- I-1 安定（カメラ→OCR→登録がE2Eで安定）。  
- （任意）I-4がWebで検証済み。

### Steps
- EAS設定 → `eas build --platform ios` → TestFlight配布。  
- Info.plist権限（カメラ/写真）・環境変数確認。

### Acceptance
- 実機で撮影→OCR→登録まで通る。重大クラッシュ無し。

---

## 7) Common Policies & Conventions

- **No breaking changes** to existing features.  
- **Name normalization**: inventory保存・照合はlowercase。表示は元ケース可。  
- **Secrets**: サーバ側のみで保持。  
- **Versions**: Expo SDK 52 / expo-router 4.x / React 18.2 を維持。  
- **Test**: 失敗時のUIとログを必ず確認（HITL重視）。

---

## 8) Immediate Task Queue (next)

- [ ] I-1: `/ocr/gpt-parse` 低確信のみ送信 + `costGuard`  
- [ ] I-1: `invoice_runs` と `ocr_training_data` の実装 & 書き込み  
- [ ] I-3: `InventoryItem` に `alertLevel` 編集UI/保存  
- [ ] I-2: `recipes.estimated_time_minutes` 追加 & 編集UI  
- [ ] I-4: analysisタブ雛形 + CSVアップロード + サマリ
