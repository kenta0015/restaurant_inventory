# Path: python_api/tests/fixtures.py
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ParseFixture:
    raw_text: str
    expected_items: int
    expect_global_warning: str | None = None


def fixture_basic_two_items_with_total() -> ParseFixture:
    return ParseFixture(
        raw_text="Tomato 2 kg $12.50\nMilk 1L\nTOTAL $99.99\n",
        expected_items=2,
        expect_global_warning="SUSPECT_TOTAL_LINE",
    )


def fixture_missing_price_item() -> ParseFixture:
    return ParseFixture(
        raw_text="Milk 1L\n",
        expected_items=1,
        expect_global_warning=None,
    )


def fixture_empty_result_all_ignored() -> ParseFixture:
    return ParseFixture(
        raw_text="TOTAL $10.00\nGST $1.00\nINVOICE 123\n",
        expected_items=0,
        expect_global_warning="EMPTY_RESULT",
    )


def fixture_unparseable_lines_present() -> ParseFixture:
    return ParseFixture(
        raw_text="---\nHello\nTomato 2 kg $12.50\n@@@\n",
        expected_items=1,
        expect_global_warning="UNPARSABLE_LINE",
    )
