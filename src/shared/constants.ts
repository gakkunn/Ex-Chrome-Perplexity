/**
 * Global constants for Perplexity enhancement
 */

/**
 * Timing constants for animations and retries
 */
export const TIMING = {
  /** Standard menu open delay */
  MENU_OPEN_DELAY: 250,
  /** Polling interval for element detection */
  POLL_INTERVAL: 80,
  /** Maximum polling attempts */
  MAX_POLL_ATTEMPTS: 20,
  /** Delay before starting element search */
  SEARCH_DELAY: 50,
  /** Focus mode retry interval */
  FOCUS_MODE_RETRY_INTERVAL: 200,
  /** Focus mode max retries */
  FOCUS_MODE_MAX_RETRIES: 10,
  /** Delete confirmation max retries */
  DELETE_CONFIRM_MAX_RETRIES: 30,
  /** Delete confirmation retry interval */
  DELETE_CONFIRM_RETRY_INTERVAL: 100,
} as const;

/**
 * Scroll behavior constants
 */
export const SCROLL = {
  /** Normal scroll step in pixels */
  STEP: 60,
  /** Repeat scroll step in pixels */
  STEP_REPEAT: 15,
  /** Continuous scroll speed */
  CONTINUOUS_SPEED: 20,
  /** Fast scroll animation duration */
  DURATION_FAST: 100,
  /** Smooth scroll animation duration */
  DURATION_SMOOTH: 200,
} as const;

/**
 * Style IDs for injected styles
 */
export const STYLE_IDS = {
  FOCUS_MODE: 'ppx-focus-style',
  CONFIRM_HIGHLIGHT: '__confirm-highlight-style',
} as const;

/**
 * CSS class names
 */
export const CSS_CLASSES = {
  FOCUS_WRAPPER: 'ppx-focus-wrapper',
  FOCUS_PANEL: 'ppx-panel',
  CONFIRM_HIGHLIGHT: '__confirm-focus-highlight',
} as const;

/**
 * Custom DOM event names
 */
export const EVENTS = {
  NAVIGATION: 'ppx-navigation',
} as const;
