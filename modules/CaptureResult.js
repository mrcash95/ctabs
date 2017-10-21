//Initialize the global CTabs namespace
CTabs = chrome.extension.getBackgroundPage().CTabs;

/**
 <p>The CaptureResult class contains the result of a comparison of captures</p>
 @class

 @param {Capture} base The base capture, used in case an overlay of two images is created
 @param {Array} cuts The array of cuts that compose the overlay of matches/mismatches
 @param {Number} score The mismatch score of the result
 
 @property {Capture} base The base capture, used in case an overlay of two images is created
 @property {Array} cuts The array of cuts that compose the overlay of matches/mismatches
 @property {Number} score The mismatch score of the result
 @property {String} overlayDataUrl The data url of the entire overlay. Is null if not initialized yet.
 @property {String} combinedDataUrl The data url of the base capture combined with the overlay. 
 	Is null if not initialized yet.
*/
CTabs.CaptureResult = function (base, cuts, score) {
    this.base = base;
    this.cuts = cuts;
    this.score = score;
    this.overlayDataUrl = null;
    this.combinedDataUrl = null;
}

/**
 @function
 @description Returns the mismatching score of this result (value between 0 and 100).
 	A lower value is better (less mismatches)
 @returns {Integer} The mismatching score
*/
CTabs.CaptureResult.prototype.getScore = function () {
    return this.score;
}

/**
 @function
 @description Returns the Data URL of the mismatching overlay of this result
 @returns {String} The data URL representing the overlay
*/
CTabs.CaptureResult.prototype.getOverlayDataUrl = function () {
    if (this.overlayDataUrl == null) {
        this.overlayDataUrl = new CTabs.RectangularCuts().composeCuts(this.cuts);
    }
    return this.overlayDataUrl;
}

/**
 @function
 @description Returns the Data URL of the base capture combined with the mismatching 
 	overlay of this result
 @returns {String} The data URL representing the overlay
*/
CTabs.CaptureResult.prototype.getCombinedDataUrl = function () {
    if (this.combinedDataUrl == null) {
        this.combinedDataUrl = new CTabs.RectangularCuts().composeCaptureAndCuts(this.base, this.cuts);
    }
    return this.combinedDataUrl;
}