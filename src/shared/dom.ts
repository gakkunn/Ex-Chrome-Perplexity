/**
 * Utility functions for Perplexity enhancement
 */

/**
 * Performs a strong programmatic click with pointer and mouse events
 * @param el - The element to click
 */
export function strongClick(el: Element | null): void {
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  const mouseInit: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    view: window,
  };

  const pointerInit: PointerEventInit = {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
  };

  try {
    if (typeof PointerEvent !== 'undefined') {
      el.dispatchEvent(new PointerEvent('pointerover', pointerInit));
      el.dispatchEvent(new PointerEvent('pointerenter', pointerInit));
    }
    el.dispatchEvent(new MouseEvent('mouseover', mouseInit));
    el.dispatchEvent(new MouseEvent('mouseenter', mouseInit));

    if (typeof PointerEvent !== 'undefined') {
      el.dispatchEvent(new PointerEvent('pointerdown', { ...pointerInit, buttons: 1 }));
    }
    el.dispatchEvent(new MouseEvent('mousedown', { ...mouseInit, buttons: 1 }));

    if ('focus' in el && typeof el.focus === 'function') {
      (el as HTMLElement).focus({ preventScroll: true });
    }

    if (typeof PointerEvent !== 'undefined') {
      el.dispatchEvent(new PointerEvent('pointerup', pointerInit));
    }
    el.dispatchEvent(new MouseEvent('mouseup', mouseInit));
    el.dispatchEvent(new MouseEvent('click', mouseInit));
  } catch (e) {
    console.warn('strongClick failed, fallback to .click()', e);
    if ('click' in el && typeof el.click === 'function') {
      (el as HTMLElement).click();
    }
  }
}

/**
 * Retrieves the main contenteditable input field
 */
export function getInputField(): HTMLElement | null {
  return document.querySelector<HTMLElement>('div#ask-input[contenteditable="true"]');
}

/**
 * Easing function for smooth animations
 * @param t - Progress value between 0 and 1
 * @returns Eased progress value
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Gets the scrollable container element
 * @returns The scrollable container element
 */
export function getScrollContainer(): Element {
  const container = document.querySelector('div.scrollable-container.basis-0.overflow-auto');
  if (container) return container;

  const huge =
    document.querySelector('div[data-test-id="chat-history-container"]') ||
    document.querySelector('div.chat-history');

  if (huge) {
    let cur: Element | null = huge;
    while (cur && cur !== document.body) {
      const style = getComputedStyle(cur as HTMLElement);
      const overflowY = style.overflowY;
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        cur.scrollHeight > cur.clientHeight + 8
      ) {
        return cur;
      }
      cur = cur.parentElement;
    }
  }

  return document.scrollingElement || document.documentElement || document.body;
}

/**
 * Checks if the given element is an input field
 * @param element - The element to check
 * @returns True if the element is an input field
 */
export function isInInputField(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName?.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  if ((element as HTMLElement).isContentEditable) return true;
  if ('closest' in element && element.closest('[contenteditable="true"]')) return true;

  return false;
}

/**
 * Animates scroll to target position
 * @param container - The container to scroll
 * @param targetTop - Target scroll position
 * @param duration - Animation duration in milliseconds
 */
export function animateScroll(container: Element, targetTop: number, duration: number): void {
  const start = container.scrollTop;
  const change = targetTop - start;
  const startTime = performance.now();

  function animate(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeInOutQuad(progress);

    container.scrollTop = start + change * easeProgress;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

/**
 * Waits for an element to appear in the DOM
 * @param selector - CSS selector or predicate function
 * @param options - Wait options
 * @returns Promise that resolves with the element or null if timeout
 */
export function waitForElement<T extends Element = Element>(
  selector: string | (() => T | null),
  options: { maxAttempts?: number; interval?: number; visible?: boolean } = {},
): Promise<T | null> {
  const { maxAttempts = 20, interval = 80, visible = false } = options;

  return new Promise((resolve) => {
    let attempts = 0;

    const check = (): void => {
      attempts++;

      const element =
        typeof selector === 'string' ? document.querySelector<T>(selector) : selector();

      if (element) {
        if (visible && !isElementVisible(element)) {
          if (attempts >= maxAttempts) {
            resolve(null);
            return;
          }
          setTimeout(check, interval);
          return;
        }
        resolve(element);
        return;
      }

      if (attempts >= maxAttempts) {
        resolve(null);
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });
}

/**
 * Checks if an element is visible
 * @param element - The element to check
 * @returns True if the element is visible
 */
export function isElementVisible(element: Element): boolean {
  const style = window.getComputedStyle(element as Element);
  if (style.visibility === 'hidden' || style.display === 'none') return false;
  if (Number.parseFloat(style.opacity) === 0) return false;

  const rect = (element as Element).getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Finds an element by text content
 * @param elements - Array of elements to search
 * @param pattern - Text pattern to match (string or regex)
 * @returns The first matching element or null
 */
export function findElementByText<T extends Element>(
  elements: T[],
  pattern: string | RegExp,
): T | null {
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
  return elements.find((el) => regex.test(el.textContent || '')) || null;
}
