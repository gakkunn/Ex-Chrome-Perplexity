import { t } from './i18n';
import { type KeyBinding } from './settings';

const platform = typeof navigator !== 'undefined' ? navigator.platform.toLowerCase() : '';

export const isMac = platform.includes('mac');

const SINGLE_KEY_REQUIRE_MOD = new Set(['Escape', 'Esc', 'Backspace', 'Delete']);
const SINGLE_CODE_REQUIRE_MOD = new Set(['Escape', 'Backspace', 'Delete']);

const FORBIDDEN_KEYS = new Set([
  'Enter',
  'Return',
  'Tab',
  'Eisu',
  'Alphanumeric',
  'KanaMode',
  'Zenkaku',
  'Hankaku',
  'HankakuZenkaku',
  'Henkan',
  'Convert',
  'NonConvert',
  'Kana',
  'Kanji',
  'Katakana',
  'Hiragana',
  'Romaji',
  'Lang1',
  'Lang2',
  'Lang3',
  'Lang4',
  'Lang5',
  'CapsLock',
  'NumLock',
  'ScrollLock',
  // Locale-specific key strings often reported on JP keyboards
  '英数',
  'かな',
  '無変換',
  '変換',
  '半角/全角',
]);

const FORBIDDEN_CODES = new Set([
  'Enter',
  'NumpadEnter',
  'Tab',
  'Eisu',
  'NonConvert',
  'Convert',
  'KanaMode',
  'Lang1',
  'Lang2',
  'Lang3',
  'Lang4',
  'Lang5',
  'CapsLock',
  'NumLock',
  'ScrollLock',
]);

const WINDOWS_KEY_NAMES = new Set(['meta', 'os', 'win', 'super', 'hyper', 'command', 'windows']);
const WINDOWS_KEY_CODES = new Set([
  'MetaLeft',
  'MetaRight',
  'OSLeft',
  'OSRight',
  'SuperLeft',
  'SuperRight',
]);

export type BindingValidationError = 'forbidden_single' | 'forbidden_key';

export type BindingParseResult = {
  binding: KeyBinding | null;
  error: BindingValidationError | null;
};

export function isModKey(event: Pick<KeyboardEvent, 'metaKey' | 'ctrlKey'>): boolean {
  return isMac ? event.metaKey : event.ctrlKey;
}

function getMetaLabel(): string {
  return isMac ? '⌘' : 'Win';
}

function getCtrlLabel(): string {
  return isMac ? '⌃' : t('key_name_ctrl');
}

function getModLabel(): string {
  return isMac ? getMetaLabel() : getCtrlLabel();
}

function getAltLabel(): string {
  return isMac ? '⌥' : t('key_name_alt');
}

function getShiftLabel(): string {
  return isMac ? '⇧' : t('key_name_shift');
}

function getPhysicalKeyFromCode(code?: string): string | undefined {
  if (!code) return undefined;
  if (code.startsWith('Key') && code.length === 4) return code.slice(3);
  if (code.startsWith('Digit') && code.length === 6) return code.slice(5);
  return undefined;
}

export function formatKeyLabel(key: string): string {
  const map: Record<string, string> = {
    ' ': t('key_name_space'),
    Space: t('key_name_space'),
    Enter: t('key_name_enter'),
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Meta: getMetaLabel(),
    Control: getCtrlLabel(),
    Alt: getAltLabel(),
    Shift: getShiftLabel(),
    Backspace: t('key_name_backspace'),
    Delete: t('key_name_delete'),
  };
  return map[key] || key;
}

export function getBindingTokens(binding: KeyBinding): string[] {
  const tokens: string[] = [];

  if (binding.mod) {
    tokens.push(getModLabel());
  } else {
    if (binding.ctrl) tokens.push(getCtrlLabel());
    if (binding.meta) tokens.push(getMetaLabel());
  }

  if (binding.alt) tokens.push(getAltLabel());
  if (binding.shift) tokens.push(getShiftLabel());

  const physicalKey = binding.alt ? getPhysicalKeyFromCode(binding.code) : undefined;
  const keyToken = physicalKey ?? formatKeyLabel(binding.key);
  tokens.push(keyToken);
  return tokens;
}

export function formatBindings(bindings: KeyBinding[]): string {
  if (!bindings.length) return '';
  const joiner = isMac ? ' ' : ' + ';
  return bindings.map((binding) => getBindingTokens(binding).join(joiner)).join(' / ');
}

function usesWindowsKey(binding: KeyBinding): boolean {
  if (isMac) return false;
  const keyMatch = WINDOWS_KEY_NAMES.has(binding.key.toLowerCase());
  const codeMatch = binding.code ? WINDOWS_KEY_CODES.has(binding.code) : false;
  return keyMatch || codeMatch || !!binding.meta;
}

function isForbiddenBinding(binding: KeyBinding): boolean {
  const keyMatch = FORBIDDEN_KEYS.has(binding.key);
  const codeMatch = binding.code ? FORBIDDEN_CODES.has(binding.code) : false;
  if (keyMatch || codeMatch) return true;
  return usesWindowsKey(binding);
}

function requiresModifierOnlyKey(binding: KeyBinding): boolean {
  const hasModifier = !!(
    binding.mod ||
    binding.meta ||
    binding.ctrl ||
    binding.shift ||
    binding.alt
  );
  if (hasModifier) return false;
  const keyMatch = SINGLE_KEY_REQUIRE_MOD.has(binding.key);
  const codeMatch = binding.code ? SINGLE_CODE_REQUIRE_MOD.has(binding.code) : false;
  return keyMatch || codeMatch;
}

export function bindingFromKeyboardEvent(event: KeyboardEvent): BindingParseResult {
  if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key))
    return { binding: null, error: null };
  const key = event.key === 'Spacebar' ? ' ' : event.key;
  const usesMod = isModKey(event);
  const metaPressed = event.metaKey;
  const ctrlPressed = event.ctrlKey;

  const binding: KeyBinding = {
    key,
    code: event.code,
    shift: event.shiftKey,
    alt: event.altKey,
  };

  if (usesMod) {
    binding.mod = true;
  } else {
    if (metaPressed) binding.meta = true;
    if (ctrlPressed) binding.ctrl = true;
  }

  if (metaPressed) binding.meta = true;

  if (isForbiddenBinding(binding)) {
    return { binding, error: 'forbidden_key' };
  }

  if (requiresModifierOnlyKey(binding)) {
    return { binding, error: 'forbidden_single' };
  }

  return { binding, error: null };
}
