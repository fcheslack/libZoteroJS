'use strict';

var log = require('./Log.js').Logger('libZotero:Item');

var striptags = require('striptags');
var ItemMaps = require('./ItemMaps.js');

/*
 * TODO: several functions should not work unless we build a fresh item with a template
 * or parsed an item from the api with json content (things that depend on apiObj)
 * There should be a flag to note whether this is the case and throwing on attempts to
 * use these functions when it is not.
 */
var Item = function(itemObj){
	this.instance = 'Zotero.Item';
	this.version = 0;
	this.key = '';
	this.synced = false;
	this.apiObj = {};
	this.pristineData = null;
	this.childItemKeys = [];
	this.writeErrors = [];
	this.notes = [];
	if(itemObj){
		this.parseJsonItem(itemObj);
	} else {
		this.parseJsonItem(this.emptyJsonItem());
	}
	this.initSecondaryData();
};

Item.prototype = new Zotero.ApiObject();

Item.prototype.parseJsonItem = function (apiObj) {
	var item = this;
	item.version = apiObj.version;
	item.key = apiObj.key;
	item.apiObj = Z.extend({}, apiObj);
	item.pristineData = Z.extend({}, apiObj.data);
	if(!item.apiObj._supplement){
		item.apiObj._supplement = {};
	}
};

Item.prototype.emptyJsonItem = function(){
	return {
		key: '',
		version: 0,
		library:{},
		links:{},
		data: {
			key:'',
			version:0,
			title:'',
			creators:[],
			collections:[],
			tags:[],
			relations:{}
		},
		meta: {},
		_supplement: {}
	};
};

//populate property values derived from json content
Item.prototype.initSecondaryData = function(){
	var item = this;
	
	item.version = item.apiObj.version;
	
	if(item.apiObj.data.itemType == 'attachment'){
		item.mimeType = item.apiObj.data.contentType;
		item.translatedMimeType = Zotero.utils.translateMimeType(item.mimeType);
	}
	if('linkMode' in item.apiObj){
		item.linkMode = item.apiObj.data.linkMode;
	}
	
	item.attachmentDownloadUrl = Zotero.url.attachmentDownloadUrl(item);
	
	if(item.apiObj.meta.parsedDate){
		item.parsedDate = new Date(item.apiObj.meta.parsedDate);
	} else {
		item.parsedDate = false;
	}
	
	item.synced = false;

	item.updateTagStrings();
};

Item.prototype.updateTagStrings = function(){
	var item = this;
	var tagstrings = [];
	for (var i = 0; i < item.apiObj.data.tags.length; i++) {
		tagstrings.push(item.apiObj.data.tags[i].tag);
	}
	item.apiObj._supplement.tagstrings = tagstrings;
};

Item.prototype.initEmpty = function(itemType, linkMode){
	var item = this;
	return item.getItemTemplate(itemType, linkMode)
	.then(function(template){
		item.initEmptyFromTemplate(template);
		return item;
	});
};

//special case note initialization to guarentee synchronous and simplify some uses
Item.prototype.initEmptyNote = function(){
	var item = this;
	item.version = 0;
	var noteTemplate = {'itemType':'note','note':'','tags':[],'collections':[],'relations':{}};
	
	item.initEmptyFromTemplate(noteTemplate);
	
	return item;
};

Item.prototype.initEmptyFromTemplate = function(template){
	var item = this;
	item.version = 0;
	
	item.key = '';
	item.pristineData = Z.extend({}, template);
	item.apiObj = {
		key: '',
		version: 0,
		library: {},
		links: {},
		data: template,
		meta: {},
		_supplement: {}
	};
	
	item.initSecondaryData();
	return item;
};

Item.prototype.isSupplementaryItem = function(){
	var item = this;
	var itemType = item.get('itemType');
	if(itemType == 'attachment' || itemType == 'note'){
		return true;
	}
	return false;
};

Item.prototype.isSnapshot = function(){
	var item = this;
	if(item.apiObj.links['enclosure']){
		var ftype = item.apiObj.links['enclosure'].type;
		if(!item.apiObj.links['enclosure']['length'] && ftype == 'text/html'){
			return true;
		}
	}
	return false;
};

Item.prototype.updateObjectKey = function(objectKey){
	return this.updateItemKey(objectKey);
};

Item.prototype.updateItemKey = function(itemKey){
	var item = this;
	item.key = itemKey;
	item.apiObj.key = itemKey;
	item.apiObj.data.key = itemKey;
	item.pristineData.key = itemKey;
	return item;
};

/*
 * Write updated information for the item to the api and potentiallyp
 * create new child notes (or attachments?) of this item
 */
Item.prototype.writeItem = function(){
	var item = this;
	if(!item.owningLibrary){
		throw new Error('Item must be associated with a library');
	}
	return item.owningLibrary.items.writeItems([item]);
};

//get the JS object to be PUT/POSTed for write
Item.prototype.writeApiObj = function(){
	var item = this;
	
	//remove any creators that have no names
	if(item.apiObj.data.creators){
		var newCreatorsArray = item.apiObj.data.creators.filter(function(c){
			if(c.name || c.firstName || c.lastName){
				return true;
			}
			return false;
		});
		item.apiObj.data.creators = newCreatorsArray;
	}
	
	//copy apiObj, extend with pristine to make sure required fields are present
	//and remove unwriteable fields(?)
	var writeApiObj = Z.extend({}, item.pristineData, item.apiObj.data);
	return writeApiObj;
};

Item.prototype.createChildNotes = function(notes){
	var item = this;
	var childItems = [];
	var childItemPromises = [];
	
	notes.forEach(function(note){
		var childItem = new Item();
		var p = childItem.initEmpty('note')
		.then(function(noteItem){
			noteItem.set('note', note.note);
			noteItem.set('parentItem', item.key);
			childItems.push(noteItem);
		});
		childItemPromises.push(p);
	});
	
	return Promise.all(childItemPromises)
	.then(function(){
		return item.owningLibrary.writeItems(childItems);
	});
};

//TODO: implement
Item.prototype.writePatch = function(){
	
};

Item.prototype.getChildren = function(library){
	log.debug('Zotero.Item.getChildren', 4);
	var item = this;
	return Promise.resolve()
	.then(function(){
		//short circuit if has item has no children
		if(!item.apiObj.meta.numChildren){
			return [];
		}
		
		var config = {
			url: {
				'target':'children',
				'libraryType':item.apiObj.library.type,
				'libraryID':item.apiObj.library.id,
				'itemKey':item.key
			}
		};
		
		return item.owningLibrary.ajaxRequest(config.url)
		.then(function(response){
			log.debug('getChildren proxied callback', 4);
			var items = library.items;
			var childItems = items.addItemsFromJson(response.data);
			for (var i = childItems.length - 1; i >= 0; i--) {
				childItems[i].associateWithLibrary(library);
			}
			
			return childItems;
		});
	});
};

Item.prototype.getItemTypes = function (locale) {
	log.debug('Zotero.Item.prototype.getItemTypes', 3);
	if(!locale){
		locale = 'en-US';
	}
	locale = 'en-US';

	var itemTypes = Zotero.cache.load({locale:locale, target:'itemTypes'});
	if(itemTypes){
		log.debug('have itemTypes in localStorage', 3);
		Item.prototype.itemTypes = itemTypes;//JSON.parse(Zotero.storage.localStorage['itemTypes']);
		return;
	}
	
	var query = Zotero.ajax.apiQueryString({locale:locale});
	var url = Zotero.config.baseApiUrl + '/itemTypes' + query;
	Zotero.net.ajax({
		url: Zotero.ajax.proxyWrapper(url, 'GET'),
		type: 'GET'
	}).then(function(xhr){
		log.debug('got itemTypes response', 3);
		log.debug(xhr.response, 4);
		Item.prototype.itemTypes = JSON.parse(xhr.responseText);
		Zotero.cache.save({locale:locale, target:'itemTypes'}, Item.prototype.itemTypes);
	});
};

Item.prototype.getItemFields = function (locale) {
	log.debug('Zotero.Item.prototype.getItemFields', 3);
	if(!locale){
		locale = 'en-US';
	}
	locale = 'en-US';
	
	var itemFields = Zotero.cache.load({locale:locale, target:'itemFields'});
	if(itemFields){
		log.debug('have itemFields in localStorage', 3);
		Item.prototype.itemFields = itemFields;//JSON.parse(Zotero.storage.localStorage['itemFields']);
		Object.keys(Item.prototype.itemFields).forEach(function(key){
			var val = Item.prototype.itemFields[key];
			Zotero.localizations.fieldMap[val.field] = val.localized;
		});
		return;
	}
	
	var query = Zotero.ajax.apiQueryString({locale:locale});
	var requestUrl = Zotero.config.baseApiUrl + '/itemFields' + query;
	Zotero.net.ajax({
		url: Zotero.ajax.proxyWrapper(requestUrl),
		type: 'GET'
	}).then(function(xhr){
		log.debug('got itemTypes response', 4);
		var data = JSON.parse(xhr.responseText);
		Item.prototype.itemFields = data;
		Zotero.cache.save({locale:locale, target:'itemFields'}, data);
		//Zotero.storage.localStorage['itemFields'] = JSON.stringify(data);
		Object.keys(Item.prototype.itemFields).forEach(function(key){
			var val = Item.prototype.itemFields[key];
			Zotero.localizations.fieldMap[val.field] = val.localized;
		});
	});
};

Item.prototype.getItemTemplate = function (itemType='document', linkMode='') {
	log.debug('Zotero.Item.prototype.getItemTemplate', 3);
	if(itemType == 'attachment' && linkMode == ''){
		throw new Error('attachment template requested with no linkMode');
	}
	
	var query = Zotero.ajax.apiQueryString({itemType:itemType, linkMode:linkMode});
	var requestUrl = Zotero.config.baseApiUrl + '/items/new' + query;
	
	var cacheConfig = {itemType:itemType, target:'itemTemplate'};
	var itemTemplate = Zotero.cache.load(cacheConfig);
	if(itemTemplate){
		log.debug('have itemTemplate in localStorage', 3);
		var template = itemTemplate;// JSON.parse(Zotero.storage.localStorage[url]);
		return Promise.resolve(template);
	}
	
	return Zotero.ajaxRequest(requestUrl, 'GET', {dataType:'json'})
	.then(function(response){
		log.debug('got itemTemplate response', 3);
		Zotero.cache.save(cacheConfig, response.data);
		return response.data;
	});
};

Item.prototype.getUploadAuthorization = function(fileinfo){
	//fileInfo: md5, filename, filesize, mtime, zip, contentType, charset
	log.debug('Zotero.Item.getUploadAuthorization', 3);
	var item = this;
	
	var config = {
		'target':'item',
		'targetModifier':'file',
		'libraryType':item.owningLibrary.type,
		'libraryID':item.owningLibrary.libraryID,
		'itemKey':item.key
	};
	var headers = {
		'Content-Type': 'application/x-www-form-urlencoded'
	};
	var oldmd5 = item.get('md5');
	if(oldmd5){
		headers['If-Match'] = oldmd5;
	}
	else{
		headers['If-None-Match'] = '*';
	}
	
	return Zotero.ajaxRequest(config, 'POST',
		{
			processData: true,
			data:fileinfo,
			headers:headers
		}
	);
};

Item.prototype.registerUpload = function(uploadKey){
	log.debug('Zotero.Item.registerUpload', 3);
	var item = this;
	var config = {
		'target':'item',
		'targetModifier':'file',
		'libraryType':item.owningLibrary.type,
		'libraryID':item.owningLibrary.libraryID,
		'itemKey':item.key
	};
	var headers = {
		'Content-Type': 'application/x-www-form-urlencoded'
	};
	var oldmd5 = item.get('md5');
	if(oldmd5){
		headers['If-Match'] = oldmd5;
	}
	else{
		headers['If-None-Match'] = '*';
	}
	
	return Zotero.ajaxRequest(config, 'POST',
	{
		processData: true,
		data:{upload: uploadKey},
		headers: headers
	});
};

Item.prototype.fullUpload = function(file){

};

Item.prototype.creatorTypes = {};

Item.prototype.getCreatorTypes = function (itemType) {
	log.debug('Zotero.Item.prototype.getCreatorTypes: ' + itemType, 3);
	if(!itemType){
		itemType = 'document';
	}
	
	//parse stored creatorTypes object if it exists
	//creatorTypes maps itemType to the possible creatorTypes
	var creatorTypes = Zotero.cache.load({target:'creatorTypes'});
	if(creatorTypes){
		log.debug('have creatorTypes in localStorage', 3);
		Item.prototype.creatorTypes = creatorTypes;//JSON.parse(Zotero.storage.localStorage['creatorTypes']);
	}
	
	if(Item.prototype.creatorTypes[itemType]){
		log.debug('creatorTypes of requested itemType available in localStorage', 3);
		log.debug(Item.prototype.creatorTypes, 4);
		return Promise.resolve(Item.prototype.creatorTypes[itemType]);
	}
	else{
		log.debug('sending request for creatorTypes', 3);
		var query = Zotero.ajax.apiQueryString({itemType:itemType});
		//TODO: this probably shouldn't be using baseApiUrl directly
		var requestUrl = Zotero.config.baseApiUrl + '/itemTypeCreatorTypes' + query;
		
		return Zotero.ajaxRequest(requestUrl, 'GET', {dataType:'json'})
		.then(function(response){
			log.debug('got creatorTypes response', 4);
			Item.prototype.creatorTypes[itemType] = response.data;
			//Zotero.storage.localStorage['creatorTypes'] = JSON.stringify(Item.prototype.creatorTypes);
			Zotero.cache.save({target:'creatorTypes'}, Item.prototype.creatorTypes);
			return Item.prototype.creatorTypes[itemType];
		});
	}
};

Item.prototype.getCreatorFields = function (locale) {
	log.debug('Zotero.Item.prototype.getCreatorFields', 3);
	var creatorFields = Zotero.cache.load({target:'creatorFields'});
	if(creatorFields){
		log.debug('have creatorFields in localStorage', 3);
		Item.prototype.creatorFields = creatorFields;// JSON.parse(Zotero.storage.localStorage['creatorFields']);
		return Promise.resolve(creatorFields);
	}
	
	var requestUrl = Zotero.config.baseApiUrl + '/creatorFields';
	return Zotero.ajaxRequest(requestUrl, 'GET', {dataType:'json'})
	.then(function(response){
		log.debug('got itemTypes response', 4);
		Item.prototype.creatorFields = response.data;
		Zotero.cache.save({target:'creatorFields'}, response.data);
	});
};

//---Functions to manually add Zotero format data instead of fetching it from the API ---
//To be used first with cached data for offline, could also maybe be used for custom types
Item.prototype.addItemTypes = function(itemTypes, locale){
	
};

Item.prototype.addItemFields = function(itemType, itemFields){
	
};

Item.prototype.addCreatorTypes = function(itemType, creatorTypes){
	
};

Item.prototype.addCreatorFields = function(itemType, creatorFields){
	
};

Item.prototype.addItemTemplates = function(templates){
	
};

Item.prototype.itemTypeImageClass = function(){
	//linkModes: imported_file,imported_url,linked_file,linked_url
	var item = this;
	if(item.apiObj.data.itemType == 'attachment'){
		switch(item.apiObj.data.linkMode){
			case 'imported_file':
				if(item.translatedMimeType == 'pdf'){
					return item.itemTypeImageSrc['attachmentPdf'];
				}
				return item.itemTypeImageSrc['attachmentFile'];
			case 'imported_url':
				if(item.translatedMimeType == 'pdf'){
					return item.itemTypeImageSrc['attachmentPdf'];
				}
				return item.itemTypeImageSrc['attachmentSnapshot'];
			case 'linked_file':
				return item.itemTypeImageSrc['attachmentLink'];
			case 'linked_url':
				return item.itemTypeImageSrc['attachmentWeblink'];
			default:
				return item.itemTypeImageSrc['attachment'];
		}
	}
	else {
		return item.apiObj.data.itemType;
	}
};

Item.prototype.itemTypeIconClass = function(){
	//linkModes: imported_file,imported_url,linked_file,linked_url
	var item = this;
	var defaultIcon = 'fa fa-file-text-o';
	switch(item.apiObj.data.itemType){
		case 'attachment':
			switch(item.apiObj.data.linkMode){
				case 'imported_file':
					if(item.translatedMimeType == 'pdf'){
						return 'fa fa-file-pdf-o';
					}
					return 'glyphicons glyphicons-file';
				case 'imported_url':
					if(item.translatedMimeType == 'pdf'){
						return 'fa fa-file-pdf-o';
					}
					return 'glyphicons glyphicons-file';
				case 'linked_file':
					return 'glyphicons glyphicons-link';
					//return item.itemTypeImageSrc['attachmentLink'];
				case 'linked_url':
					return 'glyphicons glyphicons-link';
					//return item.itemTypeImageSrc['attachmentWeblink'];
				default:
					return 'glyphicons glyphicons-paperclip';
					//return item.itemTypeImageSrc['attachment'];
			}
			return 'glyphicons file';
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
};

Item.prototype.get = function(key){
	var item = this;
	switch(key) {
		case 'title':
			var title = '';
			if(item.apiObj.data.itemType == 'note'){
				return item.noteTitle(item.apiObj.data.note);
			} else {
				return item.apiObj.data.title;
			}
			if(title === ''){
				return '[Untitled]';
			}
			return title;
		case 'creatorSummary':
		case 'creator':
			if(typeof item.apiObj.meta.creatorSummary !== 'undefined'){
				return item.apiObj.meta.creatorSummary;
			}
			else {
				return '';
			}
			break;
		case 'year':
			if(item.parsedDate) {
				return item.parsedDate.getFullYear();
			}
			else {
				return '';
			}
	}
	
	if(key in item.apiObj.data){
		return item.apiObj.data[key];
	}
	else if(key in item.apiObj.meta){
		return item.apiObj.meta[key];
	}
	else if(item.hasOwnProperty(key)){
		return item[key];
	}
	
	return null;
};

Item.prototype.set = function(key, val){
	var item = this;
	if(key in item.apiObj){
		item.apiObj[key] = val;
	}
	if(key in item.apiObj.data){
		item.apiObj.data[key] = val;
	}
	if(key in item.apiObj.meta){
		item.apiObj.meta[key] = val;
	}
	
	switch (key) {
		case 'itemKey':
		case 'key':
			item.key = val;
			item.apiObj.data.key = val;
			break;
		case 'itemVersion':
		case 'version':
			item.version = val;
			item.apiObj.data.version = val;
			break;
		case 'itemType':
			item.itemType = val;
			//TODO: translate api object to new item type
			break;
		case 'linkMode':
			break;
		case 'deleted':
			item.apiObj.data.deleted = val;
			break;
		case 'parentItem':
			if( val === '' ){ val = false; }
			item.apiObj.data.parentItem = val;
			break;
	}
	
//    item.synced = false;
	return item;
};

Item.prototype.noteTitle = function(note){
	var len = 120;
	var notetext = striptags(note);
	var firstNewline = notetext.indexOf('\n');
	if((firstNewline != -1) && firstNewline < len){
		return notetext.substr(0, firstNewline);
	}
	else {
		return notetext.substr(0, len);
	}
};

Item.prototype.setParent = function(parentItemKey){
	var item = this;
	//pull out itemKey string if we were passed an item object
	if(typeof parentItemKey != 'string' &&
		parentItemKey.hasOwnProperty('instance') &&
		parentItemKey.instance == 'Zotero.Item'){
		parentItemKey = parentItemKey.key;
	}
	item.set('parentItem', parentItemKey);
	return item;
};

Item.prototype.addToCollection = function(collectionKey){
	var item = this;
	//take out the collection key if we're passed a collection object instead
	if(typeof collectionKey != 'string'){
		if(collectionKey.instance == 'Zotero.Collection'){
			collectionKey = collectionKey.key;
		}
	}
	if(item.apiObj.data.collections.indexOf(collectionKey) === -1){
		item.apiObj.data.collections.push(collectionKey);
	}
	return;
};

Item.prototype.removeFromCollection = function(collectionKey){
	var item = this;
	//take out the collection key if we're passed a collection object instead
	if(typeof collectionKey != 'string'){
		if(collectionKey.instance == 'Zotero.Collection'){
			collectionKey = collectionKey.key;
		}
	}
	var index = item.apiObj.data.collections.indexOf(collectionKey);
	if(index != -1){
		item.apiObj.data.collections.splice(index, 1);
	}
	return;
};

Item.prototype.uploadChildAttachment = function(childItem, fileInfo, progressCallback){
	/*
	 * write child item so that it exists
	 * get upload authorization for actual file
	 * perform full upload
	 */
	var item = this;
	log.debug('uploadChildAttachment', 3);
	if(!item.owningLibrary){
		return Promise.reject(new Error('Item must be associated with a library'));
	}

	//make sure childItem has parent set
	childItem.set('parentItem', item.key);
	childItem.associateWithLibrary(item.owningLibrary);
	
	return childItem.writeItem()
	.then(function(response){
		//successful attachmentItemWrite
		item.numChildren++;
		return childItem.uploadFile(fileInfo, progressCallback);
	}, function(response){
		//failure during attachmentItem write
		throw {
			'message':'Failure during attachmentItem write.',
			'code': response.status,
			'serverMessage': response.jqxhr.responseText,
			'response': response
		};
	});
};

Item.prototype.uploadFile = function(fileInfo, progressCallback){
	var item = this;
	log.debug('Zotero.Item.uploadFile', 3);
	var uploadAuthFileData = {
		md5:fileInfo.md5,
		filename: item.get('title'),
		filesize: fileInfo.filesize,
		mtime:fileInfo.mtime,
		contentType:fileInfo.contentType,
		params:1
	};
	if(fileInfo.contentType === ''){
		uploadAuthFileData.contentType = 'application/octet-stream';
	}
	return item.getUploadAuthorization(uploadAuthFileData)
	.then(function(response){
		log.debug('uploadAuth callback', 3);
		var upAuthOb;
		if(typeof response.data == 'string'){upAuthOb = JSON.parse(response.data);}
		else{upAuthOb = response.data;}
		if(upAuthOb.exists == 1){
			return {'message':'File Exists'};
		}
		else{
			//TODO: add progress
			return Zotero.file.uploadFile(upAuthOb, fileInfo)
			.then(function(){
				//upload was successful: register it
				return item.registerUpload(upAuthOb.uploadKey)
				.then(function(response){
					if(response.isError){
						var e = {
							'message':'Failed to register uploaded file.',
							'code': response.status,
							'serverMessage': response.jqxhr.responseText,
							'response': response
						};
						log.error(e);
						throw e;
					} else {
						return {'message': 'Upload Successful'};
					}
				});
			});
		}
	}).catch(function(response){
		log.debug('Failure caught during upload', 3);
		log.debug(response, 3);
		throw {
			'message':'Failure during upload.',
			'code': response.status,
			'serverMessage': response.jqxhr.responseText,
			'response': response
		};
	});
};

Item.prototype.cslItem = function(){
	var zoteroItem = this;
	
	// don't return URL or accessed information for journal articles if a
	// pages field exists
	var itemType = zoteroItem.get('itemType');//Zotero_ItemTypes::getName($zoteroItem->itemTypeID);
	var cslType = zoteroItem.cslTypeMap.hasOwnProperty(itemType) ? zoteroItem.cslTypeMap[itemType] : false;
	if (!cslType) cslType = 'article';
	var ignoreURL = ((zoteroItem.get('accessDate') || zoteroItem.get('url')) &&
			itemType in {'journalArticle':1, 'newspaperArticle':1, 'magazineArticle':1} &&
			zoteroItem.get('pages') &&
			zoteroItem.citePaperJournalArticleURL);
	
	var cslItem = {'type': cslType};
	if(zoteroItem.owningLibrary){
		cslItem['id'] = zoteroItem.apiObj.library.id + '/' + zoteroItem.get('key');
	} else {
		cslItem['id'] = Zotero.utils.getKey();
	}
	
	// get all text variables (there must be a better way)
	// TODO: does citeproc-js permit short forms?
	Object.keys(zoteroItem.cslFieldMap).forEach(function(variable){
		var fields = zoteroItem.cslFieldMap[variable];
		if (variable == 'URL' && ignoreURL) return;
		fields.forEach(function(field){
			var value = zoteroItem.get(field);
			if(value){
				//TODO: strip enclosing quotes? necessary when not pulling from DB?
				cslItem[variable] = value;
			}
		});
	});
	
	// separate name variables
	var creators = zoteroItem.get('creators');
	creators.forEach(function(creator){
		var creatorType = creator['creatorType'];// isset(self::$zoteroNameMap[$creatorType]) ? self::$zoteroNameMap[$creatorType] : false;
		if (!creatorType) return;
		
		var nameObj;
		if(creator.hasOwnProperty('name')){
			nameObj = {'literal': creator['name']};
		}
		else {
			nameObj = {'family': creator['lastName'], 'given': creator['firstName']};
		}
		
		if (cslItem.hasOwnProperty(creatorType)) {
			cslItem[creatorType].push(nameObj);
		}
		else {
			cslItem[creatorType] = [nameObj];
		}
	});
	
	// get date variables
	Object.keys(zoteroItem.cslDateMap).forEach(function(key){
		var val = zoteroItem.cslDateMap[key];
		var date = zoteroItem.get(val);
		if (date) {
			cslItem[key] = {'raw': date};
		}
	});
	
	return cslItem;
};

Object.keys(ItemMaps).forEach(function(key) {
	Item.prototype[key] = ItemMaps[key];
});

module.exports = Item;
