#!/usr/bin/env python3
"""용어집(js/terms.js)의 표제어를 본문에 툴팁(<span class="term">)으로 표시한다.

규칙: 용어마다 (1) 책을 읽는 순서로 처음 나오는 곳, (2) 그 용어의 장(terms.js 4번째 칸)에서 처음 나오는 곳.
본문 문단(p, li)의 글자만 바꾸고 제목, 그림, 시뮬레이터, 퀴즈, 출처 줄, 코드, 링크 안은 건드리지 않는다.
이미 표시된 곳이 있으면 그대로 둔다.
사용: python3 tools/mark_terms.py [책 폴더...]   # 표시하기 (책을 안 주면 모든 책)
      python3 tools/mark_terms.py --check       # 빠진 곳이 있으면 실패(CI)
"""
import json, re, subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP_CLASS = {'sim', 'quiz-sec', 'quiz-q', 'whatif', 'spec-ref', 'keypoints', 'callout related', 'objectives', 'where', 'table-wrap'}
SKIP_TAG = {'h1', 'h2', 'h3', 'h4', 'code', 'a', 'figcaption', 'figure', 'button', 'label', 'table', 'pre', 'span', 'sub', 'sup', 'summary'}
VOID = {'br', 'img', 'input', 'meta', 'link', 'hr', 'source', 'wbr'}
HANGUL = re.compile(r'[가-힣]')


def load_terms(book, ns):
    out = subprocess.run(['node', '-e', f'global.window={{}};require({json.dumps(str(book / "js/terms.js"))});process.stdout.write(JSON.stringify([window.{ns}_TERMS, window.{ns}_TERM_ALIAS||{{}}]))'], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def keys_of(t):
    full = re.sub(r'\(.*?\)', '', t[0]).strip()
    ks = [full] + [p.strip() for p in re.split(r'·| / ', full) if p.strip() != full]
    return [k for k in ks if len(k) >= 2 or HANGUL.search(k)]


def find(text, key):
    """경계를 지키며 key의 첫 위치. 한글 key는 앞이 한글이면 안 되고, 영문·숫자 key는 앞뒤가 영숫자면 안 된다"""
    start = 0
    while True:
        i = text.find(key, start)
        if i < 0: return -1
        a, b = text[i - 1] if i else ' ', text[i + len(key)] if i + len(key) < len(text) else ' '
        if HANGUL.search(key[0]): ok = not HANGUL.search(a)
        else: ok = not (a.isalnum() or a in '-_') and not (b.isascii() and (b.isalnum() or b in '-_'))
        if ok and (not HANGUL.search(key[-1]) or True): return i
        start = i + 1


def segments(html):
    """본문 안 '표시해도 되는' 글자 조각의 (시작, 끝) 목록을 문서 순서로"""
    m0 = html.find('<main'); m1 = html.find('</main>')
    out, stack, i = [], [], m0
    tag_re = re.compile(r'<(/?)([a-zA-Z0-9]+)([^>]*?)(/?)>|<!--.*?-->', re.S)
    while i < m1:
        m = tag_re.search(html, i, m1)
        j = m.start() if m else m1
        if j > i and stack and not any(s[2] for s in stack) and any(s[0] in ('p', 'li') for s in stack):
            out.append((i, j))
        if not m: break
        i = m.end()
        if m.group(0).startswith('<!--'): continue
        close, tag, attrs, selfc = m.group(1), m.group(2).lower(), m.group(3), m.group(4)
        if tag in ('script', 'style', 'svg') and not close:
            end = html.find(f'</{tag}>', i); i = end + len(f'</{tag}>'); continue
        if close:
            while stack:
                t = stack.pop()
                if t[0] == tag: break
            continue
        if tag in VOID or selfc: continue
        cls = re.search(r'class="([^"]*)"', attrs); cls = cls.group(1) if cls else ''
        skip = tag in SKIP_TAG or cls in SKIP_CLASS or any(c in SKIP_CLASS for c in cls.split()) or 'callout related' in cls
        stack.append((tag, cls, skip))
    return out


def mark(book_dir, dry=False):
    book = ROOT / book_dir; cfg = json.loads((book / 'book.json').read_text()); ns = cfg['ui']['ns']
    terms, _ = load_terms(book, ns)
    order = re.findall(r'slug: "([\w-]+)"', (book / 'js/common.js').read_text())
    pages = {s: (book / 'chapters' / f'{s}.html').read_text() for s in order if s != 'glossary'}
    added = 0; seen_book = set()
    # 이미 표시된 용어(책 전체·장별)
    def marked_in(s): return {re.sub(r'\s+', '', m).lower() for m in re.findall(r'<span class="term">([^<]+)</span>', s)}
    for slug in order:
        if slug == 'glossary': continue
        html = pages[slug]; have = marked_in(html)
        for t in terms:
            ks = keys_of(t); norm = {re.sub(r'\s+', '', k).lower() for k in ks + [t[0], t[1]]}
            if norm & have: seen_book.add(t[0]); continue
            if t[0] in seen_book and t[3] != slug: continue
            best = None
            for a, b in segments(html):
                seg = html[a:b]
                for k in sorted(ks, key=len, reverse=True):
                    p = find(seg, k)
                    if p >= 0 and (best is None or a + p < best[0]): best = (a + p, k)
                if best: break
            if not best: continue
            pos, k = best
            html = html[:pos] + f'<span class="term">{k}</span>' + html[pos + len(k):]
            have |= norm; seen_book.add(t[0]); added += 1
        pages[slug] = html
    if not dry:
        for s, h in pages.items(): (book / 'chapters' / f'{s}.html').write_text(h)
    print(book_dir, 'added' if not dry else 'would add', added)
    return added


if __name__ == '__main__':
    check = '--check' in sys.argv
    books = [a for a in sys.argv[1:] if not a.startswith('--')] or sorted(p.parent.name for p in ROOT.glob('*/book.json'))
    n = sum(mark(b, dry=check or '--dry' in sys.argv) for b in books)
    if check and n:
        print('툴팁이 빠진 용어가 있습니다 → python3 tools/mark_terms.py'); sys.exit(1)
