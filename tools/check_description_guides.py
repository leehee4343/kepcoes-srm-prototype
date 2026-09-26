"""Verify the 화면설계 Description drawers against the PPTX originals (DESIGN_GUIDE 5.15).

Checks
1. Every drawer text equals the PPTX original character for character (only paragraph-final
   line breaks are not shown) and nothing else is in the drawer.
2. Every numbered drawer item has a target marker on the page or in a popup the page opens,
   unless docs/DESCRIPTION_MAP.json lists it under "no_target" with a reason.
3. Every marker has data-description-ref; markers written in the page itself belong to its drawer;
   markers in popups belong to the drawer of at least one page that opens the popup.
4. Pages without Description have no D button, drawer or marker.

Run: python3 tools/check_description_guides.py
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_description_guides import GUIDE_ID, MODULES, load_map, page_items  # noqa: E402

MARKER_RE = re.compile(r'<span[^>]*class="description-target-marker[^"]*"[^>]*>')
REF_RE = re.compile(r'data-description-ref="([^"]*)"')
OPEN_RE = re.compile(r'data-open-modal="([^"]+)"')
ITEM_RE = re.compile(r'<div class="description-mapping-item" data-description-ref="([^"]+)">\s*'
                     r'<span class="description-mapping-number" aria-hidden="true">([^<]*)</span>\s*'
                     r'<pre class="description-source-text">(.*?)</pre>', re.S)


def manifest(text: str) -> list[str]:
    m = re.search(r'class="external-modal-manifest">(.*?)</script>', text, re.S)
    return json.loads(m[1]) if m else []


# Popups that dashboard.js opens itself (classList.add('show')) instead of data-open-modal.
SCRIPT_OPENED = {'modalBiddingDetail', 'modalIdFind', 'modalPwFind', 'modalCalcPrice', 'modalApprovalConfirm', 'modalReturnBidPlan'}


def opened_popups(page: Path, text: str) -> list[Path]:
    by_id = {Path(s).stem: page.parent / s for s in manifest(text)}
    seen, queue, files = set(), list(OPEN_RE.findall(text)) + [i for i in by_id if i in SCRIPT_OPENED], []
    while queue:
        modal = queue.pop(0)
        if modal in seen:
            continue
        seen.add(modal)
        path = by_id.get(modal)
        if path and path.exists():
            files.append(path)
            queue += OPEN_RE.findall(path.read_text(encoding='utf-8'))
    return files


def markers(text: str) -> list[str | None]:
    out = []
    for tag in MARKER_RE.findall(text):
        m = REF_RE.search(tag)
        out.append(m[1] if m else None)
    return out


def base(ref: str) -> str:
    return re.sub(r'[’\']+$', '', ref)


def main() -> int:
    data = load_map()
    mapping, no_target = data['pages'], data.get('no_target', {})
    errors, stats = [], {'pages': 0, 'items': 0, 'markers': 0}
    popup_owners: dict[Path, set[str]] = {}
    only = sys.argv[1:]  # optional module prefixes, e.g. "00" "07-2"
    in_scope = lambda module_dir: not only or any(module_dir.startswith(m + '_') for m in only)
    for page in sorted(p for p in MODULES.glob('*/*.html') if in_scope(p.parts[-2])):
        rel = page.relative_to(MODULES).as_posix()
        text = page.read_text(encoding='utf-8')
        if rel not in mapping:
            errors.append(f'{rel}: page is not listed in DESCRIPTION_MAP.json (list it with [] if it has no Description)')
        sections = page_items(mapping.get(rel, []))
        expected = [it for s in sections for it in s['items']]
        guide = page.parent / 'popups' / page.stem / f'{GUIDE_ID}.html'
        has_button = 'class="description-floating-button"' in text
        own_markers = markers(text)
        if None in own_markers:
            errors.append(f'{rel}: marker without data-description-ref')
        if not expected:
            if has_button or guide.exists() or own_markers:
                errors.append(f'{rel}: no Description in 화면설계, but D/drawer/marker exists')
            continue
        stats['pages'] += 1
        if not has_button or f'popups/{page.stem}/{GUIDE_ID}.html' not in manifest(text):
            errors.append(f'{rel}: D button or drawer manifest entry missing')
        if not guide.exists():
            errors.append(f'{rel}: drawer file missing')
            continue
        found = ITEM_RE.findall(guide.read_text(encoding='utf-8'))
        if len(found) != len(expected):
            errors.append(f'{rel}: drawer has {len(found)} items, PPTX has {len(expected)}')
        for (ref, number, pre), it in zip(found, expected):
            if ref != it['ref'] or number != it['number'] or html.unescape(pre) != it['text']:
                errors.append(f'{rel}: drawer item {ref} differs from PPTX {it["ref"]}')
        stats['items'] += len(expected)
        refs = {it['ref'] for it in expected}
        popups = opened_popups(page, text)
        for p in popups:
            popup_owners.setdefault(p, set()).update(refs)
        reachable = set(own_markers)
        for p in popups:
            reachable.update(r for r in markers(p.read_text(encoding='utf-8')) if r)
        stats['markers'] += len([r for r in reachable if r])
        for r in own_markers:
            if r and base(r) not in refs:
                errors.append(f'{rel}: marker {r} is not in this page\'s drawer')
        allowed_missing = set(no_target.get(rel, {}))
        for it in expected:
            if it['number'] and it['ref'] not in {base(r) for r in reachable if r} and it['ref'] not in allowed_missing:
                errors.append(f'{rel}: drawer item {it["number"]} ({it["ref"]}) has no target marker')
        for r in allowed_missing:
            if r in {base(x) for x in reachable if x}:
                errors.append(f'{rel}: {r} is listed in no_target but has a marker')
    for popup in sorted(p for p in MODULES.glob('*/popups/*/*.html') if in_scope(p.parts[-4])):
        if popup.name == f'{GUIDE_ID}.html':
            continue
        refs = markers(popup.read_text(encoding='utf-8'))
        if None in refs:
            errors.append(f'{popup.relative_to(MODULES)}: marker without data-description-ref')
        owners = popup_owners.get(popup, set())
        for r in refs:
            if r and base(r) not in owners:
                errors.append(f'{popup.relative_to(MODULES)}: marker {r} is not in the drawer of any page that opens it')
    # Coverage: every slide with Description text is shown on some page or excluded with a reason.
    from description_source import entries, slides
    mapped = {sid for sids in mapping.values() for sid in sids}
    excluded = data.get('excluded_slides', {})
    for sid in slides():
        module = sid.rsplit('-', 1)[0]
        if only and module not in only:
            continue
        if entries(sid) and sid not in mapped and sid not in excluded:
            errors.append(f'{sid}: Description exists but no page shows it and it is not excluded')
        if sid in mapped and sid in excluded:
            errors.append(f'{sid}: both mapped and excluded')
    for e in errors:
        print('FAIL', e)
    print(f"{'PASS' if not errors else 'FAIL'}: {stats['pages']} pages with Description, "
          f"{stats['items']} drawer items verbatim, {stats['markers']} reachable markers, {len(errors)} errors")
    return 1 if errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
