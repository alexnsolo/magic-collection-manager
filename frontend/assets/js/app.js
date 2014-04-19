"use strict";

var authHeaders;

var app = angular.module("mcm-app", ["autocomplete"])
.controller("RootController", function($rootScope, $scope, $http, $location) {
    $scope.loginRequired = true;
    $scope.auth = "";
    $scope.isLoggedIn = false;
    $scope.view = null;

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
        return $scope.view.name == view ? "active" : false;
    };

    $scope.setView = function(viewState) {
        $scope.view = {
            name: viewState.view,
            template: "/templates/" + viewState.view + ".html",
            params: viewState.params
        };
    };

    $scope.makeActive = function(viewString, dontPush) {
        var params = $scope.getViewParams(viewString);
        if (!$scope.view || JSON.stringify(params) != JSON.stringify($scope.view.params)) {
            var viewState = {
                "view": params.length > 0 ? params[0] : "collection",
                "params": params
            };
            $scope.setView(viewState);
            if (!dontPush) {
                $location.path(viewString);
            }
        }
    };

    window.addEventListener("popstate", function(e) {
        $scope.makeActive($location.path(), true);
    });

    $scope.$on("$locationChangeStart", function() {
        $scope.makeActive($location.path(), true);
    });

    $scope.getViewParams = function(viewString) {
        return _.filter(viewString.split("/"), function(i) { return i != ""});
    };

    $scope.makeActive($location.path(), true);
})
.controller("CollectionController", function($scope, $http) {
    $scope.pageNum = 1;
    $scope.pageSize = 25;
    $scope.availablePageSizes = [15, 25, 50, 100];
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
        request.pageNum = $scope.pageNum;
        request.pageSize = $scope.pageSize;
    };

    var doRequest = function() {
        $scope.loading = true;
        $scope.errors = [];
        $http.get("/query/collection", {headers: authHeaders, params: request})
        .success(function(data) {
            $scope.results = data;
            $scope.pageMax = Math.ceil(data.count / $scope.pageSize);
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
        $scope.pageNum = page;
        request.pageNum = page;
        doRequest();
    };

    $scope.search = function() {
        $scope.pageNum = 1;
        setRequest();
        doRequest();
    };

    $scope.search();

    $scope.parseCost = function(cost) {
        if (cost == null) return [];
        return cost.substring(1, cost.length - 1).replace(/\//g, "").split("}{");
    };

    $scope.detail = {};
    $scope.detail.showing = false;
    $scope.detail.result = {};
    $scope.detail.loading = false;
    $scope.detail.selectedId = 1;

    $scope.showDetail = function(cardName) {
        $scope.detail.showing = true;
        $scope.detail.loading = true;
        $scope.detail.errors = [];
        $http.get("/query/cardDetail", {headers: authHeaders, params: {"name": cardName}})
        .success(function(data) {
            $scope.detail.result = _.sortBy(data.results, function(d) { return d.id; });
            $scope.detail.selectedId = $scope.detail.result[$scope.detail.result.length - 1].id;
        })
        .error(function(err) {
            $scope.detail.showing = false;
            $scope.detail.errors.push(err);
        })
        .then(function() {
            $scope.detail.loading = false;
        });
    };
})
.controller("AddController", function($scope, $http, $q) {
    var baseExp = {"name": "(other)", "id": -1};

    $scope.name = "";
    $scope.matchedExpansion = null;
    $scope.expansions = [baseExp];
    $scope.foil = false;
    $scope.alternateArt = false;
    $scope.quantity = 1;
    $scope.quantities = _.range(1, 100);
    $scope.autocompletions=[];
    $scope.added = [];
    $scope.errors = [];

    $scope.getNameSuggestions = function() {
        if ($scope.name.length > 1) {
            $http.get("/query/autoCompleteCardName", {headers: authHeaders, params: {"name": $scope.name}})
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

    $scope.getAvailableExpansions = function(name) {
        $http.get("/query/expansionsForCard", {headers: authHeaders, params: {"name": name}})
        .success(function(data) {
            data.push(baseExp);
            $scope.expansions = data;
            $scope.matchedExpansion = data[0].id;
        })
        .error(function() {
            $scope.expansions = [baseExp];
        });
    };

    $scope.addCard = function() {
        var card = {
            "id": $scope.matchedExpansion,
            "name": $scope.name,
            "foil": $scope.foil,
            "alternateArt": $scope.alternateArt,
            "quantity": $scope.quantity
        };
        $scope.errors = [];
        return $http.post("/query/addCardToCollection", card, {headers: authHeaders})
        .success(function() {
            $scope.added.unshift(card);
            while ($scope.added.length > 10) {
                $scope.added.pop();
            }
            $scope.name = "";
            $scope.expansions = [baseExp];
            $scope.foil = false;
            $scope.alternateArt = false;
            $scope.quantity = 1;
        })
        .error(function(err) {
            $scope.errors.push(err);
            console.log(err);
        });
    };
})
.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
});
