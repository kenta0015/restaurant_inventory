# Restaurant Inventory

Mobile-first inventory + prep planning app for small kitchens. Built with **React Native (Expo Router) + TypeScript + Supabase (Postgres/Auth/RLS)**, plus an OCR-assisted invoice intake flow to reduce manual stock entry.

**This repo includes three parts:**

1. **Mobile app** (`/app`, `/components`) — inventory, recipes, prep sheet, alerts, invoice review UI
2. **Node OCR API server** (`/api-server`) — Google Vision OCR + optional GPT parsing for low-confidence lines
3. **Python invoice parser (rule-based)** (`/python_api`) — standalone FastAPI service to convert OCR `rawText` → structured items (no LLM)

---

## Why this project exists

Most small kitchens track stock informally (memory, notes, spreadsheets). This project aims to make daily operations easier by:

- Tracking ingredient stock quickly (no expiry complexity)
- Converting **prep actions** into automatic stock deductions
- Reducing invoice-entry friction with **OCR → review → upsert**
- Keeping the workflow mobile-friendly (large controls, minimal typing)

---

## What I built (engineering highlights)

### Inventory + prep workflow (mobile app)

- Ingredient CRUD with category grouping and low-stock warnings
- Recipe-based prep tasks that compute **Planned Prep** from a suggestion minus today’s existing prep stock
- “Done” action updates the day’s meal log and adjusts inventory by delta to stay aligned with physical counts

### Invoice OCR intake (mobile + API server)

**Goal:** turn an invoice photo into inventory updates with minimal manual edits.

Flow:

1. Upload invoice image (JPEG/PNG)
2. Server runs OCR (Google Vision) → returns `rawText` + structured blocks
3. Only low-confidence lines are sent to GPT for classification/structuring (cost-controlled)
4. User reviews/edits items in UI
5. Items are upserted into Supabase `inventory` with a run summary (✅/⚠️/❌), and failed items can be retried

---

## Tech stack

- **Mobile:** React Native, Expo SDK 52, Expo Router, TypeScript
- **State/UI:** Zustand, Reanimated, date-fns
- **Backend/DB:** Supabase (Postgres + Auth + RLS)
- **OCR + parsing:** Google Vision OCR + GPT (low-confidence only)
- **Optional service:** FastAPI rule-based invoice parser (`python_api/`), with pytest + GitHub Actions CI

---

## Demo (recommended for portfolio)

Add at least one (recruiters look for proof fast):

- 30–60s screen recording (invoice → review → save)
- 3–5 screenshots (Inventory, Prep Sheet, Parsed Item Review, Result Summary)

---

## System architecture

### Mobile app → OCR server → Supabase

```text
Invoice Image
  → POST /ocr               (Vision OCR)
  → POST /ocr/gpt-parse      (optional; low-confidence lines only)
  → UI review/edit
  → Supabase upsert inventory
  → Save run + training data
```

### Node OCR server (`api-server`)

Key modules:

- `vision.ts` — Google Vision wrapper
- `parseOrchestrator.ts` — block grouping + line normalization + heuristics
- `gpt.ts` — batching, retries/backoff, token budgeting
- `costGuard.ts` — token estimate + budget guardrails

### Supabase tables (high-level)

- `inventory` — ingredient records (**name normalized to lowercase** for consistent matching)
- `invoice_runs` — one upload = one run record + counts
- `ocr_training_data` — block → rule result → GPT result → user final + label

---

## Quick start (local development)

### Prerequisites

- Node 18+ recommended
- Supabase project (URL + anon key; service key only if required server-side)
- Google Vision credentials (server-side)
- OpenAI API key (only if using GPT parsing)

### 1) Install

```bash
npm install
```

### 2) Run the app (fast iteration)

```bash
npx expo start --web
```

### 3) Run OCR API server (Node)

```bash
cd api-server
npx tsx server.ts
```

Endpoints:

- `POST /ocr` → `{ rawText, blocks }`
- `POST /ocr/gpt-parse` → `{ items[], diag }`
- `GET /ocr/health` → `{ ok, version, limits }`

### 4) Optional: Python rule-based parser (`python_api`)

This repo also includes a standalone rule-based parser service (no LLM):

- Endpoint: `POST /v1/invoice/parse`
- Converts OCR `rawText` → structured items `{ name, quantity, unit, price, confidence, warnings }`
- Covered by pytest and verified by GitHub Actions CI  
  See `python_api/README.md` for setup and usage.

---

## Configuration

Add an `.env.example` and document your environment variables. Typical variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS` (or Vision key mechanism)
- `OPENAI_API_KEY` (only for `/ocr/gpt-parse`)

---

## Behavior notes / limitations

- **Expo Web:** `Alert.alert()` may not render in browsers; use toast/console fallback.
- **Invoice matching:** inventory names are normalized to lowercase; UI may preserve original case.
- **Parsing reliability:** OCR quality depends heavily on invoice formatting and photo clarity; the UI is designed to allow quick corrections before saving.

---

## Quality / testing status

- `python_api/` is covered by **pytest** and validated by **GitHub Actions CI**.
- Mobile app and Node OCR server: document what’s true (even if it’s “manual testing only”). Good next steps:
  - unit tests for normalization + parsing utilities
  - integration test for OCR run summary logic
  - CI for app + api-server (lint/typecheck/tests)

---

## Project status

- Core inventory + prep workflow: implemented
- OCR intake flow (Vision + optional GPT for low-confidence lines): implemented
- Rule-based invoice parsing service (`python_api/`): implemented + tested

If you keep a roadmap, put it in a separate file (`ROADMAP.md`) so this README stays “shipped-first”.

---

## License

Private for now.
