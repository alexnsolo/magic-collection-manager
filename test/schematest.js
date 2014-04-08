"use strict";

var db = require("../backend/db");
var q = require("Q");

q.ninvoke(db, "get", "select count(id) as total from cards")
.then(function(result) {
    console.log(result.total);
})
.catch(function(err) {
    console.log(err);
});
