export function sendMessageToContentScript(message: object) {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id!, message, (response) => {
        resolve(response);
      });
    });
  });
}

export function sendMessageToBackground(message: object) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
}
