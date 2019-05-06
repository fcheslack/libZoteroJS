

var log = require('./Log.js').Logger('libZotero:Items');
import { Container } from './Container.js';

class Items extends Container {
	constructor(jsonBody) {
		super(jsonBody);
		this.instance = 'Zotero.Items';
		// represent items as array for ordering purposes
		this.itemsVersion = 0;
		this.syncState = {
			earliestVersion: null,
			latestVersion: null
		};
		this.itemObjects = {};
		this.objectMap = this.itemObjects;
		this.objectArray = [];
		this.unsyncedItemKeys = [];
		
		if (jsonBody) {
			this.addItemsFromJson(jsonBody);
		}
	}

	getItem = (key) => {
		return this.getObject(key);
	};

	getItems = (keys) => {
		return this.getObjects(keys);
	};

	addItem = (item) => {
		this.addObject(item);
		return this;
	}

	addItemsFromJson = (jsonBody) => {
		log.debug('addItemsFromJson', 3);
		var parsedItemJson = jsonBody;
		var itemsAdded = [];
		parsedItemJson.forEach((itemObj) => {
			var item = new Zotero.Item(itemObj);
			this.addItem(item);
			itemsAdded.push(item);
		});
		return itemsAdded;
	}

	// Remove item from local set if it has been marked as deleted by the server
	removeLocalItem = (key) => {
		return this.removeObject(key);
	}

	removeLocalItems = (keys) => {
		return this.removeObjects(keys);
	}

	deleteItem = (itemKey) => {
		log.debug('Zotero.Items.deleteItem', 3);
		var item;
		
		if (!itemKey) return false;
		itemKey = Items.extractKey(itemKey);
		item = this.getItem(itemKey);
		
		var urlconfig = {
			target: 'item',
			libraryType: this.owningLibrary.libraryType,
			libraryID: this.owningLibrary.libraryID,
			itemKey: item.key
		};
		var requestConfig = {
			url: urlconfig,
			type: 'DELETE',
			headers: { 'If-Unmodified-Since-Version': item.get('version') }
		};
		
		return this.owningLibrary.ajaxRequest(requestConfig);
	}

	deleteItems = (deleteItems, version) => {
		log.debug('Zotero.Items.deleteItems', 3);
		var deleteKeys = [];
		var i;
		if ((!version) && (this.itemsVersion !== 0)) {
			version = this.itemsVersion;
		}
		
		// make sure we're working with item keys, not items
		var key;
		for (i = 0; i < deleteItems.length; i++) {
			if (!deleteItems[i]) continue;
			key = this.extractKey(deleteItems[i]);
			if (key) {
				deleteKeys.push(key);
			}
		}
		
		// split keys into chunks of 50 per request
		var deleteChunks = this.chunkObjectsArray(deleteKeys);

		/*
		var successCallback = function(response){
			var deleteProgress = index / deleteChunks.length;
			Zotero.trigger("deleteProgress", {'progress': deleteProgress});
			return response;
		};
		*/
		var requestObjects = [];
		for (i = 0; i < deleteChunks.length; i++) {
			var deleteKeysString = deleteChunks[i].join(',');
			var urlconfig = {
				target: 'items',
				libraryType: this.owningLibrary.libraryType,
				libraryID: this.owningLibrary.libraryID,
				itemKey: deleteKeysString
			};
			// headers['If-Unmodified-Since-Version'] = version;
			
			var requestConfig = {
				url: urlconfig,
				type: 'DELETE'
			};
			requestObjects.push(requestConfig);
		}
		
		return this.owningLibrary.sequentialRequests(requestObjects);
	}

	trashItems = (itemsArray) => {
		var i;
		for (i = 0; i < itemsArray.length; i++) {
			var item = itemsArray[i];
			item.set('deleted', 1);
		}
		return this.writeItems(itemsArray);
	}

	untrashItems = (itemsArray) => {
		var i;
		for (i = 0; i < itemsArray.length; i++) {
			var item = itemsArray[i];
			item.set('deleted', 0);
		}
		return this.writeItems(itemsArray);
	}

	findItems = (config) => {
		var matchingItems = [];
		Object.keys(this.itemObjects).forEach((key) => {
			var item = item.itemObjects[key];
			if (config.collectionKey && (item.apiObj.collections.indexOf(config.collectionKey) === -1)) {
				return;
			}
			matchingItems.push(this.itemObjects[key]);
		});
		return matchingItems;
	}

	// take an array of items and extract children into their own items
	// for writing
	atomizeItems = (itemsArray) => {
		// process the array of items, pulling out child notes/attachments to write
		// separately with correct parentItem set and assign generated itemKeys to
		// new items
		var writeItems = [];
		var item;
		for (var i = 0; i < itemsArray.length; i++) {
			item = itemsArray[i];
			// generate an itemKey if the item does not already have one
			var itemKey = item.get('key');
			if (itemKey === '' || itemKey === null) {
				var newItemKey = Zotero.utils.getKey();
				item.set('key', newItemKey);
				item.set('version', 0);
			}
			// items that already have item key always in first pass, as are their children
			writeItems.push(item);
			if (item.hasOwnProperty('notes') && item.notes.length > 0) {
				for (var j = 0; j < item.notes.length; j++) {
					item.notes[j].set('parentItem', item.get('key'));
				}
				writeItems = writeItems.concat(item.notes);
			}
			if (item.hasOwnProperty('attachments') && item.attachments.length > 0) {
				for (var k = 0; k < item.attachments.length; k++) {
					item.attachments[k].set('parentItem', item.get('key'));
				}
				writeItems = writeItems.concat(item.attachments);
			}
		}
		return writeItems;
	}

	// accept an array of 'Zotero.Item's
	writeItems = (itemsArray) => {
		log.debug('writeItems');
		var library = this.owningLibrary;
		var i;
		var writeItems = this.atomizeItems(itemsArray);

		
		var config = {
			target: 'items',
			libraryType: this.owningLibrary.libraryType,
			libraryID: this.owningLibrary.libraryID
		};
		
		var writeChunks = this.chunkObjectsArray(writeItems);
		var rawChunkObjects = Items.rawChunks(writeChunks);
		
		// update item with server response if successful
		var writeItemsSuccessCallback = function (response) {
			return new Promise((resolve) => {
				var writeItemsCallback = () => {
					// save updated items to IDB
					if (Zotero.config.useIndexedDB) {
						this.library.idbLibrary.updateItems(this.writeChunk);
					}
					
					Zotero.trigger('itemsChanged', { library: this.library });
					response.returnItems = this.writeChunk;
					resolve();
				};
				log.debug('writeItem successCallback', 3);
				
				// @TODO: It would be nicer if rejections (for partially or entirely
				//		invalid updates) would propagate all the way to the end-user
				//		instead of being swalloed here.
				Items.updateObjectsFromWriteResponse(this.writeChunk, response)
					.then(writeItemsCallback)
					.catch(writeItemsCallback);
			});
		};
		
		log.debug('items.itemsVersion: ' + this.itemsVersion, 3);
		log.debug('items.libraryVersion: ' + this.libraryVersion, 3);
		
		var requestObjects = [];
		for (i = 0; i < writeChunks.length; i++) {
			var successContext = {
				writeChunk: writeChunks[i],
				library: library
			};
			
			var requestData = JSON.stringify(rawChunkObjects[i]);
			requestObjects.push({
				url: config,
				type: 'POST',
				data: requestData,
				processData: false,
				success: writeItemsSuccessCallback.bind(successContext)
			});
		}

		
		return library.sequentialRequests(requestObjects)
			.then((responses) => {
				log.debug('Done with writeItems sequentialRequests promise', 3);
				return responses;
			});
	}
}

export { Items };
