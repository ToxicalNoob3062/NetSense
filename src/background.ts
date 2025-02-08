import { sublinkQueries, topLinkQueries, settingsQueries } from "./data/usage";

let vr = true;

// Event listener for when the browser starts up
chrome.runtime.onStartup.addListener(async () => {
  console.log("Browser started...");
  vr = false;
  setTimeout(() => {
    vr = true;
  }, 2000);
});

// Event listener for when the extension is re-enabled after being suspended
chrome.management.onEnabled.addListener(async (extensionInfo) => {
  setTimeout(async () => {
    if (
      extensionInfo.shortName === "NetSense" &&
      vr &&
      (await settingsQueries.get("OM")).value === "true"
    ) {
      //get the owner email and send it to the endpoint
      const email = await settingsQueries.get("email");
      if (email) {
        fetch("https://mailer-theta-two.vercel.app/api/netsense", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ownerEmail: "rahat3062@gmail.com" }),
        }).catch(() => {});
      }
    }
  }, 1000);
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
            case "endpoints:trigger":
              const [netSense, endpointNames] = msg.params;
              //use promise all to send the netSense to all the endpoints via post
              await Promise.all(
                endpointNames?.map(async (eName: string) => {
                  await fetch(eName, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(netSense),
                  });
                })
              ).catch((error) =>
                console.error("Error triggering endpoints:", error)
              );
              sendResponse(true);
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
