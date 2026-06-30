# Recoverse TODO

이 문서는 다음에 할 일과 보류한 결정만 추적한다. 끝낸 작업은 `git log`를 참고한다.

## 작업 규칙

- 코드 변경 전에 현재 UX 흐름과 데이터 경계를 먼저 확인한다.
- 기존 `recoverse_reflections_v1` 백업과 가져오기 호환성을 깨지 않는다.
- 디자인 구현은 [DESIGN.md](./DESIGN.md)와 [DESIGN_SYSTEM.ko.md](./DESIGN_SYSTEM.ko.md)의 토큰을 따른다.
- 한 번에 하나의 화면군만 바꾸고 테스트 가능한 상태로 마감한다.
- 구현 후 브라우저 시각 QA를 한다.

## 완료된 문서 기반

- [x] Recoverse Mobile Design Bible 작성
- [x] 루트 `DESIGN.md` 추가
- [x] 제품 계획을 Story Book x Time Capsule 방향으로 갱신
- [x] 사용자 흐름을 12개 핵심 화면 기준으로 갱신
- [x] 아키텍처 문서에 현재 Vue 모드와 목표 화면 매핑 추가

## 다음 구현 작업

- [ ] `src/style.css`에 `book-capsule` 디자인 토큰 적용
- [ ] `HomeUniverseView`를 Home 화면 디자인으로 교체
- [ ] `NewReflectionPage`를 회고 시작 화면으로 단순화
- [ ] `WriteReflectionPage`를 질문 작성/편지지 입력 디자인으로 교체
- [ ] 작성 완료 전용 화면 또는 모드 추가
- [ ] `ReviewAgainPage`를 회고 앨범 중심으로 재구성
- [ ] 회고 상세를 편지형 레이아웃으로 정리
- [ ] 연말 회고 화면 추가 또는 기존 데이터 기반 섹션 추가
- [ ] 여행 회고 화면 추가 또는 기존 travel 타입 상세를 확장
- [ ] 친구 비교 화면 추가
- [ ] 설정 화면을 새 디자인으로 정리
- [ ] 디자인 시스템 화면 추가

## 보류 작업

- [ ] 로그인 (Google / Kakao). 자세한 계약은 [ACCOUNT_STORAGE_PLAN.ko.md](./ACCOUNT_STORAGE_PLAN.ko.md).
- [ ] 계정 기반 클라우드 저장과 멀티 디바이스 동기화
- [ ] 서버 저장 기반 공유 링크 발행
- [ ] 접근 권한/비밀번호가 있는 공유 링크
- [ ] PDF 내보내기
- [ ] 실시간 그룹 협업
- [ ] 이미지/첨부파일 업로드
- [ ] Three.js/WebGL 화면

## 기본 검증 명령

프론트엔드 변경 후 기본적으로 아래를 실행한다.

```powershell
cd recoverse-frontend
node tests\recoverseStore.test.mjs
node node_modules\vue-tsc\bin\vue-tsc.js -b
node node_modules\vite\bin\vite.js build
```

디자인 구현 후 추가로 확인한다.

```text
375px 모바일 / 768px 태블릿 / 1280px 데스크톱 스크린샷
텍스트 overflow 없음
phone frame clipping 없음
주요 버튼 focus/active 상태 확인
```
