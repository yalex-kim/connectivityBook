#!/usr/bin/env python3
"""예전 GitHub Pages 주소(yalex-kim.github.io/connectivityBook/…)를 새 주소로 넘기는 사이트를 만든다.

서재의 HTML 페이지마다 같은 경로에 작은 안내 페이지를 쓰고(canonical + meta refresh + JS 이동, 쿼리·#앵커 유지),
그 밖의 경로는 404.html 이 같은 규칙으로 넘긴다. CI 의 deploy 잡이 이 결과만 Pages 에 올린다.
사용: python3 tools/pages_redirect.py <출력 폴더>
"""
import html, pathlib, sys

NEW = 'https://connbook.yalex-k.com/'
PREFIX = '/connectivityBook/'
ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = {'video', 'node_modules', '.git', 'shared'}

PAGE = '''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>서재가 이사했습니다 · ConnectivityBook</title>
{canonical}<meta http-equiv="refresh" content="0; url={target}">
<script>
(function () {{
  var p = location.pathname, pre = '{prefix}';
  if (p.indexOf(pre) === 0) p = p.slice(pre.length); else if (p === pre.slice(0, -1)) p = ''; else p = p.replace(/^\\//, '');
  location.replace('{new}' + p + location.search + location.hash);
}})();
</script>
<style>
  body {{ margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b0d14; color: #eef0f6;
         font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif; }}
  main {{ max-width: 520px; padding: 24px; text-align: center; line-height: 1.7; }}
  h1 {{ font-size: 22px; margin: 0 0 8px; }}
  p {{ color: #9aa1b4; margin: 0 0 20px; }}
  a {{ color: #22d3ee; font-weight: 600; word-break: break-all; }}
</style>
</head>
<body>
<main>
  <h1>ConnectivityBook 서재가 이사했습니다</h1>
  <p>새 주소로 이동하는 중입니다. 자동으로 넘어가지 않으면 아래 링크를 눌러 주세요.<br>즐겨찾기도 새 주소로 바꿔 주세요.</p>
  <a href="{target}">{target_text}</a>
</main>
</body>
</html>
'''


def page(rel):
    target = NEW + rel
    return PAGE.format(canonical=f'<link rel="canonical" href="{html.escape(target)}">\n', target=html.escape(target),
                       target_text=html.escape(target), prefix=PREFIX, new=NEW)


def main(out):
    out = pathlib.Path(out).resolve()
    # 쓰기 전에 목록을 다 만든다. 출력 폴더가 저장소 안이면 그 안은 건너뛴다
    # (쓰면서 rglob 하면 방금 쓴 안내 페이지를 다시 주워 _redirect/_redirect/… 로 끝없이 들어간다)
    pages = []
    for p in sorted(ROOT.rglob('*.html')):
        if p.resolve().is_relative_to(out):
            continue
        rel = p.relative_to(ROOT)
        if SKIP & set(rel.parts):
            continue
        pages.append((p, rel))
    n = 0
    for p, rel in pages:
        url = rel.as_posix()
        if url == 'index.html':
            url = ''
        elif url.endswith('/index.html'):
            url = url[:-len('index.html')]
        dst = out / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(page(url))
        n += 1
    # 그 밖의 경로: 정해진 대상 없이 JS 로 경로를 옮긴다 (JS 가 없으면 서재 첫 화면 링크)
    (out / '404.html').write_text(PAGE.format(canonical='', target=NEW, target_text=NEW, prefix=PREFIX, new=NEW))
    (out / '.nojekyll').write_text('')
    print(f'redirect pages: {n} + 404.html → {out}')


if __name__ == '__main__':
    main(sys.argv[1])
