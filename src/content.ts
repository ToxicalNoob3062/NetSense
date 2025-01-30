import { sendMessageToBackground } from "./data/ipc";

let logging = false;

async function main() {
  //root without protocol
  const root = window.location.origin.replace(/^https?:\/\//, "");

  //if not in the list of top link queries, then return
  const res = (await sendMessageToBackground({
    type: "query",
    query: "toplink:get",
    params: [root],
  })) as boolean;

  if (res) return;

  // Create a script element
  var s = document.createElement("script");

  // Must be listed in web_accessible_resources in manifest.json
  s.src = chrome.runtime.getURL("src/inject.js");

  // Add the script to the DOM
  s.onload = function () {
    s.remove();
    console.log("NetSense is Proctoring... 🚀");
  };

  // Append the script to the head
  (document.head || document.documentElement).appendChild(s);

  document.addEventListener(
    "netSense",
    async (e: CustomEventInit<NetSense>) => {
      // `detail` is properly typed as `NetSense` here!
      if (logging) console.log("netsense:", e.detail);
    }
  );
}

main();

chrome.runtime.onMessage.addListener((message, _, sendMsg) => {
  (async () => {
    switch (message.from) {
      case "popup":
        switch (message.query) {
          case "match":
            const val = message.params[0];
            sendMsg(val == window.location.origin.replace(/^https?:\/\//, ""));
            break;
          case "reload":
            main();
            sendMsg(true);
            break;
          case "logging":
            logging = message.params[0];
            sendMsg(true);
            break;
        }
        break;
      default:
        console.log("Invalid message type");
        break;
    }
  })();
  return true;
});
