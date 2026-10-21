#!/usr/bin/env python3
"""서재 첫 화면의 통합 검색 색인(assets/search-index.js)을 만든다.

책마다 용어집(js/terms.js), 장 목록(js/common.js의 CHAPTERS), 장 안의 절 제목(h2)과 영상 목록(assets/videos.js)을 모은다.
사용: python3 tools/build_search.py          # 색인 쓰기
      python3 tools/build_search.py --check  # 색인이 낡았으면 실패(CI)
"""
import json, pathlib, re, subprocess, sys
from urllib.parse import quote
from html import unescape

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/search-index.js'
strip = lambda s: re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]+>', '', s))).strip()


def build():
    items = []
    for bj in sorted(ROOT.glob('*/book.json')):
        cfg = json.loads(bj.read_text()); book = bj.parent; d = book.name
        if 'ui' not in cfg: continue
        ns = cfg['ui']['ns']
        terms = json.loads(subprocess.run(['node', '-e', f'global.window={{}};require({json.dumps(str(book / "js/terms.js"))});process.stdout.write(JSON.stringify(window.{ns}_TERMS))'],
                                          capture_output=True, text=True, check=True).stdout)
        js = (book / 'js/common.js').read_text()
        chapters = [dict(zip(('slug', 'num', 'title', 'desc'), m.groups())) for m in re.finditer(r'\{ slug: "([\w-]+)",\s*num: "(\d+)",[^}]*?title: "([^"]+)",\s*desc: "([^"]+)"', js)]
        titles = {c['slug']: c for c in chapters}
        for c in chapters:
            items.append({'b': d, 'k': 'ch', 't': f"{c['num']} {c['title']}", 'd': c['desc'], 'u': f"{d}/chapters/{c['slug']}.html"})
            html = (book / 'chapters' / f"{c['slug']}.html").read_text()
            for m in re.finditer(r'<section id="([\w-]+)"[^>]*>\s*<h2>(.*?)</h2>', html, re.S):
                if m.group(1) in ('summary', 'quiz'): continue
                items.append({'b': d, 'k': 'sec', 't': strip(m.group(2)), 'd': f"{c['num']}장 {c['title']}", 'u': f"{d}/chapters/{c['slug']}.html#{m.group(1)}"})
        for ko, en, desc, slug in terms:
            c = titles.get(slug)
            items.append({'b': d, 'k': 'term', 't': ko, 'e': en, 'd': desc, 'u': f"{d}/chapters/glossary.html?q={quote(ko)}", 'c': f"{d}/chapters/{slug}.html", 'cn': f"{c['num']}장" if c else ''})
    # 영상(assets/videos.js): 제목·소개로 찾고, 누르면 유튜브로. 이어진 장과 썸네일이 실제로 있는지 확인한다
    vids = json.loads(subprocess.run(['node', '-e', f'global.window={{}};require({json.dumps(str(ROOT / "assets/videos.js"))});process.stdout.write(JSON.stringify(window.YB_VIDEOS))'],
                                     capture_output=True, text=True, check=True).stdout)
    for v in vids:
        for c in v.get('chapters', []):
            assert (ROOT / c['path']).exists(), f"videos.js {v['id']}: 없는 장 {c['path']}"
        assert (ROOT / v['thumb']).exists(), f"videos.js {v['id']}: 없는 썸네일 {v['thumb']}"
        book = v['chapters'][0]['path'].split('/')[0] if v.get('chapters') else ''
        items.append({'b': book, 'k': 'video', 't': v['title'], 'e': v.get('subtitle', ''), 'd': v['summary'], 'u': f"https://www.youtube.com/watch?v={v['youtube']}"})
    return '/* tools/build_search.py가 만든다. 직접 고치지 말 것. */\nwindow.YB_SEARCH = ' + json.dumps(items, ensure_ascii=False, separators=(',', ':')) + ';\n'


if __name__ == '__main__':
    text = build()
    if '--check' in sys.argv:
        if not OUT.exists() or OUT.read_text() != text:
            print('assets/search-index.js is stale → python3 tools/build_search.py'); sys.exit(1)
        print('search index up to date')
    else:
        OUT.write_text(text); print('wrote', OUT.relative_to(ROOT), len(text) // 1024, 'KB')
