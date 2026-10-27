
(() => {
"use strict";

const PAGE = (location.pathname.split("/").pop() || "index.html").toLowerCase();
const PLACE_CONFIG = {
  sapporo: {
    key:"sapporo", label:"札幌", office:"016000", area:"石狩地方", areaCode:"016010",
    tempArea:"札幌", tempNote:"", detail:"https://www.jma.go.jp/bosai/forecast/#area_type=offices&area_code=016000"
  },
  otaru: {
    key:"otaru", label:"小樽", office:"016000", area:"後志地方", areaCode:"016030",
    tempArea:"倶知安", tempNote:"氣溫採後志地方代表點（倶知安）", detail:"https://www.jma.go.jp/bosai/forecast/#area_type=offices&area_code=016000"
  },
  hakodate: {
    key:"hakodate", label:"函館", office:"017000", area:"渡島地方", areaCode:"017010",
    tempArea:"函館", tempNote:"", detail:"https://www.jma.go.jp/bosai/forecast/#area_type=offices&area_code=017000"
  },
  toya: {
    key:"toya", label:"洞爺湖", office:"015000", area:"胆振地方", areaCode:"015010",
    tempArea:"室蘭", tempNote:"氣溫採胆振地方代表點（室蘭）", detail:"https://www.jma.go.jp/bosai/forecast/#area_type=offices&area_code=015000"
  }
};

const WARNING_NAMES = {
  "02":"暴風雪警報","03":"大雨警報","04":"洪水警報","05":"暴風警報","06":"大雪警報",
  "07":"波浪警報","08":"高潮警報","09":"土砂災害警報","10":"大雨注意報","12":"大雪注意報",
  "13":"風雪注意報","14":"雷注意報","15":"強風注意報","16":"波浪注意報","17":"融雪注意報",
  "18":"洪水注意報","19":"高潮注意報","20":"濃霧注意報","21":"乾燥注意報","22":"雪崩注意報",
  "23":"低溫注意報","24":"霜注意報","25":"著冰注意報","26":"著雪注意報"
};

function configsForPage(){
  if(PAGE === "" || PAGE === "index.html") return [PLACE_CONFIG.hakodate,PLACE_CONFIG.toya,PLACE_CONFIG.sapporo,PLACE_CONFIG.otaru];
  if(PAGE.includes("otaru")) return [PLACE_CONFIG.otaru];
  if(PAGE.includes("hakodate")) return [PLACE_CONFIG.hakodate];
  if(PAGE.includes("toya")) return [PLACE_CONFIG.toya];
  return [PLACE_CONFIG.sapporo];
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function ymd(v){try{return new Date(v).toLocaleDateString("zh-TW",{month:"numeric",day:"numeric",weekday:"short",timeZone:"Asia/Tokyo"})}catch(e){return v}}
function dateKey(v){try{return new Date(v).toLocaleDateString("sv-SE",{timeZone:"Asia/Tokyo"})}catch(e){return String(v).slice(0,10)}}
function emojiFor(text){
  text=String(text||"");
  if(/雷/.test(text))return "⛈️";
  if(/雪|吹雪/.test(text))return "🌨️";
  if(/雨/.test(text))return "🌧️";
  if(/晴/.test(text)&&/くもり|曇/.test(text))return "🌤️";
  if(/晴/.test(text))return "☀️";
  if(/くもり|曇/.test(text))return "☁️";
  return "🌡️";
}
async function getJSON(url){
  const r=await fetch(url,{cache:"no-store"});
  if(!r.ok)throw new Error("HTTP "+r.status);
  return r.json();
}
function findSeries(obj, field){
  return (obj?.timeSeries||[]).find(ts => (ts.areas||[]).some(a => Array.isArray(a[field])));
}
function findArea(ts, name, field){
  if(!ts)return null;
  return (ts.areas||[]).find(a => (a.area?.name||a.name)===name && (!field || Array.isArray(a[field])))
      || (ts.areas||[]).find(a => !field || Array.isArray(a[field]))
      || null;
}
function buildValueMap(ts, area, field){
  const map={};
  if(!ts||!area)return map;
  (ts.timeDefines||[]).forEach((t,i)=>{
    const k=dateKey(t),v=(area[field]||[])[i];
    if(v!==undefined && v!==null && String(v)!==""){
      (map[k]||(map[k]=[])).push(Number.isFinite(Number(v))?Number(v):v);
    }
  });
  return map;
}
function mergeWeeklyTemps(data,cfg,tempMin,tempMax){
  const week=data?.[1];
  if(!week)return;
  const ts=(week.timeSeries||[]).find(t=>(t.areas||[]).some(a=>Array.isArray(a.tempsMin)||Array.isArray(a.tempsMax)));
  if(!ts)return;
  const a=findArea(ts,cfg.tempArea);
  if(!a)return;
  (ts.timeDefines||[]).forEach((t,i)=>{
    const k=dateKey(t);
    if(a.tempsMin?.[i]!=="" && a.tempsMin?.[i]!=null) tempMin[k]=[Number(a.tempsMin[i])];
    if(a.tempsMax?.[i]!=="" && a.tempsMax?.[i]!=null) tempMax[k]=[Number(a.tempsMax[i])];
  });
}
async function forecast(cfg){
  const data=await getJSON(`https://www.jma.go.jp/bosai/forecast/data/forecast/${cfg.office}.json`);
  const short=data?.[0]||{};
  const weatherTs=findSeries(short,"weathers");
  const weatherArea=findArea(weatherTs,cfg.area,"weathers");
  if(!weatherTs||!weatherArea)throw new Error("找不到預報區資料");

  const popTs=findSeries(short,"pops"), popArea=findArea(popTs,cfg.area,"pops");
  const tempTs=findSeries(short,"temps"), tempArea=findArea(tempTs,cfg.tempArea,"temps");
  const popMap=buildValueMap(popTs,popArea,"pops");
  const rawTemp=buildValueMap(tempTs,tempArea,"temps");
  const tempMin={},tempMax={};
  Object.keys(rawTemp).forEach(k=>{
    const vals=rawTemp[k].filter(Number.isFinite);
    if(vals.length){tempMin[k]=[Math.min(...vals)];tempMax[k]=[Math.max(...vals)]}
  });
  mergeWeeklyTemps(data,cfg,tempMin,tempMax);

  const days=(weatherTs.timeDefines||[]).map((t,i)=>{
    const k=dateKey(t), pops=(popMap[k]||[]).filter(Number.isFinite);
    const mn=tempMin[k]?.[0],mx=tempMax[k]?.[0];
    return {
      date:t,
      weather:weatherArea.weathers?.[i]||"",
      wind:weatherArea.winds?.[i]||"",
      pop:pops.length?Math.max(...pops):null,
      min:Number.isFinite(mn)?mn:null,
      max:Number.isFinite(mx)?mx:null
    };
  }).slice(0,3);

  return {office:short.publishingOffice||"",report:short.reportDatetime||"",days};
}
function activeStatus(status){
  return status && !/解除|なし|発表なし/.test(status);
}
function parseLegacyWarning(data,cfg){
  if(!data || Array.isArray(data))return null;
  const result=[];
  for(const type of (data.areaTypes||[])){
    for(const a of (type.areas||[])){
      const name=a.area?.name||a.name||"", code=a.area?.code||a.code||"";
      if(name===cfg.area || code===cfg.areaCode){
        for(const w of (a.warnings||[])){
          if(activeStatus(w.status)) result.push({code:String(w.code||""),status:w.status});
        }
      }
    }
  }
  return {report:data.reportDatetime||"",headline:data.headlineText||"",items:result};
}
function parseR8Warning(data,cfg){
  if(!Array.isArray(data))return null;
  for(const rec of data){
    const groups=[
      ...(rec.warning?.class10Items||[]),
      ...(rec.warning?.class15Items||[])
    ];
    const item=groups.find(x=>String(x.areaCode)===cfg.areaCode);
    if(item){
      const items=(item.kinds||[]).filter(x=>activeStatus(x.status)).map(x=>({code:String(x.code||""),status:x.status}));
      return {report:rec.reportDatetime||"",headline:rec.headlineText||"",items};
    }
  }
  return {report:data[0]?.reportDatetime||"",headline:data[0]?.headlineText||"",items:[]};
}
async function warnings(cfg){
  const urls=[
    `https://www.jma.go.jp/bosai/warning/data/warning/${cfg.office}.json`,
    `https://www.jma.go.jp/bosai/warning/data/r8/${cfg.office}.json`
  ];
  for(const url of urls){
    try{
      const d=await getJSON(url);
      const p=Array.isArray(d)?parseR8Warning(d,cfg):parseLegacyWarning(d,cfg);
      if(p)return p;
    }catch(e){}
  }
  return {report:"",headline:"",items:[],unavailable:true};
}
function travelNotes(day){
  const n=[];
  const w=String(day?.weather||""),wind=String(day?.wind||"");
  if(/雪|吹雪/.test(w))n.push("可能有降雪／吹雪，注意積雪與路面結冰");
  if(/強く|非常に強く|暴風/.test(wind))n.push("風勢偏強，戶外與纜車／遊船行程需留意");
  if(Number.isFinite(day?.pop)&&day.pop>=60)n.push(`降水機率最高約 ${day.pop}%`);
  if(Number.isFinite(day?.min)&&day.min<=-5)n.push(`低溫約 ${day.min}°C，注意保暖與結冰`);
  return n;
}
function warningHTML(w){
  if(w.unavailable)return `<div class="weatherAlert advisory">⚠️ 警報資料暫時無法取得，請按「氣象廳詳細」確認。</div>`;
  if(!w.items?.length)return `<div class="weatherAlert ok">✅ 目前此預報區未讀取到發布中的警報／注意報。</div>`;
  const names=[...new Set(w.items.map(x=>WARNING_NAMES[x.code]||`警報／注意報 ${x.code}`))];
  const severe=w.items.some(x=>/^0[2-9]$/.test(x.code));
  return `<div class="weatherAlert ${severe?"warning":"advisory"}">${severe?"🚨":"⚠️"} ${esc(names.join("、"))}</div>`;
}
function dayHTML(d,i){
  const temps=(Number.isFinite(d.min)||Number.isFinite(d.max))
    ? `${Number.isFinite(d.min)?`最低 ${d.min}°`:""}${Number.isFinite(d.min)&&Number.isFinite(d.max)?" / ":""}${Number.isFinite(d.max)?`最高 ${d.max}°`:""}`
    : "氣溫資料依氣象廳代表點";
  return `<div class="weatherDay"><b>${i===0?"最近預報":ymd(d.date)}</b>｜${esc(d.weather||"—")}<br>${temps}${Number.isFinite(d.pop)?`｜降水最高 ${d.pop}%`:""}</div>`;
}
async function renderWeatherCard(cfg,el){
  el.innerHTML=`<div class="weatherCardTitle"><span>${esc(cfg.label)}</span><span class="weatherEmoji">⏳</span></div><div class="weatherMeta">讀取日本氣象廳資料中…</div>`;
  try{
    const [f,w]=await Promise.all([forecast(cfg),warnings(cfg)]);
    const d=f.days?.[0]||{};
    const notes=travelNotes(d);
    el.innerHTML=`
      <div class="weatherCardTitle"><span>${esc(cfg.label)}</span><span class="weatherEmoji">${emojiFor(d.weather)}</span></div>
      <div class="weatherMain">${esc(d.weather||"暫無預報文字")}</div>
      <div class="weatherMeta">${esc(cfg.area)}${cfg.tempNote?`｜${esc(cfg.tempNote)}`:""}<br>氣象廳發布：${f.report?new Date(f.report).toLocaleString("zh-TW",{timeZone:"Asia/Tokyo"}):"—"}</div>
      ${warningHTML(w)}
      ${notes.length?`<div class="weatherTravelNote">🧳 旅遊提醒：${esc(notes.join("；"))}</div>`:""}
      <div class="weatherDays">${(f.days||[]).map(dayHTML).join("")}</div>
      <a class="weatherDetails" href="${cfg.detail}" target="_blank" rel="noopener">日本氣象廳詳細 ↗</a>`;
  }catch(e){
    el.innerHTML=`<div class="weatherCardTitle"><span>${esc(cfg.label)}</span><span class="weatherEmoji">⚠️</span></div><div class="weatherAlert advisory">暫時無法讀取天氣資料。可直接開啟日本氣象廳確認。</div><a class="weatherDetails" href="${cfg.detail}" target="_blank" rel="noopener">日本氣象廳詳細 ↗</a>`;
  }
}
function insertTools(){
  const header=document.querySelector("header");
  if(!header)return;
  const section=document.createElement("section");
  section.className="travelTools";
  section.innerHTML=`
    <div class="travelToolPanel">
      <div class="travelToolTop">
        <h2>📍 旅途中快速工具</h2>
        <div class="travelTopActions"><a class="personalListBtn" href="shopping_list.html">🧾 我的購買清單</a></div>
        <div class="travelLocateRow">
          <button class="travelLocateBtn" id="travelLocateBtn" type="button">📍 定位我現在的位置</button>
          <span class="travelLocateStatus" id="travelLocateStatus">不會自動定位；按下按鈕才會要求瀏覽器位置權限。</span>
          <a class="travelCurrentMap" id="travelCurrentMap" target="_blank" rel="noopener">在地圖查看</a>
        </div>
      </div>
      <div class="weatherHead"><b>🌤️ 日本氣象廳天氣＋警示</b><div><span class="weatherSource">公開資料・不需 API Key</span> <button class="travelRefreshBtn" id="travelWeatherRefresh" type="button">重新整理</button></div></div>
      <div class="weatherGrid" id="travelWeatherGrid"></div>
    </div>`;
  header.insertAdjacentElement("afterend",section);

  const grid=section.querySelector("#travelWeatherGrid");
  const cfgs=configsForPage();
  function loadAll(){
    grid.innerHTML="";
    cfgs.forEach((cfg,i)=>{
      const wrap=document.createElement("details");
      wrap.className="weatherFold";
      // 手機預設只展開第一個；桌機四個都可一眼看到標題並自行展開
      if(i===0 && PAGE!=="index.html" && PAGE!=="") wrap.open=true;
      const summary=document.createElement("summary");
      summary.innerHTML=`<span>🌤️ ${esc(cfg.label)}</span><span class="weatherFoldHint">點一下展開／收合</span>`;
      const card=document.createElement("article");
      card.className="weatherCard";
      wrap.append(summary,card);
      grid.appendChild(wrap);
      renderWeatherCard(cfg,card);
    });
  }
  loadAll();
  section.querySelector("#travelWeatherRefresh").onclick=loadAll;

  const btn=section.querySelector("#travelLocateBtn"), status=section.querySelector("#travelLocateStatus"), map=section.querySelector("#travelCurrentMap");
  function showSaved(){
    try{
      const p=JSON.parse(localStorage.getItem("travelCurrentPosition")||"null");
      if(p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)){
        status.textContent=`上次定位：${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}｜精度約 ${Math.round(p.accuracy||0)}m｜${new Date(p.time).toLocaleString("zh-TW")}`;
        map.href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.lat+","+p.lng)}`;
        map.classList.add("show");
      }
    }catch(e){}
  }
  showSaved();
  btn.onclick=()=>{
    if(!navigator.geolocation){status.textContent="此瀏覽器不支援定位功能。";return}
    btn.disabled=true;btn.textContent="定位中…";status.textContent="請允許瀏覽器取得目前位置。";
    navigator.geolocation.getCurrentPosition(pos=>{
      const p={lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy,time:Date.now()};
      localStorage.setItem("travelCurrentPosition",JSON.stringify(p));
      status.textContent=`目前位置：${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}｜精度約 ${Math.round(p.accuracy||0)}m`;
      map.href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.lat+","+p.lng)}`;
      map.classList.add("show");
      btn.disabled=false;btn.textContent="📍 重新定位";
      window.dispatchEvent(new CustomEvent("travel-location-updated",{detail:p}));
    },err=>{
      const msg=err.code===1?"定位權限被拒絕":err.code===2?"目前無法取得位置":"定位逾時";
      status.textContent=msg+"。Netlify HTTPS 網站可直接使用，請檢查瀏覽器定位權限。";
      btn.disabled=false;btn.textContent="📍 再試一次定位";
    },{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
  };
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",insertTools);else insertTools();
})();
