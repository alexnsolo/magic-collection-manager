"use strict";

var _ = require("lodash");
var db = require("./db");
var q = require("Q");

var Queries = {
    "read": {},
    "write": {}
}

exports.resolve = function(subset, query, req, res) {
    if (!Queries[subset].hasOwnProperty(query)) {
        res.send(400, {"error": "No matching query found for '" + query + "'"});
    } else {
        Queries[subset][query](req, res);
    }
};

var report = function (res) {
    return function (error) {
        res.send(500, {"error": error.toString()});
    };
};

var assembleCard = function (skeletal, callback) {
    return q.ninvoke(db.sets, "findOne", {_id: skeletal.oid}).
    then(function(card) {
        if (!card) {
            callback("Invalid card reference for " + skeletal.name);
        } else {
            var result = {};
            _.assign(result, skeletal, card);
            callback(null, result);
        }
    });
};

Queries.read.collection = function(req, res) {
    var pageNum = req.query.pageNum;
    var pageSize = req.query.pageSize;
    var filter = {};
    var sort = {name: 1};

    var result = {};

    q.ninvoke(db.collections, "count", filter)
    .then(function(count) {
        result.count = count;
        return q.ninvoke(db.collections, "find", filter);
    })
    .then(function(cursor) {
        result.cards = [];
        cursor
        .sort(sort)
        .skip(pageNum * pageSize)
        .limit(pageSize)
        .each(function(card) {
            console.log(card);
            if (card!=null) {
                q.nfcall(assembleCard, card)
                .then(function(fullCard) {
                    result.cards.push(card);
                })
                .catch(report(res));
            }
        });
    })
    .then(function() {
        res.send(result);
    })
    .catch(report(res));
};
