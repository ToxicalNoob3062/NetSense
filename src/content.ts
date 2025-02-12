import { sendMessageToBackground } from "./data/ipc";
import { TopLink, Sublink } from "./data/query";
import { NetSense } from "./inject";

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

  const sublinks = topLink.sublinks || [];

  //if an script element with id `netsense` doesn't exist inject it
  if (!document.getElementById("netsense")) {
    var s = document.createElement("script");
    s.id = "netsense";
    s.src = chrome.runtime.getURL("src/inject.js");
    s.onload = () => {
      console.log("NetSense is Proctoring...🚀");
    };
    (document.head || document.documentElement).appendChild(s);
  }

  //if already an event listener is attached to the document on `netSense` event, then remove it
  document.removeEventListener("netSense", () => {});

  //then we are free to attach a new event listener
  document.addEventListener(
    "netSense",
    async (e: CustomEventInit<NetSense>) => {
      // `detail` is properly typed as `NetSense` here!
      if (logging) console.log("netsense:", e.detail);

      if (e.detail) {
        //matched sublinks
        const mactchedSublinks = sublinks.filter((sublink) => {
          return (e.detail as NetSense).url.startsWith(sublink);
        });

        mactchedSublinks.forEach(async (selectedSublink) => {
          const sublink = (await sendMessageToBackground({
            type: "query",
            query: "sublink:get",
            params: [`${root}_${selectedSublink}`],
          })) as Sublink | undefined;

          if (!logging && sublink?.logging) console.log("netsense:", e.detail);

          //send
          if (sublink?.endpoints) {
            sendMessageToBackground({
              type: "query",
              query: "endpoints:trigger",
              params: [e.detail, sublink.endpoints],
            });
          }
        });
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
          case "reload":
            const val = message.params[0];
            if (val == window.location.origin.replace(/^https?:\/\//, "")) {
              main();
              sendMsg(true);
            }
            break;
          case "logging:set":
            logging = message.params[0];
            sendMsg(true);
            break;
          case "logging:get":
            sendMsg(logging);
            break;
        }
        break;
      default:
        sendMsg(false);
        break;
    }
  })();
  return true;
});

console.log("Content script loaded 🚀");
