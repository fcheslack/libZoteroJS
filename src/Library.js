'use strict';

var log = require('./Log.js').Logger('libZotero:Library');

/**
 * A user or group Zotero library. This is generally the top level object
 * through which interactions should happen. It houses containers for
 * Zotero API objects (collections, items, etc) and handles making requests
 * with particular API credentials, as well as storing data locally.
 * @param {string} type                 type of library, 'user' or 'group'
 * @param {int} libraryID            ID of the library
 * @param {string} libraryUrlIdentifier identifier used in urls, could be library id or user/group slug
 * @param {string} apiKey               key to use for API requests
 */
class Library {
	constructor(type, libraryID, libraryUrlIdentifier, apiKey){
		log.debug('Zotero.Library constructor', 3);
		log.debug('Library Constructor: ' + type + ' ' + libraryID + ' ', 3);
		var library = this;
		log.debug(libraryUrlIdentifier, 4);
		library.instance = 'Zotero.Library';
		library.libraryVersion = 0;
		library.syncState = {
			earliestVersion: null,
			latestVersion: null
		};
		library._apiKey = apiKey || '';
		
		library.libraryUrlIdentifier = libraryUrlIdentifier;
		if(Zotero.config.librarySettings){
			library.libraryBaseWebsiteUrl = Zotero.config.librarySettings.libraryPathString;
		}
		else{
			library.libraryBaseWebsiteUrl = Zotero.config.baseWebsiteUrl;
			if(type == 'group'){
				library.libraryBaseWebsiteUrl += 'groups/';
			}
			if(libraryUrlIdentifier){
				this.libraryBaseWebsiteUrl += libraryUrlIdentifier + '/items';
			} else {
				log.warn('no libraryUrlIdentifier specified');
			}
		}
		//object holders within this library, whether tied to a specific library or not
		library.items = new Zotero.Items();
		library.items.owningLibrary = library;
		library.itemKeys = [];
		library.collections = new Zotero.Collections();
		library.collections.libraryUrlIdentifier = library.libraryUrlIdentifier;
		library.collections.owningLibrary = library;
		library.tags = new Zotero.Tags();
		library.searches = new Zotero.Searches();
		library.searches.owningLibrary = library;
		library.groups = new Zotero.Groups();
		library.groups.owningLibrary = library;
		library.deleted = new Zotero.Deleted();
		library.deleted.owningLibrary = library;
		
		if(!type){
			//return early if library not specified
			log.warn('No type specified for library');
			return;
		}
		//attributes tying instance to a specific Zotero library
		library.type = type;
		library.libraryType = type;
		library.libraryID = libraryID;
		library.libraryString = Zotero.utils.libraryString(library.libraryType, library.libraryID);
		library.libraryUrlIdentifier = libraryUrlIdentifier;
		
		//initialize preferences object
		library.preferences = new Zotero.Preferences(Zotero.store, library.libraryString);
		
		if(typeof window === 'undefined') {
			Zotero.config.useIndexedDB = false;
			log.warn('Node detected; disabling indexedDB');
		} else {
			//initialize indexedDB if we're supposed to use it
			//detect safari until they fix their shit
			var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
			var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
			var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
			var is_safari = navigator.userAgent.indexOf('Safari') > -1;
			var is_opera = navigator.userAgent.toLowerCase().indexOf('op') > -1;
			if ((is_chrome)&&(is_safari)) {is_safari=false;}
			if ((is_chrome)&&(is_opera)) {is_chrome=false;}
			if(is_safari) {
				Zotero.config.useIndexedDB = false;
				log.warn('Safari detected; disabling indexedDB');
			}
		}

		if(Zotero.config.useIndexedDB === true) {
			log.debug('Library Constructor: indexedDB init', 3);
			var idbLibrary = new Zotero.Idb.Library(library.libraryString);
			idbLibrary.owningLibrary = this;
			library.idbLibrary = idbLibrary;
			library.cachedDataPromise = idbLibrary.init()
			.then(function(){
				log.debug('Library Constructor: idbInitD Done', 3);
				if(Zotero.config.preloadCachedLibrary === true){
					log.debug('Library Constructor: preloading cached library', 3);
					var cacheLoadD = library.loadIndexedDBCache();
					cacheLoadD.then(function(){
						//TODO: any stuff that needs to execute only after cache is loaded
						//possibly fire new events to cause display to refresh after load
						log.debug('Library Constructor: Library.items.itemsVersion: ' + library.items.itemsVersion, 3);
						log.debug('Library Constructor: Library.collections.collectionsVersion: ' + library.collections.collectionsVersion, 3);
						log.debug('Library Constructor: Library.tags.tagsVersion: ' + library.tags.tagsVersion, 3);
						log.debug('Library Constructor: Triggering cachedDataLoaded', 3);
						library.trigger('cachedDataLoaded');
					},
					function(err){
						log.error('Error loading cached library');
						log.error(err);
						throw new Error('Error loading cached library');
					});

					return cacheLoadD;
				}
				else {
					//trigger cachedDataLoaded since we are done with that step
					library.trigger('cachedDataLoaded');
				}
			},
			function(){
				//can't use indexedDB. Set to false in config and trigger error to notify user
				Zotero.config.useIndexedDB = false;
				library.trigger('indexedDBError');
				library.trigger('cachedDataLoaded');
				log.error('Error initializing indexedDB. Promise rejected.');
				//don't re-throw error, since we can still load data from the API
			});
		} else {
			library.cachedDataPromise = Promise.resolve();
		}
		
		library.dirty = false;
		
		//set noop data-change callbacks
		library.tagsChanged = function(){};
		library.collectionsChanged = function(){};
		library.itemsChanged = function(){};
	}
	/**
	 * Sort function that converts strings to locale lower case before comparing,
	 * however this is still not particularly effective at getting correct localized
	 * sorting in modern browsers due to browser implementations being poor. What we
	 * really want here is to strip diacritics first.
	 * @param  {string} a [description]
	 * @param  {string} b [description]
	 * @return {int}   [description]
	 */
	comparer(){
		if(Intl){
			return new Intl.Collator().compare;
		} else {
			return function(a, b){
				if(a.toLocaleLowerCase() == b.toLocaleLowerCase()){
					return 0;
				}
				if(a.toLocaleLowerCase() < b.toLocaleLowerCase()){
					return -1;
				}
				return 1;
			};
		}
	}
	//Zotero library wrapper around jQuery ajax that returns a jQuery promise
	//@url String url to request or object for input to apiRequestUrl and query string
	//@type request method
	//@options jquery options that are not the default for Zotero requests
	ajaxRequest(url, type, options){
		log.debug('Library.ajaxRequest', 3);
		if(!type){
			type = 'GET';
		}
		if(!options){
			options = {};
		}
		var requestObject = {
			url: url,
			type: type
		};
		requestObject = Object.assign({}, requestObject, options);
		if(!requestObject.key && (this._apiKey != '')){
			requestObject.key = this._apiKey;
		}
		log.debug(requestObject, 3);
		return Zotero.net.queueRequest(requestObject);
	}

	//Take an array of objects that specify Zotero API requests and perform them
	//in sequence.
	//return deferred that gets resolved when all requests have gone through.
	//Update versions after each request, otherwise subsequent writes won't go through.
	//or do we depend on specified callbacks to update versions if necessary?
	//fail on error?
	//request object must specify: url, method, body, headers, success callback, fail callback(?)

	/**
	 * Take an array of objects that specify Zotero API requests and perform them
	 * in sequence. Return a promise that gets resolved when all requests have
	 * gone through.
	 * @param  {[] Objects} requests Array of objects specifying requests to be made
	 * @return {Promise}          Promise that resolves/rejects along with requests
	 */
	sequentialRequests(requests){
		log.debug('Zotero.Library.sequentialRequests', 3);
		let modRequests = requests.map((request)=>{
			if(!request.key && (this._apiKey != '')){
				request.key = this._apiKey;
			}
			return request;
		});
		return Zotero.net.queueRequest(modRequests);
	}

	/**
	 * Generate a website url based on a dictionary of variables and the configured
	 * libraryBaseWebsiteUrl
	 * @param  {Object} urlvars Dictionary of key/value variables
	 * @return {string}         website url
	 */
	websiteUrl(urlvars){
		log.debug('Zotero.library.websiteUrl', 3);
		log.debug(urlvars, 4);
		var library = this;
		
		var urlVarsArray = [];
		Object.keys(urlvars).forEach(function(key){
			var value = urlvars[key];
			if(value === '') return;
			urlVarsArray.push(key + '/' + value);
		});
		urlVarsArray.sort();
		log.debug(urlVarsArray, 4);
		var pathVarsString = urlVarsArray.join('/');
		
		return library.libraryBaseWebsiteUrl + '/' + pathVarsString;
	}

	synchronize(){
		//get updated group metadata if applicable
		//  (this is an individual library method, so only necessary if this is
		//  a group library and we want to keep info about it)
		//sync library data
		//  get updated collections versions newer than current library version
		//  get updated searches versions newer than current library version
		//  get updated item versions newer than current library version
		//
	}

	/**
	 * Make and process API requests to update the local library items based on the
	 * versions we have locally. When the promise is resolved, we should have up to
	 * date items in this library's items container, as well as saved to indexedDB
	 * if configured to use it.
	 * @return {Promise} Promise
	 */
	loadUpdatedItems(){
		log.debug('Zotero.Library.loadUpdatedItems', 3);
		var library = this;
		//sync from the libraryVersion if it exists, otherwise use the itemsVersion, which is likely
		//derived from the most recent version of any individual item we have.
		var syncFromVersion = library.libraryVersion ? library.libraryVersion : library.items.itemsVersion;
		return Promise.resolve(library.updatedVersions('items', syncFromVersion))
		.then(function(response){
			log.debug('itemVersions resolved', 3);
			log.debug('items Last-Modified-Version: ' + response.lastModifiedVersion, 3);
			library.items.updateSyncState(response.lastModifiedVersion);
			
			var itemVersions = response.data;
			library.itemVersions = itemVersions;
			var itemKeys = [];
			Object.keys(itemVersions).forEach(function(key){
				var val = itemVersions[key];
				var item = library.items.getItem(key);
				if((!item) || (item.apiObj.key != val)){
					itemKeys.push(key);
				}
			});
			return library.loadItemsFromKeys(itemKeys);
		}).then(function(responses){
			log.debug('loadItemsFromKeys resolved', 3);
			library.items.updateSyncedVersion();
			
			//TODO: library needs its own state
			if(Zotero.state) {
				var displayParams = Zotero.state.getUrlVars();
				library.buildItemDisplayView(displayParams);
			}
			//save updated items to IDB
			if(Zotero.config.useIndexedDB){
				var saveItemsD = library.idbLibrary.updateItems(library.items.objectArray);
			}
		});
	}

	loadUpdatedCollections(){
		log.debug('Zotero.Library.loadUpdatedCollections', 3);
		var library = this;
		//sync from the libraryVersion if it exists, otherwise use the collectionsVersion, which is likely
		//derived from the most recent version of any individual collection we have.
		log.debug('library.collections.collectionsVersion:' + library.collections.collectionsVersion, 4);
		//var syncFromVersion = library.libraryVersion ? library.libraryVersion : library.collections.collectionsVersion;
		var syncFromVersion = library.collections.collectionsVersion;
		log.debug(`loadUpdatedCollections syncFromVersion: ${syncFromVersion}`, 3);
		//we need modified collectionKeys regardless, so load them
		return library.updatedVersions('collections', syncFromVersion)
		.then(function(response){
			log.debug('collectionVersions finished', 3);
			log.debug('Collections Last-Modified-Version: ' + response.lastModifiedVersion, 3);
			//start the syncState version tracking. This should be the earliest version throughout
			library.collections.updateSyncState(response.lastModifiedVersion);
			
			var collectionVersions = response.data;
			library.collectionVersions = collectionVersions;
			var collectionKeys = [];
			Object.keys(collectionVersions).forEach(function(key){
				var val = collectionVersions[key];
				var c = library.collections.getCollection(key);
				if((!c) || (c.apiObj.version != val)){
					collectionKeys.push(key);
				}
			});
			if(collectionKeys.length === 0){
				log.debug('No collectionKeys need updating. resolving', 3);
				return response;
			}
			else {
				log.debug('fetching collections by key', 3);
				return library.loadCollectionsFromKeys(collectionKeys)
				.then(function(){
					var collections = library.collections;
					collections.initSecondaryData();
					
					log.debug('All updated collections loaded', 3);
					library.collections.updateSyncedVersion();
					//TODO: library needs its own state
					
					//save updated collections to cache
					log.debug('loadUpdatedCollections complete - saving collections to cache before resolving', 3);
					log.debug('collectionsVersion: ' + library.collections.collectionsVersion, 3);
					//library.saveCachedCollections();
					//save updated collections to IDB
					if(Zotero.config.useIndexedDB){
						return library.idbLibrary.updateCollections(collections.collectionsArray);
					}
				});
			}
		})
		.then(function(){
			log.debug('done getting collection data. requesting deleted data', 3);
			return library.getDeleted(library.libraryVersion);
		})
		.then(function(response){
			log.debug('got deleted collections data: removing local copies', 3);
			log.debug(library.deleted, 3);
			if(library.deleted.deletedData.collections && library.deleted.deletedData.collections.length > 0 ){
				library.collections.removeLocalCollections(library.deleted.deletedData.collections);
			}
		});
	}

	loadUpdatedTags(){
		log.debug('Zotero.Library.loadUpdatedTags', 3);
		var library = this;
		log.debug('tagsVersion: ' + library.tags.tagsVersion, 3);
		return Promise.resolve(library.loadAllTags({since:library.tags.tagsVersion}))
		.then(function(){
			log.debug('done getting tags, request deleted tags data', 3);
			return library.getDeleted(library.libraryVersion);
		})
		.then(function(response){
			log.debug('got deleted tags data', 3);
			if(library.deleted.deletedData.tags && library.deleted.deletedData.tags.length > 0 ){
				library.tags.removeTags(library.deleted.deletedData.tags);
			}
			//save updated tags to IDB
			if(Zotero.config.useIndexedDB){
				log.debug('saving updated tags to IDB', 3);
				var saveTagsD = library.idbLibrary.updateTags(library.tags.tagsArray);
			}
		});
	}

	getDeleted(version) {
		log.debug('Zotero.Library.getDeleted', 3);
		var library = this;
		var urlconf = {
			target:'deleted',
			libraryType:library.libraryType,
			libraryID:library.libraryID,
			since:version
		};
		
		//if there is already a request working, create a new promise to resolve
		//when the actual request finishes
		if(library.deleted.pending){
			log.debug('getDeleted resolving with previously pending promise', 3);
			return Promise.resolve(library.deleted.pendingPromise);
		}
		
		//don't fetch again if version we'd be requesting is between
		//deleted.newer and delete.deleted versions, just use that one
		log.debug('version:' + version, 3);
		log.debug('sinceVersion:' + library.deleted.sinceVersion, 3);
		log.debug('untilVersion:' + library.deleted.untilVersion, 3);
		
		if(library.deleted.untilVersion &&
			version >= library.deleted.sinceVersion /*&&
			version < library.deleted.untilVersion*/){
			log.debug('deletedVersion matches requested: immediately resolving', 3);
			return Promise.resolve(library.deleted.deletedData);
		}
		
		library.deleted.pending = true;
		library.deleted.pendingPromise = library.ajaxRequest(urlconf)
		.then(function(response){
			log.debug('got deleted response', 3);
			library.deleted.deletedData = response.data;
			log.debug('Deleted Last-Modified-Version:' + response.lastModifiedVersion, 3);
			library.deleted.untilVersion = response.lastModifiedVersion;
			library.deleted.sinceVersion = version;
		}).then(function(response){
			log.debug('cleaning up deleted pending', 3);
			library.deleted.pending = false;
			library.deleted.pendingPromise = false;
		});
		
		return library.deleted.pendingPromise;
	}

	processDeletions(deletions){
		var library = this;
		//process deleted collections
		library.collections.processDeletions(deletions.collections);
		//process deleted items
		library.items.processDeletions(deletions.items);
	}

	//Get a full bibliography from the API for web based citating
	loadFullBib(itemKeys, style){
		var library = this;
		var itemKeyString = itemKeys.join(',');
		var urlconfig = {
			'target':'items',
			'libraryType':library.libraryType,
			'libraryID':library.libraryID,
			'itemKey':itemKeyString,
			'format':'bib',
			'linkwrap':'1'
		};
		if(itemKeys.length == 1){
			urlconfig.target = 'item';
		}
		if(style){
			urlconfig['style'] = style;
		}
		
		var loadBibPromise = library.ajaxRequest(urlconfig)
		.then(function(response){
			return response.data;
		});
		
		return loadBibPromise;
	}

	//load bib for a single item from the API
	loadItemBib(itemKey, style) {
		log.debug('Zotero.Library.loadItemBib', 3);
		var library = this;
		var urlconfig = {
			'target':'item',
			'libraryType':library.libraryType,
			'libraryID':library.libraryID,
			'itemKey':itemKey,
			'content':'bib'
		};
		if(style){
			urlconfig['style'] = style;
		}
		
		var itemBibPromise = library.ajaxRequest(urlconfig)
		.then(function(response){
			var item = new Zotero.Item(response.data);
			var bibContent = item.apiObj.bib;
			return bibContent;
		});
		
		return itemBibPromise;
	}

	//load library settings from Zotero API and return a promise that gets resolved with
	//the Zotero.Preferences object for this library
	loadSettings() {
		log.debug('Zotero.Library.loadSettings', 3);
		var library = this;
		var urlconfig = {
			'target':'settings',
			'libraryType':library.libraryType,
			'libraryID':library.libraryID
		};
		
		return library.ajaxRequest(urlconfig)
		.then(function(response){
			var resultObject;
			if(typeof response.data == 'string'){
				resultObject = JSON.parse(response.data);
			}
			else {
				resultObject = response.data;
			}
			//save the full settings object so we have it available if we need to write,
			//even if it has settings we don't use or know about
			library.preferences.setPref('settings', resultObject);
			
			library.trigger('settingsLoaded');
			return library.preferences;
		});
	}

	//take an array of tags and return subset of tags that should be colored, along with
	//the colors they should be
	matchColoredTags(tags) {
		var library = this;

		if(!library.tagColors){
			//pull out the settings we know we care about so we can query them directly
			let tagColors = [];
			let settings = library.preferences.getPref('settings');
			if(settings && settings.hasOwnProperty('tagColors')){
				tagColors = settings.tagColors.value;
			}
			library.tagColors = new Zotero.TagColors(tagColors);
		}
		
		return library.tagColors.match(tags);
	}

	/**
	 * Duplicate existing Items from this library and save to foreignLibrary
	 * with relationships indicating the ties. At time of writing, Zotero client
	 * saves the relationship with either the destination group of two group
	 * libraries or the personal library.
	 * @param  {Zotero.Item[]} items
	 * @param  {Zotero.Library} foreignLibrary
	 * @return {Promise.Zotero.Item[]} - newly created items
	 */
	sendToLibrary(items, foreignLibrary){
		var foreignItems = [];
		for(var i = 0; i < items.length; i++){
			var item = items[i];
			var transferData = item.emptyJsonItem();
			transferData.data = Object.assign({}, items[i].apiObj.data);
			//clear data that shouldn't be transferred:itemKey, collections
			transferData.data.key = '';
			transferData.data.version = 0;
			transferData.data.collections = [];
			delete transferData.data.dateModified;
			delete transferData.data.dateAdded;
			
			var newForeignItem = new Zotero.Item(transferData);
			
			newForeignItem.pristine = Object.assign({}, newForeignItem.apiObj);
			newForeignItem.initSecondaryData();
			
			//set relationship to tie to old item
			if(!newForeignItem.apiObj.data.relations){
				newForeignItem.apiObj.data.relations = {};
			}
			newForeignItem.apiObj.data.relations['owl:sameAs'] = Zotero.url.relationUrl(item.owningLibrary.libraryType, item.owningLibrary.libraryID, item.key);
			foreignItems.push(newForeignItem);
		}
		return foreignLibrary.items.writeItems(foreignItems);
	}

	/*METHODS FOR WORKING WITH THE ENTIRE LIBRARY -- NOT FOR GENERAL USE */

	//sync pull:
	//upload changed data
	// get updatedVersions for collections
	// get updatedVersions for searches
	// get upatedVersions for items
	// (sanity check versions we have for individual objects?)
	// loadCollectionsFromKeys
	// loadSearchesFromKeys
	// loadItemsFromKeys
	// process updated objects:
	//      ...
	// getDeletedData
	// process deleted
	// checkConcurrentUpdates (compare Last-Modified-Version from collections?newer request to one from /deleted request)

	updatedVersions(target='items', version=this.libraryVersion){
		log.debug('Library.updatedVersions', 3);
		var library = this;
		var urlconf = {
			target: target,
			format: 'versions',
			libraryType: library.libraryType,
			libraryID: library.libraryID,
			since: version
		};
		return library.ajaxRequest(urlconf);
	}

	//Download and save information about every item in the library
	//keys is an array of itemKeys from this library that we need to download
	loadItemsFromKeys(keys){
		log.debug('Zotero.Library.loadItemsFromKeys', 3);
		var library = this;
		return library.loadFromKeys(keys, 'items');
	}

	//keys is an array of collectionKeys from this library that we need to download
	loadCollectionsFromKeys(keys){
		log.debug('Zotero.Library.loadCollectionsFromKeys', 3);
		var library = this;
		return library.loadFromKeys(keys, 'collections');
	}

	//keys is an array of searchKeys from this library that we need to download
	loadSeachesFromKeys(keys){
		log.debug('Zotero.Library.loadSearchesFromKeys', 3);
		var library = this;
		return library.loadFromKeys(keys, 'searches');
	}

	loadFromKeys(keys, objectType){
		log.debug('Zotero.Library.loadFromKeys', 3);
		if(!objectType) objectType = 'items';
		var library = this;
		var keyslices = [];
		while(keys.length > 0){
			keyslices.push(keys.splice(0, 50));
		}
		
		var requestObjects = [];
		keyslices.forEach(function(keyslice){
			var keystring = keyslice.join(',');
			switch (objectType) {
				case 'items':
					requestObjects.push({
						url: {
							'target':'items',
							'targetModifier':null,
							'itemKey':keystring,
							'limit':50,
							'libraryType':library.libraryType,
							'libraryID':library.libraryID
						},
						type: 'GET',
						success: library.processLoadedItems.bind(library)
					});
					break;
				case 'collections':
					requestObjects.push({
						url: {
							'target':'collections',
							'targetModifier':null,
							'collectionKey':keystring,
							'limit':50,
							'libraryType':library.libraryType,
							'libraryID':library.libraryID
						},
						type: 'GET',
						success: library.processLoadedCollections.bind(library)
					});
					break;
				case 'searches':
					requestObjects.push({
						url: {
							'target':'searches',
							'targetModifier':null,
							'searchKey':keystring,
							'limit':50,
							'libraryType':library.libraryType,
							'libraryID':library.libraryID
						},
						type: 'GET'
						//success: library.processLoadedSearches.bind(library)
					});
					break;
			}
		});
		
		var promises = [];
		for(var i = 0; i < requestObjects.length; i++){
			let url = requestObjects[i].url;
			let type = requestObjects[i].type;
			let options = {
				success: requestObjects[i].success
			};
			promises.push(library.ajaxRequest(url, type, options));
		}
		return Promise.all(promises);
	}

	//publishes: displayedItemsUpdated
	//assume we have up to date information about items in indexeddb.
	//build a list of indexedDB filter requests to then intersect to get final result
	buildItemDisplayView(params) {
		log.debug('Zotero.Library.buildItemDisplayView', 3);
		log.debug(params, 4);
		//start with list of all items if we don't have collectionKey
		//otherwise get the list of items in that collection
		var library = this;
		//short-circuit if we don't have an initialized IDB yet
		if(!library.idbLibrary.db){
			return Promise.resolve([]);
		}
		
		var filterPromises = [];
		if(params.collectionKey){
			if(params.collectionKey == 'trash'){
				filterPromises.push(library.idbLibrary.filterItems('deleted', 1));
			}
			else{
				filterPromises.push(library.idbLibrary.filterItems('collectionKeys', params.collectionKey));
			}
		}
		else {
			filterPromises.push(library.idbLibrary.getOrderedItemKeys('title'));
		}
		
		//filter by selected tags
		var selectedTags = params.tag || [];
		if(typeof selectedTags == 'string') selectedTags = [selectedTags];
		for(var i = 0; i < selectedTags.length; i++){
			log.debug('adding selected tag filter', 3);
			filterPromises.push(library.idbLibrary.filterItems('itemTagStrings', selectedTags[i]));
		}
		
		//TODO: filter by search term. 
		//(need full text array or to decide what we're actually searching on to implement this locally)
		
		//when all the filters have been applied, combine and sort
		return Promise.all(filterPromises)
		.then(function(results){
			var i;
			for(i = 0; i < results.length; i++){
				log.debug('result from filterPromise: ' + results[i].length, 3);
				log.debug(results[i], 3);
			}
			var finalItemKeys = library.idbLibrary.intersectAll(results);
			var itemsArray = library.items.getItems(finalItemKeys);
			
			log.debug('All filters applied - Down to ' + itemsArray.length + ' items displayed', 3);
			
			log.debug('remove child items and, if not viewing trash, deleted items', 3);
			var displayItemsArray = [];
			for(i = 0; i < itemsArray.length; i++){
				if(itemsArray[i].apiObj.data.parentItem){
					continue;
				}
				
				if(params.collectionKey != 'trash' && itemsArray[i].apiObj.deleted){
					continue;
				}
				
				displayItemsArray.push(itemsArray[i]);
			}
			
			//sort displayedItemsArray by given or configured column
			var orderCol = params['order'] || 'title';
			var sort = params['sort'] || 'asc';
			log.debug('Sorting by ' + orderCol + ' - ' + sort, 3);
			
			var comparer = Zotero.comparer();
			
			displayItemsArray.sort(function(a, b){
				var aval = a.get(orderCol);
				var bval = b.get(orderCol);
				
				return comparer(aval, bval);
			});
			
			if(sort == 'desc'){
				log.debug('sort is desc - reversing array', 4);
				displayItemsArray.reverse();
			}
			
			//publish event signalling we're done
			log.debug('triggering publishing displayedItemsUpdated', 3);
			library.trigger('displayedItemsUpdated');
			return displayItemsArray;
		});
	}

	trigger(eventType, data){
		var library = this;
		Zotero.trigger(eventType, data, library.libraryString);
	}

	listen(events, handler, data){
		var library = this;
		var filter = library.libraryString;
		Zotero.listen(events, handler, data, filter);
	}

	//CollectionFunctions
	processLoadedCollections(response){
		log.debug('processLoadedCollections', 3);
		var library = this;
		
		//clear out display items
		log.debug('adding collections to library.collections', 3);
		var collectionsAdded = library.collections.addCollectionsFromJson(response.data);
		for (var i = 0; i < collectionsAdded.length; i++) {
			collectionsAdded[i].associateWithLibrary(library);
		}
		//update sync state
		library.collections.updateSyncState(response.lastModifiedVersion);
		
		Zotero.trigger('loadedCollectionsProcessed', {library:library, collectionsAdded:collectionsAdded});
		return response;
	}

	//create+write a collection given a name and optional parentCollectionKey
	addCollection(name, parentCollection){
		log.debug('Zotero.Library.addCollection', 3);
		var library = this;
		
		var collection = new Zotero.Collection();
		collection.associateWithLibrary(library);
		collection.set('name', name);
		collection.set('parentCollection', parentCollection);
		
		return library.collections.writeCollections([collection]);
	}

	//ItemFunctions
	//make request for item keys and return jquery ajax promise
	fetchItemKeys(config={}){
		log.debug('Zotero.Library.fetchItemKeys', 3);
		var library = this;
		var urlconfig = Object.assign(true, {
			'target':'items',
			'libraryType':this.libraryType,
			'libraryID':this.libraryID,
			'format':'keys'
		}, config);
		
		return library.ajaxRequest(urlconfig);
	}

	//get keys of all items marked for deletion
	getTrashKeys(){
		log.debug('Zotero.Library.getTrashKeys', 3);
		var library = this;
		var urlconfig = {
			'target': 'items',
			'libraryType': library.libraryType,
			'libraryID': library.libraryID,
			'format': 'keys',
			'collectionKey': 'trash'
		};
		
		return library.ajaxRequest(urlconfig);
	}

	emptyTrash(){
		log.debug('Zotero.Library.emptyTrash', 3);
		var library = this;
		return library.getTrashKeys()
		.then(function(response){
			var trashedItemKeys = response.data.split('\n');
			return library.items.deleteItems(trashedItemKeys, response.lastModifiedVersion);
		});
	}

	//gets the full set of item keys that satisfy `config`
	loadItemKeys(config){
		log.debug('Zotero.Library.loadItemKeys', 3);
		var library = this;
		return this.fetchItemKeys(config)
		.then(function(response){
			log.debug('loadItemKeys proxied callback', 3);
			var keys = response.data.split(/[\s]+/);
			library.itemKeys = keys;
		});
	}

	//loads a set of items specified by `config`
	//The items are added to this Library's items container, as well included as an array of Zotero.Item
	//on the returned promise as `response.loadedItems`
	loadItems(config){
		log.debug('Zotero.Library.loadItems', 3);
		var library = this;
		if(!config){
			config = {};
		}
		
		var defaultConfig = {
			target:'items',
			targetModifier: 'top',
			start: 0,
			limit: 25,
			order: Zotero.config.defaultSortColumn,
			sort: Zotero.config.defaultSortOrder
		};
		
		//Build config object that should be displayed next and compare to currently displayed
		var newConfig = Object.assign({}, defaultConfig, config);
		//newConfig.start = parseInt(newConfig.limit, 10) * (parseInt(newConfig.itemPage, 10) - 1);
		
		var urlconfig = Object.assign({
			'target':'items',
			'libraryType':library.libraryType,
			'libraryID':library.libraryID
		}, newConfig);
		
		return library.ajaxRequest(urlconfig)
		.then(function(response){
			log.debug('loadItems proxied callback', 3);
			//var library = this;
			var items = library.items;
			//clear out display items
			var loadedItemsArray = items.addItemsFromJson(response.data);
			for (let i = 0; i < loadedItemsArray.length; i++) {
				loadedItemsArray[i].associateWithLibrary(library);
			}
			
			response.loadedItems = loadedItemsArray;
			Zotero.trigger('itemsChanged', {library:library});
			return response;
		});
	}

	loadPublications(config){
		log.debug('Zotero.Library.loadPublications', 3);
		var library = this;
		if(!config){
			config = {};
		}
		
		var defaultConfig = {
			target:'publications',
			start: 0,
			limit: 50,
			order: Zotero.config.defaultSortColumn,
			sort: Zotero.config.defaultSortOrder,
			include: 'bib'
		};
		
		//Build config object that should be displayed next and compare to currently displayed
		var newConfig = Object.assign({}, defaultConfig, config);
		
		var urlconfig = Object.assign({
			'target':'publications',
			'libraryType':library.libraryType,
			'libraryID':library.libraryID
		}, newConfig);
		
		return library.ajaxRequest(urlconfig)
		.then(function(response){
			log.debug('loadPublications proxied callback', 3);
			var publicationItems = [];
			var parsedItemJson = response.data;
			parsedItemJson.forEach(function(itemObj){
				var item = new Zotero.Item(itemObj);
				publicationItems.push(item);
			});
			
			response.publicationItems = publicationItems;
			return response;
		});
	}

	processLoadedItems(response){
		log.debug('processLoadedItems', 3);
		var library = this;
		var items = library.items;
		//clear out display items
		var loadedItemsArray = items.addItemsFromJson(response.data);
		for (var i = 0; i < loadedItemsArray.length; i++) {
			loadedItemsArray[i].associateWithLibrary(library);
		}
		
		//update sync state
		library.items.updateSyncState(response.lastModifiedVersion);
		
		Zotero.trigger('itemsChanged', {library:library, loadedItems:loadedItemsArray});
		return response;
	}

	loadItem(itemKey) {
		log.debug('Zotero.Library.loadItem', 3);
		var library = this;
		if(!config){
			var config = {};
		}
		
		var urlconfig = {
			'target':'item',
			'libraryType':library.libraryType,
			'libraryID':library.libraryID,
			'itemKey':itemKey
		};
		
		return library.ajaxRequest(urlconfig)
		.then(function(response){
			log.debug('Got loadItem response', 3);
			var item = new Zotero.Item(response.data);
			item.owningLibrary = library;
			library.items.itemObjects[item.key] = item;
			Zotero.trigger('itemsChanged', {library:library});
			return(item);
		},
		function(response){
			log.warn('Error loading Item');
		});
	}

	trashItem(itemKey){
		var library = this;
		return library.items.trashItems([library.items.getItem(itemKey)]);
	}

	untrashItem(itemKey){
		log.debug('Zotero.Library.untrashItem', 3);
		if(!itemKey) return false;
		
		var item = this.items.getItem(itemKey);
		item.apiObj.deleted = 0;
		return item.writeItem();
	}

	deleteItem(itemKey){
		log.debug('Zotero.Library.deleteItem', 3);
		var library = this;
		return library.items.deleteItem(itemKey);
	}

	deleteItems(itemKeys){
		log.debug('Zotero.Library.deleteItems', 3);
		var library = this;
		return library.items.deleteItems(itemKeys);
	}

	addNote(itemKey, note){
		log.debug('Zotero.addNote', 3);
		var library = this;
		var config = {
			'target':'children',
			'libraryType':library.libraryType,
			'libraryID':library.libraryID,
			'itemKey':itemKey
		};
		
		var item = this.items.getItem(itemKey);
		
		return library.ajaxRequest(config, 'POST', {processData: false});
	}

	fetchGlobalItems(config){
		log.debug('Zotero.Library.fetchGlobalItems', 3);
		var library = this;
		if(!config){
			config = {};
		}
		
		var defaultConfig = {
			target:'items',
			start: 0,
			limit: 25
		};
		
		//Build config object that should be displayed next and compare to currently displayed
		var newConfig = Object.assign({}, defaultConfig, config);
		
		var urlconfig = Object.assign({'target':'items', 'libraryType': ''}, newConfig);
		
		return library.ajaxRequest(urlconfig, 'GET', {dataType:'json'})
		.then(function(response){
			log.debug('globalItems callback', 3);
			return(response.data);
		});
	}

	fetchGlobalItem(globalKey){
		log.debug('Zotero.Library.fetchGlobalItem', 3);
		log.debug(globalKey, 3);
		var library = this;
		
		var defaultConfig = {target:'item'};
		
		//Build config object that should be displayed next and compare to currently displayed
		var newConfig = Object.assign({}, defaultConfig);
		var urlconfig = Object.assign({
			'target':'item',
			'libraryType': '',
			'itemKey': globalKey
		}, newConfig);
		
		return library.ajaxRequest(urlconfig, 'GET', {dataType:'json'})
		.then(function(response){
			log.debug('globalItem callback', 3);
			return(response.data);
		});
	}

	//TagFunctions
	fetchTags(config){
		log.debug('Zotero.Library.fetchTags', 3);
		var library = this;
		var defaultConfig = {
			target:'tags',
			order:'title',
			sort:'asc',
			limit: 100
		};
		var newConfig = Object.assign({}, defaultConfig, config);
		var urlconfig = Object.assign({
			'target':'tags',
			'libraryType':this.libraryType,
			'libraryID':this.libraryID
		}, newConfig);
		
		return Zotero.ajaxRequest(urlconfig);
	}

	loadTags(config={}){
		log.debug('Zotero.Library.loadTags', 3);
		var library = this;
		
		if(config.showAutomaticTags && config.collectionKey){
			delete config.collectionKey;
		}
		
		library.tags.displayTagsArray = [];
		return library.fetchTags(config)
		.then(function(response){
			log.debug('loadTags proxied callback', 3);
			var updatedVersion = response.lastModifiedVersion;
			library.tags.updateSyncState(updatedVersion);
			var addedTags = library.tags.addTagsFromJson(response.data);
			library.tags.updateTagsVersion(updatedVersion);
			library.tags.rebuildTagsArray();
			
			if(response.parsedLinks.hasOwnProperty('next')){
				library.tags.hasNextLink = true;
				library.tags.nextLink = response.parsedLinks['next'];
			}
			else{
				library.tags.hasNextLink = false;
				library.tags.nextLink = null;
			}
			library.trigger('tagsChanged', {library:library});
			return library.tags;
		});
	}


	loadAllTags(config={}){
		log.debug('Zotero.Library.loadAllTags', 3);
		var library = this;
		var defaultConfig = {
			target:'tags',
			order:'title',
			sort:'asc',
			limit: 100,
			libraryType:library.libraryType,
			libraryID:library.libraryID
		};
		
		//Build config object that should be displayed next and compare to currently displayed
		var newConfig = Object.assign({}, defaultConfig, config);
		var urlconfig = Object.assign({}, newConfig);
		
		//check if already loaded tags are okay to use
		return new Promise(function(resolve, reject){
			var continueLoadingCallback = function(tags){
				log.debug('loadAllTags continueLoadingCallback', 3);
				var plainList = Zotero.Tags.prototype.plainTagsList(tags.tagsArray);
				plainList.sort(comparer());
				tags.plainList = plainList;
				
				if(tags.hasNextLink){
					log.debug('still has next link.', 3);
					tags.tagsArray.sort(Zotero.Tag.prototype.tagComparer());
					plainList = Zotero.Tags.prototype.plainTagsList(tags.tagsArray);
					plainList.sort(comparer());
					tags.plainList = plainList;
					
					var nextLink = tags.nextLink;
					var nextLinkConfig = Zotero.utils.parseQuery(Zotero.utils.querystring(nextLink));
					var newConfig = Object.assign({}, config);
					newConfig.start = nextLinkConfig.start;
					newConfig.limit = nextLinkConfig.limit;
					return library.loadTags(newConfig).then(continueLoadingCallback);
				}
				else{
					log.debug('no next in tags link', 3);
					tags.updateSyncedVersion();
					tags.tagsArray.sort(Zotero.Tag.prototype.tagComparer());
					plainList = Zotero.Tags.prototype.plainTagsList(tags.tagsArray);
					plainList.sort(comparer());
					tags.plainList = plainList;
					log.debug('resolving loadTags deferred', 3);
					library.tagsLoaded = true;
					library.tags.loaded = true;
					tags.loadedConfig = config;
					
					//update all tags with tagsVersion
					for (var i = 0; i < library.tags.tagsArray.length; i++) {
						tags.tagsArray[i].apiObj.version = tags.tagsVersion;
					}
					
					library.trigger('tagsChanged', {library:library});
					return tags;
				}
			};
			
			resolve( library.loadTags(urlconfig)
			.then(continueLoadingCallback));
		});
	}

	//LibraryCache
	//load objects from indexedDB
	loadIndexedDBCache(){
		log.debug('Zotero.Library.loadIndexedDBCache', 3);
		
		var library = this;
		
		var itemsPromise = library.idbLibrary.getAllItems();
		var collectionsPromise = library.idbLibrary.getAllCollections();
		var tagsPromise = library.idbLibrary.getAllTags();
		
		itemsPromise.then(function(itemsArray){
			log.debug('loadIndexedDBCache itemsD done', 3);
			//create itemsDump from array of item objects
			var latestItemVersion = 0;
			for(var i = 0; i < itemsArray.length; i++){
				var item = new Zotero.Item(itemsArray[i]);
				library.items.addItem(item);
				if(item.version > latestItemVersion){
					latestItemVersion = item.version;
				}
			}
			library.items.itemsVersion = latestItemVersion;
			
			//TODO: add itemsVersion as last version in any of these items?
			//or store it somewhere else for indexedDB cache purposes
			library.items.loaded = true;
			log.debug('Done loading indexedDB items promise into library', 3);
		});
		
		collectionsPromise.then(function(collectionsArray){
			log.debug('loadIndexedDBCache collectionsD done', 3);
			//create collectionsDump from array of collection objects
			var latestCollectionVersion = 0;
			for(var i = 0; i < collectionsArray.length; i++){
				var collection = new Zotero.Collection(collectionsArray[i]);
				library.collections.addCollection(collection);
				if(collection.version > latestCollectionVersion){
					latestCollectionVersion = collection.version;
				}
			}
			library.collections.collectionsVersion = latestCollectionVersion;
			
			//TODO: add collectionsVersion as last version in any of these items?
			//or store it somewhere else for indexedDB cache purposes
			library.collections.initSecondaryData();
			library.collections.loaded = true;
		});
		
		tagsPromise.then(function(tagsArray){
			log.debug('loadIndexedDBCache tagsD done', 3);
			log.debug(tagsArray, 4);
			//create tagsDump from array of tag objects
			var latestVersion = 0;
			var tagsVersion = 0;
			for(var i = 0; i < tagsArray.length; i++){
				var tag = new Zotero.Tag(tagsArray[i]);
				library.tags.addTag(tag);
				if(tagsArray[i].version > latestVersion){
					latestVersion = tagsArray[i].version;
				}
			}
			tagsVersion = latestVersion;
			library.tags.tagsVersion = tagsVersion;

			//TODO: add tagsVersion as last version in any of these items?
			//or store it somewhere else for indexedDB cache purposes
			library.tags.loaded = true;
		});
		
		
		//resolve the overall deferred when all the child deferreds are finished
		return Promise.all([itemsPromise, collectionsPromise, tagsPromise]);
	}

	saveIndexedDB(){
		var library = this;
		
		var saveItemsPromise = library.idbLibrary.updateItems(library.items.itemsArray);
		var saveCollectionsPromise = library.idbLibrary.updateCollections(library.collections.collectionsArray);
		var saveTagsPromise = library.idbLibrary.updateTags(library.tags.tagsArray);
		
		//resolve the overall deferred when all the child deferreds are finished
		return Promise.all([saveItemsPromise, saveCollectionsPromise, saveTagsPromise]);
	}
}

/**
 * Items columns for which sorting is supported
 * @type {Array}
 */
Library.sortableColumns = ['title',
							'creator',
							'itemType',
							'date',
							'year',
							'publisher',
							'publicationTitle',
							'journalAbbreviation',
							'language',
							'accessDate',
							'libraryCatalog',
							'callNumber',
							'rights',
							'dateAdded',
							'dateModified',
							/*'numChildren',*/
							'addedBy'
							/*'modifiedBy'*/];
/**
 * Columns that can be displayed in an items table UI
 * @type {Array}
 */
Library.displayableColumns = ['title',
								'creator',
								'itemType',
								'date',
								'year',
								'publisher',
								'publicationTitle',
								'journalAbbreviation',
								'language',
								'accessDate',
								'libraryCatalog',
								'callNumber',
								'rights',
								'dateAdded',
								'dateModified',
								'numChildren',
								'addedBy'
								/*'modifiedBy'*/];
/**
 * Items columns that only apply to group libraries
 * @type {Array}
 */
Library.groupOnlyColumns = ['addedBy'
							/*'modifiedBy'*/];

export {Library};

