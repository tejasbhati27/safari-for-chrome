
// background.ts

// Listener for extension installation
declare const chrome: any;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Safari Style New Tab Extension Installed');
});

// Listener for keyboard shortcuts (optional fallback)
chrome.commands.onCommand.addListener((command: string) => {
  if (command === "open_panel") {
    // Logic handled in content script via keydown listener, 
    // but this registers the intention in the background.
    console.log("Toggle command received");
  }
});
