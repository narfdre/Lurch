var fs 			= require('fs'),
	exec 	    = require('child_process').exec,
	spawn 	    = require('child_process').spawn,
	rimraf		= require('rimraf'), 
	Nedb	  	= require('nedb'),
	appsdb	  	= new Nedb({ filename: 'db/apps.db', autoload: true }),
	rootPath 	= require('path').dirname(require.main.filename),
	appPath 	= rootPath + '/apps'
	foreman		= rootPath + '/node_modules/foreman/nf.js';

exports.listApps = function(req, res){
	appsdb.find({}, function(err, docs){
		res.send(docs);
	});
}

exports.createApp = function(req, res){
	var appName = req.body.name;
	fs.mkdir(appPath + "/" + appName, function(err){
		if(err){
			console.log(err);
			res.send(500, err);
		}else{
			res.send(200);
		}
	});
}

exports.exists = function(req, res){
	var appName = req.params.name;
	fs.exists(appPath + "/" + appName, function(exists){
		if(exists){
			res.send(204);
		}else{
			res.send(404);
		}
	});
}

exports.deleteApp = function(req, res){
	var appName = req.params.name;
	rimraf(appPath + '/' + appName, function(err){
		if(err){
			console.log(err);
			res.send(500, err);
		}else{
			appsdb.remove({name: appName}, function(err, removed){
				res.send(200);
			});
		}
	});
}

exports.startApp = function(req, res){
	var appName = req.params.name;
	var appLogPath = './apps/' + appName + '/out.log';
	var out = fs.openSync(appLogPath, 'a');
	var start = spawn(foreman, ['start', '-p', '3001'], 
					{cwd: appPath + '/' + appName,
					 detached: true,
					 stdio: [ 'ignore', out, out ]
					});
	var runningApps = storage.getItem('apps') || {};
	runningApps[appName] = start.pid;
	storage.setItem('apps', runningApps);
	res.send(202);
}

exports.stopApp = function(req, res){
	var appName = req.params.name;
	var runningApps = storage.getItem('apps');
	var pid = runningApps[appName];
	var command = ['kill', pid].join(' ');
	var clone = exec(command, function(error, stdOut, stdErr){
		if(!error){
			delete runningApps[appName];
			storage.setItem('apps', runningApps);
			res.send(200);
		}else{
			res.send(500, error);
		}
	});
}

exports.updateRepo = function(req, res){
	var appName = req.params.name;
	var pull = spawn('git', ['pull'], 
					{cwd: appPath + '/' + appName,
					detached: true});
	
	pull.on('error', function(error){
		res.send(500, error);
	});

	pull.on('exit', function(code){
		console.log('process exited');
		res.send(202, code);
	});
}