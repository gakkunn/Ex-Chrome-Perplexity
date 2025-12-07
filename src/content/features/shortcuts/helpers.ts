/**
 * Helper functions for shortcuts functionality
 */

import { SCROLL } from '@/shared/constants';

/**
 * Scrolling state management
 */
export interface ScrollingState {
  direction: 'up' | 'down' | null;
  animationId: number | null;
  container: Element | null;
  key: string | null;
}

export const scrollingState: ScrollingState = {
  direction: null,
  animationId: null,
  container: null,
  key: null,
};

/**
 * Starts continuous scroll animation
 * @param container - The container to scroll
 * @param direction - Scroll direction
 */
export function startContinuousScroll(container: Element, direction: 'up' | 'down'): void {
  stopContinuousScroll();
  scrollingState.direction = direction;
  scrollingState.container = container;

  function scroll(): void {
    if (scrollingState.direction === direction && scrollingState.container) {
      const delta = direction === 'up' ? -SCROLL.CONTINUOUS_SPEED : SCROLL.CONTINUOUS_SPEED;
      scrollingState.container.scrollTop += delta;
      scrollingState.animationId = requestAnimationFrame(scroll);
    }
  }

  scrollingState.animationId = requestAnimationFrame(scroll);
}

/**
 * Stops continuous scroll animation
 */
export function stopContinuousScroll(): void {
  if (scrollingState.animationId !== null) {
    cancelAnimationFrame(scrollingState.animationId);
    scrollingState.animationId = null;
  }
  scrollingState.direction = null;
  scrollingState.container = null;
}

// Fail-safe: ensure continuous scroll stops when the tab is not active
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') {
      stopContinuousScroll();
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('blur', () => {
    stopContinuousScroll();
  });
}
