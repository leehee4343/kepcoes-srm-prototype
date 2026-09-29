# 화면설계 Description 적용 현황

> 자동 생성 문서: `python3 tools/build_description_guides.py` 실행 시 `docs/DESCRIPTION_MAP.json`과 PPTX 원문으로 다시 만들어집니다. 직접 수정하지 마십시오.
> 검증: `python3 tools/check_description_guides.py` (원문 문자 일치·번호 대응·누락 슬라이드), `tools/test_description_guides.cjs` (브라우저 런타임 번호 표시).

## 적용 원칙

- 드로어 문장은 PPTX Description 원문을 스크립트로 옮깁니다(맞춤법·띄어쓰기·오탈자 포함 변경·추가 금지). 문단 끝에 글자 없이 남은 줄바꿈만 표시하지 않습니다.
- 원문 출처: 오른쪽 Description 칸의 텍스트 상자(번호는 PowerPoint 자동 번호)와 화면 안의 붉은 말풍선(번호는 연결선이 이어진 번호 원).
- 한 페이지와 그 페이지가 여는 팝업을 한 드로어로 묶고, 슬라이드마다 1부터 다시 시작하는 번호를 이어서 매깁니다(페이지 자체 슬라이드 → 팝업 슬라이드 순서).
- 목적지 번호는 `data-description-ref="슬라이드:원본번호"`만 가지며 표시 번호는 현재 페이지 드로어를 따릅니다. 공유 팝업의 목적지는 페이지마다 번호가 달라지고, 드로어에 없는 목적지는 숨깁니다.
- Description 원문이 없는 화면에는 `D`·드로어·목적지를 만들지 않습니다.

## 요약

- Description 드로어가 있는 화면: **117개**, 드로어 항목(원문 문단): **531개**
- 매핑된 화면: 145개 (원문 없는 화면 포함), 제외한 슬라이드: 8개
- 목적지를 둘 수 없는 항목: 23개(아래 목록)

## 00_공통관리

| HTML | 슬라이드 | 번호 항목 | 번호 없는 항목 | 상태 |
|---|---|---:|---:|---|
| `SRMAdminManage.html` | 4, 5 | 4 | 0 | 완료 |
| `SRMClientDetail.html` | 16 | 1 | 0 | 완료(목적지 없음 1) |
| `SRMClientManage.html` | 15 | 1 | 0 | 완료 |
| `SRMCodeManage.html` | 11, 12 | 4 | 0 | 완료(목적지 없음 1) |
| `SRMFileRepoManage.html` | 20, 21, 22 | 4 | 0 | 완료 |
| `SRMIpManage.html` | 10 | 2 | 0 | 완료 |
| `SRMLoginStats.html` | 13 | 1 | 0 | 완료 |
| `SRMMenuAccessStats.html` | 14 | 0 | 0 | 원문 없음 |
| `SRMNoticeManage.html` | 17, 18, 19 | 4 | 0 | 완료 |
| `SRMPermGroupDetail.html` | 7, 8 | 2 | 0 | 완료 |
| `SRMPermGroupManage.html` | 6 | 2 | 0 | 완료 |
| `SRMSystemPermManage.html` | 9 | 2 | 0 | 완료 |

## 01_협력업체창구_로그인전

| HTML | 슬라이드 | 번호 항목 | 번호 없는 항목 | 상태 |
|---|---|---:|---:|---|
| `PartnerRegister.html` | 7, 8, 9, 10, 11, 12, 13 | 9 | 0 | 완료 |
| `SRMLogin.html` | 4, 5, 6, 14, 15 | 8 | 0 | 완료(목적지 없음 1) |

## 02_협력업체창구_로그인후

| HTML | 슬라이드 | 번호 항목 | 번호 없는 항목 | 상태 |
|---|---|---:|---:|---|
| `SRMDashboardPartner.html` | 4 | 0 | 0 | 원문 없음 |
| `SRMPartnerBidDocumentComplete.html` | 42 | 1 | 0 | 완료 |
| `SRMPartnerBidDocumentHistory.html` | 43, 44 | 3 | 0 | 완료 |
| `SRMPartnerBidDocumentSubmit.html` | 37 | 1 | 0 | 완료 |
| `SRMPartnerBidDocumentSubmitFiles.html` | 38 | 1 | 0 | 완료 |
| `SRMPartnerBidDocumentSubmitReview.html` | 40, 41 | 2 | 0 | 완료 |
| `SRMPartnerBidDocumentSubmitSelfEval.html` | 39 | 2 | 0 | 완료 |
| `SRMPartnerBidJoin.html` | 32 | 2 | 0 | 완료 |
| `SRMPartnerBidJoinDetail.html` | 33, 34, 35, 36 | 4 | 0 | 완료 |
| `SRMPartnerBidNegoDetail.html` | 52 | 0 | 0 | 원문 없음 |
| `SRMPartnerBidNegoHistory.html` | 54 | 0 | 0 | 원문 없음 |
| `SRMPartnerBidNegoList.html` | 51 | 4 | 0 | 완료 |
| `SRMPartnerBidNegoSubmit.html` | 53 | 2 | 0 | 완료 |
| `SRMPartnerBidNotice.html` | 25, 26, 27 | 7 | 0 | 완료(목적지 없음 1) |
| `SRMPartnerBidNoticeDetail.html` | 28, 29, 30, 31 | 10 | 0 | 완료 |
| `SRMPartnerBidPrice.html` | 45, 46 | 5 | 0 | 완료 |
| `SRMPartnerBidPriceComplete.html` | 47 | 2 | 0 | 완료 |
| `SRMPartnerBidResult.html` | 48, 49, 50 | 3 | 0 | 완료 |
| `SRMPartnerContract.html` | 55 | 4 | 0 | 완료 |
| `SRMPartnerContractDetail.html` | 56, 57, 58 | 5 | 0 | 완료(목적지 없음 2) |
| `SRMPartnerContractDocuments.html` | 59 | 4 | 0 | 완료 |
| `SRMPartnerFileRepo.html` | 11, 12 | 1 | 0 | 완료 |
| `SRMPartnerInfo.html` | 60, 61 | 1 | 0 | 완료 |
| `SRMPartnerInfoContact.html` | 64 | 2 | 0 | 완료 |
| `SRMPartnerInfoEdit.html` | 62, 63 | 2 | 0 | 완료 |
| `SRMPartnerInfoPassword.html` | 65 | 1 | 0 | 완료 |
| `SRMPartnerNegoQuoteHistory.html` | 24 | 0 | 0 | 원문 없음 |
| `SRMPartnerNegoQuoteRequestInfo.html` | 21 | 0 | 0 | 원문 없음 |
| `SRMPartnerNegoQuoteSubmit.html` | 22, 23 | 2 | 0 | 완료 |
| `SRMPartnerNegoRequest.html` | 17 | 1 | 0 | 완료 |
| `SRMPartnerNegoRequestDetail.html` | 18, 19 | 0 | 0 | 원문 없음 |
| `SRMPartnerNegoRequestQuote.html` | 20 | 3 | 0 | 완료 |
| `SRMPartnerNotice.html` | 5, 6 | 1 | 0 | 완료 |
| `SRMPartnerPreQuote.html` | 13, 14, 15 | 5 | 0 | 완료 |
| `SRMPartnerPreQuoteSubmit.html` | 16 | 2 | 0 | 완료 |
| `SRMPartnerQna.html` | 7, 8, 9, 10 | 5 | 0 | 완료 |

## 03_대시보드

| HTML | 슬라이드 | 번호 항목 | 번호 없는 항목 | 상태 |
|---|---|---:|---:|---|
| `SRMDashFileRepo.html` | 7, 8 | 4 | 0 | 완료 |
| `SRMDashNotice.html` | 5, 6 | 4 | 0 | 완료 |
| `SRMDashboardAdmin.html` | 4 | 0 | 0 | 원문 없음 |
| `SRMDashboardBiz.html` | 4 | 0 | 0 | 원문 없음 |
| `SRMDashboardContract.html` | 4 | 0 | 0 | 원문 없음 |

## 04_사전견적관리

| HTML | 슬라이드 | 번호 항목 | 번호 없는 항목 | 상태 |
|---|---|---:|---:|---|
| `SRMPreQuoteRequest.html` | 4 | 3 | 0 | 완료 |
| `SRMPreQuoteRequestComplete.html` | 15 | 0 | 0 | 원문 없음 |
| `SRMPreQuoteRequestManage.html` | 6 | 1 | 0 | 완료 |
| `SRMPreQuoteRequestManageAttach.html` | 10 | 1 | 0 | 완료 |
| `SRMPreQuoteRequestManageItems.html` | 7, 8, 9 | 7 | 0 | 완료 |
| `SRMPreQuoteRequestManageReview.html` | 13, 14 | 1 | 0 | 완료 |
| `SRMPreQuoteRequestManageVendor.html` | 11, 12 | 5 | 0 | 완료 |
| `SRMPreQuoteRequestNew.html` | 5 | 1 | 0 | 완료 |
| `SRMPreQuoteStatus.html` | 16 | 2 | 0 | 완료 |
| `SRMPreQuoteStatusDetail.html` | 17, 18 | 0 | 0 | 원문 없음 |
| `SRMPreQuoteStatusDetailSubmission.html` | 19 | 2 | 0 | 완료 |
| `SRMPreQuoteSubmissionDetail.html` | 20, 21 | 1 | 0 | 완료 |

## 05_발주계약요청

| HTML | 슬라이드 | 번호 항목 | 번호 없는 항목 | 상태 |
|---|---|---:|---:|---|
| `SRMOrderContractRequest.html` | 6 | 2 | 0 | 완료 |
| `SRMOrderContractRequestComplete.html` | 19 | 0 | 0 | 원문 없음 |
| `SRMOrderContractRequestManage.html` | 9, 8 | 3 | 0 | 완료 |
| `SRMOrderContractRequestManageChecklist.html` | 10, 11, 12 | 5 | 0 | 완료(목적지 없음 1) |
| `SRMOrderContractRequestManageItems.html` | 13, 14, 15 | 7 | 0 | 완료 |
| `SRMOrderContractRequestManageReview.html` | 16, 17, 18 | 2 | 0 | 완료 |
| `SRMOrderContractRequestNew.html` | 7, 8 | 4 | 0 | 완료 |
| `SRMOrderContractStatus.html` | 20, 21, 22, 26, 27, 28, 29, 30, 31, 32 | 13 | 0 | 완료 |
| `SRMOrderContractStatusDetail.html` | 23, 24, 25, 21, 22 | 1 | 0 | 완료 |

## 06_발주계획

| HTML | 슬라이드 | 번호 항목 | 번호 없는 항목 | 상태 |
|---|---|---:|---:|---|
| `SRMOrderPlanIntake.html` | 6, 7, 8, 9 | 5 | 0 | 완료 |
| `SRMOrderPlanIntakeDetail.html` | 9, 10, 11, 7, 8 | 4 | 0 | 완료 |
| `SRMOrderPlanRegister.html` | 12 | 4 | 0 | 완료 |
| `SRMOrderPlanRegisterComplete.html` | 24 | 0 | 0 | 원문 없음 |
| `SRMOrderPlanRegisterDetail.html` | 25, 26, 27 | 2 | 0 | 완료(목적지 없음 1) |
| `SRMOrderPlanRegisterManage.html` | 13, 14 | 3 | 0 | 완료 |
| `SRMOrderPlanRegisterManageChecklist.html` | 15, 16, 17 | 8 | 0 | 완료 |
| `SRMOrderPlanRegisterManageItems.html` | 18, 19, 20 | 7 | 0 | 완료 |
| `SRMOrderPlanRegisterManageReview.html` | 21, 22, 23 | 3 | 0 | 완료 |

## 07-1_수의계약관리

| HTML | 슬라이드 | 번호 항목 | 번호 없는 항목 | 상태 |
|---|---|---:|---:|---|
| `SRMSoleSourceParticipateDocuments.html` |  | 0 | 0 | 원문 없음 |
| `SRMSoleSourcePlan.html` | 6 | 4 | 0 | 완료 |
| `SRMSoleSourcePlanComplete.html` | 19 | 1 | 0 | 완료(목적지 없음 1) |
| `SRMSoleSourcePlanManage.html` | 7, 8, 9 | 3 | 0 | 완료 |
| `SRMSoleSourcePlanManageDetail.html` | 10 | 3 | 0 | 완료 |
| `SRMSoleSourcePlanManageDocuments.html` | 15, 16 | 6 | 0 | 완료 |
| `SRMSoleSourcePlanManagePrice.html` | 11, 12, 13, 14 | 2 | 0 | 완료 |
| `SRMSoleSourcePlanManageReview.html` | 17, 18 | 2 | 0 | 완료 |
| `SRMSoleSourceQuoteRequest.html` | 26 | 5 | 0 | 완료(목적지 없음 1) |
| `SRMSoleSourceQuoteStatus.html` | 29 | 0 | 0 | 원문 없음 |
| `SRMSoleSourceStatus.html` | 20, 21, 22, 23 | 1 | 0 | 완료 |
| `SRMSoleSourceStatusContract.html` | 30, 31, 32, 33, 34 | 9 | 0 | 완료 |
| `SRMSoleSourceStatusPlan.html` | 24, 25 | 1 | 0 | 완료 |
| `SRMSoleSourceStatusQuote.html` | 27, 28 | 8 | 0 | 완료 |

## 07-2_입찰관리

| HTML | 슬라이드 | 번호 항목 | 번호 없는 항목 | 상태 |
|---|---|---:|---:|---|
| `SRMDetail.html` | 31, 32, 33, 34, 36, 37, 38, 39, 40, 41 | 8 | 1 | 완료 |
| `SRMDetailContract.html` | 75, 76, 77, 78, 79 | 9 | 0 | 완료 |
| `SRMDetailEvaluation.html` | 47, 48, 49, 50, 51, 52, 53, 54, 55, 45, 46 | 19 | 0 | 완료(목적지 없음 4) |
| `SRMDetailNegoQuoteInfo.html` | 74 | 0 | 0 | 원문 없음 |
| `SRMDetailNegotiation.html` | 72, 73, 65 | 13 | 0 | 완료 |
| `SRMDetailOpening.html` | 56, 57, 58, 59, 60, 61, 62, 63, 46 | 27 | 0 | 완료 |
| `SRMDetailOrderPlan.html` | 35 | 1 | 0 | 완료 |
| `SRMDetailParticipation.html` | 42, 43, 44, 45, 46 | 8 | 0 | 완료 |
| `SRMDetailWinner.html` | 64, 65, 66, 67, 68, 69, 70, 71 | 25 | 5 | 완료 |
| `StepWorkflow.html` | 6, 16, 17, 18, 19, 20, 21, 22, 23 | 29 | 0 | 완료(목적지 없음 4) |
| `StepWorkflowBidPlan.html` | 10, 11, 12, 13 | 11 | 0 | 완료 |
| `StepWorkflowComplete.html` | 30 | 0 | 0 | 원문 없음 |
| `StepWorkflowDocuments.html` | 24, 25 | 5 | 0 | 완료 |
| `StepWorkflowEvaluation.html` | 14, 15 | 8 | 0 | 완료 |
| `StepWorkflowOrderPlan.html` | 7, 8, 9 | 3 | 0 | 완료 |
| `StepWorkflowReview.html` | 26, 27, 28, 29 | 8 | 0 | 완료(목적지 없음 2) |

## 08_계약관리

| HTML | 슬라이드 | 번호 항목 | 번호 없는 항목 | 상태 |
|---|---|---:|---:|---|
| `SRMContractDocumentManage.html` | 11, 12, 13 | 5 | 0 | 완료 |
| `SRMContractStatus.html` | 4, 5 | 7 | 0 | 완료 |
| `SRMContractStatusDetail.html` | 6, 7 | 4 | 0 | 완료(목적지 없음 1) |
| `SRMContractStatusDetailBidPlan.html` | 20, 21, 22, 23, 24, 25 | 4 | 0 | 완료(목적지 없음 1) |
| `SRMContractStatusDetailDocs.html` | 8, 9, 10 | 10 | 0 | 완료 |
| `SRMContractStatusDetailOrderPlan.html` | 17, 18, 19 | 0 | 0 | 원문 없음 |
| `SRMContractStatusDetailRequest.html` | 14, 15, 16 | 0 | 0 | 원문 없음 |

## 09_협력업체관리

| HTML | 슬라이드 | 번호 항목 | 번호 없는 항목 | 상태 |
|---|---|---:|---:|---|
| `SRMPartnerApproval.html` | 4, 5, 6 | 6 | 0 | 완료 |
| `SRMPartnerManage.html` | 7 | 2 | 0 | 완료 |
| `SRMPartnerManageDetail.html` | 8, 9, 10 | 7 | 0 | 완료 |
| `SRMPartnerManageEdit.html` | 11, 12 | 1 | 0 | 완료 |
| `SRMPartnerQnaAnswer.html` | 15 | 2 | 0 | 완료(목적지 없음 1) |
| `SRMPartnerQnaDetail.html` | 14 | 0 | 0 | 원문 없음 |
| `SRMPartnerQnaManage.html` | 13 | 1 | 0 | 완료 |

## 10_기준정보관리

| HTML | 슬라이드 | 번호 항목 | 번호 없는 항목 | 상태 |
|---|---|---:|---:|---|
| `SRMCommonDocDetail.html` | 11 | 0 | 0 | 원문 없음 |
| `SRMCommonDocForm.html` |  | 0 | 0 | 원문 없음 |
| `SRMCommonDocManage.html` | 10 | 4 | 0 | 완료 |
| `SRMCommonEvalDetail.html` | 9 | 0 | 0 | 원문 없음 |
| `SRMCommonEvalForm.html` |  | 0 | 0 | 원문 없음 |
| `SRMCommonEvalManage.html` | 8 | 2 | 0 | 완료 |
| `SRMCommonItemDetail.html` | 6 | 0 | 0 | 원문 없음 |
| `SRMCommonItemForm.html` | 5 | 2 | 0 | 완료 |
| `SRMCommonItemManage.html` | 4 | 1 | 0 | 완료 |
| `SRMMailContentDetail.html` | 13 | 2 | 0 | 완료 |
| `SRMMailContentForm.html` | 13 | 2 | 0 | 완료 |
| `SRMMailContentManage.html` | 12 | 1 | 0 | 완료 |
| `SRMMailSend.html` | 14, 15, 16, 17, 18 | 5 | 0 | 완료 |
| `SRMMailSendStatus.html` | 19 | 0 | 0 | 원문 없음 |
| `SRMSourcingGroupDetail.html` |  | 0 | 0 | 원문 없음 |
| `SRMSourcingGroupManage.html` | 7 | 1 | 0 | 완료 |

## 목적지를 둘 수 없는 항목

| HTML | 항목 | 사유 |
|---|---|---|
| `00_공통관리/SRMClientDetail.html` | 00-16:1 | PPTX 슬라이드에 번호 원이 없음 |
| `00_공통관리/SRMCodeManage.html` | 00-11:1 | 번호 원 ①이 가리키는 코드 검색 구분 UI가 현재 화면에 없음(화면 변경 여부 사용자 확인 필요) |
| `01_협력업체창구_로그인전/SRMLogin.html` | 01-14:1 | PPTX 슬라이드에 번호 원이 없음(아이디 찾기 팝업 전체 설명) |
| `02_협력업체창구_로그인후/SRMPartnerBidNotice.html` | 02-25:7 | PPTX에 ⑦ 번호 원이 없음(목록 표가 Description 칸을 덮어 ⑦ 문단이 가려져 있음) |
| `02_협력업체창구_로그인후/SRMPartnerContractDetail.html` | 02-56:1 | PPTX 슬라이드에 번호 원이 없음 |
| `02_협력업체창구_로그인후/SRMPartnerContractDetail.html` | 02-57:1 | PPTX 슬라이드에 번호 원이 없음 |
| `05_발주계약요청/SRMOrderContractRequestManageChecklist.html` | 05-10:2 | PPTX 슬라이드에 ② 번호 원이 없음 |
| `06_발주계획/SRMOrderPlanRegisterDetail.html` | 06-26:1 | PPTX 슬라이드에 번호 원이 없음 |
| `07-1_수의계약관리/SRMSoleSourcePlanComplete.html` | 07-1-19:1 | PPTX 슬라이드에 번호 원이 없음 |
| `07-1_수의계약관리/SRMSoleSourceQuoteRequest.html` | 07-1-26:1 | 번호 원 ①이 가리키는 '견적 요청 담당자 정보' 영역이 현재 화면에 없음(화면설계와 차이, 확인 필요) |
| `07-2_입찰관리/SRMDetailEvaluation.html` | 07-2-48:1 | 심사/평가 상세 팝업에 '자가 심사 정보 확인' 버튼이 없음(화면설계와 차이, 확인 필요) |
| `07-2_입찰관리/SRMDetailEvaluation.html` | 07-2-53:1 | PPTX 슬라이드에 번호 원이 없음 |
| `07-2_입찰관리/SRMDetailEvaluation.html` | 07-2-54:1 | 심사/평가 상세 팝업에 '자가 심사 정보 확인' 버튼이 없음(화면설계와 차이, 확인 필요) |
| `07-2_입찰관리/SRMDetailEvaluation.html` | 07-2-55:1 | PPTX 슬라이드에 번호 원이 없음 |
| `07-2_입찰관리/StepWorkflow.html` | 07-2-21:2 | 복수예비가격표 팝업에 '+2% 복수예비금액' 표가 없음(화면설계와 차이, 확인 필요) |
| `07-2_입찰관리/StepWorkflow.html` | 07-2-21:3 | 복수예비가격표 팝업에 '-2% 복수예비금액' 표가 없음(화면설계와 차이, 확인 필요) |
| `07-2_입찰관리/StepWorkflow.html` | 07-2-21:4 | 복수예비가격표 팝업에 '복수예비가격 자동 생성' 버튼이 없음(화면설계와 차이, 확인 필요) |
| `07-2_입찰관리/StepWorkflow.html` | 07-2-22:3 | PPTX 슬라이드에 ③ 번호 원이 없음 |
| `07-2_입찰관리/StepWorkflowReview.html` | 07-2-28:2 | 최종 점검 화면에 예비가(낙찰하한가) 요약 표가 없음(화면설계와 차이, 확인 필요) |
| `07-2_입찰관리/StepWorkflowReview.html` | 07-2-28:3 | 최종 점검 화면에 예정가 요약 표가 없음(화면설계와 차이, 확인 필요) |
| `08_계약관리/SRMContractStatusDetail.html` | 08-7:3 | PPTX 슬라이드에 ③ 번호 원이 없음(①②가 두 번씩 표기됨, PPTX 표기대로 반영) |
| `08_계약관리/SRMContractStatusDetailBidPlan.html` | 08-23:1 | PPTX 슬라이드에 번호 원이 없음 |
| `09_협력업체관리/SRMPartnerQnaAnswer.html` | 09-15:2 | 답변 '삭제' 버튼은 질문 상세 화면(SRMPartnerQnaDetail.html) 하단 목록 줄에 있음(이 화면은 답변 등록/수정 화면) |

## 제외한 슬라이드

| 슬라이드 | 사유 |
|---|---|
| 05-4 | [참고자료] 계약방법, 낙찰자 선정방법 정리 — 화면이 아닌 참고자료 슬라이드(05·06·07-1·07-2 모듈에 동일하게 반복) |
| 05-5 | [참고자료] 계약방법, 낙찰자 선정방법 정리 — 화면이 아닌 참고자료 슬라이드(05·06·07-1·07-2 모듈에 동일하게 반복) |
| 06-4 | [참고자료] 계약방법, 낙찰자 선정방법 정리 — 화면이 아닌 참고자료 슬라이드(05·06·07-1·07-2 모듈에 동일하게 반복) |
| 06-5 | [참고자료] 계약방법, 낙찰자 선정방법 정리 — 화면이 아닌 참고자료 슬라이드(05·06·07-1·07-2 모듈에 동일하게 반복) |
| 07-1-4 | [참고자료] 계약방법, 낙찰자 선정방법 정리 — 화면이 아닌 참고자료 슬라이드(05·06·07-1·07-2 모듈에 동일하게 반복) |
| 07-1-5 | [참고자료] 계약방법, 낙찰자 선정방법 정리 — 화면이 아닌 참고자료 슬라이드(05·06·07-1·07-2 모듈에 동일하게 반복) |
| 07-2-4 | [참고자료] 계약방법, 낙찰자 선정방법 정리 — 화면이 아닌 참고자료 슬라이드(05·06·07-1·07-2 모듈에 동일하게 반복) |
| 07-2-5 | [참고자료] 계약방법, 낙찰자 선정방법 정리 — 화면이 아닌 참고자료 슬라이드(05·06·07-1·07-2 모듈에 동일하게 반복) |

## 판단 기록 (PPTX 표기와 화면의 차이·해석)

| 슬라이드 | 내용 |
|---|---|
| 02-22 | PPTX 번호 원 ①이 '수의계약 참여 서류' 행에 있으나 Description ①은 예정가 제공 설명임. 설명 내용대로 예정가 안내 영역에 연결 |
| 02-23 | Description은 ①만 있고 번호 원은 ②로 표기됨. 같은 목적지(견적 제출하기 확인 버튼)에 ①로 연결 |
| 02-25 | ⑦ 문단은 PPTX에서 목록 표가 Description 칸을 덮어 가려져 있으나 원문에 있으므로 드로어에 포함(번호 원 없음) |
| 02-48 | PPTX의 '아직 입찰 결과가 도출되지 않았습니다.'·'본 입찰 건은 유찰되었습니다.' 안내 박스가 화면에 없고 각주 문장으로 대체되어 있음(화면 차이). 목적지는 각주 문장에 연결 |
| 02-53 | 번호 원 두 개가 모두 ②로 표기됨. 예정가 안내는 ①, 견적 제출하기 버튼은 ②로 연결 |
| 04-6 | 번호 원 ②(비고 행)에 대응하는 Description 문단이 없어 목적지를 만들지 않음 |
| 05-26 | ① 원문 '기준정보 관리의 공통 품목에 등록된 내용을 호출'은 진행상황 팝업과 맞지 않아 PPTX 복사 오류로 보이나 원문 그대로 둠 |
| 05-31 | 번호 원 ②(수의계약 완료 처리)에 대응하는 Description 문단이 없어 목적지를 만들지 않음 |
| 07-1-12 | 번호 원 ③④만 있고 Description 문단이 없어 드로어·목적지 없음 |
| 07-1-18 | PPTX에 ①이 두 곳(참여 서류 제목, 최종저장 버튼)에 표기되어 두 곳 모두 연결 |
| 07-1-27 | '재견적 요청하기' 버튼의 번호 원이 ⑥으로 표기되어 있으나 설명은 ⑦('견적요청 화면으로 이동')과 일치하여 ⑦로 연결(⑦은 별도 번호 원 없음) |
| 07-2-14 | Description ① 문장이 화면에 안내 문구로도 표시되어 있음(화면 구성 확인 필요). 같은 유형: 09·10 모듈 목록·등록 화면의 안내 문구 |
| 07-2-16 | 예비가(07-2-16)·예정가(07-2-17) 슬라이드가 같은 단계 박스를 가리켜 목적지 번호에 가격유형 조건(data-ui-show)을 적용. 07-2-19/22, 07-2-20/23 팝업도 동일 |
| 07-2-31 | 키워드 검색 행의 ⑤ 번호 원은 번호 없는 말풍선('검색 구분 : …', 연결선이 검색 구분 select에 연결)과 겹쳐 목적지를 만들지 않음. ⑤ 말풍선(입찰계획서 호출)은 연결선대로 공고번호 열에 연결 |
| 07-2-56 | 개찰 전(07-2-56)·후(07-2-57)·2단계 동시(07-2-61)·완료(07-2-62/63) 슬라이드가 같은 개찰 결과 표를 가리켜 개찰 상태 조건을 적용 |
| 08-7 | ①②가 각각 두 번 표기되고 ③은 번호 원이 없음. 추정하지 않고 PPTX 표기대로 네 곳에 연결 |
| 08-8 | PPTX는 계약 변경 기능을 '계약 정보' 탭에 두었으나 프로토타입은 '계약 관련 서류' 탭 화면에 있음(화면 차이). 요소가 있는 화면에 연결 |
| 10-5 | 번호 원 두 개가 모두 ①로 표기됨. 발주단위 select는 ②(단위 목록) 설명과 일치하여 ②로 연결 |
| 00-4 | Description 칸 밖 상단의 '그룹웨어 연동 필요'(00-4·5)·'ERP 연동 필요'(00-15·16) 메모는 Description이 아니어서 포함하지 않음 |
| 07-2-19 | 슬라이드 바깥(왼쪽)의 낙찰하한율 참고 메모는 Description 칸이 아니어서 포함하지 않음 |
