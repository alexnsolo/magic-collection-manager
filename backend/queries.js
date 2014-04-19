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
        console.log(error);
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
        return q.ninvoke(db, "all", "select id, name, quantity, type, manacost, rarity from collection_cards order by name asc limit ? offset ?", [
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
    var foil = req.body.foil;
    var alternateArt = req.body.alternateArt;
    var query = "insert into collection (card, foil, alternate_art) values ";
    var paramArray = [];
    var paramStringArray = [];
    var quantity = req.body.quantity;
    if (!quantity || quantity < 1) {
        quantity = 1;
    }
    for (var i = 0; i < quantity; i++) {
        paramArray = paramArray.concat([id, foil, alternateArt]);
        paramStringArray.push("(?, ?, ?)");
    }
    query += paramStringArray.join(", ");

    q.ninvoke(db, "run", query, paramArray)
    .then(function(success) {
        res.send({"success": []});
    })
    .catch(report(res))
    .done();
};

Queries.read.cardDetail = function(req, res) {
    q.ninvoke(db, "all",
            "select c.id as id, e.name as expansion, c.full as full, count(col.id) as \"count\", sum(col.foil) as foilcount, sum(col.alternate_art) as artcount" +
            " from cards c inner join collection col on c.id = col.card inner join expansions e on c.expansion = e.id where c.name = ?" +
            " group by c.id",
            [req.query.name])
    .then(function(results) {
        _.each(results, function(result) {
            result.full = JSON.parse(result.full);
        });
        res.send({"results": results});
    })
    .catch(report(res))
    .done();
};
