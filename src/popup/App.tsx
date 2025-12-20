import { JSX } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import { type MessageKey, t } from '@/shared/i18n';
import {
  bindingFromKeyboardEvent,
  formatBindings,
  isMac,
  getBindingTokens,
  type BindingValidationError,
} from '@/shared/keyboard';
import {
  DEFAULT_FEATURE_TOGGLES,
  DEFAULT_SHORTCUTS,
  type ExtensionSettings,
  type FeatureCategory,
  type KeyBinding,
  SHORTCUT_DEFINITIONS,
  type ShortcutDefinition,
  type ShortcutId,
  loadSettings,
  saveSettings,
} from '@/shared/settings';

const GITHUB_URL = 'https://github.com/gakkunn/Ex-Chrome-Perplexity';
const SUPPORT_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeiK5mMYlujWSLjdF2zjTY8am7gi_BlJOAiruga8QIw4xDVyg/viewform';
const COFFEE_URL = 'https://buymeacoffee.com/gakkunn';

const ICON_GITHUB_SRC = '/img/github.svg';
const ICON_SUPPORT_SRC = '/img/support.svg';
const ICON_COFFEE_SRC = '/img/coffee.svg';

type ShortcutDefinitionWithCategory = (typeof SHORTCUT_DEFINITIONS)[number];

type MessageState =
  | { type: 'info'; text: string }
  | { type: 'error'; text: string }
  | { type: null; text: '' };

const featureLabelMessageIds: Record<FeatureCategory, MessageKey> = {
  vimScroll: 'popup_feature_label_vim_scroll',
  wideScreen: 'popup_feature_label_wide_screen',
  safeSend: 'popup_feature_label_safe_send',
  otherShortcuts: 'popup_feature_label_other_shortcuts',
};

const featureOrder: FeatureCategory[] = ['vimScroll', 'wideScreen', 'safeSend', 'otherShortcuts'];

const initialMessage: MessageState = { type: null, text: '' };

const renderBindingKeycaps = (bindings: KeyBinding[]): JSX.Element[] => {
  const keycapGroups = bindings.map((binding, bindingIndex) => {
    const tokens = getBindingTokens(binding);
    return (
      <div className="shortcut-keycap-group" key={`${binding.code || binding.key}-${bindingIndex}`}>
        {tokens.map((token, tokenIndex) => (
          <span className="shortcut-keycap-wrapper" key={`${token}-${tokenIndex}`}>
            <kbd className="chatgpt-unified-keycap">
              <span className="chatgpt-unified-keycap-label">{token}</span>
            </kbd>
            {!isMac && tokenIndex < tokens.length - 1 && (
              <span className="chatgpt-unified-keycap-sep">+</span>
            )}
          </span>
        ))}
      </div>
    );
  });

  const elements: JSX.Element[] = [];
  keycapGroups.forEach((group, index) => {
    elements.push(group);
    if (index < keycapGroups.length - 1) {
      elements.push(
        <span className="shortcut-binding-sep" key={`sep-${index}`}>
          /
        </span>,
      );
    }
  });

  return elements;
};

function normalizeBindingForPlatform(binding: KeyBinding) {
  const requiresMod = !!binding.mod;
  return {
    meta: requiresMod && isMac ? true : !!binding.meta,
    ctrl: requiresMod && !isMac ? true : !!binding.ctrl,
    shift: !!binding.shift,
    alt: !!binding.alt,
    key: binding.key.toLowerCase(),
    code: binding.code ?? '',
  };
}

function bindingsMatch(a: KeyBinding, b: KeyBinding): boolean {
  const normA = normalizeBindingForPlatform(a);
  const normB = normalizeBindingForPlatform(b);
  const modifiersMatch =
    normA.meta === normB.meta &&
    normA.ctrl === normB.ctrl &&
    normA.shift === normB.shift &&
    normA.alt === normB.alt;
  const keyMatch = normA.key === normB.key;
  const codeMatch = normA.code && normB.code ? normA.code === normB.code : false;
  return modifiersMatch && (keyMatch || codeMatch);
}

export function App() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [message, setMessage] = useState<MessageState>(initialMessage);
  const [errorShortcutId, setErrorShortcutId] = useState<ShortcutId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadSettings()
      .then((loaded) => {
        if (mounted) {
          setSettings(loaded);
        }
      })
      .catch(() => {
        if (mounted) {
          setMessage({ type: 'error', text: t('popup_error_load_settings') });
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const featureToggles = settings?.featureToggles ?? DEFAULT_FEATURE_TOGGLES;

  const visibleDefinitions = useMemo(
    () => SHORTCUT_DEFINITIONS.filter((def) => featureToggles[def.category]),
    [featureToggles],
  );

  const clearMessage = useCallback(() => {
    setMessage(initialMessage);
    setErrorShortcutId(null);
  }, []);

  const getBindingsFor = useCallback(
    (def: ShortcutDefinition): KeyBinding[] => {
      if (!settings) return def.defaultBindings;
      const value = settings.shortcuts[def.id];
      if (Array.isArray(value) && value.length) {
        return value;
      }
      return def.defaultBindings;
    },
    [settings],
  );

  const findConflictingShortcut = useCallback(
    (binding: KeyBinding, currentId: ShortcutId) => {
      if (!settings) return null;
      return (
        SHORTCUT_DEFINITIONS.find((def) => {
          if (def.id === currentId) return false;
          if (!featureToggles[def.category]) return false;
          return getBindingsFor(def).some((existing) => bindingsMatch(existing, binding));
        }) || null
      );
    },
    [featureToggles, getBindingsFor, settings],
  );

  const handleToggleFeature = useCallback(
    async (category: FeatureCategory, enabled: boolean) => {
      if (!settings) return;
      const next: ExtensionSettings = {
        ...settings,
        featureToggles: { ...settings.featureToggles, [category]: enabled },
      };
      setSettings(next);
      clearMessage();
      await saveSettings({ featureToggles: next.featureToggles });
    },
    [clearMessage, settings],
  );

  const getValidationMessage = useCallback((error: BindingValidationError, binding: KeyBinding) => {
    if (error === 'forbidden_single') {
      return t('error_shortcut_requires_modifier', [formatBindings([binding])]);
    }
    return t('error_shortcut_forbidden_key', [formatBindings([binding])]);
  }, []);

  const handleShortcutKeyDown = useCallback(
    async (event: KeyboardEvent, def: ShortcutDefinitionWithCategory) => {
      event.preventDefault();
      const { binding, error } = bindingFromKeyboardEvent(event);
      if (!binding || !settings) {
        return;
      }

      clearMessage();

      if (error) {
        setErrorShortcutId(def.id);
        setMessage({ type: 'error', text: getValidationMessage(error, binding) });
        return;
      }

      const conflict = findConflictingShortcut(binding, def.id);
      if (conflict) {
        setErrorShortcutId(def.id);
        setMessage({
          type: 'error',
          text: t('popup_error_shortcut_conflict', [
            formatBindings([binding]),
            t(conflict.labelMessageId),
          ]),
        });
        return;
      }

      const shortcuts = {
        ...settings.shortcuts,
        [def.id]: [binding],
      };

      const next: ExtensionSettings = {
        ...settings,
        shortcuts,
      };

      setSettings(next);
      await saveSettings({ shortcuts: { [def.id]: [binding] } });
    },
    [clearMessage, findConflictingShortcut, getValidationMessage, settings],
  );

  const handleReset = useCallback(async () => {
    clearMessage();
    const next: ExtensionSettings = {
      featureToggles: { ...DEFAULT_FEATURE_TOGGLES },
      shortcuts: { ...DEFAULT_SHORTCUTS },
    };
    setSettings(next);
    await saveSettings(next);
    setMessage({ type: 'info', text: t('popup_info_reset_success') });
  }, [clearMessage]);

  return (
    <div className="popup-wrapper">
      <div className="header-row">
        <div>
          <h1>{t('extension_name_short')}</h1>
        </div>
        <button
          className="reset-button"
          id="reset-button"
          type="button"
          onClick={() => {
            void handleReset();
          }}
          disabled={loading}
        >
          {t('popup_button_reset')}
        </button>
      </div>

      {loading && <p className="helper-text">{t('popup_loading_text')}</p>}

      {!loading && !settings && (
        <div className="card">
          <p className="error-text">{t('popup_error_load_settings')}</p>
        </div>
      )}

      {!loading && settings && (
        <>
          <section className="card">
            <h2>{t('popup_section_features')}</h2>
            <div className="toggle-list" id="feature-toggles">
              {featureOrder.map((category) => (
                <label className="toggle" key={category}>
                  <input
                    type="checkbox"
                    checked={!!settings.featureToggles[category]}
                    onChange={(event) => {
                      void handleToggleFeature(category, event.currentTarget.checked);
                    }}
                  />
                  <span>{t(featureLabelMessageIds[category])}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>{t('popup_section_shortcuts')}</h2>
            <div
              className="shortcut-message"
              data-status={
                message.type === 'error' ? 'error' : message.type === 'info' ? 'info' : ''
              }
              aria-live="polite"
              role="status"
            >
              {message.text}
            </div>
            <div id="shortcuts-list">
              {visibleDefinitions.map((def) => (
                <div className="shortcut-row" key={def.id}>
                  <div className="shortcut-label">{t(def.labelMessageId)}</div>
                  <div
                    className={`shortcut-input${errorShortcutId === def.id ? ' shortcut-input-error' : ''}`}
                    role="textbox"
                    tabIndex={0}
                    aria-label={t(def.labelMessageId)}
                    onClick={(event) => event.currentTarget.focus()}
                    onKeyDown={(event) => {
                      void handleShortcutKeyDown(event as KeyboardEvent, def);
                    }}
                    onFocus={clearMessage}
                  >
                    <div className="shortcut-keycaps">
                      {getBindingsFor(def).length ? (
                        renderBindingKeycaps(getBindingsFor(def))
                      ) : (
                        <span className="shortcut-placeholder">{t('popup_input_placeholder')}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <footer className="popup-footer">
        <section className="links">
          <div>
            <a
              className="footer-button github-button"
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Contribute"
            >
              <span>
                <img className="icon" src={ICON_GITHUB_SRC} alt="Contribute" />
              </span>
            </a>
          </div>
          <div>
            <a
              className="footer-button question-button"
              href={SUPPORT_FORM_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Support"
            >
              <span>
                <img className="icon" src={ICON_SUPPORT_SRC} alt="Report a problem" />
              </span>
            </a>
          </div>
          <div>
            <a
              className="footer-button coffee-button"
              href={COFFEE_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Buy me a coffee"
            >
              <span>
                <img className="icon" src={ICON_COFFEE_SRC} alt="Buy me a coffee" />
              </span>
            </a>
          </div>
        </section>
      </footer>
    </div>
  );
}
