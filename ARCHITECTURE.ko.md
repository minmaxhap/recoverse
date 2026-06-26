# Recoverse 아키텍처

## 현재 방향

Recoverse는 Vue 3 + TypeScript + Vite 기반의 localStorage 우선 MVP다.
사용자에게 보이는 모든 흐름은 `Reflection`을 단일 데이터 단위로 다룬다.

## 화면과 모드

`App.vue`는 단일 `mode` 상태로 다음 화면을 전환한다.

| 모드 | 화면 | 진입 경로 |
| --- | --- | --- |
| `home-universe` | `HomeUniverseView` | 기본 진입, 하단 `홈` 탭 |
| `reflection-new` | `NewReflectionPage` | 하단 `기억 작성` 탭 |
| `reflection-write` | `WriteReflectionPage` | 새 회고 시작 또는 이어쓰기 |
| `reflection-detail` | `ReflectionDetailPage` | 홈에서 회고 열기 |
| `review-again` | `ReviewAgainPage` | 하단 `다시 보기` 탭 |
| `shared-reflections` | `SharedReflectionPage` | 공유 URL 해시 또는 공유 액션 |
| `archive-settings` | `ArchiveSettingsTools` 단일 패널 | 상단 프로필 메뉴 |

상단 네비게이션은 `AppTopNav`(브랜드 + 프로필 메뉴), 하단은 `AppBottomNav`(홈/작성/다시 보기 3탭)다.
이전 단계에서 있던 `planet-detail`, `galaxy-detail`, `observation`, `archive-library`,
`archive-time`, `archive-organize` 모드는 모두 제거했다.

## 데이터 단위

```ts
type Reflection = {
  id: string;
  title: string;
  type: ReflectionType;          // year | half_year | travel | life_chapter | project | relationship | custom
  mode: ReflectionMode;          // solo | with_friends
  period: ReflectionPeriod;      // label, year?, startDate?, endDate?
  templateId: string;
  questionSetMode: ReflectionQuestionSetMode; // light | deep | share | compare
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

자세한 타입 정의는 [`src/types/reflection.ts`](recoverse-frontend/src/types/reflection.ts)에 있다.

## 저장소

브라우저 `localStorage`가 단일 진실 공급원이다.

| 키 | 역할 |
| --- | --- |
| `recoverse_reflections_v1` | 모든 회고 데이터 (작성, 다시 보기, 공유, 백업 기준) |
| `recoverse_language` | 화면 언어 (`ko` / `en`) |
| `recoverse_theme` | 테마 (`universe` / `letter` / `journey`) |

공유 스냅샷은 저장하지 않고 URL 해시 (`#share=...`)에 base64url로 인코딩한다 (`recoverse_shared_reflection_v1` 스키마).

## 모듈 구성

```text
src/
├─ App.vue                          # 모드 라우팅, 회고 store 연동, 백업/공유 액션
├─ main.ts
├─ style.css
├─ views/
│  ├─ HomeUniverseView.vue          # 첫 진입 장면, 오늘 다시 떠오른 기억
│  ├─ HomeView.vue                  # 홈 컨테이너 슬롯
│  ├─ NewReflectionPage.vue         # 3단계 새 회고 wizard
│  ├─ WriteReflectionPage.vue       # 질문 카드 단위 작성
│  ├─ ReflectionDetailPage.vue      # 회고 감상/공유
│  ├─ ReviewAgainPage.vue           # 다시 보기 (같은 질문/연도/주제/랜덤)
│  └─ SharedReflectionPage.vue      # 읽기 전용 공유 화면
├─ components/
│  ├─ AppTopNav.vue
│  ├─ AppBottomNav.vue
│  ├─ NavIcon.vue
│  ├─ ArchiveSettingsTools.vue      # 언어/테마/회고 백업/초기화
│  └─ LanguageSelector.vue
├─ lib/
│  ├─ reflectionStore.ts            # CRUD + normalize + draft 생성
│  ├─ reflectionBackup.ts           # JSON 백업 export / 병합 import
│  ├─ reflectionShare.ts            # URL 해시 인코딩/디코딩
│  ├─ reflectionSync.ts             # 계정 저장 페이로드 (서버 연결 전 placeholder)
│  ├─ sampleReflection.ts           # 빈 상태에서 보여줄 샘플 회고
│  ├─ questionTimeline.ts           # 같은 질문 타임라인 빌드
│  └─ downloadBlob.ts
├─ types/
│  ├─ reflection.ts                 # Reflection / Question / Answer 등 핵심 타입
│  └─ recoverse.ts                  # AppLanguage 하나
└─ data/
   └─ reflectionTemplates.ts        # 4개 MVP 템플릿 + 질문 세트 모드 빌더
```

테스트는 `tests/recoverseStore.test.mjs` 한 파일이며 reflection store/backup/sync/share/timeline/sample 10개 시나리오를 다룬다.

## 검증 명령

```powershell
cd recoverse-frontend
node tests\recoverseStore.test.mjs
node node_modules\vue-tsc\bin\vue-tsc.js -b
node node_modules\vite\bin\vite.js build
```

## 다음 단계 후보

- 계정 저장(Google/Kakao). 자세한 계약은 [`ACCOUNT_STORAGE_PLAN.ko.md`](./ACCOUNT_STORAGE_PLAN.ko.md).
- 서버 저장 기반 공유 링크 발행 (현재는 URL 해시만).
- PDF 내보내기, 이미지 첨부, 실시간 그룹 협업은 보류.

## 제외 범위

- 로그인과 OAuth (UI placeholder만 존재)
- 클라우드 저장
- 실제 공유 링크 서버
- PDF 내보내기
- 실시간 그룹 협업
- Three.js 기반 3D 우주 화면
