angular.module("mcm-app")
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
});
