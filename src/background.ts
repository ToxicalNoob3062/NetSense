import browser from "webextension-polyfill";
import { sublinkQueries, topLinkQueries } from "./data/usage";

browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
});

//add a message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);
  (async () => {
    try {
      const msg = message;
      switch (msg.type) {
        case "query":
          switch (msg.query) {
            case "toplink:get":
              const [root] = msg.params;
              const tld = await topLinkQueries.get(root);
              console.log("tld", tld, tld === undefined);
              sendResponse(tld === undefined);
              break;
            case "sublink:get":
              const [composite] = msg.params;
              const sublink = await sublinkQueries.get(composite);
              sendResponse(sublink);
              break;
          }
          break;
        default:
          console.log("Invalid message type");
          sendResponse("Invalid message type");
          break;
      }
    } catch (error) {
      console.error("Error processing message:", error);
      sendResponse(null);
    }
  })();
  return true; // ✅ Keeps the message port open for async response
});
