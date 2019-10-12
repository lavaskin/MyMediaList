// Node Modules
const passport = require('passport');
const express  = require('express');
const exprhbr  = require('express-handlebars');
const session  = require('express-session');
const bcrypt   = require('bcrypt');
const flash    = require('connect-flash')
const mysql    = require('mysql');
require('./src/passport')(passport);

// Custom JS
const config = require('./src/config');
const verify = require('./src/verify');
const db     = require('./src/database');


/* ========================== */
/* Setup the Server/Engine/DB */
/* ========================== */

// Setup DB Pool and app
var pool = mysql.createPool(db.pool);
var app  = express();

// Setup Handlebars
app.engine('handlebars', exprhbr({defaultLayout: 'index'}));
app.set('view engine', 'handlebars');
app.use(express.static('public'));

// Setup body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup session
app.use(session({
	cookie: { maxAge: 604800000 },
	secret: 'spooky',
	resave: true,
	saveUninitialized: true
}));

// Setup Flash
app.use(flash());
app.use((req, res, next) => {
	res.locals.code = req.flash('code');
	res.locals.error = req.flash('error');
	res.locals.error_msg = req.flash('error_msg');
	next();
});

// Setup passport
app.use(passport.initialize());
app.use(passport.session());

// Checks if a given user matches the requested page
function matchPage(user, match) { return (user.username === match) }
// Gets info about the connecting user
function getAuth(name, user) {
	if (user) return matchPage(user, name);
	else return false;
}
function getUser(user) {
	if (user) return user.username;
	else return '';
}

/* =================== */
/* SQL Query Functions */
/* =================== */

// Returns an array of media objects queried to match the given pid
async function getMediaForPost(pid) {
    return new Promise((resolve, reject) => {
        return pool.query('SELECT title FROM Media WHERE media_id IN (SELECT media_id FROM Post_Media WHERE post_id = ?)', [pid], async (err, result) => {
			if (err) return reject(err);
			
            if (result.length) {
                let postMedia = [];
				
				// Using j because getPostsForUser() reads this as part of the same function
                for (j = 0; j < result.length; j++)
                    postMedia.push({ "postSubject": result[j].title });
				
                return resolve(postMedia);
            } else return resolve([]);
        });
    });
}

// Returns an array of post objects queried to match the given uid
async function getPostsForUser(uid) {
    return new Promise((resolve, reject) => {
        return pool.query('SELECT post_id, body, date_time FROM Post WHERE Post.author = ?', [uid], async (err, result) => {
			if (err) return reject(err);
			
            if (result.length) {
                let posts = [];

                for (i = 0; i < result.length; i++) {
					let subs = await getMediaForPost(result[i].post_id);
					
                    posts.unshift({
                        "postContent": result[i].body,
                        "timestamp":   result[i].date_time,
						"subjects":    subs,
						"postID":      result[i].post_id
                    });
				}
				
                return resolve(posts);
            } else return resolve([]);
        });
    });
}

// Returns an array of list objects queried to match the given uid
// Name is sent because the 'page' handlebars variables isn't registered in a partial
async function getListsForUser(uid, name) {
    return new Promise((resolve, reject) => {
        return pool.query('SELECT list_name, list_id FROM List WHERE list_owner = ?', [uid], async (err, result) => {
			if (err) return reject(err);
			
            if (result.length) {
                let lists = [];

                for (i = 0; i < result.length; i++) {
                    lists.unshift({
                        "listName": result[i].list_name,
						"listID":   result[i].list_id,
						"owner":    name
                    });
				}
				
                return resolve(lists);
            } else return resolve([]);
        });
    });
}

// Returns an array of media items associated with a given uid
async function getMediaForUser(uid) {
	return new Promise((resolve, reject) => {
		return pool.query('SELECT title, media_id FROM Media WHERE (media_owner = ?)', [uid], async (err, result) => {
			if (err) return reject(err);

			if (result.length) {
				let media = [];

				for (i = 0; i < result.length; i++) {
					media.push({
						"mediaName": result[i].title,
						"mediaID": result[i].media_id
					});
				}

				return resolve(media.sort());
			} else return resolve([]);
		});
	});
}

// Returns a string representing the list associated with the given lid
async function getListName(lid) {
	return new Promise((resolve, reject) => {
		return pool.query('SELECT list_name FROM List WHERE (list_id = ?)', [lid], async (err, result) => {
			if (err) return reject(err);
			return resolve(result[0].list_name);
		});
	});
}

// Gets the uid associated with a given username
async function getUserID(name) {
	return new Promise((resolve, reject) => {
		return pool.query('SELECT user_id FROM User WHERE (username = ?)', [name], async (err, result) => {
			if (err) return reject(err);
			if (result.length) return resolve(result[0].user_id);
			return resolve(-1);
		});
	});
}

// Gets the most recent post_id for a given uid
async function getPostID(uid) {
	return new Promise((resolve, reject) => {
		return pool.query('SELECT max(post_id) as id FROM Post WHERE (author = ?)', [uid], async (err, result) => {
			if (err) return reject(err);
			return resolve(result[0].id);
		});
	});
}

// Gets the most recent media_id for a given uid
async function getMediaID(uid) {
	return new Promise((resolve, reject) => {
		return pool.query('SELECT max(media_id) as id FROM Media WHERE (media_owner = ?)', [uid], async (err, result) => {
			if (err) return reject(err);
			return resolve(result[0].id);
		});
	});
}

// Checks if a given media items is in list
async function isMediaInList(mid, lid) {
	return new Promise((resolve, reject) => {
		return pool.query('SELECT list_id FROM List_Media WHERE (media_id = ?) AND (list_id = ?)', [mid, lid], async (err, result) => {
			if (err) return reject(err);
			if (result.length) return resolve(true);
			return resolve(false);
		});
	});
}

// Checks if a given media is owned by a given uid
async function isMediaOwnedBy(mid, uid) {
	return new Promise((resolve, reject) => {
		return pool.query('SELECT media_id FROM Media WHERE (media_id = ? and media_owner = ?)', [mid, uid], (err, result) => {
			if (err) return reject(err);
			if (result.length) return resolve(true);
			return resolve(false);
		});
	});
}

// Checks if a given list of ids are owned by a user
async function doIDsMatchUser(uid, ids) {
	if (!ids.length) return true;

	return new Promise((resolve, reject) => {
		return pool.query('SELECT media_id FROM Media WHERE (media_owner = ?)', [uid], (err, result) => {
			if (err) return reject(err);

			// Put all the ids into an array
			let foundIDS = [];
			for (i = 0; i < result.length; i++)
				foundIDS.push(result[i].media_id);

			// Verify every ID in ids is contained in result
			for (i = 0; i < ids.length; i++) {
				if (!foundIDS.includes(ids[i]))
					return resolve(false);
			}
			
			return resolve(true);
		});
	});
}


/* =========== */
/* Post Routes */
/* =========== */

// Register a User
app.post('/signup', (req, res) => {
	let err = verify.register(req.body);
	if (!err.length) {
		// Check if a user already exists
		pool.query('SELECT username FROM User WHERE (username = ?)', [req.body.username], (err, result) => {
			// Given user exists
			if (result.length) {
				res.status(200).render('signup', {
					page:      'Signup',
					error:     'The username ' + req.body.username + ' is already registered.',
					loggedIn:  req.isAuthenticated(),
					user:      getUser(req.user),
					username:  req.body.username,
					password:  req.body.password,
					cPassword: req.body.cPassword
				}); return;
			}

			// Hash password
			let pass = req.body.password;
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(pass, salt, (err, hash) => {
					// Given user doesn't exist, so add a new user
					pool.query('INSERT INTO User (username, password) VALUES (?, ?)', [req.body.username, hash], () => {
						res.redirect('/login');
					});
				});
			});
		});
	} else {
		// console.log(err);
		res.status(401).render('signup', {
			page: 'Signup',
			error: err,
			loggedIn: req.isAuthenticated(),
			user: getUser(req.user),
			username:  req.body.username,
			password:  req.body.password,
			cPassword: req.body.cPassword
		});
	}
});

// Logs in a user 
app.post('/login', (req, res, next) => {
	let err = verify.login(req.body);
	if (!err.length) {
		passport.authenticate('local', {
			session: true,
			successRedirect: '/user/' + req.body.username,
			failureRedirect: '/login',
			failureFlash: true
		})(req, res, next);
	} else {
		res.status(200).render('login', {
			page: 'Login',
			error: err,
			username: req.body.username
		});
	}
});

// Removes a post
app.post('/user/:name/deletePost', async (req, res) => {
	// Verify User
	let name = req.params.name;
	if (!matchPage(req.user, name)) return;
	let uid  = await getUserID(req.params.name);
	if (uid == -1) return;

	// Check if the post belongs to the given user
	pool.query('SELECT post_id FROM Post WHERE (author = ? and post_id = ?)', [uid, req.body.id], (err, result) => {
		if (result.length)
			pool.query('DELETE FROM Post WHERE (post_id = ?)', [req.body.id]);
	});
});

// Get new posts and add them to the db
app.post('/user/:name/newPost', async (req, res) => {
	// Verify User
	let name = req.params.name;
	if (!matchPage(req.user, name)) return;
	let uid  = await getUserID(req.params.name);
	if (uid == -1) return;

	// Format the ID's variable and verify ownership
	let ids = [];
	for (i = 0; i < req.body.ids.length; i++)
		ids.push(parseInt(req.body.ids[i].mediaID));
	let match = await doIDsMatchUser(uid, ids);
	if (!match) return;

	let body = req.body.postContent;
	let time = req.body.timestamp;

	if (!verify.post({ postContent: body, timestamp: time })) return;

	await pool.query('INSERT INTO Post (author, body, date_time) VALUES (?, ?, ?)', [uid, body, time], async (err, result) => {
		// Get the post id of the post that was just created
		let post_id = await getPostID(uid);
		
		// Add individual subjects to the Post_Media table
		for (i = 0; i < ids.length; i++)
			pool.query('INSERT INTO Post_Media (post_id, media_id) VALUES (?, ?)', [post_id, ids[i]]);
	});

	res.send({ redirect: '/user/' + req.params.name });
});

// Robust route that handles various changes of media items
app.post('/user/:name/updateMedia/:n', async (req) => {
	// Verify User
	let name = req.params.name;
	if (!matchPage(req.user, name)) return;
	let uid = await getUserID(req.params.name);
	if (uid == -1) return;

	// Verify Ownership
	let owned = await isMediaOwnedBy(req.params.n, uid);
	if (!owned) return;
	
	// Update specific elements
	if ('delete' in req.body)
		pool.query('DELETE FROM Media WHERE (media_id = ?)', [req.params.n]);
	else {
		if ('progress' in req.body) {
			if (req.body.progress === 1 || req.body.progress === 0)
				pool.query('UPDATE Media SET progress = ? WHERE (media_id = ?)', [req.body.progress, req.params.n]);
		}
		if ('score' in req.body) {
			if (!isNaN(req.body.score) || req.body.score < 10 || req.body.score > 1)
				pool.query('UPDATE Media SET score = ? WHERE (media_id = ?)', [req.body.score, req.params.n]);
		}
	}
});

// Adding new media to a List
app.post('/user/:name/list/:n/addMedia', async (req, res) => {
	// Verify User
	let name = req.params.name;
	if (!matchPage(req.user, name)) return;
	let userID = await getUserID(name);
	if (userID == -1) return;

	// Verify Media Obj
	if (!verify.media(req.body)) return;

	let listID = req.params.n;

	pool.query('INSERT INTO Media (title, creator, type, score, progress, media_owner) VALUES (?, ?, ?, ?, ?, ?)', [req.body.title, req.body.creator, req.body.type, req.body.score, req.body.progress, userID], async (err, result) => {
		let mediaID = await getMediaID(userID);

		// Add the item and send a response
		await pool.query('INSERT INTO List_Media VALUES (?, ?)', [listID, mediaID]); 
		res.send('OK');
	});
});

// Robust route that handles list renaming, and adding/removing media items
app.post('/user/:name/list/:n/updateList', async (req, res) => {
	// Verify User
	let name = req.params.name;
	if (!matchPage(req.user, name)) return;
	let userID = await getUserID(name);
	if (userID == -1) return;

	// Check if the given user owns the list
	pool.query('SELECT list_id FROM List WHERE (list_id = ? and list_owner = ?)', [req.params.n, userID], (err, result) => {
		if (result.length) {
			if ('delete' in req.body)
				pool.query('DELETE FROM List_Media WHERE (list_id = ? and media_id = ?)', [req.params.n, req.body.delete]);
			else if ('newName' in req.body) {
				if (!req.body.newName.length || req.body.newName.length > 32) return;
					pool.query('UPDATE List SET list_name = ? WHERE (list_id = ?)', [req.body.newName, req.params.n]);
			}
			else {
				// Check if they're all owned by the user
				doIDsMatchUser(userID, req.body);

				// Add the media items to the database
				for (i = 0; i < req.body.length; i++)
					pool.query('INSERT INTO List_Media VALUES (?, ?)', [req.params.n, req.body[i]]);
			}

			// Send a confirmation of completion
			res.send('OK');
		}
	});
});

// Deleting a list from the db
app.post('/user/:name/deleteList', async (req, res) => {
	// Verify User
	let name = req.params.name;
	if (!matchPage(req.user, name)) return;
	let userID = await getUserID(name);
	if (userID == -1) return;

	pool.query('DELETE FROM List WHERE (list_id = ?)', [req.body.id], () => {
		res.send({redirect: '/user/' + name});
	});
});

// Adding a new list to the db
app.post('/user/:name/newList', async (req, res) => {
	// Verify User
	let name = req.params.name;
	if (!matchPage(req.user, name)) return;
	let userID = await getUserID(name);
	if (userID == -1) return;

	// Verify List Name
	let listName = req.body.name;
	if (!listName.length || listName.length > 32) return;

	// Post the new list if one with the same name doesn't exist
	pool.query('SELECT list_name FROM List WHERE (list_name = ? AND list_owner = ?)', [listName, userID], (err, result) => {
		if (!result.length) {
			pool.query('INSERT INTO List (list_name, list_owner) VALUES (?, ?)', [listName, userID], () => {
				res.status(200).send('OK');
			});
		}
	});
});


/* ========== */
/* Get Routes */
/* ========== */

// Homepage
app.get('/', (req, res) => {
	let loggedIn = req.isAuthenticated();
	let user     = getUser(req.user);

    res.status(200).render('home', {
		page:     'Home',
		noSearch: true,
		loggedIn: loggedIn,
		user:     user
    });
});

// Signin Page
app.get('/login', (req, res, next) => {
	// Logout if the user requests to login
	if (req.isAuthenticated()) res.redirect('/logout');
	
    res.status(200).render('login', {
		page: 'Login',
    });
});

// Signup Page
app.get('/signup', (req, res) => {
	let loggedIn = req.isAuthenticated();
	let user     = getUser(req.user);

    res.status(200).render('signup', {
        page:     'Signup',
		loggedIn: loggedIn,
		user:     user
    });
});

// Logout handler
app.get('/logout', (req, res) => {
	req.logOut();
	res.redirect('/login');
});

// User Page
app.get('/user/:name', (req, res, next) => {
	let name     = req.params.name;
	let loggedIn = req.isAuthenticated();
	let auth     = getAuth(name, req.user);
	let user     = getUser(req.user);
	
	// See if the user was found
	pool.query('SELECT username, user_id FROM User where USERNAME = ?', [name], async (err, result) => {
		if (result.length) {
			let posts = await getPostsForUser(result[0].user_id);
			let lists = await getListsForUser(result[0].user_id, name);
			let media = await getMediaForUser(result[0].user_id);

			// Render the page
			res.status(200).render('user', {
				page:     name,
				fullPage: true,
				posts:    posts,
				lists:    lists,
				media:    media,
				loggedIn: loggedIn,
				auth:     auth,
				user:     user
			});
		} else {
			// Post an error
			req.flash('error_msg', name + ' isn\'t registered.');
			res.redirect('/err'); // This route doesn't exist so it goes to the defaults
		}
	});
});

// User's Specific List
app.get('/user/:name/list/:n', async (req, res) => {
	let name     = req.params.name;
	let loggedIn = req.isAuthenticated();
	let auth     = getAuth(name, req.user);
	let user     = getUser(req.user);

	let listID   = parseInt(req.params.n);
	let userID   = await getUserID(name);
	if (userID == -1) { next(); return }

	// Get every piece of media associated with the specified list
	pool.query('SELECT Media.media_id, type, title, score, creator, progress, User.username as owner FROM Media INNER JOIN User on (media_owner = user_id) WHERE (media_owner = ?)', [userID], async (err, result) => {
		let listMedias = [];
		let medias     = [];
		let listName   = await getListName(listID);

		// Only fill the medias list if such a list even exists (lists can be empty!)
		if (result.length) {
			for (i = 0; i < result.length; i++) {
				// If the media is part of the given list, add it to said lists array
				// If not, add it to the list of possible items to add
				let wait = await isMediaInList(result[i].media_id, listID);
				if (wait) {
					listMedias.unshift({
						"title":    result[i].title,
						"owner":    result[i].owner,
						"id":       result[i].media_id,
						"type":     result[i].type,
						"score":    result[i].score,
						"creator":  result[i].creator,
						"progress": result[i].progress
					});
				} else {
					medias.push({
						"mediaName": result[i].title,
						"mediaID":   result[i].media_id
					});
				}
			}
		}

		res.status(200).render('userList', {
			page:      name,
			listName:  listName,
			items:     listMedias,
			media:     medias,
			loggedIn:  loggedIn,
			auth:      auth,
			user:      user
		});
	});
});

// Posts related to a specific media item
app.get('/user/:name/posts/:n', async (req, res, next) => {
	// Check if the media_id belongs to the given name
	let name     = req.params.name;
	let loggedIn = req.isAuthenticated();
	let auth     = getAuth(name, req.user);
	let user     = getUser(req.user);

	let mid = req.params.n;
	let uid = await getUserID(name);
	if (uid == -1) { next(); return }

	let isOwner = await isMediaOwnedBy(mid, uid);
	if (!isOwner) { next(); return }

	pool.query('SELECT Post.post_id as pid, body, date_time FROM Post INNER JOIN Post_Media ON (Post.post_id = Post_Media.post_id) WHERE (Post_Media.media_id = ?)', [mid], async (err, result) => {
		// Add all the found posts to the array
		let posts = [];
		if (result.length) {
			for (i = 0; i < result.length; i++) {
				let subs = await getMediaForPost(result[i].pid);

				posts.unshift({
					"postContent": result[i].body,
					"timestamp":   result[i].date_time,
					"subjects":    subs,
					"postID":      result[i].pid
				});
			}
		}

		// Render the page
		res.status(200).render('user', {
			page:      name,
			fullPage:  false,
			posts:     posts,
			loggedIn:  loggedIn,
			auth:      auth,
			user:      user
		});
	});
});

// All of a users media
app.get('/user/:name/media', async (req, res, next) => {
	let name     = req.params.name;
	let loggedIn = req.isAuthenticated();
	let auth     = getAuth(name, req.user);
	let user     = getUser(req.user);

	let uid = await getUserID(req.params.name);
	if (uid == -1) { next(); return }

	// Only the owner of a page can view
	if (!auth) {
		req.flash('error_msg', 'You don\'t have access to this page.');
		req.flash('code', '501');
		res.redirect('/err');
		return;
	};

	// Get every piece of media
	pool.query('SELECT Media.media_id as mid, type, title, score, creator, progress, User.username as owner FROM Media INNER JOIN User ON (media_owner = user_id) WHERE (media_owner = ?)', [uid], (err, result) => {
		let media = [];

		if (result.length) {
			for (i = 0; i < result.length; i++) {
				media.unshift({
					"title":    result[i].title,
					"owner":    result[i].owner,
					"id":       result[i].mid,
					"type":     result[i].type,
					"score":    result[i].score,
					"creator":  result[i].creator,
					"progress": result[i].progress,
				});
			}
		}

		res.status(200).render('userMedia', {
			page:      name,
			items:     media,
			loggedIn:  loggedIn,
			auth:      auth,
			user:      user
		});
	});
});

// User specified page wasn't found (404)
app.get('*', (req, res) => {
	let loggedIn = req.isAuthenticated();
	let user = getUser(req.user);

	// The code may have been passed in through a flash
	let code = (res.locals.code.length) ? res.locals.code[0] : '404';

	res.status(404).render('error', {
		page:     code,
		loggedIn: loggedIn,
		user:     user
	});
});


// Start the server
app.listen(config.port, () => {
    console.log("The server is starting on port " + config.port + "...");
});