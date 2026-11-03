#!/bin/sh
# 배포본 _site 를 만든다 — 사용: sh tools/build_site.sh [sha]   (기본: HEAD)
# 커밋된 파일 전체에서 점(.)으로 시작하는 경로와 cloudflare/ 를 뺀 것을 내보낸다 (예전 NAS nginx 와 같은 내용).
# js·css 주소에 커밋 번호를 붙인다 (tools/stamp_assets.py).
set -eu
cd "$(dirname "$0")/.."
SHA=$(git rev-parse --short=7 "${1:-HEAD}")
rm -rf _site
mkdir -p _site
git archive "$SHA" | tar -x -C _site
find _site -name '.*' -prune -exec rm -rf {} +
rm -rf _site/cloudflare
(cd _site && python3 -I tools/stamp_assets.py "$SHA")
cp cloudflare/_headers _site/
echo "built _site @ $SHA ($(find _site -type f | wc -l) files)"
