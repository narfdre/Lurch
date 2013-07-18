var Lurch = angular.module('Lurch', []);

Lurch.controller('listCtrl', function($scope, $http){
    loadRepos();
    loadOrgs();

    $scope.deployed = function(repo){
        if($scope.apps.indexOf(repo) != -1){
            return true;
        }
        return false;
    };

    $scope.started = function(repo){
        if($scope.running.indexOf(repo) != -1){
            return true;
        }
        return false;
    };

    $scope.deploy = function(url, app){
        $http.post('api/v1/git/clone', 
                    {url : url, app : app})
            .success(function(){
                $scope.apps.push(app);
            })
            .error(function(error, code){
                if(error){
                    console.log(error)
                }else{
                    $scope.apps.push(app);
                }
            });
    };

    $scope.startApp = function(app){
        $http.post('/api/v1/apps/' + app + '/start', {})
            .success(function(){
                $scope.running.push(app);
            });
    };

    $scope.stopApp = function(app){
        $http.post('/api/v1/apps/' + app + '/stop', {})
            .success(function(){
                var position = $scope.running.indexOf(app);
                $scope.running.splice(position, 1);
            });
    };

    $scope.deleteApp = function(app){
        $http.delete('/api/v1/apps/' + app)
            .success(function(){
                var position = $scope.apps.indexOf(app);
                $scope.apps.splice(position, 1);
            });
    };

    $scope.updateApp = function(app){
        $http.put('/api/v1/apps/' + app)
            .success(function(){

            });
    }

    $scope.orgRepos = function(org){
        $http.get('/api/v1/git/repos/' + org)
            .success(function(repos){
                $scope.repos = $scope.repos.concat(repos);
            });
    }

    function loadRepos(){
        $http.get('/api/v1/apps')
            .success(function(apps){
                $scope.apps = apps;
            });
        $http.get('api/v1/apps/running')
            .success(function(running){
                $scope.running = running;
            });
        $http.get('api/v1/git/repos')
            .success(function(repos){
                $scope.repos = repos;
            });
    }

    function loadOrgs(){
        $http.get('/api/v1/git/orgs')
            .success(function(orgs){
                $scope.orgs = orgs;
            });
    }
});