# Perplexity Shortcut Effective Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

<!-- Add other badges here if desired (CI Status / Version, etc.) -->

## Overview

A Chrome extension that improves input and scrolling on Perplexity.ai.  
- Optimize keyboard usage with Vim-style scrolling and editable shortcuts  
- Safe Send prevents accidental Enter submissions  
- Highlight the input field with widescreen / focus display  
- Extra shortcuts for new chats, temporary chat switching, and more

Built on Manifest v3.

---

## Features

- Vim-like Scroll: Move up/down, half a page, or jump to top/bottom with keys like `j/k` (bindings are editable).
- Safe Send: Enter inserts a newline, and Cmd/Ctrl+Enter sends for a safer flow.
- Wide Screen / Focus: Widen the input panel and toggle focus on/off via shortcuts.
- Additional Shortcuts: Create chats, switch between normal and temporary chats, delete chats, bookmark, and attach images/files.
- Shortcut Editor: From the popup, enable/disable features and edit key mappings; the Perplexity shortcut dialog is also overlaid with custom keys.

---

## Screenshots

| Screen | 
| ----------------------------------------------- | 
| ![screenshot-1](./docs/images/local/screenshot-1.png) | 
| ![screenshot-2](./docs/images/local/screenshot-2.png) | 

---

## Installation

> ℹ️ **Not yet published to the Chrome Web Store.**  
> You can use it via "Local Installation (Developer Mode)" below.

### 1. Clone the repository

```bash
git clone https://github.com/gakkunn/Ex-Chrome-Perplexity.git
cd Ex-Chrome-Perplexity
```

### 2. Build (optional for development server)

During development you can run the watch build.

```bash
npm install
npm run dev
# Production build:
npm run build
```

### 3. Install to Chrome (Developer Mode)

1. Open Chrome  
2. Go to `chrome://extensions/`  
3. Toggle **"Developer mode"** on in the top right corner  
4. Click **"Load unpacked"**  
5. Select the `dist/` directory (when using `npm run dev`, selecting the project root also works)

---

## Usage

1. After installing, pin the extension to the toolbar.
2. In the popup you can configure:
   - Feature toggles: Vim-like Scroll / Wide Screen & Focus / Safe Send / Other Shortcuts
   - Shortcut editor: Click the input and press keys; a warning appears when bindings conflict.
3. On Perplexity:
   - `Cmd/Ctrl + Enter` sends; plain Enter inserts a newline (Safe Send).
   - Vim-style scroll: `j`/`k`, `Shift+j`/`Shift+k`, `Cmd/Ctrl + j`/`Cmd/Ctrl + k`
   - Toggle focus: default is `Shift + Space`
   - Other shortcuts: create new chat (`Cmd/Ctrl+Shift+O`), switch temporary chat (`Cmd/Ctrl+I`), delete, bookmark, attach images, etc.
4. Opening the Perplexity shortcut dialog overlays the extension’s custom keys.

---

## Development

### Prerequisites

- Node.js: >= 20
- npm

### Setup

```bash
git clone https://github.com/gakkunn/Ex-Chrome-Perplexity.git
cd Ex-Chrome-Perplexity

npm install
npm run dev   # Vite watch mode
# Or run a production build
npm run build
```

### Lint / Format

```bash
npm run lint
npm run format
```

(Automated tests are not set up yet; please verify behavior manually.)

---

## Project Structure

```text
Ex-Chrome-Perplexity/
  src/
    background/    # Service worker that opens the settings page
    content/       # Hooks into Perplexity DOM (scroll, focus, shortcuts)
    inject/        # Script to watch SPA navigation
    popup/         # Settings UI (Preact)
    shared/        # Storage, i18n, keyboard, messaging, feature flags
    manifest/      # Manifest v3 definition
  public/          # Static assets such as icons
  dist/            # Build artifacts
  config/          # ESLint / Prettier config
  docs/            # Architecture notes and docs
  package.json
  README.md
  LICENSE
```

---

## Contributing

Bug reports, feature suggestions, and pull requests are welcome 🎉  
See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

Quick steps:

1. Check Issues; create a new one if it doesn't exist  
2. Fork the repository  
3. Create a branch (e.g., `feat/xxx`, `fix/yyy`)  
4. Commit changes and push  
5. Create a Pull Request

---

## Privacy Policy

This extension does not collect personally identifiable information. Settings stay in your browser (Chrome sync storage) and are not sent to external servers. See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) for details.

---

## License

This project is released under the [MIT License](./LICENSE).

