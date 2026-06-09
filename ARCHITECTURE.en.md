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

## Migration Strategy From localStorage to Cloud Storage

Login and cloud storage should be introduced when sharing requires them. When they are introduced, existing localStorage records must not be overwritten automatically.

Steps:

1. After login, check whether `recoverse_capsule_v1` exists in localStorage.
2. If local data exists, show an explicit "Import this device's records into my account" choice.
3. If the user agrees, upload local `CapsuleData` into the user's server-side capsule storage.
4. If the server already has capsules or cards with the same IDs, skip duplicates using the same rule as the current import flow.
5. After upload, do not delete local data immediately. Store only the last migration timestamp.
6. Delete local data only when the user explicitly chooses to clear this device's local records.

Candidate local metadata key:

```text
localStorage["recoverse_cloud_migration_v1"]
```

```ts
type CloudMigrationState = {
  userId: string;
  migratedAt: string;
  sourceStorageKey: "recoverse_capsule_v1";
  uploadedCapsules: number;
  uploadedCards: number;
  skippedCapsules: number;
  skippedCards: number;
};
```

Cautions:

- Do not automatically upload local data after an account switch.
- Keep the localStorage source data if migration fails.
- Until server storage is officially introduced, localStorage remains the single source of truth.
