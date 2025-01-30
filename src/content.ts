import { sendMessageToBackground } from "./data/ipc";
import { Script, Sublink, TopLink } from "./data/query";

let logging = false;

async function main() {
  //root without protocol
  const root = window.location.origin.replace(/^https?:\/\//, "");

  //if not in the list of top link queries, then return
  const topLink = (await sendMessageToBackground({
    type: "query",
    query: "toplink:get",
    params: [root],
  })) as TopLink | undefined;

  if (!topLink) return;

  //sublinks to be tracked
  const sublinks = new Set(topLink.sublinks);

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
      if (e.detail) {
        if (sublinks.has(e.detail.url)) {
          const sublink = (await sendMessageToBackground({
            type: "query",
            query: "sublink:get",
            params: [`${root}_${e.detail.url}`],
          })) as Sublink | undefined;

          if (!logging && sublink?.logging) console.log("netsense:", e.detail);

          //run all the scripts associated with the sublink
          if (sublink?.scripts) {
            for (const name of sublink.scripts) {
              const script = (await sendMessageToBackground({
                type: "query",
                query: "script:content",
                params: [name],
              })) as Script | undefined;

              console.log(script?.content);

              //now i have to pass the e.target to the script as arguement and run it in a worker
              //and send it output to background scripts like the logs and other stuffs that will be made by the script
            }
          }
        }
      }
    }
  );
}

main();

//listen for messages from popup
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
