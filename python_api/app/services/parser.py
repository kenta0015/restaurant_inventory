# Path: python_api/app/services/parser.py
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional, Tuple

from app.models.schemas import LineItem, WarningCode


@dataclass(frozen=True)
class ParseResult:
    items: List[LineItem]
    warnings: List[WarningCode]
    lines_total: int


class RuleBasedParser:
    """
    Deterministic, rule-based invoice parser.
    - No external APIs
    - Stable outputs for tests
    """

    _IGNORE_KEYWORDS = (
        "total",
        "subtotal",
        "gst",
        "tax",
        "vat",
        "invoice",
        "abn",
        "bank",
        "bsb",
        "account",
        "eftpos",
        "card",
        "balance",
        "change",
        "cash",
        "thank",
        "discount",
        "refund",
        "void",
    )

    _CURRENCY_RE = re.compile(r"(?i)\b(aud|usd|cad|gbp|eur)\b")

    _PRICE_RE = re.compile(
        r"""
        (?:
            \$\s*(?P<price1>\d+(?:\.\d{1,2})?) |
            (?P<price2>\d+(?:\.\d{1,2})?)\s*\$ |
            (?P<price3>\d+(?:\.\d{1,2})?)
        )
        """,
        re.VERBOSE,
    )

    _QTY_RE = re.compile(r"(?P<qty>\d+(?:\.\d+)?)")

    _UNIT_RE = re.compile(
        r"(?i)\b(?P<unit>kg|g|gram|grams|l|lt|liter|litre|ml|pcs|pc|ea|each|unit|units)\b"
    )

    _MULTIPLIER_RE = re.compile(r"(?i)\b(?P<qty>\d+(?:\.\d+)?)\s*[x×]\b")

    # Pattern 1: name + qty + unit + price (price may be with $)
    _P1_RE = re.compile(
        r"""
        ^\s*
        (?P<name>.+?)
        \s+
        (?P<qty>\d+(?:\.\d+)?)
        \s*
        (?P<unit>kg|g|gram|grams|l|lt|liter|litre|ml|pcs|pc|ea|each|unit|units)?
        \s+
        (?:\$?\s*(?P<price>\d+(?:\.\d{1,2})?))
        \s*$
        """,
        re.IGNORECASE | re.VERBOSE,
    )

    # Pattern 2: name + qty + unit (no price)
    _P2_RE = re.compile(
        r"""
        ^\s*
        (?P<name>.+?)
        \s+
        (?P<qty>\d+(?:\.\d+)?)
        \s*
        (?P<unit>kg|g|gram|grams|l|lt|liter|litre|ml|pcs|pc|ea|each|unit|units)?
        \s*$
        """,
        re.IGNORECASE | re.VERBOSE,
    )

    # Pattern 3: name + price (qty/unit missing)
    _P3_RE = re.compile(
        r"""
        ^\s*
        (?P<name>.+?)
        \s+
        (?:\$?\s*(?P<price>\d+(?:\.\d{1,2})?))
        \s*$
        """,
        re.IGNORECASE | re.VERBOSE,
    )

    def parse(self, raw_text: str, vendor: Optional[str] = None, currency: Optional[str] = None) -> ParseResult:
        raw_lines = [ln.strip() for ln in raw_text.splitlines()]
        lines = [ln for ln in raw_lines if ln]

        warnings: List[WarningCode] = []
        items: List[LineItem] = []

        ignored_any_totalish = False
        unparseable_any = False

        for idx, line in enumerate(lines):
            if self._should_ignore_line(line):
                if self._looks_totalish(line):
                    ignored_any_totalish = True
                continue

            item, line_warnings, parsed = self._parse_line(line, idx)
            if parsed and item is not None:
                items.append(item)
                # Item warnings live on the item; global warnings stay separate.
            else:
                unparseable_any = True

        if ignored_any_totalish:
            warnings.append("SUSPECT_TOTAL_LINE")

        if unparseable_any:
            warnings.append("UNPARSABLE_LINE")

        if not items:
            warnings.append("EMPTY_RESULT")

        return ParseResult(items=items, warnings=_dedupe_keep_order(warnings), lines_total=len(lines))

    def _should_ignore_line(self, line: str) -> bool:
        lowered = line.lower()

        # If line is basically just currency or separators, ignore.
        if self._CURRENCY_RE.search(lowered) and len(lowered) <= 6:
            return True

        # Ignore lines with obvious non-item metadata keywords.
        for kw in self._IGNORE_KEYWORDS:
            if kw in lowered:
                return True

        # Ignore very short lines unlikely to be items.
        if len(lowered) <= 2:
            return True

        return False

    def _looks_totalish(self, line: str) -> bool:
        lowered = line.lower()
        return "total" in lowered or "subtotal" in lowered or "gst" in lowered or "tax" in lowered or "vat" in lowered

    def _parse_line(self, line: str, line_index: int) -> Tuple[Optional[LineItem], List[WarningCode], bool]:
        # Try Pattern 1
        m1 = self._P1_RE.match(line)
        if m1:
            name = self._clean_name(m1.group("name"))
            qty = float(m1.group("qty"))
            raw_unit = m1.group("unit") or "unit"
            unit, unit_warning = self._normalize_unit(raw_unit)

            price = float(m1.group("price"))
            item_warnings: List[WarningCode] = []
            if unit_warning is not None:
                item_warnings.append(unit_warning)

            confidence = self._compute_confidence(base=0.85, unit_warning=unit_warning, missing_price=False)
            if confidence is not None and confidence < 0.5:
                item_warnings.append("LOW_CONFIDENCE")

            item = LineItem(
                name=name,
                quantity=qty,
                unit=unit,
                price=price,
                source_text=line,
                line_index=line_index,
                confidence=confidence,
                warnings=_dedupe_keep_order(item_warnings),
            )
            return item, item_warnings, True

        # Try Pattern 2
        m2 = self._P2_RE.match(line)
        if m2:
            name = self._clean_name(m2.group("name"))
            qty = float(m2.group("qty"))
            raw_unit = m2.group("unit") or "unit"
            unit, unit_warning = self._normalize_unit(raw_unit)

            item_warnings = ["MISSING_PRICE"]
            if unit_warning is not None:
                item_warnings.append(unit_warning)

            confidence = self._compute_confidence(base=0.65, unit_warning=unit_warning, missing_price=True)
            if confidence is not None and confidence < 0.5:
                item_warnings.append("LOW_CONFIDENCE")

            item = LineItem(
                name=name,
                quantity=qty,
                unit=unit,
                price=None,
                source_text=line,
                line_index=line_index,
                confidence=confidence,
                warnings=_dedupe_keep_order(item_warnings),
            )
            return item, item_warnings, True

        # Try Pattern 3
        m3 = self._P3_RE.match(line)
        if m3:
            name = self._clean_name(m3.group("name"))
            price = float(m3.group("price"))

            # Default to 1 unit when missing qty/unit
            qty = 1.0
            unit = "unit"

            item_warnings: List[WarningCode] = []
            confidence = self._compute_confidence(base=0.55, unit_warning=None, missing_price=False)
            if confidence is not None and confidence < 0.5:
                item_warnings.append("LOW_CONFIDENCE")

            item = LineItem(
                name=name,
                quantity=qty,
                unit=unit,
                price=price,
                source_text=line,
                line_index=line_index,
                confidence=confidence,
                warnings=_dedupe_keep_order(item_warnings),
            )
            return item, item_warnings, True

        # Fallback: attempt to infer qty multiplier like "2x" and a price at end
        qty = self._infer_multiplier_qty(line)
        price = self._infer_price(line)
        if price is not None:
            name = self._clean_name(self._strip_price_like_suffix(line))
            unit = "unit"
            item_warnings: List[WarningCode] = []
            base = 0.55

            if qty is None:
                qty_val = 1.0
            else:
                qty_val = qty
                base = 0.6

            confidence = self._compute_confidence(base=base, unit_warning=None, missing_price=False)
            if confidence is not None and confidence < 0.5:
                item_warnings.append("LOW_CONFIDENCE")

            item = LineItem(
                name=name,
                quantity=qty_val,
                unit=unit,
                price=price,
                source_text=line,
                line_index=line_index,
                confidence=confidence,
                warnings=_dedupe_keep_order(item_warnings),
            )
            return item, item_warnings, True

        return None, [], False

    def _clean_name(self, name: str) -> str:
        cleaned = name.strip()
        cleaned = re.sub(r"\s+", " ", cleaned)
        cleaned = cleaned.strip("-–—:|")
        cleaned = cleaned.strip()
        return cleaned or "unknown"

    def _normalize_unit(self, raw_unit: str) -> Tuple[str, Optional[WarningCode]]:
        u = raw_unit.strip().lower()

        mapping = {
            "kg": "kg",
            "g": "g",
            "gram": "g",
            "grams": "g",
            "l": "l",
            "lt": "l",
            "liter": "l",
            "litre": "l",
            "ml": "ml",
            "pcs": "pcs",
            "pc": "pcs",
            "ea": "pcs",
            "each": "pcs",
            "unit": "unit",
            "units": "unit",
        }

        if u in mapping:
            return mapping[u], None

        # If it looks empty/unknown, normalize to "unit" and warn.
        if not u:
            return "unit", "UNKNOWN_UNIT"

        return "unit", "UNKNOWN_UNIT"

    def _compute_confidence(self, base: float, unit_warning: Optional[WarningCode], missing_price: bool) -> float:
        score = base
        if unit_warning is not None:
            score -= 0.15
        if missing_price:
            score -= 0.2
        # Clamp to [0, 1]
        if score < 0.0:
            score = 0.0
        if score > 1.0:
            score = 1.0
        return score

    def _infer_price(self, line: str) -> Optional[float]:
        # Prefer a trailing price-like token
        tokens = [t for t in re.split(r"\s+", line.strip()) if t]
        if not tokens:
            return None

        last = tokens[-1]
        # Remove common punctuation
        last = last.strip(",;")
        m = re.match(r"^\$?(\d+(?:\.\d{1,2})?)$", last)
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                return None
        return None

    def _strip_price_like_suffix(self, line: str) -> str:
        tokens = [t for t in re.split(r"\s+", line.strip()) if t]
        if not tokens:
            return line
        last = tokens[-1].strip(",;")
        if re.match(r"^\$?\d+(?:\.\d{1,2})?$", last):
            return " ".join(tokens[:-1])
        return line

    def _infer_multiplier_qty(self, line: str) -> Optional[float]:
        m = self._MULTIPLIER_RE.search(line)
        if not m:
            return None
        try:
            return float(m.group("qty"))
        except ValueError:
            return None


def _dedupe_keep_order(values: List[WarningCode]) -> List[WarningCode]:
    seen: set[str] = set()
    out: List[WarningCode] = []
    for v in values:
        if v not in seen:
            seen.add(v)
            out.append(v)
    return out