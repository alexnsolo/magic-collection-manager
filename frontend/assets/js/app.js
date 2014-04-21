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
.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
});
