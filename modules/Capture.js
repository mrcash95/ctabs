//Initialize the global CTabs namespace
CTabs = chrome.extension.getBackgroundPage().CTabs;

/**
 <p>The Capture object stores data about a capture</p>
 @class

 @param {Boolean} cutImmediately If true, a received capture image will immediately
 	be cut into pieces. Otherwise, this operation has to be triggered later on
 
 @property {Boolean} cutImmediately If true, a received capture image will immediately
 	be cut into pieces. Otherwise, this operation has to be triggered later on
 @property {String} dataUrl The data URL of the capture image. Is null if not 
 	initialized
 @property {Array} cuts An array of cuts, which resulted from cutting the capture image
 @property {Boolean} invalid Marks a capture valid or not. Invalid captures can
 	occur for URLs which are not allowed to be captured (e.g. internal pages)
*/
CTabs.Capture = function (cutImmediately) {
    this.cutImmediately = cutImmediately;
    this.dataUrl = null;
    this.cuts = [];
    this.invalid = false;
}

/**
 @function
 @description Returns whether this capture is ready to be processed
 @returns {Boolean} True if the capture is fully initialized, false otherwise
*/
CTabs.Capture.prototype.isReady = function () {
    return this.cuts.length > 0;
}

/**
 @function
 @description Cuts a capture into pieces and makes sure they are stored. Once this
 	is finished, "isReady()" will return true.
*/
CTabs.Capture.prototype.cutIntoPieces = function () {
    if (this.cuts.length == 0) {
        //CTabs.Logger.warn("Timer cut 0: " + new Date().getTime());
        new CTabs.RectangularCuts().cut(this.dataUrl, this.cuts);
        //CTabs.Logger.warn("Timer cut 1: " + new Date().getTime());	
    }
}

/**
 @function
 @description Stores the given data as the capture image, and starts cutting if
 	specified by the cutImmediately value
 @param {String} dataUrl The data URL containing the capture data.
*/
CTabs.Capture.prototype.storeCaptureData = function (dataUrl) {
    this.dataUrl = dataUrl;
    if (this.cutImmediately) {
        this.cutIntoPieces();
    }
}

/**
 @function
 @description Marks the current capture as invalid, because the visible tab could
 	not be or should not be captured (e.g. internal browser pages)
*/
CTabs.Capture.prototype.markAsInvalid = function () {
    this.invalid = true;
}

/**
 @function
 @description Returns whether the current capture is marked as invalid.
 @returns {Boolean} True if the capture is marked as invalid, false otherwise
*/
CTabs.Capture.prototype.isInvalid = function () {
    return this.invalid
}