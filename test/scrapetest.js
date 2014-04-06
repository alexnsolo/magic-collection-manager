"use strict";

var scrape = require("../backend/scrape.js");

scrape.scrapeSets(function (err) {
    console.log("Error: " + err);
});
