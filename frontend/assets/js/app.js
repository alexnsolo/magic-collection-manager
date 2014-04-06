"use strict";

var app = angular.module("mcm-app", ["autocomplete"]);

var authHeaders;

window.RootController = function($scope, $http) {
    $scope.loginRequired = true;
    $scope.auth = "";
    $scope.isLoggedIn = false;
    $scope.displaying = "collection";

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
};
