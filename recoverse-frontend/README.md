# Recoverse Frontend

Vue 3, TypeScript, Vite 기반의 Recoverse 프론트엔드입니다.

## 화면 구조

- `HomeUniverseView`: 오늘의 발견, 기억 지도, 행성/은하 진입
- `PlanetDetailView`: 개인 행성의 질문 카드와 답변 편집
- `ArchiveSettingsView`: 보관함, 시간여행, 정리, 설정
- `GalaxyDetailView`: 그룹 은하 화면 골격
- `ObservationModeView`: 읽기 전용 관측 모드 화면 골격

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

현재 환경에서 `pnpm`이 PATH에 없으면 로컬 Node 런타임으로 직접 실행할 수 있습니다.

```powershell
C:\Users\wgals\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe tests\recoverseStore.test.mjs
C:\Users\wgals\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vue-tsc\bin\vue-tsc.js -b
C:\Users\wgals\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vite\bin\vite.js build
```

## 저장소

현재 MVP 데이터는 브라우저 localStorage에 저장됩니다.

```text
recoverse_capsule_v1
```
