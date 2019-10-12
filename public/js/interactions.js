/* DESC: Houses functions that setup listeners on specific pages */


// List Page Interactions
function setupListPage(auth, href) {
	// Iterate through all media items, revealing them in the DOM when finished
	let mediaItems = document.getElementsByClassName('media-container');
	for (i = 0; i < mediaItems.length; i++)
		formatMedia(mediaItems[i]);
	
	if (auth) {
		// Attach listeners to the field buttons
		let listContainer = document.getElementById('media-list-container');
		listContainer.addEventListener('click', (event) => {
			let btn = event.target.closest('button');
			
			if (btn) {
				if (btn.classList.contains('media-progress'))
					updateProgress(btn);
				else if (btn.classList.contains('score-btn')) {
					btn.classList.add('hidden');
					btn.parentElement.children[1].classList.remove('hidden');

					updateScore(btn);
				}
				else if (btn.classList.contains('remove-item-btn')) {
					// Removing media means different things on different pages
					if (href.includes('/list/')) {
						if (confirm('Are you sure you want to remove this media from your list?')) {
							let mid = getURLID(btn.parentElement.children[0].children[0].href);
							sendDataToServer(href + '/updateList', { delete: mid });
							btn.parentElement.classList.add('hidden'); // 'Remove' the media item on the client
						}
					} else {
						if (confirm('Are you sure you want to delete this media item?')) {
							let mid = getURLID(btn.parentElement.children[0].children[0].href);
							sendDataToServer('/user/' + getUser('media') + '/updateMedia/' + mid, { delete: mid }, 'reload');
							btn.parentElement.classList.add('hidden'); // 'Remove' the media item on the client
						}
					}
				}
			}
		});

		// Interactions specific to the list page
		if (href.includes('/list/')) {
			// Add listener to the name changing button
			let editNameBtn = document.getElementsByClassName('edit-name-btn')[0];
			editNameBtn.addEventListener('click', () => {
				// Toggle elements
				editNameBtn.style.top = '999999px';
				document.getElementById('list-title').style.display = 'none';
				document.getElementsByClassName('new-list-name-container')[0].classList.remove('hidden');

				// Add listeners to the sub buttons
				document.getElementsByClassName('cancel-new-name-btn')[0].addEventListener('click', () => {
					editNameBtn.style.top = '17px';
					document.getElementById('list-title').style.display = 'inline-block';
					document.getElementsByClassName('name-input')[0].value = '';
					document.getElementsByClassName('new-list-name-container')[0].classList.add('hidden');
				});
				document.getElementsByClassName('accept-new-name-btn')[0].addEventListener('click', () => {
					let newName = document.getElementsByClassName('name-input')[0].value;

					// Check the names length, and send it to the server
					if (newName.length && newName.length < 33) {
						document.getElementById('list-title').textContent = newName;

						editNameBtn.style.top = '17px';
						document.getElementById('list-title').style.display = 'inline-block';
						document.getElementsByClassName('name-input')[0].value = '';
						document.getElementsByClassName('new-list-name-container')[0].classList.add('hidden');

						sendDataToServer(href + '/updateList', { newName: newName });
					}
				});
			});

			// Add listener to the delete list button
			let deleteListBtn = document.getElementById('delete-list-btn');
			deleteListBtn.addEventListener('click', () => {
				if (confirm('Are you sure you want to delete this list?'))
					sendDataToServer('/user/' + getUser('list') + '/deleteList', { id: getURLID(href) }, 'redirect');
			});

			// Setup the media creation container
			let newBtn      = document.getElementById('add-media-btn');
			let cancelBtn   = document.getElementById('cancel-btn');
			let createBtn   = document.getElementById('confirm-media-btn');
			let newMediaBtn = document.getElementsByClassName('selection-btn')[0];
			let existingBtn = document.getElementsByClassName('selection-btn')[1];

			// Add listeners to the million buttons in the creator
			newMediaBtn.addEventListener('click', () => {
				newMediaBtn.classList.add('hidden');
				existingBtn.classList.add('hidden');

				document.getElementById('form-btns').classList.remove('hidden');
				document.getElementById('new-media-creator').classList.remove('hidden');
			});
			existingBtn.addEventListener('click', () => {
				if (document.getElementsByClassName('addable-media').length) {
					newMediaBtn.classList.add('hidden');
					existingBtn.classList.add('hidden');

					document.getElementById('form-btns').classList.remove('hidden');
					document.getElementById('existing-media-container').classList.remove('hidden');
				} else alert('All your media items are already in this list, or you have no media items to add!');
			});
			newBtn.addEventListener('click', toggleMediaCreator);
			cancelBtn.addEventListener('click', toggleMediaCreator);
			createBtn.addEventListener('click', () => {
				if (!document.getElementById('existing-media-container').classList.contains('hidden'))
					addMediaToList(document.getElementsByClassName('addable-media'));
				else
					createNewMediaItem();
			});

			// Flip-flop the value of the finished button
			let finishedBtn = document.getElementsByClassName('finished-btn')[0]
			finishedBtn.addEventListener('click', () => {
				let content = finishedBtn.textContent;

				if (content.localeCompare('Yes!') === 0) {
					finishedBtn.textContent = "No!";
					finishedBtn.title = "This piece of media is a work in-progress.";
				} else {
					finishedBtn.textContent = "Yes!";
					finishedBtn.title = "You're finished with this piece of media.";
				}
			});
		}
	}
}


// User Page Interactions
function setupUserPage(auth, href) {
	// Test if posts have subjects and format accordingly
	let posts      = document.getElementsByClassName('post');
	let newPostBtn = document.getElementById('new-post-btn');
	if (!posts.length && !newPostBtn) {
		// Make an element describing emptiness...
		let text = document.createElement('DIV');
		text.textContent = getUser('user') + ' hasn\'t made any posts yet.';
		text.style.marginTop = '10px';
		text.style.fontSize = '1.2em';

		document.getElementsByClassName('post-container')[0].insertAdjacentElement('afterbegin', text);
	} else  {
		for (i = 0; i < posts.length; i++) {
			if (!posts[i].children[2].children.length)
				posts[i].children[1].parentElement.removeChild(posts[i].children[1]);
		}
	}

	// Check if the user is logged in and or has created a list
	let newListBtn = document.getElementById('new-list-btn');
	if (!document.getElementsByClassName('listx3').length && !newListBtn) {
		// Make an element describing emptiness...
		let text = document.createElement('DIV');
		text.textContent = getUser('user') + ' hasn\'t made any lists yet.';
		text.style.fontSize = '1.2em';

		document.getElementsByClassName('list-container')[0].insertAdjacentElement('beforeend', text);
	}

	if (auth) {
		// Attach listeners to the progress buttons
		document.getElementsByClassName('post-container')[0].addEventListener('click', (event) => {
			let btn = event.target.closest('button');
			
			// Check which button was clicked
			if (btn) {
				if (btn.classList.contains('remove-post-btn')) {
					if (confirm('Are you sure you delete this post?')) {
						let pid = -1;

						// Determine if the post has subjects or not
						if (btn.parentElement.children.length === 7)
							pid = btn.parentElement.children[6].textContent;
						else
							pid = btn.parentElement.children[5].textContent;

						sendDataToServer(href + '/deletePost', { id: pid });
						btn.parentElement.classList.add('hidden'); // 'Remove' the post item on the client
					}
				}
			}
		});

		// Attach a listener to the content box to verify if the text is within the boun`ds`
		let postTextBox = document.getElementById('postcrt-content');
		postTextBox.addEventListener('input', () => {
			if (postTextBox.value.length > 2000)
				postTextBox.style.color = 'red';
			else
				postTextBox.style.color = 'white';
		});

		// Attach toggle listeners to all the appropriate buttons
		newPostBtn.addEventListener('click', () => { togglePostCreator(newPostBtn) });
		document.getElementById('cancel-post-btn').addEventListener('click', togglePostCreator);
		document.getElementById('create-post-btn').addEventListener('click', () => {
			let postContent = postTextBox.value;
			if (postContent.length > 0 && postContent.length < 2001) {
				// Get the subjects
				let boxes = document.getElementsByClassName('addable-media');
				let ids  = []

				if (boxes.length) {
					for (i = 0; i < boxes.length; i++) {
						// Add all the checked media items
						if (boxes[i].children[0].checked)
							ids.push({ mediaID: boxes[i].children[2].textContent });
					}
				}

				// Create the post
				let postObj = {
					postContent: postContent,
					timestamp:   getCurDate(),
					ids:         ids
				};

				togglePostCreator();
				sendDataToServer(window.location.href + '/newPost', postObj, 'reload');
			}
		});

		// Attach toggle listeners to the list buttons (if it exists)
		newListBtn.addEventListener('click', () => { toggleListCreator(newListBtn) });
		document.getElementById('cancel-list-btn').addEventListener('click', toggleListCreator);
		document.getElementById('create-list-btn').addEventListener('click', () => {
			// Get user input
			let listName = document.getElementById('new-list-name').value;

			// Create the list if input > 0
			if (listName.length) {
				// toggleListCreator();
				sendDataToServer('/user/' + getUser('user') + '/newList', { name: listName }, 'reload');
			}
			else alert('New lists must have a name!');
		});
	}
}


// Media Page Interactions
function setupMediaPage() {
	let scoreFil = false;
	let nameFil  = false;
	let items    = [].slice.call(document.getElementsByClassName('media-container'));
	let mediaCon = document.getElementById('media-list-container');

	// Filter by name
	document.getElementsByClassName('filter-item')[1].addEventListener('click', () => {
		if (nameFil) {
			// Desc
			items.sort((a, b) => {
				return b.children[0].children[0].textContent.localeCompare(a.children[0].children[0].textContent);
			}).forEach((elem) => {
				mediaCon.appendChild(elem);
			});

			nameFil = false;
			scoreFil = false;
		} else {
			// Asc
			items.sort((a, b) => {
				return a.children[0].children[0].textContent.localeCompare(b.children[0].children[0].textContent);
			}).forEach((elem) => {
				mediaCon.appendChild(elem);
			});

			nameFil  = true;
			scoreFil = false;
		}

		updateFilterLabel(document.getElementsByClassName('filter-item')[0], scoreFil, nameFil);
	});

	// Filter by score
	document.getElementsByClassName('filter-item')[2].addEventListener('click', () => {
		if (scoreFil) {
			// Desc
			items.sort((a, b) => {
				return parseInt(a.children[3].children[0].textContent.substring(7))
						- parseInt(b.children[3].children[0].textContent.substring(7));
			}).forEach((elem) => {
				mediaCon.appendChild(elem);
			});

			nameFil  = false;
			scoreFil = false;
		} else {
			// Asc
			items.sort((a, b) => {
				return parseInt(b.children[3].children[0].textContent.substring(7))
						- parseInt(a.children[3].children[0].textContent.substring(7));
			}).forEach((elem) => {
				mediaCon.appendChild(elem);
			});

			nameFil  = false;
			scoreFil = true;
		}

		updateFilterLabel(document.getElementsByClassName('filter-item')[0], scoreFil, nameFil);
	});
}


// Post Page Interactions
function setupPostPage() {
	let posts = document.getElementsByClassName('post');

	// Check if there are any posts
	if (posts.length === 0) {
		let header = document.getElementsByClassName('sub-header')[0].children[0].textContent;
		let user   = header.substring(8, header.length - 7) 

		// Create the message
		let text = document.createElement('DIV');
		text.textContent = user + ' doesn\'t seem to have any posts on this piece of media yet...';
		text.style.fontSize = "1.5em";
		text.style.marginTop = "1.5em";

		// Put it in the DOM
		document.getElementById('user-content').insertAdjacentElement('beforeend', text);
	}
}


// Login/Signup Page Interactions
function setupFormPages() {
	setupFlashes();
}


// Error Page Interactions
function setupErrorPage() {
	setupFlashes();
}


// Setup Flash Messages
function setupFlashes() {
	// Format the flash message
	let flash = document.getElementsByClassName('flash-container')[0];
	if (flash) {
		flash.children[1].addEventListener('click', () => {
			// Fade and remove from the DOM
			flash.style.animation = 'fadeout 1s';
			setTimeout(() => {
				flash.parentNode.removeChild(flash);
			}, 980);
		});
	}
}