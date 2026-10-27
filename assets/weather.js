(()=>{
 const places=[
  {city:'札幌',office:'016000',area:'石狩地方',temp:'札幌',tempNote:'石狩地方｜氣溫代表點：札幌'},
  {city:'小樽',office:'016000',area:'後志地方',temp:'倶知安',tempNote:'後志地方｜氣溫代表點：倶知安'},
  {city:'函館',office:'017000',area:'渡島地方',temp:'函館',tempNote:'渡島地方｜氣溫代表點：函館'},
  {city:'洞爺湖',office:'015000',area:'胆振地方',temp:'室蘭',tempNote:'胆振地方｜氣溫代表點：室蘭'}
 ];
 const iconFor=s=>{s=String(s||'');if(/雷/.test(s))return'⛈️';if(/雪/.test(s))return'🌨️';if(/雨/.test(s))return'🌧️';if(/晴/.test(s)&&/くもり|曇/.test(s))return'🌤️';if(/晴/.test(s))return'☀️';if(/くもり|曇/.test(s))return'☁️';return'🌡️'};
 const clean=s=>String(s||'').replace(/[　\s]+/g,' ').trim();
 const dateKey=s=>String(s||'').slice(0,10);
 const fmtDate=s=>{const d=new Date(s);if(isNaN(d))return s;return `${d.getMonth()+1}/${d.getDate()}（${'日一二三四五六'[d.getDay()]}）`};
 const fmtTime=s=>{const d=new Date(s);if(isNaN(d))return s;return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
 function weatherLink(p){return `https://www.jma.go.jp/bosai/forecast/#area_type=offices&area_code=${p.office}`}
 function warningLink(p){return `https://www.jma.go.jp/bosai/warning/#area_type=offices&area_code=${p.office}`}
 function make(){
  // Keep exactly one current weather block and remove known legacy layouts.
  document.querySelectorAll('.ernest-weather').forEach((x,i)=>{if(i>0)x.remove()});
  ['#weather','#weatherCards','#weatherGrid','#weatherSection','#jmaWeather','.weather-section','.weather-grid-old','.legacy-weather','.old-weather','.weather-dashboard'].forEach(sel=>document.querySelectorAll(sel).forEach(x=>{if(!x.closest('.ernest-weather'))x.remove()}));
  if(document.querySelector('.ernest-weather'))return;
  const box=document.createElement('section');box.className='ernest-weather';box.innerHTML=`<div class="ernest-weather-card"><div class="ernest-weather-head"><b>🌦 日本氣象廳天氣＋警示</b><div class="ernest-weather-head-actions"><span>JMA 公開資料・免 API Key</span><button type="button" id="weatherRefresh">重新整理</button></div></div><div class="ernest-weather-strip">${places.map(p=>`<article class="weather-place" data-city="${p.city}"><button type="button" class="weather-place-head"><span class="weather-place-title"><span class="weather-icon">…</span><b>${p.city}</b></span><span class="weather-toggle">點一下展開／收合</span></button><div class="weather-summary"><div class="weather-mainline">載入日本氣象廳資料中…</div><div class="weather-area">${p.tempNote}</div></div><div class="weather-detail"><div class="weather-alert">警報注意報讀取中…</div><div class="weather-travel"></div><div class="weather-days"></div><div class="weather-issued"></div><div class="weather-links"><a href="${weatherLink(p)}">日本氣象廳詳細 ↗</a><a href="${warningLink(p)}">警報・注意報 ↗</a></div></div></article>`).join('')}</div></div>`;
  const nav=document.querySelector('.season-nav');if(nav)nav.after(box);else document.body.prepend(box);
  box.querySelectorAll('.weather-place-head').forEach(b=>b.addEventListener('click',()=>b.closest('.weather-place').classList.toggle('open')));
  box.querySelector('#weatherRefresh')?.addEventListener('click',()=>load(box,true));
  load(box,false);
 }
 function getArea(series,name){return (series?.areas||[]).find(a=>a?.area?.name===name)||null}
 function dailyPops(series,area){const a=getArea(series,area);if(!a)return{};const out={};(series.timeDefines||[]).forEach((t,i)=>{const k=dateKey(t),v=Number(a.pops?.[i]);if(Number.isFinite(v))out[k]=Math.max(out[k]??0,v)});return out}
 function dailyTemps(series,tempName){const a=getArea(series,tempName);if(!a)return{};const out={};(series.timeDefines||[]).forEach((t,i)=>{const k=dateKey(t),v=Number(a.temps?.[i]);if(!Number.isFinite(v))return;(out[k]??=[]).push(v)});return out}
 function parseForecast(j,p){const short=j?.[0]||{},weekly=j?.[1]||{},ts=short.timeSeries||[],wSeries=ts[0]||{},popSeries=ts[1]||{},tempSeries=ts[2]||{};const wa=getArea(wSeries,p.area);if(!wa)throw new Error('area');const pops=dailyPops(popSeries,p.area),temps=dailyTemps(tempSeries,p.temp);const rows=(wSeries.timeDefines||[]).map((t,i)=>{const k=dateKey(t),tv=temps[k]||[],low=tv.length?Math.min(...tv):null,high=tv.length?Math.max(...tv):null;return{date:t,weather:clean(wa.weathers?.[i]||''),wind:clean(wa.winds?.[i]||''),wave:clean(wa.waves?.[i]||''),pop:pops[k],low,high}}).slice(0,3);
  const wk=weekly.timeSeries||[];const wkW=getArea(wk[0],weekly.timeSeries?.[0]?.areas?.[0]?.area?.name||'');const wkT=(wk[1]?.areas||[]).find(a=>a?.area?.name===p.temp)||(wk[1]?.areas||[])[0];
  return{issued:short.reportDatetime||weekly.reportDatetime||'',rows,weeklyDates:wk[0]?.timeDefines||[],weeklyWeather:wkW?.weatherCodes||[],weeklyPops:wkW?.pops||[],weeklyTemp:wkT};
 }
 function travelTip(rows){const s=rows.map(x=>`${x.weather} ${x.wind}`).join(' ');const tips=[];if(/雷/.test(s))tips.push('雷雨風險：戶外展望台與纜車行程要留替代方案');if(/雪/.test(s))tips.push('雪天：鞋底防滑、移動時間多留 20–30 分鐘');if(/雨/.test(s))tips.push('降雨：地下街／室內景點可當備案');if(/非常に強く|強く|やや強く/.test(s))tips.push('風勢偏強：函館山、藻岩山、Sky Deck 等戶外點先看即時營運');if(!tips.length)tips.push('目前未從短期預報抓到明顯惡劣天氣關鍵字，出發前仍請再確認警報');return '🧳 '+tips.join('；')}
 function collectWarnings(obj,target,out=[]){if(Array.isArray(obj)){obj.forEach(v=>collectWarnings(v,target,out));return out}if(!obj||typeof obj!=='object')return out;const name=obj.area?.name||obj.name||'';if(name===target||name.includes(target)||target.includes(name)){
   const arr=obj.warnings||obj.kinds||obj.kind||[];const xs=Array.isArray(arr)?arr:[arr];xs.forEach(w=>{if(!w||typeof w!=='object')return;const st=w.status||w.state||'';if(st==='解除'||st==='解除済')return;const n=w.name||w.warningName||w.kind?.name||'';if(n)out.push(n)})}
  Object.values(obj).forEach(v=>collectWarnings(v,target,out));return out}
 async function getJson(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(String(r.status));return r.json()}
 async function load(box,manual){if(manual){const b=box.querySelector('#weatherRefresh');if(b){b.disabled=true;b.textContent='更新中…'}}await Promise.all(places.map(p=>loadOne(box,p)));const b=box.querySelector('#weatherRefresh');if(b){b.disabled=false;b.textContent='重新整理'}}
 async function loadOne(box,p){const el=box.querySelector(`[data-city="${p.city}"]`);try{
   const [fj,wj]=await Promise.all([getJson(`https://www.jma.go.jp/bosai/forecast/data/forecast/${p.office}.json`),getJson(`https://www.jma.go.jp/bosai/warning/data/warning/${p.office}.json`).catch(()=>null)]);
   const d=parseForecast(fj,p),r=d.rows[0]||{};el.querySelector('.weather-icon').textContent=iconFor(r.weather);el.querySelector('.weather-mainline').innerHTML=`<b>${clean(r.weather)||'日本氣象廳預報'}</b>${Number.isFinite(r.low)||Number.isFinite(r.high)?`<span>${r.low??'–'}° / ${r.high??'–'}°</span>`:''}${Number.isFinite(r.pop)?`<span>降水最高 ${r.pop}%</span>`:''}`;
   const warns=[...new Set(collectWarnings(wj,p.area,[]))];el.querySelector('.weather-alert').innerHTML=warns.length?`<b>⚠️ 警報／注意報</b><span>${warns.join('、')}</span>`:`<b>✅ 警報／注意報</b><span>目前未讀到有效警報；請以氣象廳頁面為準</span>`;
   el.querySelector('.weather-travel').textContent=travelTip(d.rows);
   el.querySelector('.weather-days').innerHTML=d.rows.map((x,i)=>`<div class="weather-day"><b>${i===0?'最近預報':fmtDate(x.date)}</b><div>${iconFor(x.weather)} ${clean(x.weather)||'—'}</div><small>${Number.isFinite(x.low)||Number.isFinite(x.high)?`最低 ${x.low??'–'}°／最高 ${x.high??'–'}°`:'氣溫資料依代表點'}${Number.isFinite(x.pop)?`｜降水最高 ${x.pop}%`:''}</small>${x.wind?`<small>風：${x.wind}</small>`:''}${x.wave?`<small>波浪：${x.wave}</small>`:''}</div>`).join('');
   el.querySelector('.weather-issued').textContent=`氣象廳發布：${fmtTime(d.issued)}｜${p.tempNote}`;
  }catch(e){el.querySelector('.weather-icon').textContent='🌡️';el.querySelector('.weather-mainline').textContent='日本氣象廳資料暫時無法載入';el.querySelector('.weather-alert').innerHTML='<b>⚠️ 請直接查看氣象廳</b><span>網路或跨網域限制可能暫時阻擋自動讀取。</span>';el.querySelector('.weather-travel').textContent='若自動讀取失敗，仍可使用下方日本氣象廳連結。';}
 }
 document.addEventListener('DOMContentLoaded',make);
})();