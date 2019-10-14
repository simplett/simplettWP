const express = require('express');
const fs = require('fs');
const path = require('path');
// const mysql = require('mysql');
const Pool=require("./pool")
const Multer = require('multer');
const ejs = require('ejs');

const server = express();


const loginRouter = express.Router();
const showRouter = express.Router();

server.listen(9111);
server.use(Multer({dest:'./wp/allFiles'}).any());

server.use('/login',loginRouter);
server.use('/show',showRouter);



server.use('/show.html',(req,res)=>{


	//console.log(req.query.page)
	if(req.query.page == undefined || req.query.page == 0){
		var page = 0
	}
	else{
		var page = req.query.page;
	}
	Pool.getConnection((err,c)=>{
		if(err){
			console.log(err);
			res.send({'ok':0,'msg':'数据库链接失败'});
			//c.end();
		}
		else{
			c.query('SELECT * FROM `allFiles`;',(err,data)=>{
				if(err){
					console.log(err);
					res.send({ok:0,data:'连接失败'});
				}
				else{
					data = data.reverse();
					var newData = data.slice(page*10,page*10+10);
					console.log(newData)
					ejs.renderFile('./wp/show.ejs',{allData:newData,page:page},function(err,data){

						res.send(data);
						//console.log(data)
					});
					//res.send({ok:1,data:data})
				};
				c.end();
			})
		}


	})
	

});

//download
showRouter.use('/addDownload',(req,res)=>{
	console.log(req.query.hash,req.query.user)
	Pool.getConnection((err,c)=>{
		if(err){
			console.log(err);
			res.send({'ok':0,'msg':'数据库链接失败'});
			//c.end();
		}
		else{
			c.query('SELECT download FROM `allFiles` WHERE hashName="'+req.query.hash+'" AND user="'+req.query.user+'";',(err,data)=>{
				if(err){
					console.log(err);
					res.send({'ok':0,'msg':'数据库链接失败'});
					c.end();
				}
				else{
					//[{download:0}]
					var d = Number(data[0].download)+1;
					//console.log(d,data)
					c.query('UPDATE `allFiles` SET download="'+d+'" WHERE hashName="'+req.query.hash+'" AND user="'+req.query.user+'";',(err,data)=>{
						if(err){
							console.log(err);
							res.send({'ok':0,'msg':'数据库链接失败'});
							c.end();
						}
						else{
							c.query('UPDATE `'+req.query.user+'` SET download="'+d+'" WHERE hashName="'+req.query.hash+'";',(err,data)=>{
								if(err){
									console.log(err);
									res.send({'ok':0,'msg':'数据库链接失败'});
									c.end();
								}
								else{
									res.send({'ok':1,'msg':'下载成功'});
								}
								c.end();
							})
						}
					})
				}
			})

		}

	})
});


//show页面
showRouter.use('/showPage',(req,res)=>{
	Pool.getConnection((err,c)=>{
		if(err){
			console.log(err);
			res.send({'ok':0,'msg':'数据库链接失败'});
			//c.end();
		}
		else{
			c.query('SELECT * FROM `allFiles`;',(err,data)=>{
				if(err){
					console.log(err);
					res.send({ok:0,data:'连接失败'});
				}
				else{
					res.send({ok:1,data:data})
				};
				c.end();
			})
		}


	})
});



//上传文件接口

loginRouter.use('/getfiles',(req,res)=>{
	console.log(req.files)//{name:filsssss}
	var newName =req.files[0].path + path.parse(req.files[0].originalname).ext;
	var hashName = req.files[0].filename+ path.parse(req.files[0].originalname).ext;
	var thisTime = new Date().toLocaleDateString()+' '+new Date().toLocaleTimeString();
	fs.rename(req.files[0].path,newName,(err)=>{
		if(err){
			console.log(err);
		}
		else{
			Pool.getConnection((err,c)=>{
				if(err){
					console.log(err);
					res.send({'ok':0,'msg':'数据库链接失败'});
					c.end();
				}
				else{
					c.query('INSERT INTO `'+req.body.Fsnames+'` (`lastName`,`hashName`,`size`,`type`,`download`,`lastTime`) VALUES("'+req.files[0].originalname+'","'+hashName+'","'+req.files[0].size+'","'+path.parse(req.files[0].originalname).ext+'","0","'+thisTime+'");',(err,data)=>{
						if(err){
							console.log(err);
							res.send({'ok':0,'msg':'存储失败'});
							c.end();

						}
						else{
							//
							c.query('INSERT INTO `allFiles` (`lastName`,`hashName`,`size`,`type`,`download`,`lastTime`,`user`) VALUES("'+req.files[0].originalname+'","'+hashName+'","'+req.files[0].size+'","'+path.parse(req.files[0].originalname).ext+'","0","'+thisTime+'","'+req.body.Fsnames+'");',(err,data)=>{
								if(err){
									console.log(err);
									res.send({'ok':0,'msg':'存储失败'});
								}
								else{
									res.send({'ok':1,'msg':'上传成功',hash:hashName,timer:thisTime});

								}
								c.end();

							})

						}
					})
					
				}
			})


		}
	})

});

//注册
loginRouter.use('/res',(req,res)=>{
	//console.log(req.query);
	Pool.getConnection((err,c)=>{
		if(err){
			console.log(err);
			res.send({'ok':0,'msg':'数据库链接失败'});
		}
		else{
			c.query('SELECT user FROM `usertab` WHERE user="'+req.query.user+'";',(err,data)=>{
				if(err){
					console.log(err);
					res.send({'ok':0,'msg':'数据库链接失败'});
					c.end();
				}
				else{
					if(data.length>0){
						res.send({'ok':0,'msg':'用户名已占用'});
						c.end();
					}
					else{
						c.query('INSERT INTO `usertab` (`user`,`pass`) VALUES("'+req.query.user+'","'+req.query.pass+'");',(err,data)=>{
							if(err){
								console.log(err);
								res.send({'ok':0,'msg':'数据库链接失败'});
								c.end();
							}
							else{
								
								c.query(`CREATE TABLE ${req.query.user}
										(
										ID int(255) NOT NULL AUTO_INCREMENT,
										LastName varchar(255) NOT NULL,
										hashName varchar(255) NOT NULL,
										lastTime varchar(255) NOT NULL,
										type varchar(255),
										size varchar(255) NOT NULL,
										download varchar(255) NOT NULL,
										PRIMARY KEY (ID)
									)`,(err,data)=>{

									if(err){
										console.log(err);
									}
									else{
										res.send({'ok':1,'msg':'恭喜您,注册成功'});
									};
									c.end();		


								})



							}	
							//c.end();
						})
					}
				}
			});
		}
	});
});
//删除文件
loginRouter.use('/removeFile',(req,res)=>{
	//console.log(req.query)
	fs.unlink('./wp/allFiles/'+req.query.hash,(err)=>{
		if(err){
			console.log(err);
			res.send({ok:0,msg:'删除失败了'})
		}
		else{
			Pool.getConnection((err,c)=>{
				if(err){
					console.log(err);
					res.send({ok:0,msg:'删除失败了'});
					//c.end();
				}
				else{
					c.query('DELETE FROM `'+req.query.user+'` WHERE hashName="'+req.query.hash+'";',(err,data)=>{
						if(err){
							console.log(err);
							res.send({ok:0,msg:'删除失败了'});
							c.end();
						}
						else{
							c.query('DELETE FROM `allFiles` WHERE hashName="'+req.query.hash+'" AND user="'+req.query.user+'";',(err,data)=>{

								if(err){
									console.log(err);
									res.send({ok:0,msg:'删除失败了'});

								}
								else{
									res.send({ok:1,msg:'删除成功了'});

								};
								c.end();
							})

						};
						
					})
				}

			})

		}
	})
});


//登录
loginRouter.use('/login',(req,res)=>{
	//console.log(req.query);
	//console.log(1)
	Pool.getConnection((err,c)=>{
		if(err){
			console.log(err);
			res.send({'ok':0,'msg':'数据库链接失败'});
		}
		else{
			c.query('SELECT user,pass FROM `usertab` WHERE user="'+req.query.user+'" AND pass="'+req.query.pass+'";',(err,data)=>{
				if(err){
					console.log(err);
					res.send({'ok':0,'msg':'数据库链接失败'});
					c.end();
				}
				else{
					//[{user:leo,pass:123}]
					if(data.length>0){
						//
						c.query('SELECT LastName,hashName,size,lastTime,download FROM `'+req.query.user+'`;',(err,data)=>{
							if(err){
								console.log(err);
								res.send({'ok':0,'msg':'数据库链接失败'});
							}
							else{
								res.send({'ok':1,'msg':'登陆成功','data':data});
							}
							c.end();
						});


						
						
					}
					else{
						//[]
						res.send({'ok':0,'msg':'用户或密码错误'});
						c.end();
					}
					//c.end();
				}
			});
		}
	});
});

server.use('/',express.static('./wp'))
