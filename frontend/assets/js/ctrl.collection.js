angular.module("mcm-app")
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
});
