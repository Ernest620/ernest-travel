#!/usr/bin/env python3
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "itinerary_2027.html"


def embedded_json(text: str, marker: str):
    start = text.index(marker) + len(marker)
    return json.JSONDecoder().raw_decode(text[start:].lstrip())[0]


def item_titles(day: dict) -> list[str]:
    return [item[1] for item in day["items"]]


def item_text(day: dict) -> str:
    return " ".join(" ".join(item) for item in day["items"])


def main() -> None:
    text = PAGE.read_text(encoding="utf-8")
    assert "const STORAGE='hokkaidoTripEditorV4'" in text, "new defaults must not be hidden by the old V3 browser cache"
    days = embedded_json(text, "const DEFAULT_DAYS=")
    decisions = embedded_json(text, "const IMAGE_ROUTE_DECISIONS=")
    by_id = {day["id"]: day for day in days}

    assert [day["date"] for day in days] == [f"1/{day}" for day in range(1, 11)]

    assert "12:50" in item_text(by_id["d1"])
    assert not any("函館朝市" in title for title in item_titles(by_id["d1"])), "arrival afternoon is too late for a market stop"
    assert all(name in item_text(by_id["d2"]) for name in ["函館朝市", "五稜郭", "八幡坂"])

    assert all(name in item_text(by_id["d3"]) for name in ["冬季遊覽船", "燈光隧道"])
    assert all(name in item_text(by_id["d4"]) for name in ["大通公園", "札幌時計台", "札幌電視塔", "站前通"])
    assert "大通主會場" in item_text(by_id["d4"]) and "12/25" in item_text(by_id["d4"])

    otaru = item_titles(by_id["d6"])
    expected_otaru = ["小樽音樂盒堂＋童話十字路口", "北一硝子三號館", "堺町通", "小樽運河藍調＋青之運河"]
    assert all(name in otaru for name in expected_otaru)
    assert [otaru.index(name) for name in expected_otaru] == sorted(otaru.index(name) for name in expected_otaru)
    assert "南小樽" in by_id["d6"]["transport"]

    tour = item_text(by_id["d7"])
    assert all(name in tour for name in ["飯店接送", "旭山動物園", "企鵝散步", "美瑛聖誕樹", "白鬚瀑布", "森林精靈露台"])
    assert "旅行社" in tour and "不保證" in tour

    assert all(name in item_text(by_id["d9"]) for name in ["北海道神宮", "白色戀人公園", "藻岩山"])

    scheduled = " ".join(item["name"] for item in decisions["scheduled"])
    optional = " ".join(item["name"] for item in decisions["optional"])
    excluded = " ".join(item["name"] for item in decisions["excluded"])
    assert all(name in scheduled for name in ["函館", "洞爺湖", "札幌", "小樽", "旭川・美瑛・富良野"])
    assert all(name in optional for name in ["船見坂", "天狗山", "朝里"])
    assert all(name in excluded for name in ["網走", "釧路", "登別"])

    assert 'id="imageRouteDecisions"' in text
    assert "renderImageRouteDecisions" in text
    print("IMAGE ITINERARY QA PASS: arrival-aware 10-day route and image-attraction decisions verified")


if __name__ == "__main__":
    main()
