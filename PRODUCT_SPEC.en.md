# Recoverse Product Spec

## Product Definition

Recoverse is a memory universe archive service where individuals and groups record retrospectives as planets and galaxies, revisit them over time, and later share them in read-only observation mode.

The core of Recoverse is not record management. It is the experience of exploring past versions of yourself and the memories a group created together. When the app opens, the user should feel like they have entered their own memory universe, not a dashboard or list manager.

## Core Experience

> Store memories by time or theme as planets and galaxies, then reopen them later to rediscover forgotten parts of yourself and your group.

## Core Emotions

- Warmth
- Nostalgia
- Self-understanding
- Mystery
- Quiet discovery
- Solitary but not lonely exploration

## Primary Users

- Individuals who want to organize year-end retrospectives beautifully.
- People who want to record trips, projects, relationships, career moments, or life stages.
- People who want to revisit old answers and better understand themselves.
- Groups who want to reflect together with shared prompts.
- Users who may later share selected retrospectives as read-only archives.

## Core Metaphor

| Concept | Product Language |
| --- | --- |
| Home | My Memory Universe |
| Personal capsule | Memory planet |
| Group retrospective | Galaxy |
| Question card | Exploration record / star |
| Answer | Exploration log |
| Read-only sharing | Observation mode |
| Share link | Observation invitation |

## Core Structure

```text
Personal Planet
└─ Exploration Record / Star
   └─ Exploration Log

Group Galaxy
├─ Shared Exploration Records
├─ Member Planets
└─ Member Exploration Logs
```

The current MVP data model can continue to use `Capsule -> CapsuleCard -> Answer`, while the product language and screen structure gradually move toward `Planet -> Exploration Record -> Exploration Log`.

## Core Screens

### 1. Home - Universe View

Role:

- Make the user feel like they entered their memory universe immediately.
- Show personal planets and group galaxies as explorable objects.
- Surface Today's Discovery so old memories can reappear.
- Make the `+` button an entry point for creating a personal planet or group galaxy.

Excluded from Home:

- Year view
- Quick entry
- Question comparison
- JSON import/export
- Capsule-list-first UI
- Top-tab-first navigation

### 2. Capsule Detail - Planet View

Role:

- Let the user explore one personal planet.
- Provide exploration records/stars and exploration log writing.
- Host future extensions such as time-travel comparison and observation invitations.

### 3. Galaxy - Group Retrospective

Role:

- Represent a shared retrospective created by multiple people as a galaxy.
- Represent members as satellite planets.
- Let users explore shared prompts and member-specific logs.

For the first MVP refactor, this prepares IA, data model drafts, and entry points only. It does not require login, servers, or real-time collaboration.

### 4. Observation Mode - Read-Only Sharing

Role:

- Let shared viewers read a planet or galaxy without editing.
- Exclude comments, likes, and social feeds.
- Prefer read-only snapshots captured at publish time over direct exposure of source data.

### 5. Archive / Settings

Role:

- Hold supporting tools that should not dominate Home.
- Move year view, quick entry, question comparison, JSON management, language settings, and data reset here.

## MVP Scope

Included:

- localStorage-based personal planet records
- Home centered on the universe view
- Personal planet detail
- Today's Discovery
- Exploration record/log writing
- JSON import/export kept under Archive / Settings
- Korean/English language selection

Excluded:

- Login
- Cloud storage
- Real-time group collaboration
- Actual share-link publishing
- PDF export
- Comments, likes, or social feeds
- Three.js-based 3D

## First Refactor Goal

The first refactor should correct the UX structure without expanding the feature surface too much.

- Prepare to remove list/management elements from Home.
- Rename screens around the new IA.
- Do not delete existing features; create their destination under Archive / Settings.
- Create screen boundaries that can later support personal planets, group galaxies, and observation mode.

## Success Criteria

- Home feels like a universe space, not a list or management tool.
- Personal capsules can evolve into planets and group retrospectives can evolve into galaxies.
- Supporting tools no longer interrupt the exploration experience on Home.
- Observation mode is clearly represented in the IA for future sharing.
- Existing localStorage data and import/export behavior remain intact.
