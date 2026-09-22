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

### 다음 작업자가 확인할 사항

1. `SRMCodeManage.html`의 검색 UI를 화면설계대로 추가할지 사용자 결정을 받습니다.
2. 추가 승인 시 슬라이드 11 Description 1번을 새 검색 구분 컨트롤에 연결합니다.
3. 미추가 결정 시 `미구현 목적지` 승인 예외로 남기고 상태를 `완료(예외)`로 변경합니다.
4. 다음 적용 대상은 루트 `index.html`과 `01_협력업체창구_로그인전` 2개 HTML입니다.
