//Initialize the global CTabs namespace
CTabs = chrome.extension.getBackgroundPage().CTabs;

chrome.tabs.onCreated.addListener(CTabs.TabEventDispatcher.onCreateTab);
chrome.tabs.onActivated.addListener(CTabs.TabEventDispatcher.onActivateTab);
chrome.tabs.onRemoved.addListener(CTabs.TabEventDispatcher.onRemoveTab);
chrome.tabs.onUpdated.addListener(CTabs.TabEventDispatcher.onUpdateTab);
chrome.tabs.onHighlighted.addListener(CTabs.TabEventDispatcher.onHighlightTab);
chrome.tabs.onAttached.addListener(CTabs.TabEventDispatcher.onAttachTab);
chrome.tabs.onDetached.addListener(CTabs.TabEventDispatcher.onDetachTab);
chrome.tabs.onMoved.addListener(CTabs.TabEventDispatcher.onMoveTab);

CTabs.Logger.info("Startup complete!");
