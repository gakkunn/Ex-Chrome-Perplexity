const FALLBACK_MESSAGES = {
  extension_name: 'Perplexity Shortcut Effective Extension',
  extension_name_short: 'Perplexity Shortcut Extension',
  extension_description:
    'Safer send, vim-like scroll, model toggles, temporary chats, and clean UI for Perplexity.',
  action_default_title: 'Perplexity Shortcut Effective Extension',
  popup_header_title: 'Perplexity Shortcut Effective Extension',
  popup_button_reset: 'Reset',
  popup_section_features: 'Features',
  popup_section_shortcuts: 'Shortcuts',
  popup_feature_label_vim_scroll: 'Vim-like Scroll',
  popup_feature_label_wide_screen: 'Wide Screen / Focus',
  popup_feature_label_safe_send: 'Send with Cmd/Ctrl + Enter',
  popup_feature_label_other_shortcuts: 'Other Shortcuts',
  popup_loading_text: 'Loading...',
  popup_error_load_settings: 'Failed to load settings.',
  popup_info_reset_success: 'Settings have been reset to default.',
  popup_input_placeholder: 'Press keys',
  popup_error_shortcut_conflict: '"$1" is already assigned to $2.',
  popup_error_shortcut_requires_modifier: '"$1" must be combined with a modifier key.',
  popup_error_shortcut_forbidden_key: '"$1" cannot be used as a shortcut.',
  error_shortcut_requires_modifier: '"$1" must be combined with a modifier key.',
  error_shortcut_forbidden_key: '"$1" cannot be used as a shortcut.',
  shortcut_panel_section_title: 'Extension',
  shortcut_panel_settings_label: 'Setting Shortcut Key',
  shortcut_panel_settings_link: 'Click Here',
  shortcut_label_scroll_top: 'Scroll to Top',
  shortcut_label_scroll_bottom: 'Scroll to Bottom',
  shortcut_label_scroll_up: 'Scroll Up',
  shortcut_label_scroll_down: 'Scroll Down',
  shortcut_label_scroll_half_up: 'Scroll Half Page Up',
  shortcut_label_scroll_half_down: 'Scroll Half Page Down',
  shortcut_label_toggle_focus: 'Toggle Focus',
  shortcut_label_open_new_chat: 'Open New Chat',
  shortcut_label_toggle_temporary_chat: 'Toggle Account / Incognito',
  shortcut_label_delete_chat: 'Delete Chat',
  shortcut_label_bookmark_chat: 'Bookmark Chat',
  shortcut_label_add_photos: 'Add Photos & Files',
  html_lang: 'en',
  key_name_ctrl: 'Ctrl',
  key_name_cmd: 'Cmd',
  key_name_alt: 'Alt',
  key_name_shift: 'Shift',
  key_name_space: 'Space',
  key_name_enter: 'Enter',
  key_name_backspace: '⌫',
  key_name_delete: '⌦',
} as const;

export type MessageKey = keyof typeof FALLBACK_MESSAGES;

type Substitutions = string | string[];

function normalizeSubstitutions(substitutions?: Substitutions): string[] | undefined {
  if (!substitutions) return undefined;
  return Array.isArray(substitutions) ? substitutions : [substitutions];
}

function applyFallbackTemplate(message: string, substitutions?: string[]): string {
  if (!substitutions || substitutions.length === 0) return message;
  return message.replace(/\$(\d+)/g, (_, index: string) => {
    const idx = Number(index) - 1;
    return substitutions[idx] ?? '';
  });
}

export function t(key: MessageKey, substitutions?: Substitutions): string {
  const normalized = normalizeSubstitutions(substitutions);

  if (typeof chrome !== 'undefined' && chrome?.i18n?.getMessage) {
    const translated = chrome.i18n.getMessage(key, normalized);
    if (translated) {
      return translated;
    }
  }

  const fallback = FALLBACK_MESSAGES[key];
  if (!fallback) {
    return key;
  }

  return applyFallbackTemplate(fallback, normalized);
}

export function getUiLocale(): string {
  return t('html_lang');
}
