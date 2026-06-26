# Recoverse

Recoverse는 짧은 질문에 답하면서 자신의 기억을 남기고, 시간이 지난 뒤 다시 열어 그때의 나를 발견하는 개인 회고 앱이다.

현재 구현은 Vue 3 기반 프론트엔드 MVP이며, 데이터는 브라우저 `localStorage`에 저장된다.

## 핵심 화면

- 홈: 오늘 다시 떠오른 기억과 첫 작성 진입
- 새 회고: 유형 → 기간 → 질문 세트를 고르는 wizard
- 회고 작성: 질문 카드 단위로 한 문장씩 답하는 흐름
- 회고 상세: 대표 문장과 질문/답변을 감상
- 다시 보기: 같은 질문 타임라인, 연도별/주제별/랜덤 다시 보기
- 함께 보기: URL 해시로 받은 읽기 전용 공유 화면
- 설정: 언어, 테마, 회고 백업/가져오기, 전체 삭제

## 주요 문서

- [제품 플랜](./PRODUCT_PLAN.md)
- [디자인 시스템](./DESIGN_SYSTEM.ko.md)
- [사용자 플로우](./USER_FLOW.md)
- [아키텍처](./ARCHITECTURE.ko.md)
- [계정 저장 설계](./ACCOUNT_STORAGE_PLAN.ko.md)
- [작업 목록](./TODO.md)
- [프론트엔드 실행 방법](./recoverse-frontend/README.md)

## MVP 제외 범위

- 로그인 (UI placeholder만 존재)
- 클라우드 저장
- 서버 저장 기반 공유 링크
- PDF 내보내기
- 실시간 그룹 협업
