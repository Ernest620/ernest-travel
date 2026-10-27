(function () {
  "use strict";

  const SUPERMARKET_KEYWORDS = [
    "超市","スーパー","supermarket","AEON","イオン","MaxValu","マックスバリュ",
    "コープさっぽろ","Coop Sapporo","ダイイチ","東光ストア","アークス","ラルズ",
    "イトーヨーカドー","生鮮市場","食品スーパー"
  ];

  const STYLE = `
  .deli-forecast{
    margin-top:10px;padding:12px;border:1px solid #d9e2ef;border-radius:13px;
    background:linear-gradient(135deg,#f8fbff,#fff);
    font-size:12.5px;line-height:1.6;color:#42516b
  }
  .deli-forecast-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}
  .deli-forecast-title{font-weight:900;color:#172033;font-size:13.5px}
  .deli-forecast-time{font-size:11px;color:#7a8799;white-space:nowrap}
  .deli-forecast-main{font-size:14px;font-weight:900;margin-bottom:5px}
  .deli-forecast-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 8px}
  .deli-forecast-item{background:#f4f7fb;border-radius:8px;padding:6px 7px}
  .deli-forecast-note{font-size:10.5px;color:#7a8799;margin-top:7px}
  @media(max-width:520px){.deli-forecast-grid{grid-template-columns:1fr}}
  `;

  function addStyle() {
    if (document.getElementById("deli-forecast-style")) return;
    const s = document.createElement("style");
    s.id = "deli-forecast-style";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function japanNow() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false
    }).formatToParts(new Date());

    const o = {};
    for (const p of parts) if (p.type !== "literal") o[p.type] = p.value;
    return {
      hour: Number(o.hour),
      minute: Number(o.minute),
      label: `${o.hour}:${o.minute}`
    };
  }

  function parseCloseTime(card) {
    const explicit = card.getAttribute("data-close");
    if (explicit && /^\d{1,2}:\d{2}$/.test(explicit)) {
      const [h,m] = explicit.split(":").map(Number);
      return h * 60 + m;
    }

    const text = card.innerText || "";
    const matches = [...text.matchAll(/(?:～|〜|-|–|—|至)\s*(\d{1,2}):(\d{2})/g)];
    if (matches.length) {
      const m = matches[matches.length - 1];
      return Number(m[1]) * 60 + Number(m[2]);
    }

    return 22 * 60; // 找不到時採常見超市 22:00 作為保守預估
  }

  function isSupermarket(card) {
    const t = (card.innerText || "").toLowerCase();
    return SUPERMARKET_KEYWORDS.some(k => t.includes(k.toLowerCase()));
  }

  function getForecast(nowMin, closeMin) {
    let minsToClose = closeMin - nowMin;
    if (minsToClose < -360) minsToClose += 1440;

    if (minsToClose <= 0) {
      return {
        main:"⚫ 可能已打烊",
        deli:"熟食：無法判斷",
        sushi:"壽司：無法判斷",
        discount:"折扣：營業時間外",
        advice:"建議：先確認 Google Maps／店家公告"
      };
    }
    if (minsToClose > 300) {
      return {
        main:"🟢 熟食選擇通常較充足",
        deli:"🍱 熟食：充足機率高",
        sushi:"🍣 壽司：充足機率高",
        discount:"🏷️ 折扣：通常尚少",
        advice:"🚶 建議：想挑款式，現在去"
      };
    }
    if (minsToClose > 180) {
      return {
        main:"🟢～🟡 開始進入晚間折扣前段",
        deli:"🍱 熟食：通常仍有不少",
        sushi:"🍣 壽司：熱門款可能變少",
        discount:"🏷️ 折扣：10～20% 機率增加",
        advice:"🚶 建議：兼顧選擇與折扣"
      };
    }
    if (minsToClose > 90) {
      return {
        main:"🟡 晚間折扣時段",
        deli:"🍱 熟食：中等，熱門品減少",
        sushi:"🍣 壽司：中等偏少",
        discount:"🏷️ 折扣：20～30% 機率高",
        advice:"💴 建議：想撿折扣可現在去"
      };
    }
    if (minsToClose > 45) {
      return {
        main:"🟠 深度折扣機率上升",
        deli:"🍱 熟食：偏少",
        sushi:"🍣 壽司：熱門款可能售完",
        discount:"🏷️ 折扣：30～50% 機率上升",
        advice:"💴 建議：價格優先，不在意款式"
      };
    }
    return {
      main:"🔴 接近打烊，半價機率較高",
      deli:"🍱 熟食：可能剩少量",
      sushi:"🍣 壽司：售罄風險高",
      discount:"🏷️ 折扣：半價／大折扣機率高",
      advice:"⚠️ 建議：只適合碰碰運氣"
    };
  }

  function renderCard(card) {
    if (!isSupermarket(card)) return;
    if (card.querySelector(".deli-forecast")) return;

    const body = card.querySelector(".body") || card;
    const now = japanNow();
    const nowMin = now.hour * 60 + now.minute;
    const closeMin = parseCloseTime(card);
    const f = getForecast(nowMin, closeMin);

    const box = document.createElement("div");
    box.className = "deli-forecast";
    box.innerHTML = `
      <div class="deli-forecast-head">
        <div class="deli-forecast-title">🛒 現在去超市適合嗎？</div>
        <div class="deli-forecast-time">日本時間 ${now.label}</div>
      </div>
      <div class="deli-forecast-main">${f.main}</div>
      <div class="deli-forecast-grid">
        <div class="deli-forecast-item">${f.deli}</div>
        <div class="deli-forecast-item">${f.sushi}</div>
        <div class="deli-forecast-item">${f.discount}</div>
        <div class="deli-forecast-item">${f.advice}</div>
      </div>
      <div class="deli-forecast-note">
        ※ 此為依日本當地時間與預估打烊時間計算的「熟食／折扣機率」，不是店內即時庫存。
      </div>
    `;
    body.appendChild(box);
  }

  function scan() {
    document.querySelectorAll(".card, article, .shop-card").forEach(renderCard);
  }

  addStyle();
  scan();

  // 頁面切換分類、重新渲染卡片時也自動補上
  const observer = new MutationObserver(() => scan());
  observer.observe(document.body, {childList:true, subtree:true});

  // 每分鐘更新一次
  setInterval(() => {
    document.querySelectorAll(".deli-forecast").forEach(x => x.remove());
    scan();
  }, 60000);
})();