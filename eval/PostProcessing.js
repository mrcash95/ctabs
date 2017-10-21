//Initialize the global CTabs namespace
CTabs = chrome.extension.getBackgroundPage().CTabs;

/**
 <p>TODO.</p>
 @class
*/
CTabs.PostProcessing = new function () {
   // need to understand this: this.storageUrl = "http://testsrv1.example.com/TabShots/"; //TODO make this configurable
}

CTabs.PostProcessing.handleList = function (handler, chunk) {
    function walk(list, next) {
        if (list.length > 0) {
            handler(list[0]);
            setTimeout(function (list, next) {
                return function () {
                    list.shift();
                    walk(list, next);
                }
            }(list, next), 2000);
        } else {
            if (next) {
                CTabs.PostProcessing.handleList(handler, next);
            }
        }
    }

    CTabs.Logger.debug("Loading postprocessing list");
    if (!chunk) {
        chunk = 0;
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", this.storageUrl + "presentForProcessing.php?chunk=" + chunk, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var data = JSON.parse(xhr.responseText);
                walk(data.data, data.nextChunk);
            } else {
                CTabs.Logger.error("Failed to get data (status: " + xhr.status + ")");
            }
        }
    }
    xhr.send(null);
}

CTabs.PostProcessing.storeResult = function (id, result) {
    //CTabs.Logger.debug("Storing postprocessing result: " + id);

    var url = CTabs.PostProcessing.storageUrl + "store.php?filename=" + id + "_" + result.percentageMismatch + "_result";

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                //CTabs.Logger.info("Stored postprocessing result for " + id);
            } else {
                CTabs.Logger.error("Failed to store data for: " + id + " (status: " + xhr.status + ")");
            }
        }
    }
    xhr.send(result.getCombinedDataUrl());
}

CTabs.PostProcessing.process = function (chunk) {
    if (!chunk) {
        chunk = 0;
    }

    function handler(item) {
        var id = item["id"];
        //CTabs.Logger.debug("Processing " + id);
        var data1 = item["initial"];
        var data2 = item["completed"];

        var one = new CTabs.Capture(data1);
        var two = new CTabs.Capture(data2);

        //Delay this to allow cuts to be made
        setTimeout(function (c1, c2) {
            return function () {
                var result = CTabs.ComparatorExactMatch.calculateDifference(c1, c2);
                CTabs.PostProcessing.storeResult(id, result);
            }
        }(one, two), 1000);
    }

    this.handleList(handler, chunk);
}