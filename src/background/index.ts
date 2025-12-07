import { MESSAGE_ACTIONS, type ExtensionMessage } from '@/shared/messaging';

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.action !== MESSAGE_ACTIONS.OPEN_SETTINGS) return false;

  const manifest = chrome.runtime.getManifest() as chrome.runtime.ManifestV3;
  const popupEntry = manifest.action?.default_popup ?? 'popup.html';

  void chrome.tabs.create({ url: chrome.runtime.getURL(popupEntry) });

  return false;
});
