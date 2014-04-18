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
        return $scope.view.view == view ? "active" : false;
    };

    $scope.setView = function(viewState) {
        $scope.view = {
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
        $http.get("/query/collection", {headers: authHeaders, params: request})
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
        return cost.substring(1, cost.length - 1).replace(/\//g, "").split("}{");
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
