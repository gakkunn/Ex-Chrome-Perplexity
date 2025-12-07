import { TIMING, CSS_CLASSES, EVENTS } from '@/shared/constants';
import { getInputField } from '@/shared/dom';
import { type FeatureToggles } from '@/shared/settings';

interface FocusState {
  input: HTMLElement | null;
  ac: AbortController | null;
  retryTimer: number | null;
}

export class FocusModeManager {
  private state: FocusState = { input: null, ac: null, retryTimer: null };
  private toggles: FeatureToggles;
  private navigationPatched = false;

  constructor(toggles: FeatureToggles) {
    this.toggles = toggles;
    this.patchNavigation();
    if (this.toggles.wideScreen) {
      this.trySetInputFocusEffectWithRetry();
    }
  }

  private get isSearch(): boolean {
    return location.pathname.startsWith('/search');
  }

  public updateToggles(toggles: FeatureToggles) {
    this.toggles = toggles;
    if (this.toggles.wideScreen) {
      this.trySetInputFocusEffectWithRetry();
    } else {
      this.cleanup();
    }
  }

  public toggleFocus() {
    if (!this.toggles.wideScreen) return;
    const input = getInputField();
    if (!input) return;
    const isFocused = document.activeElement === input;
    if (isFocused) {
      input.blur();
    } else {
      input.focus();
    }
  }

  private findPanel(input: HTMLElement | null): HTMLElement | null {
    if (!input) return null;

    if (this.isSearch) {
      const panel =
        input.closest<HTMLDivElement>('div.relative.rounded-2xl.ring-subtlest.divide-subtlest') ||
        input.closest<HTMLDivElement>(
          'div.relative.rounded-2xl[class*="ring-subtlest"][class*="divide-subtlest"]',
        );
      return panel;
    } else {
      const toggle = input.closest('#ppx-input-toggle-container');
      if (toggle) {
        const frame =
          toggle.closest<HTMLDivElement>(
            'div.relative.rounded-2xl[class*="ring-subtlest"][class*="divide-subtlest"]',
          ) || toggle.closest<HTMLDivElement>('div.relative.rounded-2xl');
        if (frame) {
          return frame;
        }
      }
      const fallback = input.closest<HTMLDivElement>(
        'div.relative.rounded-2xl[class*="ring-subtlest"][class*="divide-subtlest"]',
      );
      return fallback;
    }
  }

  private findContainerFromPanel(panel: HTMLElement | null): HTMLElement | null {
    if (!panel) return null;

    if (this.isSearch) {
      const container =
        panel.closest<HTMLDivElement>('div[class*="bottom-safeAreaInsetBottom"]') ||
        panel.parentElement ||
        panel;
      return container;
    } else {
      const container = panel.parentElement || panel;
      return container;
    }
  }

  private bindInputFocusEffect(input: HTMLElement | null): void {
    if (!input || !this.toggles.wideScreen) return;
    if (this.state.input === input) return;
    if (this.state.ac) {
      this.state.ac.abort();
    }

    const panel = this.findPanel(input);
    if (!panel) return;

    const container = this.findContainerFromPanel(panel);
    if (!container) return;

    container.classList.add(CSS_CLASSES.FOCUS_WRAPPER);
    panel.classList.add(CSS_CLASSES.FOCUS_PANEL);

    const ac = new AbortController();
    const { signal } = ac;

    const onFocus = (): void => {
      container.classList.add('focused');
    };

    const onBlur = (): void => {
      container.classList.remove('focused');
    };

    input.addEventListener('focus', onFocus, { signal });
    input.addEventListener('blur', onBlur, { signal });

    container.classList.toggle('focused', document.activeElement === input);
    this.state.input = input;
    this.state.ac = ac;
  }

  private trySetInputFocusEffectWithRetry(): void {
    if (!this.toggles.wideScreen) return;

    if (this.state.retryTimer !== null) {
      clearInterval(this.state.retryTimer);
    }

    let attempts = 0;
    this.state.retryTimer = window.setInterval(() => {
      if (!this.toggles.wideScreen) {
        this.stopRetry();
        return;
      }
      const input = getInputField();
      if (input || attempts >= TIMING.FOCUS_MODE_MAX_RETRIES) {
        this.stopRetry();
        if (input) {
          this.bindInputFocusEffect(input);
        }
      }
      attempts++;
    }, TIMING.FOCUS_MODE_RETRY_INTERVAL);
  }

  private stopRetry() {
    if (this.state.retryTimer !== null) {
      clearInterval(this.state.retryTimer);
      this.state.retryTimer = null;
    }
  }

  private cleanup() {
    this.stopRetry();
    if (this.state.ac) {
      this.state.ac.abort();
      this.state.ac = null;
    }
    if (this.state.input) {
      const panel = this.findPanel(this.state.input);
      const container = this.findContainerFromPanel(panel);
      container?.classList.remove(CSS_CLASSES.FOCUS_WRAPPER, 'focused');
      panel?.classList.remove(CSS_CLASSES.FOCUS_PANEL);
    }
    this.state.input = null;
  }

  private patchNavigation() {
    if (this.navigationPatched) return;
    this.navigationPatched = true;

    const handleNavigation = (): void => this.trySetInputFocusEffectWithRetry();

    window.addEventListener(EVENTS.NAVIGATION, handleNavigation);
  }
}
