//Initialize the global CTabs namespace
CTabs = chrome.extension.getBackgroundPage().CTabs;

/**
 <p>This class compares to captures to each other, and flags any differences. Each
 capture is compared cut by cut, and each cut must have an exact match to be considered
 valid.</p>
 @class
 
 @property {Array} cuts_cache A cache of overlay cuts, so they don't have to be
 	generated each time.
*/
CTabs.ComparatorExactMatch = new function() {
	this.cuts_cache = [];
}

/**
 @function
 @description Calculates the mismatch between to captures
 @param {Capture} capture1 The first capture to compare against
 @param {Capture} capture2 The capture to compare against the first
 @returns {CaptureResult} A result object containing the calculated differences
*/
CTabs.ComparatorExactMatch.calculateDifference = function(capture1, capture2) {
	//Counters for evaluation purposes
	var total = 0;
	var nomatch = 0;
	
	var cuts_r = [];
	var cuts_1 = capture1.cuts;
	var cuts_2 = capture2.cuts;
	for(var r = 0; r < cuts_1.length; r++) {
		var row_r = [];
		for(var c = 0; c < cuts_1[r].length; c++) {
			var cut_1 = cuts_1[r][c];
			if(r < cuts_2.length && c < cuts_2[r].length) {
				var cut_2 = cuts_2[r][c];
				var i = 0;
				for(i = 0; i < cut_1.data.length && i < cut_2.data.length; i += 4) {
					if(cut_1.data[i] !== cut_2.data[i]) break;
					if(cut_1.data[i+1] !== cut_2.data[i+1]) break;
					if(cut_1.data[i+2] !== cut_2.data[i+2]) break;
					if(cut_1.data[i+3] !== cut_2.data[i+3]) break;
				}
				
				var match = (i == cut_1.data.length && i == cut_2.data.length);
				row_r.push(this.getCut(cut_1, match));
				total++;
				if(match == false) { nomatch++; }
			}
			else {
				//Second capture does not contain a cut, insert nomatch
				row_r.push(this.getCut(cut_1, false));
				total++;
				nomatch++;
			}
		}
		cuts_r.push(row_r);
	}
	
	
	return new CTabs.CaptureResult(capture2, cuts_r, nomatch / total * 100);	
}

/**
 @private
 @function
 @description Returns an overlay cut based on the base cut
 @param {Object} cut A cut object from the image, to get sizes for the new cut
 @param {Boolean} success True if a matching cut is needed, false for a mismatching cut
 @returns {Object} An overlay cut that marks the match or mismatch
*/
CTabs.ComparatorExactMatch.getCut = function(base, success) {
	//CTabs.Logger.debug("Getting cut after match: " + (success ? "no difference" : "DIFFERENCE FOUND") + ", " + base.width + "x" + base.height);
	//Check cache
	for(var i = 0; i < this.cuts_cache.length; i++) {
		var c = this.cuts_cache[i];
		if(c.width == base.width && c.height == base.height && c.success == success) {
			//CTabs.Logger.debug("Cache hit: " + c.data.data[0] + " or " + c.data.data[1]);
			return c.data;
		}
	}
	
	//No cache hit, create new one and store
	var canvas = document.createElement("canvas");
	canvas.width = base.width;
	canvas.height = base.height;
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = (success ? "rgba(0, 0, 0, 0)" : "rgba(255, 0, 0, 0.4)");
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	var cut = {	"width": canvas.width, 
				"height": canvas.height, 
				"success": success, 
				"data": ctx.getImageData(0, 0, canvas.width, canvas.height)};
	this.cuts_cache.push(cut);
	return cut.data;
}
