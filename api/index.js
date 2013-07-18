var manage 	= require('./v1/manage.js');
var git		= require('./v1/git.js');

exports.v1 = {
	createApp	: manage.createApp,
	exists		: manage.exists,
	listApps	: manage.listApps,
	deleteApp	: manage.deleteApp,
	start		: manage.startApp,
	stop		: manage.stopApp,
	runningApps : manage.runningApps,
	update		: manage.updateRepo,
	orgs		: git.listOrgs,
	repos		: git.listRepos,
	orgRepos	: git.listOrgRepos,
	deploy		: git.deployRepo
};