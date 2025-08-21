# 🍽️ Restaurant Inventory Bolt

A mobile-first inventory management app designed for small restaurants, food trucks, and prep-heavy kitchens. Built for speed, simplicity, and **smart, suggestion-based planning**, this app helps staff track ingredients, manage recipes, log prep activities, and keep inventory in sync — with minimal manual input.

Built with **React Native + Expo Router**, styled for clarity, and designed for easy tracking of stock levels without worrying about expiry dates.

> Last updated: 2025-08-21

---

## ✅ Stable Version Setup (as of June 2025)

| Package                     | Version    | Notes                              |
|----------------------------|------------|------------------------------------|
| expo                       | 52.0.46    | SDK 52 (current) ✅                 |
| react-native               | 0.76.9     | Matches SDK 52 ✅                   |
| react                      | 18.2.0     | ✅ Recommended (not 18.3.1)         |
| react-dom                  | 18.2.0     | ✅ For web compatibility            |
| expo-router                | 4.0.21     | ✅ Works with SDK 52                |
| @react-native-picker/picker| 2.9.0      | ✅ Compatible                       |

**OCR/Server command**

```bash
# in a separate terminal
cd api-server
npx tsx server.ts
```

### ⚠️ Important Notes

- `react@18.3.x` is **not** fully compatible yet — use **18.2.0**.
- `expo-router@5.x` requires **Expo SDK 53+**. Keep **4.x** for SDK 52.
- After dependency changes, do a clean reinstall:

```powershell
# Windows PowerShell
Remove-Item -Recurse -Force node_modules
del package-lock.json
npm install
npx expo start --clear
```

---

## 📦 Project Structure

```
restaurant_inventory_bolt/
├── app/                       # Screens and routing
├── assets/                    # App icons and images
├── components/                # Reusable UI components (InventoryItem, PrepTaskItem, ParsedItemCard, RegistrationResultList, etc.)
├── data/                      # (Optional) Dummy data for inventory, recipes, tasks
├── hooks/                     # Custom React hooks
├── types/                     # TypeScript types (e.g., OCRItem, ParsedItem, InventoryItem)
├── utils/                     # Utility functions (saveParsedItems, saveTrainingData, OCR helpers)
├── api-server/                # Local API server (Google Vision + GPT parsing)
├── docs/                      # Additional docs (inventory logic, etc.)
├── .bolt/                     # Bolt build system configs
├── package.json               # Project settings and dependencies
├── tsconfig.json              # TypeScript settings
└── README.md                  # Project overview (you are here)
```

---

## 🗌 Key Features

### 📟 Track Ingredients
- View, add, and update stock in real time

### 🍱 Prep-Based Inventory Logic
- Materials are deducted automatically based on prep quantity

### 📊 Prep-Sheet Mode
- Suggest daily prep quantity based on past trends (weekday/weekend-based average)

### ⚠️ Smart Alerts
- Combined low-stock and physical-check warnings

### 🧠 Suggestion-Based System
- Offers prep quantity estimates, but leaves control in staff hands

### ✍️ Manual Adjustments
- Override prep suggestions as needed

### 📌 Prep Sheet Interface
- Shows required amounts per ingredient per day, allows toggling "completed" state and quantity edits, then updates inventory with one tap

### 📲 Fast & Simple Input
- Dropdowns, quick-add chips, and smart defaults

**Designed for Real Kitchens**
- ✅ Large buttons and color-coded warnings  
- ✅ Minimal, mobile-first UI with tab navigation  
- ✅ Fast interactions, minimal typing  
- ✅ Templates for common recipes and prep sets

---

## 🧾 Invoice OCR — Current Architecture (I-1 Core)

**What it does**  
Upload invoice images (JPEG/PNG), run OCR via **Google Vision** (server-side), pre-filter and normalize lines, and use **GPT (low-confidence lines only)** to classify/structure item rows. Review & edit in UI, then **upsert** into `inventory` with result summary (✅/⚠️/❌).

**Client flow**
```
Image → /ocr → { rawText, blocks }
      → /ocr/gpt-parse (batch; low-confidence only)
      → UI edit (ParsedItemCard) → saveParsedItems() → Supabase upsert
      → Registration result UI (summary + list + retry)
```

**Server**
- `vision.ts` (Google Vision wrapper)
- `parseOrchestrator.ts` (joinVerticalLines / isLikelyItemLine / groupBlocks / normalizeLine)
- `gpt.ts` (batch, retry/backoff, token budget)
- `costGuard.ts` (token estimate & guard)

**DB (Supabase)**
- `inventory` (name lowercased for consistent matching/upsert)
- `invoice_runs` (1 upload = 1 record; counts)
- `ocr_training_data` (input_block/rule_result/gpt_result/user_final/label)

> NOTE: Previous mention of **Tesseract.js** and **Fuse.js** has been superseded by **Google Vision + GPT** and lowercase matching. If you still use Tesseract for local/offline tests, keep it behind a flag.

**How to run OCR server**
```bash
cd api-server
npx tsx server.ts
# Endpoints:
# POST /ocr            -> {{ rawText, blocks }}
# POST /ocr/gpt-parse  -> {{ items[], diag }}
# GET  /ocr/health     -> {{ ok, version, limits }}
```

---

## 🧠 Name/Unit Normalization
- `inventory.name` is stored & compared in **lowercase** (UI may show original case)
- Common unit normalization: `kg/g/l/ml/pc/pcs/...`
- Price normalization: strip currency symbols → numeric

---

## ✅ Automatic Stock Update
- Items are **upserted** into `inventory` by name(lower)
- Optional: existing quantity can be incremented (merge) or overwritten by policy

---

## 🔍 Preview + Scan Feedback
- Invoice preview, parsed item cards, and **toast/alert summary** (e.g., `✅ 3 / ⚠️ 1 / ❌ 0`)
- **Retry failed only**

> **Web note:** `Alert.alert()` may not display on Expo Web/browser. Use `console.warn()` or a toast library as fallback.

---

## 📄 Prep Sheet Quantity Logic
Hybrid automation + manual control:

| Field                 | Meaning                                                                 |
|----------------------|-------------------------------------------------------------------------|
| `quantity`           | Auto-suggested prep quantity from `prep_suggestions`                    |
| `currentMealStock`   | Existing prepped stock for today                                        |
| `Planned Prep`       | Default = `quantity - currentMealStock`                                 |
| `plannedPrepOverride`| Staff override input (from modal)                                       |
| `Done` action        | Logs `plannedPrepOverride` if provided, otherwise uses `quantity - stock`|

**Display** always shows system suggestion, but **[✅ Done] respects staff input**.

**Meal log overwrite strategy**  
- On manual stock entry, delete prior logs of that recipe for the day, insert a single new log, and adjust inventory by delta.  
- Keeps logs aligned with physical stock after long breaks (e.g., holidays).

---

## 🔄 Impact on Forecasting
- Current: weekday/weekend suggestions set by user
- Future: use historical logs (3+ weeks) to forecast; ignore overrides via `notes='Manual override'`

---

## ⚠️ Smart Alerts System
- Merges **low stock** and **not recently checked** signals
- `checkThreshold`: warn if `stock < X` or `lastChecked` older than `Y` days
- Visual cues only — no hard blocks in workflow

---

## 🧑‍🍳 Data Management
- ✅ **CSV Import** for recipes/ingredients (in-app)
- ✅ **OCR-based** invoice capture (Vision + GPT)
- ✅ **Manual** entry/edit with dynamic category creation
- All synced to Supabase

---

## 🧮 POS Analysis Module (I-4)
- **Upload CSV or pull API**  
- Show **Sales Summary**, **Weekday Trends**, **Suggested Prep**, **Ingredient Needs**
- **Low-Mover Alert** (< threshold/day)
- (Optional) **Order Timing Analysis** (Seated→Order delay)

Minimal CSV:
```
Date,Item Name,Quantity Sold,Table ID,Order Time[,Seated Time]
2025-06-01,Tomato Pasta,12,T8,18:47
2025-06-01,Garlic Bread,7,T4,18:49
```

---

## ✏️ Editable Fields Roadmap
- **I-3 Alert Threshold Editing**: Inline edit `inventory.alertLevel` (onBlur save)
- **I-2 Prep Estimated Time Editing**: Inline edit `recipes.estimated_time_minutes int` (recommended)  
  Migration:
  ```sql
  alter table recipes add column if not exists estimated_time_minutes int;
  ```

---

## 🛠️ Technologies Used
- Expo (SDK 52) / React Native (0.76) / Expo Router (4.0)  
- TypeScript (5.3) / date-fns / lucide-react-native  
- Supabase (DB + Auth + RLS)  
- Google Vision (OCR) + GPT (low-confidence classification only)

---

## 🚀 Run & Develop

```bash
# 1) Install
npm install

# 2) Start app (web for fast iteration)
npx expo start --web

# 3) Start OCR API server
cd api-server
npx tsx server.ts
```

**Troubleshooting**
- Clear cache/reinstall (PowerShell):
  ```powershell
  Remove-Item -Recurse -Force node_modules
  del package-lock.json
  npm install
  npx expo start --clear
  ```
- If `Alert.alert` doesn’t show on web, use `ToastAndroid` (Android) or a cross-platform toast fallback.

---

## 📌 Notes
- The app can run with dummy data in `/data/dummyData.ts` if backend is unavailable.
- All design favors **small kitchen teams** and **fast mobile-first operations**.
- This repo is currently **private**.

---

## 🧭 Roadmap Links
- Full roadmap (I-1..I-5): see `plan.md` in the repo root.  
  - I-1 Smart Invoice OCR (Core)  
  - I-3 Alert Threshold Editing  
  - I-2 Prep Estimated Time Editing  
  - I-4 POS Analysis Module  
  - I-5 iOS (Expo) distribution via EAS/TestFlight

---

## 📄 License
Private for now. You may adapt it for your own kitchen inventory system.

✨ Enjoy managing your kitchen inventory smarter and faster!
