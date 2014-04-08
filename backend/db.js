"use strict";

var config = require("../config");
var sqlite = require("sqlite3");
var fs = require("fs");

var db = new sqlite.Database("db/data.db");
var sql = fs.readFileSync("db/schema.sql", {"encoding": "UTF-8"});
db.exec(sql);

module.exports = db;
