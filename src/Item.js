

let log = require('./Log.js').Logger('libZotero:Item');

import { ApiObject } from './ApiObject';
let striptags = require('striptags');
let ItemMaps = require('./ItemMaps.js');

/*
 * TODO: several functions should not work unless we build a fresh item with a template
 * or parsed an item from the api with json content (things that depend on apiObj)
 * There should be a flag to note whether this is the case and throwing on attempts to
 * use these functions when it is not.
 */
class Item extends ApiObject {
	constructor(itemObj) {
		super(itemObj);
		this.instance = 'Zotero.Item';
		this.version = 0;
		this.key = '';
		this.synced = false;
		this.apiObj = {};
		this.pristineData = null;
		this.childItemKeys = [];
		this.writeErrors = [];
		this.notes = [];
		if (itemObj) {
			this.parseJsonItem(itemObj);
		} else {
			this.parseJsonItem(Item.emptyJsonItem());
		}
		this.initSecondaryData();
	}

	parseJsonItem(apiObj) {
		this.version = apiObj.version;
		this.key = apiObj.key;
		this.apiObj = Object.assign({}, apiObj);
		this.pristineData = Object.assign({}, apiObj.data);
		if (!this.apiObj._supplement) {
			this.apiObj._supplement = {};
		}
	}

	static emptyJsonItem() {
		return {
			key: '',
			version: 0,
			library: {},
			links: {},
			data: {
				key: '',
				version: 0,
				title: '',
				creators: [],
				collections: [],
				tags: [],
				relations: {}
			},
			meta: {},
			_supplement: {}
		};
	}

	// populate property values derived from json content
	initSecondaryData() {
		this.version = this.apiObj.version;
		
		if (this.apiObj.data.itemType == 'attachment') {
			this.mimeType = this.apiObj.data.contentType;
			this.translatedMimeType = Zotero.utils.translateMimeType(this.mimeType);
		}
		if ('linkMode' in this.apiObj) {
			this.linkMode = this.apiObj.data.linkMode;
		}
		
		this.attachmentDownloadUrl = Zotero.url.attachmentDownloadUrl(this);
		
		if (this.apiObj.meta.parsedDate) {
			this.parsedDate = new Date(this.apiObj.meta.parsedDate);
		} else {
			this.parsedDate = false;
		}
		
		this.synced = false;

		this.updateTagStrings();
	}

	updateTagStrings() {
		var tagstrings = [];
		for (var i = 0; i < this.apiObj.data.tags.length; i++) {
			tagstrings.push(this.apiObj.data.tags[i].tag);
		}
		this.apiObj._supplement.tagstrings = tagstrings;
	}

	initEmpty(itemType, linkMode) {
		return Item.getItemTemplate(itemType, linkMode)
			.then((template) => {
				this.initEmptyFromTemplate(template);
				return this;
			});
	}

	// special case note initialization to guarentee synchronous and simplify some uses
	initEmptyNote() {
		this.version = 0;
		var noteTemplate = { itemType: 'note', note: '', tags: [], collections: [], relations: {} };
		
		this.initEmptyFromTemplate(noteTemplate);
		
		return this;
	}

	initEmptyFromTemplate(template) {
		this.version = 0;
		
		this.key = '';
		this.pristineData = Object.assign({}, template);
		this.apiObj = {
			key: '',
			version: 0,
			library: {},
			links: {},
			data: template,
			meta: {},
			_supplement: {}
		};
		
		this.initSecondaryData();
		return this;
	}

	isSupplementaryItem() {
		var itemType = this.get('itemType');
		if (itemType == 'attachment' || itemType == 'note') {
			return true;
		}
		return false;
	}

	isSnapshot() {
		if (this.apiObj.links.enclosure) {
			var ftype = this.apiObj.links.enclosure.type;
			if (!this.apiObj.links.enclosure.length && ftype == 'text/html') {
				return true;
			}
		}
		return false;
	}

	updateObjectKey(objectKey) {
		return this.updateItemKey(objectKey);
	}

	updateItemKey(itemKey) {
		this.key = itemKey;
		this.apiObj.key = itemKey;
		this.apiObj.data.key = itemKey;
		this.pristineData.key = itemKey;
		return this;
	}

	/*
	 * Write updated information for the item to the api and potentiallyp
	 * create new child notes (or attachments?) of this item
	 */
	writeItem() {
		if (!this.owningLibrary) {
			throw new Error('Item must be associated with a library');
		}
		return this.owningLibrary.items.writeItems([this]);
	}

	// get the JS object to be PUT/POSTed for write
	writeApiObj() {
		// remove any creators that have no names
		if (this.apiObj.data.creators) {
			var newCreatorsArray = this.apiObj.data.creators.filter(function (c) {
				if (c.name || c.firstName || c.lastName) {
					return true;
				}
				return false;
			});
			this.apiObj.data.creators = newCreatorsArray;
		}
		
		// copy apiObj, extend with pristine to make sure required fields are present
		// and remove unwriteable fields(?)
		var writeApiObj = Object.assign({}, this.pristineData, this.apiObj.data);
		return writeApiObj;
	}

	async createChildNotes(notes) {
		var childItems = [];
		var childItemPromises = [];
		
		notes.forEach((note) => {
			var childItem = new Item();
			var p = childItem.initEmpty('note')
				.then((noteItem) => {
					noteItem.set('note', note.note);
					noteItem.set('parentItem', this.key);
					childItems.push(noteItem);
				});
			childItemPromises.push(p);
		});
		
		await Promise.all(childItemPromises);
		return this.owningLibrary.writeItems(childItems);
	}

	// TODO: implement
	/*
	writePatch() {
		
	}
	*/

	async getChildren(library) {
		log.debug('Zotero.Item.getChildren', 4);
		// short circuit if has item has no children
		if (!this.apiObj.meta.numChildren) {
			return [];
		}
	
		let config = {
			url: {
				target: 'children',
				libraryType: this.apiObj.library.type,
				libraryID: this.apiObj.library.id,
				itemKey: this.key
			}
		};
	
		let response = await this.owningLibrary.ajaxRequest(config);
		log.debug('getChildren proxied callback', 4);
		var items = library.items;
		var childItems = items.addItemsFromJson(response.data);
		for (var i = childItems.length - 1; i >= 0; i--) {
			childItems[i].associateWithLibrary(library);
		}

		return childItems;
	}

	static getItemTypes(locale) {
		log.debug('Zotero.Item.prototype.getItemTypes', 3);
		if (!locale) {
			locale = 'en-US';
		}
		locale = 'en-US';

		var itemTypes = Zotero.cache.load({ locale: locale, target: 'itemTypes' });
		if (itemTypes) {
			log.debug('have itemTypes in localStorage', 3);
			Item.prototype.itemTypes = itemTypes;// JSON.parse(Zotero.storage.localStorage['itemTypes']);
			return;
		}
		
		var query = Zotero.ajax.apiQueryString({ locale: locale });
		var url = Zotero.config.baseApiUrl + '/itemTypes' + query;
		Zotero.net.ajax({
			url: Zotero.ajax.proxyWrapper(url, 'GET'),
			type: 'GET'
		}).then(function (xhr) {
			log.debug('got itemTypes response', 3);
			log.debug(xhr.response, 4);
			Item.prototype.itemTypes = JSON.parse(xhr.responseText);
			Zotero.cache.save({ locale: locale, target: 'itemTypes' }, Item.prototype.itemTypes);
		});
	}

	getItemFields(locale) {
		log.debug('Zotero.Item.prototype.getItemFields', 3);
		if (!locale) {
			locale = 'en-US';
		}
		locale = 'en-US';
		
		var itemFields = Zotero.cache.load({ locale: locale, target: 'itemFields' });
		if (itemFields) {
			log.debug('have itemFields in localStorage', 3);
			Item.prototype.itemFields = itemFields;// JSON.parse(Zotero.storage.localStorage['itemFields']);
			Object.keys(this.itemFields).forEach(function (key) {
				var val = this.itemFields[key];
				Zotero.localizations.fieldMap[val.field] = val.localized;
			});
			return;
		}
		
		var query = Zotero.ajax.apiQueryString({ locale: locale });
		var requestUrl = Zotero.config.baseApiUrl + '/itemFields' + query;
		Zotero.net.ajax({
			url: Zotero.ajax.proxyWrapper(requestUrl),
			type: 'GET'
		}).then(function (xhr) {
			log.debug('got itemTypes response', 4);
			var data = JSON.parse(xhr.responseText);
			Item.prototype.itemFields = data;
			Zotero.cache.save({ locale: locale, target: 'itemFields' }, data);
			// Zotero.storage.localStorage['itemFields'] = JSON.stringify(data);
			Object.keys(Item.prototype.itemFields).forEach(function (key) {
				var val = Item.prototype.itemFields[key];
				Zotero.localizations.fieldMap[val.field] = val.localized;
			});
		});
	}

	static async getItemTemplate(itemType = 'document', linkMode = '') {
		log.debug('Zotero.Item.prototype.getItemTemplate', 3);
		if (itemType == 'attachment' && linkMode == '') {
			throw new Error('attachment template requested with no linkMode');
		}
		
		var query = Zotero.ajax.apiQueryString({ itemType: itemType, linkMode: linkMode });
		var requestUrl = Zotero.config.baseApiUrl + '/items/new' + query;
		
		var cacheConfig = { itemType: itemType, target: 'itemTemplate' };
		var itemTemplate = Zotero.cache.load(cacheConfig);
		if (itemTemplate) {
			log.debug('have itemTemplate in localStorage', 3);
			var template = itemTemplate;// JSON.parse(Zotero.storage.localStorage[url]);
			return template;
		}
		
		let response = await Zotero.ajaxRequest(requestUrl, 'GET', { dataType: 'json' });
		log.debug('got itemTemplate response', 3);
		Zotero.cache.save(cacheConfig, response.data);
		return response.data;
	}

	getUploadAuthorization(fileinfo) {
		// fileInfo: md5, filename, filesize, mtime, zip, contentType, charset
		log.debug('Zotero.Item.getUploadAuthorization', 3);
		var config = {
			target: 'item',
			targetModifier: 'file',
			libraryType: this.owningLibrary.type,
			libraryID: this.owningLibrary.libraryID,
			itemKey: this.key
		};
		var headers = {
			'Content-Type': 'application/x-www-form-urlencoded'
		};
		var oldmd5 = this.get('md5');
		if (oldmd5) {
			headers['If-Match'] = oldmd5;
		} else {
			headers['If-None-Match'] = '*';
		}
		
		return Zotero.ajaxRequest(config, 'POST',
			{
				processData: true,
				data: fileinfo,
				headers: headers
			}
		);
	}

	registerUpload(uploadKey) {
		log.debug('Zotero.Item.registerUpload', 3);
		var config = {
			target: 'item',
			targetModifier: 'file',
			libraryType: this.owningLibrary.type,
			libraryID: this.owningLibrary.libraryID,
			itemKey: this.key
		};
		var headers = {
			'Content-Type': 'application/x-www-form-urlencoded'
		};
		var oldmd5 = this.get('md5');
		if (oldmd5) {
			headers['If-Match'] = oldmd5;
		} else {
			headers['If-None-Match'] = '*';
		}
		
		return Zotero.ajaxRequest(config, 'POST',
			{
				processData: true,
				data: { upload: uploadKey },
				headers: headers
			});
	}
	
	/*
	fullUpload(file) {

	}
	*/
	
	static getCreatorTypes(itemType) {
		log.debug('Zotero.Item.prototype.getCreatorTypes: ' + itemType, 3);
		if (!itemType) {
			itemType = 'document';
		}
		
		// parse stored creatorTypes object if it exists
		// creatorTypes maps itemType to the possible creatorTypes
		var creatorTypes = Zotero.cache.load({ target: 'creatorTypes' });
		if (creatorTypes) {
			log.debug('have creatorTypes in localStorage', 3);
			Item.prototype.creatorTypes = creatorTypes;// JSON.parse(Zotero.storage.localStorage['creatorTypes']);
		}
		
		if (Item.prototype.creatorTypes[itemType]) {
			log.debug('creatorTypes of requested itemType available in localStorage', 3);
			log.debug(Item.prototype.creatorTypes, 4);
			return Promise.resolve(Item.prototype.creatorTypes[itemType]);
		} else {
			log.debug('sending request for creatorTypes', 3);
			var query = Zotero.ajax.apiQueryString({ itemType: itemType });
			// TODO: this probably shouldn't be using baseApiUrl directly
			var requestUrl = Zotero.config.baseApiUrl + '/itemTypeCreatorTypes' + query;
			
			return Zotero.ajaxRequest(requestUrl, 'GET', { dataType: 'json' })
				.then(function (response) {
					log.debug('got creatorTypes response', 4);
					Item.prototype.creatorTypes[itemType] = response.data;
					// Zotero.storage.localStorage['creatorTypes'] = JSON.stringify(Item.prototype.creatorTypes);
					Zotero.cache.save({ target: 'creatorTypes' }, Item.prototype.creatorTypes);
					return Item.prototype.creatorTypes[itemType];
				});
		}
	}

	static getCreatorFields(_locale) {
		log.debug('Zotero.Item.prototype.getCreatorFields', 3);
		var creatorFields = Zotero.cache.load({ target: 'creatorFields' });
		if (creatorFields) {
			log.debug('have creatorFields in localStorage', 3);
			Item.prototype.creatorFields = creatorFields;// JSON.parse(Zotero.storage.localStorage['creatorFields']);
			return Promise.resolve(creatorFields);
		}
		
		var requestUrl = Zotero.config.baseApiUrl + '/creatorFields';
		return Zotero.ajaxRequest(requestUrl, 'GET', { dataType: 'json' })
			.then(function (response) {
				log.debug('got itemTypes response', 4);
				Item.prototype.creatorFields = response.data;
				Zotero.cache.save({ target: 'creatorFields' }, response.data);
			});
	}

	// ---Functions to manually add Zotero format data instead of fetching it from the API ---
	// To be used first with cached data for offline, could also maybe be used for custom types
	/*
	addItemTypes(itemTypes, locale) {
		
	}

	addItemFields(itemType, itemFields) {
		
	}

	addCreatorTypes(itemType, creatorTypes) {
		
	}

	addCreatorFields(itemType, creatorFields) {
		
	}

	addItemTemplates(templates) {
		
	}
	*/

	itemTypeImageClass() {
		// linkModes: imported_file,imported_url,linked_file,linked_url
		if (this.apiObj.data.itemType == 'attachment') {
			switch (this.apiObj.data.linkMode) {
			case 'imported_file':
				if (this.translatedMimeType == 'pdf') {
					return this.itemTypeImageSrc.attachmentPdf;
				}
				return this.itemTypeImageSrc.attachmentFile;
			case 'imported_url':
				if (this.translatedMimeType == 'pdf') {
					return this.itemTypeImageSrc.attachmentPdf;
				}
				return this.itemTypeImageSrc.attachmentSnapshot;
			case 'linked_file':
				return this.itemTypeImageSrc.attachmentLink;
			case 'linked_url':
				return this.itemTypeImageSrc.attachmentWeblink;
			default:
				return this.itemTypeImageSrc.attachment;
			}
		} else {
			return this.apiObj.data.itemType;
		}
	}

	itemTypeIconClass() {
		// linkModes: imported_file,imported_url,linked_file,linked_url
		var defaultIcon = 'fa fa-file-text-o';
		switch (this.apiObj.data.itemType) {
		case 'attachment':
			switch (this.apiObj.data.linkMode) {
			case 'imported_file':
				if (this.translatedMimeType == 'pdf') {
					return 'fa fa-file-pdf-o';
				}
				return 'glyphicons glyphicons-file';
			case 'imported_url':
				if (this.translatedMimeType == 'pdf') {
					return 'fa fa-file-pdf-o';
				}
				return 'glyphicons glyphicons-file';
			case 'linked_file':
				return 'glyphicons glyphicons-link';
				// return this.itemTypeImageSrc['attachmentLink'];
			case 'linked_url':
				return 'glyphicons glyphicons-link';
				// return this.itemTypeImageSrc['attachmentWeblink'];
			default:
				return 'glyphicons glyphicons-paperclip';
						// return this.itemTypeImageSrc['attachment'];
			}
		case 'artwork':
			return 'glyphicons glyphicons-picture';
		case 'audioRecording':
			return 'glyphicons glyphicons-microphone';
		case 'bill':
			return defaultIcon;
		case 'blogPost':
			return 'glyphicons glyphicons-blog';
		case 'book':
			return 'glyphicons glyphicons-book';
		case 'bookSection':
			return 'glyphicons glyphicons-book-open';
		case 'case':
			return defaultIcon;
		case 'computerProgram':
			return 'glyphicons glyphicons-floppy-disk';
		case 'conferencePaper':
			return defaultIcon;
		case 'dictionaryEntry':
			return 'glyphicons glyphicons-translate';
		case 'document':
			return 'glyphicons glyphicons-file';
		case 'email':
			return 'glyphicons glyphicons-envelope';
		case 'encyclopediaArticle':
			return 'glyphicons glyphicons-bookmark';
		case 'film':
			return 'glyphicons glyphicons-film';
		case 'forumPost':
			return 'glyphicons glyphicons-bullhorn';
		case 'hearing':
			return 'fa fa-gavel';
		case 'instantMessage':
			return 'fa fa-comment-o';
		case 'interview':
			return 'fa fa-comments-o';
		case 'journalArticle':
			return 'fa fa-file-text-o';
		case 'letter':
			return 'glyphicons glyphicons-message-full';
		case 'magazineArticle':
			return defaultIcon;
		case 'manuscript':
			return 'glyphicons glyphicons-pen';
		case 'map':
			return 'glyphicons glyphicons-google-maps';
		case 'newspaperArticle':
			return 'fa fa-newspaper-o';
		case 'note':
			return 'glyphicons glyphicons-notes noteyellow';
		case 'patent':
			return 'glyphicons glyphicons-lightbulb';
		case 'podcast':
			return 'glyphicons glyphicons-ipod';
		case 'presentation':
			return 'glyphicons glyphicons-keynote';
		case 'radioBroadcast':
			return 'glyphicons glyphicons-wifi-alt';
		case 'report':
			return 'glyphicons glyphicons-notes-2';
		case 'statue':
			return 'glyphicons glyphicons-bank';
		case 'thesis':
			return 'fa fa-graduation-cap';
		case 'tvBroadcast':
			return 'glyphicons glyphicons-display';
		case 'videoRecording':
			return 'glyphicons glyphicons-facetime-video';
		case 'webpage':
			return 'glyphicons glyphicons-embed-close';
		default:
			return 'glyphicons file';
		}
	}

	get(key) {
		var itemType = this.apiObj.data.itemType;
		switch (key) {
		case 'title':
			var title = '';
			if (itemType == 'note') {
				title = this.noteTitle(this.apiObj.data.note);
			} else {
				title = this.apiObj.data.title;
			}
			if (title === '') {
				title = '[Untitled]';
			}
			return title;
		case 'creatorSummary':
		case 'creator':
			if (typeof this.apiObj.meta.creatorSummary !== 'undefined') {
				return this.apiObj.meta.creatorSummary;
			} else {
				return '';
			}
		case 'year':
			if (this.parsedDate) {
				return this.parsedDate.getFullYear();
			} else {
				return '';
			}
		}
		
		if (key in this.apiObj.data) {
			return this.apiObj.data[key];
		} else if (key in this.apiObj.meta) {
			return this.apiObj.meta[key];
		} else if (this.hasOwnProperty(key)) {
			return this[key];
		} else {
			var baseMapping = this.baseFieldMapping[itemType];
			if (baseMapping && baseMapping[key]) {
				return this.apiObj.data[baseMapping[key]];
			}
		}

		return null;
	}

	set(key, val) {
		if (key in this.apiObj) {
			this.apiObj[key] = val;
		}
		if (key in this.apiObj.data) {
			this.apiObj.data[key] = val;
		}
		if (key in this.apiObj.meta) {
			this.apiObj.meta[key] = val;
		}
		
		switch (key) {
		case 'itemKey':
		case 'key':
			this.key = val;
			this.apiObj.data.key = val;
			break;
		case 'itemVersion':
		case 'version':
			this.version = val;
			this.apiObj.data.version = val;
			break;
		case 'itemType':
			this.itemType = val;
			// TODO: translate api object to new item type
			break;
		case 'linkMode':
			break;
		case 'deleted':
			this.apiObj.data.deleted = val;
			break;
		case 'parentItem':
			if (val === '') {
				val = false;
			}
			this.apiObj.data.parentItem = val;
			break;
		}
		
		//    this.synced = false;
		return this;
	}

	static noteTitle(note) {
		var len = 120;
		var notetext = striptags(note);
		var firstNewline = notetext.indexOf('\n');
		if ((firstNewline != -1) && firstNewline < len) {
			return notetext.substr(0, firstNewline);
		} else {
			return notetext.substr(0, len);
		}
	}

	setParent(parentItemKey) {
		// pull out itemKey string if we were passed an item object
		if (typeof parentItemKey != 'string'
			&& parentItemKey.hasOwnProperty('instance')
			&& parentItemKey.instance == 'Zotero.Item') {
			parentItemKey = parentItemKey.key;
		}
		this.set('parentItem', parentItemKey);
		return this;
	}

	addToCollection(collectionKey) {
		// take out the collection key if we're passed a collection object instead
		if (typeof collectionKey != 'string') {
			if (collectionKey.instance == 'Zotero.Collection') {
				collectionKey = collectionKey.key;
			}
		}
		if (this.apiObj.data.collections.indexOf(collectionKey) === -1) {
			this.apiObj.data.collections.push(collectionKey);
		}
	}

	removeFromCollection(collectionKey) {
		// take out the collection key if we're passed a collection object instead
		if (typeof collectionKey != 'string') {
			if (collectionKey.instance == 'Zotero.Collection') {
				collectionKey = collectionKey.key;
			}
		}
		var index = this.apiObj.data.collections.indexOf(collectionKey);
		if (index != -1) {
			this.apiObj.data.collections.splice(index, 1);
		}
	}

	async uploadChildAttachment(childItem, fileInfo, progressCallback) {
		// write child item so that it exists
		// get upload authorization for actual file
		// perform full upload
		log.debug('uploadChildAttachment', 3);
		if (!this.owningLibrary) {
			throw new Error('Item must be associated with a library');
		}

		// make sure childItem has parent set
		childItem.set('parentItem', this.key);
		childItem.associateWithLibrary(this.owningLibrary);
		
		let response = await childItem.writeItem();
		// successful attachmentItemWrite
		this.numChildren++;
		if (!response.ok) {
			let serverMessage = await response.text();
			let err = new Error('Failure during attachmentItem write.');
			err.code = response.status;
			err.serverMessage = serverMessage;
			throw err;
		}
		return childItem.uploadFile(fileInfo, progressCallback);
	}

	async uploadFile(fileInfo, _progressCallback) {
		log.debug('Zotero.Item.uploadFile', 3);
		var uploadAuthFileData = {
			md5: fileInfo.md5,
			filename: this.get('title'),
			filesize: fileInfo.filesize,
			mtime: fileInfo.mtime,
			contentType: fileInfo.contentType,
			params: 1
		};
		if (fileInfo.contentType === '') {
			uploadAuthFileData.contentType = 'application/octet-stream';
		}
		let uploadAuthResponse = await this.getUploadAuthorization(uploadAuthFileData);
		log.debug('got uploadAuth', 3);
		let upAuthOb;
		if (typeof uploadAuthResponse.data == 'string') {
			upAuthOb = JSON.parse(uploadAuthResponse.data);
		} else {
			upAuthOb = uploadAuthResponse.data;
		}
		if (upAuthOb.exists == 1) {
			return { message: 'File Exists' };
		} else {
			// TODO: add progress
			let uploadResp = await Zotero.file.uploadFile(upAuthOb, fileInfo);
			if (uploadResp.isError) {
				log.error(uploadResp);
				throw new Error('Error response when uploading file');
			}
			// upload was successful: register it
			let registerResponse = await this.registerUpload(upAuthOb.uploadKey);
			if (registerResponse.isError) {
				var e = {
					message: 'Failed to register uploaded file.',
					code: registerResponse.status,
					serverMessage: registerResponse.jqxhr.responseText,
					response: registerResponse
				};
				log.error(e);
				throw e;
			} else {
				return { message: 'Upload Successful' };
			}
		}/*
			}).catch(function (response) {
				log.debug('Failure caught during upload', 3);
				log.debug(response, 3);
				throw {
					message: 'Failure during upload.',
					code: response.status,
					serverMessage: response.jqxhr.responseText,
					response: response
				};
			});
			*/
	}

	// convert a libZotero.Item to a CSL Item
	cslItem() {
		// don't return URL or accessed information for journal articles if a
		// pages field exists
		var itemType = this.get('itemType');// Zotero_ItemTypes::getName($zoteroItem->itemTypeID);
		var cslType = this.cslTypeMap.hasOwnProperty(itemType) ? this.cslTypeMap[itemType] : false;
		if (!cslType) cslType = 'article';
		var ignoreURL = ((this.get('accessDate') || this.get('url'))
				&& itemType in { journalArticle: 1, newspaperArticle: 1, magazineArticle: 1 }
				&& this.get('pages')
				&& this.citePaperJournalArticleURL);
		
		var cslItem = { type: cslType };
		if (this.owningLibrary) {
			cslItem.id = this.apiObj.library.id + '/' + this.get('key');
		} else {
			cslItem.id = Zotero.utils.getKey();
		}
		
		// get all text variables (there must be a better way)
		// TODO: does citeproc-js permit short forms?
		Object.keys(this.cslFieldMap).forEach((variable) => {
			var fields = this.cslFieldMap[variable];
			if (variable == 'URL' && ignoreURL) return;
			fields.forEach((field) => {
				var value = this.get(field);
				if (value) {
					// TODO: strip enclosing quotes? necessary when not pulling from DB?
					cslItem[variable] = value;
				}
			});
		});
		
		// separate name variables
		var creators = this.get('creators');
		creators.forEach((creator) => {
			var creatorType = creator.creatorType;// isset(self::$zoteroNameMap[$creatorType]) ? self::$zoteroNameMap[$creatorType] : false;
			if (!creatorType) return;
			
			var nameObj;
			if (creator.hasOwnProperty('name')) {
				nameObj = { literal: creator.name };
			} else {
				nameObj = { family: creator.lastName, given: creator.firstName };
			}
			
			if (cslItem.hasOwnProperty(creatorType)) {
				cslItem[creatorType].push(nameObj);
			} else {
				cslItem[creatorType] = [nameObj];
			}
		});
		
		// get date variables
		Object.keys(this.cslDateMap).forEach((key) => {
			var val = this.cslDateMap[key];
			var date = this.get(val);
			if (date) {
				cslItem[key] = { raw: date };
			}
		});
		
		return cslItem;
	}
}

Item.prototype.creatorTypes = {};

Object.keys(ItemMaps).forEach(function (key) {
	Item.prototype[key] = ItemMaps[key];
});

export { Item };
