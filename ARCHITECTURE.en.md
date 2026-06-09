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
