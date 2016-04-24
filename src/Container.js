'use strict';

var log = require('./Log.js').Logger('libZotero:Container');

module.exports = function(){
	
};

module.exports.prototype.initSecondaryData = function(){
	
};

module.exports.prototype.addObject = function(object){
	log.debug('Zotero.Container.addObject', 4);
	var container = this;
	container.objectArray.push(object);
	container.objectMap[object.key] = object;
	if(container.owningLibrary){
		object.associateWithLibrary(container.owningLibrary);
	}
	
	return container;
};

module.exports.prototype.fieldComparer = function(field){
	if(Intl){
		var collator = new Intl.Collator();
		return function(a, b){
			return collator.compare(a.apiObj.data[field], b.apiObj.data[field]);
		};
	} else {
		return function(a, b){
			if(a.apiObj.data[field].toLowerCase() == b.apiObj.data[field].toLowerCase()){
				return 0;
			}
			if(a.apiObj.data[field].toLowerCase() < b.apiObj.data[field].toLowerCase()){
				return -1;
			}
			return 1;
		};
	}
};

module.exports.prototype.getObject = function(key){
	var container = this;
	if(container.objectMap.hasOwnProperty(key)){
		return container.objectMap[key];
	}
	else{
		return false;
	}
};

module.exports.prototype.getObjects = function(keys){
	var container = this;
	var objects = [];
	var object;
	for(var i = 0; i < keys.length; i++){
		object = container.getObject(keys[i]);
		if(object){
			objects.push(object);
		}
	}
	return objects;
};

module.exports.prototype.removeObject = function(key){
	var container = this;
	if(container.objectMap.hasOwnProperty(key)){
		delete container.objectmap[key];
		container.initSecondaryData();
	}
};

module.exports.prototype.removeObjects = function(keys){
	var container = this;
	//delete Objects from objectMap;
	for(var i = 0; i < keys.length; i++){
		delete container.objectMap[keys[i]];
	}
	
	//rebuild array
	container.initSecondaryData();
};

module.exports.prototype.writeObjects = function(objects){
	//TODO:implement
};

//generate keys for objects about to be written if they are new
module.exports.prototype.assignKeys = function(objectsArray){
	var object;
	for(var i = 0; i < objectsArray.length; i++){
		object = objectsArray[i];
		var key = object.get('key');
		if(!key) {
			var newObjectKey = Zotero.utils.getKey();
			object.set('key', newObjectKey);
			object.set('version', 0);
		}
	}
	return objectsArray;
};

//split an array of objects into chunks to write over multiple api requests
module.exports.prototype.chunkObjectsArray = function(objectsArray){
	var chunkSize = 50;
	var writeChunks = [];
	
	for(var i = 0; i < objectsArray.length; i = i + chunkSize){
		writeChunks.push(objectsArray.slice(i, i+chunkSize));
	}
	
	return writeChunks;
};

module.exports.prototype.rawChunks = function(chunks){
	var rawChunkObjects = [];
	
	for(var i = 0; i < chunks.length; i++){
		rawChunkObjects[i] = [];
		for(var j = 0; j < chunks[i].length; j++){
			rawChunkObjects[i].push(chunks[i][j].writeApiObj());
		}
	}
	return rawChunkObjects;
};

/**
 * Update syncState property on container to keep track of updates that occur during sync process.
 * Set earliestVersion to MIN(earliestVersion, version).
 * Set latestVersion to MAX(latestVersion, version).
 * This should be called with the modifiedVersion header for each response tied to this container
 * during a sync process.
 * @param  {int} version
 * @return {null}
 */
module.exports.prototype.updateSyncState = function(version) {
	var container = this;
	log.debug('updateSyncState: ' + version, 3);
	if(!container.hasOwnProperty('syncState')){
		log.debug('no syncState property');
		throw new Error('Attempt to update sync state of object with no syncState property');
	}
	if(container.syncState.earliestVersion === null){
		container.syncState.earliestVersion = version;
	}
	if(container.syncState.latestVersion === null){
		container.syncState.latestVersion = version;
	}
	if(version < container.syncState.earliestVersion){
		container.syncState.earliestVersion = version;
	}
	if(version > container.syncState.latestVersion){
		container.syncState.latestVersion = version;
	}
	log.debug('done updating sync state', 3);
};

module.exports.prototype.updateSyncedVersion = function(versionField) {
	var container = this;
	if(container.syncState.earliestVersion !== null &&
		(container.syncState.earliestVersion == container.syncState.latestVersion) ){
		container.version = container.syncState.latestVersion;
		container.synced = true;
	}
	else if(container.syncState.earliestVersion !== null) {
		container.version = container.syncState.earliestVersion;
	}
};

module.exports.prototype.processDeletions = function(deletedKeys) {
	var container = this;
	for(var i = 0; i < deletedKeys.length; i++){
		var localObject = container.get(deletedKeys[i]);
		if(localObject !== false){
			//still have object locally
			if(localObject.synced === true){
				//our object is not modified, so delete it as the server thinks we should
				container.removeObjects([deletedKeys[i]]);
			}
			else {
				//TODO: conflict resolution
			}
		}
	}
};

//update items appropriately based on response to multi-write request
//for success:
//  update objectKey if item doesn't have one yet (newly created item)
//  update itemVersion to response's Last-Modified-Version header
//  mark as synced
//for unchanged:
//  don't need to do anything? itemVersion should remain the same?
//  mark as synced if not already?
//for failed:
//  add the failure to the object under writeFailure
//  don't mark as synced
//  calling code should check for writeFailure after the written objects
//  are returned
module.exports.prototype.updateObjectsFromWriteResponse = function(objectsArray, response){
	log.debug('Zotero.Container.updateObjectsFromWriteResponse', 3);
	log.debug('statusCode: ' + response.status, 3);
	var data = response.data;
	if(response.status == 200){
		log.debug('newLastModifiedVersion: ' + response.lastModifiedVersion, 3);
		//make sure writes were actually successful and
		//update the itemKey for the parent
		if(data.hasOwnProperty('success')){
			//update each successfully written item, possibly with new itemKeys
			Object.keys(data.success).forEach(function(ind){
				var i = parseInt(ind, 10);
				var key = data.success[ind];
				var object = objectsArray[i];
				//throw error if objectKey mismatch
				if(object.key !== '' && object.key !== key){
					throw new Error('object key mismatch in multi-write response');
				}
				if(object.key === ''){
					object.updateObjectKey(key);
				}
				object.set('version', response.lastModifiedVersion);
				object.synced = true;
				object.writeFailure = false;
			});
		}
		if(data.hasOwnProperty('failed')){
			log.debug('updating objects with failed writes', 3);
			Object.keys(data.failed).forEach(function(ind){
				var failure = data.failed[ind];
				log.error('failed write ' + ind + ' - ' + failure);
				var i = parseInt(ind, 10);
				var object = objectsArray[i];
				object.writeFailure = failure;
			});
		}
	}
	else if(response.status == 204){
		//single item put response, this probably should never go to this function
		objectsArray[0].synced = true;
	}
};

//return the key as a string when passed an argument that 
//could be either a string key or an object with a key property
module.exports.prototype.extractKey = function(object){
	if(typeof object == 'string'){
		return object;
	}
	return object.get('key');
};
