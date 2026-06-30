# Recoverse 제품 명세

이 문서는 상세 명세의 진입점이다. 현재 기준은 새 **Recoverse Mobile Design Bible** 방향으로 정리된 아래 문서들이다.

- 제품 정의, 원칙, 12개 핵심 화면 범위: [PRODUCT_PLAN.md](./PRODUCT_PLAN.md)
- 디자인 토큰과 컴포넌트 기준: [DESIGN.md](./DESIGN.md)
- 한국어 디자인 시스템 설명: [DESIGN_SYSTEM.ko.md](./DESIGN_SYSTEM.ko.md)
- 사용자 흐름과 화면 간 이동: [USER_FLOW.md](./USER_FLOW.md)
- 코드 구조와 현재 Vue 모드 매핑: [ARCHITECTURE.ko.md](./ARCHITECTURE.ko.md)
- 계정 저장 계약: [ACCOUNT_STORAGE_PLAN.ko.md](./ACCOUNT_STORAGE_PLAN.ko.md)

## 구현 목표 화면

1. Splash
2. Home
3. 회고 시작
4. 질문 작성
5. 작성 완료
6. 회고 앨범
7. 회고 상세
8. 연말 회고
9. 여행 회고
10. 친구 비교
11. 설정
12. 디자인 시스템

## 변경하지 않는 계약

- `recoverse_reflections_v1` 저장 키
- `Reflection[]` 백업 호환성
- URL 해시 기반 공유 스냅샷
- 기존 localStorage 우선 MVP 원칙
