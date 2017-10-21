//Initialize the global TabNabbing namespace
TabNabbing = chrome.extension.getBackgroundPage().TabNabbing;

function showData() {
    removeFrames();
    chrome.storage.local.get(["c1_cols", "c1_rows"], function (id) {
        return function (data) {
            createFrame(data, id);
        }
    }("c1"));
    chrome.storage.local.get(["c2_cols", "c2_rows"], function (id) {
        return function (data) {
            createFrame(data, id);
        }
    }("c2"));
    chrome.storage.local.get(["diff_cols", "diff_rows"], function (id) {
        return function (data) {
            createFrame(data, id);
        }
    }("diff"));
}

function startCapture() {
    var data = document.getElementById("urls").value;
    var urls = data.split("\n");
    TabNabbing.AutomatedCapture.initialize(urls, document.getElementById("sequence").value);
}

function startPostProcessing() {
    TabNabbing.PostProcessing.process(document.getElementById("chunk").value);
}

function removeFrames() {
    var frame = document.getElementsByTagName("table");
    for (var i = 0; i < frame.length; i++) {
        frame[i].parentNode.removeChild(frame[i]);
    }
}

function createFrame(data, name) {
    var table = document.createElement("table");

    var cols = data[name + "_cols"];
    var rows = data[name + "_rows"];
    for (var r = 0; r < rows; r++) {
        var row = document.createElement("tr");
        for (var c = 0; c < cols; c++) {
            var cell = document.createElement("td");
            row.appendChild(cell);
            var id = name + "_" + r + "_" + c;
            cell.setAttribute("id", id);
            chrome.storage.local.get(id, function (imageId) {
                return function (d) {
                    var img = new Image();
                    img.src = d[imageId];
                    document.getElementById(imageId).appendChild(img);
                }
            }(id));
        }
        table.appendChild(row);
    }

    //Insert new frame
    document.getElementById("body").appendChild(table);
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("showData").addEventListener("click", showData);
    document.getElementById("startCapture").addEventListener("click", startCapture);
    document.getElementById("startPostProcessing").addEventListener("click", startPostProcessing);
});
