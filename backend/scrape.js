"use strict";

var tutor = require("tutor");
var _ = require("lodash");
var db = require("./db");
var q = require("q");

var sanitizeSetName = function(setName) {
    return setName.replace(".", "");
};

exports.scrapeSets = function(callback) {
    q.nfcall(tutor.sets)
    .then(function(sets) {
        _.forEach(sets, function(set) {
            // always scrape promos
            if (set.substring(0, 5) == "Promo") {
                scrapeSet(set, callback);
            } else {
                q.ninvoke(db.sets, "count", {expansion: sanitizeSetName(set)})
                .then(function (count) {
                    if (count == 0) {
                        scrapeSet(set, callback);
                    }
                })
                .catch(callback);
            }
        });
    })
    .catch(callback);
};

var scrapeSet = function(set, callback) {
    console.log("Scraping " + set);

    // drop the old set, if it exists
    q.ninvoke(db.sets, "remove", {expansion: sanitizeSetName(set)})
    // get new cards in set
    .then(function() {
        return q.nfcall(tutor.set, set);
    })
    .then(function(cards) {
        _.forEach(cards, function(card) {
            // need to rip the period out of the expansion and rarities
            card.expansion = sanitizeSetName(card.expansion);
            var versions = {};
            _.each(card.versions, function(version, rarity) {
                versions[sanitizeSetName(version)] = rarity;
            });
            card.versions = versions;
            // insert
            q.ninvoke(db.sets, "insert", card)
            .then(function() {
                console.log("Scraped " + card.name + " (" + card.expansion + ")");
            })
            .catch(callback);
        });
    });
};
