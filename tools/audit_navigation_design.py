"""Extract link formatting and Description evidence from every reference PPTX.
This inventories evidence; NAVIGATION_AUDIT.md records the reviewed destinations.
"""
import json
import re
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}

def text(node):
    return ''.join(t.text or '' for t in node.findall('.//a:t', NS))

def linked(node):
    return any(p.get('u', 'none') != 'none' or p.find('a:hlinkClick', NS) is not None
               for p in node.findall('.//a:rPr', NS))

slides = []
for file in sorted((ROOT / 'docs/reference').glob('*.pptx')):
    with zipfile.ZipFile(file) as archive:
        names = sorted((n for n in archive.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)),
                       key=lambda n: int(re.search(r'(\d+)\.xml', n)[1]))
        for name in names:
            root = ET.fromstring(archive.read(name))
            tables = []
            for table in root.findall('.//a:tbl', NS):
                rows = table.findall('a:tr', NS)
                if not rows:
                    continue
                columns = {}
                for row in rows[1:]:
                    for i, cell in enumerate(row.findall('a:tc', NS)):
                        if linked(cell):
                            columns.setdefault(i, [])
                            if text(cell) not in columns[i]:
                                columns[i].append(text(cell))
                if columns:
                    tables.append({'headers': [text(c) for c in rows[0].findall('a:tc', NS)],
                                   'linked_columns': [{'index': i, 'samples': values[:3]} for i, values in columns.items()]})
            descriptions = []
            for shape in root.findall('.//p:sp', NS):
                off = shape.find('.//a:xfrm/a:off', NS)
                if off is not None and int(off.get('x', 0)) >= 7900000 and text(shape).strip():
                    descriptions.append(text(shape))
            slides.append({'file': file.name, 'slide': int(re.search(r'(\d+)\.xml', name)[1]),
                           'linked_tables': tables, 'description': descriptions})
(ROOT / 'docs/NAVIGATION_DESIGN_EVIDENCE.json').write_text(json.dumps({'slides': slides}, ensure_ascii=False, indent=2)+'\n')
print(f'{len(slides)} slides inspected; {sum(bool(s["linked_tables"]) for s in slides)} slides with underlined table cells')
