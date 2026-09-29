"""Generate each page's 화면설계 Description drawer from the PPTX originals (DESIGN_GUIDE 5.15).

Input: docs/DESCRIPTION_MAP.json  {"pages": {"<module>/<page>.html": ["<slide id>", ...]}}
  - The listed slides are the page itself plus the popups the page opens, in slide order.
  - Items are numbered continuously across those slides (1, 2, 3 … for the page), so a
    popup slide that restarts at ① in the PPTX continues the page's numbering.
Output per page with Description:
  - popups/<page>/screenDescriptionGuide.html (text copied from the PPTX, never edited by hand)
  - the D button and the manifest entry in the page
Pages without Description get no D, no drawer and no manifest entry.

Target markers are written by hand next to the real UI element:
  <span class="description-target-marker" data-description-ref="<slide id>:<key>" aria-hidden="true"></span>
initDescriptionGuide() fills in the page's number, so a shared popup shows the right number on every page.

Run: python3 tools/build_description_guides.py   (then it rebuilds the popup bundles)
"""
from __future__ import annotations

import html
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from description_source import ROOT, entries, screen_name, slides  # noqa: E402

MODULES = ROOT / 'modules'
MAP_FILE = ROOT / 'docs/DESCRIPTION_MAP.json'
GUIDE_ID = 'screenDescriptionGuide'
BUTTON = ('<button type="button" class="description-floating-button" data-description-guide-toggle="screenDescriptionGuide" '
          'aria-controls="screenDescriptionGuide" aria-expanded="false" aria-label="화면설계 Description 보기" '
          'title="화면설계 Description 보기">D</button>')
BUTTON_RE = re.compile(r'\n*[ \t]*<button[^>]*class="description-floating-button"[^>]*>D</button>')
COMMENT_RE = re.compile(r'[ \t]*<!-- 화면설계 Description[^>]*-->\n?')
# 고객 통보 코드(MSG-###)가 있는 드로어의 화면은 핸드폰 목업용 메일·메시지 카탈로그를 불러옵니다(DESIGN_GUIDE 5.15).
MESSAGE_CODE_RE = re.compile(r'MSG-\d{3}')
# 메일/메시지 발송 내용 관리 화면은 카탈로그(참고 xlsx의 상황별 발송 데이터)로 목록·상세·수정을 채웁니다.
MESSAGE_CONTENT_PAGES = {'SRMMailContentManage', 'SRMMailContentDetail', 'SRMMailContentForm'}
CATALOG_TAG = '<script src="../../assets/scripts/message-catalog.js"></script>'
CATALOG_RE = re.compile(r'[ \t]*<script src="\.\./\.\./assets/scripts/message-catalog\.js"></script>\n')
MANIFEST_RE = re.compile(r'(<script type="application/json" class="external-modal-manifest">)(.*?)(</script>)', re.S)


def load_map() -> dict:
    return json.loads(MAP_FILE.read_text(encoding='utf-8'))


def page_items(slide_ids: list[str]) -> list[dict]:
    """Sections for one page: [{'slide': id, 'items': [{'ref', 'number', 'text'}]}]."""
    sections, counter = [], 0
    for sid in slide_ids:
        es = entries(sid)
        numbered = sorted((e for e in es if e['num'] is not None), key=lambda e: e['num'])
        unnumbered = [e for e in es if e['num'] is None]
        items = []
        for e in numbered + unnumbered:
            number = ''
            if e['num'] is not None:
                counter += 1
                number = str(counter)
            # Only line breaks that end the paragraph with no characters after them are not shown.
            items.append({'ref': f"{sid}:{e['key']}", 'number': number, 'text': e['text'].rstrip('\n'), 'original': e['num']})
        if items:
            sections.append({'slide': sid, 'items': items})
    return sections


def render_guide(sections: list[dict]) -> str:
    parts = []
    for index, section in enumerate(sections, start=1):
        sid = section['slide']
        s = slides()[sid]
        title = screen_name(sid) or '화면설계'
        rows = []
        for it in section['items']:
            rows.append(
                f'            <div class="description-mapping-item" data-description-ref="{it["ref"]}">\n'
                f'              <span class="description-mapping-number" aria-hidden="true">{it["number"]}</span>\n'
                f'              <pre class="description-source-text">{html.escape(it["text"], quote=False)}</pre>\n'
                f'            </div>')
        parts.append(
            f'        <section class="description-source-section" aria-labelledby="descriptionSection{index}">\n'
            f'          <h3 id="descriptionSection{index}">{html.escape(title, quote=False)}</h3>\n'
            f'          <p class="description-source-meta">화면설계 {s["module"]} · 슬라이드 {s["slide"]}</p>\n'
            f'          <div class="description-mapping-list">\n' + '\n'.join(rows) + '\n'
            f'          </div>\n'
            f'        </section>')
    body = '\n'.join(parts)
    return f'''<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>화면설계 Description</title>
  <link rel="stylesheet" href="../../../../assets/styles/style.css">
</head>
<body class="popup-document">
<!-- 자동 생성 파일: 직접 수정하지 말고 docs/DESCRIPTION_MAP.json 수정 후 python3 tools/build_description_guides.py 실행 -->
<div class="modal-backdrop description-guide-backdrop" id="{GUIDE_ID}" role="dialog" aria-modal="false" aria-labelledby="{GUIDE_ID}Title" aria-hidden="true">
    <div class="modal-dialog modal-lg description-modal-dialog">
      <div class="modal-header">
        <h2 class="modal-title" id="{GUIDE_ID}Title">화면설계 Description</h2>
        <button type="button" class="modal-close" aria-label="닫기">&times;</button>
      </div>
      <div class="modal-body description-modal-body">
{body}
      </div>
    </div>
  </div>
  <script src="../../../../assets/scripts/dashboard.js"></script>
</body>
</html>
'''


def is_guide(source: str) -> bool:
    return 'Description' in Path(source).stem or 'description' in Path(source).stem


def update_page(page: Path, guide_path: str | None, message_codes: bool = False) -> bool:
    text = page.read_text(encoding='utf-8')
    original = text
    text = CATALOG_RE.sub('', text)
    if message_codes:
        anchor = re.search(r'([ \t]*)<script src="\.\./\.\./assets/scripts/dashboard\.js"></script>', text)
        text = text[:anchor.start()] + anchor[1] + CATALOG_TAG + '\n' + text[anchor.start():]
    text = BUTTON_RE.sub('', text)
    text = COMMENT_RE.sub('', text)
    m = MANIFEST_RE.search(text)
    manifest = json.loads(m[2]) if m else []
    manifest = [s for s in manifest if not is_guide(s)]
    if guide_path:
        manifest.insert(0, guide_path)
    if m:
        if manifest:
            text = text[:m.start()] + m[1] + json.dumps(manifest, ensure_ascii=False) + m[3] + text[m.end():]
        else:
            text = text[:m.start()].rstrip(' \t') + text[m.end():].lstrip('\n')
            text = re.sub(r'\n[ \t]*\n(</body>)', r'\n\1', text)
    elif manifest:
        tag = f'  <script type="application/json" class="external-modal-manifest">{json.dumps(manifest, ensure_ascii=False)}</script>\n'
        text = text.replace('</body>', tag + '</body>', 1)
    if guide_path:
        if '</footer>' in text:
            text = text.replace('</footer>', '</footer>\n\n  ' + BUTTON, 1)
        else:
            anchor = re.search(r'[ \t]*<script src="(popups/popup-bundle\.js|\.\./\.\./assets/scripts/dashboard\.js)"></script>', text)
            text = text[:anchor.start()] + '  ' + BUTTON + '\n\n' + text[anchor.start():]
    text = re.sub(r'(>D</button>)\n(?:[ \t]*\n){2,}', r'\1\n\n', text)
    if text != original:
        page.write_text(text, encoding='utf-8')
        return True
    return False


def write_status(data: dict) -> None:
    """docs/DESCRIPTION_OVERLAY_STATUS.md — generated from DESCRIPTION_MAP.json, never edited by hand."""
    mapping, no_target = data['pages'], data.get('no_target', {})
    lines = ['# 화면설계 Description 적용 현황', '',
             '> 자동 생성 문서: `python3 tools/build_description_guides.py` 실행 시 `docs/DESCRIPTION_MAP.json`과 PPTX 원문으로 다시 만들어집니다. 직접 수정하지 마십시오.',
             '> 검증: `python3 tools/check_description_guides.py` (원문 문자 일치·번호 대응·누락 슬라이드), `tools/test_description_guides.cjs` (브라우저 런타임 번호 표시).', '',
             '## 적용 원칙', '',
             '- 드로어 문장은 PPTX Description 원문을 스크립트로 옮깁니다(맞춤법·띄어쓰기·오탈자 포함 변경·추가 금지). 문단 끝에 글자 없이 남은 줄바꿈만 표시하지 않습니다.',
             '- 원문 출처: 오른쪽 Description 칸의 텍스트 상자(번호는 PowerPoint 자동 번호)와 화면 안의 붉은 말풍선(번호는 연결선이 이어진 번호 원).',
             '- 한 페이지와 그 페이지가 여는 팝업을 한 드로어로 묶고, 슬라이드마다 1부터 다시 시작하는 번호를 이어서 매깁니다(페이지 자체 슬라이드 → 팝업 슬라이드 순서).',
             '- 목적지 번호는 `data-description-ref="슬라이드:원본번호"`만 가지며 표시 번호는 현재 페이지 드로어를 따릅니다. 공유 팝업의 목적지는 페이지마다 번호가 달라지고, 드로어에 없는 목적지는 숨깁니다.',
             '- Description 원문이 없는 화면에는 `D`·드로어·목적지를 만들지 않습니다.', '']
    total_pages = total_items = 0
    rows_by_module = {}
    for rel in sorted(mapping):
        sections = page_items(mapping[rel])
        items = [it for s in sections for it in s['items']]
        numbered = [it for it in items if it['number']]
        missing = no_target.get(rel, {})
        status = '원문 없음' if not items else ('완료(목적지 없음 %d)' % len(missing) if missing else '완료')
        if items:
            total_pages += 1
            total_items += len(items)
        module = rel.split('/')[0]
        slide_list = ', '.join(s.split('-', 1)[1] if s.count('-') == 1 else s.split('-', 2)[2] for s in mapping[rel])
        rows_by_module.setdefault(module, []).append(
            f"| `{rel.split('/')[1]}` | {slide_list} | {len(numbered)} | {len(items) - len(numbered)} | {status} |")
    lines += ['## 요약', '',
              f'- Description 드로어가 있는 화면: **{total_pages}개**, 드로어 항목(원문 문단): **{total_items}개**',
              f'- 매핑된 화면: {len(mapping)}개 (원문 없는 화면 포함), 제외한 슬라이드: {len(data.get("excluded_slides", {}))}개',
              f'- 목적지를 둘 수 없는 항목: {sum(len(v) for v in no_target.values())}개(아래 목록)', '']
    for module, rows in rows_by_module.items():
        lines += [f'## {module}', '', '| HTML | 슬라이드 | 번호 항목 | 번호 없는 항목 | 상태 |', '|---|---|---:|---:|---|', *rows, '']
    lines += ['## 목적지를 둘 수 없는 항목', '', '| HTML | 항목 | 사유 |', '|---|---|---|']
    for rel, refs in sorted(no_target.items()):
        for ref, reason in refs.items():
            lines.append(f'| `{rel}` | {ref} | {reason} |')
    lines += ['', '## 제외한 슬라이드', '', '| 슬라이드 | 사유 |', '|---|---|']
    lines += [f'| {sid} | {reason} |' for sid, reason in sorted(data.get('excluded_slides', {}).items())]
    lines += ['', '## 판단 기록 (PPTX 표기와 화면의 차이·해석)', '', '| 슬라이드 | 내용 |', '|---|---|']
    lines += [f'| {sid} | {text} |' for sid, text in data.get('notes', {}).items()]
    (ROOT / 'docs/DESCRIPTION_OVERLAY_STATUS.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main() -> None:
    mapping = load_map()['pages']
    only = sys.argv[1:]  # optional module prefixes, e.g. "00" "07-2"
    in_scope = lambda p: not only or any(p.parts[-2].startswith(m + '_') for m in only)
    pages = sorted(p for p in MODULES.glob('*/*.html') if in_scope(p))
    known = {p.relative_to(MODULES).as_posix() for p in MODULES.glob('*/*.html')}
    unknown = sorted(set(mapping) - known)
    if unknown:
        raise SystemExit(f'DESCRIPTION_MAP.json lists unknown pages: {unknown}')
    wanted_guides = set()
    changed = 0
    for page in pages:
        rel = page.relative_to(MODULES).as_posix()
        sections = page_items(mapping.get(rel, []))
        guide_rel = None
        if sections:
            guide_rel = f'popups/{page.stem}/{GUIDE_ID}.html'
            guide_file = page.parent / guide_rel
            guide_file.parent.mkdir(parents=True, exist_ok=True)
            content = render_guide(sections)
            if not guide_file.exists() or guide_file.read_text(encoding='utf-8') != content:
                guide_file.write_text(content, encoding='utf-8')
            wanted_guides.add(guide_file)
        codes = any(MESSAGE_CODE_RE.search(it['text']) for sec in sections for it in sec['items'])
        codes = codes or page.stem in MESSAGE_CONTENT_PAGES
        changed += update_page(page, guide_rel, codes)
    removed = 0
    for guide in MODULES.glob('*/popups/*/*.html'):
        if is_guide(guide.name) and guide not in wanted_guides and in_scope(guide.parents[2] / 'x.html'):
            guide.unlink()
            removed += 1
            if not any(guide.parent.iterdir()):
                guide.parent.rmdir()
    print(f'{len(wanted_guides)} drawers generated, {changed} pages updated, {removed} old drawer files removed')
    write_status(load_map())
    subprocess.run([sys.executable, str(ROOT / 'tools/build_popup_bundle.py')], check=True)


if __name__ == '__main__':
    main()
