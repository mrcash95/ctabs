//Initialize the global CTabs namespace
CTabs = chrome.extension.getBackgroundPage().CTabs;

/**
 <p>The TabStore is responsible for storing information about tabs (currently active,
 captures, result, ...)</p>
 @class

 @property {Object} tabs An associative array with tabId for keys and data objects
 	with captures and result as values
 @property {Object} activeTabs An associative array with windowId for keys and
 	the id of the active tab as values
 @property {Object} removedTabs An associative array with tabId for keys and deleted 
 	data objects with captures and result as values
*/
CTabs.TabStore = new function() {
	this.tabs = {};
	this.activeTabs = {};
	this.removedTabs = {};
}

/**
 @function
 @description Marks the tab with the given id as active in the window with the given id
 @param {Integer} tabId The id of the tab
 @param {Integer} windowId The id of the window
*/
CTabs.TabStore.activateTab = function(tabId, windowId) {
	this.activeTabs[windowId] = tabId;
}

/**
 @function
 @description Checks whether the tab with the given id is the active tab
 	in the window with the given id.
 @param {Integer} tabId The id of the tab
 @param {Integer} windowId The id of the window
 @returns {Boolean} True if the tab is active, false otherwise
*/
CTabs.TabStore.isActiveTab = function(tabId, windowId) {
	//TODO check what happens with the timer if we move a tab between windows
	if(typeof this.activeTabs[windowId] != "undefined") {
		return this.activeTabs[windowId] == tabId;
	}
	else {
		return false;
	}
}

/**
 @function
 @description Removes the data for the given tabId to the list of removed data,
 	where it is kept until it is finally removed
 @param {Integer} tabId The id of the tab data to remove
*/
CTabs.TabStore.removeTab = function(tabId) {
	if(typeof this.tabs[tabId] != "undefined" && this.tabs[tabId] != null) {
		this.removedTabs[tabId] = this.tabs[tabId];
		delete this.tabs[tabId];
	}
}

/**
 @function
 @description Checks whether the tab data with the given id has been marked
 	as removed, but is not yet finally removed.
 @param {Integer} tabId The id of the tab data to remove
 @returns {Boolean} True if the tab data is in the list of removed data, false otherwise
*/
CTabs.TabStore.isRemoved = function(tabId) {
	return (typeof this.removedTabs[tabId] != "undefined");
}

/**
 @function
 @description Removes the data for the given tabId from the list of removed tabs,
 	so the data is deleted from memory.
 @param {Integer} tabId The id of the tab data to remove
*/
CTabs.TabStore.finallyRemove = function(tabId) {
	if(typeof this.removedTabs[tabId] != "undefined") {
		delete this.removedTabs[tabId];
	}
}

/**
 @function
 @description Returns the latest capture for the tab with the given id.
 @param {Integer} tabId The id of the tab data get the capture for
 @returns {Capture} The latest capture if found, null otherwise
*/
CTabs.TabStore.getCapture = function(tabId) {
	var result = null;
	if(typeof this.tabs[tabId] != "undefined" && this.tabs[tabId] != null) {
		if(this.tabs[tabId]["capture"] != null) {
			result = this.tabs[tabId]["capture"];
		}
	}
	return result;
}

/**
 @function
 @description Returns the latest result for the tab with the given id.
 @param {Integer} tabId The id of the tab to get the result for
 @returns {CaptureResult} The result if found, null otherwise
*/
CTabs.TabStore.getResult = function(tabId) {
	var result = null;
	if(typeof this.tabs[tabId] != "undefined" && this.tabs[tabId] != null) {
		if(this.tabs[tabId]["result"] != null) {
			result = this.tabs[tabId]["result"];
		}
	}
	return result;
}

/**
 @function
 @description Stores the given capture for the tab with the given id
 @param {Integer} tabId The id of the tab to store the capture for
 @param {Capture} capture The capture to store
*/
CTabs.TabStore.storeCapture = function(tabId, capture) {
	CTabs.Logger.debug("Storing tab info: " + tabId);
	if(typeof this.tabs[tabId] == "undefined" || this.tabs[tabId] == null) {
		this.tabs[tabId] = {};
	}
	this.tabs[tabId]["capture"] = capture;
}

/**
 @function
 @description Stores the given result for the tab with the given id
 @param {Integer} tabId The id of the tab to store the capture for
 @param {CaptureResult} result The result to store
*/
CTabs.TabStore.storeResult = function(tabId, result) {
	if(typeof this.tabs[tabId] == "undefined" || this.tabs[tabId] == null) {
		this.tabs[tabId] = {};
	}
	CTabs.Logger.debug("Storing result for tab: " + tabId);
	this.tabs[tabId]["result"] = result;
}
