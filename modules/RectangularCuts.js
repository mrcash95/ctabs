//Initialize the global CTabs namespace
CTabs = chrome.extension.getBackgroundPage().CTabs;

/**
 <p>This class supports cutting an image into squares of a certain size. Additonally
 recomposing methods are offered.</p>
 @class

 @property {Integer} size The size of the squares in pixels.
*/
CTabs.RectangularCuts = function() {
	this.size = 25;
}

/**
 @function
 @description Cuts the given image into pieces and stores them into the given array.
 	Cut size is determined by the class property size.
 @param {String} dataUrl The data URL containing the image data
 @param {Array} cuts The array to store the cuts in
*/
CTabs.RectangularCuts.prototype.cut = function(dataUrl, cuts) {
	var size = this.size;
	var img = new Image();

	//Use the onload handler, otherwise, the content will not yet be available
	img.onload = function() {
		var start = new Date().getTime();
		//Prepare the canvas to extract image data
		var canvas = document.createElement("canvas");
		canvas.width = img.width;
		canvas.height = img.height;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0, img.width, img.height);
	
		//Cut the canvas into pieces and store them in the cuts array
		//TODO round the last width and height to make image exact the size as the capture
		var rows = (canvas.height % size == 0 ? canvas.height / size : Math.floor(canvas.height / size) + 1);
		var cols = (canvas.width % size == 0 ? canvas.width / size : Math.floor(canvas.width / size) + 1);
		//CTabs.Logger.debug("Cutting image into pieces: " + canvas.width + "x" + canvas.height + " --> " + cols + "x" + rows);
		
		//Cut the image into pieces
		for(var r = 0; r < rows; r++) {
			var row = [];
			for(var c = 0; c < cols; c++) {
				row.push(ctx.getImageData(c * size, r * size, size, size));
			}
			cuts.push(row);
		}
		
		var end = new Date().getTime();
		//CTabs.Logger.error("CUTTING TIME: " + (end - start));
	}
	
	//Actually set the image data, triggering the onload handler
	img.src = dataUrl;
}

/**
 @function
 @description Combines the given array of cuts into one large image
 @param {Array} cuts The array of cuts to combine
 @returns {String} The data URL of the composed image
*/
CTabs.RectangularCuts.prototype.composeCuts = function(cuts) {
	var result = "";
	if(cuts.length > 0) {
		var canvas = document.createElement("canvas");
		canvas.width = cuts[0].length * this.size;
		canvas.height = cuts.length * this.size;
		var ctx = canvas.getContext("2d");
		
		for(var r = 0; r < cuts.length; r++) {
			var row = cuts[r];
			for(var c = 0; c < row.length; c++) {
				var x = c * this.size;
				var y = r * this.size;
				ctx.putImageData(row[c], x, y);
			}
		}
		
		result = canvas.toDataURL();
	}
	return result;
}

/**
 @function
 @description Combines the given capture image with the array of cuts into one large image
 @param {Capture} base The base capture to add the overlay to
 @param {Array} cuts The array of cuts to combine
 @returns {String} The data URL of the composed image
*/
CTabs.RectangularCuts.prototype.composeCaptureAndCuts = function(base, cuts) {
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");
	var basecuts = base.cuts;
	var captcuts = cuts;
	canvas.height = basecuts.length * this.size;
	canvas.width = basecuts[0].length * this.size;
	for(var r = 0; r < basecuts.length; r++) {
		for(var c = 0; c < basecuts[r].length; c++) {	
			var basedata = basecuts[r][c].data;
			var captdata = captcuts[r][c].data;
		
			//alpha compositing (http://en.wikipedia.org/wiki/Alpha_compositing)
			var newdata = new Uint8ClampedArray(captdata.length);
			for(var i = 0; i < captdata.length; i+=4) {
				var basealpha = basedata[i+3] / 255;
				var captalpha = captdata[i+3] / 255;
				newdata[i] = captdata[i] * captalpha + basedata[i] * basealpha * (1 - captalpha);
				newdata[i+1] = captdata[i+1] * captalpha + basedata[i+1] * basealpha * (1 - captalpha);
				newdata[i+2] = captdata[i+2] * captalpha + basedata[i+2] * basealpha * (1 - captalpha);
				newdata[i+3] = 255;
			}
			var imagedata =  ctx.createImageData(this.size, this.size);
			imagedata.data.set(newdata);
			var x = c * this.size;
			var y = r * this.size;
			ctx.putImageData(imagedata, x, y);	
		}
		
	}
	CTabs.Logger.debug("Returning combined: " + canvas.toDataURL().length);
	return canvas.toDataURL();
}
