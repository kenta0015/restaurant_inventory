# Path: python_api/app/models/schemas.py
from __future__ import annotations

from typing import Annotated, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:])


class APIModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
        extra="forbid",
    )


WarningCode = Literal[
    "MISSING_PRICE",
    "UNKNOWN_UNIT",
    "LOW_CONFIDENCE",
    "UNPARSABLE_LINE",
    "SUSPECT_TOTAL_LINE",
    "EMPTY_RESULT",
]


class InvoiceParseRequest(APIModel):
    raw_text: str = Field(..., description="Raw OCR text of an invoice/receipt.")
    vendor: Optional[str] = Field(default=None)
    currency: Optional[str] = Field(default=None, description="ISO currency code, e.g. AUD.")

    @field_validator("raw_text")
    @classmethod
    def validate_raw_text_not_empty(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("rawText must not be empty")
        return trimmed


PositiveFloat = Annotated[float, Field(gt=0)]
NonNegativeFloat = Annotated[float, Field(ge=0)]
ConfidenceFloat = Annotated[float, Field(ge=0, le=1)]
NonNegativeInt = Annotated[int, Field(ge=0)]


class LineItem(APIModel):
    name: str = Field(..., min_length=1)
    quantity: PositiveFloat = Field(..., description="Parsed quantity (must be > 0).")
    unit: str = Field(..., min_length=1, description='Normalized unit (e.g., "kg", "g", "ml", "l", "pcs", "unit").')

    price: Optional[NonNegativeFloat] = Field(default=None)
    note: Optional[str] = Field(default=None)
    source_text: Optional[str] = Field(default=None, description="Original source line text used to parse this item.")
    extra_fields: Optional[Dict[str, str]] = Field(default=None, description="Extensible key/value fields from vendor receipts.")

    confidence: Optional[ConfidenceFloat] = Field(default=None, description="0.0 to 1.0 confidence score.")
    warnings: List[WarningCode] = Field(default_factory=list)
    line_index: Optional[NonNegativeInt] = Field(default=None, description="0-based line number in rawText after splitting.")


class InvoiceParseMeta(APIModel):
    parser: Literal["rules", "llm"] = Field(..., description="Which parser produced the result.")
    vendor: Optional[str] = Field(default=None)
    currency: Optional[str] = Field(default=None)
    lines_total: NonNegativeInt = Field(..., description="Total number of non-empty lines processed.")
    items_parsed: NonNegativeInt = Field(..., description="Number of items returned.")


class InvoiceParseResponse(APIModel):
    items: List[LineItem] = Field(default_factory=list)
    warnings: List[WarningCode] = Field(default_factory=list)
    meta: InvoiceParseMeta

    @field_validator("warnings")
    @classmethod
    def dedupe_warnings(cls, v: List[WarningCode]) -> List[WarningCode]:
        seen: set[str] = set()
        out: List[WarningCode] = []
        for w in v:
            if w not in seen:
                seen.add(w)
                out.append(w)
        return out
