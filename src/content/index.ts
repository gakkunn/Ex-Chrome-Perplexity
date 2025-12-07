import { FocusModeManager } from '@/content/features/focus-mode';
import { ShortcutsManager } from '@/content/features/shortcuts';
import { applyDocumentFeatureFlags } from '@/shared/feature-flags';
import {
  DEFAULT_FEATURE_TOGGLES,
  DEFAULT_SHORTCUTS,
  type ExtensionSettings,
  type FeatureToggles,
  STORAGE_KEY,
  loadSettings,
} from '@/shared/settings';
import './styles/index.css';

let shortcutsManager: ShortcutsManager | null = null;
let focusModeManager: FocusModeManager | null = null;
let currentSettings: ExtensionSettings | null = null;
let bootstrapPromise: Promise<void> | null = null;
let lastBootstrapAt = 0;
let pendingBootstrap = false;
let scheduledBootstrapTimer: number | null = null;

const BOOTSTRAP_COOLDOWN_MS = 300;

const DEFAULT_SETTINGS: ExtensionSettings = {
  featureToggles: { ...DEFAULT_FEATURE_TOGGLES },
  shortcuts: { ...DEFAULT_SHORTCUTS },
};

function applySettings(settings: ExtensionSettings): void {
  currentSettings = settings;
  applyDocumentFlags(settings.featureToggles);

  if (focusModeManager) {
    focusModeManager.updateToggles(settings.featureToggles);
  } else {
    focusModeManager = new FocusModeManager(settings.featureToggles);
  }

  if (shortcutsManager) {
    shortcutsManager.updateSettings(settings);
  } else {
    shortcutsManager = new ShortcutsManager(settings, () => focusModeManager?.toggleFocus());
  }
}

function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

function applyDocumentFlags(toggles: FeatureToggles) {
  applyDocumentFeatureFlags(toggles);
}

function waitForDocumentReady(): Promise<void> {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
  });
}

function getInjectResourcePath(): string {
  try {
    const manifest = chrome.runtime.getManifest() as chrome.runtime.ManifestV3;
    const resources = manifest.web_accessible_resources ?? [];
    for (const entry of resources) {
      const resource = entry.resources?.find((item) => item.includes('inject'));
      if (resource) {
        return resource;
      }
    }
  } catch {
    // ignore manifest resolution errors
  }
  return 'src/inject/index.js'; // Fallback to built JS file
}

async function bootstrap(): Promise<void> {
  try {
    if (!isExtensionContextValid()) {
      applySettings({ ...DEFAULT_SETTINGS });
      return;
    }

    await waitForDocumentReady();
    const loaded = await loadSettings();
    const mergedSettings = loaded
      ? {
          featureToggles: { ...DEFAULT_FEATURE_TOGGLES, ...loaded.featureToggles },
          shortcuts: { ...DEFAULT_SHORTCUTS, ...loaded.shortcuts },
        }
      : { ...DEFAULT_SETTINGS };

    applySettings(mergedSettings);
  } catch {
    applySettings({ ...DEFAULT_SETTINGS });
  }
}

function ensureBootstrap(): Promise<void> {
  const now = Date.now();

  if (bootstrapPromise) {
    pendingBootstrap = true;
    return bootstrapPromise;
  }

  const timeSinceLast = now - lastBootstrapAt;
  if (timeSinceLast < BOOTSTRAP_COOLDOWN_MS) {
    pendingBootstrap = true;
    if (scheduledBootstrapTimer === null) {
      const waitMs = BOOTSTRAP_COOLDOWN_MS - timeSinceLast;
      scheduledBootstrapTimer = window.setTimeout(() => {
        scheduledBootstrapTimer = null;
        void ensureBootstrap();
      }, waitMs);
    }
    return Promise.resolve();
  }

  pendingBootstrap = false;
  bootstrapPromise = bootstrap().finally(() => {
    lastBootstrapAt = Date.now();
    bootstrapPromise = null;
    if (pendingBootstrap) {
      pendingBootstrap = false;
      void ensureBootstrap();
    }
  });
  return bootstrapPromise;
}

applyDocumentFlags(DEFAULT_FEATURE_TOGGLES);
void ensureBootstrap();

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      void ensureBootstrap();
    },
    { once: true },
  );
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    void ensureBootstrap();
  }
});

setTimeout(() => {
  if (!currentSettings) {
    void ensureBootstrap();
  }
}, 1500);

if (isExtensionContextValid()) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' || !changes[STORAGE_KEY]) return;
    void ensureBootstrap();
  });

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(getInjectResourcePath());
  script.type = 'module';
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}
