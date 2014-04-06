"use strict";

var config = require("../config");
var tingo = require("tingodb")().Db;
var fs = require("fs")

var db = new tingo(config.storePath, {});
var checkAndOpen = function(coll) {
    var path = config.storePath + "/" + coll;
    if (!fs.existsSync(path)) {
        fs.closeSync(fs.openSync(path, 'w'));
    }
    return db.collection(coll);
};

// stores all cards for oracle data
exports.sets = checkAndOpen("sets");
// store for the cards the user owns
exports.collections = checkAndOpen("collection");
// custom lists as subsets of the above
exports.lists = checkAndOpen("lists");
