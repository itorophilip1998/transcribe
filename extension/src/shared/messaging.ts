import type { ExtensionMessage } from './types';

export function sendMessage<T = unknown>(message: ExtensionMessage): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>;
}

export function onMessage(
  handler: (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => boolean | void | Promise<void>,
): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const result = handler(message as ExtensionMessage, sender, sendResponse);
    if (result instanceof Promise) {
      result.catch((err) => {
        console.error('[mma] message handler error', err);
        sendResponse({ error: String(err) });
      });
      return true;
    }
    return result;
  });
}
