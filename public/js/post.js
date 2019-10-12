/* DESC: Houses functions that send data to the server */


// Sends data to the server along a specified URL
// url    = String
// obj    = {}
// reload = Bool
async function sendDataToServer(url, obj, action) {
	// Open a post request
	let request = new XMLHttpRequest();

	request.open('POST', url, 'true');
	request.setRequestHeader('Content-Type', 'application/json');

	// Reload the page on request recieved
	if (action) {
		request.onreadystatechange = function() {
			if (request.status === 200 && request.readyState === 4) {
				// Under the assumption the user knows what they're doing
				switch (action) {
					case 'reload':
						window.location.reload();
						break;
					case 'redirect':
						let obj = JSON.parse(request.responseText);
						window.location.replace(obj.redirect);
				}
			}
		}
	}

	request.send(JSON.stringify(obj));
}


// Parses a checklist for selected media items and adds them to the list
// checklist = {}
function addMediaToList(checklist) {
	let ids = [];

	for (i = 0; i < checklist.length; i++) {
		if (checklist[i].children[0].checked)
			ids.push(checklist[i].children[2].textContent);
	}
 
	sendDataToServer('/user/' + getUser('list') + '/list/' + getURLID(window.location.href) + '/updateList', ids, 'reload');
}


// Parses the media creation forms input and sends a new media object to the server
function createNewMediaItem() {
	let form     = document.getElementById('new-media-creator');
	let title    = form.children[0].value;
	let creator  = form.children[1].value;
	let score    = parseInt(form.children[2].value);
	let progress = form.children[3].textContent;
	let typeArr  = form.children[4].children;

	// Verify input
	if (!title.length || title.length > 100)     { alert('Title must be 1 → 100 characters long!'); return }
	if (!creator.length || creator.length > 100) { alert('The creators name must be 1 → 100 characters long!'); return }
	if (isNaN(score) || score > 10 || score < 1) { alert('Score must be a number between 1 and 10.'); return }

	// Convert progress into an int
	let progressNum = 0;
	if (progress.localeCompare('Yes!') === 0) progressNum = '1';
	else progressNum = '0';

	// Determine what type was selected (+2 to skip the br's), and that it's valid
	let type = "";
	let found = false;
	for (i = 1; i < typeArr.length; i += 2) {
		if (typeArr[i].checked) {
			type = typeArr[i].value;
			found = true;
			break;
		}
	}

	if (!found) { alert('A type must be selected!'); return }

	// Send it to the server
	sendDataToServer('/user/' + getUser('list') + '/list/' + getURLID(window.location.href) + '/addMedia', {
		title: title,
		creator: creator,
		type: type,
		score: score,
		progress: progressNum
	}, 'reload');

	// Close the modal if all goes according to plan
	toggleMediaCreator();
}


// Sends a post to the server asking to update a media objects score
// scoreField = HTML Object
function updateScore(scoreField) {
	let mid    = getURLID(scoreField.parentElement.parentElement.children[0].children[0].href);
	let input  = scoreField.parentElement.children[1].children[0];
	let cancel = scoreField.parentElement.children[1].children[2];
	let change = scoreField.parentElement.children[1].children[1];

	// Cancel button listener
	cancel.addEventListener('click', () => {
		input.value = '';
		scoreField.classList.remove('hidden');
		cancel.parentElement.classList.add('hidden');
	});

	// Changer button listener
	change.addEventListener('click', () => {
		let score = parseInt(input.value);
		
		// Check if it's valid
		// No idea why I have to delay it slighty, but here we are
		setTimeout(() => {
			if (isNaN(score) || score > 10 || score < 1)
				alert('Score must be a number between 1 and 10.');
			else {
				scoreField.textContent = 'Score: ' + score;
				scoreField.style.textShadow = 'none';
				formatScore(scoreField);
	
				input.value = '';
				scoreField.classList.remove('hidden');
				cancel.parentElement.classList.add('hidden');
	
				let user = (window.location.href.includes('/list/')) ? getUser('list') : getUser('media');
				sendDataToServer('/user/' + user + '/updateMedia/' + mid, { score: score });
			}
		}, 1);
		
	});
}


// Sends a post to the server asking to update a media objects progress
// mediaField = HTML Object
function updateProgress(mediaField) {
	let mid = getURLID(mediaField.parentElement.children[0].children[0].href);
	let obj = { progress: 0 };
	if (mediaField.textContent.localeCompare('⏲') === 0)
		obj.progress = 1;
	
	// Format the progress on the client
	mediaField.textContent = obj.progress;
	formatProgress(mediaField);

	let user = (window.location.href.includes('/list/')) ? getUser('list') : getUser('media');
	sendDataToServer('/user/' + user + '/updateMedia/' + mid, obj);
}