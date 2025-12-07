# Contributing Guide

Thank you for contributing! Please follow the workflow below.

## Prerequisites

- Node.js 20+
- npm (use `npm install` / `npm ci` to share the lockfile)
- Chrome/Chromium-based browser

## Branch Strategy

- `main`: release branch
- `develop`: default development branch (use if needed)
- Feature: `feature/<short-description>`
- Bugfix: `fix/<issue-id>` or similar

## Development Flow

1. Create or reference an Issue, then create a branch.
2. Run `npm install`, then start watch mode with `npm run dev`.
3. After changes, run at minimum:
   - `npm run lint`
   - `npm run test`
   - `npm run test:e2e` as needed per feature
4. Run `npm run check` for the full CI-equivalent suite.
5. In Pull Requests, include:
   - Purpose / summary of changes / test results
   - Screenshots or logs when helpful

## Coding Guidelines

- TypeScript + ESLint (Flat Config) + Prettier
- Share modules via the `@/` alias to minimize relative imports.
- Add DOM helpers to `src/shared/dom.ts`.
- Always read/write settings through `src/shared/settings.ts`.

## Git Hooks

Husky + lint-staged are enabled.

- `pre-commit`: format changed TS/TSX files with ESLint + Prettier
- `pre-push`: `npm run test:ci` (Vitest --runInBand)

If hooks do not run, reinitialize with `npm run prepare`.

## Release

1. `npm run build`
2. `node scripts/prepare-release.mjs`
3. `git tag vX.Y.Z` → push to trigger the `Release` workflow
4. Upload the zip to the Chrome Web Store manually (automation planned)

## Communication

- Issues: include repro steps, expected behavior, and actual behavior.
- PRs: include the checklist and test results.
- For large changes (architecture, dependencies), discuss beforehand in a Discussion or Issue.

Happy hacking! 🎉
