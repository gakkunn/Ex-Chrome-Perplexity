/**
 * UI update functionality for shortcuts dialog
 */

import { t } from '@/shared/i18n';
import { getBindingTokens } from '@/shared/keyboard';
import { SHORTCUT_DEFINITIONS } from '@/shared/settings';

interface Shortcut {
  name: string;
  tokenGroups: string[][];
}

/**
 * Updates the shortcuts UI dialog with custom shortcuts
 */
export function updateShortcutsUI(): void {
  // Observe and dynamically update the shortcuts list
  const observer = new MutationObserver(() => {
    // Find the dialog (try multiple methods)
    const dlContainer = document.querySelector<HTMLDListElement>(
      'dl[class*="divide-y"][class*="border-subtlest"]',
    );

    if (!dlContainer) return;

    // Skip if already processed
    if (dlContainer.dataset.shortcutsUpdated === 'true') return;
    dlContainer.dataset.shortcutsUpdated = 'true';

    console.log('[Shortcuts UI] Updating shortcuts dialog...');

    // Remove all existing shortcut rows (except "Show Shortcuts")
    const allShortcutRows = Array.from(
      dlContainer.querySelectorAll<HTMLDivElement>('div[class*="py-md"]'),
    );

    allShortcutRows.forEach((el) => {
      const text = el.textContent || '';
      // Keep only "Show Shortcuts", remove others
      if (!/show shortcuts/i.test(text)) {
        el.remove();
      }
    });

    // Add new shortcuts
    const newShortcuts: Shortcut[] = SHORTCUT_DEFINITIONS.map((def) => ({
      name: t(def.labelMessageId),
      tokenGroups: def.defaultBindings.map((binding) => getBindingTokens(binding)),
    }));

    newShortcuts.forEach((shortcut) => {
      const div = document.createElement('div');
      div.className =
        'py-md flex place-content-between items-center font-sans text-base text-quiet selection:bg-super/50 selection:text-foreground dark:selection:bg-super/10 dark:selection:text-super';

      const dd = document.createElement('dd');
      dd.className =
        'line-clamp-1 overflow-hidden text-clip font-sans text-sm text-quiet selection:bg-super/50 selection:text-foreground dark:selection:bg-super/10 dark:selection:text-super';
      dd.textContent = shortcut.name;

      const dl = document.createElement('dl');
      dl.className =
        'space-x-two flex items-center border-subtlest ring-subtlest divide-subtlest bg-transparent';

      shortcut.tokenGroups.forEach((tokens, groupIndex) => {
        if (groupIndex > 0) {
          const sep = document.createElement('span');
          sep.className = 'mx-1 text-quiet';
          sep.textContent = '/';
          dl.appendChild(sep);
        }
        tokens.forEach((key) => {
          const keyDiv = document.createElement('div');
          keyDiv.className =
            'px-xs flex h-5 min-w-5 items-center justify-center rounded border font-mono border-subtlest ring-subtlest divide-subtlest bg-transparent';
          keyDiv.textContent = key;
          dl.appendChild(keyDiv);
        });
      });

      div.appendChild(dd);
      div.appendChild(dl);
      dlContainer.appendChild(div);
    });

    console.log('[Shortcuts UI] Dialog updated with custom shortcuts');
  });

  // Start observing when dialog is displayed
  const observerConfig: MutationObserverInit = {
    childList: true,
    subtree: true,
    attributes: false,
  };
  observer.observe(document.body, observerConfig);
}
