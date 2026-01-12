# Path: python_api/tests/test_parse_invoice.py
from fastapi.testclient import TestClient

from app.main import app
from tests.fixtures import (
    fixture_basic_two_items_with_total,
    fixture_empty_result_all_ignored,
    fixture_missing_price_item,
)


def test_parse_invoice_basic_success() -> None:
    client = TestClient(app)
    fx = fixture_basic_two_items_with_total()

    resp = client.post(
        "/v1/invoice/parse",
        json={"rawText": fx.raw_text, "vendor": "TestVendor", "currency": "AUD"},
    )

    assert resp.status_code == 200
    data = resp.json()

    assert "items" in data
    assert "warnings" in data
    assert "meta" in data

    assert isinstance(data["items"], list)
    assert len(data["items"]) == fx.expected_items

    meta = data["meta"]
    assert meta["parser"] == "rules"
    assert meta["vendor"] == "TestVendor"
    assert meta["currency"] == "AUD"
    assert meta["linesTotal"] == 3
    assert meta["itemsParsed"] == fx.expected_items

    assert fx.expect_global_warning in data["warnings"]

    first = data["items"][0]
    assert first["name"] == "Tomato"
    assert first["quantity"] == 2.0
    assert first["unit"] == "kg"
    assert first["price"] == 12.5
    assert first["sourceText"] == "Tomato 2 kg $12.50"
    assert first["lineIndex"] == 0


def test_parse_invoice_missing_price_item_warning() -> None:
    client = TestClient(app)
    fx = fixture_missing_price_item()

    resp = client.post("/v1/invoice/parse", json={"rawText": fx.raw_text})
    assert resp.status_code == 200

    data = resp.json()
    assert len(data["items"]) == fx.expected_items

    item = data["items"][0]
    assert item["name"] == "Milk"
    assert item["unit"] == "l"
    assert item["price"] is None
    assert "MISSING_PRICE" in item["warnings"]


def test_parse_invoice_total_line_ignored_and_global_warning_present() -> None:
    client = TestClient(app)
    fx = fixture_basic_two_items_with_total()

    resp = client.post("/v1/invoice/parse", json={"rawText": fx.raw_text})
    assert resp.status_code == 200

    data = resp.json()
    assert fx.expect_global_warning in data["warnings"]

    item_names = [it["name"].lower() for it in data["items"]]
    assert all("total" not in nm for nm in item_names)


def test_parse_invoice_empty_result_warning() -> None:
    client = TestClient(app)
    fx = fixture_empty_result_all_ignored()

    resp = client.post("/v1/invoice/parse", json={"rawText": fx.raw_text})
    assert resp.status_code == 200

    data = resp.json()
    assert data["items"] == []
    assert "EMPTY_RESULT" in data["warnings"]


def test_parse_invoice_rejects_empty_raw_text() -> None:
    client = TestClient(app)

    resp = client.post("/v1/invoice/parse", json={"rawText": "   \n  \n"})
    assert resp.status_code == 422
