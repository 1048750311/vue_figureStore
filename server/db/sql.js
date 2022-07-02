const mysql = require('mysql');
let connection = mysql.createConnection({
	host: '0.0.0.0',
	// host: '119.29.86.152',
	user: 'root',
	password: "qazwdc00",
	database: 'vue_store'
})
connection.connect(error => {
	if (error) throw error;
	console.log("Successfully connected to the database.");
});
setInterval(function () {
	connection.query('SELECT 1');
	console.log("数据库准备完成")
}, 5000);
module.exports = connection;