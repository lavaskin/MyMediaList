/* DESC: Houses functions that change the DOM on the clientside */


// Matches the type field and changes the creator type accordingly
// sentType     = String
// creatorField = HTML Object
function formatCreator(sentType, creatorField) {
	let actualCreator = creatorField.textContent;
	let type = '';

	switch (sentType) {
		case 'Show': case 'Movie': 
			type = 'Director';
			break;
		case 'Book': case 'Comic':
			type = 'Author';
			break;
		case 'Game':
			type = 'Developer';
			break;
	}

	creatorField.textContent = type + ': ' + actualCreator;
}


// Converts the progress's string field to a unicode character
// progressField = HTML Object
// user          = String
function formatProgress(progressField) {
	let user;
	if (window.location.href.includes('/list/'))
		user = getUser('list');
	else
		user = getUser('media');

	if (progressField.textContent === "1") {
		progressField.textContent = '✓';
		progressField.title = user + ' has finished this.';
	} else {
		progressField.textContent = '⏲';
		progressField.title = user + ' is working on this.';
	}
}


// Colors the score field depending on the given score
// scoreField = HTML Object
function formatScore(scoreField) {
	let score = parseInt(scoreField.textContent.substring(7));

	switch(score) {
		case 1: case 2: case 3:
			scoreField.style.color = 'red';
			break;
		case 4: case 5: case 6:
			scoreField.style.color = 'orange';
			break;
		case 7: case 8: case 9:
			scoreField.style.color = 'green';
			break;
		case 10:
			scoreField.style.color = 'yellow';
			scoreField.style.textShadow = '0 0 3px yellow';
			break;
	}
}


// Calls the format suite of functions on a given media object
// mediaObj = HTML Obj
function formatMedia(mediaObj) {
	formatCreator(mediaObj.children[2].textContent, mediaObj.children[1])
	formatScore(mediaObj.children[3].children[0]);
	formatProgress(mediaObj.children[4]);

	mediaObj.classList.remove('hidden');
}


// Toggles whether the post container can be seen or not
function togglePostCreator() {
	let postCreator = document.getElementById('postcrt-container');
	let postBtn     = document.getElementById('new-post-btn')
	
	postCreator.children[1].value = '';

	// Clear all the checkboxes
	let boxes = document.getElementsByClassName('addable-media');
	if (boxes) {
		for (i = 0; i < boxes.length; i++)
			boxes[i].children[0].checked = false;
	}

	// Toggle all the hidden classes
	if (postCreator.classList.contains('hidden')) {
		postCreator.classList.remove('hidden');
		postBtn.classList.add('hidden');
	} else {
		postCreator.classList.add('hidden');
		postBtn.classList.remove('hidden');
	}
}


// Toggles whether the list creator can be seen or not
function toggleListCreator() {
	let listCreator = document.getElementById('listcrt-container');
	let listBtn     = document.getElementById('new-list-btn');
	
	// Resets the input field to blank
	listCreator.children[0].value = '';

	// Toggle all the hidden classes
	if (listCreator.classList.contains('hidden')) {
		listCreator.classList.remove('hidden');
		listBtn.classList.add('hidden');
	} else {
		listCreator.classList.add('hidden');
		listBtn.classList.remove('hidden');
	}
}


// Toggle media creator
function toggleMediaCreator() {
	let deleteListBtn = document.getElementById('delete-list-btn');
	let mediaCreator = document.getElementById('media-creator-container');
	let creatorBtn   = document.getElementById('add-media-btn');

	// Clear all the checkboxes
	let boxes = document.getElementsByClassName('addable-media');
	if (boxes) {
		for (i = 0; i < boxes.length; i++)
			boxes[i].children[0].checked = false;
	}

	// Add hidden to form containers and buttons
	document.getElementById('new-media-creator').classList.add('hidden');
	document.getElementById('existing-media-container').classList.add('hidden');
	document.getElementById('form-btns').classList.add('hidden');

	// Remove hidden from selection buttons
	let btns = document.getElementsByClassName('selection-btn');
	btns[0].classList.remove('hidden');
	btns[1].classList.remove('hidden');

	// Clear new media item form
	let radios = document.getElementsByClassName('radio');
	for (i = 0; i < radios.length; i++) radios[i].checked = false;
	let inputs = document.getElementsByClassName('media-input');
	for (i = 0; i < inputs.length; i++) inputs[i].value = '';
	document.getElementsByClassName('finished-btn')[0].textContent = 'Finished?';

	// Toggle all the hidden classes
	if (mediaCreator.classList.contains('hidden')) {
		creatorBtn.classList.add('hidden');
		deleteListBtn.classList.add('hidden');
		mediaCreator.classList.remove('hidden');
	} else {
		mediaCreator.classList.add('hidden');
		creatorBtn.classList.remove('hidden');
		deleteListBtn.classList.remove('hidden');
	}
}


// Updates the score filter based on a few parameters
// label             = HTML Object
// scoreFil, nameFil = Bool
function updateFilterLabel(label, scoreFil, nameFil) {
	let labelText = label.textContent;

	if (labelText.length == 8)
		label.textContent += ' ▲';
	else {
		// Check filter values
		if (nameFil || scoreFil)
			label.textContent = labelText.substring(0, labelText.length - 2) + ' ▲';
		else
			label.textContent = labelText.substring(0, labelText.length - 2) + ' ▼';
	}
}