# HTML 화면·팝업 분리 현황

> 갱신일: 2026-09-23  
> 기준: `DESIGN_GUIDE.md` v2.50, 5.1·5.8·6.2.1

## 적용 결과

- 부모 화면 안에 직접 포함되어 있던 `.modal-backdrop`: 209개 → 0개
- 외부 팝업 manifest가 적용된 부모 화면: 44개
- 화면설계 재대조 후 독립 페이지로 전환한 오분류 팝업: 51개
- 현재 독립 팝업 HTML: 158개
- 누락된 팝업 파일: 0개
- 존재하지 않는 `data-open-modal` 대상: 0개
- 부모와 외부 팝업을 합친 범위의 중복 ID: 0개

페이지 전환 대상은 업무 모듈 폴더의 독립 HTML로 이동했고, 목록/버튼의 `data-open-modal` 호출을 페이지 이동으로 교체했습니다. 변환된 페이지는 공통 헤더·사이드바·푸터와 `.main-content`를 유지하며 `.modal-backdrop`을 포함하지 않습니다.

변환된 51개 페이지의 본문과 하단 액션 영역은 흰색 콘텐츠 카드로 통일했습니다. 부모 화면의 타이틀 도구와 breadcrumb를 복원하고 `<title>`도 `시스템 - 화면명 | KEPCO ES` 형식으로 정규화했습니다.

## 파일 구조

```text
부모화면.html
popups/
  부모화면/
    popupId.html
```

부모 화면은 `external-modal-manifest`에 자신이 사용하는 팝업 HTML 경로만 선언합니다. 공통 `loadExternalModals()`가 `DOMContentLoaded` 초기화의 가장 앞에서 외부 파일을 불러오고, 기존 `data-open-modal` 및 `initModals()` 동작을 그대로 사용합니다.

각 팝업 파일은 DOCTYPE·언어·문자셋·viewport·title·공통 CSS·공통 JS를 갖춘 완전한 HTML 문서이며, `body.popup-document` 바로 아래에 자신의 `.modal-backdrop` 하나만 둡니다.

## 유지보수 규칙

1. 새 팝업은 부모 HTML에 작성하지 않습니다.
2. `popups/{부모파일명}/{팝업ID}.html` 파일을 먼저 생성합니다.
3. 팝업 파일명과 루트 `.modal-backdrop` ID를 동일하게 합니다.
4. 부모의 JSON manifest에 상대 경로를 추가합니다.
5. 부모 화면과 팝업 파일을 합쳐 ID 중복 및 호출 대상 누락을 검사합니다.

## 마이그레이션 도구

`tools/split_embedded_modals.py`는 기존 내장 팝업을 독립 문서로 분리하기 위한 일회성 마이그레이션 도구입니다. 현재 대상은 모두 분리되어 다시 실행해도 추가 생성이나 변경이 발생하지 않습니다.

`tools/convert_misclassified_popups.py`는 화면설계상 페이지인데 모달로 구현된 항목을 독립 페이지로 변환하고, 호출부·manifest를 함께 정리하는 감사/마이그레이션 도구입니다.
