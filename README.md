# JSG Games

JSG Games is a shared website for multiple games. The application uses Next.js,
TypeScript, and the App Router, with each game organized as a feature module
alongside shared site-level systems.

## Current state

This repository currently contains only the Phase 2 application foundation. No
games have been migrated or implemented yet.

## Prerequisites

- Node.js 20.9 or newer
- npm

## Install

Install the exact dependency versions recorded in `package-lock.json`:

```bash
npm ci
```

Use `npm install` instead when intentionally updating dependencies or the
lockfile.

## Local development

Start the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm test
npm run build
```

Use `npm run test:watch` for Vitest watch mode during development.

## Source structure

- `src/app/` contains App Router routes, the root layout, and global styles.
- `src/components/` contains reusable site-level UI, separate from gameplay.
- `src/games/` is the boundary for game feature modules and the site game
  registry. See `src/games/README.md` for ownership guidelines.
- `src/lib/` is reserved for shared non-UI application utilities and services
  as they become necessary.

## Future phases

Supabase database and authentication integration are deferred to a future
phase. Existing games, including SWGA, will also be migrated in later phases;
none of their code or gameplay systems are part of this foundation.
