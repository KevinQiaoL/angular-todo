var mongodb = require('./db');
var markdown = require('markdown').markdown;
var objectId = require('mongodb').ObjectID;
function Post(name, post){
	this.name = name;
	this.post = post;
}

module.exports = Post;

Post.prototype.save = function save(callback){
	var date = new Date();
	var time = {
		date  : date,
		year  : date.getFullYear(),
		month : date.getFullYear() + '-' + (date.getMonth() + 1),
		day  : date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
		minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	}
	var post = {
		name : this.name,
		time : time,
        post: this.post
	};
	mongodb.open(function(err , db){
		if(err){
			return callback(err);
		}
		//读取user集合
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				time:post.time
			},function(err, post){
				if(post){
					mongodb.close();
					return callback(err);
				}
			});
			//写入post 文档
			collection.insert(post,{
				safe:true
			},function(err, post){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, post);
			});
		});
	});
};
Post.getAllBySize  = function get(name, callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		// 读取 posts 集合
		db.collection('posts',function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			// 查找 name 属性为 username 的文档,如果 username 是 null 则匹配全部
			var query = {};
			if(name){
				query.name = name;
			}
			//使用 count 返回特定查询的文档数 total
			//console.log(query);
			collection.count(query, function (err) {
				if (err){
				  return callback(err);
				}
				//根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
				collection.find(query).sort({
				  time: -1
				}).toArray(function (err, docs) {
				  db.close();
				  if (err){
				      return callback(err);
				  }
				  /*docs.forEach(function (doc) {
				      doc.post = markdown.toHTML(doc.post);
				  });*/
				  //console.log(docs);
				  return callback(null, docs);
				});
			});
		});
	});
}
//删除
Post.remove = function(id, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//collection.findAndRemove({_id: new ObjectID(id)})
			collection.findAndRemove({
				_id : new objectId(id)
			}, function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}else{
					callback(null);
				}
			});
		});
	});
}

































