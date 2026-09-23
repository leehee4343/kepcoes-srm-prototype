# 화면설계 Description 적용 현황

> 갱신일: 2026-09-22  
> 기준: `DESIGN_GUIDE.md` 5.15  
> 상태값: `완료` · `원문 없음` · `리다이렉트 전용` · `검토 필요`

## 00. 공통관리

| HTML | 설계 슬라이드 | Description | 목적지 | 상태 | 비고 |
|---|---:|---:|---:|---|---|
| `SRMAdminManage.html` | 4~5 | 4 | 4 | 완료 | 검색/조회 1~3, 상세정보 1 |
| `SRMPermGroupManage.html` | 6 | 2 | 2 | 완료 | 검색 구분, 매핑 수 |
| `SRMPermGroupDetail.html` | 7~8 | 2 | 2 | 완료 | 매핑 삭제, 관리자 검색 |
| `SRMSystemPermManage.html` | 9 | 2 | 2 | 완료 | 권한 삭제, 관리자 추가 |
| `SRMIpManage.html` | 10 | 2 | 2 | 완료 | 검색 구분, 삭제 |
| `SRMCodeManage.html` | 11~12 | 4 | 3 | 검토 필요 | 슬라이드 11의 1번 목적지인 검색 UI가 현재 HTML에 없음. 임의 위치 매핑 금지 |
| `SRMLoginStats.html` | 13 | 1 | 1 | 완료 | Description 도형명이 다른 슬라이드와 달리 `TextBox 1`임 |
| `SRMMenuAccessStats.html` | 14 | 0 | 0 | 원문 없음 | `D`를 만들지 않음 |
| `SRMClientManage.html` | 15~16 | 2 | 1 | 완료 | 슬라이드 16 신용등급 Description은 원본에 목적지 번호 없음 |
| `SRMNoticeManage.html` | 17~19 | 4 | 4 | 완료 | 상세·등록 슬라이드 18~19는 원문 없음 |
| `SRMFileRepoManage.html` | 20~22 | 4 | 4 | 완료 | 상세·등록 슬라이드 21~22는 원문 없음 |

### 자동 검증 결과

- Description이 있는 10개 HTML에 `D`와 우측 드로어 적용
- `SRMMenuAccessStats.html`은 원문이 없어 미적용
- PPTX 원문 총 27문단을 HTML에 무수정 반영
- 원문 문단 수·순서·Unicode 문자열 일치
- 중복 ID, `select`·`div` 태그 불균형 없음
- 인라인 스타일·이벤트 추가 없음
- JavaScript 문법, CSS 괄호, `git diff --check` 통과

### 검토 후 수정 (2026-09-22)

- `D` 버튼·Description 드로어 `z-index`가 `900`으로 업무 모달(`1000`)보다 낮아, 업무 모달이 열려 있는 동안 `D` 버튼을 클릭할 수 없던 문제를 발견해 `1150`으로 수정(`DESIGN_GUIDE.md` v2.34, `style.css`의 `.description-floating-button`·`.description-guide-backdrop`).
- 사용자 지시로 목적지 번호(`.description-target-marker`) `z-index`를 `4`→`1300`으로 상향. 목적지가 드로어가 덮는 화면 오른쪽 영역과 겹쳐도 번호가 항상 드로어보다 위에 보이도록 함(`DESIGN_GUIDE.md` v2.34).
- 알려진 한계: 목적지 번호가 `.modal-backdrop`(업무 모달, `z-index: 1000~1100`) 안에 있는 경우, 그 모달 자체가 드로어(`1150`)보다 낮아 모달과 드로어의 화면 영역이 겹치면 번호 `z-index`를 아무리 올려도 가려질 수 있음(자식은 부모 스태킹 컨텍스트를 벗어날 수 없음). 현재 00 모듈은 상세 모달이 기본 폭(`max-width: 600px`)이라 1920·1440·1280px 어디서도 드로어(우측 340px)와 겹치지 않아 문제없지만, 이후 `modal-xl`(`960px`)처럼 넓은 모달에 목적지 번호를 넣는 화면에서는 1280px 기준으로 겹칠 수 있어 재검토가 필요함.
- 사용자 지시로 `.description-guide-backdrop`의 `backdrop-filter: blur(2px)`(공통 `.modal-backdrop`에서 상속)를 `none`으로 제거. 드로어가 열려도 업무 화면이 흐려지지 않고 원래 상태 그대로 보임(`DESIGN_GUIDE.md` v2.34).

### 다음 작업자가 확인할 사항 (00 모듈)

1. `SRMCodeManage.html`의 검색 UI를 화면설계대로 추가할지 사용자 결정을 받습니다.
2. 추가 승인 시 슬라이드 11 Description 1번을 새 검색 구분 컨트롤에 연결합니다.
3. 미추가 결정 시 `미구현 목적지` 승인 예외로 남기고 상태를 `완료(예외)`로 변경합니다.

## 진입 화면 (루트 `index.html` + `01_협력업체창구_로그인전`)

| HTML | 설계 슬라이드 | Description | 목적지 | 상태 | 비고 |
|---|---:|---:|---:|---|---|
| `index.html` | 4 | 4 | 4 | 완료 | 로그인 화면 본문(브랜드 헤드라인 1, 로그인 문의 박스 2, 로그인 버튼 3, 진행 중인 입찰공고 카드 4) |
| `index.html` 내 `modalBiddingDetail` | 5~6 | 0 | 0 | 원문 없음 | 입찰공고 내역서 팝업 내용 자체는 Description 없음 |
| `index.html` 내 `modalIdFind` | 14 | 1 | 0 | 검토 필요 | Description은 있으나 원본에 목적지 번호가 전혀 없음(팝업 전체를 설명하는 문구). 특정 요소에 임의로 번호를 붙이지 않고 드로어에는 번호 없이 반영 |
| `index.html` 내 `modalPwFind`/`modalPwFindSent` | 15 | 3 | 3 | 완료 | 입력 폼 1, 발송완료 안내(마스킹 이메일) 2, 비밀번호 찾기 제출 버튼 3. 같은 슬라이드의 `modalPwFindMismatch`(정보 불일치) 팝업에는 대응 번호 없음 |
| `modules/01_협력업체창구_로그인전/SRMLogin.html` | - | - | - | 리다이렉트 전용 | `../../index.html`로 즉시 이동하는 스텁 페이지(모듈 구조 전환 시 하위 호환용). 실제 콘텐츠 없음 |
| `PartnerRegister.html` STEP01 | 7 | 1 | 2 | 완료 | 이용약관 동의·개인정보 수집 동의 두 섹션이 같은 Description 1번을 공유(원본 번호가 `1`, `1’`로 두 곳을 가리킴) |
| `PartnerRegister.html` STEP02(기본 정보) | 8 | 4 | 4 | 완료 | 사업자등록번호 중복확인 1, 비밀번호 규칙 2, 전화번호 앞자리 3, 주소검색 API 4 |
| `PartnerRegister.html` STEP02(증빙서류) | 9 | 2 | 2 | 완료 | 같은 STEP02 패널에서 동시에 보이므로 번호를 5·6으로 이어서 부여(재시작 시 화면에 중복 "1","2"가 동시에 보이는 것을 피함) |
| `PartnerRegister.html` STEP03 | 10 | 1 | 1 | 완료 | 이메일 도메인 서식 |
| `PartnerRegister.html` STEP04 | 11~12 | 0 | 0 | 원문 없음 | 신청 정보 확인·최종 제출 화면은 Description 없음 |
| `PartnerRegister.html` STEP05 | 13 | 1 | 1 | 완료 | 고객 통보(MSG-001) → 신청 완료 안내 문구 |

### 자동 검증 결과 (진입 화면)

- `index.html`: Description 7문단(번호 있는 항목 7 + 번호 없는 항목 1) 반영, 목적지 마커 7개, 중복 `id` 없음, 인라인 스타일·이벤트 없음, 태그 균형(`div`/`section`/`span`/`button`) 확인
- `PartnerRegister.html`: Description 9개 매핑 항목(번호 1~6 + STEP03·STEP05 각 1) 반영, 목적지 마커 10개(STEP01의 `1`/`1’` 중복 매핑 포함), 중복 `id` 없음, 인라인 스타일·이벤트 없음, 태그 균형 확인
- PPTX 원문(슬라이드 4, 7~10, 13, 15)을 문자 단위로 대조, 줄바꿈(`\x0b`)은 `<pre>` 안에서 실제 줄바꿈으로 보존

### 다음 작업자가 확인할 사항 (진입 화면)

1. `modalIdFind`(아이디 찾기 팝업)는 목적지 번호가 없는 상태로 완료 처리했습니다. 화면설계가 갱신되어 번호가 추가되면 그때 목적지를 연결합니다.

## 02. 협력업체 전용 창구(로그인 후) — 진행 중

| HTML | 설계 슬라이드 | Description | 목적지 | 상태 | 비고 |
|---|---:|---:|---:|---|---|
| `SRMDashboardPartner.html` | 4 | 0 | 0 | 원문 없음 | `D` 미적용 |
| `SRMPartnerNotice.html` | 5~6 | 1 | 1 | 완료 | 검색구분 select. 상세(슬라이드6)는 원문 없음 |
| `SRMPartnerQna.html` | 7~10 | 5 | 5 | 완료 | 검색범위 2, 질문등록 고객통보 1, 상세보기(수정불가 안내·답변 조건부노출) 2 — 슬라이드9·10은 같은 모달에서 동시에 보여 번호를 1~2로 이어 붙임 |
| `SRMPartnerFileRepo.html` | 11~12 | 1 | 1 | 완료 | 검색구분 select. 상세(슬라이드12)는 원문 없음 |
| `SRMPartnerPreQuote.html` | 13~16 | 7 | 7 | 완료 | 검색/조회 4(범위설명·검색구분·진행상태/제출상태 정의), 상세정보 전달자료 1, 견적 제출 담당자선택·고객통보 2. 견적포기·제출취소 확인 팝업(슬라이드15)은 원문 없음 |
| `SRMPartnerNegoRequest.html` | 17~24 | 6 | 6 | 완료 | 검색/조회 진행상태 select 1, 견적요청현황 표(차수별 확인 안내·견적제출하기 버튼·견적제출 컬럼) 3, 견적 제출 예정가안내 1, 제출확인 팝업 버튼 1(원본 번호 `2` 그대로 유지). 공고정보(18~19)·견적요청정보(21)·제출내역(24)은 원문 없음 |
| `SRMPartnerBidNotice.html` | 25~31 | 17(번호 없음 1건 포함) | 18 | 완료 | 검색/조회 6(조회기간·계약방법/낙찰자·공고구분·진행상태·검색구분·내역서, +번호없는 보충설명 1건) + 상세정보 모달 10(현장설명회·가격투찰기간·종합평가비율·협상계약여부·제안발표여부·자가심사여부·심사기준·서류제출이동·참여제한안내·투찰제한안내). 상세정보는 한 모달에서 동시에 보이므로 슬라이드 29~31의 번호를 1~10으로 이어붙임(원본은 슬라이드별로 재시작). 투찰제한 안내 팝업은 원본 번호 `10’`가 두 문단에 중복 표기되어 그대로 유지 |
| `SRMPartnerContract.html` | 55~59 | 10(번호 없음 1건 포함) | 14 | 완료 | 검색/조회 4 + 계약 변경 내역 3(사유·기존/변경 계약금액·기존/변경 납기일, `2`/`2’`·`3`/`3’` 쌍 유지) + 서류제출 4(+번호없는 보충설명 1건, `4`/`4’`는 제출모달·확인모달 각각의 버튼) |
| `SRMPartnerInfo.html` | 60~65 | 6 | 6 | 완료 | 4개 탭(정보확인/기본정보수정요청/담당자추가수정/비밀번호변경)을 탭별 독립 패널로 표시 |
| `SRMPartnerBidJoin.html` | 32~54(23슬라이드) | 32 | 37 | 완료 | 02 모듈 최대 규모(목록+19개 모달). 상태별로 동시에 보이는 범위 안에서 연속 번호 부여(아래 참고) |

### `SRMPartnerBidJoin.html` 적용 결과 (2026-09-23)

이 화면은 상태(탭/모달)마다 별도의 `.modal-backdrop`으로 분리되어 있어(다른 07-2 모듈처럼 한 모달에 5탭을 모두 스택 표시하지 않음) 대부분 슬라이드 로컬 번호를 그대로 유지했고, 한 모달 안에 여러 슬라이드 내용이 동시에 보이는 경우에만 번호를 이어붙였습니다.

- 검색/조회(목록): 2 — 범위설명, 제출상태 컬럼
- 상세 · 입찰공고 정보(`bidJoinDetailModal`): 1 — 수의시담 탭(조건부 노출 안내)
- 입찰 서류 제출 · 가격 투찰 진입(`bidJoinDetailModal` footer + `bidJoinLimitNoticeModal2`/`bidPriceLimitNoticeModal2`): 1,2,3,3’(2곳) — `SRMPartnerBidNotice.html` 슬라이드31과 동일 패턴 재사용
- 입찰 서류 제출(`bidDocSubmitWizardModal`+확인모달): 담당자선택·참여서류안내·자가심사(2개 마커)·최종확인·제출버튼을 1~6으로 이어붙임(한 모달에 슬라이드37~41 내용이 동시에 보임), 확인모달 버튼은 `6’`
- 입찰 서류 제출 완료(`bidDocSubmitDoneModal`): 1
- 입찰 서류 제출 내역·제출취소·포기(`bidJoinDocSubmittedModal`+확인모달들): 1,2,2’,3로 이어붙임(슬라이드43~44 통합, `bidGiveUpConfirmModal`은 슬라이드47과 공유)
- 가격 투찰(투찰 전, `bidPriceBeforeModal`): 1,1’,2,3
- 예비가 추첨·가격투찰 확인(`bidPriceDrawModal`+확인모달): 1,2
- 가격 투찰(투찰 완료, `bidPriceAfterModal`): 1,2
- 입찰 결과(`bidResultModal`): 1,2(각주 한 문단에 두 조건을 나눠 표시),3
- 수의시담 견적요청현황(`negoTalkListModal`): 1,2,3,4 — `SRMPartnerNegoRequest.html`과 동일 패턴
- 수의시담 견적제출(`negoTalkSubmitModal`+확인모달): 원본 자체가 두 목적지 모두 번호 `2`로 표기되어 있고 `1`이 존재하지 않음 — 원본 그대로 반영(검토 필요 사항으로 기록)

슬라이드34·35·40·49·50·52·54는 원문 없음(다른 슬라이드와 동일 화면의 스크롤 연속 구간).

### 검토 필요

- `SRMPartnerBidJoin.html` 수의시담 견적제출 섹션: PPTX 원본에서 두 목적지 번호가 모두 `2`이고 `1`이 없습니다. 오탈자로 추정되나 임의로 `1`로 바꾸지 않고 원본 그대로 두었습니다. 화면설계 원본 확인 후 필요하면 번호를 수정하세요.

## 03. 대시보드

| HTML | 설계 슬라이드 | Description | 목적지 | 상태 | 비고 |
|---|---:|---:|---:|---|---|
| `SRMDashboardAdmin.html` | 4 | 0 | 0 | 원문 없음 | `D` 미적용 |
| `SRMDashboardBiz.html` | 4 | 0 | 0 | 원문 없음 | `D` 미적용 |
| `SRMDashboardContract.html` | 4 | 0 | 0 | 원문 없음 | `D` 미적용 |
| `SRMDashNotice.html` | 5~6 | 4 | 4 | 완료 | `00_공통관리/SRMNoticeManage.html`와 동일한 검색구분·게시대상·우선노출·게시기간 패턴 재사용. 상세(슬라이드6)는 원문 없음 |
| `SRMDashFileRepo.html` | 7 | 4 | 4 | 완료 | 위와 동일 패턴, 마지막 문단만 "해당 자료가 보임"으로 표현 차이 |

## 04. 사전 견적 관리 — 중단(사용자 요청, 2026-09-23)

사용자 요청으로 이 지점에서 작업을 중단합니다. `SRMPreQuoteRequest.html`은 아직 HTML을 전혀 수정하지 않았고(구조 파악을 위한 조회만 함), `SRMPreQuoteStatus.html`은 원문 추출도 시작하지 않았습니다.

| HTML | 설계 슬라이드 | 상태 | 비고 |
|---|---:|---|---|
| `SRMPreQuoteRequest.html` | 4~15(12슬라이드) | 대기(원문 추출만 완료, HTML 미적용) | 아래 원문 참고 |
| `SRMPreQuoteStatus.html` | 16~21(6슬라이드) | 대기(원문 추출 전) | - |

### `SRMPreQuoteRequest.html` 원문 추출 결과(HTML 미적용, 다음 작업자용)

- 슬라이드4(목록): "'작성 중' 상태만 노출, 이 상태에서만 수정/삭제 가능"(1, 위치상 목록 스코프 설명) / "재견적 시 요청내용 복사"(2, 삭제 버튼 근처?) / "견적요청번호, 견적요청명, 등록자"(3, 키워드검색 select — 이미 HTML의 `<select class="filter-select w-150">` 옵션과 정확히 일치, line 302)
- 슬라이드5(신규등록 모달 `pqNewModal`): "등록 시 '견적요청번호' 자동 발번"(1) — 이미 `<p class="modal-field-label">`로 동일 문구가 구현돼 있음(line 356), 마커만 추가하면 됨
- 슬라이드6(관리 팝업 `pqManageModal` 진입): "각 단계로 안내되어 있지만 각 영역에 바로 접근(클릭) 가능"(1,2 — 위치 2곳, 같은 개념)
- 슬라이드7(품목정보 관리): "품목단가일 경우 '품목 추가(공통품목)' 버튼 노출"(1), "개별 등록 시 품목추가/수정 팝업 호출"(2,3 — 수정/삭제 버튼), "품목 최소 1개 이상 등록 필요, Alert"(4), 등 5개 마커(1~5) — `pqItemFormModal`/`pqCommonItemModal` 관련
- 슬라이드8(`pqCommonItemModal`): "기준정보관리 > 공통 품목관리에 등록된 공통 품목 호출"(1)
- 슬라이드9(`pqItemFormModal`): "품목 정보를 개별로 직접 등록하거나 수정/보완할 때 사용"(1)
- 슬라이드10(전달자료 `pqAttachModal`): "견적요청 대상 협력업체에게 전달하는 참고자료"(1)
- 슬라이드11(업체선정 `pqVendorAddModal`+마감일시 `pqDeadlineModal`): "협력업체 풀에서 선택"(1), "기본담당자 아닌 다른 담당자 선택 기능"(2), "견적마감일시는 업체 모두 동일 적용"(3), "저장 시 업체·마감일시 모두 세팅 필요, Alert"(4)
- 슬라이드12(업체추가 팝업): "승인된 협력업체만 호출함"(1)
- 슬라이드13: 원문 없음
- 슬라이드14(최종점검·확인모달 `pqFinalConfirmModal`): "요청되면 '사전 견적 요청 현황'에서 확인 가능, 요청일시 기록, 고객통보 MSG-010"(1)
- 슬라이드15(완료 `pqDoneModal`): 원문 없음

재개 시 `docs/reference/[참고] 화면설계(04. 사전 견적관리).pptx`를 이 세션에서 쓴 `extract_desc.py` 패턴으로 다시 열 필요 없이 위 목록을 바로 HTML에 매핑하면 됩니다. `SRMPreQuoteStatus.html`(슬라이드16~21)은 원문 추출부터 다시 시작해야 합니다.

### 다음 재개 시 절차
1. 위 슬라이드별 원문을 `SRMPreQuoteRequest.html`의 해당 모달(`pqNewModal`/`pqManageModal`/`pqItemFormModal`/`pqCommonItemModal`/`pqAttachModal`/`pqVendorAddModal`/`pqDeadlineModal`/`pqFinalConfirmModal`)에 이 문서에서 확립한 패턴(`.description-marker-anchor`, `.description-marker-container`, 동시에 보이는 범위 안에서만 번호 연속 부여)으로 반영
2. `SRMPreQuoteStatus.html`(슬라이드16~21) 원문·목적지 추출 후 동일하게 반영
3. `docs/DESCRIPTION_OVERLAY_STATUS.md`·`ROLLOUT_PLAN.md`·`docs/작업진행현황.md` 갱신
4. 이후 `05_발주계약요청`부터 `10_기준정보관리`까지 순차 진행(`DESCRIPTION_OVERLAY_ROLLOUT_PLAN.md`의 6~9단계)
