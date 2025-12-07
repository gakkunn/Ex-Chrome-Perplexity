/**
 * Shortcut action functions
 */

import { TIMING, STYLE_IDS, CSS_CLASSES } from '@/shared/constants';
import { strongClick, waitForElement, isElementVisible, findElementByText } from '@/shared/dom';

function showCornerNotice(message: string): void {
  const existing = document.getElementById('__ppx-shortcut-toast');
  if (existing) {
    existing.textContent = message;
    existing.dataset.ts = Date.now().toString();
    return;
  }

  const div = document.createElement('div');
  div.id = '__ppx-shortcut-toast';
  div.textContent = message;
  div.dataset.ts = Date.now().toString();
  Object.assign(div.style, {
    position: 'fixed',
    top: '12px',
    right: '12px',
    zIndex: '2147483647',
    background: 'rgba(0,0,0,0.8)',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    pointerEvents: 'none',
    transition: 'opacity 150ms ease',
  });
  document.body.appendChild(div);

  setTimeout(() => {
    if (!div.isConnected) return;
    div.style.opacity = '0';
    setTimeout(() => div.remove(), 200);
  }, 1800);
}

/**
 * Opens a new chat (mod + Shift + O)
 */
export function openNewChat(): void {
  const btn = document.querySelector<HTMLButtonElement>('button[data-testid="sidebar-new-thread"]');
  if (!btn) {
    console.warn('[Shortcut] New Thread button not found');
    return;
  }
  strongClick(btn);
  console.log('[Shortcut] New Thread button clicked');
}

/**
 * Toggles temporary chat - switches between Account/Incognito (mod + I)
 */
export async function toggleTemporaryChat(): Promise<void> {
  const trigger = document.querySelector('[data-testid="sidebar-popover-trigger-signed-in"]');
  if (!trigger) {
    console.warn('[Shortcut] Account icon not found');
    return;
  }

  strongClick(trigger);
  console.log('[Shortcut] Opening account menu...');

  // Wait for menu to appear
  const incognitoLabel = await waitForElement<HTMLDivElement>(
    () =>
      Array.from(document.querySelectorAll<HTMLDivElement>('div.font-sans.font-medium')).find(
        (el) => /incognito/i.test(el.textContent || ''),
      ) || null,
    { maxAttempts: TIMING.MAX_POLL_ATTEMPTS, interval: TIMING.POLL_INTERVAL },
  );

  if (!incognitoLabel) {
    console.warn('[Shortcut] Incognito menu not found');
    return;
  }

  const menuRoot = incognitoLabel.closest<HTMLDivElement>('div.w-full');
  if (!menuRoot) {
    console.warn('[Shortcut] Menu container not found');
    return;
  }

  const buttons = Array.from(menuRoot.querySelectorAll<HTMLButtonElement>('button.rounded-md'));
  if (buttons.length < 2) {
    console.warn('[Shortcut] Account/Incognito buttons not found (expected 2 buttons)');
    return;
  }

  const incognitoBtn = findElementByText(buttons, /incognito/i);
  const accountBtn = buttons.find((btn) => !/incognito/i.test(btn.textContent || ''));

  if (!incognitoBtn || !accountBtn) {
    console.warn('[Shortcut] Failed to identify Account or Incognito button');
    return;
  }

  const incognitoInactive = !!incognitoBtn.querySelector('[data-state="closed"]');
  const target = incognitoInactive ? incognitoBtn : accountBtn;

  strongClick(target);
  console.log(`[Shortcut] Switched to ${incognitoInactive ? 'Incognito' : 'Account'} mode`);
}

/**
 * Ensures confirm button highlight style is injected
 */
function ensureConfirmHighlightStyle(): void {
  if (window.__confirmHighlightStyleInjected) return;

  const styleEl = document.createElement('style');
  styleEl.id = STYLE_IDS.CONFIRM_HIGHLIGHT;
  styleEl.textContent = `
    .${CSS_CLASSES.CONFIRM_HIGHLIGHT} {
      outline: 2px solid #3b82f6 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.6) !important;
      border-radius: 0.5rem !important;
      transition: box-shadow 0.15s ease-out, outline 0.15s ease-out;
    }
  `;
  document.head.appendChild(styleEl);
  window.__confirmHighlightStyleInjected = true;
}

/**
 * Attaches Enter key handler for delete confirmation
 * @param confirmBtn - The confirmation button
 */
function attachDeleteConfirmEnterHandler(confirmBtn: Element): void {
  if (window.__deleteConfirmEnterHandler) {
    window.removeEventListener('keydown', window.__deleteConfirmEnterHandler, true);
  }

  const handler = function (event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

    if (!document.body.contains(confirmBtn) || !isElementVisible(confirmBtn)) {
      window.removeEventListener('keydown', handler, true);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    console.log('[Shortcut] Enter pressed - confirming deletion');
    strongClick(confirmBtn);

    window.removeEventListener('keydown', handler, true);
  };

  window.__deleteConfirmEnterHandler = handler;
  window.addEventListener('keydown', handler, {
    capture: true,
    passive: false,
  });
}

/**
 * Focuses and highlights the delete confirmation button
 */
async function focusDeleteConfirmButton(): Promise<void> {
  ensureConfirmHighlightStyle();

  const visibleBtn = await waitForElement<HTMLButtonElement>(
    () => {
      const candidates = Array.from(
        document.querySelectorAll<HTMLButtonElement>('button[data-testid="thread-delete-confirm"]'),
      );
      return candidates.find((el) => isElementVisible(el)) || null;
    },
    {
      maxAttempts: TIMING.DELETE_CONFIRM_MAX_RETRIES,
      interval: TIMING.DELETE_CONFIRM_RETRY_INTERVAL,
    },
  );

  if (!visibleBtn) {
    console.warn('[Shortcut] Confirm button not found or not visible');
    return;
  }

  // Remove highlight from other buttons
  document
    .querySelectorAll(`.${CSS_CLASSES.CONFIRM_HIGHLIGHT}`)
    .forEach((btn) => btn.classList.remove(CSS_CLASSES.CONFIRM_HIGHLIGHT));

  try {
    visibleBtn.scrollIntoView({ block: 'center', behavior: 'smooth' });
  } catch {
    // Ignore scroll errors
  }

  setTimeout(() => {
    visibleBtn.focus({ preventScroll: true });
    visibleBtn.classList.add(CSS_CLASSES.CONFIRM_HIGHLIGHT);
    window.__deleteConfirmButton = visibleBtn;
    attachDeleteConfirmEnterHandler(visibleBtn);
    console.log('[Shortcut] Confirm button focused - press Enter to delete');
  }, TIMING.SEARCH_DELAY);
}

/**
 * Deletes the current chat (mod + Shift + Delete)
 */
export async function deleteChat(): Promise<void> {
  const actionsBtn = document.querySelector<HTMLButtonElement>(
    'button[aria-label="Thread actions"]',
  );
  if (!actionsBtn) {
    console.warn('[Shortcut] Thread actions button not found');
    return;
  }

  strongClick(actionsBtn);
  console.log('[Shortcut] Opening thread actions...');

  await new Promise((resolve) => setTimeout(resolve, TIMING.MENU_OPEN_DELAY));

  const menuItems = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  const deleteItem = findElementByText(menuItems, /delete/i);

  if (!deleteItem) {
    console.warn('[Shortcut] Delete menu item not found');
    return;
  }

  strongClick(deleteItem);
  console.log('[Shortcut] Delete clicked - waiting for confirmation dialog...');

  await focusDeleteConfirmButton();
}

/**
 * Bookmarks the current chat (mod + Shift + P)
 */
export async function bookmarkCurrentChat(): Promise<void> {
  const actionsBtn = document.querySelector<HTMLButtonElement>(
    'button[aria-label="Thread actions"]',
  );
  if (!actionsBtn) {
    console.warn('[Shortcut] Thread actions button not found');
    return;
  }

  strongClick(actionsBtn);
  console.log('[Shortcut] Opening thread actions...');

  const bookmarkItem = await waitForElement<HTMLElement>(
    () => {
      const menuItems = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
      return (
        // If already bookmarked, text may be "Bookmarked" with filled icon
        findElementByText(menuItems, /bookmarked/i) ||
        findElementByText(menuItems, /remove bookmark/i) ||
        findElementByText(menuItems, /add bookmark/i) ||
        null
      );
    },
    { maxAttempts: TIMING.MAX_POLL_ATTEMPTS, interval: TIMING.POLL_INTERVAL },
  );

  if (!bookmarkItem) {
    console.warn('[Shortcut] Bookmark menu item not found');
    return;
  }

  strongClick(bookmarkItem);
  const text = bookmarkItem.textContent || '';
  const isRemoving = /bookmarked/i.test(text) || /remove bookmark/i.test(text);
  showCornerNotice(isRemoving ? 'Remove bookmark' : 'Bookmarked');
  console.log(`[Shortcut] Bookmark ${isRemoving ? 'removed' : 'added'}`);
}

/**
 * Opens the file attachment dialog (mod + U)
 */
export async function addPhotosAndFiles(): Promise<void> {
  const attachBtn = document.querySelector<HTMLButtonElement>('button[aria-label="Attach files"]');
  if (!attachBtn) {
    console.warn('[Shortcut] Attach files button not found');
    return;
  }

  strongClick(attachBtn);
  console.log('[Shortcut] Opening attach menu...');

  const localItem = await waitForElement<HTMLElement>(
    () => {
      const menuItems = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
      return (
        findElementByText(menuItems, /local files?/i) ||
        findElementByText(menuItems, /local file/i) ||
        null
      );
    },
    { maxAttempts: TIMING.MAX_POLL_ATTEMPTS, interval: TIMING.POLL_INTERVAL },
  );

  if (!localItem) {
    console.warn('[Shortcut] Local files menu item not found');
    return;
  }

  strongClick(localItem);
  console.log('[Shortcut] Local files clicked - file dialog should open');
}
