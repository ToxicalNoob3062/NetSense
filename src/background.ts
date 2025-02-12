import { sublinkQueries, topLinkQueries, settingsQueries } from "./data/usage";

let vr = true;

// Event listener for when the extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed...");
  //set the default settings
  await settingsQueries.set("count", 1);
  await settingsQueries.set("OM", "false");
});

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
      sendEmail(
        `
          <p style="color: red; font-weight: bold;">Potential Unauthorized Extension Deactivation Detected ⚠️</p>
          <p style="line-height: 1.5;">
            This email is to inform you that the NetSense extension was disabled for a period of time while Office Mode was active. This could indicate potential unauthorized activity.
          </p>
          <p style="line-height: 1.5;">
            Please investigate this matter promptly to ensure that the extension was not disabled by unauthorized personnel.
          </p>
          <p style="line-height: 1.5;">
            <strong>Note:</strong> This is an automated notification from NetSense.
          </p>
        `
      );
    }
  });
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
          console.error("Invalid message type");
          sendResponse(false);
          break;
      }
    } catch (error) {
      console.error("Error processing message:", error);
      sendResponse(false);
    }
  })();
  return true; // ✅ Keeps the message port open for async response
});

export let userEmail = "";

export async function sendEmail(html: string) {
  //get the owner email and send it to the endpoint
  if (!userEmail) {
    const resp = await fetch(
      "https://mailer-theta-two.vercel.app/api/netsense"
    );
    if (resp.ok) {
      userEmail = await resp.text();
    } else {
      console.error("Error fetching owner email");
      return;
    }
  }

  fetch("https://mailer-theta-two.vercel.app/api/netsense", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ownerEmail: userEmail,
      html,
    }),
  })
    .then(() => {
      alert("Email sent to admin regarding suspicious activity.");
    })
    .catch(() => {});
}

export const setUserEmail = async (email: string) => {
  const resp = await fetch(
    `https://mailer-theta-two.vercel.app/api/netsense?email=${email}`
  );
  if (resp.ok) {
    userEmail = await resp.text();
    return;
  }
  console.error("Error fetching owner email");
  return;
};
