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

Queries.read.collection = function(req, res) {
    var pageNum = req.query.pageNum;
    var pageSize = req.query.pageSize;

    var result = {};

    q.ninvoke(db, "get", "select count(name) as \"count\" from collection_cards")
    .then(function(countResult) {
        result.count = countResult.count;
        return q.ninvoke(db, "all", "select id, name, quantity from collection_cards order by name asc limit ? offset ?", [
            pageSize,
            (pageNum - 1) * pageSize
        ]);
    })
    .then(function(cards) {
        result.cards = cards;
    })
    .then(function() {
        res.send(result);
    })
    .catch(report(res));
};
