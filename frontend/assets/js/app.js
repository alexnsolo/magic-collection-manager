"use strict";

var app = angular.module("mcm-app", ["autocomplete"]);

var authHeaders;

window.RootController = function($scope, $http) {
    $scope.loginRequired = true;
    $scope.auth = "";
    $scope.isLoggedIn = false;
    $scope.active = "collection";

    $http.get("/config").success(function(data) {
        $scope.loginRequired = data.passwordRequired;
    });

    authHeaders = function() {
        if (!$scope.isLoggedIn) {
            return {};
        } else {
            return {"X-Auth-Key": $scope.auth};
        }
    };

    $scope.isActive = function(view) {
        return $scope.active == view ? "active" : false;
    };

    $scope.makeActive = function(view) {
        $scope.active = view;
    };
};

window.CollectionController = function($scope, $http) {
    $scope.currentPage = 1;
    $scope.pageSize = 30;
    $scope.availablePageSizes = [15, 30, 50, 100];
    $scope.results = {"count": 0, "cards": []};
    $scope.name = "";
    $scope.sorts = ["alpha", "rarity"];
    $scope.sort = $scope.sorts[0];
    $scope.loading = false;
    $scope.errors = [];

    var request = {};
    var setRequest = function() {
        request.name = $scope.name;
        request.sort = $scope.sort;
        request.pageNum = $scope.currentPage;
        request.pageSize = $scope.pageSize;
    };

    var doRequest = function() {
        $scope.loading = true;
        $scope.errors = [];
        $http.get("query/collection", {headers: authHeaders, params: request})
        .success(function(data) {
            $scope.results = data;
        })
        .error(function(error) {
            console.log(error);
            $scope.errors.push(error.error);
        })
        .then(function() {
            $scope.loading = false;
        });
    };

    $scope.requestPage = function(page) {
        $scope.currentPage = page;
        request.pageNum = page;
        $scope.doRequest();
    };

    $scope.search = function() {
        $scope.currentPage = 1;
        setRequest();
        doRequest();
    };

    $scope.search();

    $scope.parseCost = function(cost) {
        if (cost == null) return [];
        return cost.substring(1, cost.length - 1).replace("/", "").split("}{");
    };
};

window.AddController = function($scope, $http, $q) {
    var baseExp = {"name": "(other)", "id": null};

    $scope.name = "";
    $scope.matchedExpansion = null;
    $scope.expansions = [baseExp];
    $scope.foil = false;
    $scope.alternateArt = false;
    $scope.added = [];
    $scope.quantity = 1;
    $scope.quantities = _.range(1, 100);
    $scope.autocompletions=[];

    $scope.getNameSuggestions = function() {
        if ($scope.name.length > 1) {
            $http.get("query/autoCompleteCardName", {headers: authHeaders, params: {"name": $scope.name}})
            .success(function(data) {
                $scope.autocompletions = data;
            })
            .error(function() {
                $scope.autocompletions=[];
            });
        } else {
            $scope.autocompletions=[];
        }
    };

    $scope.getAvailableExpansions = function() {
        $http.get("query/expansionsForCard", {headers: authHeaders, params: {"name": $scope.name}})
        .success(function(data) {
            data.push(baseExp);
            $scope.expansions = data;
            $scope.matchedExpansion = data[0];
        })
        .error(function() {
            $scope.expansions = [baseExp];
        });
    };

    $scope.addCard = function() {
        return $http.post("query/addCardToCollection", {"id": $scope.matchedExpansion}, {headers: authHeaders})
        .success(function() {
            $scope.added.push($scope.name);
            $scope.name = "";
            $scope.expansions = [baseExp];
            $scope.foil = false;
            $scope.alternateArt = false;
            $scope.quantity = 1;
        })
        .error(function(err) {
            console.log(err);
        });
    };
};
