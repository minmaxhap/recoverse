# Recoverse Architecture

## Current Direction

Recoverse is a localStorage-first Vue 3 MVP.

The product direction is moving from a capsule management app to a personal/group memory universe archive. Existing data and behavior should remain intact, while the IA and screen boundaries move toward the structure below.

```text
Home = My Memory Universe
Personal capsule = Memory planet
Group retrospective = Galaxy
Question card = Exploration record / star
Answer = Exploration log
Read-only sharing = Observation mode
Share link = Observation invitation
```

## Current Structural Problems

| Area | Problem |
| --- | --- |
| `App.vue` | Screen switching, legacy year flows, capsule flows, and import/export still live together. |
| Top tabs | `Capsules`, `Quick Entry`, `Year View`, and `Question Compare` appear before the product metaphor. |
| Home | The universe view exists, but list/create/management tools are mixed into the same screen. |
| Data model | It only covers personal capsules and cards; group galaxies and observation mode do not exist yet. |
| Supporting tools | JSON management, question comparison, and year view interrupt the home experience. |

## Target IA

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
   ├─ YearArchive
   ├─ QuickEntryArchive
   ├─ QuestionCompareArchive
   ├─ ImportExportPanel
   ├─ LanguageSettings
   └─ DangerZone
```

## Existing Feature Mapping

| Existing Feature | New Location | Treatment |
| --- | --- | --- |
| Capsule home | `HomeUniverseView` | Keep it, but remove list-first emphasis. |
| `GalaxyMap` | `UniverseMap` | Extend it to support personal planets and group galaxies. |
| `CapsulePlanetCard` | `PlanetNode` | Keep as personal planet node; rename later if useful. |
| Today's Discovery | `TodayDiscovery` | Keep as the emotional entry point on Home. |
| Capsule list | `ArchiveSettingsView` | Move out of Home into Archive. |
| Capsule create form | `CreateObjectFlow` | Put behind the `+` creation entry point. |
| Quick entry | `ArchiveSettingsView` or create flow | Remove from top-level tabs. |
| Year view | `YearArchive` | Move to Archive as a timeline filter. |
| Question comparison | `TimeTravelCompare` / `QuestionCompareArchive` | Move to detail or Archive. |
| JSON management | `ImportExportPanel` | Move to Settings / Archive. |
| Language selector | `LanguageSettings` | Move to Settings. |

## Current Core Entities

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

## Next Entity Drafts

### Galaxy

A galaxy contains a group retrospective. In the first MVP refactor, prepare only the local model draft and screen entry points; do not add servers or real-time collaboration.

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

Observation mode should show read-only snapshots captured at publish time instead of directly exposing source data.

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

## Storage

Current storage key:

```text
localStorage["recoverse_capsule_v1"]
```

Candidate future keys:

```text
localStorage["recoverse_galaxy_v1"]
localStorage["recoverse_observation_v1"]
localStorage["recoverse_ui_v1"]
```

Principles:

- localStorage remains the single source of truth during the MVP.
- Legacy year-based data remains convertible into year retrospective planets.
- New storage keys must not break `recoverse_capsule_v1`.
- Import/export stays under Archive / Settings.

## Recommended File Structure

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

## First Refactor Scope

Goal:

- Prepare to remove list/management elements from Home.
- Rename screens around the new IA.
- Do not delete existing features; create their destination under Archive / Settings.

Included:

- Align `mode` naming with the new screen concepts.
- Redefine `HomePage` toward `HomeUniverseView`.
- Decide where capsule list, JSON tools, and create form move before removing them from Home.
- Define `PlanetDetailView` and `ArchiveSettingsView` boundaries.

Excluded:

- Login
- Server storage
- Actual share-link publishing
- PDF export
- Real-time group collaboration
- Three.js

## Implementation Risks

- `App.vue` has too much state, so changing it all at once has high regression risk.
- Removing lists from Home requires a reliable alternate path for finding existing capsules.
- Implementing galaxies too early can expand the MVP too much.
- Observation mode may look like sharing, but the first pass only needs a read-only screen boundary.
- Copy changes must not mutate import/export schemas; UI copy and data fields should stay separated.
