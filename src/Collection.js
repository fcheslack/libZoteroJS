'use strict';

var log = require('./Log.js').Logger('libZotero:Collection');

module.exports = function(collectionObj){
	this.instance = 'Zotero.Collection';
	this.libraryUrlIdentifier = '';
	this.itemKeys = false;
	this.key = '';
	this.version = 0;
	this.synced = false;
	this.pristineData = null;
	this.apiObj = {
		'key': '',
		'version': 0,
		'library':{},
		'links':{},
		'meta':{},
		'data':{
			'key': '',
			'version': 0,
			'name': '',
			'parentCollection': false,
			'relations':{}
		}
	};
	this.children = [];
	this.topLevel = true;
	if(collectionObj){
		this.parseJsonCollection(collectionObj);
	}
};

module.exports.prototype = new Zotero.ApiObject();
module.exports.prototype.instance = 'Zotero.Collection';

module.exports.prototype.updateObjectKey = function(collectionKey){
	this.updateCollectionKey(collectionKey);
};

module.exports.prototype.updateCollectionKey = function(collectionKey){
	var collection = this;
	collection.key = collectionKey;
	collection.apiObj.key = collectionKey;
	collection.apiObj.data.key = collectionKey;
	return collection;
};

module.exports.prototype.parseJsonCollection = function(apiObj) {
	log.debug('parseJsonCollection', 4);
	var collection = this;
	collection.key = apiObj.key;
	collection.version = apiObj.version;
	collection.apiObj = Z.extend({}, apiObj);
	collection.pristineData = Z.extend({}, apiObj.data);

	collection.parentCollection = false;
	collection.topLevel = true;
	collection.synced = true;
	collection.initSecondaryData();
};

module.exports.prototype.initSecondaryData = function() {
	var collection = this;
	
	if(collection.apiObj.data['parentCollection']){
		collection.topLevel = false;
	} else {
		collection.topLevel = true;
	}
	
	if(Zotero.config.librarySettings.libraryPathString){
		collection.websiteCollectionLink = Zotero.config.librarySettings.libraryPathString + 
		'/collectionKey/' + collection.apiObj.key;
	}
	else {
		collection.websiteCollectionLink = '';
	}
	collection.hasChildren = (collection.apiObj.meta.numCollections) ? true : false;
	
};

module.exports.prototype.nestCollection = function(collectionsObject) {
	log.debug('Zotero.Collection.nestCollection', 4);
	var collection = this;
	var parentCollectionKey = collection.get('parentCollection');
	if(parentCollectionKey !== false){
		if(collectionsObject.hasOwnProperty(parentCollectionKey)) {
			var parentOb = collectionsObject[parentCollectionKey];
			parentOb.children.push(collection);
			parentOb.hasChildren = true;
			collection.topLevel = false;
			return true;
		}
	}
	return false;
};

module.exports.prototype.addItems = function(itemKeys){
	log.debug('Zotero.Collection.addItems', 3);
	var collection = this;
	var config = {
		'target':'items',
		'libraryType':collection.apiObj.library.type,
		'libraryID':collection.apiObj.library.id,
		'collectionKey':collection.key
	};
	var requestData = itemKeys.join(' ');
	
	return this.owningLibrary.ajaxRequest(config, 'POST', {
		data: requestData
	});
};

module.exports.prototype.getMemberItemKeys = function(){
	log.debug('Zotero.Collection.getMemberItemKeys', 3);
	var collection = this;
	var config = {
		'target':'items',
		'libraryType':collection.apiObj.library.type,
		'libraryID':collection.apiObj.library.id,
		'collectionKey':collection.key,
		'format':'keys'
	};

	return new Promise((resolve, reject) => {
		this.owningLibrary.ajaxRequest(
			config,
			'GET',
			{ processData: false }
		).then(response => {
			log.debug('getMemberItemKeys callback', 3);
			response.text().then(keys => {
				keys = keys.trim().split(/[\s]+/);
				collection.itemKeys = keys;
				resolve(keys);
			}).catch(reject);
		}).catch(reject)
	});
};

module.exports.prototype.removeItem = function(itemKey){
	var collection = this;
	var config = {
		'target':'item',
		'libraryType':collection.apiObj.library.type,
		'libraryID':collection.apiObj.library.id,
		'collectionKey':collection.key,
		'itemKey':itemKey
	};
	return this.owningLibrary.ajaxRequest(config, 'DELETE', {
		processData: false,
		cache:false
	});
};

module.exports.prototype.update = function(name, parentKey){
	var collection = this;
	if(!parentKey) parentKey = false;
	var config = {
		'target':'collection',
		'libraryType':collection.apiObj.library.type,
		'libraryID':collection.apiObj.library.id,
		'collectionKey':collection.key
	};
	
	collection.set('name', name);
	collection.set('parentCollection', parentKey);
	
	var writeObject = collection.writeApiObj();
	var requestData = JSON.stringify(writeObject);
	
	return this.owningLibrary.ajaxRequest(config, 'PUT', {
		data: requestData,
		processData: false,
		headers:{
			'If-Unmodified-Since-Version': collection.version
		},
		cache:false
	});
};

module.exports.prototype.writeApiObj = function(){
	var collection = this;
	var writeObj = Z.extend({}, collection.pristineData, collection.apiObj.data);
	return writeObj;
};

module.exports.prototype.remove = function(){
	log.debug('Zotero.Collection.delete', 3);
	var collection = this;
	var owningLibrary = collection.owningLibrary;
	var config = {
		'target':'collection',
		'libraryType':collection.apiObj.library.type,
		'libraryID':collection.apiObj.library.id,
		'collectionKey':collection.key
	};
	
	return this.owningLibrary.ajaxRequest(config, 'DELETE', {
		processData: false,
		headers:{
			'If-Unmodified-Since-Version': collection.version
		},
		cache:false
	}).then(function(){
		log.debug('done deleting collection. remove local copy.', 3);
		owningLibrary.collections.removeLocalCollection(collection.key);
		owningLibrary.trigger('libraryCollectionsUpdated');
	});
};

module.exports.prototype.get = function(key){
	var collection = this;
	switch(key) {
		case 'title':
		case 'name':
			return collection.apiObj.data.name;
		case 'collectionKey':
		case 'key':
			return collection.apiObj.key || collection.key;
		case 'collectionVersion':
		case 'version':
			return collection.apiObj.version;
		case 'parentCollection':
			return collection.apiObj.data.parentCollection;
	}
	
	if(key in collection.apiObj.data){
		return collection.apiObj.data[key];
	}
	else if(collection.apiObj.meta.hasOwnProperty(key)){
		return collection.apiObj.meta[key];
	}
	else if(collection.hasOwnProperty(key)){
		return collection[key];
	}
	
	return null;
};
/*
 module.exports.prototype.get = function(key){
	var collection = this;
	switch(key) {
		case 'title':
		case 'name':
			return collection.apiObj.data['name'];
		case 'collectionKey':
		case 'key':
			return collection.apiObj.key;
		case 'parentCollection':
			return collection.apiObj.data['parentCollection'];
		case 'collectionVersion':
		case 'version':
			return collection.apiObj.version;
	}
	
	if(key in collection.apiObj.data){
		return collection.apiObj.data[key];
	}
	else if(key in collection.apiObj.meta){
		return collection.apiObj.meta[key];
	}
	else if(collection.hasOwnProperty(key)){
		return collection[key];
	}
	
	return null;
};
*/

module.exports.prototype.set = function(key, val){
	var collection = this;
	if(key in collection.apiObj.data){
		collection.apiObj.data[key] = val;
	}
	switch(key){
		case 'title':
		case 'name':
			collection.apiObj.data['name'] = val;
		break;
		case 'collectionKey':
		case 'key':
			collection.key = val;
			collection.apiObj.key = val;
			collection.apiObj.data.key = val;
		break;
		case 'parentCollection':
			collection.apiObj.data['parentCollection'] = val;
		break;
		case 'collectionVersion':
		case 'version':
			collection.version = val;
			collection.apiObj.version = val;
			collection.apiObj.data.version = val;
		break;
	}
	
	if(collection.hasOwnProperty(key)) {
		collection[key] = val;
	}
};
