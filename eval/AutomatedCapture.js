//Initialize the global CTabs namespace
CTabs = chrome.extension.getBackgroundPage().CTabs;

/**
 <p>TODO.</p>
 @class
*/
CTabs.AutomatedCapture = new function () {
    this.urls = [];
    this.index = 0;
    this.chunkSize = 10;
    this.openedTabs = [];
    this.loadingTimeout = 60000;
    /** 
    need to  understand this part 
    
    this.storageUrl = "http://testsrv1.example.com/TabShots/store.php"; //TODO make this configurable
    **/
    this.sequence = 0;
}

CTabs.AutomatedCapture.initialize = function (urls, startSequence) {
    this.urls = urls;

    CTabs.Logger.info("Starting Automated Capture");

    this.index = 0;
    this.openedTabs = [];
    this.sequence = startSequence;

    //Remove already registered event handlers
    chrome.tabs.onCreated.removeListener(CTabs.TabEventDispatcher.onCreateTab);
    chrome.tabs.onActivated.removeListener(CTabs.TabEventDispatcher.onActivateTab);
    chrome.tabs.onRemoved.removeListener(CTabs.TabEventDispatcher.onRemoveTab);
    chrome.tabs.onUpdated.removeListener(CTabs.TabEventDispatcher.onUpdateTab);
    chrome.tabs.onHighlighted.removeListener(CTabs.TabEventDispatcher.onHighlightTab);
    chrome.tabs.onAttached.removeListener(CTabs.TabEventDispatcher.onAttachTab);
    chrome.tabs.onDetached.removeListener(CTabs.TabEventDispatcher.onDetachTab);
    chrome.tabs.onMoved.removeListener(CTabs.TabEventDispatcher.onMoveTab);

    //Register the needed event handler
    chrome.tabs.onUpdated.addListener(CTabs.AutomatedCapture.handleTabUpdate);

    CTabs.Logger.info("Event handlers setup complete");
    CTabs.AutomatedCapture.captureNext();
}

CTabs.AutomatedCapture.shutdown = function () {
    chrome.tabs.onUpdated.removeListener(CTabs.AutomatedCapture.handleTabUpdate);

    //Register the normal event handlers
    chrome.tabs.onCreated.addListener(CTabs.TabEventDispatcher.onCreateTab);
    chrome.tabs.onActivated.addListener(CTabs.TabEventDispatcher.onActivateTab);
    chrome.tabs.onRemoved.addListener(CTabs.TabEventDispatcher.onRemoveTab);
    chrome.tabs.onUpdated.addListener(CTabs.TabEventDispatcher.onUpdateTab);
    chrome.tabs.onHighlighted.addListener(CTabs.TabEventDispatcher.onHighlightTab);
    chrome.tabs.onAttached.addListener(CTabs.TabEventDispatcher.onAttachTab);
    chrome.tabs.onDetached.addListener(CTabs.TabEventDispatcher.onDetachTab);
    chrome.tabs.onMoved.addListener(CTabs.TabEventDispatcher.onMoveTab);
}

CTabs.AutomatedCapture.captureNext = function () {
    if (this.index < this.urls.length) {
        if (this.openedTabs.length < this.chunkSize) {
            this.loadUrl(this.urls[this.index++], this.sequence++);
        } else {
            CTabs.Logger.debug("Maximum number of open tabs reached (" + this.chunkSize + ")");

            //Check to see if there are loaded tabs that can be recaptured and closed
            this.recaptureTab();
        }
    } else {
        if (this.openedTabs.length > 0) {
            CTabs.Logger.info("All URLS loaded, waiting for tabs to finish")
            setTimeout(function () {
                //Recheck length, to see whether they have closed already
                if (CTabs.AutomatedCapture.openedTabs.length == 0) {
                    CTabs.AutomatedCapture.shutdown();
                } else {
                    CTabs.AutomatedCapture.recaptureTab()
                }
            }, 1000);
        } else {
            CTabs.Logger.info("Automated capture finished!");
            this.shutdown();
        }
    }
}

CTabs.AutomatedCapture.loadUrl = function (url, sequence) {
    if (url.indexOf("http") != 0) {
        url = "http://" + url;
    }

    CTabs.Logger.info("Loading url: " + url);
    chrome.windows.create({
        "url": url,
        "focused": false
    }, function (internalUrl, internalSequence) {
        return function (window) {
            CTabs.Logger.debug("Window ID: " + window.id + " (" + url + ")");
            CTabs.AutomatedCapture.openedTabs.push({
                "id": window.id,
                "url": internalUrl,
                "sequence": internalSequence,
                "status": "created"
            });
        }
    }(url, sequence));
}

CTabs.AutomatedCapture.recaptureTab = function () {
    //Find tab we can recapture and close
    for (var i = 0; i < CTabs.AutomatedCapture.openedTabs.length; i++) {
        var tab = CTabs.AutomatedCapture.openedTabs[i];
        if (tab.status == "complete") {
            tab.status = "recapture";
            CTabs.Logger.info("Re-capturing tab: " + tab.url);
            CTabs.AutomatedCapture.captureAndStore(tab.id, false, 0);
            break;
        }
    }
}

CTabs.AutomatedCapture.storeResult = function (name, error, initial, data) {
    function pad(x) {
        var s = "" + x;
        while (s.length < 6) {
            s = "0" + s;
        }
        return s;
    }

    CTabs.Logger.debug("Storing result: " + name + " - " + error + " - " + initial);

    var ts = new Date().getTime();
    var url = CTabs.AutomatedCapture.storageUrl + "?filename=" + pad(name) + "_" + ts;
    initial == true ? url += "_initial" : url += "_completed";
    error == true ? url += "_error" : true;

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                CTabs.Logger.info("Stored result for " + name);
            } else {
                CTabs.Logger.error("Failed to store data for: " + name + " (status: " + xhr.status + ")");
            }
        }
    }
    xhr.send(data);
}

CTabs.AutomatedCapture.captureAndStore = function (windowId, initialCapture, delay) {
    function capture(windowId, initialCapture) {
        chrome.tabs.captureVisibleTab(windowId, {
            "format": "png"
        }, function (windowId, internalCapture) {
            return function (dataUrl) {
                var tabInfo = TabShots.AutomatedCapture.getTabInfo(windowId);

                if (tabInfo != null) {
                    //Store the data URL in a local file
                    CTabs.AutomatedCapture.storeResult(tabInfo.sequence, false, internalCapture, dataUrl)

                    if (!initialCapture) {
                        //This is a recapture, so we can close the tab now
                        CTabs.Logger.debug("Removing window: " + windowId);
                        chrome.windows.remove(windowId, function (internalWindowId) {
                            return function () {
                                CTabs.Logger.debug("Removed tab: " + internalWindowId);
                                //After removing it, remove it from the openedTabs array
                                var tab = CTabs.AutomatedCapture.removeTabInfo(internalWindowId);
                                if (tab.timeout) {
                                    clearTimeout(tab.timeout);
                                }
                            }
                        }(windowId));
                    }

                    //Jump to the next one
                    CTabs.AutomatedCapture.captureNext();
                } else {
                    CTabs.Logger.error("No tabinfo found for tabId " + windowId);
                }
            }
        }(windowId, initialCapture));
    }

    if (delay > 0) {
        setTimeout(function (windowId, initialCapture) {
            return function () {
                capture(windowId, initialCapture)
            }
        }(windowId, initialCapture), delay);
    } else {
        capture(windowId, initialCapture);
    }
}

CTabs.AutomatedCapture.getTabInfo = function (id) {
    for (var i = 0; i < CTabs.AutomatedCapture.openedTabs.length; i++) {
        var tab = CTabs.AutomatedCapture.openedTabs[i];
        if (tab.id == id) {
            return tab;
        }
    }
    return null;
}

CTabs.AutomatedCapture.removeTabInfo = function (id) {
    for (var i = 0; i < CTabs.AutomatedCapture.openedTabs.length; i++) {
        var tab = CTabs.AutomatedCapture.openedTabs[i];
        if (tab.id == id) {
            var result = CTabs.AutomatedCapture.openedTabs.splice(i, 1);
            return result[0];
        }
    }
}

CTabs.AutomatedCapture.handleTabUpdate = function (tabId, changeInfo, tab) {
    if (tab.url && !/^chrome/.test(tab.url)) {
        if (changeInfo.status == "loading") {
            var tabInfo = CTabs.AutomatedCapture.getTabInfo(tab.windowId);
            if (tabInfo != null && tabInfo.status == "created") {
                //Register a timeout handler in case loading reaches the timeout value
                var timeout = setTimeout(function (id) {
                    return function () {
                        var tab = CTabs.AutomatedCapture.getTabInfo(id);
                        CTabs.Logger.warn("Loading timeout reached: " + tab.url);

                        //Store an error
                        CTabs.AutomatedCapture.storeResult(tab.sequence, true, false, "Timeout")

                        //Remove the tab
                        CTabs.Logger.debug("Removing tab: " + id);
                        chrome.windows.remove(id, function (internalWindowId) {
                            return function () {
                                //After removing it, remove it from the openedTabs array
                                CTabs.AutomatedCapture.removeTabInfo(internalWindowId);
                            }
                        }(id));

                        //Jump to the next one
                        CTabs.AutomatedCapture.captureNext();
                    }
                }(tab.windowId), CTabs.AutomatedCapture.loadingTimeout);

                //Store the timeout value
                CTabs.Logger.debug("Setting timeout: " + tab.windowId + " - " + timeout);
                tabInfo.timeout = timeout;
            }
        } else if (changeInfo.status == "complete") {
            try {
                var tabInfo = CTabs.AutomatedCapture.getTabInfo(tab.windowId);
                if (tabInfo != null) {
                    tabInfo.status = "complete";

                    CTabs.Logger.info("Capturing tab: " + tabInfo.url);
                    CTabs.AutomatedCapture.captureAndStore(tabInfo.id, true, 1000);
                } else {
                    CTabs.Logger.error("No tabinfo found for tabid " + tabInfo.id);
                }
            } catch (e) {
                CTabs.Logger.error("Failure occurred while capturing tab: " + e.message);
            }
        }
    }
}