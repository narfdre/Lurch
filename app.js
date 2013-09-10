var express = require('express')
  , passport= require('passport')
  , github  = require('passport-github').Strategy
  , routes 	= require('./routes')
  , api		  = require('./api')
  , http 	  = require('http')
  , path 	  = require('path')
  , Nedb    = require('nedb')
  , usersdb = new Nedb({ filename: 'db/users.db', autoload: true })
  , appsdb  = new Nedb({ filename: 'db/apps.db', autoload: true})
  , exec    = require('child_process').exec
  , fs      = require('fs');

passport.serializeUser(function(user, done) { done(null, user); });
passport.deserializeUser(function(obj, done) { done(null, obj); });

passport.use(new github({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: "user,repo"
  },
  function(accessToken, refreshToken, profile, done) {
    usersdb.update({ name: profile.username }, 
                   { name: profile.username, token: accessToken, profile: profile }, 
                   { upsert: true }, 
                   function (err, numReplaced, upsert) {
                      console.log(err, numReplaced, upsert);
                      return done(null, profile);
    });
  }
));


var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('jaredsmom'));
app.use(express.session({secret: 'jaredsmom'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/app', ensureAuthenticated, routes.app);

app.get('/login',
  passport.authenticate('github'),
  function(req, res){
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
});

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

app.get('/github/auth', 
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/app');
});


//API V1
app.get('/api/v1/apps', api.v1.listApps);
app.post('/api/v1/apps', api.v1.createApp);
// app.get('/api/v1/apps/:name', api.v1.getApp);
app.del('/api/v1/apps/:name', api.v1.deleteApp);
app.put('/api/v1/apps/:name/pull', api.v1.pull);
app.post('/api/v1/apps/:name/start', api.v1.start);
app.post('/api/v1/apps/:name/stop', api.v1.stop);
app.get('/api/v1/apps/:name/logs', api.v1.getAppLogs);
app.get('/api/v1/apps/:name/exists', api.v1.exists);
app.put('/api/v1/apps/:name/port/:port', api.v1.changePort);

app.get('/api/v1/git/orgs', ensureAuthenticated, api.v1.orgs);
app.get('/api/v1/git/repos', ensureAuthenticated,  api.v1.repos);
app.get('/api/v1/git/repos/:org', ensureAuthenticated,  api.v1.orgRepos);
app.post('/api/v1/git/clone', ensureAuthenticated,  api.v1.deploy);

http.createServer(app).listen(app.get('port'), function(){
  console.log('You Rang?');
  console.log('Lurch is serving on port ' + app.get('port'));
  checkForAppDirectory();
  checkForRunningApps();
});


//Middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { 
    usersdb.findOne({ name: req.user.username }, function (err, doc) {
      req.user.token = doc.token;
      return next();
    });
  }else{
    res.redirect('/');
  }
}

//Start up process
function checkForAppDirectory(){
  fs.exists('./apps', function (exists) {
    if(!exists){
      console.log('Creating root folder to deploy apps to');
      fs.mkdirSync('./apps');
    }
  });
}

function checkForRunningApps(){
  console.log("Checking if there are any running apps...");
  appsdb.loadDatabase();
  appsdb.find({}, function (err, docs) {
      if(err){
        console.log(err);
      }
      console.log("found", docs.length, docs.length > 1 ? "apps" : "app");
      for(i in docs){
        console.log(docs[i]);
        console.log("checking if '", docs[i].name, "' is still running");
        if(docs[i].pid != 0){
          var command = ['ps', 'aux', '|', 'grep', docs[i].pid, '|', 'grep', '-v', 'grep', '|', 'wc', '-l'].join(' ');
          var child = exec(command, 
                          function(error, stdout, stderr){
                            if(stdout > 0){
                              console.log('---Looks like its still running.');
                            }else{
                              console.log('---Nope, its not running');
                              appsdb.update({ name: docs[i].name}, { $set: { pid: 0}}, {}, function (err, numReplaced) {
                                  if(err){
                                    console.log(err);
                                    console.log('---Well, Lurch could not update this app. You might see some issues. To fix any issues with this app delete it and redeploy.');
                                  }
                                  if(numReplaced > 0){
                                    console.log("---updated app!");
                                  }
                              });
                            }
                          });
        }else{
          console.log('---Nope, it is not running');
        }
      }
      console.log("Startup process done...");
  });
}