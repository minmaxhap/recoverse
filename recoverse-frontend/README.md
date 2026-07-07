# Recoverse Frontend

Recoverse의 Vue 3 + TypeScript + Vite 프론트엔드입니다.

## 실행

```bash
pnpm install
pnpm run dev
```

## 검증

```bash
pnpm test
pnpm run build
pnpm audit --prod
```

`pnpm test`는 `tests/recoverseStore.test.mjs`를 실행하며, 저장소 정규화, 백업 import, 공유 hash, app navigation, rediscovery, telemetry 경계를 검증합니다.

## 주요 구조

```text
src/
  App.vue
  main.ts
  style.css
  components/
    AppTopNav.vue
    AppBottomNav.vue
    AppDialog.vue
    ArchiveSettingsTools.vue
    DeliveryLoopPanel.vue
  views/
    HomeBookView.vue
    NewReflectionPage.vue
    WriteReflectionPage.vue
    ReflectionDetailPage.vue
    ReviewAgainPage.vue
    SharedReflectionPage.vue
    ArchiveSettingsView.vue
  lib/
    reflectionStore.ts
    reflectionBackup.ts
    reflectionShare.ts
    reflectionDraftStore.ts
    localTelemetry.ts
```

## 저장과 공유

- `reflectionStore.ts`: `localStorage["recoverse_reflections_v1"]` 저장/로드와 Reflection 정규화
- `reflectionBackup.ts`: JSON 백업 export/import, import 크기/개수 제한, timestamp 병합 판단
- `reflectionShare.ts`: 읽기 전용 공유 snapshot encode/decode, hash 크기와 item 수 제한
- `safeLocalStorage.ts`: localStorage read/write 실패를 앱 crash로 전파하지 않는 wrapper

## 의존성 보안

`pnpm-workspace.yaml`에서 `postcss`를 `8.5.10`으로 override합니다. `pnpm audit --prod`가 `No known vulnerabilities found`를 반환해야 합니다.
