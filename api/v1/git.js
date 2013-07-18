var GitHubApi = require('github'),
	exec      = require('child_process').exec,
	spawn     = require('child_process').spawn,
	storage   = require('node-persist'),
	rootPath  = require('path').dirname(require.main.filename),
	appPath   = rootPath + '/apps';

var github = new GitHubApi({
    version: "3.0.0",
    timeout: 5000
});

exports.listOrgs = function(req, res){
	var token = storage.getItem(req.user.username);
	github.authenticate({
		type: "oauth",
		token: token
	});
	github.user.getOrgs({}, function(err, orgs){
		res.send(orgs);
	});
}

exports.listRepos = function(req, res){
	var token = storage.getItem(req.user.username);
	github.authenticate({
		type: "oauth",
		token: token
	});
	github.repos.getAll({}, function(err, repos){
		res.send(repos);
	});
}

exports.listOrgRepos = function(req, res){
	var org = req.params.org;
	var token = storage.getItem(req.user.username);
	github.authenticate({
		type: "oauth",
		token: token
	});
	github.repos.getFromOrg({org: org}, function(err, repos){
		res.send(repos);
	});
}

exports.deployRepo = function(req, res){
	var token = storage.getItem(req.user.username);
	var url = req.body.url;
	var gitUrl = getGitUrl(url, token);
	var clone = spawn('git', ['clone', gitUrl], 
					{cwd : appPath, detached: true});

	clone.on('error', function(error){
		res.send(500, error);
	});

	clone.on('exit', function(code){
		console.log('process exited');
		res.send(202, code);
	});
}

function getGitUrl(url, token){
	var creds = "https://" + token + ":x-oauth-basic@";
	return url.replace('https://', creds);
}