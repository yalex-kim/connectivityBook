#!/usr/bin/env python3
"""본문이 인용한 [Vol N] Part X §절·Table·Figure·Appendix가 Core 사양 HTML 판에 실제로 있는지 확인하고,
인용별 절 제목을 출력한다(제목이 본문의 쓰임과 맞는지 사람이 훑어본다). 새 Core 판으로 기준을 올릴 때 쓴다.

사용: python3 tools/check_spec_refs.py 7.0            # bluetooth/ 폴더에서. 사양 HTML은 .spec-cache/에 받아 둔다
      python3 tools/check_spec_refs.py 7.0 --titles   # 인용별 제목 목록도 출력
네트워크가 필요하므로 CI에서는 돌리지 않는다.
"""
import html, json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PARTS_6 = {  # 사양 HTML 판의 파일 이름 (Core_v6.x)
    '0C': 'consolidated-table-of-contents,-acknowledgments,---core-configurations/version-history-and-acknowledgments.html',
    '1F': 'architecture,-change-history,-and-conventions/controller-error-codes.html',
    '1A': 'architecture,-change-history,-and-conventions/architecture.html', '1C': 'architecture,-change-history,-and-conventions/core-specification-change-history.html',
    '1E': 'architecture,-change-history,-and-conventions/general-terminology-and-interpretation.html', '2A': 'br-edr-controller/radio-physical-layer-specification.html',
    '2B': 'br-edr-controller/baseband-specification.html', '2C': 'br-edr-controller/link-manager-protocol-specification.html', '2H': 'br-edr-controller/security-specification.html',
    '3A': 'host/logical-link-control-and-adaptation-protocol-specification.html', '3B': 'host/service-discovery-protocol--sdp--specification.html', '3C': 'host/generic-access-profile.html',
    '3F': 'host/attribute-protocol--att-.html', '3G': 'host/generic-attribute-profile--gatt-.html', '3H': 'host/security-manager-specification.html',
    '4A': 'host-controller-interface/uart-transport-layer.html',
    '4E': 'host-controller-interface/host-controller-interface-functional-specification.html',
    '2G': 'br-edr-controller/sample-data.html',
    '6A': 'low-energy-controller/radio-physical-layer-specification.html', '6B': 'low-energy-controller/link-layer-specification.html', '6C': 'low-energy-controller/sample-data.html',
    '6D': 'low-energy-controller/message-sequence-charts.html', '6E': 'low-energy-controller/low-energy-link-layer-security.html', '6F': 'low-energy-controller/rfphy-test-modes.html',
    '6G': 'low-energy-controller/isochronous-adaptation-layer.html', '6H': 'low-energy-controller/channel-sounding.html',
    '7A': 'wireless-coexistence-signaling-and-interfaces/mws-coexistence-logical-signaling-specification.html',
    '7B': 'wireless-coexistence-signaling-and-interfaces/wireless-coexistence-interface-1--wci-1--transport-specification.html',
    '7C': 'wireless-coexistence-signaling-and-interfaces/wireless-coexistence-interface-2--wci-2--transport-specification.html',
}
# Core_v7.0 웹판에서 바뀐 파일 이름. 6.x 판과 비교할 때는 PARTS_6을 쓴다
PARTS = dict(PARTS_6, **{
    '1A': 'architecture,-change-history,-and-conventions/architecture--arch-.html',
    '2A': 'br-edr-controller/radiophysicallayer-rf--specification.html', '2B': 'br-edr-controller/baseband--bb--specification.html',
    '2C': 'br-edr-controller/link-manager-protocol-lmp--specification.html', '2H': 'br-edr-controller/security-sec--specification.html',
    '3A': 'host/logicallinkcontrol-andadaptationprotocol-l2cap--specification.html', '3C': 'host/genericaccess-profile-gap--specification.html',
    '3F': 'host/attributeprotocol-att--specification.html', '3G': 'host/genericattribute-profile-gatt--specification.html',
    '3H': 'host/securitymanager-sm--specification.html',
    '4A': 'host-controller-interface/uarttransport-layer-hci-uart--specification.html',
    '4E': 'host-controller-interface/host-controller-interface--hci--functional-specification.html',
    '6A': 'low-energy-controller/radiophysical-layer-rfphy--specification.html', '6B': 'low-energy-controller/linklayer-ll--specification.html',
    '6E': 'low-energy-controller/lowenergylinklayer-security-lesec--specification.html', '6F': 'low-energy-controller/rfphy-test-modes-specification.html',
    '6G': 'low-energy-controller/isochronous-adaptation-layer-isoal--specification.html', '6H': 'low-energy-controller/channelsounding-cs--specification.html',
    '7A': 'wireless-coexistence-signaling-and-interfaces/mws-coexistence-logical-signaling-mws--specification.html',
    '7B': 'wireless-coexistence-signaling-and-interfaces/wirelesscoexistence-transport-interface1-wci-1--specification.html',
    '7C': 'wireless-coexistence-signaling-and-interfaces/wireless-coexistence-transport-interface2-wci-2--specification.html',
})
REF = r'(?:§\s?[0-9A-Z]+(?:\.\d+)*|Table \d+\.\d+(?:\.\d+)?|Figure \d+\.\d+|Appendix [A-Z](?:\.\d+)*)'


def part(ver, key):
    cache = ROOT / '.spec-cache' / ver; cache.mkdir(parents=True, exist_ok=True); f = cache / f'{key}.html'
    if not f.exists():
        url = f'https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/Core_v{ver}/out/en/{(PARTS_6 if ver.startswith("6") else PARTS)[key]}'
        subprocess.run(['curl', '-sfL', '-A', 'Mozilla/5.0', '-o', str(f), url], check=True)
    s = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', f.read_text(), flags=re.S)
    heads = {}
    for _, h in re.findall(r'<h(\d)[^>]*>(.*?)</h\1>', s, re.S):
        h = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', h))).strip()
        m = re.match(r'(?:Appendix )?([0-9A-Z]+(?:\.\d+)*)\. (.*)', h)
        if m: heads[m.group(1)] = m.group(2)
    text = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s)))
    caps = {m.group(1) + ' ' + m.group(2): m.group(3).strip() for m in re.finditer(r'(Table|Figure) ([0-9A-Z]+\.\d+(?:\.\d+)?): (.{0,80})', text)}
    return heads, caps, text


def main():
    ver = sys.argv[1]; titles = '--titles' in sys.argv
    files = sorted((ROOT / 'chapters').glob('*.html')) + [ROOT / 'js/terms.js', ROOT / 'scripts/verify-factcheck.cjs', ROOT / 'index.html']
    cache, bad, seen = {}, [], {}
    for f in files:
        t = html.unescape(re.sub(r'<[^>]+>', '', re.sub(r'<script type="application/ld\+json">.*?</script>', '', f.read_text(), flags=re.S)))
        for m in re.finditer(r'\[Vol\.? ?(\d)\],? ?Part ([A-Z])((?:[ ,·/]*(?:' + REF + r'|note|·))*)', t):
            key = m.group(1) + m.group(2)
            if key not in PARTS: bad.append((f.name, key, '', 'part not in PARTS')); continue
            if key not in cache: cache[key] = part(ver, key)
            heads, caps, text = cache[key]
            for r in re.findall(REF, m.group(3)):
                r = r.replace('§ ', '§')
                if r.startswith('§'): title = heads.get(r[1:])
                elif r.startswith('Appendix'): title = heads.get(r.split()[1]) or (f'(본문에 {r} 있음)' if re.search(re.escape(r) + r' ?\.', text) else None)
                else: title = caps.get(r)
                if title is None: bad.append((f.name, key, r, 'not found'))
                else: seen.setdefault((key, r), title)
    print(f'Core {ver}: 인용 {len(seen)}곳 확인, 찾지 못한 것 {len(bad)}개')
    for b in bad: print('  ✗', *b)
    if titles:
        for (k, r), t in sorted(seen.items()): print(f'  [Vol {k[0]}] Part {k[1]} {r}: {t[:70]}')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
