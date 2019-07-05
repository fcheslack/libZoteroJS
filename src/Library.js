import { Fetcher } from '../lib/Fetcher.js';


import { Logger } from './Log.js';
const log = new Logger('libZotero:Library');

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
	constructor(type, libraryID, libraryUrlIdentifier, apiKey) {
		log.debug('Zotero.Library constructor', 3);
		log.debug('Library Constructor: ' + type + ' ' + libraryID + ' ', 3);
		var library = this;
		log.debug(libraryUrlIdentifier, 4);
		this.instance = 'Zotero.Library';
		this.libraryVersion = 0;
		this.syncState = {
			earliestVersion: null,
			latestVersion: null
		};
		this._apiKey = apiKey || '';
		
		this.libraryUrlIdentifier = libraryUrlIdentifier;
		if (Zotero.config.librarySettings) {
			this.libraryBaseWebsiteUrl = Zotero.config.librarySettings.libraryPathString;
		} else {
			this.libraryBaseWebsiteUrl = Zotero.config.baseWebsiteUrl;
			if (type == 'group') {
				this.libraryBaseWebsiteUrl += 'groups/';
			}
			if (libraryUrlIdentifier) {
				this.libraryBaseWebsiteUrl += libraryUrlIdentifier + '/items';
			} else {
				log.warn('no libraryUrlIdentifier specified');
			}
		}
		// object holders within this library, whether tied to a specific library or not
		this.items = new Zotero.Items();
		this.items.owningLibrary = library;
		this.itemKeys = [];
		this.collections = new Zotero.Collections();
		this.collections.libraryUrlIdentifier = this.libraryUrlIdentifier;
		this.collections.owningLibrary = library;
		this.tags = new Zotero.Tags();
		this.searches = new Zotero.Searches();
		this.searches.owningLibrary = library;
		this.groups = new Zotero.Groups();
		this.groups.owningLibrary = library;
		this.deleted = new Zotero.Deleted();
		this.deleted.owningLibrary = library;
		
		if (!type) {
			// return early if library not specified
			log.warn('No type specified for library');
			return;
		}
		// attributes tying instance to a specific Zotero library
		this.type = type;
		this.libraryType = type;
		this.libraryID = libraryID;
		this.libraryString = Zotero.utils.libraryString(this.libraryType, this.libraryID);
		this.libraryUrlIdentifier = libraryUrlIdentifier;
		
		// initialize preferences object
		this.preferences = new Zotero.Preferences(Zotero.store, this.libraryString);
		
		if (typeof window === 'undefined') {
			if (Zotero.config.useIndexedDB) {
				// warn if we would otherwise have used IDB
				Zotero.config.useIndexedDB = false;
				log.warn('Node detected; disabling indexedDB');
			}
		} else {
			// initialize indexedDB if we're supposed to use it
			// detect safari until they fix their shit
			var isChrome = navigator.userAgent.indexOf('Chrome') > -1;
			var isExplorer = navigator.userAgent.indexOf('MSIE') > -1;
			// var isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
			var isSafari = navigator.userAgent.indexOf('Safari') > -1;
			var isOpera = navigator.userAgent.toLowerCase().indexOf('op') > -1;
			if ((isChrome) && (isSafari)) {
				isSafari = false;
			}
			if ((isChrome) && (isOpera)) {
				isChrome = false;
			}
			if (isSafari || isExplorer) {
				Zotero.config.useIndexedDB = false;
				log.warn('Safari detected; disabling indexedDB');
			}
		}

		if (Zotero.config.useIndexedDB === true) {
			log.debug('Library Constructor: indexedDB init', 3);
			var idbLibrary = new Zotero.Idb.Library(this.libraryString);
			idbLibrary.owningLibrary = this;
			this.idbLibrary = idbLibrary;
			this.cachedDataPromise = idbLibrary.init()
				.then(async () => {
					log.debug('Library Constructor: idbInitD Done', 3);
					if (Zotero.config.preloadCachedLibrary === true) {
						log.debug('Library Constructor: preloading cached library', 3);
						try {
							await this.loadIndexedDBCache();// resolved with items, collections, and tags promises we don't use
							// TODO: any stuff that needs to execute only after cache is loaded
							// possibly fire new events to cause display to refresh after load
							log.debug('Library Constructor: Library.items.itemsVersion: ' + this.items.itemsVersion, 3);
							log.debug('Library Constructor: Library.collections.collectionsVersion: ' + this.collections.collectionsVersion, 3);
							log.debug('Library Constructor: Library.tags.tagsVersion: ' + this.tags.tagsVersion, 3);
							log.debug('Library Constructor: Triggering cachedDataLoaded', 3);
							this.trigger('cachedDataLoaded');
						} catch (err) {
							log.error('Error loading cached library');
							log.error(err);
							throw new Error('Error loading cached library');
						}
					} else {
						// trigger cachedDataLoaded since we are done with that step
						this.trigger('cachedDataLoaded');
					}
					return null;
				}).catch(() => {
					// can't use indexedDB. Set to false in config and trigger error to notify user
					Zotero.config.useIndexedDB = false;
					this.trigger('indexedDBError');
					this.trigger('cachedDataLoaded');
					log.error('Error initializing indexedDB. Promise rejected.');
					// don't re-throw error, since we can still load data from the API
				});
		} else {
			this.cachedDataPromise = Promise.resolve();
		}
		
		this.dirty = false;
		
		// set noop data-change callbacks
		this.tagsChanged = function () {};
		this.collectionsChanged = function () {};
		this.itemsChanged = function () {};
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
	static comparer() {
		if (Intl) {
			return new Intl.Collator().compare;
		} else {
			return function (a, b) {
				if (a.toLocaleLowerCase() == b.toLocaleLowerCase()) {
					return 0;
				}
				if (a.toLocaleLowerCase() < b.toLocaleLowerCase()) {
					return -1;
				}
				return 1;
			};
		}
	}

	// Zotero library wrapper around jQuery ajax that returns a jQuery promise
	// @url String url to request or object for input to apiRequestUrl and query string
	// @type request method
	// @options jquery options that are not the default for Zotero requests
	ajaxRequest(url, type, options) {
		log.debug('Library.ajaxRequest', 3);
		if (!type) {
			type = 'GET';
		}
		if (!options) {
			options = {};
		}
		var requestObject = {
			url: url,
			type: type
		};
		requestObject = Object.assign({}, requestObject, options);
		if (!requestObject.key && (this._apiKey != '')) {
			requestObject.key = this._apiKey;
		}
		log.debug(requestObject, 3);
		return Zotero.net.apiRequest(requestObject);
	}

	// Take an array of objects that specify Zotero API requests and perform them
	// in sequence.
	// return deferred that gets resolved when all requests have gone through.
	// Update versions after each request, otherwise subsequent writes won't go through.
	// or do we depend on specified callbacks to update versions if necessary?
	// fail on error?
	// request object must specify: url, method, body, headers, success callback, fail callback(?)

	/**
	 * Take an array of objects that specify Zotero API requests and perform them
	 * in sequence. Return a promise that gets resolved when all requests have
	 * gone through.
	 * @param  {[] Objects} requests Array of objects specifying requests to be made
	 * @return {Promise}          Promise that resolves/rejects along with requests
	 */
	sequentialRequests = async (requests) => {
		log.debug('Zotero.Library.sequentialRequests', 3);
		let responses = [];
		for (let i = 0; i < requests.length; i++) {
			let request = requests[i];
			let resp = await this.ajaxRequest(null, null, request);
			responses.push(resp);
		}
		return responses;
	}
	

	/**
	 * Generate a website url based on a dictionary of variables and the configured
	 * libraryBaseWebsiteUrl
	 * @param  {Object} urlvars Dictionary of key/value variables
	 * @return {string}         website url
	 */
	websiteUrl(urlvars) {
		log.debug('Zotero.library.websiteUrl', 3);
		log.debug(urlvars, 4);
		var urlVarsArray = [];
		Object.keys(urlvars).forEach(function (key) {
			var value = urlvars[key];
			if (value === '') return;
			urlVarsArray.push(key + '/' + value);
		});
		urlVarsArray.sort();
		log.debug(urlVarsArray, 4);
		var pathVarsString = urlVarsArray.join('/');
		
		return this.libraryBaseWebsiteUrl + '/' + pathVarsString;
	}

	synchronize() {
		// get updated group metadata if applicable
		//  (this is an individual library method, so only necessary if this is
		//  a group library and we want to keep info about it)
		// sync library data
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
	async loadUpdatedItems() {
		log.debug('Zotero.Library.loadUpdatedItems', 3);
		// sync from the libraryVersion if it exists, otherwise use the itemsVersion, which is likely
		// derived from the most recent version of any individual item we have.
		var syncFromVersion = this.libraryVersion ? this.libraryVersion : this.items.itemsVersion;
		const response = await Promise.resolve(this.updatedVersions('items', syncFromVersion));
		log.debug('itemVersions resolved', 3);
		log.debug('items Last-Modified-Version: ' + response.lastModifiedVersion, 3);
		this.items.updateSyncState(response.lastModifiedVersion);
		var itemVersions = response.data;
		this.itemVersions = itemVersions;
		var itemKeys = [];
		Object.keys(itemVersions).forEach(function (key) {
			var val = itemVersions[key];
			var item = this.items.getItem(key);
			if ((!item) || (item.apiObj.key != val)) {
				itemKeys.push(key);
			}
		});
		await this.loadItemsFromKeys(itemKeys);
		log.debug('loadItemsFromKeys resolved', 3);
		this.items.updateSyncedVersion();
		// TODO: library needs its own state
		if (Zotero.state) {
			var displayParams = Zotero.state.getUrlVars();
			this.buildItemDisplayView(displayParams);
		}
		// save updated items to IDB
		if (Zotero.config.useIndexedDB) {
			await this.idbLibrary.updateItems(this.items.objectArray);
		}
	}

	async loadUpdatedCollections() {
		log.debug('Zotero.Library.loadUpdatedCollections', 3);
		// sync from the libraryVersion if it exists, otherwise use the collectionsVersion, which is likely
		// derived from the most recent version of any individual collection we have.
		log.debug('library.collections.collectionsVersion:' + this.collections.collectionsVersion, 4);
		// var syncFromVersion = this.libraryVersion ? this.libraryVersion : this.collections.collectionsVersion;
		var syncFromVersion = this.collections.collectionsVersion;
		log.debug(`loadUpdatedCollections syncFromVersion: ${syncFromVersion}`, 3);
		// we need modified collectionKeys regardless, so load them
		let versionResponse = await this.updatedVersions('collections', syncFromVersion);
		log.debug('collectionVersions finished', 3);
		log.debug('Collections Last-Modified-Version: ' + versionResponse.lastModifiedVersion, 3);
		// start the syncState version tracking. This should be the earliest version throughout
		this.collections.updateSyncState(versionResponse.lastModifiedVersion);
	
		var collectionVersions = versionResponse.data;
		this.collectionVersions = collectionVersions;
		var collectionKeys = [];
		Object.keys(collectionVersions).forEach(function (key) {
			var val = collectionVersions[key];
			var c = this.collections.getCollection(key);
			if ((!c) || (c.apiObj.version != val)) {
				collectionKeys.push(key);
			}
		});
		if (collectionKeys.length === 0) {
			log.debug('No collectionKeys need updating. resolving', 3);
		} else {
			log.debug('fetching collections by key', 3);
			await this.loadCollectionsFromKeys(collectionKeys);
			this.collections.initSecondaryData();
	
			log.debug('All updated collections loaded', 3);
			this.collections.updateSyncedVersion();
			// TODO: library needs its own state
	
			// save updated collections to cache
			log.debug('loadUpdatedCollections complete - saving collections to cache before resolving', 3);
			log.debug('collectionsVersion: ' + this.collections.collectionsVersion, 3);
			// this.saveCachedCollections();
			// save updated collections to IDB
			if (Zotero.config.useIndexedDB) {
				return this.idbLibrary.updateCollections(this.collections.collectionsArray);
			}
		}
		log.debug('done getting collection data. requesting deleted data', 3);
		await this.getDeleted(this.libraryVersion); // data is saved to Library.deleted so we don't need the promise
		log.debug('got deleted collections data: removing local copies', 3);
		log.debug(this.deleted, 3);
		if (this.deleted.deletedData.collections && this.deleted.deletedData.collections.length > 0) {
			this.collections.removeLocalCollections(this.deleted.deletedData.collections);
		}
		return null;
	}

	async loadUpdatedTags() {
		log.debug('Zotero.Library.loadUpdatedTags', 3);
		log.debug('tagsVersion: ' + this.tags.tagsVersion, 3);
		await Promise.resolve(this.loadAllTags({ since: this.tags.tagsVersion }));
		log.debug('done getting tags, request deleted tags data', 3);
		await this.getDeleted(this.libraryVersion);
		log.debug('got deleted tags data', 3);
		if (this.deleted.deletedData.tags && this.deleted.deletedData.tags.length > 0) {
			this.tags.removeTags(this.deleted.deletedData.tags);
		}
		// save updated tags to IDB
		if (Zotero.config.useIndexedDB) {
			log.debug('saving updated tags to IDB', 3);
			await this.idbLibrary.updateTags(this.tags.tagsArray);
		}
	}

	async getDeleted(version) {
		log.debug('Zotero.Library.getDeleted', 3);
		var urlconf = {
			target: 'deleted',
			libraryType: this.libraryType,
			libraryID: this.libraryID,
			since: version
		};
		
		// if there is already a request working, create a new promise to resolve
		// when the actual request finishes
		if (this.deleted.pending) {
			log.debug('getDeleted resolving with previously pending promise', 3);
			return this.deleted.pendingPromise;
		}
		
		// don't fetch again if version we'd be requesting is between
		// deleted.newer and delete.deleted versions, just use that one
		log.debug('version:' + version, 3);
		log.debug('sinceVersion:' + this.deleted.sinceVersion, 3);
		log.debug('untilVersion:' + this.deleted.untilVersion, 3);
		
		if (this.deleted.untilVersion
			&& version >= this.deleted.sinceVersion /* &&
			version < this.deleted.untilVersion*/) {
			log.debug('deletedVersion matches requested: immediately resolving', 3);
			return this.deleted.deletedData;
		}
		
		this.deleted.pending = true;
		let response = await this.ajaxRequest(urlconf);
		this.deleted.pendingPromise = response;
		
		log.debug('got deleted response', 3);
		this.deleted.deletedData = response.data;
		log.debug('Deleted Last-Modified-Version:' + response.lastModifiedVersion, 3);
		this.deleted.untilVersion = response.lastModifiedVersion;
		this.deleted.sinceVersion = version;
		log.debug('cleaning up deleted pending', 3);
		this.deleted.pending = false;
		this.deleted.pendingPromise = false;
		
		return response;
	}

	processDeletions(deletions) {
		// process deleted collections
		this.collections.processDeletions(deletions.collections);
		// process deleted items
		this.items.processDeletions(deletions.items);
	}

	// Get a full bibliography from the API for web based citating
	async loadFullBib(itemKeys, style) {
		var itemKeyString = itemKeys.join(',');
		var urlconfig = {
			target: 'items',
			libraryType: this.libraryType,
			libraryID: this.libraryID,
			itemKey: itemKeyString,
			format: 'bib',
			linkwrap: '1'
		};
		if (itemKeys.length == 1) {
			urlconfig.target = 'item';
		}
		if (style) {
			urlconfig.style = style;
		}
		
		let response = await this.ajaxRequest(urlconfig);
		return response.data;
	}

	// load bib for a single item from the API
	async loadItemBib(itemKey, style) {
		log.debug('Zotero.Library.loadItemBib', 3);
		var urlconfig = {
			target: 'item',
			libraryType: this.libraryType,
			libraryID: this.libraryID,
			itemKey: itemKey,
			content: 'bib'
		};
		if (style) {
			urlconfig.style = style;
		}
		
		let response = await this.ajaxRequest(urlconfig);
		var item = new Zotero.Item(response.data);
		var bibContent = item.apiObj.bib;
		return bibContent;
	}

	// load library settings from Zotero API and return a promise that gets resolved with
	// the Zotero.Preferences object for this library
	async loadSettings() {
		log.debug('Zotero.Library.loadSettings', 3);
		var urlconfig = {
			target: 'settings',
			libraryType: this.libraryType,
			libraryID: this.libraryID
		};
		
		let response = await this.ajaxRequest(urlconfig);
		let resultObject;
		if (typeof response.data == 'string') {
			resultObject = JSON.parse(response.data);
		} else {
			resultObject = response.data;
		}
		// save the full settings object so we have it available if we need to write,
		// even if it has settings we don't use or know about
		this.preferences.setPref('settings', resultObject);
		
		this.trigger('settingsLoaded');
		return this.preferences;
	}

	// take an array of tags and return subset of tags that should be colored, along with
	// the colors they should be
	matchColoredTags(tags) {
		if (!this.tagColors) {
			// pull out the settings we know we care about so we can query them directly
			let tagColors = [];
			let settings = this.preferences.getPref('settings');
			if (settings && settings.hasOwnProperty('tagColors')) {
				tagColors = settings.tagColors.value;
			}
			this.tagColors = new Zotero.TagColors(tagColors);
		}
		
		return this.tagColors.match(tags);
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
	static sendToLibrary(items, foreignLibrary) {
		var foreignItems = [];
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var transferData = item.emptyJsonItem();
			transferData.data = Object.assign({}, items[i].apiObj.data);
			// clear data that shouldn't be transferred:itemKey, collections
			transferData.data.key = '';
			transferData.data.version = 0;
			transferData.data.collections = [];
			delete transferData.data.dateModified;
			delete transferData.data.dateAdded;
			
			var newForeignItem = new Zotero.Item(transferData);
			
			newForeignItem.pristine = Object.assign({}, newForeignItem.apiObj);
			newForeignItem.initSecondaryData();
			
			// set relationship to tie to old item
			if (!newForeignItem.apiObj.data.relations) {
				newForeignItem.apiObj.data.relations = {};
			}
			newForeignItem.apiObj.data.relations['owl:sameAs'] = Zotero.url.relationUrl(item.owningLibrary.libraryType, item.owningLibrary.libraryID, item.key);
			foreignItems.push(newForeignItem);
		}
		return foreignLibrary.items.writeItems(foreignItems);
	}

	/* METHODS FOR WORKING WITH THE ENTIRE LIBRARY -- NOT FOR GENERAL USE */

	// sync pull:
	// upload changed data
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

	updatedVersions(target = 'items', version = this.libraryVersion) {
		log.debug('Library.updatedVersions', 3);
		var urlconf = {
			target: target,
			format: 'versions',
			libraryType: this.libraryType,
			libraryID: this.libraryID,
			since: version
		};
		return this.ajaxRequest(urlconf);
	}

	// Download and save information about every item in the library
	// keys is an array of itemKeys from this library that we need to download
	loadItemsFromKeys(keys) {
		log.debug('Zotero.Library.loadItemsFromKeys', 3);
		return this.loadFromKeys(keys, 'items');
	}

	// keys is an array of collectionKeys from this library that we need to download
	loadCollectionsFromKeys(keys) {
		log.debug('Zotero.Library.loadCollectionsFromKeys', 3);
		return this.loadFromKeys(keys, 'collections');
	}

	// keys is an array of searchKeys from this library that we need to download
	loadSeachesFromKeys(keys) {
		log.debug('Zotero.Library.loadSearchesFromKeys', 3);
		return this.loadFromKeys(keys, 'searches');
	}

	loadFromKeys(keys, objectType) {
		log.debug('Zotero.Library.loadFromKeys', 3);
		if (!objectType) objectType = 'items';
		var library = this;
		var keyslices = [];
		while (keys.length > 0) {
			keyslices.push(keys.splice(0, 50));
		}
		
		var requestObjects = [];
		keyslices.forEach(function (keyslice) {
			var keystring = keyslice.join(',');
			switch (objectType) {
			case 'items':
				requestObjects.push({
					url: {
						target: 'items',
						targetModifier: null,
						itemKey: keystring,
						limit: 50,
						libraryType: library.libraryType,
						libraryID: library.libraryID
					},
					type: 'GET',
					success: library.processLoadedItems.bind(library)
				});
				break;
			case 'collections':
				requestObjects.push({
					url: {
						target: 'collections',
						targetModifier: null,
						collectionKey: keystring,
						limit: 50,
						libraryType: library.libraryType,
						libraryID: library.libraryID
					},
					type: 'GET',
					success: library.processLoadedCollections.bind(library)
				});
				break;
			case 'searches':
				requestObjects.push({
					url: {
						target: 'searches',
						targetModifier: null,
						searchKey: keystring,
						limit: 50,
						libraryType: library.libraryType,
						libraryID: library.libraryID
					},
					type: 'GET'
					// success: library.processLoadedSearches.bind(library)
				});
				break;
			}
		});
		
		var promises = [];
		for (var i = 0; i < requestObjects.length; i++) {
			let url = requestObjects[i].url;
			let type = requestObjects[i].type;
			let options = {
				success: requestObjects[i].success
			};
			promises.push(library.ajaxRequest(url, type, options));
		}
		return Promise.all(promises);
	}

	// publishes: displayedItemsUpdated
	// assume we have up to date information about items in indexeddb.
	// build a list of indexedDB filter requests to then intersect to get final result
	buildItemDisplayView(params) {
		log.debug('Zotero.Library.buildItemDisplayView', 3);
		log.debug(params, 4);
		// start with list of all items if we don't have collectionKey
		// otherwise get the list of items in that collection
		var library = this;
		// short-circuit if we don't have an initialized IDB yet
		if (!library.idbLibrary.db) {
			return Promise.resolve([]);
		}
		
		var filterPromises = [];
		if (params.collectionKey) {
			if (params.collectionKey == 'trash') {
				filterPromises.push(library.idbLibrary.filterItems('deleted', 1));
			} else {
				filterPromises.push(library.idbLibrary.filterItems('collectionKeys', params.collectionKey));
			}
		} else {
			filterPromises.push(library.idbLibrary.getOrderedItemKeys('title'));
		}
		
		// filter by selected tags
		var selectedTags = params.tag || [];
		if (typeof selectedTags == 'string') selectedTags = [selectedTags];
		for (var i = 0; i < selectedTags.length; i++) {
			log.debug('adding selected tag filter', 3);
			filterPromises.push(library.idbLibrary.filterItems('itemTagStrings', selectedTags[i]));
		}
		
		// TODO: filter by search term.
		// (need full text array or to decide what we're actually searching on to implement this locally)
		
		// when all the filters have been applied, combine and sort
		return Promise.all(filterPromises)
			.then(function (results) {
				var i;
				for (i = 0; i < results.length; i++) {
					log.debug('result from filterPromise: ' + results[i].length, 3);
					log.debug(results[i], 3);
				}
				var finalItemKeys = library.idbLibrary.intersectAll(results);
				var itemsArray = library.items.getItems(finalItemKeys);
			
				log.debug('All filters applied - Down to ' + itemsArray.length + ' items displayed', 3);
			
				log.debug('remove child items and, if not viewing trash, deleted items', 3);
				var displayItemsArray = [];
				for (i = 0; i < itemsArray.length; i++) {
					if (itemsArray[i].apiObj.data.parentItem) {
						continue;
					}
				
					if (params.collectionKey != 'trash' && itemsArray[i].apiObj.deleted) {
						continue;
					}
				
					displayItemsArray.push(itemsArray[i]);
				}
			
				// sort displayedItemsArray by given or configured column
				var orderCol = params.order || 'title';
				var sort = params.sort || 'asc';
				log.debug('Sorting by ' + orderCol + ' - ' + sort, 3);
			
				var comparer = Library.comparer();
			
				displayItemsArray.sort(function (a, b) {
					var aval = a.get(orderCol);
					var bval = b.get(orderCol);
				
					return comparer(aval, bval);
				});
			
				if (sort == 'desc') {
					log.debug('sort is desc - reversing array', 4);
					displayItemsArray.reverse();
				}
			
				// publish event signalling we're done
				log.debug('triggering publishing displayedItemsUpdated', 3);
				library.trigger('displayedItemsUpdated');
				return displayItemsArray;
			});
	}

	trigger(eventType, data) {
		Zotero.trigger(eventType, data, this.libraryString);
	}

	listen(events, handler, data) {
		var filter = this.libraryString;
		Zotero.listen(events, handler, data, filter);
	}

	// CollectionFunctions
	processLoadedCollections(response) {
		log.debug('processLoadedCollections', 3);
		// clear out display items
		log.debug('adding collections to library.collections', 3);
		var collectionsAdded = this.collections.addCollectionsFromJson(response.data);
		for (var i = 0; i < collectionsAdded.length; i++) {
			collectionsAdded[i].associateWithLibrary(this);
		}
		// update sync state
		this.collections.updateSyncState(response.lastModifiedVersion);
		
		Zotero.trigger('loadedCollectionsProcessed', { library: this, collectionsAdded: collectionsAdded });
		return response;
	}

	// create+write a collection given a name and optional parentCollectionKey
	addCollection(name, parentCollection) {
		log.debug('Zotero.Library.addCollection', 3);
		var collection = new Zotero.Collection();
		collection.associateWithLibrary(this);
		collection.set('name', name);
		collection.set('parentCollection', parentCollection);
		
		return this.collections.writeCollections([collection]);
	}

	// ItemFunctions
	// make request for item keys and return jquery ajax promise
	fetchItemKeys(config = {}) {
		log.debug('Zotero.Library.fetchItemKeys', 3);
		var urlconfig = Object.assign(true, {
			target: 'items',
			libraryType: this.libraryType,
			libraryID: this.libraryID,
			format: 'keys'
		}, config);
		
		return this.ajaxRequest(urlconfig);
	}

	// get keys of all items marked for deletion
	getTrashKeys() {
		log.debug('Zotero.Library.getTrashKeys', 3);
		var urlconfig = {
			target: 'items',
			libraryType: this.libraryType,
			libraryID: this.libraryID,
			format: 'keys',
			collectionKey: 'trash'
		};
		
		return this.ajaxRequest(urlconfig);
	}

	async emptyTrash() {
		log.debug('Zotero.Library.emptyTrash', 3);
		let response = await this.getTrashKeys();
		var trashedItemKeys = response.data.split('\n');
		return this.items.deleteItems(trashedItemKeys, response.lastModifiedVersion);
	}

	// gets the full set of item keys that satisfy `config`
	async loadItemKeys(config) {
		log.debug('Zotero.Library.loadItemKeys', 3);
		const response = await this.fetchItemKeys(config);
		log.debug('loadItemKeys response received', 3);
		var keys = response.data.split(/[\s]+/);
		this.itemKeys = keys;
	}

	// loads a set of items specified by `config`
	// The items are added to this Library's items container, as well included as an array of Zotero.Item
	// on the returned promise as `response.loadedItems`
	async loadItems(config = {}) {
		log.debug('Zotero.Library.loadItems', 3);
		var defaultConfig = {
			target: 'items',
			targetModifier: 'top',
			start: 0,
			limit: 25,
			order: Zotero.config.defaultSortColumn,
			sort: Zotero.config.defaultSortOrder
		};
		
		// Build config object that should be displayed next and compare to currently displayed
		var newConfig = Object.assign({}, defaultConfig, config);
		// newConfig.start = parseInt(newConfig.limit, 10) * (parseInt(newConfig.itemPage, 10) - 1);
		
		var urlconfig = Object.assign({
			target: 'items',
			libraryType: this.libraryType,
			libraryID: this.libraryID
		}, newConfig);
		
		const response = await this.ajaxRequest(urlconfig);
		log.debug('loadItems proxied callback', 3);
		
		// clear out display items
		var loadedItemsArray = this.items.addItemsFromJson(response.data);
		for (let i = 0; i < loadedItemsArray.length; i++) {
			loadedItemsArray[i].associateWithLibrary(this);
		}
	
		response.loadedItems = loadedItemsArray;
		Zotero.trigger('itemsChanged', { library: this });
		return response;
	}

	async loadPublications(config = {}) {
		log.debug('Zotero.Library.loadPublications', 3);
		var defaultConfig = {
			target: 'publications',
			start: 0,
			limit: 50,
			order: Zotero.config.defaultSortColumn,
			sort: Zotero.config.defaultSortOrder,
			include: 'bib'
		};
		
		// Build config object that should be displayed next and compare to currently displayed
		var newConfig = Object.assign({}, defaultConfig, config);
		
		var urlconfig = Object.assign({
			target: 'publications',
			libraryType: this.libraryType,
			libraryID: this.libraryID
		}, newConfig);
		
		let response = await this.ajaxRequest(urlconfig);
		log.debug('loadPublications response received', 3);
		let publicationItems = [];
		let parsedItemJson = response.data;
		parsedItemJson.forEach((itemObj) => {
			var item = new Zotero.Item(itemObj);
			publicationItems.push(item);
		});
	
		response.publicationItems = publicationItems;
		return response;
	}

	processLoadedItems(response) {
		log.debug('processLoadedItems', 3);
		// clear out display items
		var loadedItemsArray = this.items.addItemsFromJson(response.data);
		for (var i = 0; i < loadedItemsArray.length; i++) {
			loadedItemsArray[i].associateWithLibrary(this);
		}
		
		// update sync state
		this.items.updateSyncState(response.lastModifiedVersion);
		
		Zotero.trigger('itemsChanged', { library: this, loadedItems: loadedItemsArray });
		return response;
	}

	async loadItem(itemKey) {
		log.debug('Zotero.Library.loadItem', 3);
		var urlconfig = {
			target: 'item',
			libraryType: this.libraryType,
			libraryID: this.libraryID,
			itemKey: itemKey
		};
		
		let response = await this.ajaxRequest(urlconfig);
		log.debug('Got loadItem response', 3);
		let item = new Zotero.Item(response.data);
		item.owningLibrary = this;
		this.items.itemObjects[item.key] = item;
		Zotero.trigger('itemsChanged', { library: this });
		return (item);
	}

	trashItem(itemKey) {
		return this.items.trashItems([this.items.getItem(itemKey)]);
	}

	untrashItem(itemKey) {
		log.debug('Zotero.Library.untrashItem', 3);
		if (!itemKey) return false;
		
		var item = this.items.getItem(itemKey);
		item.apiObj.deleted = 0;
		return item.writeItem();
	}

	deleteItem(itemKey) {
		log.debug('Zotero.Library.deleteItem', 3);
		return this.items.deleteItem(itemKey);
	}

	deleteItems(itemKeys) {
		log.debug('Zotero.Library.deleteItems', 3);
		return this.items.deleteItems(itemKeys);
	}

	/*
	addNote(itemKey, note) {
		log.debug('Zotero.addNote', 3);
		var config = {
			target: 'children',
			libraryType: this.libraryType,
			libraryID: this.libraryID,
			itemKey: itemKey
		};
		
		var item = this.items.getItem(itemKey);
		
		return this.ajaxRequest(config, 'POST', { processData: false });
	}
	*/
	/*
	fetchGlobalItems(config) {
		log.debug('Zotero.Library.fetchGlobalItems', 3);
		var library = this;
		if (!config) {
			config = {};
		}
		
		var defaultConfig = {
			target: 'items',
			start: 0,
			limit: 25
		};
		
		// Build config object that should be displayed next and compare to currently displayed
		var newConfig = Object.assign({}, defaultConfig, config);
		
		var urlconfig = Object.assign({ target: 'items', libraryType: '' }, newConfig);
		
		return library.ajaxRequest(urlconfig, 'GET', { dataType: 'json' })
			.then(function (response) {
				log.debug('globalItems callback', 3);
				return (response.data);
			});
	}
	*/
	/*
	fetchGlobalItem(globalKey) {
		log.debug('Zotero.Library.fetchGlobalItem', 3);
		log.debug(globalKey, 3);
		var library = this;
		
		var defaultConfig = { target: 'item' };
		
		// Build config object that should be displayed next and compare to currently displayed
		var newConfig = Object.assign({}, defaultConfig);
		var urlconfig = Object.assign({
			target: 'item',
			libraryType: '',
			itemKey: globalKey
		}, newConfig);
		
		return library.ajaxRequest(urlconfig, 'GET', { dataType: 'json' })
			.then(function (response) {
				log.debug('globalItem callback', 3);
				return (response.data);
			});
	}
	*/
	// TagFunctions
	fetchTags(config) {
		log.debug('Zotero.Library.fetchTags', 3);
		var defaultConfig = {
			target: 'tags',
			order: 'title',
			sort: 'asc',
			limit: 100
		};
		var newConfig = Object.assign({}, defaultConfig, config);
		var urlconfig = Object.assign({
			target: 'tags',
			libraryType: this.libraryType,
			libraryID: this.libraryID
		}, newConfig);
		
		return this.ajaxRequest(urlconfig);
	}

	async loadTags(config = {}) {
		log.debug('Zotero.Library.loadTags', 3);
		if (config.showAutomaticTags && config.collectionKey) {
			delete config.collectionKey;
		}
		
		this.tags.displayTagsArray = [];
		let response = await this.fetchTags(config);
		log.debug('loadTags response received', 3);
		var updatedVersion = response.lastModifiedVersion;
		this.tags.updateSyncState(updatedVersion);
		this.tags.addTagsFromJson(response.data);
		this.tags.updateTagsVersion(updatedVersion);
		this.tags.rebuildTagsArray();
	
		if (response.parsedLinks.hasOwnProperty('next')) {
			this.tags.hasNextLink = true;
			this.tags.nextLink = response.parsedLinks.next;
		} else {
			this.tags.hasNextLink = false;
			this.tags.nextLink = null;
		}
		this.trigger('tagsChanged', { library: this });
		return this.tags;
	}


	async loadAllTags(config = {}) {
		log.debug('Zotero.Library.loadAllTags', 3);
		var defaultConfig = {
			target: 'tags',
			order: 'title',
			sort: 'asc',
			limit: 100,
			libraryType: this.libraryType,
			libraryID: this.libraryID
		};
		
		// Build config object that should be displayed next and compare to currently displayed
		var newConfig = Object.assign({}, defaultConfig, config);
		var urlconfig = Object.assign({}, newConfig);
		
		// TODO: check if already loaded tags are okay to use
		
		let fetcher = new Fetcher(urlconfig);
		await fetcher.fetchAll();
		
		let updatedVersion = fetcher.responses[0].lastModifiedVersion;
		this.tags.clear();
		this.tags.updateSyncState(updatedVersion);
		this.tags.addTagsFromJson(fetcher.results);
		this.tags.updateTagsVersion(updatedVersion);
		this.tags.rebuildTagsArray();
		this.tags.updateSecondaryData();
		
		return null;
		
		/*
		let allTagsBare = fetcher.results;
		let allTags = allTagsBare.map((bareTag) => {
			return Zotero.Tag(bareTag);
		});
		this.tags.clear();
		allTags.forEach((tag) => {
			this.tags.addTag(tag);
		});
		this.tags.updateSecondaryData();
		this.tags.tagsArray.forEach((tag) => {
			tag.apiObj.version = this.tags.tagsVersion;
		});
		
		let tags = await library.loadTags(urlconfig);
		return new Promise(function (resolve, reject) {
			var continueLoadingCallback = function (tags) {
				log.debug('loadAllTags continueLoadingCallback', 3);
				var plainList = Zotero.Tags.prototype.plainTagsList(tags.tagsArray);
				plainList.sort(Library.comparer());
				tags.plainList = plainList;
				
				if (tags.hasNextLink) {
					log.debug('still has next link.', 3);
					tags.tagsArray.sort(Zotero.Tag.prototype.tagComparer());
					plainList = Zotero.Tags.prototype.plainTagsList(tags.tagsArray);
					plainList.sort(Library.comparer());
					tags.plainList = plainList;
					
					var nextLink = tags.nextLink;
					var nextLinkConfig = Zotero.utils.parseQuery(Zotero.utils.querystring(nextLink));
					var newConfig = Object.assign({}, config);
					newConfig.start = nextLinkConfig.start;
					newConfig.limit = nextLinkConfig.limit;
					return this.loadTags(newConfig).then(continueLoadingCallback);
				} else {
					log.debug('no next in tags link', 3);
					tags.updateSyncedVersion();
					tags.tagsArray.sort(Zotero.Tag.prototype.tagComparer());
					plainList = Zotero.Tags.prototype.plainTagsList(tags.tagsArray);
					plainList.sort(Library.comparer());
					tags.plainList = plainList;
					log.debug('resolving loadTags deferred', 3);
					this.tagsLoaded = true;
					this.tags.loaded = true;
					tags.loadedConfig = config;
					
					// update all tags with tagsVersion
					for (var i = 0; i < this.tags.tagsArray.length; i++) {
						tags.tagsArray[i].apiObj.version = tags.tagsVersion;
					}
					
					this.trigger('tagsChanged', { library: library });
					return tags;
				}
			};
			
			resolve(library.loadTags(urlconfig)
				.then(continueLoadingCallback));
		});
		*/
	}

	// LibraryCache
	// load objects from indexedDB
	loadIndexedDBCache() {
		log.debug('Zotero.Library.loadIndexedDBCache', 3);
		
		var library = this;
		
		var itemsPromise = library.idbLibrary.getAllItems();
		var collectionsPromise = library.idbLibrary.getAllCollections();
		var tagsPromise = library.idbLibrary.getAllTags();
		
		itemsPromise.then(function (itemsArray) {
			log.debug('loadIndexedDBCache itemsD done', 3);
			// create itemsDump from array of item objects
			var latestItemVersion = 0;
			for (var i = 0; i < itemsArray.length; i++) {
				var item = new Zotero.Item(itemsArray[i]);
				library.items.addItem(item);
				if (item.version > latestItemVersion) {
					latestItemVersion = item.version;
				}
			}
			library.items.itemsVersion = latestItemVersion;
			
			// TODO: add itemsVersion as last version in any of these items?
			// or store it somewhere else for indexedDB cache purposes
			library.items.loaded = true;
			log.debug('Done loading indexedDB items promise into library', 3);
		});
		
		collectionsPromise.then(function (collectionsArray) {
			log.debug('loadIndexedDBCache collectionsD done', 3);
			// create collectionsDump from array of collection objects
			var latestCollectionVersion = 0;
			for (var i = 0; i < collectionsArray.length; i++) {
				var collection = new Zotero.Collection(collectionsArray[i]);
				library.collections.addCollection(collection);
				if (collection.version > latestCollectionVersion) {
					latestCollectionVersion = collection.version;
				}
			}
			library.collections.collectionsVersion = latestCollectionVersion;
			
			// TODO: add collectionsVersion as last version in any of these items?
			// or store it somewhere else for indexedDB cache purposes
			library.collections.initSecondaryData();
			library.collections.loaded = true;
		});
		
		tagsPromise.then(function (tagsArray) {
			log.debug('loadIndexedDBCache tagsD done', 3);
			log.debug(tagsArray, 4);
			// create tagsDump from array of tag objects
			var latestVersion = 0;
			var tagsVersion = 0;
			for (var i = 0; i < tagsArray.length; i++) {
				var tag = new Zotero.Tag(tagsArray[i]);
				library.tags.addTag(tag);
				if (tagsArray[i].version > latestVersion) {
					latestVersion = tagsArray[i].version;
				}
			}
			tagsVersion = latestVersion;
			library.tags.tagsVersion = tagsVersion;

			// TODO: add tagsVersion as last version in any of these items?
			// or store it somewhere else for indexedDB cache purposes
			library.tags.loaded = true;
		});
		
		
		// resolve the overall deferred when all the child deferreds are finished
		return Promise.all([itemsPromise, collectionsPromise, tagsPromise]);
	}

	saveIndexedDB() {
		var saveItemsPromise = this.idbLibrary.updateItems(this.items.itemsArray);
		var saveCollectionsPromise = this.idbLibrary.updateCollections(this.collections.collectionsArray);
		var saveTagsPromise = this.idbLibrary.updateTags(this.tags.tagsArray);
		
		// resolve the overall deferred when all the child deferreds are finished
		return Promise.all([saveItemsPromise, saveCollectionsPromise, saveTagsPromise]);
	}
	
	toJson() {
		return {
			items: this.items.toJson(),
			collections: this.collections.toJson(),
			tags: this.tags.toJson()
		};
	}
	
	load(libraryJson) {
		const { items, collections, tags } = libraryJson;
		
		this.items.addItemsFromJson(items);
		this.collections.addCollectionsFromJson(collections);
		this.collections.initSecondaryData();
		this.tags.addTagsFromJson(tags);
		this.tags.initSecondaryData();
		
		this.items.itemsVersion = this.items.objectArray.map(item => item.get('version')).reduce((max, cur) => {
			return Math.max(max, cur);
		}, 0);
		
		this.collections.collectionsVersion = this.collections.objectArray.map(collection => collection.get('version')).reduce((max, cur) => {
			return Math.max(max, cur);
		}, 0);
		
		return this;
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
	'addedBy'];
	
/* 'numChildren',*/
/* 'modifiedBy'*/

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
	'addedBy'];

/* 'modifiedBy'*/

/**
 * Items columns that only apply to group libraries
 * @type {Array}
 */
Library.groupOnlyColumns = ['addedBy'
	/* 'modifiedBy'*/];

export { Library };

