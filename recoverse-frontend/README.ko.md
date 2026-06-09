# Recoverse 프론트엔드

Recoverse 프론트엔드는 Vue 3, TypeScript, Vite로 만든 localStorage 우선 회고 캡슐 앱입니다.

## 기능

- 주제별 회고 캡슐 만들기
- 한글/영어 언어 선택
- 기본 질문 템플릿으로 시작하기
- 질문 카드 추가/수정/삭제
- 질문별 답변 작성
- 캡슐 진행률 보기
- 캡슐 검색
- 반복 질문 비교
- 다시 발견하기 카드로 이동
- 캡슐 JSON 내보내기/가져오기
- 기존 연도 기반 백업을 캡슐로 변환

## 실행

```bash
pnpm install
pnpm run dev
```

## 빌드

```bash
pnpm run build
```

## 테스트

```bash
pnpm run test
```

## 저장소

현재 캡슐 데이터는 브라우저 localStorage에 저장됩니다.

```text
recoverse_capsule_v1
```

## MVP 제외 범위

- 로그인
- 클라우드 저장
- 공유 링크
- PDF 내보내기
