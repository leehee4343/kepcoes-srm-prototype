"""Read all SRM PPTX slides and preserve Description evidence (no office dependency).
Run from any directory: python3 tools/audit_description_rules.py
The candidate flag is a review aid, not a claim that a business rule is implemented.
"""
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}
UI_WORDS = re.compile(r'노출|보여|보이|보임|활성|선택|입력.*달라|입력.*조정|마스킹|수정.*불가|조회만|한 명|하나의 업체|필수|경우|따라')


def inventory():
    slides = []
    for path in sorted((ROOT / 'docs/reference').glob('*.pptx')):
        with zipfile.ZipFile(path) as archive:
            names = sorted((name for name in archive.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', name)), key=lambda name: int(re.search(r'(\d+)\.xml', name)[1]))
            for name in names:
                blocks = []
                for shape in ET.fromstring(archive.read(name)).findall('.//p:sp', NS):
                    off = shape.find('.//a:xfrm/a:off', NS)
                    props = shape.find('.//p:cNvPr', NS)
                    if off is None or props is None:
                        continue
                    shape_name = props.get('name', '')
                    # Design notes occupy the right Description column in these 12 decks.
                    if int(off.get('x', 0)) < 7900000 or not ('TextBox' in shape_name or '텍스트' in shape_name):
                        continue
                    paragraphs = [''.join(t.text or '' for t in p.findall('.//a:t', NS)) for p in shape.findall('.//a:p', NS)]
                    if not any(paragraphs):
                        continue
                    blocks.append({'shape': shape_name, 'paragraphs': paragraphs,
                                   'ui_candidate': bool(UI_WORDS.search('\n'.join(paragraphs)))})
                slides.append({'file': path.name, 'slide': int(re.search(r'(\d+)\.xml', name)[1]), 'description': blocks})
    return slides


if __name__ == '__main__':
    slides = inventory()
    target = ROOT / 'docs/DESCRIPTION_UI_RULES.json'
    target.write_text(json.dumps({'note': 'PPTX Description 원문. UI 후보 분류는 검토 보조이며 구현 상태는 CONDITIONAL_UI_AUDIT.md 참조.', 'slides': slides}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(slides)} slides; {sum(bool(s["description"]) for s in slides)} slides with Description; {sum(any(b["ui_candidate"] for b in s["description"]) for s in slides)} UI candidate slides')
