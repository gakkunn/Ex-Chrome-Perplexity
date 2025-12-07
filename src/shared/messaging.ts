export const MESSAGE_ACTIONS = {
  OPEN_SETTINGS: 'openSettings',
} as const;

export type MessageAction = (typeof MESSAGE_ACTIONS)[keyof typeof MESSAGE_ACTIONS];

export interface ExtensionMessage<
  TAction extends MessageAction = MessageAction,
  TPayload = unknown,
> {
  action: TAction;
  payload?: TPayload;
}

export function sendExtensionMessage<TResponse = unknown>(
  message: ExtensionMessage,
): Promise<TResponse | undefined> {
  if (!chrome?.runtime?.sendMessage) {
    return Promise.resolve(undefined);
  }
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime?.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response as TResponse);
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

export function sendExtensionMessageNoResponse(message: ExtensionMessage): void {
  if (!chrome?.runtime?.sendMessage) {
    return;
  }
  chrome.runtime.sendMessage(message, () => {
    void chrome.runtime.lastError;
  });
}

export function openSettings(): void {
  sendExtensionMessageNoResponse({ action: MESSAGE_ACTIONS.OPEN_SETTINGS });
}
