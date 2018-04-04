'use strict';

var log = require('./Log.js').Logger('libZotero:Writer');

import {Net} from './Net.js';
let net = new Net();

class Writer{
	constructor(libraryType, libraryID, apiKey){
		this.libraryType = libraryType;
		this.libraryID = libraryID;
		this.apiKey = apiKey;
	}

	writeObjects(objectsArray, target){
		let libraryType = this.libraryType;
		let libraryID = this.libraryID;

		let rc = new Zotero.RequestConfig().LibraryType(libraryType).LibraryID(libraryID);
		rc.Key(this.apiKey);
		rc.Target(target);

		let writeChunks = chunkObjectsArray(objectsArray);
		let rawChunkObjects = rawChunks(writeChunks);

		//update object with server response if successful
		var writeSuccessCallback = function(response){
			log.debug('write successCallback', 3);
			updateObjectsFromWriteResponse(this.writeChunk, response);
			response.returnObjects = this.writeChunk;
			return response;
		};

		var requestObjects = [];
		writeChunks.forEach((writeChunk, i)=>{
			var successContext = {writeChunk};

			var requestData = JSON.stringify(rawChunkObjects[i]);
			requestObjects.push({
				url: rc.config,
				type: 'POST',
				data: requestData,
				processData: false,
				success: writeSuccessCallback.bind(successContext)
			});
		});

		return net.queueRequest(requestObjects)
		.then(function(responses){
			log.debug('Done with writeObjects sequentialRequests promise', 3);
			return responses;
		});
	};

	//accept an array of 'Zotero.Item's
	writeItems(itemsArray){
		let writeItems = atomizeItems(itemsArray);
		return this.writeObjects(writeItems, 'items');
	};
}

//take an array of items and extract children into their own items
//for writing
let atomizeItems = function(itemsArray){
	//process the array of items, pulling out child notes/attachments to write
	//separately with correct parentItem set and assign generated itemKeys to
	//new items
	var writeItems = [];
	var item;
	for(var i = 0; i < itemsArray.length; i++){
		item = itemsArray[i];
		//generate an itemKey if the item does not already have one
		var itemKey = item.get('key');
		if(itemKey === '' || itemKey === null) {
			var newItemKey = Zotero.utils.getKey();
			item.set('key', newItemKey);
			item.set('version', 0);
		}
		//items that already have item key always in first pass, as are their children
		writeItems.push(item);
		if(item.hasOwnProperty('notes') && item.notes.length > 0){
			for(var j = 0; j < item.notes.length; j++){
				item.notes[j].set('parentItem', item.get('key'));
			}
			writeItems = writeItems.concat(item.notes);
		}
		if(item.hasOwnProperty('attachments') && item.attachments.length > 0){
			for(var k = 0; k < item.attachments.length; k++){
				item.attachments[k].set('parentItem', item.get('key'));
			}
			writeItems = writeItems.concat(item.attachments);
		}
	}
	return writeItems;
};

//split an array of objects into chunks to write over multiple api requests
var chunkObjectsArray = function(objectsArray){
	var chunkSize = 50;
	var writeChunks = [];

	for(var i = 0; i < objectsArray.length; i = i + chunkSize){
		writeChunks.push(objectsArray.slice(i, i+chunkSize));
	}

	return writeChunks;
};

var rawChunks = function(chunks){
	var rawChunkObjects = [];

	for(var i = 0; i < chunks.length; i++){
		rawChunkObjects[i] = [];
		for(var j = 0; j < chunks[i].length; j++){
			rawChunkObjects[i].push(chunks[i][j].writeApiObj());
		}
	}
	return rawChunkObjects;
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
let updateObjectsFromWriteResponse = function(objectsArray, response){
	log.debug('updateObjectsFromWriteResponse', 3);
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

export {Writer, atomizeItems, updateObjectsFromWriteResponse};
