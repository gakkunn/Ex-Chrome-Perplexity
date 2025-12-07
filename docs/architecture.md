# Architecture Overview

Perplexity Shortcut Effective Extension is an MV3-based Chrome extension. Everything under `src/` is written in TypeScript, and Vite + `@crxjs/vite-plugin` bundles multiple entries into `dist/`.

## Runtime Layout

| Layer                       | Role                                                                              | Main entry points                         |
| --------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------- |
| Background (Service Worker) | Receives external messages, opens settings, and orchestrates the extension        | `src/background/index.ts`                 |
| Content Scripts             | Hooks into the Perplexity.ai DOM to provide shortcuts, focus mode, and UI toggles | `src/content/index.ts` and its features   |
| Inject Scripts              | Runs in the `document` context to watch SPA routing and history events            | `src/inject/index.ts`                     |
| Popup / Options             | Preact-based UI for editing and persisting settings                               | `src/popup/App.tsx`, `src/popup/main.tsx` |
| Shared                      | Common logic such as storage, messaging, and feature flags                        | `src/shared`                              |

`manifest.config.ts` declares these entry paths, and `@crxjs/vite-plugin` generates the final `manifest.json` at build time.

## Messaging and Storage

- Settings (shortcuts / toggles) live in `chrome.storage.sync` under the `perplexityUnifiedSettings` key.
- `src/shared/settings.ts` centralizes load/save to keep content, popup, and background in sync.
- Lightweight messaging between Background and Content/Popup flows through `src/shared/messaging.ts`, sharing action constants.

## DOM Integration

The content script is composed of:

- `features/focus-mode.ts`: Adds CSS classes to the main Perplexity input panel and shows it only when focused.
- `features/shortcuts/`: `ShortcutsManager` coordinates Vim-like scrolling and chat shortcuts.
- `shared/dom.ts`: Collects DOM utilities (element lookup, forced clicks, scroll animations, etc.).

`inject/index.ts` hooks the History API, dispatches a custom `ppx-navigation` event, and uses it as a re-init trigger for the content script.

## Build / Test Pipeline

1. `npm run dev`: `@crxjs/vite-plugin` builds with HMR/watch.
2. `npm run build`: produces the production bundle in `dist/`.
3. `npm run test`: Vitest (jsdom) unit tests.
4. `npm run test:e2e`: Playwright (Chromium extension mode, `tests/e2e/fixtures/extension.ts`) smoke tests.
5. `node scripts/prepare-release.mjs`: zips `dist/` into `artifacts/`.

CI (`.github/workflows/ci.yml`) runs Lint → Unit Test → Build → Playwright in sequence, and `release.yml` uploads the zip automatically.
