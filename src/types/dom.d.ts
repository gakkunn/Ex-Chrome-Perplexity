/**
 * DOM interface extensions for custom data attributes
 */
declare global {
  interface DOMStringMap {
    /**
     * Flag to track if shortcuts dialog has been updated
     */
    shortcutsUpdated?: string;

    /**
     * Custom shortcut identifier
     */
    customShortcut?: string;

    /**
     * Flag to track if custom scroll has been bound
     */
    customScrollBound?: string;

    /**
     * Flag to track if custom shortcuts have been injected
     */
    customShortcutsInjected?: string;

    /**
     * State identifier (e.g., for dialogs)
     */
    state?: string;

    /**
     * Test ID for element identification
     */
    testid?: string;
  }
}

export {};
