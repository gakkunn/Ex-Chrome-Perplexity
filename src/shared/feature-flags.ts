export type FeatureCategory = 'vimScroll' | 'wideScreen' | 'safeSend' | 'otherShortcuts';

export type FeatureToggles = Record<FeatureCategory, boolean>;

export const DEFAULT_FEATURE_TOGGLES: FeatureToggles = {
  vimScroll: true,
  wideScreen: true,
  safeSend: true,
  otherShortcuts: true,
};

export function applyDocumentFeatureFlags(
  toggles: FeatureToggles,
  root: HTMLElement = document.documentElement,
): void {
  if (!root) return;
  if (toggles.wideScreen) {
    root.setAttribute('data-perplexity-wide', 'true');
  } else {
    root.removeAttribute('data-perplexity-wide');
  }
}
