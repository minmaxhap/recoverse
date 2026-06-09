# Recoverse Frontend

The Recoverse frontend is a localStorage-first retrospective capsule app built with Vue 3, TypeScript, and Vite.

## Features

- Create retrospective capsules by theme.
- Select Korean or English.
- Start from default question templates.
- Add, edit, and delete question cards.
- Write answers for each question.
- Track capsule progress.
- Search capsules.
- Compare repeated questions.
- Jump from rediscover cards to the original entry.
- Export/import capsule JSON.
- Convert legacy year-based backups into capsules.

## Run

```bash
pnpm install
pnpm run dev
```

## Build

```bash
pnpm run build
```

## Test

```bash
pnpm run test
```

## Storage

Capsule data is stored in browser localStorage.

```text
recoverse_capsule_v1
```

## Out Of MVP Scope

- Login
- Cloud storage
- Share links
- PDF export
