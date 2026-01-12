# Path: python_api/app/main.py
from __future__ import annotations

from fastapi import FastAPI

from app.models.schemas import InvoiceParseMeta, InvoiceParseRequest, InvoiceParseResponse
from app.services.parser import RuleBasedParser

app = FastAPI(
    title="Restaurant Inventory Mini API",
    version="0.2.0",
)

_parser = RuleBasedParser()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/invoice/parse", response_model=InvoiceParseResponse)
def parse_invoice(req: InvoiceParseRequest) -> InvoiceParseResponse:
    result = _parser.parse(raw_text=req.raw_text, vendor=req.vendor, currency=req.currency)

    warnings = list(result.warnings)
    if not result.items and "EMPTY_RESULT" not in warnings:
        warnings.append("EMPTY_RESULT")

    meta = InvoiceParseMeta(
        parser="rules",
        vendor=req.vendor,
        currency=req.currency,
        lines_total=result.lines_total,
        items_parsed=len(result.items),
    )

    return InvoiceParseResponse(
        items=result.items,
        warnings=warnings,
        meta=meta,
    )
