
(() => {
  'use strict';

  function esc(s){
    return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function normRec(r){
    if(!r) return null;
    if(Array.isArray(r)) return {name:r[0]||'推薦料理', price:r[1]||'', note:r[2]||''};
    return {name:r.name||'推薦料理', price:r.price||'', note:r.note||''};
  }
  function firstRec(x){
    try{
      if(typeof recs==='function'){
        const arr=recs(x)||[];
        if(arr.length) return normRec(arr[0]);
      }
    }catch(e){}
    return normRec([x.menu||'招牌料理／季節限定', x.price||'', x.summary||'']);
  }
  function render(rec){
    if(!rec) return '';
    return `
      <div class="hero-rec-kicker">🍽 第一推薦</div>
      <div class="hero-rec-main">${esc(rec.name)}${rec.price?`<span class="hero-rec-price">${esc(rec.price)}</span>`:''}</div>
      ${rec.note?`<div class="hero-rec-note">${esc(rec.note)}</div>`:''}
    `;
  }
  function ensureRecBox(){
    const backdrop=document.getElementById('backdrop');
    if(!backdrop) return null;
    let host = backdrop.querySelector('.modalhero') || backdrop.querySelector('#mPhoto') || backdrop.querySelector('img');
    if(!host) return null;
    const parent = host.parentElement;
    if(parent && getComputedStyle(parent).position==='static') parent.style.position='relative';
    let box = backdrop.querySelector('.modal-hero-rec');
    if(!box){
      box = document.createElement('div');
      box.className = 'modal-hero-rec';
      (parent || backdrop).appendChild(box);
    }
    return box;
  }
  function apply(id){
    try{
      if(!Array.isArray(window.STORES)) return;
      const x=window.STORES.find(v=>v.id===id);
      if(!x) return;
      const box=ensureRecBox();
      if(!box) return;
      box.innerHTML = render(firstRec(x));
    }catch(e){}
  }

  if(typeof window.openModal === 'function'){
    const original = window.openModal;
    window.openModal = function(id){
      const r = original.apply(this, arguments);
      setTimeout(()=>apply(id), 0);
      return r;
    };
  }

  const backdrop = document.getElementById('backdrop');
  if(backdrop){
    new MutationObserver(()=>{
      if(backdrop.classList.contains('show')){
        const title = document.getElementById('mName')?.textContent || '';
        const x = Array.isArray(window.STORES) ? window.STORES.find(v => v.name===title || v.cnName===title) : null;
        if(x) apply(x.id);
      }
    }).observe(backdrop,{attributes:true,attributeFilter:['class','aria-hidden']});
  }
})();
