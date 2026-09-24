"""Convert screen-design pages that were mistakenly implemented as modals.

The source modal body is placed in a clone of its parent page shell, opener
controls are changed to page navigation, and the obsolete popup document is
removed from the parent's external-modal manifest.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

# parent page, modal id, destination page
CONVERSIONS = [
    ("modules/00_공통관리/SRMClientManage.html", "clientDetailModal", "SRMClientDetail.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerPreQuote.html", "pqSubmitModal", "SRMPartnerPreQuoteSubmit.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerNegoRequest.html", "negoQuoteReqInfoModal", "SRMPartnerNegoRequestDetail.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerNegoRequest.html", "negoQuoteSubmitModal", "SRMPartnerNegoQuoteSubmit.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerNegoRequest.html", "negoQuoteHistoryModal", "SRMPartnerNegoQuoteHistory.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerBidNotice.html", "bidNoticeDetailModal", "SRMPartnerBidNoticeDetail.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerBidJoin.html", "bidJoinDetailModal", "SRMPartnerBidJoinDetail.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerBidJoin.html", "bidDocSubmitWizardModal", "SRMPartnerBidDocumentSubmit.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerBidJoin.html", "bidJoinDocSubmittedModal", "SRMPartnerBidDocumentHistory.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerBidJoin.html", "bidPriceBeforeModal", "SRMPartnerBidPrice.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerBidJoin.html", "bidPriceAfterModal", "SRMPartnerBidPriceComplete.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerBidJoin.html", "bidResultModal", "SRMPartnerBidResult.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerBidJoin.html", "negoTalkListModal", "SRMPartnerBidNegoList.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerBidJoin.html", "negoTalkReqInfoModal", "SRMPartnerBidNegoDetail.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerBidJoin.html", "negoTalkSubmitModal", "SRMPartnerBidNegoSubmit.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerBidJoin.html", "negoTalkHistoryModal", "SRMPartnerBidNegoHistory.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerContract.html", "contractDetailModal", "SRMPartnerContractDetail.html"),
    ("modules/02_협력업체창구_로그인후/SRMPartnerContract.html", "contractDocSubmitModal", "SRMPartnerContractDocuments.html"),
    ("modules/04_사전견적관리/SRMPreQuoteRequest.html", "pqNewModal", "SRMPreQuoteRequestNew.html"),
    ("modules/04_사전견적관리/SRMPreQuoteRequest.html", "pqManageModal", "SRMPreQuoteRequestManage.html"),
    ("modules/04_사전견적관리/SRMPreQuoteRequest.html", "pqDoneModal", "SRMPreQuoteRequestComplete.html"),
    ("modules/04_사전견적관리/SRMPreQuoteStatus.html", "pqStatusDetailModal", "SRMPreQuoteStatusDetail.html"),
    ("modules/04_사전견적관리/SRMPreQuoteStatus.html", "pqSubmitDetailModal", "SRMPreQuoteSubmissionDetail.html"),
    ("modules/05_발주계약요청/SRMOrderContractRequest.html", "ocNewModal", "SRMOrderContractRequestNew.html"),
    ("modules/05_발주계약요청/SRMOrderContractRequest.html", "ocManageModal", "SRMOrderContractRequestManage.html"),
    ("modules/05_발주계약요청/SRMOrderContractRequest.html", "ocDoneModal", "SRMOrderContractRequestComplete.html"),
    ("modules/05_발주계약요청/SRMOrderContractStatus.html", "ocStatusDetailModal", "SRMOrderContractStatusDetail.html"),
    ("modules/06_발주계획/SRMOrderPlanIntake.html", "opIntakeDetailModal", "SRMOrderPlanIntakeDetail.html"),
    ("modules/06_발주계획/SRMOrderPlanRegister.html", "opRegManageModal", "SRMOrderPlanRegisterManage.html"),
    ("modules/06_발주계획/SRMOrderPlanRegister.html", "opRegStatusModal", "SRMOrderPlanRegisterDetail.html"),
    ("modules/06_발주계획/SRMOrderPlanRegister.html", "opDoneModal", "SRMOrderPlanRegisterComplete.html"),
    ("modules/07-1_수의계약관리/SRMSoleSourcePlan.html", "ssPlanManageModal", "SRMSoleSourcePlanManage.html"),
    ("modules/07-1_수의계약관리/SRMSoleSourcePlan.html", "ssPlanDoneModal", "SRMSoleSourcePlanComplete.html"),
    ("modules/07-1_수의계약관리/SRMSoleSourceStatus.html", "ssParticipateDocModal", "SRMSoleSourceParticipateDocuments.html"),
    ("modules/07-1_수의계약관리/SRMSoleSourceStatus.html", "ssQuoteRequestFormModal", "SRMSoleSourceQuoteRequest.html"),
    ("modules/07-1_수의계약관리/SRMSoleSourceStatus.html", "ssQuoteReqDetailModal", "SRMSoleSourceQuoteStatus.html"),
    ("modules/08_계약관리/SRMContractStatus.html", "ctDetailModal", "SRMContractStatusDetail.html"),
    ("modules/08_계약관리/SRMContractStatus.html", "ctDocManageModal", "SRMContractDocumentManage.html"),
    ("modules/09_협력업체관리/SRMPartnerManage.html", "pmDetailModal", "SRMPartnerManageDetail.html"),
    ("modules/09_협력업체관리/SRMPartnerManage.html", "pmEditModal", "SRMPartnerManageEdit.html"),
    ("modules/09_협력업체관리/SRMPartnerQnaManage.html", "qnaDetailModal", "SRMPartnerQnaDetail.html"),
    ("modules/09_협력업체관리/SRMPartnerQnaManage.html", "qnaAnswerFormModal", "SRMPartnerQnaAnswer.html"),
    ("modules/10_기준정보관리/SRMCommonItemManage.html", "ciFormModal", "SRMCommonItemForm.html"),
    ("modules/10_기준정보관리/SRMCommonItemManage.html", "ciDetailModal", "SRMCommonItemDetail.html"),
    ("modules/10_기준정보관리/SRMCommonEvalManage.html", "ceFormModal", "SRMCommonEvalForm.html"),
    ("modules/10_기준정보관리/SRMCommonEvalManage.html", "ceDetailModal", "SRMCommonEvalDetail.html"),
    ("modules/10_기준정보관리/SRMCommonDocManage.html", "cdDetailModal", "SRMCommonDocDetail.html"),
    ("modules/10_기준정보관리/SRMMailContentManage.html", "mcFormModal", "SRMMailContentForm.html"),
    ("modules/10_기준정보관리/SRMMailContentManage.html", "mcDetailModal", "SRMMailContentDetail.html"),
]


def inner(source: str, class_name: str) -> str:
    match = re.search(
        rf'<div\b[^>]*class="[^"]*\b{class_name}\b[^"]*"[^>]*>(.*?)</div>\s*(?=<div\b[^>]*class="[^"]*modal-(?:footer|body))',
        source,
        re.I | re.S,
    )
    if match:
        return match.group(1).strip()
    # Body/footer are the last siblings, so a tempered match is sufficient for
    # these generated popup documents.
    match = re.search(rf'<div\b[^>]*class="[^"]*\b{class_name}\b[^"]*"[^>]*>(.*?)</div>\s*</div>\s*</div>', source, re.I | re.S)
    if not match:
        raise ValueError(f"Missing {class_name}")
    return match.group(1).strip()


def extract_section(source: str, class_name: str, next_class: str | None) -> str:
    if next_class:
        pattern = rf'<div\b[^>]*class="[^"]*\b{class_name}\b[^"]*"[^>]*>(.*?)</div>\s*<div\b[^>]*class="[^"]*\b{next_class}\b'
    else:
        pattern = rf'<div\b[^>]*class="[^"]*\b{class_name}\b[^"]*"[^>]*>(.*?)</div>\s*</div>\s*</div>'
    match = re.search(pattern, source, re.I | re.S)
    if not match:
        return ""
    return match.group(1).strip()


def popup_parts(source: str) -> tuple[str, str, str]:
    title_match = re.search(r'<h[1-6]\b[^>]*class="[^"]*modal-title[^"]*"[^>]*>(.*?)</h[1-6]>', source, re.I | re.S)
    if not title_match:
        raise ValueError("Missing modal title")
    title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
    body = extract_section(source, "modal-body", "modal-footer")
    if not body:
        body = extract_section(source, "modal-body", None)
    footer = extract_section(source, "modal-footer", None)
    return title, body, footer


def set_page_title(shell: str, title: str) -> str:
    old_title = re.search(r'<title>(.*?)</title>', shell, re.I | re.S)
    system_name = "전자입찰시스템(SRM)"
    if old_title and " - " in old_title.group(1):
        system_name = old_title.group(1).split(" - ", 1)[0].strip()
    shell = re.sub(r'(<title>).*?(</title>)', rf'\1{system_name} - {title} | KEPCO ES\2', shell, count=1, flags=re.I | re.S)
    return re.sub(r'(<h1\b[^>]*class="[^"]*page-title[^"]*"[^>]*>).*?(</h1>)', rf'\1{title}\2', shell, count=1, flags=re.I | re.S)


def balanced_div(source: str, start: int) -> tuple[int, str]:
    depth = 0
    for match in re.finditer(r'<(/?)div\b[^>]*>', source[start:], re.I):
        depth += -1 if match.group(1) else 1
        if depth == 0:
            end = start + match.end()
            return end, source[start:end]
    raise ValueError("Unclosed div")


def page_title_wrap(parent_source: str, title: str) -> str:
    start_match = re.search(r'<div\b[^>]*class="[^"]*\bpage-title-wrap\b[^"]*"[^>]*>', parent_source, re.I)
    if not start_match:
        raise ValueError("Missing page-title-wrap")
    _, wrap = balanced_div(parent_source, start_match.start())
    wrap = re.sub(r'(<h1\b[^>]*class="[^"]*page-title[^"]*"[^>]*>).*?(</h1>)', rf'\1{title}\2', wrap, count=1, flags=re.I | re.S)
    breadcrumb = re.search(r'(<nav\b[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>)(.*?)(</nav>)', wrap, re.I | re.S)
    if breadcrumb:
        items = breadcrumb.group(2)
        items = re.sub(r'\bclass="breadcrumb-item current"', 'class="breadcrumb-item"', items)
        items += f'<span class="breadcrumb-separator">&gt;</span><span class="breadcrumb-item current">{title}</span>'
        wrap = wrap[:breadcrumb.start()] + breadcrumb.group(1) + items + breadcrumb.group(3) + wrap[breadcrumb.end():]
    return wrap


def repair_page_chrome(page: str, parent_source: str, title: str) -> str:
    page = set_page_title(page, title)
    replacement = page_title_wrap(parent_source, title)
    current = re.search(r'<div\b[^>]*class="[^"]*\bpage-title-wrap\b[^"]*"[^>]*>', page, re.I)
    if not current:
        raise ValueError("Missing generated page-title-wrap")
    end, _ = balanced_div(page, current.start())
    return page[:current.start()] + replacement + page[end:]


def page_main(title: str, body: str, footer: str, parent_name: str) -> str:
    footer = re.sub(r'\s*data-close-modal(?:="[^"]*")?', '', footer)
    footer = re.sub(r'class="([^"]*)\bmodal-close\b([^"]*)"', r'class="\1\2" onclick="history.back()"', footer)
    footer = re.sub(r'<button\b([^>]*)>(\s*(?:닫기|목록)\s*)</button>', rf'<button\1 onclick="window.location.href=\'{parent_name}\'">\2</button>', footer)
    actions = f'<div class="page-actions">{footer}</div>' if footer else ''
    return (
        '    <main class="main-content page-detail-content">\n'
        '      <div class="page-title-wrap">\n'
        f'        <div class="page-title-left"><h1 class="page-title">{title}</h1></div>\n'
        '      </div>\n'
        f'      <section class="page-detail-body">{body}</section>\n'
        f'      {actions}\n'
        '    </main>'
    )


def rewrite_manifest(source: str, removed_rel: str) -> str:
    pattern = r'(<script\b[^>]*class="external-modal-manifest"[^>]*>)(.*?)(</script>)'
    match = re.search(pattern, source, re.I | re.S)
    if not match:
        return source
    items = json.loads(match.group(2))
    items = [item for item in items if item != removed_rel]
    return source[:match.start()] + match.group(1) + json.dumps(items, ensure_ascii=False) + match.group(3) + source[match.end():]


def navigation_attr(source: str, modal_id: str, href: str) -> str:
    return re.sub(
        rf'\s*data-open-modal="{re.escape(modal_id)}"',
        f' onclick="window.location.href=\'{href}\'"',
        source,
    )


def main() -> None:
    page_by_modal = {modal_id: (ROOT / parent).parent / destination for parent, modal_id, destination in CONVERSIONS}
    created = []
    for parent_rel, modal_id, destination in CONVERSIONS:
        parent = ROOT / parent_rel
        popup = parent.parent / "popups" / parent.stem / f"{modal_id}.html"
        target = parent.parent / destination
        if not popup.exists():
            if target.exists():
                continue
            raise FileNotFoundError(popup)
        parent_source = parent.read_text(encoding="utf-8")
        popup_source = popup.read_text(encoding="utf-8")
        title, body, footer = popup_parts(popup_source)
        new_main = page_main(title, body, footer, parent.name)
        page = re.sub(r'<main\b[^>]*>.*?</main>', new_main, parent_source, count=1, flags=re.I | re.S)
        if page == parent_source:
            raise ValueError(f"Main element not replaced: {parent}")
        page = repair_page_chrome(page, parent_source, title)
        own_rel = Path(os.path.relpath(popup, parent.parent)).as_posix()
        page = rewrite_manifest(page, own_rel)
        parent_source = navigation_attr(parent_source, modal_id, destination)
        parent_source = rewrite_manifest(parent_source, own_rel)
        parent.write_text(parent_source, encoding="utf-8", newline="\n")
        target.write_text(page, encoding="utf-8", newline="\n")
        popup.unlink()
        created.append(target)

    # Convert cross-links between newly created pages after all destinations exist.
    conversion_pages = [ROOT / p for p, _, _ in CONVERSIONS]
    conversion_pages += [(ROOT / p).parent / destination for p, _, destination in CONVERSIONS]
    for page in conversion_pages:
        if not page.exists():
            continue
        source = page.read_text(encoding="utf-8")
        for modal_id, target in page_by_modal.items():
            href = Path(os.path.relpath(target, page.parent)).as_posix()
            source = navigation_attr(source, modal_id, href)
        source = re.sub(r'\s+onclick="[^"]*"(?=[^>]*\s+onclick=")', '', source)
        page.write_text(source, encoding="utf-8", newline="\n")
    # Keep already-created destinations aligned with their parent page chrome.
    for parent_rel, modal_id, destination in CONVERSIONS:
        parent = ROOT / parent_rel
        target = parent.parent / destination
        if not target.exists():
            continue
        page = target.read_text(encoding="utf-8")
        title_match = re.search(r'<h1\b[^>]*class="[^"]*page-title[^"]*"[^>]*>(.*?)</h1>', page, re.I | re.S)
        if not title_match:
            raise ValueError(f"Missing page title: {target}")
        title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
        page = repair_page_chrome(page, parent.read_text(encoding="utf-8"), title)
        target.write_text(page, encoding="utf-8", newline="\n")
    # Cloned shells can still list a sibling popup converted later in this run.
    # Remove every manifest entry whose document no longer exists.
    for page in [ROOT / "index.html", *sorted((ROOT / "modules").rglob("*.html"))]:
        source = page.read_text(encoding="utf-8")
        pattern = r'(<script\b[^>]*class="external-modal-manifest"[^>]*>)(.*?)(</script>)'
        match = re.search(pattern, source, re.I | re.S)
        if not match:
            continue
        items = json.loads(match.group(2))
        items = [item for item in items if (page.parent / item).exists()]
        cleaned = source[:match.start()] + match.group(1) + json.dumps(items, ensure_ascii=False) + match.group(3) + source[match.end():]
        page.write_text(cleaned, encoding="utf-8", newline="\n")
    print(f"converted={len(created)}")


if __name__ == "__main__":
    main()
