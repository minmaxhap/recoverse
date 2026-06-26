# Recoverse 아키텍처

## 현재 방향

Recoverse는 Vue 3 기반의 localStorage 우선 MVP다.

제품 방향은 "캡슐 관리 앱"에서 "개인/그룹 기억 우주 아카이브"로 재정의한다. 기존 데이터와 기능은 유지하되, IA와 화면 경계를 다음 구조로 이동한다.

```text
홈 = 내 기억 우주
개인 기록 단위 = 기억 행성
그룹 회고 = 은하
질문 카드 = 탐사 기록 / 별
답변 = 탐사 로그
공유 읽기 전용 = 관측 모드
공유 링크 = 관측 초대장
```

## 현재 구조의 문제

| 위치 | 문제 |
| --- | --- |
| `App.vue` | 화면 전환, legacy 연도 기능, 개인 행성 기능, import/export가 한 파일에 많이 남아 있다. |
| 상단 탭 | 기존 목록/관리 탭이 제품 메타포보다 먼저 노출된다. |
| 홈 | 우주 뷰가 있어도 목록/생성/관리 기능이 같은 화면에 섞여 있다. |
| 데이터 모델 | 개인 행성과 탐사 기록까지만 있고 그룹 은하와 관측 모드 모델이 없다. |
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
| 개인 행성 홈 | `HomeUniverseView` | 목록 중심을 제거하고 우주 지도 중심으로 유지 |
| `GalaxyMap` | `UniverseMap` | 개인 행성과 그룹 은하를 함께 담을 수 있게 확장 |
| `CapsulePlanetCard` | `PlanetNode` | 개인 행성 노드로 유지/이름 변경 후보 |
| 오늘의 발견 | `TodayDiscovery` | 홈의 감정적 진입점으로 유지 |
| 기억 행성 목록 | `ArchiveSettingsView` | 홈에서 제거하고 아카이브로 이동 |
| 기억 행성 검색/선택 | `ArchiveLibrary` | 아카이브 기본 진입 화면으로 사용 |
| 기억 행성 생성 폼 | `CreateObjectFlow` | 홈에 직접 노출하지 않고 `+` 진입점 뒤로 이동 |
| 빠른 입력 | `Organize` | 누락된 기록을 보완하는 정리 작업으로 이동 |
| 연도 보기 | `TimeTravel` | 시간 탐색 섹션으로 이동 |
| 질문 비교 | `TimeTravel` | 연도별 기록과 같은 시간 탐색 섹션으로 통합 |
| JSON 관리 | `Settings > ImportExportPanel` | 아카이브 첫 화면에서 숨기고 설정으로 이동 |
| 언어 선택 | `Settings > LanguageSettings` | 설정으로 이동 |

## 이름 변경 원칙

사용자에게 보이는 제품 언어는 `기억 행성 / 탐사 기록 / 탐사 로그`를 우선한다.

내부 타입과 저장 포맷의 `Capsule`, `CapsuleCard`, `recoverse_capsule_v1` 이름은 기존 백업과 localStorage 호환성을 위해 유지한다. 코드 이름 변경은 다음 후보를 기준으로 별도 단계에서 진행한다.

| 현재 이름 | 변경 후보 |
| --- | --- |
| `CapsulePlanetCard` | `PlanetNode` |
| `CapsuleHeroPlanet` | `PlanetHero` |
| `CapsuleSummary` | `PlanetSummary` |
| `CapsuleDetailEditor` | `ExplorationRecordEditor` |
| `CapsuleCreateForm` | `PlanetCreateForm` |
| `CapsuleQuestionCompare` | `ExplorationQuestionCompare` |

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
현재 MVP의 회고 공유는 `recoverse_shared_reflection_v1` 스냅샷을 URL 해시에 인코딩한다.
이 방식은 로그인과 서버 저장 없이 동작하지만, 긴 답변이 많아지면 URL 길이 제한이 생길 수 있다.
계정 저장 이후에는 같은 스냅샷 구조를 서버 저장 링크로 이전한다.

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

## 저장소와 데이터 모델 정리

현재 기준 모델은 `Reflection`이다. 사용자가 새로 작성하는 회고, 다시 보기, 공유 후보, 계정 저장 후보는 모두 `Reflection`을 기준으로 다룬다.

기존 모델은 삭제하지 않고 호환 계층으로 둔다.

| 계층 | 저장 키 | 역할 | 신규 기능 기준 여부 |
| --- | --- | --- | --- |
| 기준 모델 | `recoverse_reflections_v1` | 새 회고 작성, 다시 보기, 공유 후보, 백업/가져오기 | 예 |
| 호환 모델 | `recoverse_capsule_v1` | 이전 기억 행성/탐사 기록 데이터 유지 | 아니오 |
| 호환 모델 | `recoverse_v2_entries` | 이전 연도 질문/답변 JSON 유지와 마이그레이션 | 아니오 |
| 확장 모델 | `recoverse_galaxy_v1` | 그룹 회고 은하 초안 | 보류 |
| 파생 스냅샷 | `recoverse_shared_reflection_v1` | URL 해시에 담기는 회고 공유 읽기 전용 스냅샷 | 예 |
| 확장 모델 | `recoverse_observation_v1` | 개인/그룹 기억 관측 스냅샷 초안 | 보류 |

```text
localStorage["recoverse_reflections_v1"]
localStorage["recoverse_capsule_v1"]
localStorage["recoverse_v2_entries"]
```

UI 원칙:

- `기억 작성`, `홈`, `다시 보기`는 `Reflection`만 기준으로 동작한다.
- `capsule`과 `legacy entry`는 설정/호환 아카이브에서만 보조적으로 다룬다.
- 새 백업 파일의 기준 schema는 `recoverse_reflections_v1`이다.
- 새 회고 가져오기는 기존 회고를 덮어쓰지 않고, 같은 id의 최신 `updatedAt`만 병합한다.
- 기존 `capsule`/`legacy` 백업은 호환을 위해 유지하지만 신규 기능의 기준으로 확장하지 않는다.

원칙:

- MVP에서는 localStorage를 단일 진실 공급원으로 유지한다.
- 기존 연도 기반 데이터는 필요할 때 `Reflection`으로 변환한다.
- 새 저장 키를 추가하더라도 기존 `recoverse_capsule_v1`, `recoverse_v2_entries`를 깨지 않는다.
- import/export는 아카이브/설정에 남긴다.
- 계정 저장을 도입할 때도 서버의 1차 테이블은 `Reflection`이 된다.
- 계정 저장의 상세 계약은 `ACCOUNT_STORAGE_PLAN.ko.md`를 따른다.

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
- 홈의 기억 행성 목록/JSON/생성 폼을 아카이브/설정 또는 생성 플로우로 이동할 계획 확정
- `PlanetDetailView`, `ArchiveSettingsView` 경계 정의

제외:

- 실제 로그인
- 서버 저장
- 서버 저장 기반 공유 링크 발행
- PDF 내보내기
- 실시간 그룹 협업
- Three.js

## 구현 전 위험 요소

- `App.vue` 상태가 커서 한 번에 바꾸면 회귀 위험이 크다.
- 홈에서 목록을 제거하면 사용자가 기존 기억 행성을 찾는 보조 경로가 필요하다.
- 그룹 은하 모델을 성급히 구현하면 MVP 범위가 커진다.
- 관측 모드는 공유 기능처럼 보이지만 1차에서는 읽기 전용 화면 경계만 필요하다.
- 문구 변경이 테스트와 import/export 포맷을 흔들지 않도록 UI copy와 데이터 필드를 분리해야 한다.
