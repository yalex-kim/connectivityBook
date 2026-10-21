#!/usr/bin/env python3
"""Bluetooth Core 사양서 웹판의 절 주소표(assets/bt-spec.js)를 만든다.

본문과 툴팁의 "[Vol 6] Part B §2.4" 같은 인용을 common.js가 이 표로 사양서 웹 페이지의 그 절에 링크한다.
사용: python3 tools/spec_links.py           # 사양서 웹판을 받아 표를 다시 만든다 (네트워크 필요, 사양 판이 바뀔 때만)
      python3 tools/spec_links.py --check   # 책에 적힌 인용이 모두 표에 있는가 (네트워크 없음, CI)
"""
import html, json, re, sys, pathlib, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/bt-spec.js'
VERSION = '6.3'
BASE = 'https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/Core_v6.3/out/en/'
# 사양서 웹판의 권(Volume) 폴더
VOLS = {'consolidated-table-of-contents,-acknowledgments,---core-configurations': 0, 'architecture,-change-history,-and-conventions': 1,
        'br-edr-controller': 2, 'host': 3, 'host-controller-interface': 4, 'low-energy-controller': 6, 'wireless-coexistence-signaling-and-interfaces': 7}
BOOKS = ['bluetooth', 'bluetooth-deep']
# 인용: [Vol 6] Part B §2.4 / §4.5.13.1·§4.5.13.2 / §4.4.6.1~§4.4.6.3 (common.js와 같은 규칙)
CITE = re.compile(r'\[Vol (\d)\] Part ([A-Z]+)((?:\s*[·~]?\s*§[0-9A-Z]+(?:\.[0-9A-Z]+)*)*)')


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'connectivityBook spec_links'}), timeout=60) as r:
        return r.read().decode('utf-8')


def build():
    first = get(BASE + 'low-energy-controller/link-layer-specification.html')
    pages = sorted({h for h in re.findall(r'href="\.\./([^"#]+\.html)', first) if h.split('/')[0] in VOLS and '/' in h})
    parts = {}
    for p in pages:
        s = get(BASE + p)
        title = html.unescape(re.search(r'<title>(.*?)</title>', s).group(1))
        m = re.match(r'Part ([A-Z]+)\s', title)
        if not m or 'No Longer Used' in title: continue
        key = f'{VOLS[p.split("/")[0]]}{m.group(1)}'
        secs = {}
        for sm in re.finditer(r'<section [^>]*\bid="(UUID-[0-9a-f-]+)"[^>]*>(.{0,600}?)</h\d>', s, re.S):
            n = re.search(r'class="formal-number">\s*([0-9A-Z]+(?:\.[0-9A-Z]+)*)\s*<', sm.group(2))
            if n: secs.setdefault(n.group(1), sm.group(1))
        parts[key] = {'p': p, 's': secs}
        print(key, p, len(secs))
    # 책에서 인용한 절만 남긴다 (전체는 180 KB). 새 인용이 생기면 --check가 알려 주고, 이 도구를 다시 돌린다
    used = cited()
    for k, v in parts.items(): v['s'] = {n: u[5:] for n, u in v['s'].items() if (k, n) in used}
    data = {'v': VERSION, 'base': BASE, 'parts': parts}
    OUT.write_text('/* Bluetooth Core 사양서 웹판의 절 주소표. tools/spec_links.py가 만든다 — 손으로 고치지 않는다 */\n'
                   f'window.BT_SPEC = {json.dumps(data, ensure_ascii=False, separators=(",", ":"))};\n')
    print('wrote', OUT.relative_to(ROOT), OUT.stat().st_size // 1024, 'KB')


def citations():
    """책에 적힌 인용을 (파일, 인용 글, Part 키, [절...])로 (common.js와 같은 규칙).
    본문·툴팁: "[Vol 6] Part B §2.4", "§4.5.13.1·§4.5.13.2", "§4.4.6.1~§4.4.6.3"처럼 Vol이 적힌 인용만.
    출처 줄(.spec-ref): 앞에서 정한 권·Part를 이어 쓰는 "Part E §2.4", "· 플러시 기한: §4.5.13.5"도."""
    sec = r'§([0-9A-Z]+(?:\.[0-9A-Z]+)*)'
    for b in BOOKS:
        for f in sorted((ROOT / b).glob('chapters/*.html')) + [ROOT / b / 'js/terms.js']:
            for line in html.unescape(f.read_text()).split('\n'):
                if 'class="spec-ref"' in line:
                    vol = key = None
                    for m in re.finditer(r'(?:\[Vol (\d)\] )?Part ([A-Z]+)\b|(?<![0-9A-Za-z])' + sec, line):
                        if m.group(2):
                            vol = m.group(1) or vol
                            key = vol and vol + m.group(2)
                        elif key: yield f, m.group(0), key, [m.group(3)]
                else:
                    for m in CITE.finditer(line):
                        yield f, m.group(0), m.group(1) + m.group(2), re.findall(sec, m.group(3))


def cited():
    return {(k, n) for _, _, k, secs in citations() for n in secs}


def check():
    data = json.loads(re.search(r'window\.BT_SPEC = (.*);', OUT.read_text()).group(1))['parts']
    bad = []
    for f, text, key, secs in citations():
        where = f'{f.relative_to(ROOT)}: {text}'
        if key not in data: bad.append(f'{where} (Part 없음)'); continue
        bad += [f'{where} (§{n} 없음)' for n in secs if n not in data[key]['s']]
    for x in bad: print(x)
    print('spec citations', 'OK' if not bad else f'{len(bad)} unresolved → python3 tools/spec_links.py')
    return not bad


if __name__ == '__main__':
    if '--check' in sys.argv: sys.exit(0 if check() else 1)
    build()
