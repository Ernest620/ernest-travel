
(() => {
  'use strict';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));

  const textOf = (root, selectors) => {
    for(const s of selectors){
      const n=root.querySelector(s);
      if(n && n.textContent.trim()) return n.textContent.trim();
    }
    return '';
  };

  const clean = s => String(s||'').replace(/\s+/g,' ').trim();
  const keyOf = card => clean(card.dataset.query || textOf(card,['.richname-jp','.jp','h3','.name','.richname-cn','.cnname']));

  function same(item,key){
    if(!item || !key) return false;
    return [item.jp,item.cn,item.name,item.cnName,item.mapQuery]
      .filter(Boolean)
      .some(v => clean(v)===key || clean(v).includes(key) || key.includes(clean(v)));
  }

  function fromClusterList(list,key){
    if(!Array.isArray(list)) return null;
    for(const c of list){
      for(const ch of (c?.children||[])){
        if(Array.isArray(ch)){
          const o={cn:ch[0],jp:ch[1],category:ch[2],subtype:ch[3],desc:ch[4],photo:ch[5],
                   area:c.cn,cluster:c.cn,travel:c.travel,transport:c.transport,winter:c.winter,
                   history:c.history,source:c.source};
          if(same(o,key)) return o;
        }else if(ch && typeof ch==='object'){
          const o={...ch,area:ch.area||c.cn,cluster:c.cn,travel:ch.travel||c.travel,
                   transport:ch.transport||c.transport,winter:ch.winter||c.winter,
                   history:ch.history||c.history,source:ch.source||c.source};
          if(same(o,key)) return o;
        }
      }
    }
    return null;
  }

  function findSource(card){
    const key=keyOf(card);
    try{
      if(typeof FOOD!=='undefined'){
        const x=FOOD.find(v=>same(v,key)); if(x)return x;
      }
      if(typeof SNACKS!=='undefined'){
        const x=SNACKS.find(v=>same(v,key)); if(x)return x;
      }
      if(typeof SUPERMARKETS!=='undefined'){
        const x=SUPERMARKETS.find(v=>same(v,key)); if(x)return x;
      }
      if(typeof DATA!=='undefined'){
        const x=DATA.find(v=>same(v,key)); if(x)return x;
      }
      if(typeof TOYA_SUPERMARKETS!=='undefined'){
        const x=TOYA_SUPERMARKETS.find(v=>same(v,key)); if(x)return x;
      }
      if(typeof SHRINES!=='undefined'){
        const x=SHRINES.find(v=>same(v,key)); if(x)return x;
      }
      if(typeof DB!=='undefined' && DB){
        for(const k of ['food','snacks','shops','supermarkets','shrines']){
          const arr=DB[k];
          if(Array.isArray(arr)){const x=arr.find(v=>same(v,key));if(x)return x;}
        }
        const x=fromClusterList(DB.clusters,key); if(x)return x;
      }
      if(typeof CLUSTERS!=='undefined'){
        const x=fromClusterList(CLUSTERS,key); if(x)return x;
      }
    }catch(e){}
    return null;
  }

  function field(src, ...keys){
    for(const k of keys){
      const v=src?.[k];
      if(v!==undefined && v!==null && String(v).trim()) return v;
    }
    return '';
  }

  function splitMenu(v){
    if(Array.isArray(v)) return v.filter(Boolean).map(String);
    return String(v||'').split(/\s*[／/]\s*/).map(x=>x.trim()).filter(Boolean).slice(0,4);
  }

  function recommendationRows(src, card){
    if(Array.isArray(src?.recommendations)){
      return src.recommendations.slice(0,4).map(r=>Array.isArray(r)
        ? {name:r[0]||'推薦項目',price:r[1]||'',note:r[2]||''}
        : {name:r?.name||'推薦項目',price:r?.price||'',note:r?.note||''});
    }

    const menu=field(src,'recommendedMenu','menu','tip');
    let items=splitMenu(menu);
    if(!items.length){
      const r=textOf(card,['.richrec','.previewmenu','.menu']);
      const m=r.match(/(?:第一推薦|推薦餐點|推薦)[:：]\s*([^¥\n]+?)(?:\s+(¥[\d,～~–\-+]+[^\n]*))?(?:\n|$)/);
      if(m) items=[m[1].trim()];
    }
    if(!items.length) items=[field(src,'highlight','desc') || '店家招牌／主要特色'];

    const firstPrice=field(src,'priceText','price');
    const note=field(src,'priceKind','note');
    return items.slice(0,4).map((name,i)=>({
      name,
      price:i===0?firstPrice:'',
      note:i===0?note:''
    }));
  }

  function isFood(src, card){
    const s=[
      field(src,'kind','category','subtype'),
      textOf(card,['.badges','.tags','.richname-jp','.richname-cn'])
    ].join(' ');
    return field(src,'kind')==='food' ||
      /餐|食|咖啡|甜點|拉麵|壽司|鮨|海鮮|咖哩|洋食|麵|丼|居酒屋|燒肉|餃子|蕎麥|gelato|pizza|pasta|cafe/i.test(s);
  }

  function ratingHTML(card){
    const n=card.querySelector('.rating,.ratingbar');
    return n ? n.innerHTML : '';
  }

  function makeMapUrl(q){
    return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
  }
  function makeEmbed(q){
    return 'https://www.google.com/maps?q='+encodeURIComponent(q)+'&output=embed';
  }
  function imageSearch(q){
    return 'https://www.google.com/search?tbm=isch&q='+encodeURIComponent(q+' 店内 商品 料理 写真');
  }
  function tabelogSearch(q,direct){
    const u=String(direct||'');
    if(/^https:\/\/(?:s\.)?tabelog\.com\/.+\/\d+\/?(?:[?#].*)?$/.test(u)&&!/\/rstLst\//.test(u))return {url:u,direct:true};
    const k=encodeURIComponent(String(q||'').trim());
    return {url:'https://tabelog.com/rstLst/?sk='+k+'&sw='+k+'&keyword='+k+'&srchTg=2',direct:false};
  }

  function ensureModal(){
    if(document.getElementById('genericRichBackdrop')) return;
    const el=document.createElement('div');
    el.id='genericRichBackdrop';
    el.className='std-info-backdrop';
    el.setAttribute('aria-hidden','true');
    el.innerHTML=`
      <article class="std-info-modal" role="dialog" aria-modal="true" aria-label="完整圖文資訊">
        <div class="std-info-head">
          <div class="std-info-headrow">
            <div>
              <div id="stdArea" class="std-info-area"></div>
              <h2 id="stdName"></h2>
              <div id="stdCnName" class="std-info-cnname"></div>
              <div id="stdRating" class="std-info-rating"></div>
            </div>
            <button id="stdClose" class="std-info-close" aria-label="關閉">×</button>
          </div>
        </div>
        <div class="std-info-body">
          <img id="stdHero" class="std-info-hero" alt="">
          <div class="std-info-hint">店家／景點圖卡；實際菜單、價格與營業內容仍以現場或官方最新資訊為準。</div>

          <div class="std-info-field">
            <div class="std-info-label">🏷️ 販售類型</div>
            <div id="stdCat" class="std-info-value"></div>
          </div>
          <div class="std-info-field">
            <div class="std-info-label">📍 位置</div>
            <div id="stdLoc" class="std-info-value"></div>
          </div>
          <div class="std-info-field">
            <div class="std-info-label">🧾 店舖資訊／特色</div>
            <div id="stdSummary" class="std-info-value"></div>
          </div>
          <div class="std-info-field">
            <div id="stdMenuLabel" class="std-info-label">🍽️ 餐點／商品內容</div>
            <div id="stdMenu" class="std-info-value"></div>
          </div>
          <div class="std-info-field">
            <div id="stdRecLabel" class="std-info-label">⭐ 推薦菜單與單品價位</div>
            <div id="stdRecommendations" class="std-info-reclist"></div>
          </div>
          <div class="std-info-field">
            <div class="std-info-label">💴 價位參考</div>
            <div id="stdPrice" class="std-info-value std-info-price"></div>
          </div>

          <div class="std-info-decision">
            <div class="std-info-label">🧭 快速判斷</div>
            <div class="std-info-rank">
              <span id="stdTier" class="std-info-tier"></span>
              <span id="stdTwo" class="std-info-twoprice"></span>
              <span id="stdWalk" class="std-info-walk"></span>
            </div>
            <div id="stdReason" class="std-info-reason"></div>
          </div>

          <div class="std-info-field">
            <div class="std-info-label">☎️ 電話</div>
            <div id="stdPhone" class="std-info-value"></div>
          </div>

          <div class="std-info-field">
            <div class="std-info-label">🗺️ Google Maps 地點預覽</div>
            <iframe id="stdMapEmbed" class="std-info-map" loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>

          <div id="stdActions" class="std-info-actions"></div>
        </div>
      </article>`;
    document.body.appendChild(el);
    el.querySelector('#stdClose').onclick=closeModal;
    el.addEventListener('click',e=>{if(e.target===el)closeModal()});
  }

  function closeModal(){
    const b=document.getElementById('genericRichBackdrop');
    if(!b) return;
    b.classList.remove('show');
    b.setAttribute('aria-hidden','true');
    const map=b.querySelector('#stdMapEmbed');
    if(map) map.src='about:blank';
  }

  function openCard(card){
    ensureModal();
    const b=document.getElementById('genericRichBackdrop');
    const src=findSource(card)||{};
    const query=keyOf(card);
    const jp=field(src,'jp','name') || textOf(card,['.richname-jp','.jp','h3','.name']) || query;
    const cn=field(src,'cn','cnName') || textOf(card,['.richname-cn','.cnname','.name']) || jp;
    const area=field(src,'area','zone','cluster','parent') || textOf(card,['.badge','.tag']);
    const cat=field(src,'subtype','category','kind') || textOf(card,['.badges','.tags']) || '—';
    const location=field(src,'near','access','where','location','travel') ||
      textOf(card,['.richwalk','.chips','.parent']) || area || '請開 Google Maps 查看';
    const summary=field(src,'desc','summary','note','history') ||
      textOf(card,['.richdesc','.desc','.summary','.historyMini']) || '—';
    const menu=field(src,'recommendedMenu','menu','tip') ||
      textOf(card,['.richrec','.previewmenu','.menu']) || '—';
    const price=field(src,'priceText','price') ||
      (textOf(card,['.richrec','.previewmenu','.menu']).match(/¥[^\n]+/)||[])[0] || '依店家最新資訊';
    const phone=field(src,'phone') || '—';
    const food=isFood(src,card);
    const recs=recommendationRows(src,card);

    const img=card.querySelector('.pic img,.storevisual,.shrinePhoto,.card-img,img');
    const hero=b.querySelector('#stdHero');
    if(img?.src){hero.src=img.src;hero.alt=(cn||jp)+' 圖片';hero.style.display='block'}
    else{hero.removeAttribute('src');hero.style.display='none'}

    b.querySelector('#stdArea').textContent=area||'';
    b.querySelector('#stdName').textContent=jp;
    b.querySelector('#stdCnName').textContent=(cn&&cn!==jp)?cn:'';
    b.querySelector('#stdRating').innerHTML=ratingHTML(card);
    b.querySelector('#stdCat').textContent=cat;
    b.querySelector('#stdLoc').textContent=location;
    b.querySelector('#stdSummary').textContent=summary;
    b.querySelector('#stdMenuLabel').textContent=food?'🍽️ 餐點／商品內容':'🧾 內容／主要看點';
    b.querySelector('#stdMenu').textContent=menu;
    b.querySelector('#stdRecLabel').textContent=food?'⭐ 推薦菜單與單品價位':'⭐ 推薦／值得看';
    b.querySelector('#stdRecommendations').innerHTML=recs.map(r=>`
      <div class="std-info-recitem">
        <div class="std-info-recrow"><span>${esc(r.name)}</span><span class="std-info-recprice">${esc(r.price||'')}</span></div>
        ${r.note?`<div class="std-info-recnote">${esc(r.note)}</div>`:''}
      </div>`).join('');
    b.querySelector('#stdPrice').textContent=price;

    const two=textOf(card,['.richbudget','.twoprice']);
    const walk=textOf(card,['.richwalk','.walk']);
    const tier=textOf(card,['.tier']);
    b.querySelector('#stdTier').textContent=tier || (food?'餐飲':'景點／商店');
    b.querySelector('#stdTwo').textContent=two || (food?'👫 兩人預算依店家菜單':'');
    b.querySelector('#stdWalk').textContent=walk || `🚶 ${area||'此區域'}內約 5–15 分鐘`;
    b.querySelector('#stdReason').textContent=
      textOf(card,['.rankreason']) || field(src,'tip','note') ||
      (food?'可依推薦品項、預算與位置快速決定是否安排。':'可搭配位置與主要看點決定是否安排。');
    b.querySelector('#stdPhone').textContent=phone;

    const mapQ=field(src,'mapQuery') || jp || query;
    b.querySelector('#stdMapEmbed').src=makeEmbed(mapQ);

    const actions=b.querySelector('#stdActions');
    actions.innerHTML='';

    const map=document.createElement('a');
    map.href=makeMapUrl(mapQ); map.target='_blank'; map.rel='noopener';
    map.className='std-info-google'; map.textContent='📍 Google Maps';
    actions.appendChild(map);

    const official=field(src,'officialUrl','official','url','source');
    if(official){
      const a=document.createElement('a');
      a.href=official;a.target='_blank';a.rel='noopener';
      a.className='std-info-official';a.textContent='🌐 官方資料';
      actions.appendChild(a);
    }else{
      const cardOfficial=[...card.querySelectorAll('.actions a')].find(a=>!/Google Maps/i.test(a.textContent));
      if(cardOfficial?.href){
        const a=cardOfficial.cloneNode(true);a.className='std-info-official';actions.appendChild(a);
      }
    }

    if(food){
      const tb=document.createElement('a');
      const tl=tabelogSearch(jp,field(src,'ratingUrl'));tb.href=tl.url;tb.textContent=tl.direct?'🍽️ Tabelog 店家頁':'🍽️ Tabelog 店名搜尋';
      tb.target='_blank';tb.rel='noopener';tb.className='std-info-official';
      tb.textContent='🍽️ Tabelog';
      actions.appendChild(tb);
    }

    const photos=document.createElement('a');
    photos.href=imageSearch(mapQ);photos.target='_blank';photos.rel='noopener';
    photos.className='std-info-images';photos.textContent='🖼️ 最新照片';
    actions.appendChild(photos);

    b.classList.add('show');
    b.setAttribute('aria-hidden','false');
  }

  function addButtons(root=document){
    root.querySelectorAll('.card').forEach(card=>{
      // 狸小路／札幌地下街已有專用母版 modal，維持原本。
      if(card.querySelector('[data-open]') || card.querySelector('.rich-info-btn')) return;
      let actions=card.querySelector('.actions');
      if(!actions){
        actions=document.createElement('div');
        actions.className='actions';
        card.appendChild(actions);
      }
      const btn=document.createElement('button');
      btn.type='button';btn.className='btn primary rich-info-btn';
      btn.textContent='完整圖文／資訊';
      btn.onclick=()=>openCard(card);
      actions.insertBefore(btn,actions.firstChild);
    });
  }

  ensureModal();
  addButtons();
  new MutationObserver(ms=>{
    for(const m of ms)for(const n of m.addedNodes){
      if(n.nodeType!==1)continue;
      if(n.matches?.('.card')) addButtons(n.parentElement||document);
      else if(n.querySelector?.('.card')) addButtons(n);
    }
  }).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
})();
