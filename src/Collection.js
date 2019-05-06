

var log = require('./Log.js').Logger('libZotero:Collection');
import { ApiObject } from './ApiObject.js';

class Collection extends ApiObject {
	constructor(collectionObj) {
		super(collectionObj);
		this.instance = 'Zotero.Collection';
		this.libraryUrlIdentifier = '';
		this.itemKeys = false;
		this.key = '';
		this.version = 0;
		this.synced = false;
		this.pristineData = null;
		this.apiObj = {
			key: '',
			version: 0,
			library: {},
			links: {},
			meta: {},
			data: {
				key: '',
				version: 0,
				name: '',
				parentCollection: false,
				relations: {}
			}
		};
		this.children = [];
		this.topLevel = true;
		if (collectionObj) {
			this.parseJsonCollection(collectionObj);
		}
	}

	updateObjectKey = (collectionKey) => {
		this.updateCollectionKey(collectionKey);
	}

	updateCollectionKey = (collectionKey) => {
		this.key = collectionKey;
		this.apiObj.key = collectionKey;
		this.apiObj.data.key = collectionKey;
		return this;
	}

	parseJsonCollection = (apiObj) => {
		log.debug('parseJsonCollection', 4);
		this.key = apiObj.key;
		this.version = apiObj.version;
		this.apiObj = Object.assign({}, apiObj);
		this.pristineData = Object.assign({}, apiObj.data);

		this.parentCollection = false;
		this.topLevel = true;
		this.synced = true;
		this.initSecondaryData();
	}

	initSecondaryData = () => {
		if (this.apiObj.data.parentCollection) {
			this.topLevel = false;
		} else {
			this.topLevel = true;
		}
		
		if (Zotero.config.librarySettings.libraryPathString) {
			this.websiteCollectionLink = Zotero.config.librarySettings.libraryPathString
			+ '/collectionKey/' + this.apiObj.key;
		} else {
			this.websiteCollectionLink = '';
		}
		this.hasChildren = !!(this.apiObj.meta.numCollections);
	}

	nestCollection = (collectionsObject) => {
		log.debug('Zotero.Collection.nestCollection', 4);
		var parentCollectionKey = this.get('parentCollection');
		if (parentCollectionKey !== false) {
			if (collectionsObject.hasOwnProperty(parentCollectionKey)) {
				var parentOb = collectionsObject[parentCollectionKey];
				parentOb.children.push(this);
				parentOb.hasChildren = true;
				this.topLevel = false;
				return true;
			}
		}
		return false;
	}

	addItems = (itemKeys) => {
		log.debug('Zotero.Collection.addItems', 3);
		var config = {
			target: 'items',
			libraryType: this.apiObj.library.type,
			libraryID: this.apiObj.library.id,
			collectionKey: this.key
		};
		var requestData = itemKeys.join(' ');
		
		return this.owningLibrary.ajaxRequest(config, 'POST', {
			data: requestData
		});
	}

	getMemberItemKeys = () => {
		log.debug('Zotero.Collection.getMemberItemKeys', 3);
		var config = {
			target: 'items',
			libraryType: this.apiObj.library.type,
			libraryID: this.apiObj.library.id,
			collectionKey: this.key,
			format: 'keys'
		};

		return new Promise((resolve, reject) => {
			this.owningLibrary.ajaxRequest(
				config,
				'GET',
				{ processData: false }
			).then((response) => {
				log.debug('getMemberItemKeys callback', 3);
				response.text().then((keys) => {
					keys = keys.trim().split(/[\s]+/);
					this.itemKeys = keys;
					resolve(keys);
				}).catch(reject);
			}).catch(reject);
		});
	}

	removeItem = (itemKey) => {
		var config = {
			target: 'item',
			libraryType: this.apiObj.library.type,
			libraryID: this.apiObj.library.id,
			collectionKey: this.key,
			itemKey: itemKey
		};
		return this.owningLibrary.ajaxRequest(config, 'DELETE', {
			processData: false,
			cache: false
		});
	}

	update = (name, parentKey) => {
		if (!parentKey) parentKey = false;
		var config = {
			target: 'collection',
			libraryType: this.apiObj.library.type,
			libraryID: this.apiObj.library.id,
			collectionKey: this.key
		};
		
		this.set('name', name);
		this.set('parentCollection', parentKey);
		
		var writeObject = this.writeApiObj();
		var requestData = JSON.stringify(writeObject);
		
		return this.owningLibrary.ajaxRequest(config, 'PUT', {
			data: requestData,
			processData: false,
			headers: {
				'If-Unmodified-Since-Version': this.version
			},
			cache: false
		});
	}

	writeApiObj = () => {
		var writeObj = Object.assign({}, this.pristineData, this.apiObj.data);
		return writeObj;
	}

	remove = () => {
		log.debug('Zotero.Collection.delete', 3);
		var owningLibrary = this.owningLibrary;
		var config = {
			target: 'collection',
			libraryType: this.apiObj.library.type,
			libraryID: this.apiObj.library.id,
			collectionKey: this.key
		};
		
		return this.owningLibrary.ajaxRequest(config, 'DELETE', {
			processData: false,
			headers: {
				'If-Unmodified-Since-Version': this.version
			},
			cache: false
		}).then(function () {
			log.debug('done deleting collection. remove local copy.', 3);
			owningLibrary.collections.removeLocalCollection(this.key);
			owningLibrary.trigger('libraryCollectionsUpdated');
		});
	}

	get = (key) => {
		switch (key) {
		case 'title':
		case 'name':
			return this.apiObj.data.name;
		case 'collectionKey':
		case 'key':
			return this.apiObj.key || this.key;
		case 'collectionVersion':
		case 'version':
			return this.apiObj.version;
		case 'parentCollection':
			return this.apiObj.data.parentCollection;
		}
		
		if (key in this.apiObj.data) {
			return this.apiObj.data[key];
		} else if (this.apiObj.meta.hasOwnProperty(key)) {
			return this.apiObj.meta[key];
		} else if (this.hasOwnProperty(key)) {
			return this[key];
		}
		
		return null;
	}

	set(key, val) {
		if (key in this.apiObj.data) {
			this.apiObj.data[key] = val;
		}
		switch (key) {
		case 'title':
		case 'name':
			this.apiObj.data.name = val;
			break;
		case 'collectionKey':
		case 'key':
			this.key = val;
			this.apiObj.key = val;
			this.apiObj.data.key = val;
			break;
		case 'parentCollection':
			this.apiObj.data.parentCollection = val;
			break;
		case 'collectionVersion':
		case 'version':
			this.version = val;
			this.apiObj.version = val;
			this.apiObj.data.version = val;
			break;
		}
		
		if (this.hasOwnProperty(key)) {
			this[key] = val;
		}
	}
}

export { Collection };
