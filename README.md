# Restaurant Inventory Bolt

A mobile-first inventory app for small restaurants, food trucks, and prep-heavy kitchens. Built for fast daily operations: track ingredients, manage recipes, plan prep, and keep inventory in sync with minimal typing.

This repo includes:

- **Mobile app** (React Native + Expo Router + Supabase)
- **OCR + parsing server** (`api-server/`, Node/TypeScript) for invoice image → structured items
- **Rule-based invoice parser service** (`python_api/`, FastAPI) for OCR `rawText` → structured items (no LLM)

---

## What the App Does

### Inventory (Ingredients)

- Add / edit items and quantities
- Organize by category
- Visual warnings for low stock and “needs checking”

### Recipes + Prep

- Recipes consume ingredients based on planned prep quantity
- “Prep Sheet” supports daily prep planning and a single-tap **Done** flow that updates stock

### Invoice Capture (OCR → Inventory)

- Upload an invoice image
- Server runs OCR and parses line items
- UI lets staff review/edit parsed items
- Save results to Supabase and upsert into `inventory`

---

## Tech Stack

- **Mobile:** Expo SDK 52, React Native 0.76, TypeScript, Expo Router
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Invoice OCR (Node server):** Google Vision OCR + GPT (used only for low-confidence lines)
- **Invoice parser (Python service):** FastAPI rule-based parser with pytest + CI

---

## Stable Versions (SDK 52)

| Package                     | Version | Notes                      |
| --------------------------- | ------- | -------------------------- |
| expo                        | 52.0.46 | SDK 52                     |
| react-native                | 0.76.9  | Matches SDK 52             |
| react                       | 18.2.0  | Recommended (avoid 18.3.x) |
| react-dom                   | 18.2.0  | For web compatibility      |
| expo-router                 | 4.0.21  | Expo SDK 52 compatible     |
| @react-native-picker/picker | 2.9.0   | Compatible                 |

Notes:

- `react@18.3.x` may cause compatibility issues with this setup.
- `expo-router@5.x` requires Expo SDK 53+.

---

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Configure Supabase

You need a Supabase project and keys available to the app.

Minimum required:

- Supabase URL
- Supabase anon/public key

Also ensure your database has the tables used by this app (see **Data Model (Tables)**) and that your RLS policies match your intended usage.

### 3) Run the OCR server (Node / TypeScript)

Start the OCR server in a separate terminal:

```bash
cd api-server
npx tsx server.ts
```

Health check:

```bash
curl http://localhost:PORT/ocr/health
```

Endpoints:

- `POST /ocr` → `{ rawText, blocks }`
- `POST /ocr/gpt-parse` → `{ items[], diag }`
- `GET  /ocr/health` → `{ ok, version, limits }`

> The Node server requires Google Vision credentials and an OpenAI API key (configure via your local environment for `api-server/`).

### 4) Run the app

```bash
npx expo start
```

Launch on device/simulator from the Expo CLI.

---

## Clean Reinstall (after dependency changes)

**PowerShell (Windows):**

```powershell
Remove-Item -Recurse -Force node_modules
del package-lock.json
npm install
npx expo start --clear
```

---

## Project Structure

```txt
restaurant_inventory_bolt/
├── app/            # Screens and routing (Expo Router)
├── assets/         # App icons and images
├── components/     # Reusable UI (InventoryItem, PrepTaskItem, ParsedItemCard, etc.)
├── hooks/          # Custom hooks
├── types/          # TypeScript types (OCRItem, ParsedItem, InventoryItem, etc.)
├── utils/          # Helpers (saveParsedItems, saveTrainingData, OCR helpers)
├── api-server/     # OCR server (Google Vision + GPT parsing)
├── python_api/     # FastAPI rule-based invoice parser (no LLM)
├── docs/           # Additional internal docs
└── README.md
```

---

## Invoice OCR (Current Flow)

### Client flow

```txt
Image → POST /ocr → { rawText, blocks }
      → POST /ocr/gpt-parse (low-confidence lines only)
      → UI review/edit (ParsedItemCard)
      → saveParsedItems() → Supabase upsert into inventory
      → Result summary: ✅ / ⚠️ / ❌  + retry failed only
```

### Server modules (api-server/)

- `vision.ts` — Google Vision wrapper
- `parseOrchestrator.ts` — line joining + heuristics + normalization
- `gpt.ts` — batch parsing with retry/backoff + token budgeting
- `costGuard.ts` — token estimate + guardrails

---

## Data Model (Tables)

Tables used by core flows:

- `inventory`

  - Stores ingredient items
  - Matching/upsert uses normalized name (lowercase)

- `invoice_runs`

  - One upload = one record
  - Stores counts/summary for a scan

- `ocr_training_data`
  - Stores parse inputs/outputs + user final choice + label
  - Used for improving parsing quality and auditing decisions

(Additional tables exist for recipes, meal logs, and prep suggestions depending on your setup.)

---

## Normalization Rules

- `inventory.name` is stored and compared in **lowercase** to improve matching/upserts.
- Units are normalized to common forms (`kg`, `g`, `l`, `ml`, `pc/pcs`, etc.).
- Prices are normalized to numeric values (currency symbols stripped).

---

## Automatic Stock Updates

- Parsed invoice items are **upserted** into `inventory` using `name(lowercase)` as the match key.
- Quantity update behavior depends on your policy (increment/merge vs overwrite).

---

## Prep Sheet Quantity Logic (Current)

The prep workflow is intentionally “automation + staff control”:

| Field                 | Meaning                                                      |
| --------------------- | ------------------------------------------------------------ |
| `quantity`            | Suggested quantity from `prep_suggestions`                   |
| `currentMealStock`    | Current prepped stock for today                              |
| `Planned Prep`        | Default = `quantity - currentMealStock`                      |
| `plannedPrepOverride` | Staff override input (via modal)                             |
| `Done` action         | Logs override if present; otherwise uses default calculation |

Meal log overwrite strategy:

- Manual stock entry replaces earlier logs for that recipe **for the same day** (delete + insert one log) and adjusts inventory by delta.
- This keeps logs aligned with physical stock after breaks (e.g., holidays).

---

## Python API (FastAPI) — Invoice Parsing From OCR Text

This repo also includes a standalone service under `python_api/`:

- `POST /v1/invoice/parse` converts OCR `rawText` into structured items:
  - `name`, `quantity`, `unit`, `price`, `confidence`, `warnings`
- **Rule-based only (no LLM)**
- Covered by **pytest** and verified by **GitHub Actions CI**

Setup and usage are documented in `python_api/README.md`.

---

## Troubleshooting

### Version mismatch / runtime issues

- Ensure you’re on the stable versions listed above (SDK 52 + expo-router 4.x + React 18.2.0).
- Do a clean reinstall (see **Clean Reinstall**).

### OCR server issues

- Confirm the server is running and reachable from the device/simulator.
- Verify Google Vision credentials + OpenAI key are correctly configured for `api-server/`.

---

## Notes

- The app can run with dummy data (if present) when backend is unavailable.
- UX is optimized for small kitchen teams: minimal typing, large controls, fast daily flows.

---

## License

Private for now. You may adapt the code for your own kitchen inventory system.
