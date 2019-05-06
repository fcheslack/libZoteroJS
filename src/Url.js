

var log = require('./Log.js').Logger('libZotero:Url');

// Url.js - construct certain urls and links locally that may depend on the
// current website's routing scheme etc. Not necessarily pointing to zotero.org
// - href for a particular item's local representation
// - link with appropriate text, to download file or view framed snapshot
// - href for file download/view, depending on whether config says to download
// directly from the api, or to proxy it
// - displayable string describing the attachment file (attachmentFileDetails)
// - list of urls for supported export formats
//

var Url = {};

// locally construct a url for the item on the current website
Url.itemHref = function (item) {
	var href = '';
	href += Zotero.config.librarySettings.libraryPathString + '/itemKey/' + item.get('key');
	return href;
};

// construct a download link for an item's enclosure file that takes into
// account size and whether the file is a snapshot
Url.attachmentDownloadLink = function (item) {
	var retString = '';
	var downloadUrl = item.attachmentDownloadUrl;
	
	if (item.apiObj.links && item.apiObj.links.enclosure) {
		if (!item.apiObj.links.enclosure.length && item.isSnapshot()) {
			// snapshot: redirect to view
			retString += '<a href="' + downloadUrl + '">View Snapshot</a>';
		} else {
			// file: offer download
			var enctype = Zotero.utils.translateMimeType(item.apiObj.links.enclosure.type);
			var enc = item.apiObj.links.enclosure;
			var filesize = parseInt(enc.length, 10);
			var filesizeString = '' + filesize + ' B';
			if (filesize > 1073741824) {
				filesizeString = '' + (filesize / 1073741824).toFixed(1) + ' GB';
			} else if (filesize > 1048576) {
				filesizeString = '' + (filesize / 1048576).toFixed(1) + ' MB';
			} else if (filesize > 1024) {
				filesizeString = '' + (filesize / 1024).toFixed(1) + ' KB';
			}
			log.debug(enctype, 3);
			retString += '<a href="' + downloadUrl + '">';
			if (enctype == 'undefined' || enctype === '' || typeof enctype == 'undefined') {
				retString += filesizeString + '</a>';
			} else {
				retString += enctype + ', ' + filesizeString + '</a>';
			}
			return retString;
		}
	}
	return retString;
};

Url.attachmentDownloadUrl = function (item) {
	if (item.apiObj.links && item.apiObj.links.enclosure) {
		if (Zotero.config.proxyDownloads) {
			// we have a proxy for downloads at baseDownloadUrl so just pass an itemkey to that
			return Url.wwwDownloadUrl(item);
		} else {
			return Url.apiDownloadUrl(item);
		}
	}
	return false;
};

Url.apiDownloadUrl = function (item) {
	if (item.apiObj.links.enclosure) {
		return item.apiObj.links.enclosure.href;
	}
	return false;
};

Url.proxyDownloadUrl = function (item) {
	if (item.apiObj.links.enclosure) {
		if (Zotero.config.proxyDownloads) {
			return Zotero.config.baseDownloadUrl + '?itemkey=' + item.get('key');
		} else {
			return Url.apiDownloadUrl(item);
		}
	} else {
		return false;
	}
};

Url.wwwDownloadUrl = function (item) {
	if (item.apiObj.links.enclosure) {
		return Zotero.config.baseZoteroWebsiteUrl + Zotero.config.librarySettings.libraryPathString + '/' + item.get('key') + '/file/view';
	} else {
		return false;
	}
};

Url.publicationsDownloadUrl = function (item) {
	if (item.apiObj.links.enclosure) {
		return item.apiObj.links.enclosure.href;
	}
	return false;
};

Url.attachmentFileDetails = function (item) {
	// file: offer download
	if (!item.apiObj.links.enclosure) return '';
	var enctype = Zotero.utils.translateMimeType(item.apiObj.links.enclosure.type);
	var enc = item.apiObj.links.enclosure;
	var filesizeString = '';
	if (enc.length) {
		var filesize = parseInt(enc.length, 10);
		filesizeString = '' + filesize + ' B';
		if (filesize > 1073741824) {
			filesizeString = '' + (filesize / 1073741824).toFixed(1) + ' GB';
		} else if (filesize > 1048576) {
			filesizeString = '' + (filesize / 1048576).toFixed(1) + ' MB';
		} else if (filesize > 1024) {
			filesizeString = '' + (filesize / 1024).toFixed(1) + ' KB';
		}
		return '(' + enctype + ', ' + filesizeString + ')';
	} else {
		return '(' + enctype + ')';
	}
};

Url.userWebLibrary = function (slug) {
	return [Zotero.config.baseWebsiteUrl, slug, 'items'].join('/');
};

Url.groupWebLibrary = function (group) {
	if (group.type == 'Private') {
		return [Zotero.config.baseWebsiteUrl, 'groups', group.get('id'), 'items'].join('/');
	} else {
		return [Zotero.config.baseWebsiteUrl, 'groups', Zotero.utils.slugify(group.get('name')), 'items'].join('/');
	}
};

Url.exportUrls = function (config) {
	log.debug('Zotero.url.exportUrls', 3);
	var exportUrls = {};
	var exportConfig = {};
	Zotero.config.exportFormats.forEach(function (format) {
		exportConfig = Object.assign(config, { format: format });
		exportUrls[format] = Zotero.ajax.apiRequestUrl(exportConfig) + Zotero.ajax.apiQueryString({ format: format, limit: '25' });
	});
	return exportUrls;
};

Url.relationUrl = function (libraryType, libraryID, itemKey) {
	switch (libraryType) {
	case 'group':
		return `http://zotero.org/groups/${libraryID}/items/${itemKey}`;
	case 'user':
		return `http://zotero.org/users/${libraryID}/items/${itemKey}`;
	case 'publications':
		return `http://zotero.org/users/${libraryID}/publications/items/${itemKey}`;
	}
	return '';
};

export { Url };
