#!/usr/bin/env python3
"""책마다 복사해 쓰는 공통 코드(js/common.js, css/style.css)를 shared/의 원본에서 만든다.

- 원본: shared/common.js, shared/style.css (자리 표시자 @@…@@)
- 책마다 다른 값: <책>/book.json의 "ui" (전역 이름, 짧은 이름, 푸터 문구, 출처 상자 이름, 색, 시리즈)
- 장 목록(CHAPTERS)은 책의 js/common.js에 있는 것을 그대로 둔다(@book-chapters-begin ~ end)

사용: python3 tools/sync_shared.py          # 모든 책에 쓰기
      python3 tools/sync_shared.py --check  # 원본과 다른 책이 있으면 실패(CI)
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHARED = ROOT / 'shared'
BEGIN = '  // @book-chapters-begin'
END = '  // @book-chapters-end\n'


def books():
    return sorted(p.parent for p in ROOT.glob('*/book.json') if 'ui' in json.loads(p.read_text()))


def chapters_block(js):
    """책의 common.js에서 장 목록을 꺼낸다(표시가 없으면 첫 동기화: const CHAPTERS = [ … ]; 를 찾는다)"""
    if BEGIN in js:
        i = js.index(BEGIN); i = js.index('\n', i) + 1
        return js[i:js.index(END, i)]
    i = js.index('  const CHAPTERS = ['); j = js.index('\n  ];\n', i) + len('\n  ];\n')
    return js[i:j]


def render(book):
    cfg = json.loads((book / 'book.json').read_text()); ui = cfg['ui']
    common = {'@@BOOK@@': cfg['title'], '@@SHORT@@': ui['short'], '@@NS@@': ui['ns'], '@@ns@@': ui['prefix'], '@@DIR@@': book.name}
    js = (SHARED / 'common.js').read_text()
    for k, v in {**common, '@@FOOTER@@': ui['footer'], '@@LOGO@@': ui['logo'], '@@SERIES@@': json.dumps(ui.get('series'), ensure_ascii=False), '@@TERMS_ALSO@@': json.dumps(ui.get('termsAlso'), ensure_ascii=False)}.items():
        js = js.replace(k, v)
    cur = (book / 'js/common.js').read_text()
    i = js.index(BEGIN); i = js.index('\n', i) + 1
    js = js[:i] + chapters_block(cur) + js[i:]
    css = (SHARED / 'style.css').read_text()
    L, D = ui['colors']['light'], ui['colors']['dark']
    for k, v in {**common, '@@SPEC_LABEL@@': ui['specLabel'],
                 '@@ACCENT@@': L['accent'], '@@ACCENT_SOFT@@': L['accent-soft'], '@@ACCENT2@@': L['accent-2'], '@@ACCENT2_SOFT@@': L['accent-2-soft'],
                 '@@D_ACCENT@@': D['accent'], '@@D_ACCENT_SOFT@@': D['accent-soft'], '@@D_ACCENT2@@': D['accent-2'], '@@D_ACCENT2_SOFT@@': D['accent-2-soft']}.items():
        css = css.replace(k, v)
    for name, text in (('js', js), ('css', css)):
        left = re.findall(r'@@\w+@@', text)
        assert not left, f'{book.name}: unfilled {left}'
    return {'js/common.js': js, 'css/style.css': css}


def main():
    check = '--check' in sys.argv
    bad = []
    for book in books():
        for rel, text in render(book).items():
            p = book / rel
            if not p.exists() or p.read_text() != text:
                if check: bad.append(f'{book.name}/{rel}')
                else: p.write_text(text); print('updated', f'{book.name}/{rel}')
    if bad:
        print('shared/와 다른 파일:', ', '.join(bad), '\n→ python3 tools/sync_shared.py 를 실행하세요 (책 파일을 직접 고쳤다면 shared/로 옮기세요)')
        sys.exit(1)
    if check: print('shared code in sync:', ', '.join(b.name for b in books()))


if __name__ == '__main__':
    main()
