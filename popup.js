//setBadgeBackgroundColor(),

//Initialize the global CTabs namespace
CTabs = chrome.extension.getBackgroundPage().CTabs;

function loadBody() {
	CTabs.Logger.debug("Triggering popup load");
	var body = document.getElementById("body");
	
	chrome.windows.getCurrent(null, function(window) {
		chrome.tabs.query({"windowId": window.id, active: true}, function(tabs) {
			var result = CTabs.TabStore.getResult(tabs[0].id)
			var img = document.createElement("img");
			img.src = result.getCombinedDataUrl();
			//TODO make dynamic compared to window size?
			img.width = 600; //default 300
			img.height = 400; //default 200
			body.appendChild(img);
		});
	});
}


document.addEventListener("DOMContentLoaded", loadBody );

