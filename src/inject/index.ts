import { EVENTS } from '@/shared/constants';

(() => {
  const navEvent = EVENTS.NAVIGATION;
  const stateKey = '__ppxNavigationPatched';

  const win = window as unknown as Record<string, unknown>;
  if (win[stateKey]) return;
  win[stateKey] = true;

  const dispatchNavigation = (): void => {
    try {
      window.dispatchEvent(new Event(navEvent));
    } catch {
      // ignore dispatch errors
    }
  };

  const originalPush = history.pushState.bind(history);
  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    const result = originalPush(...args);
    dispatchNavigation();
    return result;
  };

  const originalReplace = history.replaceState.bind(history);
  history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
    const result = originalReplace(...args);
    dispatchNavigation();
    return result;
  };

  window.addEventListener('popstate', dispatchNavigation);
})();
