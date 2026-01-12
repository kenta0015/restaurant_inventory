# Path: python_api/README.md

# Python API (FastAPI Mini Project)

This folder contains a small FastAPI backend used as a standalone mini-project.
It provides a deterministic, rule-based invoice text parser that converts OCR raw text into structured line items.

## Requirements

- Python 3.9+ (recommended: 3.11+)

## Setup (macOS/Linux)

From the repository root:

```bash
python3 -m venv python_api/.venv
source python_api/.venv/bin/activate
pip install -r python_api/requirements.txt
```

## Run the API

From the python_api folder:

```bash
cd python_api
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

## Parse invoice raw text (API example)

Endpoint:

POST /v1/invoice/parse

Example:

```bash
curl -s -X POST "http://127.0.0.1:8000/v1/invoice/parse" \
  -H "Content-Type: application/json" \
  -d '{"rawText":"Tomato 2 kg $12.50\nMilk 1L\nTOTAL $99.99\n","vendor":"TestVendor","currency":"AUD"}'
```

Response shape (high level):

-items[]: parsed line items (name/quantity/unit/price + warnings/confidence)

-warnings[]: global warnings (e.g. EMPTY_RESULT, UNPARSABLE_LINE)

-meta: parser metadata (parser, linesTotal, itemsParsed)

## Run tests

From the python_api folder:

```bash
cd python_api
source .venv/bin/activate
pytest -q

```

## Troubleshooting

-pytest: command not found

    Make sure you activated the venv: source .venv/bin/activate

-ModuleNotFoundError: No module named 'app'

    Run tests from inside python_api (not repository root): cd python_api && pytest -q
