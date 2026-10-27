#!/usr/bin/env python3
from __future__ import annotations
import json, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from pathlib import Path

UA='Mozilla/5.0 ErnestTravelSocialMonitor/1.0'
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data'/'social_daily.json'
QUERIES=[
 ('Reddit','北海道旅行','https://www.reddit.com/r/JapanTravelTips/search.rss?q=Hokkaido&restrict_sr=on&sort=new&t=week'),
 ('SearchIndex','Threads 北海道','https://news.google.com/rss/search?q='+urllib.parse.quote('site:threads.com 北海道 旅行')+'&hl=ja&gl=JP&ceid=JP:ja'),
 ('SearchIndex','Instagram 北海道','https://news.google.com/rss/search?q='+urllib.parse.quote('site:instagram.com 北海道 札幌 小樽 函館')+'&hl=ja&gl=JP&ceid=JP:ja'),
 ('SearchIndex','Dcard 北海道','https://news.google.com/rss/search?q='+urllib.parse.quote('site:dcard.tw 北海道 旅行')+'&hl=zh-TW&gl=TW&ceid=TW:zh-Hant'),
 ('SearchIndex','PTT 北海道','https://news.google.com/rss/search?q='+urllib.parse.quote('site:ptt.cc 北海道 Japan_Travel')+'&hl=zh-TW&gl=TW&ceid=TW:zh-Hant'),
]

def fetch(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/rss+xml,application/xml,text/xml,*/*'})
    with urllib.request.urlopen(req,timeout=20) as r:return r.read()

def text(el,name):
    x=el.find(name);return (x.text or '').strip() if x is not None else ''

def parse(platform,label,url):
    try:data=fetch(url)
    except Exception:return []
    try:root=ET.fromstring(data)
    except Exception:return []
    out=[]
    # RSS
    for i in root.findall('.//item')[:15]:
        title=text(i,'title'); link=text(i,'link'); pub=text(i,'pubDate')
        if title and link:out.append({'platform':platform,'query':label,'title':title,'url':link,'published':pub,'area':''})
    # Atom
    ns={'a':'http://www.w3.org/2005/Atom'}
    for e in root.findall('.//a:entry',ns)[:15]:
        title=(e.findtext('a:title',default='',namespaces=ns) or '').strip(); l=e.find('a:link',ns); link=l.get('href','') if l is not None else ''; pub=(e.findtext('a:updated',default='',namespaces=ns) or '')
        if title and link:out.append({'platform':platform,'query':label,'title':title,'url':link,'published':pub,'area':''})
    return out

def main():
    seen=set(); items=[]
    for platform,label,url in QUERIES:
        for x in parse(platform,label,url):
            k=x['url']
            if k in seen:continue
            seen.add(k);items.append(x)
    now=datetime.now(timezone(timedelta(hours=8))).isoformat(timespec='minutes')
    OUT.write_text(json.dumps({'updated_at':now,'mode':'daily-public-signal-monitor','items':items[:60]},ensure_ascii=False,indent=2),encoding='utf-8')
if __name__=='__main__':main()