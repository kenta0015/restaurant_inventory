# 🍽️ Restaurant Inventory Bolt

A mobile‑first inventory & prep management app for small restaurants, food trucks, and prep‑heavy kitchens.  
Designed for **speed**, **simplicity**, and **HITL (human‑in‑the‑loop)** accuracy.

_Last updated: 2025-08-21_

---

## 🧠 Smart Invoice OCR (I‑1, Core)

**Goal:** Move from photo → OCR → extracted items → human review → inventory registration, with **speed** (≤10s/invoice), **accuracy**, and **low cost** (send ≤30% of lines to GPT).

**Pipeline**

```
Upload → /ocr (Vision) → rawText, blocks
  └─ Pre‑filters: joinVerticalLines / clean / isLikelyItemLine / groupBlocks
  └─ /ocr/gpt-parse: rules‑first → low‑confidence lines only GPT (batch + backoff)
Normalize → UI review (HITL) → saveParsedItems (upsert) → Registration summary
```

**Normalization & Policy**

- `inventory.name` is **stored & matched in lowercase** (display can keep original casing).
- `unit` normalized via dictionary (`kg/g/l/ml/pc/pcs...`).
- Missing required fields (e.g., name, unit) are **⚠️ skipped** and shown in the results list.

**Registration UI**

- Summary: ✅ success / ⚠️ skipped / ❌ error
- Per‑row detail with messages
- **Retry** button for ❌ rows only

**Learning (Step E)**

- `ocr_training_data`: `{ input_block, rule_result, gpt_result, user_final, feedback_label }`
- `invoice_runs`: per‑upload summary (success/skipped/failed)

---

## 🛎 Alert Threshold Editing (I‑3)

- Edit `alertLevel` inline on each inventory row; save to Supabase on blur.
- Low‑stock: recalc `isLow = stock < (alertLevel ?? defaultThreshold)` immediately.
- No schema change required (uses existing `inventory.alertLevel`).

---

## ⏱ Prep Sheet Estimated Time (I‑2)

- Recommended schema: `recipes.estimated_time_minutes int`  
  (aligns with `types.ts` → `estimatedTime: number`).
- UI: tap to inline‑edit, save, and recalc total prep time.

Migration:

```sql
alter table recipes add column if not exists estimated_time_minutes int;
```

---

## 📊 POS Analysis (I‑4)

- Screen: `app/(tabs)/analysis.tsx`
- CSV import: `components/POSUploadModal.tsx` + `utils/parsePOSCSV.ts`
- Analytics: `utils/posAnalysisUtils.ts`
  - Sales summary / weekday trend / prep suggestions / ingredient needs
- Optional timing: `utils/posTimingUtils.ts` (seated → order delay)

CSV (minimal):

```
Date,Item Name,Quantity Sold,Table ID,Order Time[,Seated Time]
2025-06-01,Tomato Pasta,12,T8,18:47
2025-06-01,Garlic Bread,7,T4,18:49
```

---

## 📱 iOS (I‑5)

- Prereq: I‑1 stable (camera → OCR → registration end‑to‑end).
- Build & ship with EAS → TestFlight.
- Ensure camera/photos permissions and env configuration.

---

## ⚠️ Known Issues / Notes

- `Alert.alert` may not render like native on Web; use toast/`console.warn` as fallback.
- After dependency changes, follow the cache‑clear steps above.
- OCR/GPT cost is controlled by `costGuard`; 429/5xx are retried with exponential backoff.

---

## 📄 Docs

- Roadmap: [plan.md](./plan.md)

---

## 🛠 Technologies

Expo (SDK 52), React Native 0.76, Expo Router 4.x, TypeScript 5, Lucide Icons, date‑fns

---

## 📄 License

Private project. Use at your own risk.

## ✅ Tech Stack (Stable)

| Package                     | Version | Notes                              |
| --------------------------- | ------- | ---------------------------------- |
| expo                        | 52.x    | SDK 52                             |
| react-native                | 0.76.x  | Matches SDK 52                     |
| react                       | 18.2.0  | **Use 18.2.0 (not 18.3.x)**        |
| react-dom                   | 18.2.0  | Web compatibility                  |
| expo-router                 | 4.x     | **Use 4.x (5.x requires SDK 53+)** |
| @react-native-picker/picker | 2.9.x   | Compatible                         |

Keep versions pinned to avoid Web/Native divergence.

---

## 🚀 Quick Start

### 1) API Server (OCR + GPT)

```bash
cd api-server
npm i
# Set envs (see below) and run:
npx tsx server.ts
```

Endpoints:

- `POST /ocr` → Google Vision OCR → returns `{ rawText, blocks }`
- `POST /ocr/gpt-parse` → Batch classify/parse (rules‑first, low‑confidence only GPT) → returns `{ items[], diag }`
- `GET /ocr/health`

### 2) App (Web dev mode)

```bash
npm i
npx expo start --web

# If cache issues (PowerShell):
Remove-Item -Recurse -Force node_modules
del package-lock.json
npm i
npx expo start --clear
```

### 3) iOS (when needed)

```bash
# Install once
npm i -g eas-cli
eas build --platform ios
# Distribute via TestFlight
```

---

## 🔐 Environment Variables

### api-server

```bash
# Google Vision credentials
GOOGLE_APPLICATION_CREDENTIALS=./vision-key.json
# or set GOOGLE_PROJECT_ID / GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY

# OpenAI (for GPT parsing)
OPENAI_API_KEY=sk-...

# Optional rate/cost guards
OCR_MAX_TOKENS_PER_INVOICE=8000
OCR_MAX_GPT_SEND_RATE=0.3
```

### app (Supabase)

Create `supabaseClient.ts` with:

```ts
export const SUPABASE_URL = "https://...";
export const SUPABASE_ANON_KEY = "...";
```

---

## 🗂 Project Structure (key paths)

```
restaurant_inventory/
├─ app/                     # Screens & routing
├─ components/              # UI (ParsedItemCard, RegistrationResultList, etc.)
├─ hooks/                   # useOCRProcessing, useIngredientCategories...
├─ utils/                   # saveParsedItems, saveTrainingData, OCR utils
├─ types/                   # TypeScript types (single source of truth)
├─ api-server/              # Express/TS: /ocr, /ocr/gpt-parse, costGuard
├─ docs/                    # Design notes (optional)
├─ supabaseClient.ts        # Supabase client init
├─ plan.md                  # Roadmap (see Docs)
└─ README.md                # This file
```

---
