

var log = require('./Log.js').Logger('libZotero:Idb');

// Initialize an indexedDB for the specified library user or group + id
// returns a promise that is resolved with a Zotero.Idb.Library instance when successful
// and rejected onerror
class IdbLibrary {
	constructor(libraryString) {
		log.debug('Zotero.Idb.Library', 3);
		log.debug('Initializing Zotero IDB', 3);
		this.libraryString = libraryString;
		this.owningLibrary = null;
		this.initialized = false;
	}

	init() {
		var idbLibrary = this;
		return new Promise(function (resolve, reject) {
			// Don't bother with the prefixed names because they should all be irrelevant by now
			var indexedDB = window.indexedDB;
			idbLibrary.indexedDB = indexedDB;

			// Now we can open our database
			log.debug('requesting indexedDb from browser', 3);
			var request = indexedDB.open('Zotero_' + idbLibrary.libraryString, 4);
			request.onerror = function (e) {
				log.error('ERROR OPENING INDEXED DB');
				reject();
			};

			var upgradeCallback = function (event) {
				log.debug('Zotero.Idb onupgradeneeded or onsuccess', 3);
				var oldVersion = event.oldVersion;
				log.debug('oldVersion: ' + event.oldVersion, 3);
				var db = event.target.result;
				idbLibrary.db = db;

				if (oldVersion < 4) {
					// delete old versions of object stores
					log.debug('Existing object store names:', 3);
					log.debug(JSON.stringify(db.objectStoreNames), 3);
					log.debug('Deleting old object stores', 3);
					if (db.objectStoreNames.items) {
						db.deleteObjectStore('items');
					}
					if (db.objectStoreNames.tags) {
						db.deleteObjectStore('tags');
					}
					if (db.objectStoreNames.collections) {
						db.deleteObjectStore('collections');
					}
					if (db.objectStoreNames.files) {
						db.deleteObjectStore('files');
					}
					if (db.objectStoreNames.versions) {
						db.deleteObjectStore('versions');
					}
					log.debug('Existing object store names:', 3);
					log.debug(JSON.stringify(db.objectStoreNames), 3);

					// Create object stores to hold items, collections, and tags.
					// IDB keys are just the zotero object keys
					var itemStore = db.createObjectStore('items', { keyPath: 'key' });
					var collectionStore = db.createObjectStore('collections', { keyPath: 'key' });
					var tagStore = db.createObjectStore('tags', { keyPath: 'tag' });
					var fileStore = db.createObjectStore('files');
					var versionStore = db.createObjectStore('versions');

					log.debug('itemStore index names:', 3);
					log.debug(JSON.stringify(itemStore.indexNames), 3);
					log.debug('collectionStore index names:', 3);
					log.debug(JSON.stringify(collectionStore.indexNames), 3);
					log.debug('tagStore index names:', 3);
					log.debug(JSON.stringify(tagStore.indexNames), 3);

					// Create index to search/sort items by each attribute
					Object.keys(Zotero.Item.prototype.fieldMap).forEach(function (key) {
						log.debug('Creating index on ' + key, 3);
						itemStore.createIndex(key, 'data.' + key, { unique: false });
					});

					// itemKey index was created above with all other item fields
					// itemStore.createIndex("itemKey", "itemKey", { unique: false });

					// create multiEntry indices on item collectionKeys and tags
					itemStore.createIndex('collectionKeys', 'data.collections', { unique: false, multiEntry: true });
					// index on extra tagstrings array since tags are objects and we can't index them directly
					itemStore.createIndex('itemTagStrings', '_supplement.tagstrings', { unique: false, multiEntry: true });
					// example filter for tag: Zotero.Idb.filterItems("itemTagStrings", "Unread");
					// example filter collection: Zotero.Idb.filterItems("collectionKeys", "<collectionKey>");

					// itemStore.createIndex("itemType", "itemType", { unique: false });
					itemStore.createIndex('parentItemKey', 'data.parentItem', { unique: false });
					itemStore.createIndex('libraryKey', 'libraryKey', { unique: false });
					itemStore.createIndex('deleted', 'data.deleted', { unique: false });

					collectionStore.createIndex('name', 'data.name', { unique: false });
					collectionStore.createIndex('key', 'key', { unique: false });
					collectionStore.createIndex('parentCollection', 'data.parentCollection', { unique: false });
					// collectionStore.createIndex("libraryKey", "libraryKey", { unique: false });

					tagStore.createIndex('tag', 'tag', { unique: false });
					// tagStore.createIndex("libraryKey", "libraryKey", { unique: false });
				}
			};

			request.onupgradeneeded = upgradeCallback;

			request.onsuccess = function () {
				log.debug('IDB success', 3);
				idbLibrary.db = request.result;
				idbLibrary.initialized = true;
				resolve(idbLibrary);
			};
		});
	}

	deleteDB() {
		var idbLibrary = this;
		idbLibrary.db.close();
		return new Promise(function (resolve, reject) {
			var deleteRequest = idbLibrary.indexedDB.deleteDatabase('Zotero_' + idbLibrary.libraryString);
			deleteRequest.onerror = function () {
				log.error('Error deleting indexedDB');
				reject();
			};
			deleteRequest.onsuccess = function () {
				log.debug('Successfully deleted indexedDB', 2);
				resolve();
			};
		});
	}

	/**
	* @param {string} store_name
	* @param {string} mode either "readonly" or "readwrite"
	*/
	getObjectStore(store_name, mode) {
		var idbLibrary = this;
		var tx = idbLibrary.db.transaction(store_name, mode);
		return tx.objectStore(store_name);
	}

	clearObjectStore(store_name) {
		var idbLibrary = this;
		var store = idbLibrary.getObjectStore(store_name, 'readwrite');
		return new Promise(function (resolve, reject) {
			var req = store.clear();
			req.onsuccess = function (evt) {
				log.debug('Store cleared', 3);
				resolve();
			};
			req.onerror = function (evt) {
				log.error('clearObjectStore:', evt.target.errorCode);
				reject();
			};
		});
	}

	/**
	* Add array of items to indexedDB
	* @param {array} items
	*/
	addItems(items) {
		return this.addObjects(items, 'item');
	}

	/**
	* Update/add array of items to indexedDB
	* @param {array} items
	*/
	updateItems(items) {
		return this.updateObjects(items, 'item');
	}

	/**
	* Remove array of items to indexedDB. Just references itemKey and does no other checks that items match
	* @param {array} items
	*/
	removeItems(items) {
		return this.removeObjects(items, 'item');
	}

	/**
	* Get item from indexedDB that has given itemKey
	* @param {string} itemKey
	*/
	getItem(itemKey) {
		var idbLibrary = this;
		return new Promise(function (resolve, reject) {
			var success = function (event) {
				resolve(event.target.result);
			};
			idbLibrary.db.transaction('items').objectStore(['items'], 'readonly').get(itemKey).onsuccess = success;
		});
	}

	/**
	* Get all the items in this indexedDB
	* @param {array} items
	*/
	getAllItems() {
		return this.getAllObjects('item');
	}

	getOrderedItemKeys(field, order) {
		var idbLibrary = this;
		log.debug('Zotero.Idb.getOrderedItemKeys', 3);
		log.debug('' + field + ' ' + order, 3);
		return new Promise(function (resolve, reject) {
			var objectStore = idbLibrary.db.transaction(['items'], 'readonly').objectStore('items');
			var index = objectStore.index(field);
			if (!index) {
				throw new Error("Index for requested field '" + field + "'' not found");
			}

			var cursorDirection = 'next';
			if (order == 'desc') {
				cursorDirection = 'prev';
			}

			var cursorRequest = index.openKeyCursor(null, cursorDirection);
			var itemKeys = [];
			cursorRequest.onsuccess = function (event) {
				var cursor = event.target.result;
				if (cursor) {
					itemKeys.push(cursor.primaryKey);
					cursor.continue();
				} else {
					log.debug('No more cursor: done. Resolving deferred.', 3);
					resolve(itemKeys);
				}
			};

			cursorRequest.onfailure = function (event) {
				reject();
			};
		});
	}

	// filter the items in indexedDB by value in field
	filterItems(field, value) {
		var idbLibrary = this;
		log.debug('Zotero.Idb.filterItems ' + field + ' - ' + value, 3);
		return new Promise(function (resolve, reject) {
			var itemKeys = [];
			var objectStore = idbLibrary.db.transaction(['items'], 'readonly').objectStore('items');
			var index = objectStore.index(field);
			if (!index) {
				throw new Error("Index for requested field '" + field + "'' not found");
			}

			var cursorDirection = 'next';

			/* if(order == "desc"){
				cursorDirection = "prev";
			}*/

			var range = IDBKeyRange.only(value);
			var cursorRequest = index.openKeyCursor(range, cursorDirection);
			cursorRequest.onsuccess = function (event) {
				var cursor = event.target.result;
				if (cursor) {
					itemKeys.push(cursor.primaryKey);
					cursor.continue();
				} else {
					log.debug('No more cursor: done. Resolving deferred.', 3);
					resolve(itemKeys);
				}
			};

			cursorRequest.onfailure = function (event) {
				reject();
			};
		});
	}

	inferType(object) {
		if (!object) {
			return false;
		}
		if (!object.instance) {
			return false;
		}
		switch (object.instance) {
		case 'Zotero.Item':
			return 'item';
		case 'Zotero.Collection':
			return 'collection';
		case 'Zotero.Tag':
			return 'tag';
		default:
			return false;
		}
	}

	getTransactionAndStore(type, access) {
		var idbLibrary = this;
		var transaction;
		var objectStore;
		switch (type) {
		case 'item':
			transaction = idbLibrary.db.transaction(['items'], access);
			objectStore = transaction.objectStore('items');
			break;
		case 'collection':
			transaction = idbLibrary.db.transaction(['collections'], access);
			objectStore = transaction.objectStore('collections');
			break;
		case 'tag':
			transaction = idbLibrary.db.transaction(['tags'], access);
			objectStore = transaction.objectStore('tags');
			break;
		default:
			return Promise.reject();
		}
		return [transaction, objectStore];
	}

	addObjects(objects, type) {
		log.debug('Zotero.Idb.Library.addObjects', 3);
		var idbLibrary = this;
		if (!type) {
			type = idbLibrary.inferType(objects[0]);
		}
		var TS = idbLibrary.getTransactionAndStore(type, 'readwrite');
		var transaction = TS[0];
		var objectStore = TS[1];

		return new Promise(function (resolve, reject) {
			transaction.oncomplete = function (event) {
				log.debug('Add Objects transaction completed.', 3);
				resolve();
			};

			transaction.onerror = function (event) {
				log.error('Add Objects transaction failed.');
				reject();
			};

			var reqSuccess = function (event) {
				log.debug('Added Object ' + event.target.result, 4);
			};
			for (var i in objects) {
				var request = objectStore.add(objects[i].apiObj);
				request.onsuccess = reqSuccess;
			}
		});
	}

	updateObjects(objects, type) {
		log.debug('Zotero.Idb.Library.updateObjects', 3);
		var idbLibrary = this;
		if (!type) {
			type = idbLibrary.inferType(objects[0]);
		}
		var TS = idbLibrary.getTransactionAndStore(type, 'readwrite');
		var transaction = TS[0];
		var objectStore = TS[1];

		return new Promise(function (resolve, reject) {
			transaction.oncomplete = function (event) {
				log.debug('Update Objects transaction completed.', 3);
				resolve();
			};

			transaction.onerror = function (event) {
				log.error('Update Objects transaction failed.');
				reject();
			};

			var reqSuccess = function (event) {
				log.debug('Updated Object ' + event.target.result, 4);
			};
			for (var i in objects) {
				var request = objectStore.put(objects[i].apiObj);
				request.onsuccess = reqSuccess;
			}
		});
	}

	removeObjects(objects, type) {
		var idbLibrary = this;
		if (!type) {
			type = idbLibrary.inferType(objects[0]);
		}
		var TS = idbLibrary.getTransactionAndStore(type, 'readwrite');
		var transaction = TS[0];
		var objectStore = TS[1];

		return new Promise(function (resolve, reject) {
			transaction.oncomplete = function (event) {
				log.debug('Remove Objects transaction completed.', 3);
				resolve();
			};

			transaction.onerror = function (event) {
				log.error('Remove Objects transaction failed.');
				reject();
			};

			var reqSuccess = function (event) {
				log.debug('Removed Object ' + event.target.result, 4);
			};
			for (var i in objects) {
				var request = objectStore.delete(objects[i].key);
				request.onsuccess = reqSuccess;
			}
		});
	}

	getAllObjects(type) {
		var idbLibrary = this;
		return new Promise(function (resolve, reject) {
			var objects = [];
			var objectStore = idbLibrary.db.transaction(type + 's').objectStore(type + 's');

			objectStore.openCursor().onsuccess = function (event) {
				var cursor = event.target.result;
				if (cursor) {
					objects.push(cursor.value);
					cursor.continue();
				} else {
					resolve(objects);
				}
			};
		});
	}

	addCollections(collections) {
		return this.addObjects(collections, 'collection');
	}

	updateCollections(collections) {
		log.debug('Zotero.Idb.Library.updateCollections', 3);
		return this.updateObjects(collections, 'collection');
	}

	/**
	* Get collection from indexedDB that has given collectionKey
	* @param {string} collectionKey
	*/
	getCollection(collectionKey) {
		var idbLibrary = this;
		return new Promise(function (resolve, reject) {
			var success = function (event) {
				resolve(event.target.result);
			};
			idbLibrary.db.transaction('collections').objectStore(['collections'], 'readonly').get(collectionKey).onsuccess = success;
		});
	}

	removeCollections(collections) {
		log.debug('Zotero.Idb.Library.removeCollections', 3);
		return this.removeObjects(collections, 'collection');
	}

	getAllCollections() {
		log.debug('Zotero.Idb.Library.getAllCollections', 3);
		return this.getAllObjects('collection');
	}

	addTags(tags) {
		return this.addObjects(tags, 'tag');
	}

	updateTags(tags) {
		log.debug('Zotero.Idb.Library.updateTags', 3);
		return this.updateObjects(tags, 'tag');
	}

	getAllTags() {
		log.debug('getAllTags', 3);
		return this.getAllObjects('tag');
	}

	setVersion(type, version) {
		log.debug('Zotero.Idb.Library.setVersion', 3);
		var idbLibrary = this;
		return new Promise(function (resolve, reject) {
			var transaction = idbLibrary.db.transaction(['versions'], 'readwrite');

			transaction.oncomplete = function (event) {
				log.debug('set version transaction completed.', 3);
				resolve();
			};

			transaction.onerror = function (event) {
				log.error('set version transaction failed.');
				reject();
			};

			var versionStore = transaction.objectStore('versions');
			var reqSuccess = function (event) {
				log.debug('Set Version' + event.target.result, 3);
			};
			var request = versionStore.put(version, type);
			request.onsuccess = reqSuccess;
		});
	}

	/**
	* Get version data from indexedDB
	* @param {string} type
	*/
	getVersion(type) {
		log.debug('Zotero.Idb.Library.getVersion', 3);
		var idbLibrary = this;
		return new Promise(function (resolve, reject) {
			var success = function (event) {
				log.debug('done getting version');
				resolve(event.target.result);
			};
			idbLibrary.db.transaction(['versions'], 'readonly').objectStore('versions').get(type).onsuccess = success;
		});
	}

	setFile(itemKey, fileData) {
		log.debug('Zotero.Idb.Library.setFile', 3);
		var idbLibrary = this;
		return new Promise(function (resolve, reject) {
			var transaction = idbLibrary.db.transaction(['files'], 'readwrite');

			transaction.oncomplete = function (event) {
				log.debug('set file transaction completed.', 3);
				resolve();
			};

			transaction.onerror = function (event) {
				log.error('set file transaction failed.');
				reject();
			};

			var fileStore = transaction.objectStore('files');
			var reqSuccess = function (event) {
				log.debug('Set File' + event.target.result, 3);
			};
			var request = fileStore.put(fileData, itemKey);
			request.onsuccess = reqSuccess;
		});
	}

	/**
	* Get item from indexedDB that has given itemKey
	* @param {string} itemKey
	*/
	getFile(itemKey) {
		log.debug('Zotero.Idb.Library.getFile', 3);
		var idbLibrary = this;
		return new Promise(function (resolve, reject) {
			var success = function (event) {
				log.debug('done getting file');
				resolve(event.target.result);
			};
			idbLibrary.db.transaction(['files'], 'readonly').objectStore('files').get(itemKey).onsuccess = success;
		});
	}

	deleteFile(itemKey) {
		log.debug('Zotero.Idb.Library.deleteFile', 3);
		var idbLibrary = this;
		return new Promise(function (resolve, reject) {
			var transaction = idbLibrary.db.transaction(['files'], 'readwrite');

			transaction.oncomplete = function (event) {
				log.debug('delete file transaction completed.', 3);
				resolve();
			};

			transaction.onerror = function (event) {
				log.error('delete file transaction failed.');
				reject();
			};

			var fileStore = transaction.objectStore('files');
			var reqSuccess = function (event) {
				log.debug('Deleted File' + event.target.result, 4);
			};
			var request = fileStore.delete(itemKey);
			request.onsuccess = reqSuccess;
		});
	}

	// intersect two arrays of strings as an AND condition on index results
	intersect(ar1, ar2) {
		var idbLibrary = this;
		var result = [];
		for (var i = 0; i < ar1.length; i++) {
			if (ar2.indexOf(ar1[i]) !== -1) {
				result.push(ar1[i]);
			}
		}
		return result;
	}

	// intersect an array of arrays of strings as an AND condition on index results
	intersectAll(arrs) {
		var idbLibrary = this;
		var result = arrs[0];
		for (var i = 0; i < arrs.length - 1; i++) {
			result = idbLibrary.intersect(result, arrs[i + 1]);
		}
		return result;
	}
}

export { IdbLibrary };
