# Recoverse Architecture

## Current Direction

Recoverse is a localStorage-first Vue 3 MVP.

The product structure is capsule-first.

```text
Capsule -> Question Card -> Answer
```

## Core Entities

### Capsule

The top-level container for a memory theme.

### CapsuleCard

A question card with a list of text answers.

### CapsuleBackup

The canonical JSON backup/import format.

## Storage

Current storage key:

```text
localStorage["recoverse_capsule_v1"]
```

Legacy year-based data should remain convertible into year retrospective capsules.

## Current Important Files

```text
recoverse-frontend/src/App.vue
recoverse-frontend/src/components/CapsuleProgress.vue
recoverse-frontend/src/components/CapsuleQuestionCompare.vue
recoverse-frontend/src/lib/recoverseStore.ts
recoverse-frontend/tests/recoverseStore.test.mjs
```

## Future Structure

```text
src/
  views/
    HomeView.vue
    CapsuleDetailView.vue
  components/
    HomeRediscoverCard.vue
    CapsuleCard.vue
    AnswerEditor.vue
    ImportExportPanel.vue
  lib/
    recoverseStore.ts
    capsuleImportExport.ts
    capsuleTemplates.ts
  types/
    recoverse.ts
```

## Sharing Direction

Sharing is outside the MVP. Later, add read-only snapshots and password-protected links as separate structures.

## Read-Only Sharing Data Model Draft

Shared data should not expose the original `CapsuleData` directly. It should be a snapshot captured at publish time.

```ts
type SharedCapsuleSnapshot = {
  id: string;
  sourceCapsuleId: string;
  title: string;
  description?: string;
  visibility: "private" | "link";
  accessMode: "read_only";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  cards: SharedCapsuleCardSnapshot[];
};

type SharedCapsuleCardSnapshot = {
  id: string;
  sourceCardId: string;
  questionText: string;
  answers: string[];
  order: number;
};
```

Principles:

- Shared snapshots are read-only.
- Editing the original capsule should not automatically mutate an existing shared version.
- Shared snapshots are refreshed only when the user explicitly republishes them.
- When server storage is introduced later, `sourceCapsuleId` and `sourceCardId` link the snapshot back to the original data.

## Password Link Sharing Field Candidates

Password-protected link sharing should be implemented only after server storage exists. It is not part of the MVP.

```ts
type ShareLink = {
  id: string;
  snapshotId: string;
  slug: string;
  visibility: "password_link";
  passwordHash?: string;
  passwordSalt?: string;
  expiresAt?: string;
  revokedAt?: string;
  createdAt: string;
  lastOpenedAt?: string;
  openCount: number;
};
```

Field principles:

- Never store the raw password.
- `slug` is the URL-visible identifier and must not include the source capsule ID.
- `expiresAt` and `revokedAt` allow a link to be closed.
- `openCount` and `lastOpenedAt` are only for future sharing status UI.
- Initial sharing permissions remain `read_only` only.
