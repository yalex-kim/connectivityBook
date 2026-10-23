#!/usr/bin/env python3
"""배포 직전에 페이지가 부르는 js·css 주소 끝에 ?v=<버전>을 붙인다 (저장소에는 커밋하지 않는다).

GitHub Pages는 파일을 10분 동안 캐시하게 하므로, 배포 뒤 새로고침해도 휴대폰이 예전 common.js를 쓸 수 있다.
새로고침하면 HTML은 다시 받으므로, HTML이 가리키는 주소가 배포마다 바뀌면 js·css도 새로 받는다.
사용: python3 tools/stamp_assets.py <버전>   # 예: git rev-parse --short HEAD
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
# 코드가 실행 중에 불러오는 파일들 (바뀌면 여기를 고친다. 못 찾으면 실패한다)
DYNAMIC = {
    'js/common.js': ['root + "js/terms.js"', 'root + "../" + ALSO.dir + "/js/terms.js"', '`${root}../assets/videos.js`', '`${root}../assets/bt-spec.js`'],
    'index.html': ['"assets/search-index.js"'],
}


def stamp(v):
    q = f'?v={v}'
    tag = re.compile(r'((?:src|href)="(?![a-z]+:|//)[^"?#]+\.(?:js|css))"')
    pages = [p for p in ROOT.rglob('*.html') if not {'video', 'node_modules', '.git'} & set(p.relative_to(ROOT).parts)]
    n = 0
    for p in pages:
        s = p.read_text(); t, k = tag.subn(rf'\1{q}"', s)
        if k: p.write_text(t); n += k
    for name, lits in DYNAMIC.items():
        files = [ROOT / name] if name == 'index.html' else sorted(ROOT.glob(f'*/{name}'))
        for f in files:
            if 'shared' in f.parts: continue
            s = f.read_text()
            for lit in lits:
                assert lit in s, f'{f.relative_to(ROOT)}: {lit} 없음'
                s = s.replace(lit, lit[:-1] + q + lit[-1]); n += 1
            f.write_text(s)
    print(f'stamped {n} references with {q}')


if __name__ == '__main__':
    stamp(sys.argv[1])
