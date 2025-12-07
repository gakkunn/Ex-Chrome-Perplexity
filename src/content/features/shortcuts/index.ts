import {
  addPhotosAndFiles,
  bookmarkCurrentChat,
  deleteChat,
  openNewChat,
  toggleTemporaryChat,
} from './actions';
import { stopContinuousScroll } from './helpers';
import { handleVimScroll, handleVimScrollKeyUp } from './vim-scroll';

import {
  findElementByText,
  getInputField,
  isElementVisible,
  strongClick,
  waitForElement,
} from '@/shared/dom';
import { t } from '@/shared/i18n';
import { getBindingTokens, isMac, isModKey } from '@/shared/keyboard';
import { openSettings as dispatchOpenSettings } from '@/shared/messaging';
import {
  type ExtensionSettings,
  type FeatureCategory,
  type KeyBinding,
  type ShortcutId,
  SHORTCUT_DEFINITIONS,
} from '@/shared/settings';

type ShortcutDefinitionWithCategory = (typeof SHORTCUT_DEFINITIONS)[number];

export class ShortcutsManager {
  private settings: ExtensionSettings;
  private focusToggle: () => void;
  private defaultShortcutMap: Map<ShortcutId, KeyBinding[]>;

  constructor(settings: ExtensionSettings, focusToggle: () => void) {
    this.settings = settings;
    this.focusToggle = focusToggle;
    this.defaultShortcutMap = new Map(
      SHORTCUT_DEFINITIONS.map((def) => [def.id, def.defaultBindings]),
    );
    this.bindKeys();
  }

  public updateSettings(settings: ExtensionSettings) {
    this.settings = settings;
    if (!this.isEnabled('vimScroll')) {
      stopContinuousScroll();
    }
    void this.ensureShortcutPanelPatched();
  }

  private isEnabled(category: FeatureCategory): boolean {
    return !!this.settings.featureToggles[category];
  }

  private getBindings(id: ShortcutId): KeyBinding[] {
    const hasCustomValue = Object.prototype.hasOwnProperty.call(this.settings.shortcuts, id);
    if (hasCustomValue) {
      const value = this.settings.shortcuts[id];
      if (Array.isArray(value)) {
        return value;
      }
    }
    return this.defaultShortcutMap.get(id) || [];
  }

  private matchesShortcut(id: ShortcutId, e: KeyboardEvent): boolean {
    const bindings = this.getBindings(id);
    return bindings.some((binding) => this.matchesBinding(binding, e));
  }

  private matchesBinding(binding: KeyBinding, e: KeyboardEvent): boolean {
    const requireMod = !!binding.mod;
    const requireMeta = !!binding.meta;
    const requireCtrl = !!binding.ctrl;
    const requireShift = !!binding.shift;
    const requireAlt = !!binding.alt;

    if (requireMod) {
      if (!isModKey(e)) return false;
      if (isMac ? e.ctrlKey : e.metaKey) return false;
    } else {
      if (e.metaKey !== requireMeta) return false;
      if (e.ctrlKey !== requireCtrl) return false;
    }
    if (e.shiftKey !== requireShift) return false;
    if (e.altKey !== requireAlt) return false;

    const keyMatch = e.key === binding.key || e.key.toLowerCase() === binding.key.toLowerCase();
    const codeMatch = binding.code ? e.code === binding.code : false;

    return keyMatch || codeMatch;
  }

  private blockDefaultShortcuts(e: KeyboardEvent): boolean {
    // Prevent Perplexity's built-in shortcuts (Cmd/Ctrl+K/J/;) from firing
    if (!e.isTrusted) return false;
    if (!isModKey(e) || e.altKey || e.shiftKey) return false;
    if (isMac ? e.ctrlKey : e.metaKey) return false;

    const key = (e.key || '').toLowerCase();
    const code = e.code || '';
    const isNewThread = key === 'k' || code === 'KeyK';
    const isToggleIncognito = key === ';' || code === 'Semicolon' || e.key === '؛';
    const isFocusAsk = key === 'j' || code === 'KeyJ';

    if (!isNewThread && !isToggleIncognito && !isFocusAsk) {
      return false;
    }

    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) {
      e.stopImmediatePropagation();
    }
    return true;
  }

  private handleSafeSend(e: KeyboardEvent): boolean {
    if (!this.isEnabled('safeSend')) return false;
    if (e.key !== 'Enter') return false;

    const input = getInputField();
    if (!input || document.activeElement !== input || e.isComposing) return false;

    // Cmd/Ctrl (mod) + Enter -> send
    if (isModKey(e)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const sendEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
      });
      input.dispatchEvent(sendEvent);
      return true;
    }

    // Plain Enter -> newline (convert to Shift + Enter)
    if (!e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const newlineEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
        shiftKey: true,
      });
      input.dispatchEvent(newlineEvent);
      return true;
    }

    return false;
  }

  private bindKeys() {
    // Avoid multiple bindings if the manager is re-instantiated (e.g. re-injection)
    if (typeof window !== 'undefined') {
      const globalWin = window as typeof window & {
        __perplexityShortcutHandlerInstalled?: boolean;
      };
      if (globalWin.__perplexityShortcutHandlerInstalled) {
        return;
      }
      globalWin.__perplexityShortcutHandlerInstalled = true;
    }

    document.addEventListener('keyup', (e) => this.handleKeyup(e), {
      capture: true,
      passive: false,
    });
    document.addEventListener('keydown', (e) => this.handleKeydown(e), {
      capture: true,
      passive: false,
    });
  }

  private handleKeyup(e: KeyboardEvent) {
    if (!this.isEnabled('vimScroll')) return;
    handleVimScrollKeyUp(e);
  }

  private handleKeydown(e: KeyboardEvent) {
    this.blockDefaultShortcuts(e);
    if (this.handleSafeSend(e)) return;

    if (this.isEnabled('vimScroll')) {
      if (this.matchesShortcut('scrollTop', e)) {
        handleVimScroll(e, 'top');
        return;
      }
      if (this.matchesShortcut('scrollBottom', e)) {
        handleVimScroll(e, 'bottom');
        return;
      }
      if (this.matchesShortcut('scrollHalfUp', e)) {
        handleVimScroll(e, 'halfUp');
        return;
      }
      if (this.matchesShortcut('scrollHalfDown', e)) {
        handleVimScroll(e, 'halfDown');
        return;
      }
      if (this.matchesShortcut('scrollUp', e)) {
        handleVimScroll(e, 'up');
        return;
      }
      if (this.matchesShortcut('scrollDown', e)) {
        handleVimScroll(e, 'down');
        return;
      }
    }

    if (this.isEnabled('wideScreen') && this.matchesShortcut('toggleFocus', e)) {
      e.preventDefault();
      this.focusToggle();
      return;
    }

    if (this.isEnabled('otherShortcuts')) {
      if (this.matchesShortcut('openNewChat', e)) {
        e.preventDefault();
        openNewChat();
        return;
      }
      if (this.matchesShortcut('toggleTemporaryChat', e)) {
        e.preventDefault();
        void toggleTemporaryChat();
        return;
      }
      if (this.matchesShortcut('deleteChat', e)) {
        e.preventDefault();
        void deleteChat();
        return;
      }
      if (this.matchesShortcut('bookmarkChat', e)) {
        e.preventDefault();
        void bookmarkCurrentChat();
        return;
      }
      if (this.matchesShortcut('addPhotos', e)) {
        e.preventDefault();
        void addPhotosAndFiles();
        return;
      }
    }

    if (this.handleShortcutDialogToggle(e)) {
      return;
    }
  }

  private isShortcutToggleEvent(e: KeyboardEvent): boolean {
    return isModKey(e) && e.key === '/';
  }

  private getOpenShortcutDialog(): HTMLElement | null {
    const listContainer = document.querySelector<HTMLElement>(
      'dl[class*="divide-y"][class*="border-subtlest"]',
    );
    if (!listContainer) return null;

    const dialog =
      listContainer.closest<HTMLElement>('[role="dialog"]') ||
      listContainer.closest<HTMLElement>('dialog');
    const target = dialog || listContainer;

    const state = target.getAttribute('data-state') || target.dataset?.state;
    if (state && state !== 'open' && state !== 'entered') return null;
    if (!isElementVisible(target)) return null;

    return target;
  }

  private closeShortcutDialog(dialog: HTMLElement): void {
    const closeButton =
      dialog.querySelector<HTMLButtonElement>(
        'button[aria-label="Close"], button[data-testid="close"], button[data-testid="close-dialog"]',
      ) ||
      findElementByText(
        Array.from(dialog.querySelectorAll<HTMLButtonElement>('button')),
        /close|dismiss|esc/i,
      );

    if (closeButton) {
      strongClick(closeButton);
      return;
    }

    const escapeDown = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true,
    });
    const escapeUp = new KeyboardEvent('keyup', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true,
    });

    document.dispatchEvent(escapeDown);
    document.dispatchEvent(escapeUp);
  }

  private handleShortcutDialogToggle(e: KeyboardEvent): boolean {
    if (!this.isShortcutToggleEvent(e)) return false;

    const dialog = this.getOpenShortcutDialog();
    if (dialog) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }
      this.closeShortcutDialog(dialog);
      return true;
    }

    setTimeout(() => {
      void this.ensureShortcutPanelPatched();
    }, 100);
    return false;
  }

  private bindingToTokens(binding: KeyBinding): string[] {
    return getBindingTokens(binding);
  }

  private getDisplayBindings(def: {
    id: ShortcutId;
    defaultBindings: KeyBinding[];
    category: FeatureCategory;
  }): KeyBinding[] {
    const enabled = this.isEnabled(def.category);
    if (!enabled) return [];
    const value = this.settings.shortcuts[def.id];
    if (Array.isArray(value) && value.length) return value;
    return def.defaultBindings;
  }

  private createKeyGroup(tokens: string[]): HTMLElement {
    const keysContainer = document.createElement('dl');
    keysContainer.className =
      'space-x-two flex items-center border-subtlest ring-subtlest divide-subtlest bg-transparent';

    tokens.forEach((token) => {
      const keyDiv = document.createElement('div');
      keyDiv.className =
        'px-xs flex h-5 min-w-5 items-center justify-center rounded border font-mono border-subtlest ring-subtlest divide-subtlest bg-transparent';
      keyDiv.textContent = token;
      keysContainer.appendChild(keyDiv);
    });

    return keysContainer;
  }

  private async ensureShortcutPanelPatched() {
    try {
      // Directly find the dl container (same approach as the original ui-update.ts)
      const dlContainer = await waitForElement<HTMLDListElement>(
        () =>
          document.querySelector<HTMLDListElement>(
            'dl[class*="divide-y"][class*="border-subtlest"]',
          ),
        { maxAttempts: 10, interval: 120 },
      );

      if (dlContainer) {
        this.decorateShortcutPanel(dlContainer);
      }
    } catch {
      // ignore errors
    }
  }

  private decorateShortcutPanel(container: HTMLElement) {
    if (!container) return;

    // Remove previously added custom shortcuts
    container.querySelectorAll<HTMLElement>('[data-custom-shortcut="true"]').forEach((el) => {
      el.remove();
    });

    // Remove all existing Perplexity shortcut rows (New Thread, Toggle Incognito, Show Shortcuts, Focus Ask Input)
    // These are disabled by the extension
    const allShortcutRows = Array.from(
      container.querySelectorAll<HTMLDivElement>('div[class*="py-md"]'),
    );
    allShortcutRows.forEach((el) => {
      el.remove();
    });

    const extensionDefs = SHORTCUT_DEFINITIONS.filter((def) => this.isEnabled(def.category));
    const sampleDt = container.querySelector('dt');
    const sampleDd = container.querySelector('dd');
    // Only use definition list layout if dt elements exist (Perplexity uses div > dd + dl structure, not dt/dd pairs)
    const isDefinitionList = !!sampleDt;

    if (isDefinitionList) {
      const header = document.createElement('dt');
      const headerBaseClass = sampleDt?.className || 'text-token-text-tertiary';
      header.className = `${headerBaseClass} col-span-2 mt-2 empty:hidden`.trim();
      header.textContent = t('shortcut_panel_section_title');
      header.dataset.customShortcut = 'true';
      container.appendChild(header);

      const settingsDt = document.createElement('dt');
      settingsDt.className = sampleDt?.className || 'text-token-text-secondary';
      settingsDt.textContent = t('shortcut_panel_settings_label');
      settingsDt.dataset.customShortcut = 'true';

      const settingsDd = document.createElement('dd');
      const baseDdClass = sampleDd?.className || 'text-token-text-secondary justify-self-end';
      settingsDd.className = `${baseDdClass}`.trim();
      settingsDd.dataset.customShortcut = 'true';

      const settingsLink = document.createElement('a');
      settingsLink.href = '#';
      settingsLink.textContent = t('shortcut_panel_settings_link');
      settingsLink.style.color = 'inherit';
      settingsLink.style.textDecoration = 'underline';
      settingsLink.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        void dispatchOpenSettings();
      });

      settingsDd.appendChild(settingsLink);
      container.appendChild(settingsDt);
      container.appendChild(settingsDd);

      extensionDefs.forEach((def: ShortcutDefinitionWithCategory) => {
        const bindings = this.getDisplayBindings(def);
        if (!bindings.length) return;

        const labelDt = document.createElement('dt');
        labelDt.className = sampleDt?.className || 'text-token-text-secondary';
        labelDt.textContent = t(def.labelMessageId);
        labelDt.dataset.customShortcut = 'true';

        const keysDd = document.createElement('dd');
        const keysClass = sampleDd?.className || 'text-token-text-secondary justify-self-end';
        keysDd.className = `${keysClass} flex items-center gap-2`.trim();
        keysDd.dataset.customShortcut = 'true';

        bindings.forEach((binding, index) => {
          const group = this.createKeyGroup(this.bindingToTokens(binding));
          if (index > 0) {
            const sep = document.createElement('span');
            sep.className = 'mx-1';
            sep.textContent = '/';
            keysDd.appendChild(sep);
          }
          keysDd.appendChild(group);
        });

        container.appendChild(labelDt);
        container.appendChild(keysDd);
      });
    } else {
      // Perplexity uses div > dd + dl structure (not dt/dd pairs)
      const addRow = (
        label: string,
        tokenGroups: string[][],
        options: { onClick?: () => void; linkLabel?: string } = {},
      ) => {
        const row = document.createElement('div');
        row.className =
          'py-md flex place-content-between items-center font-sans text-base text-quiet selection:bg-super/50 selection:text-foreground dark:selection:bg-super/10 dark:selection:text-super';
        row.dataset.customShortcut = 'true';

        const name = document.createElement('dd');
        name.className =
          'line-clamp-1 overflow-hidden text-clip font-sans text-sm text-quiet selection:bg-super/50 selection:text-foreground dark:selection:bg-super/10 dark:selection:text-super';
        name.textContent = label;

        row.appendChild(name);

        if (options.linkLabel) {
          // For settings link, use a simple dl with link inside
          const keysContainer = document.createElement('dl');
          keysContainer.className =
            'space-x-two flex items-center border-subtlest ring-subtlest divide-subtlest bg-transparent';

          const link = document.createElement('a');
          link.href = '#';
          link.textContent = options.linkLabel;
          link.style.color = 'inherit';
          link.style.textDecoration = 'underline';
          link.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            options.onClick?.();
          });
          keysContainer.appendChild(link);
          row.appendChild(keysContainer);
        } else {
          // For keyboard shortcuts, create dl with key divs directly (matching Perplexity's structure)
          const keysContainer = document.createElement('dl');
          keysContainer.className =
            'space-x-two flex items-center border-subtlest ring-subtlest divide-subtlest bg-transparent';

          tokenGroups.forEach((tokens, groupIndex) => {
            if (groupIndex > 0) {
              const sep = document.createElement('span');
              sep.className = 'mx-1 text-quiet';
              sep.textContent = '/';
              keysContainer.appendChild(sep);
            }
            tokens.forEach((token) => {
              const keyDiv = document.createElement('div');
              keyDiv.className =
                'px-xs flex h-5 min-w-5 items-center justify-center rounded border font-mono border-subtlest ring-subtlest divide-subtlest bg-transparent';
              keyDiv.textContent = token;
              keysContainer.appendChild(keyDiv);
            });
          });

          row.appendChild(keysContainer);
        }

        container.appendChild(row);
      };

      addRow(t('shortcut_panel_settings_label'), [], {
        onClick: () => dispatchOpenSettings(),
        linkLabel: t('shortcut_panel_settings_link'),
      });

      extensionDefs.forEach((def: ShortcutDefinitionWithCategory) => {
        const bindings = this.getDisplayBindings(def);
        if (!bindings.length) return;
        const tokenGroups = bindings.map((binding) => this.bindingToTokens(binding));
        addRow(t(def.labelMessageId), tokenGroups);
      });
    }
  }
}
