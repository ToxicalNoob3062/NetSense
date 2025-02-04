import browser from "webextension-polyfill";
import { scriptQueries, sublinkQueries, topLinkQueries } from "./data/usage";

browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
});

//add a message listener
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  (async () => {
    try {
      const msg = message;
      switch (msg.type) {
        case "query":
          switch (msg.query) {
            case "toplink:get":
              const [root] = msg.params;
              const tld = await topLinkQueries.get(root);
              sendResponse(tld);
              break;
            case "sublink:get":
              const [composite] = msg.params;
              const sublink = await sublinkQueries.get(composite);
              sendResponse(sublink);
              break;
            case "script:content":
              const [script] = msg.params;
              const scriptContent = await scriptQueries.get(script);
              sendResponse(scriptContent);
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
