var fs = require("fs");
var http = require("http");

var imagePath = "./images";
var imageURL = "http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=";
var iconURL = "http://gatherer.wizards.com/Handlers/Image.ashx?type=symbol&size=medium&name=";

var getImagePath = function(id, imgPrefix) {
    return imagePath + "/" + imgPrefix + id + ".jpg";
};

var readFile = function(path, res) {
    res.setHeader("Cache-Control", "max-age=3600");
    fs.createReadStream(path).pipe(res);
};

var get = function(urlBase, imgPrefix) {
    return function(id, res) {
        var path = getImagePath(id, imgPrefix);
        fs.exists(path, function(exists) {
            if (exists) {
                readFile(path, res);
            } else {
                console.log("Grabbing image for " + id);
                var ws = fs.createWriteStream(path);
                ws.on("finish", function() {
                    ws.close(function() { readFile(path, res); });
                });
                http.get(urlBase + id, function(response) {
                    response.pipe(ws);
                }).on("error", function(err) {
                    res.send(500, err);
                });
            }
        });
    };
};

module.exports.getImage = get(imageURL, "card-");
module.exports.getIcon = get(iconURL, "icon-");
