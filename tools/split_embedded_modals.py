"""Split embedded modal-backdrop blocks into standalone HTML documents.

This is a one-time migration utility. It preserves each modal's markup verbatim,
adds an external-modal manifest to the parent page, and creates a standalone
popup document under popups/<parent-stem>/<modal-id>.html.
"""

from __future__ import annotations

import html
import json
import os
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OPEN_MODAL = re.compile(
    r'<div\b(?=[^>]*\bclass=["\'][^"\']*\bmodal-backdrop\b[^"\']*["\'])[^>]*>',
    re.IGNORECASE,
)
DIV_TAG = re.compile(r'<(/?)div\b[^>]*>', re.IGNORECASE)
ID_ATTR = re.compile(r'\bid=["\']([^"\']+)["\']', re.IGNORECASE)
TITLE = re.compile(r'<h[1-6]\b[^>]*>(.*?)</h[1-6]>', re.IGNORECASE | re.DOTALL)
TAG = re.compile(r'<[^>]+>')


def find_modal_blocks(source: str) -> list[tuple[int, int, str, str]]:
    blocks: list[tuple[int, int, str, str]] = []
    cursor = 0
    while match := OPEN_MODAL.search(source, cursor):
        depth = 0
        end = None
        for tag in DIV_TAG.finditer(source, match.start()):
            depth += -1 if tag.group(1) else 1
            if depth == 0:
                end = tag.end()
                break
        if end is None:
            raise ValueError(f'Unclosed modal-backdrop at offset {match.start()}')
        markup = source[match.start():end]
        id_match = ID_ATTR.search(match.group(0))
        if not id_match:
            raise ValueError(f'Modal without id at offset {match.start()}')
        blocks.append((match.start(), end, id_match.group(1), markup))
        cursor = end
    return blocks


def popup_title(markup: str, fallback: str) -> str:
    match = TITLE.search(markup)
    if not match:
        return fallback
    return html.unescape(TAG.sub('', match.group(1))).strip() or fallback


def relative_asset(popup_file: Path, asset: Path) -> str:
    return Path(os.path.relpath(asset, popup_file.parent)).as_posix()


def popup_document(popup_file: Path, modal_id: str, markup: str) -> str:
    css = relative_asset(popup_file, ROOT / 'assets/styles/style.css')
    js = relative_asset(popup_file, ROOT / 'assets/scripts/dashboard.js')
    visible_markup = re.sub(
        r'(<div\b[^>]*\bclass=["\'][^"\']*\bmodal-backdrop\b[^"\']*["\'][^>]*)(>)',
        lambda m: re.sub(r'\saria-hidden=["\'][^"\']*["\']', '', m.group(1))
        + ' aria-hidden="false"' + m.group(2),
        markup,
        count=1,
        flags=re.IGNORECASE,
    )
    title = html.escape(popup_title(markup, modal_id))
    return (
        '<!DOCTYPE html>\n'
        '<html lang="ko">\n'
        '<head>\n'
        '  <meta charset="UTF-8">\n'
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        f'  <title>{title}</title>\n'
        f'  <link rel="stylesheet" href="{css}">\n'
        '</head>\n'
        '<body class="popup-document">\n'
        f'{visible_markup}\n'
        f'  <script src="{js}"></script>\n'
        '</body>\n'
        '</html>\n'
    )


def migrate_file(path: Path) -> tuple[int, list[Path]]:
    source = path.read_text(encoding='utf-8')
    blocks = find_modal_blocks(source)
    if not blocks:
        cleaned = re.sub(r'[ \t]+(?=\r?$)', '', source, flags=re.MULTILINE)
        if cleaned != source:
            path.write_text(cleaned, encoding='utf-8', newline='\n')
        return 0, []

    popup_dir = path.parent / 'popups' / path.stem
    popup_dir.mkdir(parents=True, exist_ok=True)
    popup_files: list[Path] = []
    manifest: list[str] = []
    for _, _, modal_id, markup in blocks:
        popup_file = popup_dir / f'{modal_id}.html'
        popup_file.write_text(popup_document(popup_file, modal_id, markup), encoding='utf-8', newline='\n')
        popup_files.append(popup_file)
        manifest.append(Path(os.path.relpath(popup_file, path.parent)).as_posix())

    chunks: list[str] = []
    cursor = 0
    for start, end, _, _ in blocks:
        chunks.append(source[cursor:start])
        cursor = end
    chunks.append(source[cursor:])
    migrated = ''.join(chunks)
    manifest_markup = (
        '  <script type="application/json" class="external-modal-manifest">'
        + json.dumps(manifest, ensure_ascii=False)
        + '</script>\n'
    )
    if '</body>' not in migrated:
        raise ValueError(f'Missing </body>: {path}')
    migrated = migrated.replace('</body>', manifest_markup + '</body>', 1)
    migrated = re.sub(r'[ \t]+(?=\r?$)', '', migrated, flags=re.MULTILINE)
    path.write_text(migrated, encoding='utf-8', newline='\n')
    return len(blocks), popup_files


def main() -> None:
    total = 0
    parents = 0
    generated: list[Path] = []
    candidates = [ROOT / 'index.html', *sorted((ROOT / 'modules').rglob('*.html'))]
    for path in candidates:
        if 'popups' in path.parts:
            continue
        count, files = migrate_file(path)
        if count:
            parents += 1
            total += count
            generated.extend(files)
            print(f'{path.relative_to(ROOT)}: {count}')
    print(f'parents={parents} modals={total} generated={len(generated)}')


if __name__ == '__main__':
    main()
