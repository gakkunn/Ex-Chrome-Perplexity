/**
 * Vim-style scrolling functionality
 */

import { scrollingState, startContinuousScroll, stopContinuousScroll } from './helpers';

import { SCROLL } from '@/shared/constants';
import { animateScroll, getScrollContainer, isInInputField } from '@/shared/dom';

type ScrollType = 'top' | 'bottom' | 'up' | 'down' | 'halfUp' | 'halfDown';

/**
 * Handles Vim-style scroll events
 * @param e - Keyboard event
 * @param type - Type of scroll action
 */
export function handleVimScroll(e: KeyboardEvent, type: ScrollType): void {
  const activeElement = document.activeElement;
  if (isInInputField(activeElement)) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();
  if (e.stopImmediatePropagation) {
    e.stopImmediatePropagation();
  }

  const container = getScrollContainer();
  if (!container) {
    console.warn('[Vim Scroll] Scroll container not found');
    return;
  }

  let targetTop = container.scrollTop;

  switch (type) {
    case 'top':
      targetTop = 0;
      break;
    case 'bottom':
      targetTop = container.scrollHeight - container.clientHeight;
      break;
    case 'up':
      targetTop = container.scrollTop - (e.repeat ? SCROLL.STEP_REPEAT : SCROLL.STEP);
      break;
    case 'down':
      targetTop = container.scrollTop + (e.repeat ? SCROLL.STEP_REPEAT : SCROLL.STEP);
      break;
    case 'halfUp':
      targetTop = container.scrollTop - window.innerHeight / 2;
      break;
    case 'halfDown':
      targetTop = container.scrollTop + window.innerHeight / 2;
      break;
  }

  targetTop = Math.max(0, Math.min(targetTop, container.scrollHeight - container.clientHeight));

  const duration = type === 'up' || type === 'down' ? SCROLL.DURATION_FAST : SCROLL.DURATION_SMOOTH;

  if (type === 'up' || type === 'down') {
    if (e.repeat) {
      if (scrollingState.direction !== (type === 'up' ? 'up' : 'down')) {
        startContinuousScroll(container, type === 'up' ? 'up' : 'down');
        scrollingState.key = e.key;
      }
    } else {
      animateScroll(container, targetTop, duration);
      scrollingState.key = e.key;

      setTimeout(() => {
        if (scrollingState.key === e.key && scrollingState.direction === null) {
          startContinuousScroll(container, type);
        }
      }, duration);
    }
  } else {
    if (e.repeat) {
      container.scrollTop = targetTop;
    } else {
      animateScroll(container, targetTop, duration);
    }
  }
}

/**
 * Stops scrolling when key is released
 * @param e - Keyboard event
 */
export function handleVimScrollKeyUp(e: KeyboardEvent): void {
  if (e.key === scrollingState.key) {
    stopContinuousScroll();
    scrollingState.key = null;
  }
}
