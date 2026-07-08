# Recoverse 아키텍처

## 개요

친구들과 함께하는 멀티플레이어 회고 플랫폼. pnpm 워크스페이스 3개로 구성되며, 세션 상태는 Cloudflare Workers + KV에, 개인 책장은 브라우저 localStorage에 둔다.

| 계층 | 스택 |
|---|---|
| 프론트 | Vue 3 + TypeScript + Vite (`recoverse-frontend`) |
| 백엔드 | Cloudflare Workers + KV (`recoverse-worker`) |
| 공용 | 데이터 모델·해시·검증 순수 TS (`recoverse-shared`) |
| 실시간 | 2.5초 폴링 (WebSocket 없음) |
| 배포 | Cloudflare — worker가 빌드된 프론트를 같은 오리진에서 정적 서빙 |

## 데이터 모델 (`recoverse-shared/src/model.ts`)

스펙 §3 그대로. 핵심은 `SessionMeta`(단계·라운드·질문자·history), `Round`(질문 + `answers: Record<name, Answer>`), `Issue`(책장에 저장되는 발행본). `date`는 ISO `YYYY-MM-DD`이며 표시용 연도는 `date.slice(0,4)`로 파생한다(별도 `year` 필드 없음). `Answer`는 문자열이 아니라 객체(`{ text }`)로, Phase 2·3의 `media`/`followUps` 확장을 미리 수용한다.

## 세션 상태 머신

```
lobby → question → answer → guess(3인 이상) → (전원 추측/강제 공개 = 공개) → question(다음) …
                          └→ (2인: 전원 답 = 즉시 공개)                      └→ ended
```

질문자 로테이션 `asker = players[roundIdx % players.length]`(합류 순). `roundIdx = -1`이 lobby.

## KV 키 레이아웃 (`recoverse-worker/src/kv.ts`, 전부 24h TTL)

```
session:{code}:meta                  → SessionMeta (단계별 단일 작성자)
session:{code}:p:{joinedAt}~{name}   → 참여자 마커 (키 정렬 = 합류 순)
session:{code}:r:{ri}:a:{name}       → Answer
session:{code}:r:{ri}:g:{name}       → Record<owner, guessedName>
session:{code}:r:{ri}:revealed       → "1" (호스트 강제 공개)
session:{code}:pastGuesses           → 지난 라운드 추측 누적 (독심술사 점수용)
```

### 레이스 안전

- **동시 쓰기 키**(`p`/`a`/`g`/`revealed`): 각 참여자가 자기 키만 쓰므로 last-write-wins가 자명하게 안전. 그래서 참여자·답변·추측을 meta 안 배열이 아닌 개별 키로 둔다.
- **`meta`는 단계별 단일 작성자**: create/start/next/end=호스트, question→answer=질문자, answer→guess=마지막 답 제출자(동시 제출해도 동일 값 `phase:'guess'`로 수렴). 이 규율을 핸들러에서 강제한다.
- 카운트는 `KV.list()` prefix로 집계(카운터 키의 read-modify-write 레이스 회피). 상태 전이는 전부 단조 전진이라 KV eventual consistency에서 지연은 있어도 손상은 없다.

## 보안 모델

인증 없음(4자리 코드, 스펙 §4). 친구·가족 범위의 게임으로 설계됨.

- **답변 은닉은 서버가 강제**: 전원 제출 전 `state.answers`는 `null`. 클라이언트 은닉만으로는 우회 가능하므로 서버에서 막는다. (`recoverse-worker/src/routes/session.ts`의 `buildState`)
- **추측·답변 1회 불변**: 한 번 제출한 추측/답변은 재제출로 바꿀 수 없다(`already_guessed`/`already_answered`), 공개 이후 신규 추측도 거부(`already_revealed`). 공개된 정답을 본 뒤 재제출해 독심술사 점수를 조작하는 것을 막는다.
- **입력 검증**(`recoverse-shared/src/validate.ts`): 코드 `^[A-HJ-NP-Z2-9]{4}$`, 이름 1–12자(`:` 금지 — 키 구분자), 질문 ≤200자, 답 ≤2000자, 본문 ≤16KB.
- **XSS**: 프론트는 Vue 텍스트 보간만 사용(`v-html`/`innerHTML` 없음) → 저장형 콘텐츠 자동 이스케이프.
- **프로덕션 동일 오리진**: worker가 `/api/*`를 처리하고 그 외는 `ASSETS`(빌드된 SPA)로 위임 → CORS 불필요.

### 알려진 한계 (설계상 수용)

- **신원 위조**: 인증이 없으므로 코드를 아는 사람은 아무 이름(호스트 포함)으로 행세 가능. 스펙의 무인증 설계 그대로.
- **추측 단계 작성자 노출**: 결정적 셔플이 클라이언트 방식(스펙 §5)이라, 추측 단계의 `answers` payload에 작성자 이름이 담겨 devtools로 유추 가능. 문서화된 트레이드오프.
- **동명이인 동시 합류**: KV 락이 없어 같은 이름 동시 합류 시 중복 참여자가 생길 수 있음(비동시엔 `name_taken`으로 차단). Durable Objects 전환 시 해소.

## 프론트 폴링 (`recoverse-frontend/src/composables/useSession.ts`)

2.5초 `setTimeout` 루프. in-flight 가드(겹친 요청 스킵), `document.hidden` 시 자동 폴링 일시정지(단 최초 로드는 숨김이어도 1회 fetch), 네트워크 에러 시 최대 10초 백오프, `ended`/unmount 시 중단.

## 검증

```bash
pnpm -F recoverse-worker test          # 3인 풀 시나리오·2인 스킵·강제 공개·검증 거부
pnpm -F recoverse-frontend typecheck
pnpm -F recoverse-frontend build
```
