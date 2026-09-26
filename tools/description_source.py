"""Read 화면설계 Description text and red number markers from the reference PPTX files.

The Description drawer text must be the PPTX original character for character, so the
HTML is generated from this module instead of being copied by hand (DESIGN_GUIDE 5.15).

- Description: text boxes in the right column (x >= 7,900,000 EMU). Item numbers come from
  PowerPoint auto numbering (a:buAutoNum, ①②③), not from the text. <a:br/> is a line break.
- Callout: red-filled (C00000) rectangles drawn inside the wireframe; numbered by the nearest marker.
- Marker: red-filled (C00000) ellipse whose text is the number (e.g. "1", "1’").

Slide ids are "{module}-{slide}", e.g. "00-4", "07-2-31".
"""
from __future__ import annotations

import re
import zipfile
import xml.etree.ElementTree as ET
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
P = 'http://schemas.openxmlformats.org/presentationml/2006/main'
NS = {'a': A, 'p': P}
DESC_X = 7_900_000
RED = 'C00000'
EMU_PER_UNIT = 10_000  # reported coordinates are in 1/100 cm-ish units for readability


def module_of(path: Path) -> str:
    return re.search(r'\((\d+(?:-\d)?)\.', path.name)[1]


def para_text(p) -> str:
    out = []
    for el in p:
        tag = el.tag.split('}')[1]
        if tag in ('r', 'fld'):
            t = el.find('a:t', NS)
            out.append((t.text or '') if t is not None else '')
        elif tag == 'br':
            out.append('\n')
    return ''.join(out)


def _walk(node, transform):
    """Yield (sp, x, y, w, h) with group transforms applied."""
    for child in node:
        tag = child.tag.split('}')[1]
        if tag == 'sp':
            xfrm = child.find('p:spPr/a:xfrm', NS)
            if xfrm is None:
                continue
            off, ext = xfrm.find('a:off', NS), xfrm.find('a:ext', NS)
            x, y = transform(int(off.get('x')), int(off.get('y')))
            x2, y2 = transform(int(off.get('x')) + int(ext.get('cx')), int(off.get('y')) + int(ext.get('cy')))
            yield child, x, y, x2 - x, y2 - y
        elif tag == 'grpSp':
            g = child.find('p:grpSpPr/a:xfrm', NS)
            if g is None:
                yield from _walk(child, transform)
                continue
            off, ext = g.find('a:off', NS), g.find('a:ext', NS)
            choff, chext = g.find('a:chOff', NS), g.find('a:chExt', NS)
            ox, oy, cx, cy = int(off.get('x')), int(off.get('y')), int(ext.get('cx')), int(ext.get('cy'))
            chx, chy, chcx, chcy = int(choff.get('x')), int(choff.get('y')), int(chext.get('cx')) or 1, int(chext.get('cy')) or 1

            def inner(px, py, ox=ox, oy=oy, cx=cx, cy=cy, chx=chx, chy=chy, chcx=chcx, chcy=chcy):
                return transform(ox + (px - chx) * cx // chcx, oy + (py - chy) * cy // chcy)
            yield from _walk(child, inner)


def _fill(sp):
    c = sp.find('p:spPr/a:solidFill/a:srgbClr', NS)
    return c.get('val', '').upper() if c is not None else ''


def _geom(sp):
    g = sp.find('p:spPr/a:prstGeom', NS)
    return g.get('prst') if g is not None else ''


def _links(root) -> dict:
    """{shape id: [connected shape ids]} from connector lines (stCxn/endCxn)."""
    links = {}
    for c in root.iter(f'{{{P}}}cxnSp'):
        st, en = c.find('.//a:stCxn', NS), c.find('.//a:endCxn', NS)
        if st is None or en is None:
            continue
        links.setdefault(st.get('id'), []).append(en.get('id'))
        links.setdefault(en.get('id'), []).append(st.get('id'))
    return links


def read_slide(root) -> dict:
    tree = root.find('p:cSld/p:spTree', NS)
    links = _links(root)
    marker_by_id = {}
    crumb, desc, callouts, markers, others = '', [], [], [], []
    for sp, x, y, w, h in _walk(tree, lambda px, py: (px, py)):
        nv = sp.find('p:nvSpPr/p:cNvPr', NS)
        name, shape_id = nv.get('name', ''), nv.get('id')
        paras = sp.findall('p:txBody/a:p', NS)
        text = '\n'.join(para_text(p) for p in paras)
        geom, fill = _geom(sp), _fill(sp)
        u = lambda v: v // EMU_PER_UNIT
        if geom == 'ellipse' and fill == RED:
            if text.strip():
                marker = {'label': text.strip(), 'x': u(x), 'y': u(y), 'cx': u(x + w // 2), 'cy': u(y + h // 2)}
                markers.append(marker)
                marker_by_id[shape_id] = marker
            continue
        if not text.strip():
            continue
        if not crumb and ' > ' in text and y < 300_000 and x < 3_000_000:
            crumb = text.strip()
        if geom == 'rect' and fill == RED:
            callouts.append({'text': text, 'x': u(x), 'y': u(y), 'cx': u(x + w // 2), 'cy': u(y + h // 2),
                             'links': links.get(shape_id, [])})
            continue
        if x >= DESC_X:
            if 'TextBox' in name or '텍스트' in name:
                items, n = [], 0
                for p in paras:
                    auto = p.find('a:pPr/a:buAutoNum', NS)
                    t = para_text(p)
                    num = None
                    if auto is not None:
                        n += 1
                        num = n
                    items.append({'num': num, 'text': t})
                desc.append({'shape': name, 'x': u(x), 'y': u(y), 'items': items})
            else:
                others.append({'shape': name, 'x': u(x), 'y': u(y), 'text': text})
    for c in callouts:
        linked = [marker_by_id[i]['label'] for i in c.pop('links') if i in marker_by_id]
        c['marker'] = linked[0] if linked else None
    markers.sort(key=lambda m: (m['y'], m['x']))
    return {'crumb': crumb, 'desc': desc, 'callouts': callouts, 'markers': markers, 'right_other': others}


@lru_cache(maxsize=None)
def slides() -> dict:
    """{slide_id: slide data} for all 12 decks, in presentation order."""
    result = {}
    for path in sorted((ROOT / 'docs/reference').glob('*.pptx')):
        mod = module_of(path)
        with zipfile.ZipFile(path) as z:
            pres = z.read('ppt/presentation.xml').decode('utf-8')
            rels = z.read('ppt/_rels/presentation.xml.rels').decode('utf-8')
            targets = {m[0]: m[1] for m in re.findall(r'Id="(rId\d+)"[^>]*?Target="slides/(slide\d+\.xml)"', rels)}
            targets.update({m[1]: m[0] for m in re.findall(r'Target="slides/(slide\d+\.xml)"[^>]*?Id="(rId\d+)"', rels)})
            for index, rid in enumerate(re.findall(r'<p:sldId [^>]*?r:id="(rId\d+)"', pres), start=1):
                data = read_slide(ET.fromstring(z.read('ppt/slides/' + targets[rid])))
                data.update(module=mod, slide=index, id=f'{mod}-{index}', deck=path.name)
                result[data['id']] = data
    return result


def base_number(label: str) -> str:
    """'1’' / "1'" -> '1'."""
    return re.sub(r'[’\'′`]+$', '', label.strip())


def entries(slide_id: str) -> list[dict]:
    """Description entries of one slide in reading order.

    Each entry: {'num': int|None, 'text': str, 'kind': 'desc'|'callout', 'key': str}.
    Empty numbered paragraphs (drawn as a bare ① with no text) are dropped.
    A callout takes the number of the marker its red connector line ends at; a callout
    connected to a plain UI element has no number. 'key' is the stable slide-local id used by
    data-description-ref: '{num}' for numbered items, 'n{k}' for unnumbered ones.
    """
    s = slides()[slide_id]
    out = []
    for block in s['desc']:
        for it in block['items']:
            if it['text'].strip():
                out.append({'num': it['num'], 'text': it['text'], 'kind': 'desc'})
    for c in sorted(s['callouts'], key=lambda c: (c['y'], c['x'])):
        label = base_number(c['marker']) if c['marker'] else ''
        out.append({'num': int(label) if label.isdigit() else None, 'text': c['text'], 'kind': 'callout'})
    unnumbered = 0
    for e in out:
        if e['num'] is None:
            unnumbered += 1
            e['key'] = f'n{unnumbered}'
        else:
            e['key'] = str(e['num'])
    return out


def screen_name(slide_id: str) -> str:
    """Drawer section title from the slide breadcrumb; popup slides ("(…)") keep their parent screen."""
    crumb = slides()[slide_id]['crumb']
    if not crumb:
        return ''
    parts = [p.strip() for p in crumb.split(' > ')]
    if parts[-1].startswith('(') and len(parts) > 2:
        return f'{parts[-2]} > {parts[-1]}'
    return parts[-1]


if __name__ == '__main__':
    import sys
    wanted = sys.argv[1:]
    for sid, s in slides().items():
        if wanted and not any(sid == w or sid.startswith(w + '-') and sid.count('-') == w.count('-') + 1 for w in wanted):
            continue
        es = entries(sid)
        if not es and not s['markers']:
            continue
        print(f"=== {sid} :: {s['crumb']}")
        for e in es:
            print(f"  [{e['num'] if e['num'] is not None else '-'}{'*' if e['kind'] == 'callout' else ''}] {e['text']!r}")
        print('  markers:', ' '.join(f"{m['label']}@({m['cx']},{m['cy']})" for m in s['markers']))
        for o in s['right_other']:
            print(f"  (right-column non-textbox {o['shape']}) {o['text'][:80]!r}")
