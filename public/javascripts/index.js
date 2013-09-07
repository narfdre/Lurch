var Lurch = angular.module('Lurch', []);

Lurch.controller('listCtrl', function($scope, $http){
    loadRepos();
    loadOrgs();

    $scope.$watch('currentOrg', function(newVal, oldVal){
        if(newVal)
            console.log(newVal.login);
        else
            console.log('none');
    })

    $scope.deployed = function(repo){
        for(var i in $scope.apps){
            if($scope.apps[i].name === repo){
                return true;
            }
        }
        return false;
    };

    $scope.deploy = function(url, app){
        $http.post('api/v1/git/clone', 
                    {url : url, app : app})
            .success(function(app){
                $scope.apps.push(app);
            })
            .error(function(error, code){
                console.log(error)
            });
    };

    $scope.startApp = function(app){
        $http.post('/api/v1/apps/' + app.name + '/start', {})
            .success(function(pid){
                app.pid = pid;
            });
    };

    $scope.stopApp = function(app){
        $http.post('/api/v1/apps/' + app.name + '/stop', {})
            .success(function(){
                app.pid = 0;
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
        $http.put('/api/v1/apps/' + app + '/pull')
            .success(function(){

            });
    }

    $scope.changePort = function(app){
        $http.put('/api/v1/apps/' + app.name + '/port/' + app.port)
            .success(function(){

            });
    }

    $scope.orgRepos = function(org){
        $http.get('/api/v1/git/repos/' + org)
            .success(function(repos){
                $scope.repos = $scope.repos.concat(repos);
            });
    }

    $scope.showRepo = function(owner, repo){
        $http.get('/api/v1/git/' + owner + '/' + repo)
            .success(function(repo){
                $scope.currentRepo = repo;
            });
    }

    function loadRepos(){
        $http.get('/api/v1/apps')
            .success(function(apps){
                $scope.apps = apps;
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