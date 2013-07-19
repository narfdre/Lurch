var GitHubApi = require('github'),
	exec      = require('child_process').exec,
	spawn     = require('child_process').spawn,
	Nedb	  = require('nedb'),
	appsdb	  = new Nedb({ filename: 'db/apps.db', autoload: true }),
	userdb	  = new Nedb({ filename: 'db/users.db', autoload: true }),
	rootPath  = require('path').dirname(require.main.filename),
	appPath   = rootPath + '/apps';

var github = new GitHubApi({
    version: "3.0.0",
    timeout: 5000
});

exports.listOrgs = function(req, res){
	github.authenticate({
		type: "oauth",
		token: req.user.token
	});
	github.user.getOrgs({}, function(err, orgs){
		res.send(orgs);
	});
}

exports.listRepos = function(req, res){
	github.authenticate({
		type: "oauth",
		token: req.user.token
	});
	github.repos.getAll({}, function(err, repos){
		res.send(repos);
	});
}

exports.listOrgRepos = function(req, res){
	var org = req.params.org;
	github.authenticate({
		type: "oauth",
		token: req.user.token
	});
	github.repos.getFromOrg({org: org}, function(err, repos){
		res.send(repos);
	});
}

exports.deployRepo = function(req, res){
	var token = req.user.token
	var url = req.body.url;
	var appName = req.body.app;
	var gitUrl = getGitUrl(url, token);
	var clone = spawn('git', ['clone', gitUrl], 
					{cwd : appPath, detached: true});

	clone.on('error', function(error){
		res.send(500, error);
	});

	clone.on('exit', function(code){
		var Application = { name: appName
						  , port: 3001
						  , pid : 0
						  , live: false};
		appsdb.insert(Application, function (err, newDoc) {
			res.send(200, {code: code, app: newDoc});
		});
	});
}

function getGitUrl(url, token){
	var creds = "https://" + token + ":x-oauth-basic@";
	return url.replace('https://', creds);
}