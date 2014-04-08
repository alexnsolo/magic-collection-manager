var fs = require("fs");
var http = require("http");

var imagePath = "./images";
var imageURL = "http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=";

var getImagePath = function(id) {
    return imagePath + "/" + id + ".jpg";
};

var readFile = function(path, res) {
    res.setHeader("Cache-Control", "max-age=3600");
    fs.createReadStream(path).pipe(res);
};

module.exports.get = function(id, res) {
    var path = getImagePath(id);
    fs.exists(path, function(exists) {
        if (exists) {
            readFile(path, res);
        } else {
            console.log("Grabbing image for " + id);
            var ws = fs.createWriteStream(path);
            ws.on("finish", function() {
                ws.close(function() { readFile(path, res); });
            });
            http.get(imageURL + id, function(response) {
                response.pipe(ws);
            }).on("error", function(err) {
                res.send(500, err);
            });
        }
    });
};
