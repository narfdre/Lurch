var fs 			= require('fs'),
	exec 	    = require('child_process').exec,
	spawn 	    = require('child_process').spawn,
	rimraf		= require('rimraf'), 
	Nedb	  	= require('nedb'),
	appsdb	  	= new Nedb({ filename: 'db/apps.db'}),
	rootPath 	= require('path').dirname(require.main.filename),
	appPath 	= rootPath + '/apps'
	foreman		= rootPath + '/node_modules/foreman/nf.js';

exports.listApps = function(req, res){
	appsdb.loadDatabase();
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
			appsdb.loadDatabase();
			appsdb.remove({name: appName}, function(err, removed){
				res.send(200);
			});
		}
	});
}

exports.startApp = function(req, res){
	var appName = req.params.name;
	appsdb.loadDatabase();
	appsdb.findOne({ name: appName}, function (err, doc) {
  		if(err){
  			console.log(err);
  		}
  		var appLogPath = './apps/' + appName + '/out.log';
		var out = fs.openSync(appLogPath, 'a');
		var start = spawn(foreman, ['start', '-p', doc.port], 
						{cwd: appPath + '/' + appName,
						 detached: true,
						 stdio: [ 'ignore', out, out ]
						});
		var pid = start.pid;
		
		appsdb.update({ name: appName}, { $set: { pid: pid, start: new Date()}}, {}, function (err, numReplaced) {
	  		if(err){
	  			console.log(err);
	  		}
	  		res.send({pid: pid});
		});
	});
}

exports.stopApp = function(req, res){
	var appName = req.params.name;
	appsdb.loadDatabase();
	appsdb.findOne({name: appName}, function (err, doc) {
  		if(err){
  			console.log(err);
  		}
  		var command = ['kill', doc.pid].join(' ');
		var clone = exec(command, function(error, stdOut, stdErr){
			if(!error){
				appsdb.update({ name: appName}, { $set: { pid: 0, start: 0}}, {}, function (err, numReplaced) {
			  		if(err){
			  			console.log(err);
			  			res.send(500, err);
			  		}
			  		res.send({pid: 0});
				});
			}else{
				res.send(500, error);
			}
		});
	});
}

exports.changePort = function(req, res){
	var appName = req.params.name;
	var port = parseInt(req.params.port);
	appsdb.loadDatabase();
	appsdb.update({ name: appName }, { $set: { port: port } }, {}, function (err, numReplaced) {
	  if(err){
	  	console.log(err);
	  	res.send(500, err);
	  }
	  res.send(200)
	});
}

exports.getAppLogs = function(req, res){
	res.send(200);
}

exports.pullRepo = function(req, res){
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

exports.getAppLogs = function(req, res){
	var appName = req.params.name;
	var appLogPath = './apps/' + appName + '/out.log';
	fs.readFile(appLogPath, function(err, data){
		res.send(200, data);
	});
}