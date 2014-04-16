"use strict";

var _ = require("lodash");
var db = require("./db");
var q = require("q");

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
        return q.ninvoke(db, "all", "select id, name, quantity, manacost from collection_cards order by name asc limit ? offset ?", [
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
    .catch(report(res))
    .done();
};

Queries.read.expansionsForCard = function(req, res) {
    q.ninvoke(db, "all", "select c.id, e.name from expansions e inner join cards c on c.expansion = e.id where c.name = ?",
        [req.query.name])
    .then(function(result) {
        res.send(result);
    })
    .catch(report(res))
    .done();
};

Queries.read.autoCompleteCardName = function(req, res) {
    q.ninvoke(db, "all", "select name from cards where name like ? || '%' group by name order by name asc limit 10",
        [req.query.name])
    .then(function(result) {
        res.send(_.pluck(result, "name"));
    })
    .catch(report(res))
    .done();
};

Queries.write.addCardToCollection = function(req, res) {
    var id = req.body.id;
    q.ninvoke(db, "run", "insert into collection (card) values (?)", [id])
    .then(function(success) {
        res.send({"success": []});
    })
    .catch(report(res))
    .done();
};
