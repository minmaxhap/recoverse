# Recoverse

> 친구들과 함께한 회고를 잡지 한 호처럼 남기고, 시간이 지나 같은 질문에 답한 다른 해의 나를 다시 발견하는 인터랙티브 회고 플랫폼.

**메타포:** 세션 하나 = 잡지 한 호(Issue). 세션을 마치면 "발행"되어 책장에 꽂힌다. 각자 자기 폰으로 코드에 합류해 돌아가며 질문하고, 모두 답하면 동시에 공개된다.

## 구조 (pnpm 워크스페이스)

```
recoverse/
  recoverse-shared/    # 데이터 모델·결정적 셔플·질문 정규화·검증 (프론트·백엔드 공용)
  recoverse-worker/    # Cloudflare Workers + KV 세션 백엔드 (2.5초 폴링, WebSocket 없음)
  recoverse-frontend/  # Vue 3 + Vite + TS. 에디토리얼 잡지 UI, 화면 11종
  docs/                # 제품 스펙·와이어프레임·검증된 프로토타입 (Phase 1 기준)
```

## 실행

**Node.js 22 이상 필요** (`wrangler dev`가 요구). 루트에서:

```bash
pnpm install
pnpm dev          # vite(프론트) + wrangler dev(worker 8787) 병렬 실행
```

프론트는 `/api`를 worker(`127.0.0.1:8787`)로 프록시한다. 로컬 멀티플레이어 테스트는 **같은 브라우저 탭 3개 = 3인** (신원이 탭별 sessionStorage에 저장됨). 실기기 테스트는 `vite --host` 후 같은 Wi‑Fi에서 `http://<PC-IP>:5173`.

## 검증

```bash
pnpm -F recoverse-worker test    # worker 세션 로직 (vitest-pool-workers, 9 케이스)
pnpm -F recoverse-frontend typecheck
pnpm -F recoverse-frontend build
```

## 기능 (Phase 1)

- **그룹 라이브 세션** — 코드 합류 → 라운드제(질문자 로테이션) → 전원 답 → 동시 공개 → 발행
- **누가 썼게** — 3인 이상에서 답을 익명(가/나/다)으로 공개 후 작성자 추측, 발행 시 "올해의 독심술사" 발표
- **혼자 쓰기 / 복간** — 솔로 발행, 종이 회고 옮겨 적기
- **책장 / 지난 호 열람** — 개인 책장(localStorage)에 발행된 호 보관
- **다시 발견** — 같은 질문을 여러 해에 걸쳐 그룹핑, 타임라인으로 열람

Phase 2/3(AI 진행자·사진 스캔·자동 편집·포맷 시스템 등)는 미착수. 데이터 모델만 전 Phase 대응으로 설계됨 — [docs/recoverse-spec.md](./docs/recoverse-spec.md) §3 참고.

## 아키텍처·보안

- [ARCHITECTURE.ko.md](./ARCHITECTURE.ko.md) — 워크스페이스·KV 키 레이아웃·레이스 안전·보안 모델
- [docs/recoverse-spec.md](./docs/recoverse-spec.md) — 제품 스펙(Phase 로드맵, 데이터 모델, 화면 목록, 디자인 토큰)
- [docs/recoverse-wireframes.html](./docs/recoverse-wireframes.html) — 화면 와이어프레임
- 인증 없음(4자리 코드). 개인 책장은 localStorage. 답변은 **전원 제출 전 서버가 은닉**(`answers: null`), 추측·답변은 **1회 불변**(재제출로 점수 조작 불가).

## 배포 (Cloudflare)

```bash
# 1) KV 네임스페이스 생성 후 recoverse-worker/wrangler.jsonc의 id 교체
pnpm -F recoverse-worker exec wrangler kv namespace create SESSIONS
# 2) 프론트 빌드 → worker가 같은 오리진에서 정적 서빙(/api/*는 worker, 그 외 SPA)
pnpm -F recoverse-frontend build
pnpm -F recoverse-worker exec wrangler deploy
```

## 이전 문서에 대하여

`DESIGN.md`, `DESIGN_SYSTEM.ko.md`, `PRODUCT_PLAN.md`, `PRODUCT_SPEC.ko.md`, `USER_FLOW.md`, `REDESIGN_PLAN.ko.md`, `UX_REDESIGN_BRIEF.ko.md`, `ACCOUNT_STORAGE_PLAN.ko.md`, `SECURITY.md`, `TODO.md`는 **피벗 이전(혼자 쓰기 로컬 회고 앱) 제품을 설명**하며 현재 코드와 맞지 않는다. 현재 기준은 위 `docs/recoverse-spec.md`다.
