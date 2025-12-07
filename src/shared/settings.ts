import {
  DEFAULT_FEATURE_TOGGLES,
  type FeatureCategory,
  type FeatureToggles,
} from './feature-flags';
import { type MessageKey } from './i18n';
import { readStorage, writeStorage } from './storage';

// NOTE: avoid importing isMac from keyboard.ts to prevent circular deps.
const platform = typeof navigator !== 'undefined' ? navigator.platform.toLowerCase() : '';
const isMacPlatform = platform.includes('mac');

export type { FeatureCategory, FeatureToggles } from './feature-flags';
export { DEFAULT_FEATURE_TOGGLES } from './feature-flags';

export type ShortcutId =
  | 'scrollTop'
  | 'scrollBottom'
  | 'scrollUp'
  | 'scrollDown'
  | 'scrollHalfUp'
  | 'scrollHalfDown'
  | 'toggleFocus'
  | 'openNewChat'
  | 'toggleTemporaryChat'
  | 'deleteChat'
  | 'bookmarkChat'
  | 'addPhotos';

export type KeyBinding = {
  key: string;
  code?: string;
  mod?: boolean;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
};

export type ShortcutSettings = Partial<Record<ShortcutId, KeyBinding[]>>;

export interface ExtensionSettings {
  featureToggles: FeatureToggles;
  shortcuts: ShortcutSettings;
}

export type ExtensionSettingsUpdate = {
  featureToggles?: Partial<FeatureToggles>;
  shortcuts?: ShortcutSettings;
};

export interface ShortcutDefinition {
  id: ShortcutId;
  labelMessageId: MessageKey;
  category: FeatureCategory;
  defaultBindings: KeyBinding[];
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  {
    id: 'scrollTop',
    labelMessageId: 'shortcut_label_scroll_top',
    category: 'vimScroll',
    defaultBindings: [{ key: 'k', code: 'KeyK', mod: true }],
  },
  {
    id: 'scrollBottom',
    labelMessageId: 'shortcut_label_scroll_bottom',
    category: 'vimScroll',
    defaultBindings: [{ key: 'j', code: 'KeyJ', mod: true }],
  },
  {
    id: 'scrollUp',
    labelMessageId: 'shortcut_label_scroll_up',
    category: 'vimScroll',
    defaultBindings: [{ key: 'k', code: 'KeyK' }],
  },
  {
    id: 'scrollDown',
    labelMessageId: 'shortcut_label_scroll_down',
    category: 'vimScroll',
    defaultBindings: [{ key: 'j', code: 'KeyJ' }],
  },
  {
    id: 'scrollHalfUp',
    labelMessageId: 'shortcut_label_scroll_half_up',
    category: 'vimScroll',
    defaultBindings: [{ key: 'K', code: 'KeyK', shift: true }],
  },
  {
    id: 'scrollHalfDown',
    labelMessageId: 'shortcut_label_scroll_half_down',
    category: 'vimScroll',
    defaultBindings: [{ key: 'J', code: 'KeyJ', shift: true }],
  },
  {
    id: 'toggleFocus',
    labelMessageId: 'shortcut_label_toggle_focus',
    category: 'wideScreen',
    defaultBindings: [{ key: ' ', code: 'Space', shift: true }],
  },
  {
    id: 'openNewChat',
    labelMessageId: 'shortcut_label_open_new_chat',
    category: 'otherShortcuts',
    defaultBindings: [{ key: 'O', code: 'KeyO', mod: true, shift: true }],
  },
  {
    id: 'toggleTemporaryChat',
    labelMessageId: 'shortcut_label_toggle_temporary_chat',
    category: 'otherShortcuts',
    defaultBindings: [{ key: 'i', code: 'KeyI', mod: true }],
  },
  {
    id: 'deleteChat',
    labelMessageId: 'shortcut_label_delete_chat',
    category: 'otherShortcuts',
    defaultBindings: isMacPlatform
      ? [{ key: 'Backspace', code: 'Backspace', mod: true, shift: true }]
      : [{ key: 'Delete', code: 'Delete', mod: true, shift: true }],
  },
  {
    id: 'bookmarkChat',
    labelMessageId: 'shortcut_label_bookmark_chat',
    category: 'otherShortcuts',
    defaultBindings: [{ key: 'P', code: 'KeyP', mod: true, shift: true }],
  },
  {
    id: 'addPhotos',
    labelMessageId: 'shortcut_label_add_photos',
    category: 'otherShortcuts',
    defaultBindings: [{ key: 'u', code: 'KeyU', mod: true }],
  },
];

export const DEFAULT_SHORTCUTS: ShortcutSettings = SHORTCUT_DEFINITIONS.reduce((acc, def) => {
  acc[def.id] = def.defaultBindings;
  return acc;
}, {} as ShortcutSettings);

export const STORAGE_KEY = 'perplexityUnifiedSettings';

function normalizeBinding(binding: KeyBinding): KeyBinding {
  let normalized = { ...binding };

  if (normalized.mod || normalized.meta) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { meta, ctrl, ...rest } = normalized;
    normalized = { ...rest, mod: true };
  }

  return normalized;
}

function areSameCombo(a: KeyBinding, b: KeyBinding): boolean {
  const keyMatch = a.key.toLowerCase() === b.key.toLowerCase();
  const codeMatch = a.code && b.code ? a.code === b.code : true;
  return keyMatch && codeMatch && !!a.shift === !!b.shift && !!a.alt === !!b.alt;
}

function migrateBindings(bindings: KeyBinding[]): KeyBinding[] {
  const normalized = bindings.map((binding) => normalizeBinding(binding));
  const result: KeyBinding[] = [];

  normalized.forEach((binding) => {
    const existingIndex = result.findIndex((candidate) => areSameCombo(candidate, binding));
    if (existingIndex === -1) {
      result.push(binding);
      return;
    }

    const existing = result[existingIndex];
    if (existing.mod) return;
    if (binding.mod) {
      result[existingIndex] = binding;
    }
  });

  return result;
}

function migrateShortcutSettings(shortcuts?: ShortcutSettings): ShortcutSettings {
  const migrated: ShortcutSettings = {};
  if (!shortcuts) return migrated;

  (Object.entries(shortcuts) as [ShortcutId, KeyBinding[] | undefined][]).forEach(
    ([id, bindings]) => {
      if (!Array.isArray(bindings)) return;
      migrated[id] = migrateBindings(bindings);
    },
  );

  return migrated;
}

export async function loadSettings(): Promise<ExtensionSettings> {
  const saved = await readStorage<ExtensionSettings>(STORAGE_KEY);
  const migratedShortcuts = migrateShortcutSettings(saved?.shortcuts);
  return {
    featureToggles: {
      ...DEFAULT_FEATURE_TOGGLES,
      ...(saved?.featureToggles ?? {}),
    },
    shortcuts: {
      ...DEFAULT_SHORTCUTS,
      ...migratedShortcuts,
    },
  };
}

export async function saveSettings(partial: ExtensionSettingsUpdate): Promise<void> {
  const current = await readStorage<ExtensionSettings>(STORAGE_KEY);
  const currentShortcuts = migrateShortcutSettings(current?.shortcuts);
  const partialShortcuts = migrateShortcutSettings(partial.shortcuts);
  const next: ExtensionSettings = {
    featureToggles: {
      ...DEFAULT_FEATURE_TOGGLES,
      ...(current?.featureToggles ?? {}),
      ...(partial.featureToggles ?? {}),
    },
    shortcuts: {
      ...DEFAULT_SHORTCUTS,
      ...currentShortcuts,
      ...partialShortcuts,
    },
  };
  await writeStorage(STORAGE_KEY, next);
}
