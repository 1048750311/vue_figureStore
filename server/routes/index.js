var express = require('express');
var router = express.Router();
var connection = require('../db/sql.js');
var user = require('../db/userSql.js');
var QcloudSms = require("qcloudsms_js");
let jwt = require('jsonwebtoken');
//引入支付宝配置文件
const alipaySdk = require('../db/alipay.js');
const AlipayFormData = require('alipay-sdk/lib/form').default;
//引入axiso
const axios = require('axios');


function getTimeToken(exp) {

	let getTime = parseInt(new Date().getTime() / 1000);

	if (getTime - exp > 60) {
		return true;
	}

}

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Express' });
});


//支付状态
router.post('/api/successPayment', function (req, res, next) {
	//token
	let token = req.headers.token;
	let tokenObj = jwt.decode(token);
	//订单号
	let out_trade_no = req.body.out_trade_no;
	let trade_no = req.body.trade_no;
	//支付宝配置
	const formData = new AlipayFormData();
	// 调用 setMethod 并传入 get，会返回可以跳转到支付页面的 url
	formData.setMethod('get');
	//支付时信息
	formData.addField('bizContent', {
		out_trade_no,
		trade_no
	});
	//返回promise
	const result = alipaySdk.exec(
		'alipay.trade.query',
		{},
		{ formData: formData },
	);
	//后端请求支付宝
	result.then(resData => {
		axios({
			method: 'GET',
			url: resData
		}).then(data => {
			let responseCode = data.data.alipay_trade_query_response;
			if (responseCode.code == '10000') {
				switch (responseCode.trade_status) {
					case 'WAIT_BUYER_PAY':
						res.send({
							data: {
								code: 0,
								data: {
									msg: '支付宝有交易记录，没付款'
								}
							}
						})
						break;

					case 'TRADE_CLOSED':
						res.send({
							data: {
								code: 1,
								data: {
									msg: '交易关闭'
								}
							}
						})
						break;

					case 'TRADE_FINISHED':
						connection.query(`select * from user where tel = ${tokenObj.tel}`, function (error, results) {
							//用户id
							let uId = results[0].id;
							connection.query(`select * from store_order where uId = ${uId} and order_id = ${out_trade_no}`, function (err, result) {
								let id = result[0].id;
								//订单的状态修改掉2==》3
								connection.query(`update store_order set order_status = replace(order_status,'2','3') where id = ${id}`, function () {
									res.send({
										data: {
											code: 2,
											data: {
												msg: '交易完成'
											}
										}
									})
								})
							})
						})
						break;

					case 'TRADE_SUCCESS':
						connection.query(`select * from user where tel = ${tokenObj.tel}`, function (error, results) {
							//用户id
							let uId = results[0].id;
							connection.query(`select * from store_order where uId = ${uId} and order_id = ${out_trade_no}`, function (err, result) {
								let id = result[0].id;
								//订单的状态修改掉2==》3
								connection.query(`update store_order set order_status = replace(order_status,'2','3') where id = ${id}`, function () {
									res.send({
										data: {
											code: 2,
											data: {
												msg: '交易完成'
											}
										}
									})
								})
							})
						})
						break;
				}
			} else if (responseCode.code == '40004') {
				res.send({
					data: {
						code: 4,
						msg: '交易不存在'
					}
				})
			}
		}).catch(err => {
			res.send({
				data: {
					code: 500,
					msg: '交易失败',
					err
				}
			})
		})
	})
})
//发起支付
router.post('/api/payment', function (req, res, next) {
	//订单号
	let orderId = req.body.orderId;
	//商品总价
	let price = req.body.price;
	//购买商品的名称
	let name = req.body.name;
	//开始对接支付宝API
	const formData = new AlipayFormData();
	// 调用 setMethod 并传入 get，会返回可以跳转到支付页面的 url
	formData.setMethod('get');
	//支付时信息
	formData.addField('bizContent', {
		outTradeNo: orderId,//订单号
		productCode: 'FAST_INSTANT_TRADE_PAY',//写死的
		totalAmount: price,//价格
		subject: name,//商品名称
	});
	//支付成功或者失败跳转的链接
	formData.addField('returnUrl', 'http://localhost:8080/payment');
	//返回promise
	const result = alipaySdk.exec(
		'alipay.trade.page.pay',
		{},
		{ formData: formData },
	);
	//对接支付宝成功，支付宝方返回的数据
	result.then(resp => {
		res.send({
			data: {
				code: 200,
				success: true,
				msg: '支付中',
				paymentUrl: resp
			}
		})
	})
})

//修改订单状态
router.post('/api/submitOrder', function (req, res, next) {
	//token
	let token = req.headers.token;
	let tokenObj = jwt.decode(token);
	//订单号
	let orderId = req.body.orderId;
	//购物车选中的商品id
	let shopArr = req.body.shopArr;
	//查询用户
	connection.query(`select * from user where tel = ${tokenObj.tel}`, function (error, results) {
		//用户id
		let uId = results[0].id;
		connection.query(`select * from store_order where uId = ${uId} and order_id = ${orderId}`, function (err, result) {
			//订单的数据库id
			let id = result[0].id;
			//修改订单状态 1==>2
			connection.query(`update store_order set order_status = replace(order_status,'1','2') where id = ${id}`, function (e, r) {
				//购物车数据删除
				shopArr.forEach(v => {
					connection.query(`delete from goods_cart where id = ${v}`, function () {

					})
				})
				res.send({
					data: {
						code: 200,
						success: true
					}
				})
			})
		})
	})

})
//查询订单
router.post('/api/selectOrder', function (req, res, next) {
	//接收前端给后端的订单号
	let orderId = req.body.orderId;
	connection.query(`select * from store_order where order_id='${orderId}'`, function (err, result) {
		res.send({
			data: {
				success: true,
				code: 200,
				data: result
			}
		})
	})
})
//生成一个订单
router.post('/api/addOrder', function (req, res, next) {
	//token
	let token = req.headers.token;
	let tokenObj = jwt.decode(token);
	//前端给后端的数据
	let goodsArr = req.body.arr;
	//生成订单号order_id，规则：时间戳 + 6为随机数
	function setTimeDateFmt(s) {
		return s < 10 ? '0' + s : s
	}
	function randomNumber() {
		const now = new Date();
		let month = now.getMonth() + 1;
		let day = now.getDate();
		let hour = now.getHours();
		let minutes = now.getMinutes();
		let seconds = now.getSeconds();
		month = setTimeDateFmt(month);
		day = setTimeDateFmt(day);
		hour = setTimeDateFmt(hour);
		minutes = setTimeDateFmt(minutes);
		seconds = setTimeDateFmt(seconds);
		let orderCode = now.getFullYear().toString() + month.toString() + day + hour + minutes + seconds + (Math.round(Math.random() * 1000000)).toString();
		return orderCode;
	}
	/*
	未支付：1
	待支付：2
	支付成功：3
	支付失败：4 | 0
	*/
	//商品列表名称
	let goodsName = [];
	//订单商品总金额
	let goodsPrice = 0;
	//订单商品总数量
	let goodsNum = 0;
	//订单号
	let orderId = randomNumber();

	goodsArr.forEach(v => {
		goodsName.push(v.goods_name);
		goodsPrice += v.goods_price * v.goods_num;
		goodsNum += parseInt(v.goods_num);
	})
	//查询当前用户
	connection.query(`select * from user where tel = ${tokenObj.tel}`, function (error, results) {
		//用户id
		let uId = results[0].id;
		connection.query(`insert into store_order (order_id,goods_name,goods_price,goods_num,order_status,uId) values ('${orderId}','${goodsName}','${goodsPrice}','${goodsNum}','1',${uId})`, function () {
			connection.query(`select * from store_order where uId = ${uId} and order_id='${orderId}'`, function (err, result) {
				res.send({
					data: {
						success: true,
						code: 200,
						data: result
					}
				})
			})
		})
	})

})
//删除收货地址
router.post('/api/deleteAddress', function (req, res, next) {
	let id = req.body.id;
	connection.query(`delete from address where id = ${id}`, function (error, results) {
		res.send({
			data: {
				code: 200,
				success: true,
				msg: '删除成功'
			}
		})
	})
})
//修改收货地址
router.post('/api/updateAddress', function (req, res, next) {
	//token
	let token = req.headers.token;
	let tokenObj = jwt.decode(token);
	//拿到前端给后端传入的数据
	let body = req.body;
	let [id, name, tel, province, city, county, addressDetail, isDefault, areaCode] = [
		body.id,
		body.name,
		body.tel,
		body.province,
		body.city,
		body.county,
		body.addressDetail,
		body.isDefault,
		body.areaCode
	];
	//查询用户
	connection.query(`select * from user where tel = ${tokenObj.tel}`, function (error, results) {
		//用户id
		let uId = results[0].id;
		//对应查询到0 或者 1 有没有默认收货地址
		connection.query(`select * from address where uId = ${uId} and isDefault = ${isDefault}`, function (err, result) {
			if (result.length > 0) {
				let addressId = result[0].id;
				connection.query(`update address isDefault = replace(isDefault,'1','0') where id = ${addressId}`, function (e, r) {
					let updateSql = `update address set uId = ? , name = ? , tel = ? , province = ? , city = ? ,county = ? , addressDetail = ? , isDefault = ? , areaCode = ? where id = ${id}`;
					connection.query(updateSql, [uId, name, tel, province, city, county, addressDetail, isDefault, areaCode], function (errors, datas) {
						res.send({
							data: {
								code: 200,
								success: true,
								msg: '修改成功'
							}
						})
					})
				})
			} else {
				let updateSql = `update address set uId = ? , name = ? , tel = ? , province = ? , city = ? ,county = ? , addressDetail = ? , isDefault = ? , areaCode = ? where id = ${id}`;
				connection.query(updateSql, [uId, name, tel, province, city, county, addressDetail, isDefault, areaCode], function (errors, datas) {
					res.send({
						data: {
							code: 200,
							success: true,
							msg: '修改成功'
						}
					})
				})
			}
		})
	})
})
//查询收货地址
router.post('/api/selectAddress', function (req, res, next) {
	//token
	let token = req.headers.token;
	let tokenObj = jwt.decode(token);

	//查询用户
	connection.query(`select * from user where tel = ${tokenObj.tel}`, function (error, results) {
		//用户id
		let uId = results[0].id;
		connection.query(`select * from address where uId = ${uId}`, function (err, result) {
			res.send({
				data: {
					code: 200,
					success: true,
					msg: '查询成功',
					data: result
				}
			})
		})
	})
})
//新增收货地址
router.post('/api/addAddress', function (req, res, next) {
	//token
	let token = req.headers.token;
	let tokenObj = jwt.decode(token);
	//拿到前端给后端传入的数据
	let body = req.body;
	let [name, tel, province, city, county, addressDetail, isDefault, areaCode] = [
		body.name,
		body.tel,
		body.province,
		body.city,
		body.county,
		body.addressDetail,
		body.isDefault,
		body.areaCode
	];

	//查询用户
	connection.query(`select * from user where tel = ${tokenObj.tel}`, function (error, results) {
		//用户id
		let uId = results[0].id;
		//增加一条收货地址
		if (isDefault != 1) {
			connection.query(`insert into address (uId,name,tel,province,city,county,addressDetail,isDefault,areaCode) values (${uId},"${name}","${tel}","${province}","${city}","${county}","${addressDetail}","${isDefault}","${areaCode}")`, function (err, result) {
				res.send({
					data: {
						code: 200,
						success: true,
						msg: '收货地址添加成功'
					}
				})
			})
		} else {

			connection.query(`select * from address where uId = ${uId} and isDefault = ${isDefault}`, function (err, result) {
				if (result.length > 0) {
					let addressId = result[0].id;
					connection.query(`update address set isDefault = replace(isDefault,'1','0') where id = ${addressId}`, function () {
						connection.query(`insert into address (uId,name,tel,province,city,county,addressDetail,isDefault,areaCode) values (${uId},"${name}","${tel}","${province}","${city}","${county}","${addressDetail}","${isDefault}","${areaCode}")`, function (e, r) {
							res.send({
								data: {
									code: 200,
									success: true,
									msg: '收货地址添加成功'
								}
							})
						})
					})
				} else {
					connection.query(`insert into address (uId,name,tel,province,city,county,addressDetail,isDefault,areaCode) values (${uId},"${name}","${tel}","${province}","${city}","${county}","${addressDetail}","${isDefault}","${areaCode}")`, function (err, result) {
						res.send({
							data: {
								code: 200,
								success: true,
								msg: '收货地址添加成功'
							}
						})
					})
				}
			})

		}
	})
})
//修改购物车数量
router.post('/api/updateNum', function (req, res, next) {

	let id = req.body.id;
	let changeNum = req.body.num;

	connection.query(`select * from goods_cart where id = ${id}`, function (error, results) {
		//原来的数量
		let num = results[0].goods_num;
		connection.query(`update goods_cart set goods_num = replace(goods_num,${num},${changeNum}) where id = ${id}`, function (err, result) {
			res.send({
				data: {
					code: 200,
					success: true
				}
			})
		})

	})

})
//删除购物车数据
router.post('/api/deleteCart', function (req, res, next) {

	let arrId = req.body.arrId;

	for (let i = 0; i < arrId.length; i++) {
		connection.query(`delete from goods_cart where id = ${arrId[i]}`, function (error, results) {
			res.send({
				data: {
					code: 200,
					success: true,
					msg: '删除成功'
				}
			})
		})
	}
})

//查询购物车数据
router.post('/api/selectCart', function (req, res, next) {
	//token
	let token = req.headers.token;
	let tokenObj = jwt.decode(token);
	//查询用户
	connection.query(`select * from user where tel = ${tokenObj.tel}`, function (error, results) {
		//用户id
		let uId = results[0].id;
		//查询购物车
		connection.query(`select * from goods_cart where uId = ${uId}`, function (err, result) {
			res.send({
				data: {
					code: 200,
					success: true,
					data: result
				}
			})
		})
	})
})
//添加购物车数据
router.post('/api/addCart', function (req, res, next) {
	//后端接收前端的参数
	let goodsId = req.body.goodsId;
	//token
	let token = req.headers.token;
	let tokenObj = jwt.decode(token);

	//如果执行，就证明token过期了

	// if (getTimeToken(tokenObj.exp)) {
	// 	console.log('过期了');

	// 	res.send({
	// 		data: {
	// 			code: 1000
	// 		}
	// 	})
	// 	return ;
	// }

	//查询用户
	connection.query(`select * from user where tel = ${tokenObj.tel}`, function (error, results) {
		//用户id
		let uId = results[0].id;
		//查询商品
		connection.query(`select * from goods_list where id=${goodsId}`, function (err, result) {
			let goodsName = result[0].name;
			let goodsPrice = result[0].price;
			let goodsImgUrl = result[0].imgUrl;
			//查询当前用户在之前是否添加过本商品
			connection.query(`select * from goods_cart where uId=${uId} and goods_id=${goodsId}`, function (e, r) {
				//用户之前是添加过商品到购物车
				if (r.length > 0) {
					let num = r[0].goods_num;
					connection.query(`update goods_cart set goods_num = replace(goods_num,${num},${parseInt(num) + 1}) where id = ${r[0].id}`, function (e, datas) {
						res.send({
							data: {
								code: 200,
								success: true,
								msg: '添加成功'
							}
						})
					})
					return;
				} else {
					//没有
					connection.query(`insert into goods_cart (uId,goods_id,goods_name,goods_price,goods_num,goods_imgUrl) values ("${uId}","${goodsId}","${goodsName}","${goodsPrice}","1","${goodsImgUrl}")`, function () {
						res.send({
							data: {
								code: 200,
								success: true,
								msg: '添加成功'
							}
						})
					})
				}
			})
		})
	})
})
//修改密码
router.post('/api/recovery', function (req, res, next) {
	let params = {
		userTel: req.body.phone,
		userPwd: req.body.pwd
	}
	//查询用户是否存在
	connection.query(user.queryUserTel(params), function (error, results) {
		//某一条记录数id
		let id = results[0].id;
		let pwd = results[0].pwd;
		console.log(`update user set pwd = replace(pwd,${pwd},${params.userPwd}) where id = ${id}`)
		connection.query(`update user set pwd = replace(pwd,'${pwd}','${params.userPwd}') where id = ${id}`, function (err, result) {
			res.send({
				code: 200,
				data: {
					success: true,
					msg: '修改成功'
				}
			})
		})
	})
})

//查询用户是否存在
router.post('/api/selectUser', function (req, res, next) {

	let params = {
		userTel: req.body.phone
	}
	//查询用户是否存在

	connection.query(user.queryUserTel(params), function (error, results) {
		if (results.length > 0) {
			res.send({
				code: 200,
				data: {
					success: true
				}
			})
		} else {
			res.send({
				code: 0,
				data: {
					success: false,
					msg: '此用户不存在'
				}
			})
		}
	})
})
//注册
router.post('/api/register', function (req, res, next) {
	let params = {
		userTel: req.body.phone,
		userPwd: req.body.pwd
	}
	//查询用户是否存在
	connection.query(user.queryUserTel(params), function (error, results) {
		if (error) throw error;
		//用户存在
		if (results.length > 0) {
			res.send({
				code: 200,
				data: {
					success: true,
					msg: '当前用户已注册，请登录',
					data: results[0]
				}
			})
		} else {
			//不存在，新增一条数据
			connection.query(user.inserData(params), function (err, result) {
				connection.query(user.queryUserTel(params), function (e, r) {
					res.send({
						code: 200,
						data: {
							success: true,
							msg: '登录成功',
							data: r[0]
						}
					})
				})
			})
		}
	})
})

//增加一个用户
router.post('/api/addUser', function (req, res, next) {

	let params = {
		userTel: req.body.phone
	}
	//查询用户是否存在
	connection.query(user.queryUserTel(params), function (error, results) {
		if (error) throw error;
		//用户存在
		if (results.length > 0) {
			res.send({
				code: 200,
				data: {
					success: true,
					msg: '登录成功',
					data: results[0]
				}
			})
		} else {
			//不存在，新增一条数据
			connection.query(user.inserData(params), function (err, result) {
				connection.query(user.queryUserTel(params), function (e, r) {
					res.send({
						code: 200,
						data: {
							success: true,
							msg: '登录成功',
							data: r[0]
						}
					})
				})
			})
		}
	})
})
//发送短信验证码
router.post('/api/code', function (req, res, next) {

	let tel = req.body.phone;

	// 短信应用SDK AppID
	var appid = 1400187558;  // SDK AppID是1400开头

	// 短信应用SDK AppKey
	var appkey = "dc9dc3391896235ddc2325685047edc7";

	// 需要发送短信的手机号码
	var phoneNumbers = [tel];

	// 短信模板ID，需要在短信应用中申请
	var templateId = 285590;  // NOTE: 这里的模板ID`7839`只是一个示例，真实的模板ID需要在短信控制台中申请

	// 签名
	var smsSign = "潮玩周边";  // NOTE: 这里的签名只是示例，请使用真实的已申请的签名, 签名参数使用的是`签名内容`，而不是`签名ID`

	// 实例化QcloudSms
	var qcloudsms = QcloudSms(appid, appkey);

	// 设置请求回调处理, 这里只是演示，用户需要自定义相应处理回调
	function callback(err, ress, resData) {
		if (err) {
			console.log("err: ", err);
		} else {
			res.send({
				code: 200,
				data: {
					success: true,
					data: ress.req.body.params[0]
				}
			})
		}
	}

	var ssender = qcloudsms.SmsSingleSender();
	//这个变量：params 就是往手机上，发送的短信
	var params = [Math.floor(Math.random() * (9999 - 1000)) + 1000];
	ssender.sendWithParam(86, phoneNumbers[0], templateId,
		params, smsSign, "", "", callback);  // 签名参数不能为空串

})

//手机号登录
router.post('/api/phonelogin', function (req, res, next) {
	//后端要接收前端传递过来的值
	let params = {
		userTel: req.body.userTel,
	};

	let userTel = params.userTel;
	//引入token包
	let jwt = require('jsonwebtoken');
	//用户信息
	let payload = { tel: userTel };
	//口令
	let secret = 'xiaoluxian';
	//生成token
	let token = jwt.sign(payload, secret, {
		expiresIn: 86400
	});

	//查询用户手机号是否存在
	connection.query(user.queryUserTel(params), function (error, results) {
		//手机号存在 
		console.log(results)
		if (results.length > 0) {
			//记录的id
			let id = results[0].id;
			connection.query(`update user set token = '${token}' where id = ${id}`, function () {
				//手机号和密码都对
				res.send({
					code: 200,
					data: {
						success: true,
						msg: '登录成功',
						data: results[0]
					}
				})
			})

} else {
	//不存在
	res.send({
		code: 301,
		data: {
			success: false,
			msg: '手机号不存在'
		}
	})
}
	})
})
//登录
router.post('/api/login', function (req, res, next) {
	//后端要接收前端传递过来的值
	let params = {
		userTel: req.body.userTel,
		userPwd: req.body.userPwd
	};

	let userTel = params.userTel;
	let userPwd = params.userPwd || '666666';
	//引入token包
	let jwt = require('jsonwebtoken');
	//用户信息
	let payload = { tel: userTel };
	//口令
	let secret = 'xiaoluxian';
	//生成token
	let token = jwt.sign(payload, secret, {
		expiresIn: 86400
	});

	//查询用户手机号是否存在
	connection.query(user.queryUserTel(params), function (error, results) {
		//手机号存在 
		if (results.length > 0) {
			//记录的id
			let id = results[0].id;

			connection.query(user.queryUserPwd(params), function (err, result) {
				if (result.length > 0) {
					connection.query(`update user set token = '${token}' where id = ${id}`, function () {
						//手机号和密码都对
						res.send({
							code: 200,
							data: {
								success: true,
								msg: '登录成功',
								data: result[0]
							}
						})
					})

				} else {
					//密码不对
					res.send({
						code: 302,
						data: {
							success: false,
							msg: '密码不正确'
						}
					})
				}
			})

		} else {
			//不存在
			res.send({
				code: 301,
				data: {
					success: false,
					msg: '手机号不存在'
				}
			})
		}
	})
})



//查询商品id的数据
router.get('/api/goods/id', function (req, res, next) {
	let id = req.query.id;
	connection.query('select * from goods_list where id=' + id + '', function (error, results) {
		if (error) throw error;
		res.json({
			code: 0,
			data: results[0]
		})
	})
})

//分类的接口
router.get('/api/goods/list', function (req, res, next) {

	res.send({
		code: 0,
		data: [
			{
				//一级
				id: 0,
				name: '推荐',
				data: [
					{
						//二级
						id: 0,
						name: '推荐',
						list: [
							//三级
							{
								id: 0,
								name: '某手办',
								imgUrl: './images/list1.jpg'
							},
							{
								id: 1,
								name: '某手办',
								imgUrl: './images/list2.jpg'
							},
							{
								id: 3,
								name: '某手办',
								imgUrl: './images/list3.jpg'
							},
							{
								id: 4,
								name: '某手办',
								imgUrl: './images/list4.jpg'
							},
							{
								id: 5,
								name: '某手办',
								imgUrl: './images/list1.jpg'
							},
						]
					}
				]
			},
			{
				//一级
				id: 1,
				name: '手办',
				data: [
					{
						//二级
						id: 0,
						name: '手办',
						list: [
							//三级
							{
								id: 0,
								name: '某手办',
								imgUrl: './images/list1.jpg'
							},
							{
								id: 1,
								name: '某手办',
								imgUrl: './images/list2.jpg'
							},
							{
								id: 3,
								name: '某手办',
								imgUrl: './images/list3.jpg'
							},
							{
								id: 4,
								name: '某手办',
								imgUrl: './images/list4.jpg'
							},
							{
								id: 5,
								name: '某手办',
								imgUrl: './images/list1.jpg'
							},
						]
					}
				]
			},
			{
				//一级
				id: 2,
				name: '周边',
				data: [
					{
						//二级
						id: 0,
						name: '周边',
						list: [
							//三级
							{
								id: 0,
								name: '某手办',
								imgUrl: './images/list1.jpg'
							},
							{
								id: 1,
								name: '某手办',
								imgUrl: './images/list2.jpg'
							},
							{
								id: 3,
								name: '某手办',
								imgUrl: './images/list3.jpg'
							},
							{
								id: 4,
								name: '某手办',
								imgUrl: './images/list4.jpg'
							},
							{
								id: 5,
								name: '某手办',
								imgUrl: './images/list1.jpg'
							},
						]
					}
				]
			},
			{
				//一级
				id: 3,
				name: '数码',
				data: [
					{
						//二级
						id: 0,
						name: '数码',
						list: [
							//三级
							{
								id: 0,
								name: '某手办',
								imgUrl: './images/list1.jpg'
							},
							{
								id: 1,
								name: '某手办',
								imgUrl: './images/list2.jpg'
							},
							{
								id: 3,
								name: '某手办',
								imgUrl: './images/list3.jpg'
							},
							{
								id: 4,
								name: '某手办',
								imgUrl: './images/list4.jpg'
							},
							{
								id: 5,
								name: '某手办',
								imgUrl: './images/list1.jpg'
							},
						]
					}
				]
			},
			{
				//一级
				id: 4,
				name: '漫展',
				data: [
					{
						//二级
						id: 0,
						name: '漫展',
						list: [
							//三级
							{
								id: 0,
								name: '某手办',
								imgUrl: './images/list1.jpg'
							},
							{
								id: 1,
								name: '某手办',
								imgUrl: './images/list2.jpg'
							},
							{
								id: 3,
								name: '某手办',
								imgUrl: './images/list3.jpg'
							},
							{
								id: 4,
								name: '某手办',
								imgUrl: './images/list4.jpg'
							},
							{
								id: 5,
								name: '某手办',
								imgUrl: './images/list1.jpg'
							},
						]
					}
				]
			},
			{
				//一级
				id: 5,
				name: '游戏',
				data: [
					{
						//二级
						id: 0,
						name: '游戏',
						list: [
							//三级
							{
								id: 0,
								name: '某手办',
								imgUrl: './images/list1.jpg'
							},
							{
								id: 1,
								name: '某手办',
								imgUrl: './images/list2.jpg'
							},
							{
								id: 3,
								name: '某手办',
								imgUrl: './images/list3.jpg'
							},
							{
								id: 4,
								name: '某手办',
								imgUrl: './images/list4.jpg'
							},
							{
								id: 5,
								name: '某手办',
								imgUrl: './images/list1.jpg'
							},
						]
					}
				]
			},

		]
	})

})


//查询商品数据接口
router.get('/api/goods/shopList', function (req, res, next) {
	//前端给后端的数据
	let [searchName, orderName] = Object.keys(req.query);
	let [name, order] = Object.values(req.query);

	connection.query('select * from goods_list where name like "%' + name + '%" order by ' + orderName + ' ' + order + '', function (error, results) {
		res.send({
			code: 0,
			data: results
		})
	})
})

//首页电子科大的数据
router.get('/api/index_list/7/data/1', function (req, res, next) {
	res.send({
		code: 0,
		data: [
			{
				id: 1,
				type: 'adList',
				data: [
					{
						id: 1,
						imgUrl: './images/zhoubian.jpg'
					},
				]
			},
			{
				id: 1,
				type: 'iconsList',
				data: [
					{
						id: 1,
						title: '手办',
						imgUrl: './images/icon1.png'
					},
					{
						id: 2,
						title: '周边',
						imgUrl: './images/icon2.png'
					},
					{
						id: 3,
						title: '漫展',
						imgUrl: './images/icon3.png'
					},
					{
						id: 4,
						title: '新品',
						imgUrl: './images/icon4.png'
					},
					{
						id: 5,
						title: '漫画',
						imgUrl: './images/icon5.png'
					}
				]
			},
			{
				id: 3,
				type: 'likeList',
				data: [
					{
						id: 1,
						imgUrl: './images/goods1.jpg',
						name: '哔哩哔哩 22+33娘 干杯Ver. 景品手办',
						price: 99
					},
					{
						id: 2,
						imgUrl: './images/goods2.jpg',
						name: '《明日方舟纪念插画集Vol.1》 画集 ',
						price: 88
					},
					{
						id: 3,
						imgUrl: './images/goods3.jpg',
						name: '哔哩哔哩 幻星集Ⅱ 2233 亚克力御守',
						price: 15
					},
					{
						id: 4,
						imgUrl: './images/goods4.jpg',
						name: '欢乐大乱斗系列 群英荟萃 SSR超神魔力赏',
						price: 35
					},
					{
						id: 5,
						imgUrl: './images/goods5.jpg',
						name: '寿屋 进击的巨人 利威尔 坚毅不屈 Ver. 手办 再版',
						price: 888
					},
					{
						id: 6,
						imgUrl: './images/goods6.jpg',
						name: '世嘉 VOCALOID 初音未来 2022雪未来 超大毛绒玩偶',
						price: 649
					},
					{
						id: 7,
						imgUrl: './images/goods7.jpg',
						name: '明日方舟 人气粘土人是超神vol.3 魔力赏',
						price: 999
					},
				]
			}

		]
	})
})
//首页游戏的数据
router.get('/api/index_list/6/data/1', function (req, res, next) {
	res.send({
		code: 0,
		data: [
			{
				id: 1,
				type: 'adList',
				data: [
					{
						id: 1,
						imgUrl: './images/youxi.jpg'
					},
				]
			},
			{
				id: 1,
				type: 'iconsList',
				data: [
					{
						id: 1,
						title: '手办',
						imgUrl: './images/icon1.png'
					},
					{
						id: 2,
						title: '周边',
						imgUrl: './images/icon2.png'
					},
					{
						id: 3,
						title: '漫展',
						imgUrl: './images/icon3.png'
					},
					{
						id: 4,
						title: '新品',
						imgUrl: './images/icon4.png'
					},
					{
						id: 5,
						title: '漫画',
						imgUrl: './images/icon5.png'
					}
				]
			},
			{
				id: 3,
				type: 'likeList',
				data: [
					{
						id: 1,
						imgUrl: './images/goods1.jpg',
						name: '哔哩哔哩 22+33娘 干杯Ver. 景品手办',
						price: 99
					},
					{
						id: 2,
						imgUrl: './images/goods2.jpg',
						name: '《明日方舟纪念插画集Vol.1》 画集 ',
						price: 88
					},
					{
						id: 3,
						imgUrl: './images/goods3.jpg',
						name: '哔哩哔哩 幻星集Ⅱ 2233 亚克力御守',
						price: 15
					},
					{
						id: 4,
						imgUrl: './images/goods4.jpg',
						name: '欢乐大乱斗系列 群英荟萃 SSR超神魔力赏',
						price: 35
					},
					{
						id: 5,
						imgUrl: './images/goods5.jpg',
						name: '寿屋 进击的巨人 利威尔 坚毅不屈 Ver. 手办 再版',
						price: 888
					},
					{
						id: 6,
						imgUrl: './images/goods6.jpg',
						name: '世嘉 VOCALOID 初音未来 2022雪未来 超大毛绒玩偶',
						price: 649
					},
					{
						id: 7,
						imgUrl: './images/goods7.jpg',
						name: '明日方舟 人气粘土人是超神vol.3 魔力赏',
						price: 999
					},
				]
			}

		]
	})
})
//首页漫展的数据
router.get('/api/index_list/5/data/1', function (req, res, next) {
	res.send({
		code: 0,
		data: [
			{
				id: 1,
				type: 'adList',
				data: [
					{
						id: 1,
						imgUrl: './images/manzhan.jpg'
					},
				]
			},
			{
				id: 1,
				type: 'iconsList',
				data: [
					{
						id: 1,
						title: '手办',
						imgUrl: './images/icon1.png'
					},
					{
						id: 2,
						title: '周边',
						imgUrl: './images/icon2.png'
					},
					{
						id: 3,
						title: '漫展',
						imgUrl: './images/icon3.png'
					},
					{
						id: 4,
						title: '新品',
						imgUrl: './images/icon4.png'
					},
					{
						id: 5,
						title: '漫画',
						imgUrl: './images/icon5.png'
					}
				]
			},
			{
				id: 3,
				type: 'likeList',
				data: [
					{
						id: 1,
						imgUrl: './images/goods1.jpg',
						name: '哔哩哔哩 22+33娘 干杯Ver. 景品手办',
						price: 99
					},
					{
						id: 2,
						imgUrl: './images/goods2.jpg',
						name: '《明日方舟纪念插画集Vol.1》 画集 ',
						price: 88
					},
					{
						id: 3,
						imgUrl: './images/goods3.jpg',
						name: '哔哩哔哩 幻星集Ⅱ 2233 亚克力御守',
						price: 15
					},
					{
						id: 4,
						imgUrl: './images/goods4.jpg',
						name: '欢乐大乱斗系列 群英荟萃 SSR超神魔力赏',
						price: 35
					},
					{
						id: 5,
						imgUrl: './images/goods5.jpg',
						name: '寿屋 进击的巨人 利威尔 坚毅不屈 Ver. 手办 再版',
						price: 888
					},
					{
						id: 6,
						imgUrl: './images/goods6.jpg',
						name: '世嘉 VOCALOID 初音未来 2022雪未来 超大毛绒玩偶',
						price: 649
					},
					{
						id: 7,
						imgUrl: './images/goods7.jpg',
						name: '明日方舟 人气粘土人是超神vol.3 魔力赏',
						price: 999
					},
				]
			}

		]
	})
})
//首页数码的数据
router.get('/api/index_list/4/data/1', function (req, res, next) {
	res.send({
		code: 0,
		data: [
			{
				id: 1,
				type: 'adList',
				data: [
					{
						id: 1,
						imgUrl: './images/shuma.jpg'
					},
				]
			},
			{
				id: 1,
				type: 'iconsList',
				data: [
					{
						id: 1,
						title: '手办',
						imgUrl: './images/icon1.png'
					},
					{
						id: 2,
						title: '周边',
						imgUrl: './images/icon2.png'
					},
					{
						id: 3,
						title: '漫展',
						imgUrl: './images/icon3.png'
					},
					{
						id: 4,
						title: '新品',
						imgUrl: './images/icon4.png'
					},
					{
						id: 5,
						title: '漫画',
						imgUrl: './images/icon5.png'
					}
				]
			},
			{
				id: 3,
				type: 'likeList',
				data: [
					{
						id: 1,
						imgUrl: './images/goods1.jpg',
						name: '哔哩哔哩 22+33娘 干杯Ver. 景品手办',
						price: 99
					},
					{
						id: 2,
						imgUrl: './images/goods2.jpg',
						name: '《明日方舟纪念插画集Vol.1》 画集 ',
						price: 88
					},
					{
						id: 3,
						imgUrl: './images/goods3.jpg',
						name: '哔哩哔哩 幻星集Ⅱ 2233 亚克力御守',
						price: 15
					},
					{
						id: 4,
						imgUrl: './images/goods4.jpg',
						name: '欢乐大乱斗系列 群英荟萃 SSR超神魔力赏',
						price: 35
					},
					{
						id: 5,
						imgUrl: './images/goods5.jpg',
						name: '寿屋 进击的巨人 利威尔 坚毅不屈 Ver. 手办 再版',
						price: 888
					},
					{
						id: 6,
						imgUrl: './images/goods6.jpg',
						name: '世嘉 VOCALOID 初音未来 2022雪未来 超大毛绒玩偶',
						price: 649
					},
					{
						id: 7,
						imgUrl: './images/goods7.jpg',
						name: '明日方舟 人气粘土人是超神vol.3 魔力赏',
						price: 999
					},
				]
			}

		]
	})
})
//首页漫画的数据
router.get('/api/index_list/3/data/1', function (req, res, next) {
	res.send({
		code: 0,
		data: [
			{
				id: 1,
				type: 'adList',
				data: [
					{
						id: 1,
						imgUrl: './images/manhua.jpg'
					},
				]
			},
			{
				id: 1,
				type: 'iconsList',
				data: [
					{
						id: 1,
						title: '手办',
						imgUrl: './images/icon1.png'
					},
					{
						id: 2,
						title: '周边',
						imgUrl: './images/icon2.png'
					},
					{
						id: 3,
						title: '漫展',
						imgUrl: './images/icon3.png'
					},
					{
						id: 4,
						title: '新品',
						imgUrl: './images/icon4.png'
					},
					{
						id: 5,
						title: '漫画',
						imgUrl: './images/icon5.png'
					}
				]
			},
			{
				id: 3,
				type: 'likeList',
				data: [
					{
						id: 1,
						imgUrl: './images/goods1.jpg',
						name: '哔哩哔哩 22+33娘 干杯Ver. 景品手办',
						price: 99
					},
					{
						id: 2,
						imgUrl: './images/goods2.jpg',
						name: '《明日方舟纪念插画集Vol.1》 画集 ',
						price: 88
					},
					{
						id: 3,
						imgUrl: './images/goods3.jpg',
						name: '哔哩哔哩 幻星集Ⅱ 2233 亚克力御守',
						price: 15
					},
					{
						id: 4,
						imgUrl: './images/goods4.jpg',
						name: '欢乐大乱斗系列 群英荟萃 SSR超神魔力赏',
						price: 35
					},
					{
						id: 5,
						imgUrl: './images/goods5.jpg',
						name: '寿屋 进击的巨人 利威尔 坚毅不屈 Ver. 手办 再版',
						price: 888
					},
					{
						id: 6,
						imgUrl: './images/goods6.jpg',
						name: '世嘉 VOCALOID 初音未来 2022雪未来 超大毛绒玩偶',
						price: 649
					},
					{
						id: 7,
						imgUrl: './images/goods7.jpg',
						name: '明日方舟 人气粘土人是超神vol.3 魔力赏',
						price: 999
					},
				]
			}

		]
	})
})

//首页周边的数据
router.get('/api/index_list/2/data/1', function (req, res, next) {
	res.send({
		code: 0,
		data: [
			{
				id: 1,
				type: 'adList',
				data: [
					{
						id: 1,
						imgUrl: './images/zhoubian.jpg'
					},
				]
			},
			{
				id: 1,
				type: 'iconsList',
				data: [
					{
						id: 1,
						title: '手办',
						imgUrl: './images/icon1.png'
					},
					{
						id: 2,
						title: '周边',
						imgUrl: './images/icon2.png'
					},
					{
						id: 3,
						title: '漫展',
						imgUrl: './images/icon3.png'
					},
					{
						id: 4,
						title: '新品',
						imgUrl: './images/icon4.png'
					},
					{
						id: 5,
						title: '漫画',
						imgUrl: './images/icon5.png'
					}
				]
			},
			{
				id: 3,
				type: 'likeList',
				data: [
					{
						id: 1,
						imgUrl: './images/goods1.jpg',
						name: '哔哩哔哩 22+33娘 干杯Ver. 景品手办',
						price: 99
					},
					{
						id: 2,
						imgUrl: './images/goods2.jpg',
						name: '《明日方舟纪念插画集Vol.1》 画集 ',
						price: 88
					},
					{
						id: 3,
						imgUrl: './images/goods3.jpg',
						name: '哔哩哔哩 幻星集Ⅱ 2233 亚克力御守',
						price: 15
					},
					{
						id: 4,
						imgUrl: './images/goods4.jpg',
						name: '欢乐大乱斗系列 群英荟萃 SSR超神魔力赏',
						price: 35
					},
					{
						id: 5,
						imgUrl: './images/goods5.jpg',
						name: '寿屋 进击的巨人 利威尔 坚毅不屈 Ver. 手办 再版',
						price: 888
					},
					{
						id: 6,
						imgUrl: './images/goods6.jpg',
						name: '世嘉 VOCALOID 初音未来 2022雪未来 超大毛绒玩偶',
						price: 649
					},
					{
						id: 7,
						imgUrl: './images/goods7.jpg',
						name: '明日方舟 人气粘土人是超神vol.3 魔力赏',
						price: 999
					},
				]
			}

		]
	})
})

//首页手办的数据
router.get('/api/index_list/1/data/1', function (req, res, next) {
	res.send({
		code: 0,
		data: [
			{
				id: 1,
				type: 'adList',
				data: [
					{
						id: 1,
						imgUrl: './images/shouban.jpg'
					},
				]
			},
			{
				id: 1,
				type: 'iconsList',
				data: [
					{
						id: 1,
						title: '手办',
						imgUrl: './images/icon1.png'
					},
					{
						id: 2,
						title: '周边',
						imgUrl: './images/icon2.png'
					},
					{
						id: 3,
						title: '漫展',
						imgUrl: './images/icon3.png'
					},
					{
						id: 4,
						title: '新品',
						imgUrl: './images/icon4.png'
					},
					{
						id: 5,
						title: '漫画',
						imgUrl: './images/icon5.png'
					}
				]
			},
			{
				id: 3,
				type: 'likeList',
				data: [
					{
						id: 1,
						imgUrl: './images/goods1.jpg',
						name: '哔哩哔哩 22+33娘 干杯Ver. 景品手办',
						price: 99
					},
					{
						id: 2,
						imgUrl: './images/goods2.jpg',
						name: '《明日方舟纪念插画集Vol.1》 画集 ',
						price: 88
					},
					{
						id: 3,
						imgUrl: './images/goods3.jpg',
						name: '哔哩哔哩 幻星集Ⅱ 2233 亚克力御守',
						price: 15
					},
					{
						id: 4,
						imgUrl: './images/goods4.jpg',
						name: '欢乐大乱斗系列 群英荟萃 SSR超神魔力赏',
						price: 35
					},
					{
						id: 5,
						imgUrl: './images/goods5.jpg',
						name: '寿屋 进击的巨人 利威尔 坚毅不屈 Ver. 手办 再版',
						price: 888
					},
					{
						id: 6,
						imgUrl: './images/goods6.jpg',
						name: '世嘉 VOCALOID 初音未来 2022雪未来 超大毛绒玩偶',
						price: 649
					},
					{
						id: 7,
						imgUrl: './images/goods7.jpg',
						name: '明日方舟 人气粘土人是超神vol.3 魔力赏',
						price: 999
					},
				]
			}

		]
	})
})
//首页推荐的数据
router.get('/api/index_list/0/data/1', function (req, res, next) {
	res.send({
		code: 0,
		data: {
			topBar: [
				{ id: 0, label: '推荐' },
				{ id: 1, label: '手办' },
				{ id: 2, label: '周边' },
				{ id: 3, label: '漫画' },
				{ id: 4, label: '数码' },
				{ id: 5, label: '漫展' },
				{ id: 6, label: '游戏' },
				{ id: 7, label: '电子科大' },
			],
			data: [
				//这是swiper
				{
					id: 0,
					type: 'swiperList',
					data: [
						{ id: 0, imgUrl: './images/Homeswiper1.jpg' },
						{ id: 1, imgUrl: './images/Homeswiper2.jpg' },
						{ id: 2, imgUrl: './images/Homeswiper3.jpg' },
						{ id: 3, imgUrl: './images/Homeswiper4.jpg' },
						{ id: 4, imgUrl: './images/Homeswiper5.jpg' },
					]
				},
				//这是icons
				{
					id: 1,
					type: 'iconsList',
					data: [
						{
							id: 1,
							title: '手办',
							imgUrl: './images/icon1.png'
						},
						{
							id: 2,
							title: '周边',
							imgUrl: './images/icon2.png'
						},
						{
							id: 3,
							title: '漫展',
							imgUrl: './images/icon3.png'
						},
						{
							id: 4,
							title: '新品',
							imgUrl: './images/icon4.png'
						},
						{
							id: 5,
							title: '漫画',
							imgUrl: './images/icon5.png'
						}
					]
				},
				//爆款推荐
				{
					id: 3,
					type: 'recommendList',
					data: [
						{
							id: 1,
							name: 'Hobbymax 新世纪福音战士 绫波零 Radio Eva Ver.手办 再版',
							content: '新世纪福音战士 Hobbymax榜No.1',
							price: '758',
							imgUrl: './images/recommend1.png'
						},
						{
							id: 2,
							name: '明日方舟 W 手办 附独家特典',
							content: '附独家特典:W原画海报捏',
							price: '749',
							imgUrl: './images/recommend2.png'
						}
					]
				},
				//猜你喜欢
				{
					id: 4,
					type: 'likeList',
					data: [
						{
							id: 1,
							imgUrl: './images/goods1.jpg',
							name: '哔哩哔哩 22+33娘 干杯Ver. 景品手办',
							price: 99
						},
						{
							id: 2,
							imgUrl: './images/goods2.jpg',
							name: '《明日方舟纪念插画集Vol.1》 画集 ',
							price: 88
						},
						{
							id: 3,
							imgUrl: './images/goods3.jpg',
							name: '哔哩哔哩 幻星集Ⅱ 2233 亚克力御守',
							price: 15
						},
						{
							id: 4,
							imgUrl: './images/goods4.jpg',
							name: '欢乐大乱斗系列 群英荟萃 SSR超神魔力赏',
							price: 35
						},
						{
							id: 5,
							imgUrl: './images/goods5.jpg',
							name: '寿屋 进击的巨人 利威尔 坚毅不屈 Ver. 手办 再版',
							price: 888
						},
						{
							id: 6,
							imgUrl: './images/goods6.jpg',
							name: '世嘉 VOCALOID 初音未来 2022雪未来 超大毛绒玩偶',
							price: 649
						},
						{
							id: 7,
							imgUrl: './images/goods7.jpg',
							name: '明日方舟 人气粘土人是超神vol.3 魔力赏',
							price: 999
						},
					]
				}

			]
		}
	})
});

module.exports = router;
