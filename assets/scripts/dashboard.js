/**
 * KEPCO ES (켑코이에스) PMS 대시보드 인터랙션 & 차트 렌더링 스크립트
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadExternalModals();
  initHeaderCleanup();
  initSidebar();
  initPageManuals();
  initNativeFormControls();
  initPartnerContactForm();
  initPermissions();
  renderDonutCharts();
  animateBarCharts();
  animateProgressBars();
  initProjectRegisterWorkspace();
  initSRMLoginPage();
  initProjectSearchPage();
  initProjectDetailPage();
  initBusinessSettlementPage();
  initStatisticsPage();
  initStepWorkflowPage();
  initDashboardWidgets();
  initPlanPerformancePage();
  initPartnerRegisterPage();
  initProjectPromotionPage();
  initSrmDetailPage();
  initDataGrids();
  initAttachmentDisplays();
  initDescriptionGuide();
  initPageLinks();
  initModals();
});

/**
 * 버튼형 페이지 이동 (DESIGN_GUIDE 6.2.1)
 * 인라인 onclick 대신 data-href(목적지 파일) · data-history-back(이전 화면)으로 이동합니다.
 * 권한 버튼(.perm-btn)의 data-href는 initDashboardWidgets()가 처리합니다.
 */
function initPageLinks() {
  document.querySelectorAll('[data-href]:not(.perm-btn)').forEach(el => {
    el.addEventListener('click', () => {
      window.location.href = el.dataset.href;
    });
  });
  document.querySelectorAll('[data-history-back]').forEach(el => {
    el.addEventListener('click', () => window.history.back());
  });
}

/**
 * 협력업체정보 관리 > 담당자 정보 추가/수정 팝업 상태를 구성합니다.
 * 화면설계에 따라 추가는 빈 입력 + 추가 버튼, 관리는 기존 값 + 수정/삭제 버튼을 표시합니다.
 */
function initPartnerContactForm() {
  const modal = document.getElementById('partnerContactFormModal');
  const triggers = Array.from(document.querySelectorAll('[data-open-modal="partnerContactFormModal"][data-contact-mode]'));
  if (!modal || !triggers.length) return;

  const field = id => modal.querySelector(`#${id}`);
  const splitNumber = (value, fallbackPrefix = '') => {
    const parts = String(value || '').split('-');
    return parts.length === 3 ? parts : [fallbackPrefix, '', ''];
  };
  const setHidden = (element, hidden) => {
    if (element) element.hidden = hidden;
  };

  const emailDomain = field('contactEmailDomain');
  const emailDirect = field('contactEmailDirect');
  emailDomain?.addEventListener('change', () => {
    const direct = emailDomain.value === 'direct';
    setHidden(emailDirect, !direct);
    if (!direct && emailDirect) emailDirect.value = '';
  });

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const editMode = trigger.dataset.contactMode === 'edit';
      const basicContact = trigger.dataset.contactKind === 'basic';
      const emailParts = String(trigger.dataset.contactEmail || '').split('@');
      const mobile = splitNumber(trigger.dataset.contactMobile, '010');
      const phone = splitNumber(trigger.dataset.contactPhone, '02');

      field('contactKindBasic').checked = editMode && basicContact;
      field('contactKindAdditional').checked = !editMode || !basicContact;
      field('contactName').value = editMode ? (trigger.dataset.contactName || '') : '';
      field('contactPosition').value = editMode ? (trigger.dataset.contactPosition || '') : '';
      field('contactDuty').value = editMode ? (trigger.dataset.contactDuty || '') : '';
      field('contactEmailLocal').value = editMode ? (emailParts[0] || '') : '';

      const knownDomain = Array.from(emailDomain?.options || []).some(option => option.value === emailParts[1]);
      if (emailDomain) emailDomain.value = editMode && emailParts[1] ? (knownDomain ? emailParts[1] : 'direct') : '';
      if (emailDirect) emailDirect.value = editMode && emailParts[1] && !knownDomain ? emailParts[1] : '';
      setHidden(emailDirect, emailDomain?.value !== 'direct');

      field('contactMobilePrefix').value = mobile[0] || '010';
      field('contactMobileMiddle').value = mobile[1] || '';
      field('contactMobileLast').value = mobile[2] || '';
      field('contactPhonePrefix').value = phone[0] || '02';
      field('contactPhoneMiddle').value = phone[1] || '';
      field('contactPhoneLast').value = phone[2] || '';

      setHidden(field('contactAddButton'), editMode);
      setHidden(field('contactUpdateButton'), !editMode);
      setHidden(field('contactDeleteButton'), !editMode || basicContact);
      modal.classList.add('show');
    });
  });
}

/**
 * 독립 HTML로 분리된 팝업을 현재 화면에 불러옵니다 (DESIGN_GUIDE 5.8).
 * 부모 화면에는 팝업 마크업을 두지 않고 JSON manifest만 유지합니다.
 */
async function loadExternalModals() {
  const manifest = document.querySelector('script.external-modal-manifest[type="application/json"]');
  if (!manifest) return;

  let sources = [];
  try {
    sources = JSON.parse(manifest.textContent || '[]');
  } catch (error) {
    console.error('외부 팝업 manifest를 해석하지 못했습니다.', error);
    return;
  }

  // file:// 에서는 브라우저가 fetch를 막으므로 모듈별 popups/popup-bundle.js(tools/build_popup_bundle.py 생성)를 사용합니다.
  const bundle = window.KEPCO_POPUP_BUNDLE || {};
  const useBundle = window.location.protocol === 'file:';
  const readPopup = async source => {
    if (useBundle && typeof bundle[source] === 'string') return bundle[source];
    const response = await fetch(source, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.text();
  };

  const parser = new DOMParser();
  await Promise.all(sources.map(async source => {
    try {
      const popupDocument = parser.parseFromString(await readPopup(source), 'text/html');
      const modal = popupDocument.querySelector('.modal-backdrop');
      if (!modal) throw new Error('modal-backdrop 루트가 없습니다.');
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      document.body.appendChild(document.importNode(modal, true));
    } catch (error) {
      console.error(`팝업을 불러오지 못했습니다: ${source}`, error);
    }
  }));
}

/**
 * 첨부파일 표시 표준화 (DESIGN_GUIDE 5.12)
 * 파일명만 나열된 기존 마크업도 파일별 한 줄 + 바로보기/다운로드 액션으로 보정합니다.
 */
function initAttachmentDisplays() {
  const fileExtensionPattern = /\.(pdf|hwp|hwpx|doc|docx|xls|xlsx|ppt|pptx|zip)$/i;

  document.querySelectorAll('.content-bullet-item').forEach(container => {
    const directTextNodes = Array.from(container.childNodes).filter(node =>
      node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );
    if (!directTextNodes.length) return;

    const fileNames = directTextNodes
      .map(node => node.textContent.trim())
      .join(' ')
      .split(/\s*·\s*/)
      .map(name => name.trim())
      .filter(Boolean);
    if (!fileNames.length || !fileNames.every(name => fileExtensionPattern.test(name))) return;

    const fileList = document.createElement('div');
    fileList.className = 'srm-file-list';
    const existingDeleteButton = Array.from(container.children).find(child =>
      child.matches('button.btn-row-del, button.btn-delete')
    );

    fileNames.forEach((fileName, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'srm-file-item';

      const name = document.createElement('span');
      name.textContent = fileName;

      const preview = document.createElement('button');
      preview.type = 'button';
      preview.className = 'btn-file-preview';
      preview.textContent = '바로보기';
      preview.setAttribute('aria-label', `${fileName} 바로보기`);

      const download = document.createElement('button');
      download.type = 'button';
      download.className = 'btn-file-download';
      download.textContent = '다운로드';
      download.setAttribute('aria-label', `${fileName} 다운로드`);

      fileItem.append(name, preview, download);
      if (index === 0 && existingDeleteButton) fileItem.appendChild(existingDeleteButton);
      fileList.appendChild(fileItem);
    });

    const firstContentNode = directTextNodes[0];
    container.insertBefore(fileList, firstContentNode);
    directTextNodes.forEach(node => node.remove());
    container.classList.remove('content-bullet-item');
  });
}

/**
 * 공통 토스트 알림 (DESIGN_GUIDE 5.9)
 */
function showToast(message, type = 'info') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }

  const persistent = type === 'warning' || type === 'danger';
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', persistent ? 'alert' : 'status');
  toast.innerHTML = `
    <svg class="toast-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9"></circle><path d="M12 11v5"></path><path d="M12 8h.01"></path>
    </svg>
    <span class="toast-message"></span>
    <button type="button" class="toast-close" aria-label="알림 닫기">&times;</button>`;
  toast.querySelector('.toast-message').textContent = String(message);
  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  stack.appendChild(toast);

  if (!persistent) window.setTimeout(() => toast.remove(), 3000);
}

/**
 * 업무 화면의 공통 헤더를 단순화합니다.
 * 전역 프로젝트 검색은 각 화면의 검색/조회 영역과 역할이 중복되므로 제거하고,
 * 프로토타입 화면 허브 링크도 사용자 헤더에서 노출하지 않습니다.
 */
function initHeaderCleanup() {
  document.querySelectorAll('.top-header .header-center, .app-header .header-center').forEach((center) => {
    if (center.querySelector('.search-box, .header-search-bar')) {
      center.remove();
    }
  });

  document.querySelectorAll('.top-header a[href="index.html"], .app-header a[href="index.html"]').forEach((link) => {
    const adjacentDivider = link.nextElementSibling;
    if (adjacentDivider?.classList.contains('user-divider')) {
      adjacentDivider.remove();
    }
    link.remove();
  });
}

/**
 * 페이지 타이틀 옆의 소개 문구를 화면별 도움말 버튼으로 대체합니다.
 */
function initPageManuals() {
  if (document.body.classList.contains('login-page-body')) return;

  const pageTitle = document.querySelector('main h1, .portal-main-heading, .login-card-title');
  if (!pageTitle || pageTitle.closest('.modal')) return;

  const manualByPage = {
    'index.html': '프로젝트의 전체 화면 구성을 확인하고 원하는 화면 카드를 선택해 새 창으로 열 수 있습니다. 카드 배치는 직접 이동한 뒤 저장할 수 있습니다.',
    'Dashboard.html': '즐겨찾기와 주요 프로젝트·자금 현황을 확인합니다. 각 현황 카드와 차트의 항목을 선택하면 관련 업무 화면으로 이동할 수 있습니다.',
    'ProjectSearch.html': '검색 조건을 입력한 뒤 조회 버튼을 선택합니다. 결과 그리드는 정렬, 가로 스크롤, 페이지 이동을 지원하며 프로젝트명을 선택하면 상세 화면으로 이동합니다.',
    'ProjectDetail.html': '프로젝트의 계약, 투자, 상환 및 진행 이력을 영역별로 확인합니다. 필요한 업무 버튼을 선택해 후속 절차를 진행할 수 있습니다.',
    'ProjectPromotion.html': '추진 단계의 프로젝트 정보를 기본 정보부터 사업 시행까지 5단계로 입력합니다. 필수 항목(*)을 입력한 뒤 다음 버튼이나 상단 단계 표시로 이동하고, 조회 버튼으로 거래처·담당자·EPC사를 선택할 수 있습니다.',
    'ProjectRegister.html': '사업의 계약 형태를 선택한 뒤 신규 프로젝트 접수 정보를 입력합니다.',
    'BusinessSettlement.html': '대상 프로젝트를 조회한 뒤 매출, 비용, 수익 및 상환 정보를 확인하고 결산 업무를 진행합니다.',
    'Statistics.html': '기준 연도와 분석 조건을 선택해 프로젝트, 투자 및 상환 현황을 차트와 집계 데이터로 확인합니다.',
    'StepWorkflow.html': '작성중인 입찰계획 목록을 검색·조회합니다. 발주계획 정보 확인부터 입찰계획 상세정보·심사/평가 계획·예정가/예비가·입찰 참여 서류·최종 점검까지 각 STEP에 바로 접근해 입력하고, 최종저장하면 입찰공고 단계로 넘어갑니다.',
    'PlanPerformance.html': '검색 조건을 설정해 프로젝트별 계획 대비 매출, 수익 및 상환 실적을 조회하고 비교합니다.',
    'PartnerRegister.html': '협력업체 등록 약관을 확인하고 기업·담당자 정보와 증빙서류를 단계별로 입력한 뒤 신청 내용을 제출합니다.',
    'SRMDashboardPartner.html': '내가 처리해야 할 견적·입찰·계약 업무와 마감 일정, 참여 현황, 공지사항을 확인합니다. 카드와 목록 항목을 선택하면 해당 업무 화면으로 이동합니다.',
    'SRMDashboardBiz.html': '내가 요청한 사전견적과 발주계약 건의 진행 단계를 확인합니다. 진행상황 확인 버튼으로 단계별 처리 이력을 볼 수 있습니다.',
    'SRMDashboardContract.html': '오늘 처리해야 할 접수·계획·심사·계약 업무와 입찰·수의계약 진행 현황을 확인합니다. 카드를 선택하면 해당 업무 화면으로 이동합니다.',
    'SRMDashboardAdmin.html': '시스템 운영 지표와 로그인 추이, 전자 입찰 현황을 확인합니다.',
    'SRMDetail.html': '전체 입찰공고 현황을 검색·조회합니다. 발주계획 정보/입찰계획 정보/입찰 참여현황/심사·평가/개찰/낙찰(업체 선정)/수의시담/계약 요청까지 진행상태에 따라 처리하고, 상단 탭으로 각 업무 영역을 빠르게 확인할 수 있습니다.',
    'SRMAdminManage.html': '그룹웨어와 연동된 관리자(직원) 목록을 검색·조회합니다. 상세정보 버튼을 선택하면 사용 여부와 매핑된 권한그룹을 확인할 수 있습니다.',
    'SRMPermGroupManage.html': '권한그룹을 검색·조회합니다. 권한그룹명을 선택하면 상세 화면으로 이동하고, 권한그룹 추가하기 버튼으로 새 권한그룹을 만들 수 있습니다.',
    'SRMPermGroupDetail.html': '권한그룹이 접근할 수 있는 메뉴를 설정합니다. 체크된 메뉴에만 접근할 수 있으며, 관리자(직원) 매핑 영역에서 이 권한그룹에 속한 관리자를 추가·삭제할 수 있습니다. 한 명의 관리자는 여러 권한그룹에 매핑될 수 있습니다.',
    'SRMSystemPermManage.html': '메뉴별 권한 부여 외에 별도로 관리하는 시스템 권한(예: 예정가격 입력 담당)의 부여 현황을 확인합니다. 관리자(직원) 추가하기로 담당자를 매핑하고, 삭제 버튼으로 권한을 해제할 수 있습니다.',
    'SRMIpManage.html': '본 시스템에 접속을 허용할 아이피(IP)를 검색·조회합니다. 접속 아이피(IP) 추가하기로 새 IP를 등록하고, 삭제 버튼으로 등록된 IP를 제거할 수 있습니다.',
    'SRMCodeManage.html': '대분류·중분류·소분류 3단계로 구성된 코드를 관리합니다. 왼쪽 코드를 선택하면 오른쪽에 하위 코드가 표시되며, 등록 버튼으로 새 코드를 추가할 수 있습니다.',
    'SRMLoginStats.html': '일별·월별·연도별 기준으로 로그인 횟수 추이를 그래프와 표로 확인합니다.',
    'SRMMenuAccessStats.html': '조회기간을 설정해 메뉴별(1~3Depth) 접속 횟수를 확인합니다.',
    'SRMClientManage.html': 'ERP와 연동된 거래처 목록을 검색·조회합니다. 거래처명을 선택하면 ERP에서 관리되는 상세정보를 확인할 수 있습니다.',
    'SRMNoticeManage.html': '공지사항을 검색·조회합니다. 제목을 선택하면 상세 내용을 확인하고, 등록 버튼으로 새 공지사항을 작성할 수 있습니다.',
    'SRMFileRepoManage.html': '양식 등 자료실 게시물을 검색·조회합니다. 제목을 선택하면 상세 내용과 첨부파일을 확인하고, 등록 버튼으로 새 자료를 게시할 수 있습니다.',
    'SRMPartnerNotice.html': '켑코이에스가 게시한 공지사항을 검색·조회합니다. 제목을 선택하면 상세 내용을 확인할 수 있습니다.',
    'SRMPartnerQna.html': '켑코이에스에 문의한 질문과 답변 내역을 검색·조회합니다. 등록 버튼으로 새 질문을 등록하고, 제목을 선택하면 질문·답변 내용을 확인할 수 있습니다.',
    'SRMPartnerFileRepo.html': '켑코이에스가 제공하는 양식 등 자료실 게시물을 검색·조회합니다. 제목을 선택하면 상세 내용과 첨부파일을 확인할 수 있습니다.',
    'SRMPartnerPreQuote.html': '요청받은 사전 견적 내역을 검색·조회합니다. 견적요청번호를 선택해 품목·전달자료를 확인하고, 견적 제출·견적 포기·제출 취소를 처리할 수 있습니다.',
    'SRMPartnerNegoRequest.html': '요청받은 수의계약 내역을 검색·조회합니다. 공고번호를 선택해 공고정보와 차수별 견적 요청 현황을 확인하고, 견적을 제출할 수 있습니다.',
    'SRMPartnerBidNotice.html': '입찰공고를 검색·조회합니다. 공고번호를 선택해 공고 상세정보·심사평가·참여서류를 확인하고, 내역서 버튼으로 입찰공고 내역서를 볼 수 있습니다.',
    'SRMPartnerBidJoin.html': '참여한(작성중 포함) 입찰 건을 검색·조회합니다. 공고번호를 선택해 입찰 서류 제출, 가격 투찰, 입찰 결과, 수의시담까지 단계별로 진행·확인할 수 있습니다.',
    'SRMPartnerContract.html': '체결된(또는 준비 중인) 계약 건을 검색·조회합니다. 계약번호를 선택해 계약 정보와 관련 서류를 확인하거나, 계약 관련 서류를 제출할 수 있습니다.',
    'SRMPartnerInfo.html': '우리 회사의 협력업체 정보를 확인하고, 기본정보 수정 요청·담당자 정보 추가/수정·비밀번호 변경을 각 탭에서 처리합니다.',
    'SRMDashNotice.html': '공지사항을 검색·조회합니다. 제목을 선택하면 상세 내용을 확인할 수 있습니다.',
    'SRMDashFileRepo.html': '양식 등 자료실 게시물을 검색·조회합니다. 제목을 선택하면 상세 내용과 첨부파일을 확인할 수 있습니다.',
    'SRMPreQuoteRequest.html': '작성 중인 사전 견적 요청을 검색·조회합니다. 신규 등록 후 기본정보·품목정보·전달자료·업체선정을 순서에 상관없이 입력하고, 최종 견적 요청으로 협력업체에 발송할 수 있습니다.',
    'SRMPreQuoteStatus.html': '전체 사전 견적 요청 현황을 검색·조회합니다. 견적요청번호를 선택해 요청 내역과 업체별 제출 현황을 확인하고, 재견적 요청·견적포기·제출취소를 처리할 수 있습니다.',
    'SRMOrderContractRequest.html': '작성중인 발주계약 요청을 검색·조회합니다. 신규 등록 후 기본정보·체크리스트(결재/세부정보/계약방법)·품목정보를 순서에 상관없이 입력하고, 전자결재 요청으로 계약담당자에게 이관할 수 있습니다.',
    'SRMOrderContractStatus.html': '전체 발주계약 요청현황을 검색·조회합니다. 요청번호를 선택해 상세정보와 발주계약 요청서를 확인하고, 진행상황 확인 팝업으로 발주계약 요청부터 계약관리까지의 처리 단계를 확인할 수 있습니다.',
    'SRMOrderPlanIntake.html': '전자결재가 완료된 발주계약 요청 목록을 검색·조회합니다. 계약담당자를 매핑하고, 발주계약 요청서와 상세정보를 확인한 뒤 접수 처리하면 발주계획 등록 단계로 넘어갑니다.',
    'SRMOrderPlanRegister.html': '발주계획 등록 건을 검색·조회합니다. 작성중 건은 기본정보·체크리스트(결재/세부정보/계약방법/낙찰방법/가격결정)·품목정보를 입력해 전자결재 요청하고, 결재요청·결재완료 건은 상세정보를 확인할 수 있습니다.',
    'SRMSoleSourcePlan.html': '발주계획 승인 후 자동 등록된 작성중 수의계약 건을 검색·조회합니다. 발주계획 정보 확인·수의계약 계획 상세정보·예정가·참여서류를 입력하고 최종저장하면 수의계약 현황 단계로 넘어갑니다.',
    'SRMSoleSourceStatus.html': '전체 수의계약 진행 건을 검색·조회합니다. 발주계획 정보/수의계약 계획 정보/견적 요청 및 확인/계약 요청 탭에서 견적요청·수의계약 완료처리·공고취소·ERP 거래처 매핑·계약요청(전자결재)까지 진행상태별로 처리할 수 있습니다.',
    'SRMContractStatus.html': '수의계약·입찰 건이 모두 모이는 전체 발주계약 현황을 검색·조회합니다. 계약 정보/계약 관련 서류/발주계약 요청 정보/발주계획 정보/입찰계획 정보 탭에서 계약 변경 처리, 서류 등록/확정 처리(계약정보로 전송)를 진행할 수 있습니다.',
    'SRMPartnerApproval.html': '관리자의 승인/거절 처리가 필요한 협력업체 신청·정보수정 요청 건을 검색·조회합니다. 신청내역을 확인해 승인 또는 거절 처리할 수 있습니다.',
    'SRMPartnerManage.html': '승인된 협력업체 목록을 검색·조회합니다. 처리상태·사용여부 관리, 담당자 정보 추가/수정, 임시 비밀번호 발송, 소싱 그룹 설정, 협력업체 정보 수정까지 처리할 수 있습니다.',
    'SRMPartnerQnaManage.html': '협력업체가 등록한 질문과 답변을 검색·조회합니다. 질문 내용을 확인하고 답변을 등록/수정할 수 있습니다.',
    'SRMCommonItemManage.html': '공통 품목 목록을 검색·조회합니다. 품목을 등록/수정/삭제할 수 있으며, 등록된 품목은 발주계약 요청·발주계획 등에서 공통 품목으로 불러와 사용할 수 있습니다.',
    'SRMSourcingGroupManage.html': '협력업체의 소싱 그룹 분류(대/중/소)를 코드관리와 유사한 3단 구조로 관리합니다. 각 분류마다 코드를 등록하고 사용여부·순서를 조정할 수 있습니다.',
    'SRMCommonEvalManage.html': '심사/평가 항목 등록을 위한 공통 템플릿을 검색·조회합니다. 템플릿을 등록/수정하고, 템플릿 안의 개별 심사/평가 항목을 추가·수정·삭제할 수 있습니다.',
    'SRMCommonDocManage.html': '입찰 참여 서류·수의계약 참여 서류 등록을 위한 공통 템플릿을 검색·조회합니다. 템플릿을 등록/수정하고, 템플릿 안의 개별 서류 항목을 추가·삭제할 수 있습니다.',
    'SRMMailContentManage.html': '시스템이 자동 발송하는 메일/메시지의 상황별 제목·내용을 검색·조회합니다. 발송 방법과 이메일/메시지 내용을 수정할 수 있습니다.',
    'SRMMailSend.html': '협력업체·거래처·직원을 대상으로 수동 메일/메시지를 발송합니다. 발송 대상을 유형별로 선택하거나 수동으로 등록한 뒤, 발송 방법과 내용을 입력해 발송할 수 있습니다.',
    'SRMMailSendStatus.html': '자동/수동으로 발송된 메일/메시지 이력을 검색·조회합니다.'
  };

  const pageName = window.location.pathname.split('/').pop() || 'Dashboard.html';
  const manualText = manualByPage[pageName] || '현재 화면의 조회 조건과 업무 항목을 확인하고 필요한 기능을 선택해 작업을 진행합니다.';

  pageTitle.querySelectorAll('span').forEach((description) => description.remove());
  pageTitle.parentElement?.querySelectorAll(':scope > .page-subtitle, :scope > .dashboard-subtitle').forEach((description) => description.remove());

  const manualId = `pageManual-${pageName.replace(/[^a-z0-9]/gi, '')}`;
  const titleRow = document.createElement('div');
  titleRow.className = 'page-title-manual-row';
  pageTitle.parentNode.insertBefore(titleRow, pageTitle);
  titleRow.appendChild(pageTitle);

  const titleActions = document.createElement('div');
  titleActions.className = 'page-title-actions';
  titleRow.appendChild(titleActions);

  const manualButton = document.createElement('button');
  manualButton.type = 'button';
  manualButton.className = 'btn-page-manual';
  manualButton.textContent = '?';
  manualButton.setAttribute('aria-label', `${pageTitle.textContent.trim()} 화면 매뉴얼 열기`);
  manualButton.setAttribute('aria-controls', manualId);
  manualButton.setAttribute('aria-expanded', 'false');
  titleActions.appendChild(manualButton);

  const createTitleAction = ({ className, label, title, icon }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn-page-output ${className}`;
    button.setAttribute('aria-label', label);
    button.title = title;
    button.innerHTML = icon;
    titleActions.appendChild(button);
    return button;
  };

  const printButton = createTitleAction({
    className: 'btn-page-print',
    label: `${pageTitle.textContent.trim()} 콘텐츠 영역 인쇄`,
    title: '콘텐츠 영역 인쇄',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/></svg>'
  });

  const pdfButton = createTitleAction({
    className: 'btn-page-pdf',
    label: `${pageTitle.textContent.trim()} 콘텐츠 영역 PDF 저장`,
    title: '콘텐츠 영역 PDF 저장',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l4 4v16H6zM14 2v5h5M9 12v6M9 18l-2-2M9 18l2-2M13 18h4"/></svg>'
  });

  const openContentPrint = (mode) => {
    const content = document.querySelector('main');
    if (!content) return;
    document.body.classList.add('content-output-mode');
    document.body.dataset.contentOutput = mode;
    const cleanup = () => {
      document.body.classList.remove('content-output-mode');
      delete document.body.dataset.contentOutput;
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    window.setTimeout(cleanup, 60000);
  };

  printButton.addEventListener('click', () => openContentPrint('print'));
  pdfButton.addEventListener('click', () => openContentPrint('pdf'));

  const manualPanel = document.createElement('div');
  manualPanel.id = manualId;
  manualPanel.className = 'page-manual-panel';
  manualPanel.setAttribute('role', 'region');
  manualPanel.setAttribute('aria-label', `${pageTitle.textContent.trim()} 화면 매뉴얼`);
  manualPanel.hidden = true;
  manualPanel.innerHTML = `<strong>화면 이용 안내</strong><p>${manualText}</p>`;
  titleRow.appendChild(manualPanel);

  const setManualOpen = (open) => {
    manualPanel.hidden = !open;
    manualButton.setAttribute('aria-expanded', String(open));
    manualButton.setAttribute('aria-label', `${pageTitle.textContent.trim()} 화면 매뉴얼 ${open ? '닫기' : '열기'}`);
  };

  manualButton.addEventListener('click', () => {
    setManualOpen(manualButton.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('click', (event) => {
    if (!manualPanel.hidden && !manualPanel.contains(event.target) && event.target !== manualButton) {
      setManualOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !manualPanel.hidden) {
      setManualOpen(false);
      manualButton.focus();
    }
  });
}

/**
 * 셀렉트와 날짜 입력의 네이티브 동작을 보장합니다.
 */
function initNativeFormControls() {
  document.querySelectorAll('input.date-input').forEach((input) => {
    if (input.type !== 'date') {
      input.value = input.value.replace(/\./g, '-');
      input.type = 'date';
    }
  });

  document.querySelectorAll('input[type="date"]').forEach((input) => {
    input.addEventListener('click', () => {
      if (typeof input.showPicker === 'function') {
        try {
          input.showPicker();
        } catch (error) {
          // 지원하지 않는 브라우저는 기본 날짜 입력 동작을 그대로 사용합니다.
        }
      }
    });
  });

  document.querySelectorAll('.btn-sidebar-manual').forEach((button) => {
    button.addEventListener('click', () => {
      showToast('온라인 매뉴얼(SRM 전자입찰시스템) 가이드를 호출합니다.');
    });
  });

  document.getElementById('btnpartnermanual')?.addEventListener('click', () => {
    showToast('협력업체 이용 매뉴얼 PDF 다운로드를 시작합니다.');
  });

  document.querySelectorAll('.btn-address-search').forEach((button) => {
    button.addEventListener('click', () => {
      showToast('주소 검색 팝업을 연계합니다.');
    });
  });
}

/**
 * 좌측 사이드바 인터랙션 초기화 (LeftMenu.jpeg 기준)
 */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('btnToggleSidebar') || document.getElementById('btnmenutoggle');
  const navItems = document.querySelectorAll('.nav-item');
  const header = document.querySelector('.top-header, .app-header');
  const headerLeft = header?.querySelector('.header-left');
  const brand = headerLeft?.querySelector('.header-brand-wrap, .brand-logo-wrap');

  // CI와 메뉴 토글을 사이드바와 동일한 너비의 헤더 영역으로 묶습니다.
  if (headerLeft && brand && toggleBtn && !headerLeft.querySelector('.header-sidebar-zone')) {
    const sidebarZone = document.createElement('div');
    sidebarZone.className = 'header-sidebar-zone';
    headerLeft.insertBefore(sidebarZone, brand);
    sidebarZone.append(brand, toggleBtn);
  }

  // 시스템 구분 배지는 제거하고 "시스템명(PMS/SRM)" 단일 텍스트로 표시합니다.
  const systemTitle = headerLeft?.querySelector('.system-title');
  const systemBadge = headerLeft?.querySelector('.badge-pms, .system-badge');
  if (systemTitle && systemBadge) {
    const systemCode = systemBadge.textContent.trim();
    if (systemCode && !systemTitle.textContent.includes(`(${systemCode})`)) {
      systemTitle.textContent = `${systemTitle.textContent.trim()}(${systemCode})`;
    }
    systemBadge.remove();
  }

  // 시스템 코드 "(PMS)/(SRM)"를 별도 span 으로 분리해 시스템명과 다른 서체로 표시합니다.
  const headerTitle = headerLeft?.querySelector('.system-title');
  if (headerTitle && !headerTitle.querySelector('.system-code')) {
    headerTitle.innerHTML = headerTitle.textContent.trim().replace(/\((PMS|SRM)\)$/, '<span class="system-code">($1)</span>');
  }

  applySidebarMenuIcons(navItems);
  applySidebarBottomActions();

  // 사이드바 축소/확장 토글
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      header?.classList.toggle('sidebar-collapsed', sidebar.classList.contains('collapsed'));
      // 축소 시 열려있는 모든 서브메뉴 닫기
      if (sidebar.classList.contains('collapsed')) {
        navItems.forEach(item => item.classList.remove('open'));
      }
    });
  }

  // 메뉴 아코디언 토글
  navItems.forEach(item => {
    const link = item.querySelector('.nav-link');
    const submenu = item.querySelector('.submenu');

    if (link) {
      link.addEventListener('click', (e) => {
        if (submenu) {
          e.preventDefault();

          // 사이드바가 축소된 상태라면 먼저 확장
          if (sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            header?.classList.remove('sidebar-collapsed');
            setTimeout(() => {
              item.classList.toggle('open');
            }, 150);
            return;
          }

          const isOpen = item.classList.contains('open');

          // 단일 아코디언 모드 (다른 열린 메뉴 닫기)
          navItems.forEach(other => {
            if (other !== item) other.classList.remove('open');
          });

          if (!isOpen) {
            item.classList.add('open');
          } else {
            item.classList.remove('open');
          }
        }
      });
    }
  });
}

/** 메뉴명에 맞는 직관적인 공통 컬러 아이콘을 적용합니다. */
function applySidebarMenuIcons(navItems) {
  const svg = paths => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const icons = {
    dashboard: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    intake: svg('<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>'),
    project: svg('<path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h4"/>'),
    contract: svg('<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 11h6M9 15h4"/><path d="m14 18 2 2 4-5"/>'),
    funds: svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
    settlement: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/>'),
    statistics: svg('<path d="M12 2v10h10A10 10 0 1 1 12 2Z"/><path d="M16 2.8A10 10 0 0 1 21.2 8H16Z"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    travel: svg('<path d="M12 21s7-5 7-12a7 7 0 1 0-14 0c0 7 7 12 7 12Z"/><circle cx="12" cy="9" r="2"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>'),
    estimate: svg('<path d="M7 3h10v4H7z"/><path d="M5 5H3v16h18V5h-2M7 11h10M7 15h6"/>'),
    plan: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'),
    bid: svg('<path d="m14 4 6 6M12 6l6 6M4 20l8-8M3 21h8"/><path d="m10 8 4-4 6 6-4 4z"/>'),
    partner: svg('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2"/><path d="M3 20a6 6 0 0 1 12 0M14 20a4 4 0 0 1 7 0"/>'),
    support: svg('<path d="M4 13a8 8 0 0 1 16 0"/><path d="M4 13v4a2 2 0 0 0 2 2h2v-6H4ZM20 13v4a2 2 0 0 1-2 2h-2v-6h4Z"/>'),
    database: svg('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>'),
    orderRequest: svg('<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4"/><path d="M12 11v6M9 14h6"/>'),
    negotiated: svg('<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>')
  };

  const resolveIcon = label => {
    if (label.includes('대시보드')) return [icons.dashboard, '#1976d2'];
    if (label.includes('사업 접수')) return [icons.intake, '#1976d2'];
    if (label.includes('프로젝트')) return [icons.project, '#0284c7'];
    if (label.includes('자금')) return [icons.funds, '#00b894'];
    if (label.includes('결산')) return [icons.settlement, '#00b894'];
    if (label.includes('통계')) return [icons.statistics, '#ff7a00'];
    if (label.includes('마이')) return [icons.user, '#1976d2'];
    if (label.includes('출장')) return [icons.travel, '#ef4444'];
    if (label.includes('기준정보')) return [icons.database, '#0284c7'];
    if (label.includes('공통')) return [icons.settings, '#0284c7'];
    if (label.includes('사전 견적')) return [icons.estimate, '#00b894'];
    if (label.includes('발주계획')) return [icons.plan, '#1976d2'];
    if (label.includes('입찰')) return [icons.bid, '#ff7a00'];
    if (label.includes('협력업체')) return [icons.partner, '#00b894'];
    if (label.includes('고객센터') || label.includes('자료실')) return [icons.support, '#1976d2'];
    if (label.includes('발주계약')) return [icons.orderRequest, '#ff7a00'];
    if (label.includes('수의계약')) return [icons.negotiated, '#ff7a00'];
    if (label.includes('계약')) return [icons.contract, '#ff7a00'];
    return [icons.dashboard, '#1976d2'];
  };

  navItems.forEach(item => {
    const link = item.querySelector(':scope > .nav-link');
    const label = link?.querySelector('.nav-text')?.textContent.trim() || '';
    if (!link || !label) return;
    let icon = link.querySelector('.nav-icon');
    if (!icon) {
      icon = document.createElement('span');
      icon.className = 'nav-icon';
      link.prepend(icon);
    }
    const [markup, color] = resolveIcon(label);
    icon.innerHTML = markup;
    icon.style.setProperty('color', color, 'important');
  });
}

/** 사이드바 하단 시스템 전환/매뉴얼 버튼의 아이콘과 레벨을 통일합니다. */
function applySidebarBottomActions() {
  const icon = paths => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const bidIcon = icon('<path d="m14 4 6 6M12 6l6 6M4 20l8-8M3 21h8"/><path d="m10 8 4-4 6 6-4 4z"/>');
  const pmsIcon = icon('<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3M7 9h4v5H7zM14 7h3v7h-3z"/>');
  const manualIcon = icon('<path d="M3 5.5A3.5 3.5 0 0 1 6.5 2H11v17H6.5A3.5 3.5 0 0 0 3 22Z"/><path d="M21 5.5A3.5 3.5 0 0 0 17.5 2H13v17h4.5A3.5 3.5 0 0 1 21 22Z"/>');

  document.querySelectorAll('.btn-sidebar-switch').forEach(button => {
    const markup = button.textContent.includes('SRM') ? bidIcon : pmsIcon;
    const host = button.querySelector('.switch-icon');
    const existingSvg = button.querySelector('svg');
    if (host) host.innerHTML = markup;
    else if (existingSvg) existingSvg.outerHTML = markup;
    else button.insertAdjacentHTML('afterbegin', markup);
  });

  document.querySelectorAll('.btn-sidebar-manual').forEach(button => {
    const existingSvg = button.querySelector('svg');
    if (existingSvg) existingSvg.outerHTML = manualIcon;
    else button.insertAdjacentHTML('afterbegin', manualIcon);
  });
}

/**
 * 상단 권한 그룹 버튼 활성화 토글
 */
function initPermissions() {
  const permBtns = document.querySelectorAll('.perm-btn');
  permBtns.forEach(btn => btn.setAttribute('aria-pressed', String(btn.classList.contains('active'))));
  permBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      permBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    });
  });
}

/**
 * 도넛 차트 SVG 동적 렌더링
 */
function renderDonutCharts() {
  // 1. 계약 형태 (총 180건)
  // ESCO 계약: 140 (Blue #0284c7)
  // EPC(용역) 계약: 20 (Cyan #38bdf8)
  // 기타: 20 (Amber #f59e0b)
  createDonut('chartcontractform', [
    { label: 'ESCO 계약', value: 140, color: '#0284c7' },
    { label: 'EPC(용역) 계약', value: 20, color: '#38bdf8' },
    { label: '기타', value: 20, color: '#f59e0b' }
  ]);

  // 2. 계약 유형 (총 184건)
  // 수익사업: 140 (Purple #8b5cf6)
  // 정책사업: 20 (Coral #f87171)
  // 정책사업(비표준): 20 (Teal #2dd4bf)
  // 기타: 4 (Gold #fbbf24)
  createDonut('chartcontracttype', [
    { label: '수익사업', value: 140, color: '#8b5cf6' },
    { label: '정책사업', value: 20, color: '#f87171' },
    { label: '정책사업(비표준)', value: 20, color: '#2dd4bf' },
    { label: '기타', value: 4, color: '#fbbf24' }
  ]);

  // 3. 사업 심의 (총 160건)
  // 심의 대상: 140 (Emerald #10b981)
  // 심의 면제: 20 (Orange #f97316)
  createDonut('chartreviewstatus', [
    { label: '심의 대상', value: 140, color: '#10b981' },
    { label: '심의 면제', value: 20, color: '#f97316' }
  ]);
}

/**
 * SVG 도넛 차트 생성기
 */
function createDonut(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const total = data.reduce((acc, cur) => acc + cur.value, 0);
  container.dataset.total = String(total);
  container.setAttribute('role', 'img');
  container.setAttribute('aria-label', data.map(item => `${item.label} ${item.value}건`).join(', '));
  const size = 100;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2; // 39
  const circumference = 2 * Math.PI * radius; // ~245.04

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', data.map(item => `${item.label} ${item.value}건`).join(', '));

  let accumulatedOffset = 0;

  data.forEach(item => {
    const sliceRatio = item.value / total;
    const strokeDash = sliceRatio * circumference;
    const gap = circumference - strokeDash;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', size / 2);
    circle.setAttribute('cy', size / 2);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', item.color);
    circle.setAttribute('stroke-width', strokeWidth);
    circle.setAttribute('stroke-dasharray', `${strokeDash} ${gap}`);
    circle.setAttribute('stroke-dashoffset', -accumulatedOffset);
    circle.style.transition = 'all 0.3s ease';
    circle.style.cursor = 'pointer';

    // 마우스 오버 인터랙션
    circle.addEventListener('mouseenter', () => {
      circle.setAttribute('stroke-width', strokeWidth + 3);
    });
    circle.addEventListener('mouseleave', () => {
      circle.setAttribute('stroke-width', strokeWidth);
    });

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${item.label}: ${item.value}건 (${Math.round(sliceRatio * 100)}%)`;
    circle.appendChild(title);

    svg.appendChild(circle);
    accumulatedOffset += strokeDash;
  });

  container.innerHTML = '';
  container.appendChild(svg);
  const totalLabel = document.createElement('span');
  totalLabel.className = 'donut-chart-total';
  totalLabel.textContent = total.toLocaleString('ko-KR');
  totalLabel.setAttribute('aria-hidden', 'true');
  container.appendChild(totalLabel);
  container.classList.add('chart-rendered');
}

/**
 * 목표 대비 실적 막대 그래프 부드러운 애니메이션
 */
function animateBarCharts() {
  const bars = document.querySelectorAll('.bar-fill');
  bars.forEach(bar => {
    const targetHeight = bar.getAttribute('data-height');
    bar.style.height = '0%';
    setTimeout(() => {
      bar.style.height = targetHeight + '%';
    }, 200);
  });
}

/**
 * 투자/상환 현황 게이지 바 애니메이션
 */
function animateProgressBars() {
  const bars = document.querySelectorAll('.finance-progress-bar');
  bars.forEach(bar => {
    const targetWidth = bar.getAttribute('data-progress') || '85%';
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.width = targetWidth;
    }, 300);
  });
}

/**
 * 신규 프로젝트 등록 페이지 내부 작업영역 인터랙션
 */
function initProjectRegisterWorkspace() {
  const registerWorkspace = document.getElementById('projectRegisterWorkspace');
  if (!registerWorkspace) return;

  const btnOpenModal = document.getElementById('btnOpenRegisterModal');
  const contractCards = document.querySelectorAll('.contract-option-card');
  const step1 = document.getElementById('registerStep1');
  const step2 = document.getElementById('registerStep2');
  const btnFormPrev = document.getElementById('btnFormPrev');
  const projectForm = document.getElementById('projectRegisterForm');
  const contractBadge = document.getElementById('selectedContractBadge');
  const btnContinueContract = document.getElementById('btnContinueContract');
  const contractSelectionText = document.getElementById('contractSelectionText');
  let selectedContractType = '';

  const mainContent = document.querySelector('.main-content');
  const pageHeader = mainContent?.querySelector('.dashboard-header');
  if (pageHeader && registerWorkspace.parentElement !== mainContent) {
    pageHeader.insertAdjacentElement('afterend', registerWorkspace);
  }

  // 모달 상태 초기화 (Step 1로 복귀)
  function resetModal() {
    if (step1) step1.style.display = 'block';
    if (step2) step2.classList.remove('active');
    if (projectForm) projectForm.reset();
    selectedContractType = '';
    contractCards.forEach(card => {
      card.classList.remove('selected');
      card.setAttribute('aria-pressed', 'false');
    });
    if (contractSelectionText) contractSelectionText.textContent = '계약 형태를 선택해 주세요.';
    if (btnContinueContract) btnContinueContract.disabled = true;
  }

  if (btnOpenModal) {
    btnOpenModal.addEventListener('click', () => {
      resetModal();
      registerWorkspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Step 1: 계약 형태를 먼저 선택하고 확인한 뒤 Step 2로 이동
  contractCards.forEach(card => {
    card.addEventListener('click', () => {
      selectedContractType = card.getAttribute('data-contract') || 'ESCO 계약';
      contractCards.forEach(item => {
        const isSelected = item === card;
        item.classList.toggle('selected', isSelected);
        item.setAttribute('aria-pressed', String(isSelected));
      });
      if (contractSelectionText) contractSelectionText.textContent = `선택됨: ${selectedContractType}`;
      if (btnContinueContract) btnContinueContract.disabled = false;
    });
  });

  btnContinueContract?.addEventListener('click', () => {
    if (!selectedContractType) return;
    if (contractBadge) contractBadge.textContent = `계약 형태 : ${selectedContractType}`;
    if (step1) step1.style.display = 'none';
    if (step2) step2.classList.add('active');
    step2?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Step 2 -> Step 1 이전 버튼
  if (btnFormPrev) {
    btnFormPrev.addEventListener('click', () => {
      if (step2) step2.classList.remove('active');
      if (step1) step1.style.display = 'block';
    });
  }

  // Step 2 폼 제출 (프로젝트 등록 완료 시뮬레이션)
  if (projectForm) {
    projectForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pName = document.getElementById('regProjectName')?.value || '신규 프로젝트';
      const pClient = document.getElementById('regClientName')?.value || '고객사';
      const pAmount = document.getElementById('regAmount')?.value || '1,000,000,000';
      const cType = contractBadge?.textContent.replace('계약 형태 : ', '') || 'ESCO계약';

      // 테이블 맨 위에 새 행 추가
      const tbody = document.querySelector('.data-table tbody');
      if (tbody) {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
        const tr = document.createElement('tr');
        tr.style.backgroundColor = '#f0fdf4';
        tr.innerHTML = `
          <td><input type="checkbox"></td>
          <td>NEW</td>
          <td>2026</td>
          <td>${today}</td>
          <td>23213-2399</td>
          <td><strong>${cType}</strong></td>
          <td style="text-align: left;"><a class="project-title-link">${pName}</a></td>
          <td><span class="status-pill active-ing">신규 접수</span></td>
          <td>${pClient}</td>
          <td>서울</td>
          <td>신규설비</td>
          <td>건축물</td>
          <td>수익사업</td>
          <td>신규제안</td>
          <td style="text-align: right;">${pAmount}</td>
          <td style="text-align: right;">-</td>
        `;
        tbody.prepend(tr);
      }

      showToast(`[${cType}] "${pName}" 프로젝트가 성공적으로 등록되었습니다.`);
      resetModal();
      document.querySelector('.table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

/**
 * SRM 로그인 화면 인터랙션 ([참고]로그인 화면.jpeg & [설계] 로그인 화면.pdf)
 */
function initSRMLoginPage() {
  const loginForm = document.getElementById('srmLoginForm');
  if (!loginForm && !document.querySelector('.bidding-notice-card')) return;

  const idInput = document.getElementById('loginUserId');
  const pwInput = document.getElementById('loginUserPw');
  const tabBtns = document.querySelectorAll('.bidding-tab-btn');
  const slides = document.querySelectorAll('.bidding-slide');
  const prevBtn = document.getElementById('btnPrevBidding');
  const nextBtn = document.getElementById('btnNextBidding');
  const dots = document.querySelectorAll('.bidding-dot');

  let currentSlideIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
  if (currentSlideIndex < 0) currentSlideIndex = 0;

  function showSlide(index) {
    if (!slides.length) return;
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentSlideIndex = index;

    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === currentSlideIndex);
    });

    dots.forEach((dot, idx) => {
      const isActive = idx === currentSlideIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-pressed', String(isActive));
    });

    const activeCategory = slides[currentSlideIndex]?.getAttribute('data-category');
    tabBtns.forEach(tab => {
      const isActive = tab.getAttribute('data-tab') === activeCategory;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-pressed', String(isActive));
    });
  }

  showSlide(currentSlideIndex);

  if (prevBtn) {
    prevBtn.addEventListener('click', () => showSlide(currentSlideIndex - 1));
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => showSlide(currentSlideIndex + 1));
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index') || '0', 10);
      showSlide(idx);
    });
  });

  // 탭 클릭 필터
  tabBtns.forEach(tab => {
    tab.addEventListener('click', () => {
      tabBtns.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-pressed', 'true');
      const targetCategory = tab.getAttribute('data-tab');
      // 해당 카테고리의 첫 번째 슬라이드 찾기
      const targetIndex = Array.from(slides).findIndex(s => s.getAttribute('data-category') === targetCategory);
      if (targetIndex !== -1) {
        showSlide(targetIndex);
      }
    });
  });

  // 프로토타입 로그인 분기
  // 아이디 1: 협력업체, 아이디 2: 내부 관리자
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredId = idInput?.value.trim();

      if (!enteredId) {
        showToast('아이디를 입력해 주세요.');
        return;
      }

      const loginRoutes = {
        '1': loginForm.dataset.partnerUrl,
        '2': loginForm.dataset.adminUrl
      };
      const targetUrl = loginRoutes[enteredId];

      if (!targetUrl) {
        showToast("아이디는 협력업체 '1' 또는 내부 관리자 '2'를 입력해 주세요.");
        idInput?.focus();
        idInput?.select();
        return;
      }

      window.location.href = targetUrl;
    });
  }

  // 입찰공고 클릭 시 상세 팝업 모달 토글 ([설계] 로그인 화면.pdf ④번 명세)
  const noticeTitles = document.querySelectorAll('.bidding-project-name');
  const biddingModal = document.getElementById('modalBiddingDetail');
  const closeBiddingModal = document.getElementById('btnCloseBiddingModal');
  const closeBiddingAction = document.getElementById('btnCloseBiddingAction');
  const joinBiddingButton = document.getElementById('btnJoinBidding');

  const closeBidding = () => {
    biddingModal?.classList.remove('show');
    biddingModal?.setAttribute('aria-hidden', 'true');
  };

  noticeTitles.forEach(title => {
    title.addEventListener('click', () => {
      if (biddingModal) {
        biddingModal.classList.add('show');
        biddingModal.setAttribute('aria-hidden', 'false');
        closeBiddingModal?.focus();
      }
    });
  });

  if (closeBiddingModal && biddingModal) {
    closeBiddingModal.addEventListener('click', () => {
      closeBidding();
    });
    biddingModal.addEventListener('click', (e) => {
      if (e.target === biddingModal) {
        closeBidding();
      }
    });
  }

  closeBiddingAction?.addEventListener('click', closeBidding);
  joinBiddingButton?.addEventListener('click', () => {
    showToast('입찰 참가를 위해서는 로그인이 필요합니다.');
    closeBidding();
    idInput?.focus();
  });

  // '협력업체 신청 →' 버튼은 PartnerRegister.html(5단계 위저드)로 직접 이동합니다.
  // (과거에는 여기서 별도 팝업을 가로챘으나, 실제 신청 절차는 PartnerRegister.html 하나로 통일합니다.)

  // 아이디 찾기 / 비밀번호 찾기 팝업
  const idFindModal = document.getElementById('modalIdFind');
  const pwFindModal = document.getElementById('modalPwFind');
  document.getElementById('btnFindId')?.addEventListener('click', (event) => {
    event.preventDefault();
    idFindModal?.classList.add('show');
  });
  document.getElementById('btnFindPw')?.addEventListener('click', (event) => {
    event.preventDefault();
    pwFindModal?.classList.add('show');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (biddingModal?.classList.contains('show')) closeBidding();
    if (partnerModal?.classList.contains('show')) closePartner();
  });
}

/**
 * 프로젝트 검색 및 조회 화면 인터랙션 (ProjectSearch.html)
 */
function initProjectSearchPage() {
  const filterCard = document.querySelector('.search-filter-card');
  if (!filterCard) return;

  const startDateInput = document.getElementById('searchStartDate');
  const endDateInput = document.getElementById('searchEndDate');
  const periodBtns = document.querySelectorAll('.btn-period-pill');
  const btnSearch = document.getElementById('btnDoSearch');
  const btnReset = document.getElementById('btnDoReset');
  const keywordInput = document.getElementById('searchKeyword');
  const contractTypeSelect = document.getElementById('selectContractType');
  const tableRows = document.querySelectorAll('.data-table tbody tr');
  const btnExcel = document.getElementById('btnExcelDownload');

  // 퀵 기간 버튼 클릭 로직
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      periodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const period = btn.getAttribute('data-period');
      const baseEnd = new Date('2026-07-30'); // 기준 종료일
      const newStart = new Date(baseEnd);

      if (period === '1d') {
        newStart.setDate(baseEnd.getDate() - 1);
      } else if (period === '1m') {
        newStart.setMonth(baseEnd.getMonth() - 1);
      } else if (period === '3m') {
        newStart.setMonth(baseEnd.getMonth() - 3);
      } else if (period === '1y') {
        newStart.setFullYear(baseEnd.getFullYear() - 1);
      }

      const fmt = d => d.toISOString().slice(0, 10);
      if (startDateInput && endDateInput) {
        startDateInput.value = fmt(newStart);
        endDateInput.value = fmt(baseEnd);
      }
    });
  });

  // 검색 버튼 클릭 시 실시간 필터링
  if (btnSearch) {
    btnSearch.addEventListener('click', () => {
      const kw = keywordInput?.value.trim().toLowerCase() || '';
      const cType = contractTypeSelect?.value || '';
      tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matchesKeyword = !kw || text.includes(kw);
        const matchesType = !cType || text.includes(cType.toLowerCase());

        if (matchesKeyword && matchesType) {
          row.dataset.filteredOut = 'false';
        } else {
          row.dataset.filteredOut = 'true';
        }
      });

      document.querySelector('.data-grid')?.dispatchEvent(new CustomEvent('grid:refresh'));

    });
  }

  // 초기화 버튼
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (keywordInput) keywordInput.value = '';
      if (contractTypeSelect) contractTypeSelect.value = '';
      const allSelects = filterCard.querySelectorAll('select');
      allSelects.forEach(s => s.selectedIndex = 0);
      const allInputs = filterCard.querySelectorAll('input[type="text"]');
      allInputs.forEach(i => i.value = '');

      tableRows.forEach(row => {
        row.dataset.filteredOut = 'false';
      });

      document.querySelector('.data-grid')?.dispatchEvent(new CustomEvent('grid:refresh'));


      // 1개월 버튼 기본 활성화
      periodBtns.forEach((b, idx) => {
        b.classList.toggle('active', b.getAttribute('data-period') === '1m');
      });
      if (startDateInput) startDateInput.value = '2025-07-31';
      if (endDateInput) endDateInput.value = '2026-07-30';
    });
  }

  // 엑셀 다운로드 안내
  if (btnExcel) {
    btnExcel.addEventListener('click', () => {
      showToast('현재 조회된 프로젝트 목록 데이터를 엑셀(XLSX) 파일로 다운로드합니다.');
    });
  }
}

/**
 * 표준 모달(.modal-backdrop) 공통 동작
 * - 배경 클릭, Esc 로 닫기(가장 위에 열린 모달부터)
 * - show 상태에 맞춰 aria-hidden 과 본문 스크롤 잠금(body.modal-open) 동기화
 * 여는 동작은 화면별 스크립트가 .show 클래스를 붙여 처리합니다.
 */
function initModals() {
  const getModals = () => Array.from(document.querySelectorAll('.modal-backdrop'));
  const syncBody = () => document.body.classList.toggle('modal-open', getModals().some(m => m.classList.contains('show') && !m.classList.contains('description-guide-backdrop')));

  getModals().forEach(modal => {
    new MutationObserver(() => {
      modal.setAttribute('aria-hidden', String(!modal.classList.contains('show')));
      syncBody();
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });

    modal.addEventListener('click', event => {
      if (event.target === modal) modal.classList.remove('show');
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const opened = getModals().filter(m => m.classList.contains('show'));
    const top = opened.sort((a, b) => (Number(getComputedStyle(a).zIndex) || 0) - (Number(getComputedStyle(b).zIndex) || 0)).pop();
    if (top) top.classList.remove('show');
  });
}

/**
 * 화면설계 Description 개발자 가이드 (DESIGN_GUIDE 5.15)
 * - 비차단형 우측 드로어 열기/상태 동기화
 * - 드로어가 열린 동안에만 화면설계 목적지 번호 표시
 */
function initDescriptionGuide() {
  const guides = Array.from(document.querySelectorAll('.description-guide-backdrop'));
  const triggers = Array.from(document.querySelectorAll('[data-description-guide-toggle]'));
  if (!guides.length || !triggers.length) return;

  const sync = () => {
    const hasOpenGuide = guides.some(guide => guide.classList.contains('show'));
    document.body.classList.toggle('description-guide-open', hasOpenGuide);
    guides.forEach(guide => guide.setAttribute('aria-hidden', String(!guide.classList.contains('show'))));
    triggers.forEach(trigger => {
      const target = document.getElementById(trigger.dataset.descriptionGuideToggle);
      trigger.setAttribute('aria-expanded', String(Boolean(target?.classList.contains('show'))));
    });
  };

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const target = document.getElementById(trigger.dataset.descriptionGuideToggle);
      if (!target) return;
      guides.forEach(guide => {
        if (guide !== target) guide.classList.remove('show');
      });
      target.classList.add('show');
      target.querySelector('.modal-close')?.focus();
      sync();
    });
  });

  guides.forEach(guide => {
    new MutationObserver(sync).observe(guide, { attributes: true, attributeFilter: ['class'] });
  });

  sync();
}

/**
 * 프로젝트 상세 화면 인터랙션 (ProjectDetail.html)
 */
function initProjectDetailPage() {
  const detailContainer = document.querySelector('.detail-tabs-bar');
  if (!detailContainer) return;

  // 투자금 정보 거래처 서브탭 전환
  const subtabBtns = document.querySelectorAll('.detail-subtab-btn');
  const partnerDataMap = {
    'posco': { name: '(주)포스코무역', total: '242,000,000', start: '2026.07.31', paid: '180,000,000', end: '2026.08.30', tax: '22,000,000', contract: '220,000,000', ratio: '33.3 / 33.3 / 33.4', supply: '220,000,000', rate: '60.5' },
    'garam': { name: '(주)가람석재', total: '154,000,000', start: '2026.08.01', paid: '92,400,000', end: '2026.09.15', tax: '14,000,000', contract: '140,000,000', ratio: '30.0 / 30.0 / 40.0', supply: '140,000,000', rate: '60.0' },
    'homemart': { name: '홈마트', total: '88,000,000', start: '2026.08.10', paid: '52,800,000', end: '2026.09.30', tax: '8,000,000', contract: '80,000,000', ratio: '20.0 / 40.0 / 40.0', supply: '80,000,000', rate: '60.0' }
  };

  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subtabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const partnerKey = btn.getAttribute('data-partner');
      const data = partnerDataMap[partnerKey];
      if (data) {
        const setTxt = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.textContent = val;
        };
        setTxt('f_partner_name', data.name);
        setTxt('f_total_vat', data.total);
        setTxt('f_start_date', data.start);
        setTxt('f_paid_amount', data.paid);
        setTxt('f_end_date', data.end);
        setTxt('f_tax_amount', data.tax);
        setTxt('f_contract_amount', data.contract);
        setTxt('f_pay_ratio', data.ratio);
        setTxt('f_supply_amount', data.supply);
        setTxt('f_pay_rate', data.rate);
      }
    });
  });

  // 프로젝트 첨부파일 버튼
  const btnFile = document.getElementById('btnProjectAttachment');
  if (btnFile) {
    btnFile.addEventListener('click', () => {
      showToast('프로젝트 첨부파일 목록:\n1. 20260701_천안_선영LED_사업계획서.pdf (3.4MB)\n2. 공사도급계약서_날인본.pdf (1.8MB)\n3. 설비사양서_및_도면.zip (14.2MB)\n\n다운로드 가능한 파일 3건이 확인되었습니다.');
    });
  }

  // 카드 헤더 플러스(+) 토글
  const plusBtns = document.querySelectorAll('.btn-card-plus');
  plusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('상세 내역 드릴다운(Drill-down) 팝업을 호출합니다.');
    });
  });
}

/**
 * 사업 결산 화면 인터랙션 (BusinessSettlement.html)
 */
function initBusinessSettlementPage() {
  const settleFilter = document.querySelector('.settlement-filter-card');
  if (!settleFilter) return;

  const periodBtns = settleFilter.querySelectorAll('.btn-period-pill');
  const startDateInput = document.getElementById('settleStartDate');
  const endDateInput = document.getElementById('settleEndDate');
  const btnSearch = document.getElementById('btnSettleSearch');
  const btnReset = document.getElementById('btnSettleReset');
  const typeSelect = document.getElementById('selectSettleType');
  const keywordInput = document.getElementById('settleKeyword');
  const tableRows = document.querySelectorAll('.settlement-table tbody tr');
  const btnExcel = document.getElementById('btnSettleExcel');

  // 기간 빠른 선택
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      periodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const period = btn.getAttribute('data-period');
      const baseEnd = new Date('2026-07-30');
      const newStart = new Date(baseEnd);

      if (period === '1d') {
        newStart.setDate(baseEnd.getDate() - 1);
      } else if (period === '1m') {
        newStart.setMonth(baseEnd.getMonth() - 1);
      } else if (period === '3m') {
        newStart.setMonth(baseEnd.getMonth() - 3);
      } else if (period === '1y') {
        newStart.setFullYear(baseEnd.getFullYear() - 1);
      }

      const fmt = d => d.toISOString().slice(0, 10);
      if (startDateInput && endDateInput) {
        startDateInput.value = fmt(newStart);
        endDateInput.value = fmt(baseEnd);
      }
    });
  });

  // 결산 검색 필터링
  if (btnSearch) {
    btnSearch.addEventListener('click', () => {
      const selectedType = typeSelect?.value || '';
      const kw = keywordInput?.value.trim().toLowerCase() || '';
      tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matchesType = !selectedType || text.includes(selectedType.toLowerCase());
        const matchesKw = !kw || text.includes(kw);

        if (matchesType && matchesKw) {
          row.dataset.filteredOut = 'false';
        } else {
          row.dataset.filteredOut = 'true';
        }
      });

      document.querySelector('.settlement-table')?.closest('.data-grid')?.dispatchEvent(new CustomEvent('grid:refresh'));
    });
  }

  // 초기화 버튼
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (typeSelect) typeSelect.selectedIndex = 0;
      if (keywordInput) keywordInput.value = '';
      if (startDateInput) startDateInput.value = '2026-07-01';
      if (endDateInput) endDateInput.value = '2026-07-30';

      periodBtns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-period') === '1m');
      });

      tableRows.forEach(row => row.dataset.filteredOut = 'false');
      document.querySelector('.settlement-table')?.closest('.data-grid')?.dispatchEvent(new CustomEvent('grid:refresh'));
    });
  }

  // 엑셀 다운로드
  if (btnExcel) {
    btnExcel.addEventListener('click', () => {
      showToast('현재 조회된 사업 결산 데이터를 엑셀(XLSX) 파일로 내려받습니다.');
    });
  }
}

/**
 * 통계 종합현황 화면 인터랙션 (Statistics.html)
 */
function initStatisticsPage() {
  const statsFilter = document.querySelector('.stats-filter-card');
  if (!statsFilter) return;

  const yearSelect = document.getElementById('statsYearSelect');
  const btnSearch = document.getElementById('btnStatsSearch');
  const btnReset = document.getElementById('btnStatsReset');
  const btnExcel = document.getElementById('btnStatsExcel');

  // 연도 변경 인터랙션
  if (btnSearch) {
    btnSearch.addEventListener('click', () => {
      const yr = yearSelect ? yearSelect.value : '2025';
      showToast(`${yr}년도 기준 프로젝트·투자·상환 및 설비/경로별 실적 데이터를 성공적으로 조회하였습니다.`);
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (yearSelect) yearSelect.value = '2025';
    });
  }

  // 엑셀 다운로드
  if (btnExcel) {
    btnExcel.addEventListener('click', () => {
      const yr = yearSelect ? yearSelect.value : '2025';
      showToast(`${yr}년도 종합 통계 분석 현황 데이터를 엑셀(XLSX) 파일로 다운로드합니다.`);
    });
  }
}

/**
 * SRM 입찰계획 현황 화면 인터랙션 (StepWorkflow.html)
 */
function initStepWorkflowPage() {
  const btnOpenCalcModal = document.querySelectorAll('.btn-open-calc-modal');
  const modalCalc = document.getElementById('modalCalcPrice');
  const btnCloseCalcModal = document.getElementById('btnCloseCalcModal');
  const btnCancelCalc = document.getElementById('btnCancelCalc');
  const btnAddRow = document.getElementById('btnAddCalcRow');
  const tbodyCalc = document.getElementById('tbodyCalcRows');

  const btnRequestApproval = document.getElementById('btnRequestApproval');
  const modalConfirm = document.getElementById('modalApprovalConfirm');
  const btnCloseConfirmModal = document.getElementById('btnCloseConfirmModal');
  const btnCancelConfirm = document.getElementById('btnCancelConfirm');
  const btnDoConfirmApproval = document.getElementById('btnDoConfirmApproval');

  // 모달 1 열기
  btnOpenCalcModal.forEach(btn => {
    btn.addEventListener('click', () => {
      if (modalCalc) modalCalc.classList.add('show');
    });
  });

  // 모달 1 닫기
  const closeCalc = () => {
    if (modalCalc) modalCalc.classList.remove('show');
  };
  if (btnCloseCalcModal) btnCloseCalcModal.addEventListener('click', closeCalc);
  if (btnCancelCalc) btnCancelCalc.addEventListener('click', closeCalc);

  // 실시간 합산 계산 함수
  function recalculateTotals() {
    let sumEstimated = 0;
    let sumAssessed = 0;

    const rowInputsEstimated = document.querySelectorAll('.calc-est-val');
    const rowInputsAssessed = document.querySelectorAll('.calc-ass-val');

    rowInputsEstimated.forEach(input => {
      const val = parseInt(input.value.replace(/[^0-9]/g, ''), 10) || 0;
      sumEstimated += val;
    });

    rowInputsAssessed.forEach(input => {
      const val = parseInt(input.value.replace(/[^0-9]/g, ''), 10) || 0;
      sumAssessed += val;
    });

    const vatEstimated = Math.round(sumEstimated * 0.1);
    const vatAssessed = Math.round(sumAssessed * 0.1);

    const totalEstimated = sumEstimated + vatEstimated;
    const totalAssessed = sumAssessed + vatAssessed;

    const fmt = n => n.toLocaleString();

    // 공급가액
    const elSupplyEst = document.getElementById('calcSupplyEstimated');
    const elSupplyAss = document.getElementById('calcSupplyAssessed');
    if (elSupplyEst) elSupplyEst.textContent = fmt(sumEstimated) + ' 원';
    if (elSupplyAss) elSupplyAss.textContent = fmt(sumAssessed) + ' 원';

    // 부가세
    const elVatEst = document.getElementById('calcVatEstimated');
    const elVatAss = document.getElementById('calcVatAssessed');
    if (elVatEst) elVatEst.textContent = fmt(vatEstimated) + ' 원';
    if (elVatAss) elVatAss.textContent = fmt(vatAssessed) + ' 원';

    // 총계
    const elTotEst = document.getElementById('calcTotalEstimated');
    const elTotAss = document.getElementById('calcTotalAssessed');
    if (elTotEst) elTotEst.textContent = fmt(totalEstimated) + ' 원';
    if (elTotAss) elTotAss.textContent = fmt(totalAssessed) + ' 원';
  }

  // 행 추가
  if (btnAddRow && tbodyCalc) {
    btnAddRow.addEventListener('click', () => {
      const newTr = document.createElement('tr');
      newTr.innerHTML = `
        <td><input type="text" class="calc-num-input calc-left" value="기타 추가 항목"></td>
        <td><input type="text" class="calc-num-input calc-est-val" value="1,000,000"></td>
        <td><input type="text" class="calc-num-input calc-ass-val" value="1,000,000"></td>
        <td><span class="diff-val">0원</span></td>
        <td><input type="text" class="filter-input calc-memo-input" placeholder="20자 이내로 간략히 작성해주세요."></td>
        <td><button type="button" class="btn-row-del">삭제</button></td>
      `;
      tbodyCalc.appendChild(newTr);

      // 이벤트 바인딩
      const delBtn = newTr.querySelector('.btn-row-del');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          newTr.remove();
          recalculateTotals();
        });
      }

      const inputs = newTr.querySelectorAll('.calc-est-val, .calc-ass-val');
      inputs.forEach(inp => {
        inp.addEventListener('input', recalculateTotals);
      });

      recalculateTotals();
    });
  }

  // 기존 행 삭제 및 인풋 이벤트
  const existingDelBtns = document.querySelectorAll('.btn-row-del');
  existingDelBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (tr) {
        tr.remove();
        recalculateTotals();
      }
    });
  });

  const existingInputs = document.querySelectorAll('.calc-est-val, .calc-ass-val');
  existingInputs.forEach(inp => {
    inp.addEventListener('input', recalculateTotals);
  });

  // 전자결재 요청 모달 2 열기
  if (btnRequestApproval && modalConfirm) {
    btnRequestApproval.addEventListener('click', () => {
      modalConfirm.classList.add('show');
    });
  }

  const closeConfirm = () => {
    if (modalConfirm) modalConfirm.classList.remove('show');
  };
  if (btnCloseConfirmModal) btnCloseConfirmModal.addEventListener('click', closeConfirm);
  if (btnCancelConfirm) btnCancelConfirm.addEventListener('click', closeConfirm);

  // 전자결재 최종 승인 처리
  if (btnDoConfirmApproval) {
    btnDoConfirmApproval.addEventListener('click', () => {
      closeConfirm();
      closeCalc();

      showToast('그룹웨어로 예정가격 산출기초조서 전자결재 요청이 정상 전송되었습니다.\nSTEP 02 단계가 [진행중]으로 전환됩니다.');

      // STEP 01 완료 상태 전환
      const step1Btn = document.querySelector('#workflowSubFlow .wizard-step-box:nth-child(1) .btn-task-register');
      if (step1Btn) {
        step1Btn.textContent = '완료';
        step1Btn.classList.remove('btn-task-register');
        step1Btn.classList.add('btn-task-done');
      }

      // 순서도: STEP 01 완료, STEP 02 진행 단계로 이동
      const flowBoxes = document.querySelectorAll('#workflowSubFlow .wizard-step-box');
      if (flowBoxes[0]) {
        flowBoxes[0].classList.remove('active');
        flowBoxes[0].classList.add('completed');
        flowBoxes[0].removeAttribute('aria-current');
      }
      if (flowBoxes[1]) {
        flowBoxes[1].classList.add('active');
        flowBoxes[1].setAttribute('aria-current', 'step');
      }
    });
  }
}

/**
 * SRM 권한별 대시보드 위젯 인터랙션 (SRMDashboardPartner / Biz / Contract / Admin.html)
 * - 권한 버튼(data-href) 이동, 범위·기간 칩 전환, 캘린더 날짜 선택, 파이프라인 단계 선택, 진행상황 팝업 열기
 */
function initDashboardWidgets() {
  // 권한 버튼: 해당 권한의 대시보드로 이동
  document.querySelectorAll('.perm-btn[data-href]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-current') !== 'true') window.location.href = btn.dataset.href;
    });
  });

  // 범위·기간 칩: data-panel 이 있으면 같은 카드 안의 패널을 전환
  document.querySelectorAll('.quick-period-btns').forEach(group => {
    const chips = Array.from(group.querySelectorAll('.btn-period-pill'));
    chips.forEach(chip => {
      chip.setAttribute('aria-pressed', String(chip.classList.contains('active')));
      chip.addEventListener('click', () => {
        chips.forEach(c => {
          c.classList.toggle('active', c === chip);
          c.setAttribute('aria-pressed', String(c === chip));
          const panel = c.dataset.panel && document.getElementById(c.dataset.panel);
          if (panel) panel.hidden = c !== chip;
        });
        const meta = chip.dataset.meta && group.closest('.app-card') && group.closest('.app-card').querySelector('.card-meta');
        if (meta) meta.textContent = chip.dataset.meta;
      });
    });
  });

  // 캘린더: 날짜 선택 시 해당 날짜의 일정 목록으로 교체
  document.querySelectorAll('.calendar').forEach(cal => {
    const days = Array.from(cal.querySelectorAll('.calendar-day'));
    const lists = Array.from(cal.querySelectorAll('.calendar-events'));
    const label = cal.querySelector('.calendar-events-date');
    days.forEach(day => {
      day.addEventListener('click', () => {
        days.forEach(d => { d.classList.toggle('is-selected', d === day); d.setAttribute('aria-pressed', String(d === day)); });
        lists.forEach(l => { l.hidden = l.dataset.date !== day.dataset.date; });
        if (label) label.textContent = day.dataset.label || '';
        const none = cal.querySelector('.calendar-events.is-none');
        if (none) none.hidden = lists.some(l => !l.hidden && !l.classList.contains('is-none'));
      });
    });
  });

  // 파이프라인: 선택한 단계 강조
  document.querySelectorAll('.pipeline-flow').forEach(flow => {
    const steps = Array.from(flow.querySelectorAll('.pipeline-step'));
    steps.forEach(step => {
      step.addEventListener('click', event => {
        event.preventDefault();
        steps.forEach(s => s.classList.toggle('is-selected', s === step && !s.classList.contains('is-selected')));
      });
    });
  });

  // 진행상황 확인 팝업 열기 / 게시판형 목록·상세·등록 화면 전환(DESIGN_GUIDE 6.2.1)
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.openModal);
      if (!target) return;
      if (target.classList.contains('board-view')) {
        target.parentElement?.querySelectorAll(':scope > .board-view').forEach(view => view.classList.remove('show'));
      }
      target.classList.add('show');
    });
  });
  document.querySelectorAll('.modal-backdrop [data-close-modal], .modal-backdrop .modal-close').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.modal-backdrop')?.classList.remove('show'));
  });
}

/**
 * 계획대비 실적현황 인터랙션 (PlanPerformance.html)
 * - 퀵 기간 버튼 자동 날짜 계산
 * - 사업구분 및 대상설비, 키워드 실시간 필터링
 * - 엑셀 다운로드
 */
function initPlanPerformancePage() {
  const searchForm = document.getElementById('planSearchForm');
  const tableBody = document.getElementById('planPerfTableBody');
  const quickBtns = document.querySelectorAll('.quick-date-btns .btn-quick-date');
  const startDateInput = document.getElementById('planStartDate');
  const endDateInput = document.getElementById('planEndDate');
  const bizTypeSelect = document.getElementById('selBizType');
  const facilitySelect = document.getElementById('selFacility');
  const keywordInput = document.getElementById('inputKeyword');
  const resetBtn = document.getElementById('btnFilterReset');
  const excelBtn = document.getElementById('btnExcelDownload');

  if (!tableBody) return;

  // 퀵 날짜 계산
  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      quickBtns.forEach(b => {
        b.classList.remove('active');
        b.style.borderColor = '#cbd5e1';
        b.style.background = '#ffffff';
        b.style.color = '#475569';
      });
      btn.classList.add('active');
      btn.style.borderColor = '#1976d2';
      btn.style.background = '#f0f7ff';
      btn.style.color = '#1976d2';

      const range = btn.getAttribute('data-range');
      const now = new Date(2026, 8, 19); // 2026-09-19 기준
      const endStr = '2030-10-19';
      let startObj = new Date(2021, 6, 15);

      if (range === '1d') {
        startObj = new Date(now);
        startObj.setDate(startObj.getDate() - 1);
      } else if (range === '1m') {
        startObj = new Date(now);
        startObj.setMonth(startObj.getMonth() - 1);
      } else if (range === '3m') {
        startObj = new Date(now);
        startObj.setMonth(startObj.getMonth() - 3);
      } else if (range === '1y') {
        startObj = new Date(now);
        startObj.setFullYear(startObj.getFullYear() - 1);
      }

      if (startDateInput) startDateInput.value = startObj.toISOString().slice(0, 10);
      if (endDateInput) endDateInput.value = endStr;
    });
  });

  // 필터 검색 핸들러
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      applyFilters();
    });
  }

  function applyFilters() {
    const selectedBiz = bizTypeSelect?.value || 'all';
    const selectedFac = facilitySelect?.value || 'all';
    const keyword = keywordInput?.value.trim().toLowerCase() || '';

    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
      const rowBiz = row.getAttribute('data-biz') || '';
      const rowFac = row.getAttribute('data-facility') || '';
      const rowText = row.textContent.toLowerCase();

      let matchBiz = (selectedBiz === 'all' || rowBiz === selectedBiz);
      let matchFac = (selectedFac === 'all' || rowFac === selectedFac);
      let matchKw = (!keyword || rowText.includes(keyword));

      if (matchBiz && matchFac && matchKw) {
        row.dataset.filteredOut = 'false';
      } else {
        row.dataset.filteredOut = 'true';
      }
    });

    tableBody.closest('.data-grid')?.dispatchEvent(new CustomEvent('grid:refresh'));
  }

  // 초기화 핸들러
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (bizTypeSelect) bizTypeSelect.value = 'all';
      if (facilitySelect) facilitySelect.value = 'all';
      if (keywordInput) keywordInput.value = '';
      if (startDateInput) startDateInput.value = '2021-07-15';
      if (endDateInput) endDateInput.value = '2030-10-19';

      const rows = tableBody.querySelectorAll('tr');
      rows.forEach(row => row.dataset.filteredOut = 'false');
      tableBody.closest('.data-grid')?.dispatchEvent(new CustomEvent('grid:refresh'));
    });
  }

  // 엑셀 다운로드
  if (excelBtn) {
    excelBtn.addEventListener('click', () => {
      showToast('계획대비 실적 현황 엑셀 파일(PlanPerformance_2026.xlsx) 다운로드를 시작합니다.');
    });
  }
}

/**
 * 프로젝트 정보 입력 5-Step 화면 (ProjectPromotion.html)
 * - 표준 위저드 스텝바 클릭 또는 하단 이전/다음 버튼(data-promo-go)으로 단계 패널을 전환합니다.
 */
function initProjectPromotionPage() {
  const stepper = document.getElementById('promoStepper');
  const panels = Array.from(document.querySelectorAll('[data-promo-panel]'));
  if (!stepper || !panels.length) return;
  const boxes = Array.from(stepper.querySelectorAll('.wizard-step-box'));

  function goToStep(n) {
    boxes.forEach((box, idx) => {
      box.classList.toggle('active', idx + 1 === n);
      box.classList.toggle('completed', idx + 1 < n);
      if (idx + 1 === n) box.setAttribute('aria-current', 'step');
      else box.removeAttribute('aria-current');
    });
    panels.forEach(panel => { panel.hidden = Number(panel.dataset.promoPanel) !== n; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  boxes.forEach((box, idx) => {
    box.addEventListener('click', () => goToStep(idx + 1));
    box.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      goToStep(idx + 1);
    });
  });
  document.querySelectorAll('[data-promo-go]').forEach(btn => {
    btn.addEventListener('click', () => goToStep(Number(btn.dataset.promoGo)));
  });
}

/**
 * 협력업체 신청 5-Step 위자드 인터랙션 (PartnerRegister.html)
 * - [참고]협력업체 신청(팝업).pdf 기준 5단계 순차 전환
 * - 유효성 검사 및 최종 요약 데이터 반영
 */
function initPartnerRegisterPage() {
  const stepper = document.getElementById('wizardStepper');
  const panels = [
    document.getElementById('panelStep1'),
    document.getElementById('panelStep2'),
    document.getElementById('panelStep3'),
    document.getElementById('panelStep4'),
    document.getElementById('panelStep5')
  ];

  if (!stepper || !panels[0]) return;

  function goToStep(stepNum) { // 1-indexed (1 to 5)
    // Update Stepper
    const stepBoxes = stepper.querySelectorAll('.wizard-step-box');
    stepBoxes.forEach((box, idx) => {
      const boxStep = idx + 1;
      box.classList.toggle('active', boxStep === stepNum);
      box.classList.toggle('completed', boxStep < stepNum);
      if (boxStep === stepNum) box.setAttribute('aria-current', 'step');
      else box.removeAttribute('aria-current');
    });

    // Update Panels
    panels.forEach((panel, idx) => {
      if (panel) {
        panel.classList.toggle('active', idx + 1 === stepNum);
      }
    });

    // Step 4 종합 검토 데이터 자동 복사
    if (stepNum === 4) {
      const bizNo = document.getElementById('regBizNo')?.value || '';
      const comp = document.getElementById('regCompanyName')?.value || '';
      const ceo = document.getElementById('regCeoName')?.value || '';
      const tel1 = document.getElementById('regTel1')?.value || '02';
      const tel2 = document.getElementById('regTel2')?.value || '';
      const sector = document.getElementById('regSector')?.value || '';
      const bizType = document.getElementById('regBizType')?.value || '';
      const postCode = document.getElementById('regPostCode')?.value || '';
      const baseAddr = document.getElementById('regBaseAddr')?.value || '';
      const detailAddr = document.getElementById('regDetailAddr')?.value || '';

      const mgrName = document.getElementById('regManagerName')?.value || '';
      const mgrPos = document.getElementById('regManagerPosition')?.value || '';
      const emailId = document.getElementById('regEmailId')?.value || '';
      const emailDom = document.getElementById('regEmailDomain')?.value || '';
      const mob1 = document.getElementById('regMobile1')?.value || '010';
      const mob2 = document.getElementById('regMobile2')?.value || '';
      const mgrTel1 = document.getElementById('regMgrTel1')?.value || '02';
      const mgrTel2 = document.getElementById('regMgrTel2')?.value || '';
      const mgrTask = document.getElementById('regManagerTask')?.value || '';

      const sumBizNo = document.getElementById('sumBizNo');
      const sumCompany = document.getElementById('sumCompany');
      const sumCeo = document.getElementById('sumCeo');
      const sumTel = document.getElementById('sumTel');
      const sumSector = document.getElementById('sumSector');
      const sumAddr = document.getElementById('sumAddr');

      const sumMgrName = document.getElementById('sumMgrName');
      const sumMgrEmail = document.getElementById('sumMgrEmail');
      const sumMgrMobile = document.getElementById('sumMgrMobile');
      const sumMgrTel = document.getElementById('sumMgrTel');
      const sumMgrTask = document.getElementById('sumMgrTask');

      if (sumBizNo) sumBizNo.textContent = bizNo;
      if (sumCompany) sumCompany.textContent = comp;
      if (sumCeo) sumCeo.textContent = ceo;
      if (sumTel) sumTel.textContent = `${tel1}-${tel2}`;
      if (sumSector) sumSector.textContent = `${sector} / ${bizType}`;
      if (sumAddr) sumAddr.textContent = `(${postCode}) ${baseAddr} ${detailAddr}`;

      if (sumMgrName) sumMgrName.textContent = `${mgrName} (${mgrPos})`;
      if (sumMgrEmail) sumMgrEmail.textContent = `${emailId}@${emailDom}`;
      if (sumMgrMobile) sumMgrMobile.textContent = `${mob1}-${mob2}`;
      if (sumMgrTel) sumMgrTel.textContent = `${mgrTel1}-${mgrTel2}`;
      if (sumMgrTask) sumMgrTask.textContent = mgrTask;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 스텝바를 클릭(또는 Enter/Space)하면 해당 단계 화면으로 바로 이동합니다.
  stepper.querySelectorAll('.wizard-step-box').forEach((box, idx) => {
    box.addEventListener('click', () => goToStep(idx + 1));
    box.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      goToStep(idx + 1);
    });
  });

  // Step 1 -> Step 2
  const btnNextToStep2 = document.getElementById('btnNextToStep2');
  if (btnNextToStep2) {
    // 시연용 화면: 동의 체크 여부와 관계없이 하단 '다음 단계' 버튼으로 바로 이동합니다.
    btnNextToStep2.addEventListener('click', () => goToStep(2));
  }

  // Step 2 이전/다음
  const btnPrevToStep1 = document.getElementById('btnPrevToStep1');
  if (btnPrevToStep1) btnPrevToStep1.addEventListener('click', () => goToStep(1));

  const btnNextToStep3 = document.getElementById('btnNextToStep3');
  if (btnNextToStep3) btnNextToStep3.addEventListener('click', () => goToStep(3));

  // Step 3 이전/다음
  const btnPrevToStep2 = document.getElementById('btnPrevToStep2');
  if (btnPrevToStep2) btnPrevToStep2.addEventListener('click', () => goToStep(2));

  const btnNextToStep4 = document.getElementById('btnNextToStep4');
  if (btnNextToStep4) btnNextToStep4.addEventListener('click', () => goToStep(4));

  // Step 4 이전/최종제출
  const btnPrevToStep3 = document.getElementById('btnPrevToStep3');
  if (btnPrevToStep3) btnPrevToStep3.addEventListener('click', () => goToStep(3));

  const btnFinalSubmit = document.getElementById('btnFinalSubmit');
  if (btnFinalSubmit) {
    btnFinalSubmit.addEventListener('click', () => {
      showToast('협력업체 신청서 및 증빙서류가 켑코이에스(주) 관리자에게 최종 제출되었습니다.');
      goToStep(5);
    });
  }

  // 사업자번호 중복확인 시뮬레이션
  const btnCheckBizNo = document.getElementById('btnCheckBizNo');
  if (btnCheckBizNo) {
    btnCheckBizNo.addEventListener('click', () => {
      const bizNo = document.getElementById('regBizNo')?.value.trim();
      if (!bizNo) {
        showToast('사업자등록번호를 입력해 주세요.');
        return;
      }
      showToast(`[${bizNo}] 사용 가능한 사업자등록번호입니다.\n기존 등록된 협력업체 데이터가 없습니다.`);
    });
  }

  // 이메일 도메인 자동완성
  const selEmailDom = document.getElementById('selEmailDomain');
  const regEmailDom = document.getElementById('regEmailDomain');
  if (selEmailDom && regEmailDom) {
    selEmailDom.addEventListener('change', () => {
      if (selEmailDom.value !== 'direct') {
        regEmailDom.value = selEmailDom.value;
      } else {
        regEmailDom.value = '';
        regEmailDom.focus();
      }
    });
  }
}

/**
 * SRM 입찰공고 상세 인터랙션 (SRMDetail.html)
 * - 입찰계획 되돌리기 확인 모달
 * - 첨부파일 미리보기/다운로드 시연
 * - 상단 입찰 단계 탭 피드백
 */
function initSrmDetailPage() {
  const modal = document.getElementById('modalReturnBidPlan');
  if (!modal) return;

  const openBtn = document.getElementById('btnReturnBidPlan');
  const closeBtn = document.getElementById('btnCloseReturnModal');
  const cancelBtn = document.getElementById('btnCancelReturn');
  const confirmBtn = document.getElementById('btnConfirmReturn');
  const reasonInput = document.getElementById('returnReason');

  const openModal = () => {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    setTimeout(() => reasonInput?.focus(), 100);
  };

  const closeModal = () => {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  };

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('show')) closeModal();
  });

  confirmBtn?.addEventListener('click', () => {
    const reason = reasonInput?.value.trim() || '';
    if (!reason) {
      showToast('입찰계획으로 되돌리는 사유를 입력해 주세요.');
      reasonInput?.focus();
      return;
    }
    closeModal();
    const status = document.querySelector('.srm-detail-status');
    const summaryStatus = document.querySelector('.srm-bid-summary .status-pill');
    if (status) status.textContent = '입찰계획';
    if (summaryStatus) {
      summaryStatus.textContent = '입찰계획';
      summaryStatus.className = 'status-pill';
    }
    if (openBtn) {
      openBtn.disabled = true;
      openBtn.textContent = '입찰계획으로 전환 완료';
    }
    showToast('해당 입찰 건이 입찰계획 상태로 전환되었습니다.');
  });

  document.querySelectorAll('.btn-file-preview').forEach(button => {
    button.addEventListener('click', () => {
      const fileName = button.parentElement?.querySelector('span')?.textContent || '첨부파일';
      showToast(`${fileName} 미리보기 화면을 엽니다.`);
    });
  });

  document.querySelectorAll('.btn-file-download').forEach(button => {
    button.addEventListener('click', () => {
      const fileName = button.parentElement?.querySelector('span')?.textContent || '첨부파일';
      showToast(`${fileName} 다운로드를 시작합니다.`);
    });
  });
}

/**
 * 검색/조회 결과용 공통 데이터 그리드
 * - 기존 table 마크업과 디자인을 유지하면서 그리드 동작만 확장
 * - 가로 스크롤, sticky header, 정렬, 키보드 접근성 지원
 */
function initDataGrids() {
  const gridWrappers = document.querySelectorAll('.data-grid, .table-card .table-scroll-wrapper');

  gridWrappers.forEach(wrapper => {
    if (wrapper.dataset.gridInitialized === 'true') return;

    const table = wrapper.querySelector('table');
    if (!table) return;

    wrapper.dataset.gridInitialized = 'true';
    wrapper.classList.add('data-grid');
    wrapper.tabIndex = wrapper.hasAttribute('tabindex') ? wrapper.tabIndex : 0;
    table.classList.add('data-grid-table');
    table.setAttribute('role', 'grid');

    const headers = Array.from(table.querySelectorAll('thead th'));
    const tbody = table.tBodies[0];
    const declaredTotalItems = Number(wrapper.dataset.totalItems) || 0;
    const initialRows = tbody ? Array.from(tbody.rows) : [];
    const firstPageTarget = Math.min(10, declaredTotalItems || initialRows.length);

    // 정적 시안에서도 첫 페이지 10건 레이아웃을 확인할 수 있도록 부족한 샘플 행을 보완합니다.
    if (tbody && initialRows.length > 0 && initialRows.length < firstPageTarget) {
      const sequenceHeaderIndex = headers.findIndex(header => /^(no|순번)$/i.test(header.textContent.replace(/⇅|↑|↓/g, '').trim()));
      for (let index = initialRows.length; index < firstPageTarget; index += 1) {
        const clone = initialRows[index % initialRows.length].cloneNode(true);
        clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
        if (sequenceHeaderIndex >= 0 && clone.cells[sequenceHeaderIndex]) {
          const baseSequence = Number(initialRows[0].cells[sequenceHeaderIndex]?.textContent.trim());
          clone.cells[sequenceHeaderIndex].textContent = Number.isFinite(baseSequence)
            ? String(Math.max(1, baseSequence - index))
            : String(index + 1);
        }
        tbody.appendChild(clone);
      }
    }

    const rows = Array.from(table.querySelectorAll('tbody tr'));
    table.setAttribute('aria-colcount', String(headers.length));
    table.setAttribute('aria-rowcount', String(rows.length + 1));

    table.querySelectorAll('thead tr, tbody tr').forEach(row => row.setAttribute('role', 'row'));
    headers.forEach(header => header.setAttribute('role', 'columnheader'));
    table.querySelectorAll('tbody td').forEach(cell => cell.setAttribute('role', 'gridcell'));

    const updateColumnIndexes = () => {
      table.querySelectorAll('tr').forEach(row => {
        Array.from(row.children).forEach((cell, index) => cell.setAttribute('aria-colindex', String(index + 1)));
      });
    };

    const updateOverflowTitles = () => {
      window.requestAnimationFrame(() => {
        table.querySelectorAll('tbody td').forEach(cell => {
          const fullText = cell.textContent.replace(/\s+/g, ' ').trim();
          if (cell.scrollWidth > cell.clientWidth && fullText) {
            cell.title = fullText;
          } else if (cell.title === fullText) {
            cell.removeAttribute('title');
          }
        });
      });
    };

    const refreshGridWidth = () => {
      const totalWidth = Array.from(table.querySelectorAll('thead th')).reduce((sum, header) => {
        return sum + Math.max(parseFloat(header.style.width) || header.getBoundingClientRect().width || 80, 80);
      }, 0);
      table.style.setProperty('--data-grid-min-width', `${Math.max(Math.ceil(totalWidth), 960)}px`);
      updateOverflowTitles();
    };

    const moveColumn = (fromIndex, toIndex) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      table.querySelectorAll('tr').forEach(row => {
        const cells = Array.from(row.children);
        const movingCell = cells[fromIndex];
        const targetCell = cells[toIndex];
        if (!movingCell || !targetCell) return;
        if (fromIndex < toIndex) targetCell.insertAdjacentElement('afterend', movingCell);
        else targetCell.insertAdjacentElement('beforebegin', movingCell);
      });
      updateColumnIndexes();
      updateOverflowTitles();
    };

    const minGridWidth = headers.reduce((width, header) => {
      const declaredWidth = parseInt(header.style.width || header.style.minWidth || '0', 10);
      return width + Math.max(declaredWidth || 110, 80);
    }, 0);
    table.style.setProperty('--data-grid-min-width', `${Math.max(minGridWidth, 960)}px`);

    let draggedHeader = null;
    let suppressSort = false;

    headers.forEach(header => {
      header.draggable = true;
      header.classList.add('grid-column-header');
      header.title = `${header.textContent.replace(/⇅|↑|↓/g, '').trim()} 열: 드래그하여 이동, 오른쪽 경계를 드래그하여 너비 조절`;

      const resizeHandle = document.createElement('span');
      resizeHandle.className = 'grid-column-resizer';
      resizeHandle.setAttribute('role', 'separator');
      resizeHandle.setAttribute('aria-orientation', 'vertical');
      resizeHandle.setAttribute('aria-label', `${header.textContent.replace(/⇅|↑|↓/g, '').trim()} 열 너비 조절`);
      header.appendChild(resizeHandle);

      resizeHandle.addEventListener('pointerdown', event => {
        event.preventDefault();
        event.stopPropagation();
        suppressSort = true;
        header.draggable = false;
        const startX = event.clientX;
        const startWidth = header.getBoundingClientRect().width;
        const columnIndex = Array.from(header.parentElement.children).indexOf(header);
        table.classList.add('is-manually-sized');
        document.body.classList.add('is-resizing-grid-column');

        const handlePointerMove = moveEvent => {
          const nextWidth = Math.max(80, Math.round(startWidth + moveEvent.clientX - startX));
          table.querySelectorAll('tr').forEach(row => {
            const cell = row.children[columnIndex];
            if (!cell) return;
            cell.style.width = `${nextWidth}px`;
            cell.style.minWidth = `${nextWidth}px`;
          });
          refreshGridWidth();
        };

        const handlePointerUp = () => {
          document.removeEventListener('pointermove', handlePointerMove);
          document.removeEventListener('pointerup', handlePointerUp);
          document.removeEventListener('pointercancel', handlePointerUp);
          document.body.classList.remove('is-resizing-grid-column');
          header.draggable = true;
          window.setTimeout(() => { suppressSort = false; }, 0);
          refreshGridWidth();
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp, { once: true });
        document.addEventListener('pointercancel', handlePointerUp, { once: true });
      });

      header.addEventListener('dragstart', event => {
        if (event.target.closest('.grid-column-resizer')) {
          event.preventDefault();
          return;
        }
        draggedHeader = header;
        suppressSort = true;
        header.classList.add('is-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', header.dataset.col || header.textContent.trim());
      });

      header.addEventListener('dragover', event => {
        if (!draggedHeader || draggedHeader === header) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        header.classList.add('is-drag-over');
      });

      header.addEventListener('dragleave', () => header.classList.remove('is-drag-over'));

      header.addEventListener('drop', event => {
        event.preventDefault();
        header.classList.remove('is-drag-over');
        if (!draggedHeader || draggedHeader === header) return;
        const currentHeaders = Array.from(header.parentElement.children);
        moveColumn(currentHeaders.indexOf(draggedHeader), currentHeaders.indexOf(header));
      });

      header.addEventListener('dragend', () => {
        headers.forEach(item => item.classList.remove('is-dragging', 'is-drag-over'));
        draggedHeader = null;
        window.setTimeout(() => { suppressSort = false; }, 0);
      });

      header.addEventListener('keydown', event => {
        if (!event.altKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const currentHeaders = Array.from(header.parentElement.children);
        const fromIndex = currentHeaders.indexOf(header);
        const toIndex = event.key === 'ArrowLeft' ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= currentHeaders.length) return;
        moveColumn(fromIndex, toIndex);
        header.focus();
      });
    });

    updateColumnIndexes();

    const tableCard = wrapper.closest('.table-card');
    const pageSizeSelect = tableCard?.querySelector('.select-per-page')
      || wrapper.closest('main, .main-content')?.querySelector('.select-per-page');
    let paginationRow = wrapper.nextElementSibling;
    if (!paginationRow?.classList.contains('table-pagination-row')) {
      paginationRow = document.createElement('div');
      paginationRow.className = 'table-pagination-row';
      wrapper.insertAdjacentElement('afterend', paginationRow);
    }

    paginationRow.innerHTML = '<nav class="pagination-controls" aria-label="표 페이지 이동"></nav>';

    const paginationControls = paginationRow.querySelector('.pagination-controls');
    let currentPage = 1;
    let pageSize = Number(pageSizeSelect?.value) || 10;
    const pageSummary = tableCard?.querySelector('.grid-page-summary')
      || wrapper.closest('main, .main-content')?.querySelector('.grid-page-summary');

    const getRows = () => Array.from(table.querySelectorAll('tbody tr'));
    const getEligibleRows = () => getRows().filter(row => row.dataset.filteredOut !== 'true');

    const createPageButton = (label, page, options = {}) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = options.navigation ? 'btn-page-nav' : 'btn-page-num';
      button.textContent = label;
      button.disabled = Boolean(options.disabled);
      if (!options.navigation && page === currentPage) {
        button.classList.add('active');
        button.setAttribute('aria-current', 'page');
      }
      button.setAttribute('aria-label', options.ariaLabel || `${page}페이지`);
      button.addEventListener('click', () => {
        currentPage = page;
        renderPage();
      });
      return button;
    };

    const renderPage = () => {
      const allRows = getRows();
      const eligibleRows = getEligibleRows();
      const hasActiveFilter = eligibleRows.length !== allRows.length;
      const declaredTotal = Number(wrapper.dataset.totalItems) || 0;
      const totalItems = hasActiveFilter ? eligibleRows.length : Math.max(declaredTotal, eligibleRows.length);
      const declaredTotalPages = Number(wrapper.dataset.totalPages) || 0;
      const totalPages = !hasActiveFilter && pageSize === 10 && declaredTotalPages > 0
        ? declaredTotalPages
        : Math.max(1, Math.ceil(totalItems / pageSize));
      currentPage = Math.min(Math.max(currentPage, 1), totalPages);

      if (pageSummary) {
        pageSummary.textContent = `${currentPage} / ${totalPages} (총 ${totalItems.toLocaleString('ko-KR')}개)`;
      }

      const startIndex = (currentPage - 1) * pageSize;
      const usesPageSample = !hasActiveFilter && declaredTotal > allRows.length;
      const visibleRows = new Set(usesPageSample
        ? eligibleRows.slice(0, pageSize)
        : eligibleRows.slice(startIndex, startIndex + pageSize));
      allRows.forEach(row => {
        row.style.display = visibleRows.has(row) ? '' : 'none';
      });

      table.setAttribute('aria-rowcount', String(totalItems + 1));

      paginationControls.replaceChildren();
      paginationControls.appendChild(createPageButton('<<', 1, {
        navigation: true,
        disabled: currentPage === 1,
        ariaLabel: '첫 페이지'
      }));
      paginationControls.appendChild(createPageButton('<', currentPage - 1, {
        navigation: true,
        disabled: currentPage === 1,
        ariaLabel: '이전 페이지'
      }));

      const firstPage = Math.floor((currentPage - 1) / 10) * 10 + 1;
      const lastPage = Math.min(totalPages, firstPage + 9);
      for (let page = firstPage; page <= lastPage; page += 1) {
        paginationControls.appendChild(createPageButton(String(page), page));
      }

      paginationControls.appendChild(createPageButton('>', currentPage + 1, {
        navigation: true,
        disabled: currentPage === totalPages,
        ariaLabel: '다음 페이지'
      }));
      paginationControls.appendChild(createPageButton('>>', totalPages, {
        navigation: true,
        disabled: currentPage === totalPages,
        ariaLabel: '마지막 페이지'
      }));
    };

    if (pageSizeSelect) {
      pageSizeSelect.value = String(pageSize);
      pageSizeSelect.addEventListener('change', () => {
        pageSize = Number(pageSizeSelect.value) || 10;
        currentPage = 1;
        renderPage();
      });
    }

    wrapper.addEventListener('grid:refresh', () => {
      currentPage = 1;
      renderPage();
    });

    const sortRows = header => {
      const currentHeaders = Array.from(table.querySelectorAll('thead th'));
      const columnIndex = currentHeaders.indexOf(header);
      if (columnIndex < 0) return;

      const nextDirection = header.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
      currentHeaders.forEach(item => {
        item.removeAttribute('aria-sort');
        const caret = item.querySelector('.sort-caret');
        if (caret) caret.textContent = '⇅';
      });
      header.setAttribute('aria-sort', nextDirection);
      const activeCaret = header.querySelector('.sort-caret');
      if (activeCaret) activeCaret.textContent = nextDirection === 'ascending' ? '↑' : '↓';

      const tbody = table.tBodies[0];
      const sortedRows = Array.from(tbody.rows).sort((rowA, rowB) => {
        const valueA = rowA.cells[columnIndex]?.textContent.trim() || '';
        const valueB = rowB.cells[columnIndex]?.textContent.trim() || '';
        const numberA = Number(valueA.replace(/[^0-9.-]/g, ''));
        const numberB = Number(valueB.replace(/[^0-9.-]/g, ''));
        const bothNumeric = valueA !== '' && valueB !== '' && !Number.isNaN(numberA) && !Number.isNaN(numberB);
        const result = bothNumeric
          ? numberA - numberB
          : valueA.localeCompare(valueB, 'ko', { numeric: true, sensitivity: 'base' });
        return nextDirection === 'ascending' ? result : -result;
      });

      sortedRows.forEach(row => tbody.appendChild(row));
      renderPage();
    };

    headers.filter(header => header.classList.contains('th-sortable')).forEach(header => {
      header.tabIndex = 0;
      header.setAttribute('aria-sort', 'none');
      header.addEventListener('click', () => {
        if (!suppressSort) sortRows(header);
      });
      header.addEventListener('keydown', event => {
        if (!event.altKey && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          sortRows(header);
        }
      });
    });

    wrapper.addEventListener('keydown', event => {
      if (event.target.closest('th, button, a, input, select, textarea')) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        wrapper.scrollBy({ left: 140, behavior: 'smooth' });
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        wrapper.scrollBy({ left: -140, behavior: 'smooth' });
      } else if (event.key === 'Home') {
        wrapper.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (event.key === 'End') {
        wrapper.scrollTo({ left: wrapper.scrollWidth, behavior: 'smooth' });
      }
    });

    renderPage();
    updateOverflowTitles();
  });
}
