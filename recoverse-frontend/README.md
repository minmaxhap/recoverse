# Recoverse Frontend

Vue 3, TypeScript, Vite 기반의 Recoverse 프론트엔드입니다.

## 화면 구조

- `HomeUniverseView`: 첫 진입 장면과 오늘 다시 떠오른 기억
- `NewReflectionPage`: 유형 → 기간 → 질문 세트 3단계 wizard
- `WriteReflectionPage`: 질문 카드 한 개씩 답변 작성
- `ReflectionDetailPage`: 대표 문장과 질문/답변 감상, 공유 진입
- `ReviewAgainPage`: 같은 질문/연도/주제/랜덤 다시 보기
- `SharedReflectionPage`: URL 해시로 받은 읽기 전용 회고

설정(언어, 테마, 회고 백업/가져오기, 전체 삭제)은 상단 프로필 메뉴에서 `ArchiveSettingsTools` 단일 패널로 연다.

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
recoverse_theme            # universe / letter / journey
```

공유 스냅샷은 저장하지 않고 URL 해시 (`#share=...`)에 base64url로 인코딩합니다.
