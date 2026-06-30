# Recoverse 아키텍처

## 현재 방향

Recoverse는 Vue 3 + TypeScript + Vite 기반의 localStorage 우선 MVP다. 이번 전환은 데이터 구조를 바꾸는 작업이 아니라, 기존 `Reflection` 중심 기능 위에 **Story Book x Time Capsule** 모바일 디자인을 입히는 작업이다.

## 현재 구현과 목표 화면 매핑

| 현재 모드/컴포넌트 | 현재 역할 | 새 목표 화면 |
| --- | --- | --- |
| `home-universe` / `HomeUniverseView` | 홈/빈 상태/샘플 회고 | Home, 회고 앨범 일부 |
| `reflection-new` / `NewReflectionPage` | 새 회고 시작 | 회고 시작 |
| `reflection-write` / `WriteReflectionPage` | 질문별 작성 | 질문 작성 |
| `reflection-detail` / `ReflectionDetailPage` | 회고 상세/공유 진입 | 회고 상세, 작성 완료 후 진입 |
| `review-again` / `ReviewAgainPage` | 다시 보기/비교 | 회고 앨범, 친구 비교, 연말 회고 |
| `shared-reflections` / `SharedReflectionPage` | URL 해시 공유 | 공유된 회고 상세 |
| `archive-settings` / `ArchiveSettingsTools` | 설정/백업/초기화 | 설정 |
| 신규 필요 | 없음 | Splash, 여행 회고, 디자인 시스템 |

## 데이터 단위

핵심 데이터 계약은 유지한다.

```ts
type Reflection = {
  id: string;
  title: string;
  type: ReflectionType;
  mode: ReflectionMode;
  period: ReflectionPeriod;
  templateId: string;
  questionSetMode: ReflectionQuestionSetMode;
  questionGroups: QuestionGroup[];
  answers: Answer[];
  representativeSentence?: string;
  visibility: "private" | "shared";
  shareSettings?: ShareSetting;
  isCompleted: boolean;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
};
```

자세한 타입 정의는 [`recoverse-frontend/src/types/reflection.ts`](recoverse-frontend/src/types/reflection.ts)에 있다.

## 저장소

브라우저 `localStorage`가 현재 단일 진실 공급원이다.

| 키 | 역할 |
| --- | --- |
| `recoverse_reflections_v1` | 모든 회고 데이터 |
| `recoverse_language` | 화면 언어 (`ko` / `en`) |
| `recoverse_theme` | 현재 구현 테마 (`universe` / `letter` / `journey`) |

새 디자인의 기본 테마 이름은 `book-capsule`을 목표로 한다. 기존 테마 키를 즉시 깨지 말고 마이그레이션 계층을 둔다.

## 모듈 구성

```text
recoverse-frontend/src/
├─ App.vue
├─ main.ts
├─ style.css
├─ views/
│  ├─ HomeUniverseView.vue
│  ├─ HomeView.vue
│  ├─ NewReflectionPage.vue
│  ├─ WriteReflectionPage.vue
│  ├─ ReflectionDetailPage.vue
│  ├─ ReviewAgainPage.vue
│  ├─ SharedReflectionPage.vue
│  └─ ArchiveSettingsView.vue
├─ components/
│  ├─ AppTopNav.vue
│  ├─ AppBottomNav.vue
│  ├─ NavIcon.vue
│  ├─ ArchiveSettingsTools.vue
│  └─ LanguageSelector.vue
├─ lib/
│  ├─ reflectionStore.ts
│  ├─ reflectionBackup.ts
│  ├─ reflectionShare.ts
│  ├─ reflectionSync.ts
│  ├─ sampleReflection.ts
│  ├─ questionTimeline.ts
│  └─ quickReflection.ts
└─ data/
   └─ reflectionTemplates.ts
```

## 디자인 토큰 적용 위치

우선순위:

1. `src/style.css`에 [DESIGN.md](./DESIGN.md)의 토큰을 CSS 변수로 선언한다.
2. 기존 우주 테마 변수와 충돌하는 변수는 `book-capsule` 기준 이름으로 교체한다.
3. 컴포넌트 내부 raw color와 임의 px는 토큰으로 치환한다.
4. 아이콘은 SVG 선형 아이콘으로 유지하고 이모지는 쓰지 않는다.

## 새 화면 구현 후보

기존 단일 `mode` 전환 방식을 유지한다면 다음 모드가 추가될 수 있다.

| 신규 모드 | 화면 |
| --- | --- |
| `splash` | Splash |
| `reflection-complete` | 작성 완료 |
| `album` | 회고 앨범 |
| `year-review` | 연말 회고 |
| `travel-review` | 여행 회고 |
| `friend-compare` | 친구 비교 |
| `design-system` | 디자인 시스템 |

라우터를 도입하지 않는 한 `App.vue`의 mode union과 `appNavigation` 헬퍼를 함께 갱신한다.

## 검증 명령

```powershell
cd recoverse-frontend
node tests\recoverseStore.test.mjs
node node_modules\vue-tsc\bin\vue-tsc.js -b
node node_modules\vite\bin\vite.js build
```

디자인 구현 후에는 실제 브라우저에서 375 / 768 / 1280px 시각 QA를 추가한다.

## 제외 범위

- 기존 `recoverse_reflections_v1` 스키마 변경
- OAuth/서버 저장의 즉시 구현
- PDF 내보내기
- 실시간 그룹 협업
- Three.js/WebGL 기반 3D 화면
