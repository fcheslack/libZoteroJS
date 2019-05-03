

var log = require('./Log.js').Logger('libZotero:Utils');

let randomString = function (len, chars) {
	if (!chars) {
		chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	}
	if (!len) {
		len = 8;
	}
	var randomstring = '';
	for (var i = 0; i < len; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum, rnum + 1);
	}
	return randomstring;
};

let getKey = function () {
	var baseString = '23456789ABCDEFGHIJKMNPQRSTUVWXZ';
	return Utils.randomString(8, baseString);
};

let slugify = function (name) {
	var slug = name.trim();
	slug = slug.toLowerCase();
	slug = slug.replace(/[^a-z0-9 ._-]/g, '');
	slug = slug.replace(/\s/g, '_');

	return slug;
};

let prependAutocomplete = function (pre, source) {
	log.debug('Zotero.utils.prependAutocomplete', 3);
	log.debug('prepend match: ' + pre, 4);
	var satisfy;
	if (!source) {
		log.warn('source is not defined');
	}
	if (pre === '') {
		satisfy = source.slice(0);
		return satisfy;
	}
	var plen = pre.length;
	var plower = pre.toLowerCase();
	satisfy = source.map(function (n) {
		if (n.substr(0, plen).toLowerCase() == plower) {
			return n;
		} else {
			return null;
		}
	});
	return satisfy;
};

let matchAnyAutocomplete = function (pre, source) {
	log.debug('Zotero.utils.matchAnyAutocomplete', 3);
	log.debug('matchAny match: ' + pre, 4);
	var satisfy;
	if (!source) {
		log.warn('source is not defined');
	}
	if (pre === '') {
		satisfy = source.slice(0);
		return satisfy;
	}
	var plower = pre.toLowerCase();
	satisfy = source.map(function (n) {
		if (n.toLowerCase().indexOf(plower) != -1) {
			return n;
		} else {
			return null;
		}
	});
	return satisfy;
};

let libraryString = function (type, libraryID) {
	var lstring = '';
	if (type == 'user') lstring = 'u';
	else if (type == 'group') lstring = 'g';
	else if (type == 'publications') lstring = 'p';
	lstring += libraryID;
	return lstring;
};

let parseLibString = function (libraryString) {
	var type;
	var libraryID;
	if (libraryString.charAt(0) == 'u') {
		type = 'user';
	} else if (libraryString.charAt(0) == 'g') {
		type = 'group';
	} else if (libraryString.charAt(0) == 'p') {
		type = 'publications';
	} else {
		throw new Error('unexpected type character in libraryString');
	}
	libraryID = parseInt(libraryString.substring(1), 10);
	if (isNaN(libraryID)) {
		throw new Error('NaN libraryID');
	}
	return { libraryType: type, libraryID: libraryID };
};

// return true if retrieved more than lifetime minutes ago
let stale = function (retrievedDate, lifetime) {
	var now = Date.now(); // current local time
	var elapsed = now.getTime() - retrievedDate.getTime();
	if ((elapsed / 60000) > lifetime) {
		return true;
	}
	return false;
};

let entityify = function (str) {
	var character = {
		'<': '&lt;',
		'>': '&gt;',
		'&': '&amp;',
		'"': '&quot;'
	};
	return str.replace(/[<>&"]/g, function (c) {
		return character[c];
	});
};

let parseApiDate = function (datestr) {
	// var parsems = Date.parse(datestr);

	var re = /([0-9]+)-([0-9]+)-([0-9]+)T([0-9]+):([0-9]+):([0-9]+)Z/;
	var matches = re.exec(datestr);
	if (matches === null) {
		log.debug(`error parsing api date: ${datestr}`, 2);
		return null;
	} else {
		var date = new Date(Date.UTC(matches[1], matches[2] - 1, matches[3], matches[4], matches[5], matches[6]));
		return date;
	}
};

let readCookie = function (name) {
	var nameEQ = name + '=';
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
};

/**
 * Translate common mimetypes to user friendly versions
 *
 * @param string $mimeType
 * @return string
 */
let translateMimeType = function (mimeType) {
	switch (mimeType) {
	case 'text/html':
		return 'html';

	case 'application/pdf':
	case 'application/x-pdf':
	case 'application/acrobat':
	case 'applications/vnd.pdf':
	case 'text/pdf':
	case 'text/x-pdf':
		return 'pdf';

	case 'image/jpg':
	case 'image/jpeg':
		return 'jpg';

	case 'image/gif':
		return 'gif';

	case 'application/msword':
	case 'application/doc':
	case 'application/vnd.msword':
	case 'application/vnd.ms-word':
	case 'application/winword':
	case 'application/word':
	case 'application/x-msw6':
	case 'application/x-msword':
		return 'doc';

	case 'application/vnd.oasis.opendocument.text':
	case 'application/x-vnd.oasis.opendocument.text':
		return 'odt';

	case 'video/flv':
	case 'video/x-flv':
		return 'flv';

	case 'image/tif':
	case 'image/tiff':
	case 'image/x-tif':
	case 'image/x-tiff':
	case 'application/tif':
	case 'application/x-tif':
	case 'application/tiff':
	case 'application/x-tiff':
		return 'tiff';

	case 'application/zip':
	case 'application/x-zip':
	case 'application/x-zip-compressed':
	case 'application/x-compress':
	case 'application/x-compressed':
	case 'multipart/x-zip':
		return 'zip';

	case 'video/quicktime':
	case 'video/x-quicktime':
		return 'mov';

	case 'video/avi':
	case 'video/msvideo':
	case 'video/x-msvideo':
		return 'avi';

	case 'audio/wav':
	case 'audio/x-wav':
	case 'audio/wave':
		return 'wav';

	case 'audio/aiff':
	case 'audio/x-aiff':
	case 'sound/aiff':
		return 'aiff';

	case 'text/plain':
		return 'plain text';
	case 'application/rtf':
		return 'rtf';

	default:
		return mimeType;
	}
};

/**
 * Get the permissions a key has for a library
 * if no key is passed use the currently set key for the library
 *
 * @param int|string $userID
 * @param string $key
 * @return array $keyPermissions
 */
let getKeyPermissions = function (userID, key) {
	if (!userID) {
		return false;
	}

	if (!key) {
		return false;
	}

	var urlconfig = { target: 'key', apiKey: key, libraryType: '' };

	return Zotero.ajaxRequest(urlconfig)
		.then(function (response) {
			var keyObject = JSON.parse(response.data);
			return keyObject;
		});
};

/**
 * Given a query string, parse keys/values into an object
 **/
let parseQuery = function (query) {
	log.debug('parseQuery', 4);
	var params = {};
	var match;
	var pl = /\+/g; // Regex for replacing addition symbol with a space
	var search = /([^&=]+)=?([^&]*)/g;
	var decode = function (s) {
		return decodeURIComponent(s.replace(pl, ' '));
	};

	while (match = search.exec(query)) {
		let key = decode(match[1]);
		let val = decode(match[2]);
		if (params[key]) {
			params[key] = [].concat(params[key], val);
		} else {
			params[key] = val;
		}
	}
	return params;
};

let buildQuery = function (params = {}) {
	let q = '?';
	for (let p in params) {
		q += `&${encodeURIComponent(p)}=${encodeURIComponent(params[p])}`;
	}
	return q;
};

// extract the section of a url between ? and #
let querystring = function (href) {
	if (href.indexOf('?') == -1) {
		return '';
	}
	var hashindex = (href.indexOf('#') != -1) ? href.indexOf('#') : undefined;
	var q = href.substring(href.indexOf('?') + 1, hashindex);
	return q;
};

// split an array of objects into chunks to write over multiple api requests
let chunkObjectsArray = function (objectsArray, chunkSize = 50) {
	var writeChunks = [];
	for (var i = 0; i < objectsArray.length; i += chunkSize) {
		writeChunks.push(objectsArray.slice(i, i + chunkSize));
	}
	return writeChunks;
};

let Utils = {
	randomString,
	getKey,
	slugify,
	prependAutocomplete,
	matchAnyAutocomplete,
	libraryString,
	parseLibString,
	stale,
	entityify,
	parseApiDate,
	readCookie,
	translateMimeType,
	getKeyPermissions,
	parseQuery,
	buildQuery,
	querystring,
	chunkObjectsArray
};

export {
	Utils,
	randomString,
	getKey,
	slugify,
	prependAutocomplete,
	matchAnyAutocomplete,
	libraryString,
	parseLibString,
	stale,
	entityify,
	parseApiDate,
	readCookie,
	translateMimeType,
	getKeyPermissions,
	parseQuery,
	buildQuery,
	querystring,
	chunkObjectsArray
};
