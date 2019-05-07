

var log = require('./Log.js').Logger('libZotero:Collections');
import { Container } from './Container.js';

class Collections extends Container {
	constructor(jsonBody) {
		super(jsonBody);
		this.instance = 'Zotero.Collections';
		this.version = 0;
		this.syncState = {
			earliestVersion: null,
			latestVersion: null
		};
		this.collectionObjects = {};
		this.collectionsArray = [];
		this.objectMap = this.collectionObjects;
		this.objectArray = this.collectionsArray;
		this.dirty = false;
		this.loaded = false;
		
		if (jsonBody) {
			this.addCollectionsFromJson(jsonBody);
			this.initSecondaryData();
		}
	}

	// build up secondary data necessary to rendering and easy operations but that
	// depend on all collections already being present
	initSecondaryData() {
		log.debug('Zotero.Collections.initSecondaryData', 3);
		// rebuild collectionsArray
		this.collectionsArray = [];
		Object.keys(this.collectionObjects).forEach((key) => {
			var collection = this.collectionObjects[key];
			this.collectionsArray.push(collection);
		});
		
		this.collectionsArray.sort(Collections.fieldComparer('name'));
		this.nestCollections();
		this.assignDepths(0, this.collectionsArray);
	}

	// take Collection XML and insert a Collection object
	addCollection(collection) {
		this.addObject(collection);
		return this;
	}

	addCollectionsFromJson(jsonBody) {
		log.debug('addCollectionsFromJson', 3);
		var collectionsAdded = [];
		jsonBody.forEach((collectionObj) => {
			var collection = new Zotero.Collection(collectionObj);
			this.addObject(collection);
			collectionsAdded.push(collection);
		});
		return collectionsAdded;
	}

	assignDepths(_depth, _cArray) {
		log.debug('Zotero.Collections.assignDepths', 3);
		var insertchildren = function (depth, children) {
			children.forEach(function (col) {
				col.nestingDepth = depth;
				if (col.hasChildren) {
					insertchildren((depth + 1), col.children);
				}
			});
		};
		this.collectionsArray.forEach(function (collection) {
			if (collection.topLevel) {
				collection.nestingDepth = 1;
				if (collection.hasChildren) {
					insertchildren(2, collection.children);
				}
			}
		});
	}

	nestedOrderingArray() {
		log.debug('Zotero.Collections.nestedOrderingArray', 3);
		var nested = [];
		var insertchildren = function (a, children) {
			children.forEach(function (col) {
				a.push(col);
				if (col.hasChildren) {
					insertchildren(a, col.children);
				}
			});
		};
		this.collectionsArray.forEach(function (collection) {
			if (collection.topLevel) {
				nested.push(collection);
				if (collection.hasChildren) {
					insertchildren(nested, collection.children);
				}
			}
		});
		log.debug('Done with nestedOrderingArray', 3);
		return nested;
	}

	getCollection(key) {
		return this.getObject(key);
	}

	remoteDeleteCollection(collectionKey) {
		return this.removeLocalCollection(collectionKey);
	}

	removeLocalCollection(collectionKey) {
		return this.removeLocalCollections([collectionKey]);
	}

	removeLocalCollections(collectionKeys) {
		// delete Collection from collectionObjects
		for (var i = 0; i < collectionKeys.length; i++) {
			delete this.collectionObjects[collectionKeys[i]];
		}
		
		// rebuild collectionsArray
		this.initSecondaryData();
	}

	// reprocess all collections to add references to children inside their parents
	nestCollections() {
		// clear out all child references so we don't duplicate
		this.collectionsArray.forEach(function (collection) {
			collection.children = [];
		});
		
		this.collectionsArray.sort(Collections.fieldComparer('name'));
		this.collectionsArray.forEach((collection) => {
			collection.nestCollection(this.collectionObjects);
		});
	}

	async writeCollections(collectionsArray) {
		log.debug('Zotero.Collections.writeCollections', 3);
		const library = this.owningLibrary;
		
		var config = {
			target: 'collections',
			libraryType: library.libraryType,
			libraryID: library.libraryID
		};
		
		// add collectionKeys to collections if they don't exist yet
		for (let i = 0; i < collectionsArray.length; i++) {
			let collection = collectionsArray[i];
			// generate a collectionKey if the collection does not already have one
			let collectionKey = collection.get('key');
			if (collectionKey === '' || collectionKey === null) {
				let newCollectionKey = Zotero.utils.getKey();
				collection.set('key', newCollectionKey);
				collection.set('version', 0);
			}
		}

		var writeChunks = this.chunkObjectsArray(collectionsArray);
		var rawChunkObjects = Collections.rawChunks(writeChunks);
		log.debug('collections.version: ' + this.version, 3);
		log.debug('collections.libraryVersion: ' + this.libraryVersion, 3);
		
		var requestObjects = [];
		for (let i = 0; i < writeChunks.length; i++) {
			let writeChunk = writeChunks[i];
			
			// if write is successful, update local objects and IDB if in use
			let successCallback = (response) => {
				log.debug('writeCollections successCallback', 3);
				Collections.updateObjectsFromWriteResponse(writeChunk, response);
				// save updated collections to collections
				for (let i = 0; i < writeChunk.length; i++) {
					let collection = writeChunk[i];
					if (collection.synced && (!collection.writeFailure)) {
						library.collections.addCollection(collection);
						// save updated collections to IDB
						if (Zotero.config.useIndexedDB) {
							log.debug('updating indexedDB collections');
							library.idbLibrary.updateCollections(writeChunk);
						}
					}
				}
				response.returnCollections = writeChunk;
				return response;
			};
			
			var requestData = JSON.stringify(rawChunkObjects[i]);
			requestObjects.push({
				url: config,
				type: 'POST',
				data: requestData,
				processData: true,
				headers: {
					// 'If-Unmodified-Since-Version': this.version,
					// 'Content-Type': 'application/json'
				},
				success: successCallback
			});
		}

		let responses = await library.sequentialRequests(requestObjects);
		log.debug('Done with writeCollections sequentialRequests promise', 3);
		this.initSecondaryData();

		return responses;
	}
}

export { Collections };
