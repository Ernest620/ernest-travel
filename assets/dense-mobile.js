
(()=>{
 const pop=window.ERNEST_POPULARITY||{};
 const grade=v=>v>=90?'S':v>=78?'A':v>=64?'B':'C';
 const foodRe=/餐飲|餐廳|咖啡|拉麵|壽司|海鮮|甜點|冰品|和菓子|燒肉|成吉思汗|咖哩|蕎麥|烏龍|居酒屋|食堂|蛋糕|麵包|Gelato|Food|Cafe/i;
 function nameOf(card){return (card.querySelector('.name')?.textContent||card.querySelector('h3')?.textContent||card.querySelector('.cnname')?.textContent||'').replace(/^⛩️\s*/,'').trim()}
 function process(root=document){
   root.querySelectorAll('.card:not([data-dense-done]),.shrineCard:not([data-dense-done])').forEach(card=>{
     card.dataset.denseDone='1'; const nm=nameOf(card); const text=card.textContent||'';
     if(foodRe.test(text)) card.classList.add('is-food');
     const v=Number(pop[nm]||0); if(v){
       const b=document.createElement('span');b.className='hot-tier';b.dataset.grade=grade(v);b.textContent='🔥'+grade(v);
       const target=card.querySelector('.badges')||card.querySelector('.shrineHead')||card.querySelector('.cardtop');
       if(target) target.appendChild(b);
     }
     if(card.classList.contains('shrineCard')){
       const body=card.querySelector(':scope > .shrineBody');
       if(body){const d=document.createElement('details');d.className='shrineDetails';const sm=document.createElement('summary');sm.textContent='詳細：祭神・御守・風景・附近美食';body.before(d);d.append(sm,body)}
     }
   });
 }
 const obs=new MutationObserver(()=>process()); obs.observe(document.documentElement,{subtree:true,childList:true});
 document.addEventListener('DOMContentLoaded',()=>{
   process();
   const main=document.querySelector('#summary')||document.querySelector('.summary');
   if(main && !document.querySelector('.dense-note')){const n=document.createElement('div');n.className='dense-note';n.innerHTML='📱 <b>手機密集模式</b>：名稱放大、類別縮小；預設以熱門度優先。卡片只顯示重點，點「完整資訊／詳細」再展開。';main.before(n)}
 });
})();