import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
});

//add a message listener
browser.runtime.onMessage.addListener((message) => {
  console.log("Message received:", message);
  return undefined;
});
