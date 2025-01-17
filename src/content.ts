// Create a script element
var s = document.createElement("script");

// Must be listed in web_accessible_resources in manifest.json
s.src = chrome.runtime.getURL("src/inject.js");

// Add the script to the DOM
s.onload = function () {
  s.remove();
  console.log("Script injected! 🚀");
};

// Append the script to the head
(document.head || document.documentElement).appendChild(s);
