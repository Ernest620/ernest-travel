#!/usr/bin/env python3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def page(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")


def require_all(filename: str, values: list[str]) -> None:
    text = page(filename)
    missing = [value for value in values if value not in text]
    assert not missing, f"{filename} missing: {', '.join(missing)}"


def main() -> None:
    require_all(
        "otaru_5km.html",
        [
            "北のどんぶり屋 滝波食堂",
            "ぼたんえび",
            "かに汁",
            "北菓楼 小樽本館",
            "北の夢ドーム",
            "夢不思議",
            "小樽洋菓子舗ルタオ 本店",
            "運河の灯り",
            "ショコラの誘惑セット",
            "麺 晄進",
            "雫塩らーめん",
            "若鶏時代 なると 本店",
            "手羽先",
        ],
    )
    require_all(
        "sapporo_2h.html",
        [
            "北海道特産品販売・おもひで食堂",
            "タラバガニ",
            "NOUILLES JAPONAISE とくいち",
            "特上らぁ麺 塩",
            "タイガーカレー 赤れんがテラス店",
            "海老スープ",
            "Susukino Creperiz",
            "いちごカスタードクレープ",
            "ESPRESSO D WORKS ココノススキノ店",
            "ワンハンドレッド",
            "極上プリン",
        ],
    )
    require_all(
        "hakodate_1h.html",
        [
            "函館朝市 味の一番",
            "海鮮ラーメン",
            "塩ラーメン＋蟹肉丼セット",
            "川村青果店",
            "夕張メロン",
            "函館洋菓子スナッフルス 金森洋物館店",
            "チーズオムレット",
            "ラッキーピエロ ベイエリア本店",
            "チャイニーズチキンバーガー",
        ],
    )
    require_all(
        "lake_toya.html",
        [
            "THE TOYA",
            "豚ロースカツカレー",
            "洞爺湖和牛切り落としステーキ丼",
            "投稿者回報只能刷卡",
        ],
    )

    overview = page("travel_overview.html")
    overview_names = [
        "麺 晄進",
        "小樽洋菓子舗ルタオ 本店",
        "北海道特産品販売・おもひで食堂",
        "NOUILLES JAPONAISE とくいち",
        "タイガーカレー 赤れんがテラス店",
        "Susukino Creperiz",
        "ESPRESSO D WORKS ココノススキノ店",
    ]
    missing_overview = [name for name in overview_names if name not in overview]
    assert not missing_overview, "travel_overview.html missing: " + ", ".join(missing_overview)

    print("FOOD ADDITIONS QA PASS: 15 venues searchable with menu details and overview sync")


if __name__ == "__main__":
    main()
