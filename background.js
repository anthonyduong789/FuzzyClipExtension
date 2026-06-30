chrome.action.onClicked.addListener((tab) => {
    // tab.id is the active tab the user clicked the icon while on
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PANEL" });
});        