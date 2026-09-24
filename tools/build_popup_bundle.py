"""Build per-module popup bundles so popups also open from file:// (DESIGN_GUIDE 5.8).

Browsers block fetch() for file:// pages, so loadExternalModals() cannot read
popups/{parent}/{id}.html there. This script copies each popup's
.modal-backdrop markup into modules/<module>/popups/popup-bundle.js, keyed by
the same relative path used in the parent page's external-modal-manifest, and
adds the bundle <script> to every page that declares a manifest.

The popup HTML files stay the single source of truth. Re-run this script after
adding or editing any popup:  python3 tools/build_popup_bundle.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUNDLE_NAME = 'popup-bundle.js'
BUNDLE_TAG = f'  <script src="popups/{BUNDLE_NAME}"></script>\n'
DASHBOARD_TAG = '  <script src="../../assets/scripts/dashboard.js"></script>\n'
MODAL = re.compile(r'<body[^>]*>\s*(.*?)\s*<script\b', re.S)


def build_bundle(module: Path) -> int:
    popups_dir = module / 'popups'
    entries = {}
    for popup in sorted(popups_dir.glob('*/*.html')):
        match = MODAL.search(popup.read_text(encoding='utf-8'))
        if not match or 'modal-backdrop' not in match.group(1):
            raise ValueError(f'modal-backdrop root not found: {popup}')
        entries[popup.relative_to(module).as_posix()] = match.group(1)
    body = json.dumps(entries, ensure_ascii=False, indent=0)
    (popups_dir / BUNDLE_NAME).write_text(
        '/* 자동 생성 파일: 직접 수정하지 말고 tools/build_popup_bundle.py를 다시 실행하세요. */\n'
        f'window.KEPCO_POPUP_BUNDLE = Object.assign(window.KEPCO_POPUP_BUNDLE || {{}}, {body});\n',
        encoding='utf-8',
    )
    return len(entries)


def link_pages(module: Path) -> int:
    linked = 0
    for page in sorted(module.glob('*.html')):
        source = page.read_text(encoding='utf-8')
        has_manifest = 'class="external-modal-manifest"' in source
        has_tag = BUNDLE_TAG in source
        if has_manifest and not has_tag:
            if DASHBOARD_TAG not in source:
                raise ValueError(f'dashboard.js tag not found: {page}')
            source = source.replace(DASHBOARD_TAG, BUNDLE_TAG + DASHBOARD_TAG, 1)
        elif has_tag and not has_manifest:
            source = source.replace(BUNDLE_TAG, '', 1)
        else:
            continue
        page.write_text(source, encoding='utf-8')
        linked += 1
    return linked


def main() -> None:
    for module in sorted((ROOT / 'modules').iterdir()):
        if not (module / 'popups').is_dir():
            continue
        count = build_bundle(module)
        changed = link_pages(module)
        print(f'{module.name}: {count} popups bundled, {changed} pages updated')


if __name__ == '__main__':
    main()
