import { sendMessageToBackground } from "./data/ipc";
import { Sublink } from "./data/query";

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
      // `detail` is properly typed as `number` here!
      console.log("NetSense", e.detail);
      if (e.detail) {
        const netSense = e.detail;
        const url = netSense.url;
        //get the sublink
        const sublink = (await sendMessageToBackground({
          type: "query",
          query: "sublink:get",
          params: [`${root}_${url}`],
        })) as Sublink | undefined;
        if (sublink) {
          //if loggin is enabled
          if (sublink.logging) {
            console.log("NetSense", netSense);
          }
          // run all the scripts using webworkers
          sublink.scripts.forEach((script) => {
            console.log("running:", script);
          });
        }
      }
    }
  );
}

main();

chrome.runtime.onMessage.addListener((message, _, sendMsg) => {
  (async function () {
    switch (message.from) {
      case "popup":
        switch (message.query) {
          case "match":
            const val = message.params[0];
            sendMsg(val == window.location.origin.replace(/^https?:\/\//, ""));
            break;
          case "reload":
            main();
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
