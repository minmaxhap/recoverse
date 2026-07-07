# Recoverse

Recoverse는 회고를 길게 쓰는 앱이 아니라, 짧은 질문으로 기록을 시작하고 시간이 지난 뒤 예전의 나를 다시 발견하게 하는 모바일 우선 회고 서비스입니다.

현재 구현은 Vue 3, TypeScript, Vite 기반 프론트엔드 MVP입니다. 데이터는 서버 없이 브라우저 `localStorage`에 저장되며, 백업/가져오기와 URL hash 기반 읽기 전용 공유를 지원합니다.

## 현재 상태

- 핵심 화면: 홈, 회고 시작, 질문 작성, 회고 상세, 다시 보기, 공유 화면, 설정
- 저장소: `localStorage["recoverse_reflections_v1"]`
- 백업: `recoverse_reflections_v1` JSON schema
- 공유: `#share=` URL hash에 선택한 공개 답변 snapshot을 base64url로 담는 방식
- 보안 보강: 백업 import 크기/개수 제한, 공유 hash 크기 제한, malformed timestamp overwrite 방어, `postcss` 취약 버전 override

## 주요 문서

- [제품 계획](./PRODUCT_PLAN.md)
- [제품 스펙](./PRODUCT_SPEC.ko.md)
- [디자인 시스템](./DESIGN.md)
- [한국어 디자인 시스템](./DESIGN_SYSTEM.ko.md)
- [사용자 흐름](./USER_FLOW.md)
- [아키텍처](./ARCHITECTURE.ko.md)
- [보안 메모](./SECURITY.md)
- [남은 작업](./TODO.md)
- [프론트엔드 실행 방법](./recoverse-frontend/README.md)

## 실행

```bash
cd recoverse-frontend
pnpm install
pnpm run dev
```

## 검증

```bash
cd recoverse-frontend
pnpm test
pnpm run build
pnpm audit --prod
```

## 현재 제품 리스크

- 회고 데이터는 localStorage에 평문 저장됩니다. XSS, 악성 확장 프로그램, 같은 브라우저 프로필 접근에는 안전하지 않습니다.
- 공유 링크는 서버로 전송되지 않는 hash를 쓰지만, 링크를 받은 사람은 선택된 답변을 읽을 수 있습니다.
- 계정/OAuth/서버 저장/공유 만료/접근 권한은 아직 구현하지 않았습니다.
