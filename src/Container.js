

var log = require('./Log.js').Logger('libZotero:Container');
import { chunkObjectsArray } from './Utils.js';

class Container {
	constructor() {
		this.objectMap = {};
		this.objectArray = [];
	}

	initSecondaryData() {}

	// add an ApiObject to the array and map, and associate it with container's owningLibrary if present
	addObject(object) {
		log.debug('Zotero.Container.addObject', 4);
		this.objectArray.push(object);
		this.objectMap[object.key] = object;
		if (this.owningLibrary) {
			object.associateWithLibrary(this.owningLibrary);
		}
		
		return this;
	}

	// return the function to use to compare a field of an ApiObject
	static fieldComparer(field) {
		if (Intl) {
			var collator = new Intl.Collator();
			return function (a, b) {
				return collator.compare(a.apiObj.data[field], b.apiObj.data[field]);
			};
		} else {
			return function (a, b) {
				if (a.apiObj.data[field].toLowerCase() == b.apiObj.data[field].toLowerCase()) {
					return 0;
				}
				if (a.apiObj.data[field].toLowerCase() < b.apiObj.data[field].toLowerCase()) {
					return -1;
				}
				return 1;
			};
		}
	}

	// get a single object by key
	getObject(key) {
		if (this.objectMap.hasOwnProperty(key)) {
			return this.objectMap[key];
		} else {
			return false;
		}
	}

	// get multiple objects by key
	getObjects(keys) {
		var objects = [];
		var object;
		for (var i = 0; i < keys.length; i++) {
			object = this.getObject(keys[i]);
			if (object) {
				objects.push(object);
			}
		}
		return objects;
	}

	// remove an object with a given key, then re-initialize secondary data which may have changed
	removeObject(key) {
		if (this.objectMap.hasOwnProperty(key)) {
			delete this.objectmap[key];
			this.initSecondaryData();
		}
	}

	// remove multiple objects by key
	removeObjects(keys) {
		// delete Objects from objectMap;
		for (var i = 0; i < keys.length; i++) {
			delete this.objectMap[keys[i]];
		}
		
		// rebuild array
		this.initSecondaryData();
	}

	writeObjects(objects) {
		// TODO:implement
	}

	// generate keys for objects about to be written if they are new
	static assignKeys(objectsArray) {
		let object;
		for (let i = 0; i < objectsArray.length; i++) {
			object = objectsArray[i];
			let key = object.get('key');
			if (!key) {
				let newObjectKey = Zotero.utils.getKey();
				object.set('key', newObjectKey);
				object.set('version', 0);
			}
		}
		return objectsArray;
	}

	// given an array of chunks for writing, build an array converting each object inside each chunk
	// using writeApiObj() to get an object to send to the Zotero API
	static rawChunks(chunks) {
		let rawChunkObjects = [];
		
		for (let i = 0; i < chunks.length; i++) {
			rawChunkObjects[i] = [];
			for (let j = 0; j < chunks[i].length; j++) {
				rawChunkObjects[i].push(chunks[i][j].writeApiObj());
			}
		}
		return rawChunkObjects;
	}

	/**
	 * Update syncState property on container to keep track of updates that occur during sync process.
	 * Set earliestVersion to MIN(earliestVersion, version).
	 * Set latestVersion to MAX(latestVersion, version).
	 * This should be called with the modifiedVersion header for each response tied to this container
	 * during a sync process.
	 * @param  {int} version
	 * @return {null}
	 */
	updateSyncState(version) {
		log.debug('updateSyncState: ' + version, 3);
		if (!this.hasOwnProperty('syncState')) {
			log.debug('no syncState property');
			throw new Error('Attempt to update sync state of object with no syncState property');
		}
		if (this.syncState.earliestVersion === null) {
			this.syncState.earliestVersion = version;
		}
		if (this.syncState.latestVersion === null) {
			this.syncState.latestVersion = version;
		}
		if (version < this.syncState.earliestVersion) {
			this.syncState.earliestVersion = version;
		}
		if (version > this.syncState.latestVersion) {
			this.syncState.latestVersion = version;
		}
		log.debug('done updating sync state', 3);
	}

	updateSyncedVersion(_versionField) {
		if (this.syncState.earliestVersion !== null
			&& (this.syncState.earliestVersion == this.syncState.latestVersion)) {
			this.version = this.syncState.latestVersion;
			this.synced = true;
		} else if (this.syncState.earliestVersion !== null) {
			this.version = this.syncState.earliestVersion;
		}
	}

	processDeletions(deletedKeys) {
		for (var i = 0; i < deletedKeys.length; i++) {
			var localObject = this.get(deletedKeys[i]);
			if (localObject !== false) {
				// still have object locally
				if (localObject.synced === true) {
					// our object is not modified, so delete it as the server thinks we should
					this.removeObjects([deletedKeys[i]]);
				} else {
					// TODO: conflict resolution
				}
			}
		}
	}

	// update items appropriately based on response to multi-write request
	// for success:
	//  update objectKey if item doesn't have one yet (newly created item)
	//  update itemVersion to response's Last-Modified-Version header
	//  mark as synced
	// for unchanged:
	//  don't need to do anything? itemVersion should remain the same?
	//  mark as synced if not already?
	// for failed:
	//  add the failure to the object under writeFailure
	//  don't mark as synced
	//  calling code should check for writeFailure after the written objects
	//  are returned
	static async updateObjectsFromWriteResponse(objectsArray, response) {
		log.debug('Zotero.Container.updateObjectsFromWriteResponse', 3);
		log.debug('statusCode: ' + response.status, 3);
		if (response.status == 200) {
			let data = await response.data;
			let lastModifiedVersion = response.rawResponse.headers.get('Last-Modified-Version');
			log.debug('newLastModifiedVersion: ' + lastModifiedVersion, 3);
			// make sure writes were actually successful and
			// update the itemKey for the parent
			if (data.hasOwnProperty('success') && Object.keys(data.success).length) {
				// update each successfully written item, possibly with new itemKeys
				Object.keys(data.success).forEach((ind) => {
					var i = parseInt(ind, 10);
					var key = data.success[ind];
					var object = objectsArray[i];
					// throw error if objectKey mismatch
					if (object.key !== '' && object.key !== key) {
						throw new Error('object key mismatch in multi-write response');
					}
					if (object.key === '') {
						object.updateObjectKey(key);
					}
					log.debug(`setting version to ${lastModifiedVersion}`, 4);
					object.set('version', lastModifiedVersion);
					object.synced = true;
					object.writeFailure = false;
				});
			} else if (data.hasOwnProperty('failed') && Object.keys(data.failed).length) {
				log.debug('updating objects with failed writes', 3);
				Object.keys(data.failed).forEach((ind) => {
					var failure = data.failed[ind];
					log.error('failed write ' + ind + ' - ' + failure);
					log.debug(failure);
					var i = parseInt(ind, 10);
					var object = objectsArray[i];
					object.writeFailure = failure;
				});
				// throw new Error('some writes failed');
			}
		} else if (response.status == 204) {
			// single item put response, this probably should never go to this function
			objectsArray[0].synced = true;
		}
	}

	// return the key as a string when passed an argument that
	// could be either a string key or an object with a key property
	static extractKey(object) {
		if (typeof object == 'string') {
			return object;
		}
		return object.get('key');
	}
}
Container.prototype.chunkObjectsArray = chunkObjectsArray;

export { Container };
