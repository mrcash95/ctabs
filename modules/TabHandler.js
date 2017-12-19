//Initialize the global CTabs namespace
CTabs = chrome.extension.getBackgroundPage().CTabs;

/**
 <p>The TabHandler is responsible for actual tab operations, like capturing
 or injecting the overlay.</p>
 @class

*/
CTabs.TabHandler = new function () {}

/**
 @function
 @description Captures a screenshot of the window with the given ID. This funciton
 	returns a capture object immediately, which will then be filled with the capture
 	data asynchronously.
 @param {Integer} windowId The id of the window to capture the active tab from
 @param {Boolean} cutImmediately If true, the capture will be cut into pieces immediately
 	(useful if you need it right away), otherwise cutting will not be started and
 	must be triggered again later.
 @returns {Capture} The capture object, which will be filled with the capture data
*/
CTabs.TabHandler.captureTab = function (windowId, cutImmediately) {
    //TODO also capture favicon 
    //TODO remove injected image before taking a re-capture (otherwise the red will be 
    //	double overlayed)
    //TabShots.Logger.error("Timestamp start capturing: " + (new Date().getTime()));
    var capture = new CTabs.Capture(cutImmediately);
    chrome.tabs.query({
        "active": true,
        "windowId": windowId
    }, function (id, intCapture) {
        return function (tabs) {
            var tab = tabs[0];
            if (tab.url && !/^chrome/.test(tab.url)) {
                chrome.tabs.captureVisibleTab(id, null, function (c) {
                    return function (dataUrl) {
                        c.storeCaptureData(dataUrl);
                        //TabShots.Logger.error("Timestamp stop capturing: " + (new Date().getTime()));
                    }
                }(intCapture));
            } else {
                CTabs.Logger.debug("Marking tab as invalid: " + tab.id + " (" + (tab.url && !/^chrome/.test(tab.url)) + ", " + tab.url + ")");
                capture.markAsInvalid();
            }
        }
    }(windowId, capture));
    return capture;
}

/**
 @function
 @description Compares the given captures, calculates the difference and processes
 	the result (e.g. by injecting an overlay and storing the data)
 @param {Integer} tabId The id of the tab to process the captures for
 @param {Capture} baseCapture The base image of the tab
 @param {Capture} newCapture The newly taken capture of the tab
*/
CTabs.TabHandler.processCaptures = function (tabId, baseCapture, newCapture) {
    //Wait until the captures are ready before they can be processed
    if (baseCapture.isReady() && newCapture.isReady()) {
        //CTabs.Logger.error("Timestamp start processing: " + (new Date().getTime()));
        var start = new Date().getTime();
        var difference = CTabs.ComparatorExactMatch.calculateDifference(baseCapture, newCapture);
        var end = new Date().getTime();
        //CTabs.Logger.error("COMPARISON TIME: " + (end - start));

        CTabs.TabStore.storeResult(tabId, difference);

        var start2 = new Date().getTime();
        var skor = CTabs.TabHandler.adaptChrome(tabId, difference);
        skor=skor.toFixed(2);
        alert('The percentage of changes of this web page is ' + skor +'%');
        
        if(skor>10){
            
                alert('Dear user, Tabnabbing attack might be attempted in this website because the changes is '+skor +'%. Please check the color of CTabs icon. If the color is YELLOW or RED, please be careful in submitting your data.' );
            
                   
                   }
        
        CTabs.TabHandler.injectImage(tabId, difference);
        
        
        
        var end = new Date().getTime();
        //CTabs.Logger.error("BROWSER UPDATE TIME: " + (end - start2));

        var end = new Date().getTime();
        //CTabs.Logger.error("PROCESSING TIME: " + (end - start));
        //CTabs.Logger.error("Timestamp finished: " + (new Date().getTime()));
    } else {
        CTabs.Logger.debug("Captures not ready yet: " + baseCapture.isReady() + " and " + newCapture.isReady());
        setTimeout(function (id, bc, nc) {
            return function () {
                CTabs.TabHandler.processCaptures(id, bc, nc);
            }
        }(tabId, baseCapture, newCapture), 25);
        //CTabs.Logger.error("SLEEPY TIME: 25");
    }
}

/**
 @function
 @description Adapts the browser chrome of the extension using the provided results.
 @param {Integer} tabId The id of the tab to which the result applies
 @param {CaptureResult} result The result of a capture comparison
*/
CTabs.TabHandler.adaptChrome = function (tabId, result) {
    var score = result.getScore();
    var color = [255, 0, 0, 200]; //Default is bad = red
    if (score <= 10) {
        //Probably ok
        color = [0, 255, 0, 200]; //green
    } else if (score <= 40) {
        //Questionable
        color = [255, 255, 0, 200]; //yellow
    }

    //TODO color the entire icon, or is this sufficient?
    chrome.browserAction.setBadgeText({
        "text": "   "
    });
    chrome.browserAction.setBadgeBackgroundColor({
        "tabId": tabId,
        "color": color
    });
    return score; 
    
}

/**
 @function
 @description Injects an overlay of the provided results into the page
 @param {Integer} tabId The id of the tab to which the result applies
 @param {CaptureResult} result The result of a capture comparison
*/
CTabs.TabHandler.injectImage = function (tabId, result) {
    //TODO CSS is applied at the correct position, but does not yet scroll --> enable scroll events
    CTabs.Logger.debug("Injecting capture image into tab");
    var script = "var img = document.createElement('img');" +
        "img.src = '" + result.getOverlayDataUrl() + "';" +
        "var left = document.body.scrollLeft;" +
        "var top = document.body.scrollTop;" +
        "img.setAttribute('style', 'position: fixed; left: 0; top: 0; overflow: hidden; z-index: 999; pointer-events: none;');" +
        "img.setAttribute('id', 'CTabsoverlay');" +
        //"var element = document.getElementById('CTabsoverlay');" +

        "var d1 = document.createElement('div'); d1.id = 'secret_sauce';" +
        //					"d1.setAttribute('style, 'position: f');" +
        "d1.appendChild(img);" +
        "document.body.appendChild(d1);" +
        "delete document.body.addEventListener;" +
        "img.addEventListener('DOMNodeRemoved', function (ev){ " +
        "alert('This page is actively trying to sabotage CTabs. DO NOT trust it with your data');},false);";

    chrome.tabs.executeScript(tabId, {
        "code": script
    });

}