# Recoverse Frontend

Vue 3, TypeScript, Vite 기반의 Recoverse 프론트엔드입니다.

## 현재 상태

현재 코드는 기존 회고 MVP 구조를 유지하고 있습니다. 루트 문서들은 다음 구현 패스를 위해 **Story Book x Time Capsule** 모바일 디자인으로 갱신되었습니다.

주요 기준:

- 디자인 토큰: [`../DESIGN.md`](../DESIGN.md)
- 한국어 디자인 시스템: [`../DESIGN_SYSTEM.ko.md`](../DESIGN_SYSTEM.ko.md)
- 사용자 흐름: [`../USER_FLOW.md`](../USER_FLOW.md)
- 아키텍처 매핑: [`../ARCHITECTURE.ko.md`](../ARCHITECTURE.ko.md)

## 현재 화면 구조

| 파일 | 현재 역할 | 새 목표 |
| --- | --- | --- |
| `HomeUniverseView.vue` | 첫 진입 장면과 샘플 회고 | Home, 회고 앨범 일부 |
| `NewReflectionPage.vue` | 새 회고 wizard | 회고 시작 |
| `WriteReflectionPage.vue` | 질문 카드 작성 | 질문 작성 |
| `ReflectionDetailPage.vue` | 회고 상세와 공유 | 회고 상세, 작성 완료 후 진입 |
| `ReviewAgainPage.vue` | 다시 보기/비교 | 회고 앨범, 친구 비교, 연말 회고 |
| `SharedReflectionPage.vue` | URL 해시 읽기 전용 공유 | 공유 회고 상세 |
| `ArchiveSettingsTools.vue` | 설정/백업/초기화 | 설정 |

추가 목표 화면:

- Splash
- 작성 완료
- 여행 회고
- 디자인 시스템

## 실행

```bash
pnpm install
pnpm run dev
```

## 검증

```bash
pnpm run test
pnpm run build
```

PowerShell에서 `pnpm`이 PATH에 없으면 로컬 Node로 직접 실행할 수 있습니다.

```powershell
node tests\recoverseStore.test.mjs
node node_modules\vue-tsc\bin\vue-tsc.js -b
node node_modules\vite\bin\vite.js build
```

## 저장소

데이터는 브라우저 `localStorage`에 저장됩니다.

```text
recoverse_reflections_v1   # 모든 회고
recoverse_language         # ko / en
recoverse_theme            # 현재 구현 테마
```

공유 스냅샷은 저장하지 않고 URL 해시 (`#share=...`)에 base64url로 인코딩합니다.

## 디자인 구현 규칙

- 새 UI 값은 `../DESIGN.md`의 토큰으로 먼저 정의한다.
- 우주/행성/갤럭시 메타포는 기본 화면에서 제거한다.
- 이모지는 아이콘으로 쓰지 않는다.
- 카드, 버튼, 입력, 하단 탭은 디자인 시스템 컴포넌트로 재사용한다.
- 구현 후 375 / 768 / 1280px에서 실제 브라우저 스크린샷으로 확인한다.
