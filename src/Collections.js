Zotero.Collections = function(jsonBody){
	var collections = this;
	this.instance = "Zotero.Collections";
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
	
	if(jsonBody){
		this.addCollectionsFromJson(jsonBody);
		this.initSecondaryData();
	}
};

Zotero.Collections.prototype = new Zotero.Container();
//build up secondary data necessary to rendering and easy operations but that
//depend on all collections already being present
Zotero.Collections.prototype.initSecondaryData = function(){
	Z.debug("Zotero.Collections.initSecondaryData", 3);
	var collections = this;
	
	//rebuild collectionsArray
	collections.collectionsArray = [];
	Object.keys(collections.collectionObjects).forEach(function(key){
		var collection = collections.collectionObjects[key];
		collections.collectionsArray.push(collection);
	});
	
	collections.collectionsArray.sort(Zotero.ApiObject.prototype.fieldComparer('name'));
	collections.nestCollections();
	collections.assignDepths(0, collections.collectionsArray);
};

//take Collection XML and insert a Collection object
Zotero.Collections.prototype.addCollection = function(collection){
	this.addObject(collection);
	return this;
};

Zotero.Collections.prototype.addCollectionsFromJson = function(jsonBody){
	Z.debug("addCollectionsFromJson");
	Z.debug(jsonBody);
	var collections = this;
	var collectionsAdded = [];
	jsonBody.forEach(function(collectionObj){
		var collection = new Zotero.Collection(collectionObj);
		collections.addObject(collection);
		collectionsAdded.push(collection);
	});
	return collectionsAdded;
};

Zotero.Collections.prototype.assignDepths = function(depth, cArray){
	Z.debug("Zotero.Collections.assignDepths", 3);
	var collections = this;
	var insertchildren = function(depth, children){
		children.forEach(function(col){
			col.nestingDepth = depth;
			if(col.hasChildren){
				insertchildren((depth + 1), col.children);
			}
		});
	};
	collections.collectionsArray.forEach(function(collection){
		if(collection.topLevel){
			collection.nestingDepth = 1;
			if(collection.hasChildren){
				insertchildren(2, collection.children);
			}
		}
	});
};

Zotero.Collections.prototype.nestedOrderingArray = function(){
	Z.debug("Zotero.Collections.nestedOrderingArray", 3);
	var collections = this;
	var nested = [];
	var insertchildren = function(a, children){
		children.forEach(function(col){
			a.push(col);
			if(col.hasChildren){
				insertchildren(a, col.children);
			}
		});
	};
	collections.collectionsArray.forEach(function(collection){
		if(collection.topLevel){
			nested.push(collection);
			if(collection.hasChildren){
				insertchildren(nested, collection.children);
			}
		}
	});
	Z.debug("Done with nestedOrderingArray", 3);
	return nested;
};

Zotero.Collections.prototype.getCollection = function(key){
	return this.getObject(key);
};

Zotero.Collections.prototype.remoteDeleteCollection = function(collectionKey){
	var collections = this;
	return collections.removeLocalCollection(collectionKey);
};

Zotero.Collections.prototype.removeLocalCollection = function(collectionKey){
	var collections = this;
	return collections.removeLocalCollections([collectionKey]);
};

Zotero.Collections.prototype.removeLocalCollections = function(collectionKeys){
	var collections = this;
	//delete Collection from collectionObjects
	for(var i = 0; i < collectionKeys.length; i++){
		delete collections.collectionObjects[collectionKeys[i]];
	}
	
	//rebuild collectionsArray
	collections.initSecondaryData();
};

//reprocess all collections to add references to children inside their parents
Zotero.Collections.prototype.nestCollections = function(){
	var collections = this;
	//clear out all child references so we don't duplicate
	collections.collectionsArray.forEach(function(collection){
		collection.children = [];
	});
	
	collections.collectionsArray.sort(Zotero.ApiObject.prototype.fieldComparer('name'));
	collections.collectionsArray.forEach(function(collection){
		collection.nestCollection(collections.collectionObjects);
	});
};

Zotero.Collections.prototype.writeCollections = function(collectionsArray){
	Z.debug('Zotero.Collections.writeCollections', 3);
	var collections = this;
	var library = collections.owningLibrary;
	var i;
	
	var config = {
		'target':'collections',
		'libraryType':collections.owningLibrary.libraryType,
		'libraryID':collections.owningLibrary.libraryID
	};
	var requestUrl = Zotero.ajax.apiRequestString(config);
	
	//add collectionKeys to collections if they don't exist yet
	for(i = 0; i < collectionsArray.length; i++){
		var collection = collectionsArray[i];
		//generate a collectionKey if the collection does not already have one
		var collectionKey = collection.get('key');
		if(collectionKey === "" || collectionKey === null) {
			var newCollectionKey = Zotero.utils.getKey();
			collection.set("key", newCollectionKey);
			collection.set("version", 0);
		}
	}

	var writeChunks = collections.chunkObjectsArray(collectionsArray);
	var rawChunkObjects = collections.rawChunks(writeChunks);
	//update collections with server response if successful
	var writeCollectionsSuccessCallback = function(response){
		Z.debug("writeCollections successCallback", 3);
		var library = this.library;
		var writeChunk = this.writeChunk;
		library.collections.updateObjectsFromWriteResponse(this.writeChunk, response);
		//save updated collections to collections
		for(var i = 0; i < writeChunk.length; i++){
			var collection = writeChunk[i];
			if(collection.synced && (!collection.writeFailure)) {
				library.collections.addCollection(collection);
				//save updated collections to IDB
				if(Zotero.config.useIndexedDB){
					Z.debug("updating indexedDB collections");
					library.idbLibrary.updateCollections(writeChunk);
				}
			}
		}
		response.returnCollections = writeChunk;
		return response;
	};
	
	Z.debug("collections.version: " + collections.version, 3);
	Z.debug("collections.libraryVersion: " + collections.libraryVersion, 3);
	
	var requestObjects = [];
	for(i = 0; i < writeChunks.length; i++){
		var successContext = {
			writeChunk: writeChunks[i],
			library: library
		};
		
		var requestData = JSON.stringify(rawChunkObjects[i]);
		requestObjects.push({
			url: requestUrl,
			type: 'POST',
			data: requestData,
			processData: false,
			headers:{
				//'If-Unmodified-Since-Version': collections.version,
				//'Content-Type': 'application/json'
			},
			success: writeCollectionsSuccessCallback.bind(successContext)
		});
	}

	return library.sequentialRequests(requestObjects)
	.then(function(responses){
		Z.debug("Done with writeCollections sequentialRequests promise", 3);
		collections.initSecondaryData();
		
		responses.forEach(function(response){
			if(response.isError || (response.data.hasOwnProperty('failed') && Object.keys(response.data.failed).length > 0) ){
				throw new Error("failure when writing collections");
			}
		});
		return responses;
	})
	.catch(function(err){
		Z.error(err);
		//rethrow so widget doesn't report success
		throw(err);
	});
};
