from pathlib import Path
import re, sys
root=Path('.')
required=[
'index.html','itinerary_2027.html','tanukikoji.html','sapporo_underground.html','sapporo_2h.html',
'otaru_5km.html','hakodate_1h.html','lake_toya.html','centrair_4h.html','social_hokkaido.html',
'must_hokkaido.html','travel_overview.html','detail.html','assets/mobile-refresh.css','assets/mobile-refresh.js',
'scripts/update_social.py','data/social_daily.json']
errors=[]
for p in required:
    f=root/p
    if not f.exists() or f.stat().st_size==0: errors.append(f'missing/empty: {p}')
regions={
'tanukikoji.html':'STORES','sapporo_underground.html':'STORES','sapporo_2h.html':'CLUSTERS',
'otaru_5km.html':'DATA','hakodate_1h.html':'DB','lake_toya.html':'DB'}
for p,var in regions.items():
    s=(root/p).read_text('utf-8',errors='ignore')
    if 'assets/mobile-refresh.css' not in s or 'assets/mobile-refresh.js' not in s: errors.append(f'new UI missing: {p}')
    if not re.search(r'\b(?:const|let|var)\s+'+re.escape(var)+r'\b',s): errors.append(f'data var {var} missing: {p}')
c=(root/'centrair_4h.html').read_text('utf-8',errors='ignore')
if len(re.findall(r"\{g:'[SABC]'",c))!=15: errors.append('Centrair item count != 15')
if not ('11:20' in c and '12:50' in c): errors.append('HD127 schedule missing')
# Static local references; template-string refs are ignored.
htmls=list(root.glob('*.html'))
for f in htmls:
    s=f.read_text('utf-8',errors='ignore')
    for u in re.findall(r'(?:href|src)=[\"\']([^\"\'#{}$]+)',s,re.I):
        if re.match(r'^(?:https?:|mailto:|tel:|data:|javascript:|//)',u,re.I): continue
        u=u.split('?')[0].split('#')[0].lstrip('./').lstrip('/')
        if not u: continue
        p=root/u
        if not p.exists() and '.' not in Path(u).name and (root/(u+'.html')).exists(): continue
        if not p.exists(): errors.append(f'broken ref: {f.name} -> {u}')
if errors:
    print('\n'.join(errors)); sys.exit(1)
print(f'QA PASS: {len(required)} required files; {len(htmls)} HTML pages; Centrair 15 items; local refs OK')
