# Recoverse Frontend

Recoverse의 Vue 3 + TypeScript + Vite 프론트엔드. 에디토리얼 잡지 조판(크림 종이 `#FAF7F0` + 다홍 `#D8451F` + Gowun Batang)으로 화면 11종을 구현한다.

## 실행

루트에서 `pnpm dev`로 worker와 함께 띄우는 것을 권장한다(README 참고). 프론트만 단독 실행:

```bash
pnpm --filter recoverse-frontend dev
```

`/api` 요청은 `vite.config.ts`의 프록시로 `127.0.0.1:8787`(worker)로 전달된다. worker가 없으면 오프라인 화면(표지·혼자 쓰기·복간·열람·다시 발견)만 동작한다.

## 검증

```bash
pnpm run typecheck   # vue-tsc
pnpm run build
```

## 구조

```text
src/
  App.vue                 # 모드 기반 화면 전환 (vue-router 없음)
  main.ts, style.css      # 폰트 로드 + 잡지 디자인 토큰
  components/             # ParticipantDot, Headline, AnswerQuote, SpreadLayout,
                          # KindChips, RoundEditor, AppShell, BackHeader, PastQuestions
  views/
    CoverView.vue         # 표지 (masthead + 입구 + 책장)
    SoloWriteView.vue     # 혼자 쓰기
    PaperImportView.vue   # 복간
    IssueDetailView.vue   # 지난 호 열람 (스프레드)
    RediscoverView.vue / RediscoverDetailView.vue   # 다시 발견 목록·타임라인
    live/                 # 라이브 세션: LiveEntry / LiveSession(오케스트레이터)
                          # + Lobby/Question/Answer/Guess/RevealSpread/Ended 단계
  composables/
    useSession.ts         # 2.5초 폴링 세션 상태
    useShelf.ts           # localStorage['recoverse_issues_v1'] 책장
    useIdentity.ts        # 탭별 세션 신원 (sessionStorage)
  lib/
    api.ts                # worker API 래퍼
    guessing.ts           # 결정적 셔플 + 점수/독심술사
    rediscover.ts         # 질문 그룹핑 (정규화 매칭)
    issueBuilder.ts       # 세션/에디터 → Issue
    palette.ts            # 참여자 색 팔레트
    samples.ts            # 다시 발견 체험용 예시 호
    safeLocalStorage.ts   # localStorage 실패 안전 래퍼
```

## 저장

- 세션 상태는 worker(KV)에, **개인 책장만 localStorage**(`recoverse_issues_v1`)에 둔다.
- 데이터 모델·해시·검증은 `@recoverse/shared`에서 가져와 백엔드와 공유한다.
