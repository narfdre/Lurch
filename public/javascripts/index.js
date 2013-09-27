var Lurch = angular.module('Lurch', []);

Lurch.run(function($rootScope){
    $rootScope.host = window.location.hostname;
});

Lurch.controller('listCtrl', function($scope, $http){
    loadApps();
    loadRepos();
    loadOrgs();

    var loading = [];

    $scope.difference = function(start){
        console.log(start);
        console.log(new Date());
        var diff = countdown(new Date(start), new Date());
        return diff.days + " " + diff.hours + ":" + diff.minutes + ":" + diff.seconds;
    }

    $scope.$watch('currentOrg', function(newVal, oldVal){
        if(newVal){
            orgRepos(newVal.login);
        }else{
            loadRepos();
        }
    });

    $scope.deployed = function(repo){
        for(var i in $scope.apps){
            if($scope.apps[i].name === repo){
                return true;
            }
        }
        return false;
    };

    $scope.loading = function(appname){
        if(loading.indexOf(appname) >= 0){
            return true;
        }
        return false;
    }

    $scope.deploy = function(url, app){
        loading.push(app);
        var port = 0;
        for(var i in $scope.apps){
            if($scope.apps[i].port > port){
                port = $scope.apps[i].port;
            }
        }
        if(port > 0) {
            port++;
        }else{
            port = 3001;
        }
        $http.post('api/v1/git/clone', 
                    {url : url, app : app, port: port})
            .success(function(app){
                $scope.apps.push(app);
                var position = loading.indexOf(app);
                loading.splice(position, 1);
            })
            .error(function(error, code){
                console.log(error)
            });
    };

    $scope.startApp = function(app){
        $http.post('/api/v1/apps/' + app.name + '/start', {})
            .success(function(pid){
                app.pid = pid;
                app.start = new Date();
            });
    };

    $scope.stopApp = function(app){
        $http.post('/api/v1/apps/' + app.name + '/stop', {})
            .success(function(){
                app.pid = 0;
                app.start = 0;
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
        console.log(app.port);
        if(isNaN(app.port)){
            
        }else{
            $http.put('/api/v1/apps/' + app.name + '/port/' + app.port)
            .success(function(){

            });
        }
    }

    $scope.showRepo = function(owner, repo){
        $http.get('/api/v1/git/' + owner + '/' + repo)
            .success(function(repo){
                $scope.currentRepo = repo;
            });
    }

    function orgRepos(org){
        $http.get('/api/v1/git/repos/' + org)
            .success(function(repos){
                $scope.repos = repos;
            });
    }

    function loadApps(){
        $http.get('/api/v1/apps')
            .success(function(apps){
                $scope.apps = apps;
            });
    }

    function loadRepos(){
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
