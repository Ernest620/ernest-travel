/* Shared pure purchase-list operations; no network or storage side effects. */
(function(root){
'use strict';
const normalize=s=>String(s??'').normalize('NFKC').toLocaleLowerCase().trim();
function filter(products,options={}){const q=normalize(options.q);return products.filter(x=>(!options.brand||x.brand===options.brand)&&(!options.kind||x.kind===options.kind)&&(!options.category||x.category===options.category)&&(!options.lens||x.lens===options.lens)&&(!q||normalize([x.name,x.brand,x.category,x.label,x.intro].join(' ')).includes(q)));}
function parse(raw){if(!raw||raw.version!==1||!raw.items||typeof raw.items!=='object'||Array.isArray(raw.items))throw new Error('備份格式不正確，原有清單未變更。');return raw.items;}
function record(value){if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('備份格式不正確，原有清單未變更。');const n=Number(value.qty);return {qty:Number.isFinite(n)?Math.min(99,Math.max(1,Math.floor(n))):1,bought:value.bought===true,note:String(value.note??'').slice(0,300)};}
function merge(current,incoming,known){const before=parse(current),after=parse(incoming),items=Object.fromEntries(Object.entries(before).map(([k,v])=>[k,record(v)]));let unknown=0,imported=0;for(const [id,v]of Object.entries(after)){if(!/^[a-z0-9_-]{1,80}$/.test(id)||!known.has(id)){unknown++;continue;}items[id]=record(v);imported++;}return {state:{version:1,items},unknown,imported};}
const api={filter,merge,normalize};if(typeof module==='object'&&module.exports)module.exports=api;else root.ERNEST_SHOPPING_CORE=api;
})(typeof window==='object'?window:globalThis);
