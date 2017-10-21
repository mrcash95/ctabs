//Initialize the global Ctabs namespace
CTabs = chrome.extension.getBackgroundPage().CTabs;

/**
 <p>The TabEventDispatcher class is responsible for receiving all tab events and
 handling them appropriately. Typically, upon tab creation an actual tab event
 handler will be created, which deals with this tab for its lifetime.</p>
 @class
 
 @property {Integer} captureTimeout The time between two subsequent captures
*/
CTabs.TabEventDispatcher = new function () {
    this.captureTimeout = 5000;
}

/**
 @function
 @description Receives and dispatches the oncreated event
 @param {Tab} tab Details of the tab that was created
*/
CTabs.TabEventDispatcher.onCreateTab = function (tab) {
    CTabs.Logger.debug("Tab created: " + tab.id + ", " + tab.url);
    //event not needed, so handler can be removed
}

/**
 @function
 @description Receives and dispatches the onremoved event
 @param {Integer} tabId The id of the tab that was updated
 @param {Object} removeInfo Additional info about the remove event
*/
CTabs.TabEventDispatcher.onRemoveTab = function (tabId, removeInfo) {
    CTabs.Logger.debug("Tab closed: " + tabId);
    CTabs.TabStore.removeTab(tabId);
}

/**
 @function
 @description Receives and dispatches the onupdated event
 @param {Integer} tabId The id of the tab that was updated
 @param {Object} changeInfo Lists the changes to the state of the tab that was updated. 
 @param {Tab} tab The state of the tab that was updated
*/
CTabs.TabEventDispatcher.onUpdateTab = function (tabId, changeInfo, tab) {
    CTabs.Logger.debug("Tab updated: " + tabId);
}



/**
 @function
 @description Receives and dispatches the onactivated event
 @param {Object} activeInfo Information about the activated tab (tabId and windowId)
*/
CTabs.TabEventDispatcher.onActivateTab = function (activeInfo) {
    //CTabs.Logger.warn("Timer 0: " + new Date().getTime());

    CTabs.Logger.debug("Tab activated: " + activeInfo.tabId);
    CTabs.TabStore.activateTab(activeInfo.tabId, activeInfo.windowId);

    var baseCapture = CTabs.TabStore.getCapture(activeInfo.tabId);
    if (baseCapture != null && !baseCapture.isInvalid()) {
        //CTabs.Logger.error("Timestamp start: " + (new Date().getTime()));

        //Get a new capture (don't store it, because it might have changes and they need to be highlighted first)
        //Start this ASAP, because it takes the longest to achieve
        var newCapture = CTabs.TabHandler.captureTab(activeInfo.windowId, true);

        //There is a previous capture, so start cutting it
        baseCapture.cutIntoPieces();

        CTabs.TabHandler.processCaptures(activeInfo.tabId, baseCapture, newCapture);
    } else {
        CTabs.Logger.debug("No base capture found: " + activeInfo.tabId);
    }


    //Start a new timer to regularly capture the tab
    var timer = function (tabId, windowId) {
        return function () {
            if (CTabs.TabStore.isActiveTab(tabId, windowId)) {
                //var base = CTabs.TabStore.getCapture(tabId);
                //if(base == null || !base.isInvalid()) {
                var capture = CTabs.TabHandler.captureTab(windowId, false);
                CTabs.TabStore.storeCapture(tabId, capture);
                setTimeout(timer(tabId, windowId), CTabs.TabEventDispatcher.captureTimeout);
                //}
            } else {
                if (CTabs.TabStore.isRemoved(tabId)) {
                    CTabs.TabStore.finallyRemove(tabId);
                }
            }
        }
    }
    setTimeout(timer(activeInfo.tabId, activeInfo.windowId), 1000);
}

/**
 @function
 @description Receives and dispatches the ondetached event
 @param {Integer} tabId The id of the tab that was detached
 @param {Object} detachInfo Additional information about the detach event
*/
CTabs.TabEventDispatcher.onDetachTab = function (tabId, detachInfo) {
    CTabs.Logger.debug("Tab detached!");
    //event not needed, so handler can be removed
}

/**
 @function
 @description Receives and dispatches the onattach event
 @param {Integer} tabId The id of the tab that was detached
 @param {Object} attachInfo Additional information about the attach event
*/
CTabs.TabEventDispatcher.onAttachTab = function (tabId, attachInfo) {
    CTabs.Logger.debug("Tab attached!");
    //event not needed, so handler can be removed
}

/**
 @function
 @description Receives and dispatches the onhighlighted event
 @param {Object} highlightInfo Information about the highlighted tab (tabId and windowId)
*/
CTabs.TabEventDispatcher.onHighlightTab = function (highlightInfo) {
    CTabs.Logger.debug("Tab highlighted!");
    //event not needed, so handler can be removed
}

/**
 @function
 @description Receives and dispatches the onmoved event
 @param {Integer} tabId The id of the tab that was moved
 @param {Object} moveInfo Additional information about the move event
*/
CTabs.TabEventDispatcher.onMoveTab = function (tabId, moveInfo) {
    CTabs.Logger.debug("Tab moved!");
    //event not needed, so handler can be removed
}