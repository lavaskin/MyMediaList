const config = require('./config');

module.exports = {
	pool: {
		connectionLimit: 10,
		host: config.host,
		user: config.user,
		password: config.password,
		database: config.db_name
	}
}