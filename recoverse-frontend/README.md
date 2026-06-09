# Recoverse Frontend

Recoverse is a local-first memory capsule app built with Vue 3, TypeScript, and Vite.

The current MVP centers on theme-based retrospective capsules. A yearly retrospective is the default example, but users can also create capsules such as:

- High school retrospective
- My twenties
- First company
- Travel memories
- Project retrospective
- Before resignation

The core experience is simple: store memories under a time or theme, reopen them later, and rediscover a forgotten version of yourself.

## Features

- Create retrospective capsules by theme.
- Start capsules from default question templates.
- Add, edit, and delete question cards.
- Store multiple answers per question.
- Track capsule progress.
- Search and filter capsules.
- Compare repeated questions across capsules.
- Rediscover an answered card and jump back to it.
- Export all capsules as JSON.
- Import downloaded capsule JSON backups.
- Import legacy year-based backups by converting years into retrospective capsules.

This MVP does not include login, cloud sync, sharing, or PDF export.

## Data Storage

The MVP stores data in browser `localStorage`.

Current capsule storage key:

```text
recoverse_capsule_v1
```

Legacy year-based entries are still supported and can be converted into capsule data.

## Backup Format

Capsule JSON backups use:

```json
{
  "schema": "recoverse_capsule_v1",
  "exportedAt": "2026-01-01T00:00:00.000Z",
  "capsules": [],
  "cards": []
}
```

## Project Setup

Install dependencies:

```bash
pnpm install
```

Run the dev server:

```bash
pnpm run dev
```

Build for production:

```bash
pnpm run build
```

Run focused data tests:

```bash
pnpm run test
```

## Important Files

```text
src/App.vue
src/components/CapsuleProgress.vue
src/components/CapsuleQuestionCompare.vue
src/lib/recoverseStore.ts
tests/recoverseStore.test.mjs
```

## Notes

- Export JSON before clearing browser data.
- PDF and Markdown exports are intentionally outside this MVP pass.
- Login, sharing, and cloud storage are planned as later service-level features.
