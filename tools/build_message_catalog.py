"""Build assets/scripts/message-catalog.js from the 자동발송 메일/메시지 reference xlsx (DESIGN_GUIDE 5.15).

The catalog feeds the phone mockup that opens when a notification code (MSG-###) in the
Description drawer is clicked. Cell text is copied exactly as written (no trimming or edits).
A page shows the mockup only if it loads this script before dashboard.js.

Run: python3 tools/build_message_catalog.py   (needs openpyxl)
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / '[참고]자동발송 메일, 메세지 내용 정리.xlsx'
TARGET = ROOT / 'assets' / 'scripts' / 'message-catalog.js'
HEADER = ('CODE', '구분(상황)', '메일 제목', '메일 내용', 'SMS(MLS) 내용', '발송대상')


def read_catalog() -> dict[str, dict[str, str]]:
    sheet = openpyxl.load_workbook(SOURCE, read_only=True).active
    rows = [r for r in sheet.iter_rows(values_only=True) if any(v is not None for v in r)]
    if tuple(rows[0][:6]) != HEADER:
        raise SystemExit(f'unexpected header: {rows[0][:6]}')
    catalog = {}
    for code, situation, subject, mail, sms, target, *_ in rows[1:]:
        if not re.fullmatch(r'MSG-\d{3}', code or ''):
            raise SystemExit(f'unexpected code: {code!r}')
        if code in catalog:
            raise SystemExit(f'duplicate code: {code}')
        catalog[code] = {'situation': situation or '', 'mailSubject': subject or '', 'mailBody': mail or '',
                         'smsBody': sms or '', 'target': target or ''}
    return dict(sorted(catalog.items()))


def main() -> None:
    catalog = read_catalog()
    body = json.dumps(catalog, ensure_ascii=False, indent=2)
    TARGET.write_text(
        '/* 자동 생성 파일: 직접 수정하지 말고 python3 tools/build_message_catalog.py 실행\n'
        f' * 원본: {SOURCE.name} (셀 내용 그대로) */\n'
        f'window.SRM_MESSAGE_CATALOG = {body};\n', encoding='utf-8')
    print(f'{len(catalog)} messages -> {TARGET.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
