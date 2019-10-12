var strategy = require('passport-local').Strategy;
var bcrypt   = require('bcrypt');
var mysql    = require('mysql');
var db       = require('./database');
var pool     = mysql.createPool(db.pool);

module.exports = (passport) => {
	passport.serializeUser((user, done) => {
		done(null, user.uid);
	});

	passport.deserializeUser((uid, done) => {
		pool.query('SELECT * FROM User WHERE (user_id = ?)', [uid], (err, result) => {
			done(err, {uid: result[0].user_id, username: result[0].username, pass: result[0].password});
		});
	});

	// Setup Passport
	passport.use(new strategy({ usernameField: 'username' }, (username, pass, done) => {
		// Match a user
		pool.query('SELECT * FROM User Where (username = ?)', [username], (err, result) => {
			if (!result.length) return done(null, false, {message: username + ' isn\'t registered yet.'});
			let user = result[0];

			// User was found so decrpt pass
			bcrypt.compare(pass, user.password, (err, isMatch) => {
				if (err) throw err;
				
				// User matches
				if (isMatch)
					return done(null, {uid: user.user_id, username: username, pass: user.password});
				else
					done(null, false, {message: 'Incorrect password.'})
			});
		});
	}));
}