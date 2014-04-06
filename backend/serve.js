"use strict";

var config = require("../config");
var express = require("express");
var uuid = require("node-uuid");
var _ = require("lodash");
var queries = require("./queries");

var app = express();
app.use(express.static("frontend"));

app.get("/config", function(req, res) {
    res.send({
        "passwordRequired": config.password.use
    });
});

// this is really flimsy, but hey
var authed = [];
app.post("/login", function(req, res) {
    var password = req.body.password;
    if (password == config.password.password) {
        var authToken = uuid.uuid4();
        authed.push(authToken);
        res.send({"auth": authToken});
    } else {
        res.send({"error": "Incorrect password."})
    }
});

app.get("/logout", function(req, res) {
    _.remove(authed, function(val) { return val == req.header("X-Auth-Key"); } );
    res.send({});
});

var checkLogin = function(req) {
    return !config.password.use || _.contains(authed, req.header("X-Auth-Key"));
};

app.get("/query/:query", function(req, res) {
    queries.resolve("read", req.params.query, req, res);
});

app.get("/update/:query", function(req, res) {
    if (!checkLogin(req)) {
        res.send({"error": "Valid authentication required."});
    } else {
        queries.resolve("write", req.params.query, req, res);
    }
});

app.listen(config.port, config.host);
