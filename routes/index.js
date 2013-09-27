exports.index = function(req, res){
    res.render('index');
};

exports.app = function(req, res){
  	res.render('app', { user: req.user.username });
};