import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
});

//add a message listener
browser.runtime.onMessage.addListener((message) => {
  // Assert the type of the message
  const netsense = message as NetSense;

  // fetch the function snippet code body and run the function with netsense arguement in isolation

  return undefined;
});
