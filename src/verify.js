// Various server-side verifications of client data
// Return true  = Obj is OKAY
//        false = Obj is BAD
module.exports = {
	post: (postObj) => {
		let body = postObj.postContent;

		if (!body.length || body.length > 2000) return false;

		let time    = postObj.timestamp;
		let date    = new Date();
		let curDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
		
		if (time.localeCompare(curDate) !== 0) return false;

		return true;
	},

	media: (mediaObj) => {
		// Check string lengths
		if (!mediaObj.title.length
			|| mediaObj.title.length > 100
			|| !mediaObj.creator.length
			|| mediaObj.creator.length > 100)
			return false;
		
		// Check if it's a proper type
		let type = mediaObj.type;
		if (type.localeCompare('Book')     !== 0
			&& type.localeCompare('Movie') !== 0 
			&& type.localeCompare('Comic') !== 0 
			&& type.localeCompare('Show')  !== 0 
			&& type.localeCompare('Game')  !== 0 )
			return false;
		
		let score = mediaObj.score;
		if (isNaN(score) || score > 10 || score < 1) return false;
		
		let progress = parseInt(mediaObj.progress);
		if (isNaN(progress) || progress > 1 || progress < 0)return false;
		
		return true;
	},
	
	register: (registerObj) => {
		let name = registerObj.username;
		let p1   = registerObj.password;
		let p2   = registerObj.cPassword;

		if (!name || !p1 || !p2)
			return 'Not enough fields provided.';
		if (name.length < 3 || name.length > 16)
			return 'Improper username length given.';
		if (p1.length < 6 || p1.length > 50)
			return 'Improper password length given.';
		if (p1 !== p2)
			return 'The provided passwords don\'t match';

		return '';
	},

	login: (loginObj) => {
		let name = loginObj.username;
		let p1   = loginObj.password;

		if (!name || !p1)
			return 'Not enough fields provided.';
		if (name.length < 3 || name.length > 16)
			return 'Improper username length given.';
		if (p1.length < 6 || p1.length > 50)
			return 'Improper password length given.';

		return '';
	}
}