/**
 * Window interface extensions for Perplexity enhancement
 */
declare global {
  interface Window {
    /**
     * Flag to prevent duplicate installation of Ctrl+Enter handler
     */
    __perplexityCtrlEnterHandlerInstalled?: boolean;

    /**
     * Flag to prevent duplicate installation of shortcut handler
     */
    __perplexityShortcutHandlerInstalled?: boolean;

    /**
     * Flag to track if confirm highlight style has been injected
     */
    __confirmHighlightStyleInjected?: boolean;

    /**
     * Handler for Enter key on delete confirmation dialog
     */
    __deleteConfirmEnterHandler?: (event: KeyboardEvent) => void;

    /**
     * Reference to the delete confirmation button
     */
    __deleteConfirmButton?: Element;

    /**
     * Flag to note inject navigation patch installation
     */
    __ppxNavigationPatched?: boolean;
  }
}

export {};
