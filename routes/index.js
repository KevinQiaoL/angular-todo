var express = require('express');
var router = express.Router();
var crypto = require('crypto');//md5加密 中间件
var User = require('../models/user.js');//user模型
var Post = require('../models/Post.js');//post模型
var xss = require('xss');//post模型
module.exports = function(app){
	//启动页
	app.get('/', function (req, res) {
	  res.render('index');
	});
	app.get('/login', function (req, res) {
	  res.redirect('/');
	});
	app.get('/reg', function (req, res) {
	  res.redirect('/');
	});
	// todo页
	app.get('/templates/form.html', function (req, res) {
	  res.render('templates/form');
	});
	// 登录页面
	app.get('/templates/sign-in.html', function (req, res) {
	  res.render('templates/sign-in');
	});
	app.post('/login',checkNotLogin);
	app.post('/login',function(req, res){
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');
		User.get(req.body.name, function(err , user) {
			if (err){
			    req.flash('error', err);
			    return res.json({msg:err});
			}

			if(!user){
				req.flash('error','用户名不存在');
				return res.json({msg:'用户名不存在'});
			}
			if(user.password != password){
				req.flash('error','密码错误');
				return res.json({msg:'密码错误'});
			}
			//console.log(user);
			req.session.user = user;
			req.flash('success','登录成功');
			res.json({
				msg:'HAS_LOGIN',
				status:1,
				user:req.session.user
			});
		})
	});
	// 注册页面
	app.get('/templates/sign-up.html', function (req, res) {
	  res.render('templates/sign-up');
	});
	app.post('/reg',checkNotLogin);
	app.post('/reg',function(req, res){
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: req.body.name,
			password: password
		});
		User.get(newUser.name,function(err, user){
			if(err){
				req.flash('error',err);
				return res.json({msg:err});
			}
			if(user){
				req.flash('error','用户已存在');
				return res.json({msg:'用户已存在'});
			}
			newUser.save(function(err, user){
				if(err){
					req.flash('error',err);
					return res.json({msg:err});
				}
				req.session.user = user;
				req.flash('success','注册成功');
				res.json({
					msg:'HAS_LOGIN',
					status:1,
					user:req.session.user
				});
			});
		});
	});
	//退出
	app.post('/logout',checkLogin);
	app.post('/logout',function(req, res){
		req.session.user = null;
		res.json({
				msg:'NOT_LOGIN',
				status: 0
			});
	});
	//加载todo-list
	app.post('/lists', checkLogin);
	app.post('/lists',function(req, res){
		if(!req.session.user){
			res.json({
				msg:'NOT_LOGIN',
				status: 0
			});
		}else{
			var userName = req.session.user.name;
			//console.log(userName);
			Post.getAllBySize(userName, function(err, post){
				if(err){
					posts = [];
				}
				res.json({
					msg:'HAS_LOGIN',
					status: 1,
					user:req.session.user,
					post: post
				});
				//console.log(post);
			});
		}
	});
	//增加todo
	app.post('/create', checkLogin);
	app.post('/create',function(req, res){
		if(!req.session.user){
			res.json({
				msg:'NOT_LOGIN',
				status: 0
			});
		}else{
			var currentUser = req.session.user;
			var post_content = xss(req.body.post);
			//console.log(currentUser.name+" "+post_content);
			post = new Post(currentUser.name, post_content);
			post.save(function(err,post){
				if(err){
					req.flash('err',err);
					res.json({
						msg:'POST_FAILED',
						status:3,
					})
				}
				req.flash('success', '发表成功');
	          	res.json({
						msg:'POST_SUCCESS',
						status:2
					});
			})
		}
	});
	//删除todo
	app.post('/delete/:todo_id',function(req, res){
		//console.log(req.params.todo_id);
		Post.remove(req.params.todo_id, function(err){
			if(err){
				req.flash('error', err);
				return  res.json({
							msg:err,
							status:3,
						})
			}
			req.flash('success', '删除成功');
			res.json({
					msg:'DELETE_SUCCESS',
					status:2,
				})
		});
	});
};
function checkLogin(req, res, next){
	if(!req.session.user){
		req.flash('error','未登录');
		return res.json({msg:'NOT_LOGIN',status:0});
	}
	next();
}
function checkNotLogin(req, res, next){
	if(req.session.user){
		//console.log(1);
		req.flash('error','已登录');
		return res.json({msg:'HAS_LOGIN',status:1});
	}
	next();
}