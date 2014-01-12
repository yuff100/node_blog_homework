
/*
 * GET home page.
 */
/*
exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};
*/

var crypto = require('crypto');
var fs = require('fs');
var User = require('../models/user.js');
var Post = require('../models/post.js');

module.exports = function(app) {
	app.get('/', function(req, res) {
		Post.getAll(null, function(err, posts) {
			if(err) {
				posts = [];
			}
			res.render('index', {
				title: 'Main',
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res) {
		res.render('reg', {
			title: 'Register',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/reg', checkNotLogin);
	app.post('/reg', function(req, res) {
		var name = req.body.name;
		var password = req.body.password;
		var password_re = req.body.passwordRepeat;

		if(password_re != password) {
			req.flash('error', 'Password not same!');
			return res.redirect('/reg');
		}

		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: req.body.name,
			password: password,
			email: req.body.email
		});

		User.get(newUser.name, function(err, user) {
			console.log("User.get");

			if(user) {
				console.log(newUser.name, " exist");
				req.flash('error', 'User exist!');
				return res.redirect('/reg');
			}

			newUser.save(function(err, user) {
				console.log("newUser.save", err);

				if(err) {
					req.flash('error', err);
					return res.redirect('/reg');
				}

				console.log("newUser.save success");

				req.session.user = user;
				req.flash('success', 'Registe successfully!');
				res.redirect('/');
			});
		});
	});
	
	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res) {
		res.render('login', {
			title: 'Login',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res) {
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');

		User.get(req.body.name, function(err, user) {
			if(!user) {
				req.flash('error', 'User not exist!');
				return res.redirect('/login');
			}

			if(user.password != password) {
				req.flash('error', 'Error password!');
				return res.redirect('/login');
			}

			req.session.user = user;
			req.flash('success', 'Login successfully!');
			res.redirect('/');
		});
	});

	app.get('/post', checkLogin);
	app.get('/post', function(req, res) {
		res.render('post', {
			title: 'Post',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
		var currentUser = req.session.user;
		var post = new Post(currentUser.name, req.body.title, req.body.post);

		post.save(function(err) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}

			req.flash('success', 'Post successfully!');
			res.redirect('/');
		});
	});

	app.get('/logout', checkLogin);
	app.get('/logout', function(req, res) {
		req.session.user = null;
		req.flash('success', 'Logout successfully!');
		res.redirect('/');
	});

	app.post('/upload', checkLogin);
	app.post('/upload', function(req, res) {
		for(var i in req.files) {
			if(req.files[i].size == 0) {
				fs.unlinkSync(req.files[i].path);
				console.log('Successfully removed an empty file!');
			} else {
				var target_path = 'C:/Users/Fisher/nodejs/blog/public/images/' + req.files[i].name;

				fs.renameSync(req.files[i].path, target_path);
				console.log('Successfully renamed a file!');
			}
		}
		req.flash('success', 'Successfully upload file!');
		res.redirect('/upload');
	});

	app.get('/upload', checkLogin);
	app.get('/upload', function(req, res) {
		res.render('upload', {
			title: "Upload file",
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.get('/u/:name', function(req, res) {
		User.get(req.params.name, function(err, user) {
			if(!user) {
				req.flash('error', 'User is not exist!');
				return res.redirect('/');
			}

			Post.getAll(user.name, function(err, posts) {
				if(err) {
					req.flash('error', err);
					return res.redirect('/');
				}

				res.render('user', {
					title: user.name,
					posts: posts,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});

	app.get('/u/:name/:day/:title', function(req, res) {
		Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}

			res.render('article', {
				title: req.params.title,
				post: post,
				user: req.session.user,
				success: req.flash('success').toString,
				error: req.flash('error').toString
			});
		});
	});
};

function checkLogin(req, res, next) {
	if(!req.session.user) {
		req.flash('error', 'Not login');
		res.redirect('/login');
	}
	next();
}

function checkNotLogin(req, res, next) {
	if(req.session.user) {
		req.flash('error', 'Already login');
		res.redirect('back');
	}
	next();
}