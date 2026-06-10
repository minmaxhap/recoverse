# Recoverse 아키텍처

## 현재 방향

Recoverse는 Vue 3 기반의 localStorage 우선 MVP다.

제품 방향은 "캡슐 관리 앱"에서 "개인/그룹 기억 우주 아카이브"로 재정의한다. 기존 데이터와 기능은 유지하되, IA와 화면 경계를 다음 구조로 이동한다.

```text
홈 = 내 기억 우주
개인 캡슐 = 기억 행성
그룹 회고 = 은하
질문 카드 = 탐사 기록 / 별
답변 = 탐사 로그
공유 읽기 전용 = 관측 모드
공유 링크 = 관측 초대장
```

## 현재 구조의 문제

| 위치 | 문제 |
| --- | --- |
| `App.vue` | 화면 전환, legacy 연도 기능, 캡슐 기능, import/export가 한 파일에 많이 남아 있다. |
| 상단 탭 | `캡슐`, `빠른 입력`, `연도 보기`, `질문 비교`가 제품 메타포보다 먼저 노출된다. |
| 홈 | 우주 뷰가 있어도 캡슐 목록/생성/관리 기능이 같은 화면에 섞여 있다. |
| 데이터 모델 | 개인 캡슐과 카드까지만 있고 그룹 은하와 관측 모드 모델이 없다. |
| 보조 기능 | JSON 관리, 질문 비교, 연도 보기가 홈 경험을 침범한다. |

## 목표 IA

```text
Recoverse
├─ HomeUniverseView
│  ├─ TodayDiscovery
│  ├─ UniverseMap
│  │  ├─ PlanetNode
│  │  ├─ GalaxyNode
│  │  └─ CreateObjectButton
│  └─ ArchiveEntry
│
├─ PlanetDetailView
│  ├─ PlanetHero
│  ├─ ExplorationRecordList
│  ├─ ExplorationLogEditor
│  ├─ TimeTravelCompare
│  └─ ObservationInviteEntry
│
├─ GalaxyDetailView
│  ├─ GalaxyHero
│  ├─ MemberPlanetList
│  ├─ SharedPromptList
│  └─ MemberLogMatrix
│
├─ ObservationModeView
│  ├─ ReadOnlyHeader
│  ├─ SharedPlanetSnapshot
│  └─ SharedGalaxySnapshot
│
└─ ArchiveSettingsView
   ├─ ArchiveLibrary
   │  └─ 기억 행성 검색/열기
   ├─ TimeTravel
   │  ├─ 연도별 기록
   │  └─ 반복 질문 비교
   ├─ Organize
   │  ├─ 빠른 입력
   │  ├─ 추천 질문
   │  └─ 이전 연도 질문 복제
   └─ Settings
      ├─ LanguageSettings
      ├─ ImportExportPanel
      └─ DangerZone
```

## 기존 기능 매핑

| 기존 기능 | 새 위치 | 처리 |
| --- | --- | --- |
| 캡슐 홈 | `HomeUniverseView` | 목록 중심을 제거하고 우주 지도 중심으로 유지 |
| `GalaxyMap` | `UniverseMap` | 개인 행성과 그룹 은하를 함께 담을 수 있게 확장 |
| `CapsulePlanetCard` | `PlanetNode` | 개인 행성 노드로 유지/이름 변경 후보 |
| 오늘의 발견 | `TodayDiscovery` | 홈의 감정적 진입점으로 유지 |
| 캡슐 목록 | `ArchiveSettingsView` | 홈에서 제거하고 아카이브로 이동 |
| 캡슐 검색/선택 | `ArchiveLibrary` | 아카이브 기본 진입 화면으로 사용 |
| 캡슐 생성 폼 | `CreateObjectFlow` | 홈에 직접 노출하지 않고 `+` 진입점 뒤로 이동 |
| 빠른 입력 | `Organize` | 누락된 기록을 보완하는 정리 작업으로 이동 |
| 연도 보기 | `TimeTravel` | 시간 탐색 섹션으로 이동 |
| 질문 비교 | `TimeTravel` | 연도별 기록과 같은 시간 탐색 섹션으로 통합 |
| JSON 관리 | `Settings > ImportExportPanel` | 아카이브 첫 화면에서 숨기고 설정으로 이동 |
| 언어 선택 | `Settings > LanguageSettings` | 설정으로 이동 |

## 현재 핵심 엔티티

```ts
type Capsule = {
  id: string;
  title: string;
  description?: string;
  type: CapsuleType;
  createdAt: string;
  updatedAt: string;
};

type CapsuleCard = {
  id: string;
  capsuleId: string;
  questionText: string;
  answers: string[];
  source: "default" | "user" | "imported";
  order: number;
  createdAt: string;
  updatedAt: string;
};
```

## 다음 엔티티 초안

### Galaxy

그룹 회고를 담는 은하 단위다. MVP 1차에서는 서버 없이 localStorage 모델 초안과 화면 진입 위치만 준비한다.

```ts
type Galaxy = {
  id: string;
  title: string;
  description?: string;
  theme: "year" | "trip" | "project" | "relationship" | "career" | "custom";
  createdAt: string;
  updatedAt: string;
};

type GalaxyMember = {
  id: string;
  galaxyId: string;
  displayName: string;
  colorTone?: string;
  joinedAt: string;
};

type GalaxyPrompt = {
  id: string;
  galaxyId: string;
  questionText: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type GalaxyLog = {
  id: string;
  galaxyId: string;
  promptId: string;
  memberId: string;
  answers: string[];
  updatedAt: string;
};
```

### Observation Snapshot

관측 모드는 원본 데이터를 직접 노출하지 않고 공유 시점의 읽기 전용 스냅샷을 사용한다.

```ts
type ObservationSnapshot = {
  id: string;
  sourceType: "planet" | "galaxy";
  sourceId: string;
  title: string;
  description?: string;
  accessMode: "read_only";
  createdAt: string;
  publishedAt?: string;
  records: ObservationRecordSnapshot[];
};

type ObservationRecordSnapshot = {
  id: string;
  title: string;
  logs: string[];
  order: number;
};
```

## 저장소

현재 저장 키:

```text
localStorage["recoverse_capsule_v1"]
```

추가 후보:

```text
localStorage["recoverse_galaxy_v1"]
localStorage["recoverse_observation_v1"]
localStorage["recoverse_ui_v1"]
```

원칙:

- MVP에서는 localStorage를 단일 진실 공급원으로 유지한다.
- 기존 연도 기반 데이터는 계속 연도 회고 행성으로 변환한다.
- 새 저장 키를 추가하더라도 기존 `recoverse_capsule_v1`을 깨지 않는다.
- import/export는 아카이브/설정에 남긴다.

## 권장 파일 구조

```text
src/
  views/
    HomeUniverseView.vue
    PlanetDetailView.vue
    GalaxyDetailView.vue
    ObservationModeView.vue
    ArchiveSettingsView.vue
  components/
    universe/
      UniverseMap.vue
      PlanetNode.vue
      GalaxyNode.vue
      CreateObjectButton.vue
      TodayDiscovery.vue
    planet/
      PlanetHero.vue
      ExplorationRecordList.vue
      ExplorationLogEditor.vue
    galaxy/
      GalaxyHero.vue
      MemberPlanetList.vue
      SharedPromptList.vue
    observation/
      ReadOnlyHeader.vue
      ObservationRecordCard.vue
    archive/
      ImportExportPanel.vue
      YearArchive.vue
      QuestionCompareArchive.vue
  lib/
    recoverseStore.ts
    capsuleImportExport.ts
    capsuleTemplates.ts
    universeHomeData.ts
    galaxyStore.ts
    observationSnapshots.ts
  types/
    recoverse.ts
```

## 1차 리팩토링 범위

목표:

- 홈에서 목록/관리 요소를 걷어낼 준비를 한다.
- 화면 이름을 새 IA 기준으로 정리한다.
- 기존 기능은 삭제하지 않고 아카이브/설정으로 이동할 위치만 만든다.

포함:

- `mode` 이름을 새 화면 개념에 맞게 정리할 설계 반영
- `HomePage`를 `HomeUniverseView` 방향으로 재정의
- 홈의 캡슐 목록/JSON/생성 폼을 아카이브/설정 또는 생성 플로우로 이동할 계획 확정
- `PlanetDetailView`, `ArchiveSettingsView` 경계 정의

제외:

- 실제 로그인
- 서버 저장
- 실제 공유 링크 발행
- PDF 내보내기
- 실시간 그룹 협업
- Three.js

## 구현 전 위험 요소

- `App.vue` 상태가 커서 한 번에 바꾸면 회귀 위험이 크다.
- 홈에서 목록을 제거하면 사용자가 기존 캡슐을 찾는 보조 경로가 필요하다.
- 그룹 은하 모델을 성급히 구현하면 MVP 범위가 커진다.
- 관측 모드는 공유 기능처럼 보이지만 1차에서는 읽기 전용 화면 경계만 필요하다.
- 문구 변경이 테스트와 import/export 포맷을 흔들지 않도록 UI copy와 데이터 필드를 분리해야 한다.
