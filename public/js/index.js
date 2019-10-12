// Navigates to a userpage
function findUser() {
	let searchBar =  document.getElementsByClassName('user-search')[0];
	let userName = searchBar.value;

	if (userName.length > 16 || userName.length < 3) {
		searchBar.value = '';
		searchBar.placeholder = 'Try again!';
		
		// Revert the placeholder back after a cooldown
		setTimeout(() => { searchBar.placeholder = 'Find a user...' }, 1000);
		return;
	}
	
	window.location = '/user/' + userName;
}


// Gets the current user pages name
// page = String representing the specific page
function getUser(page) {
	// Temporary till I become not lazy
	switch (page) {
		case 'list':
			return document.getElementById('list-author').textContent.substring(4);
		case 'user':
			let subHeader = document.getElementsByClassName('sub-header')[0].textContent;
			return subHeader.substring(0, subHeader.indexOf(' ') - 2);
		case 'media':
			let href = window.location.href;
			return href.substring(href.indexOf('/user/') + 6, href.length - 6);
	}
}


// Returns the current date in the specified post format
function getCurDate() {
	let date = new Date();
	return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
}


// Parses a given URl to obtain the final ID at the end
// url = String
function getURLID(url) {
	let idArr = [];

	// Get the ID
	for (i = url.length - 1; i > 0; i--) {
		if (url[i] !== '/') idArr.unshift(url[i]);
		else break;
	}

	// Convert the array to a string
	let id = "";
	for (i = 0; i < idArr.length; i++)
		id += idArr[i];

	return parseInt(id);
}


// Main entrypoint to the clientside JS
function main() {
	// Attatch listeners on user searches
	document.getElementsByClassName('go-btn')[0].addEventListener('click', findUser);

	// Determine if the connecting user has auth
	// Auth being true when a user isn't correct just breaks clientside stuff
	// There's no real reason to change it
	let auth;
	let authElem = document.getElementById('auth');
	if (authElem)
		auth = (authElem.textContent === "false") ? false : true;
	let href = window.location.href; // current page shorthand


	/* Setup Interactions */

	// List and Media Page Interactions
	if (href.includes('/list/') || href.includes('/media'))
		setupListPage(auth, href);

	// User Page Interactions
	if (document.getElementById('user-content') && !href.includes('/posts/'))
		setupUserPage(auth, href);

	// Posts Page Interactions
	if (href.includes('/posts/'))
		setupPostPage();

	// Media Page Interactions
	if (href.includes('/media'))
		setupMediaPage();

	// Signup/Login Page Interactions
	if (href.includes('/signup') || href.includes('login'))
		setupFormPages();

	// Error Page Interactions
	if (href.includes('/err'))
		setupErrorPage();
}

window.addEventListener('DOMContentLoaded', main);