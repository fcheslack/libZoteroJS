//'use strict';
var J = jQuery.noConflict();

var Zotero = {
	ajax: {},
	callbacks: {},
	ui: {
		callbacks: {},
		keyCode: {
			BACKSPACE: 8,
			COMMA: 188,
			DELETE: 46,
			DOWN: 40,
			END: 35,
			ENTER: 13,
			ESCAPE: 27,
			HOME: 36,
			LEFT: 37,
			PAGE_DOWN: 34,
			PAGE_UP: 33,
			PERIOD: 190,
			RIGHT: 39,
			SPACE: 32,
			TAB: 9,
			UP: 38
		},
	},
	url: {},
	utils: {},
	offline: {},
	temp: {},
	localizations: {},
	
	config: {librarySettings: {},
			 baseApiUrl: 'https://api.zotero.org',
			 baseWebsiteUrl: 'https://zotero.org',
			 baseFeedUrl: 'https://api.zotero.org',
			 baseZoteroWebsiteUrl: 'https://www.zotero.org',
			 baseDownloadUrl: 'https://www.zotero.org',
			 debugLogEndpoint: '',
			 storeDebug: true,
			 directDownloads: true,
			 proxyPath: '/proxyrequest',
			 ignoreLoggedInStatus: false,
			 storePrefsRemote: true,
			 preferUrlItem: true,
			 sessionAuth: false,
			 proxy: false,
			 apiKey: '',
			 ajax: 1,
			 apiVersion: 3,
			 eventful: false,
			 locale: 'en-US',
			 cacheStoreType: 'localStorage',
			 preloadCachedLibrary: true,
			 mobile:0,
			 sortOrdering: {
				 'dateAdded': 'desc',
				 'dateModified': 'desc',
				 'date': 'desc',
				 'year': 'desc',
				 'accessDate': 'desc',
				 'title': 'asc',
				 'creator': 'asc'
			 },
			 defaultSortColumn: 'title',
			 defaultSortOrder: 'asc',
			 largeFields: {
				 'title': 1,
				 'abstractNote': 1,
				 'extra' : 1
			 },
			 richTextFields: {
				 'note': 1
			 },
			 maxFieldSummaryLength: {title:60},
			 exportFormats: [
				'bibtex',
				'bookmarks',
				'mods',
				'refer',
				'rdf_bibliontology',
				'rdf_dc',
				'rdf_zotero',
				'ris',
				'wikipedia'
				],
			exportFormatsMap: {
				'bibtex': 'BibTeX',
				'bookmarks': 'Bookmarks',
				'mods': 'MODS',
				'refer': 'Refer/BibIX',
				'rdf_bibliontology': 'Bibliontology RDF',
				'rdf_dc': 'Unqualified Dublin Core RDF',
				'rdf_zotero': 'Zotero RDF',
				'ris': 'RIS',
				'wikipedia': 'Wikipedia Citation Templates',
			},
			defaultApiArgs: {
				'order': 'title',
				'sort': 'asc',
				'limit': 50,
				'start': 0
			}
	},
	
	debug: function(debugstring, level){
		var prefLevel = 3;
		if(Zotero.config.storeDebug){
			if(level <= prefLevel){
				Zotero.debugstring += "DEBUG:" + debugstring + "\n";
			}
		}
		if(typeof console == 'undefined'){
			return;
		}
		if(typeof(level) !== "number"){
			level = 1;
		}
		if(Zotero.preferences !== undefined){
			prefLevel = Zotero.preferences.getPref('debug_level');
		}
		if(level <= prefLevel) {
			console.log(debugstring);
		}
	},
	
	warn: function(warnstring){
		if(Zotero.config.storeDebug){
			Zotero.debugstring += "WARN:" + warnstring + "\n";
		}
		if(typeof console == 'undefined' || typeof console.warn == 'undefined'){
			this.debug(warnstring);
		}
		else{
			console.warn(warnstring);
		}
	},
	
	error: function(errorstring){
		if(Zotero.config.storeDebug){
			Zotero.debugstring += "ERROR:" + errorstring + "\n";
		}
		if(typeof console == 'undefined' || typeof console.error == 'undefined'){
			this.debug(errorstring);
		}
		else{
			console.error(errorstring);
		}
	},

	submitDebugLog: function(){
		Zotero.net.ajax({
			url: Zotero.config.debugLogEndpoint,
			data: {'debug_string': Zotero.debugstring}
		}).then(function(xhr){
			var data = JSON.parse(xhr.responseText);
			if(data.logID) {
				alert("ZoteroWWW debug logID:" + data.logID);
			} else if (data.error) {
				alert("Error submitting ZoteroWWW debug log:" + data.error);
			}
		});
	},
	
	catchPromiseError: function(err){
		Zotero.error(err);
	},
	
	libraries: {},
	
	validator: {
		patterns: {
			//'itemKey': /^([A-Z0-9]{8,},?)+$/,
			'itemKey': /^.+$/,
			'collectionKey': /^([A-Z0-9]{8,})|trash$/,
			//'tag': /^[^#]*$/,
			'libraryID': /^[0-9]+$/,
			'libraryType': /^(user|group|)$/,
			'target': /^(items?|collections?|tags|children|deleted|userGroups|key|settings|publications)$/,
			'targetModifier': /^(top|file|file\/view)$/,
			
			//get params
			'sort': /^(asc|desc)$/,
			'start': /^[0-9]*$/,
			'limit': /^[0-9]*$/,
			'order': /^\S*$/,
			'content': /^((html|json|data|bib|none|bibtex|bookmarks|coins|csljson|mods|refer|rdf_bibliontology|rdf_dc|ris|tei|wikipedia),?)+$/,
			'include': /^((html|json|data|bib|none|bibtex|bookmarks|coins|csljson|mods|refer|rdf_bibliontology|rdf_dc|ris|tei|wikipedia),?)+$/,
			'q': /^.*$/,
			'fq': /^\S*$/,
			'itemType': /^\S*$/,
			'locale': /^\S*$/,
			'tag': /^.*$/,
			'tagType': /^(0|1)$/,
			'key': /^\S*/,
			'format': /^(json|atom|bib|keys|versions|bibtex|bookmarks|mods|refer|rdf_bibliontology|rdf_dc|rdf_zotero|ris|wikipedia)$/,
			'style': /^\S*$/,
			'linkwrap': /^(0|1)*$/
		},
		
		validate: function(arg, type){
			Z.debug("Zotero.validate", 4);
			if(arg === ''){
				return null;
			}
			else if(arg === null){
				return true;
			}
			Z.debug(arg + " " + type, 4);
			var patterns = this.patterns;
			
			if(patterns.hasOwnProperty(type)){
				return patterns[type].test(arg);
			}
			else{
				return null;
			}
		}
	},
	
	_logEnabled: 0,
	enableLogging: function(){
		Zotero._logEnabled++;
		if(Zotero._logEnabled > 0){
			//TODO: enable debug_log?
		}
	},
	
	disableLogging: function(){
		Zotero._logEnabled--;
		if(Zotero._logEnabled <= 0){
			Zotero._logEnabled = 0;
			//TODO: disable debug_log?
		}
	},
	
	init: function(){
		var store;
		if(Zotero.config.cacheStoreType == 'localStorage' && typeof localStorage != 'undefined'){
			store = localStorage;
		}
		else if(Zotero.config.cacheStoreType == 'sessionStorage' && typeof sessionStorage != 'undefined'){
			store = sessionStorage;
		}
		else{
			store = {};
		}
		Zotero.store = store;
		
		Zotero.cache = new Zotero.Cache(store);
		
		//initialize global preferences object
		Zotero.preferences = new Zotero.Preferences(Zotero.store, 'global');
		
		//get localized item constants if not stored in localstorage
		var locale = 'en-US';
		if(Zotero.config.locale){
			locale = Zotero.config.locale;
		}
		locale = 'en-US';
		
		//J.ajaxSettings.traditional = true;
		
	}
};

Zotero.Cache = function(store){
	this.store = store;
	var registry = this.store._registry;
	if(registry === null || typeof registry == 'undefined'){
		registry = {};
		this.store._registry = JSON.stringify(registry);
	}
};

//build a consistent string from an object to use as a cache key
//put object key/value pairs into array, sort array, and concatenate
//array with '/'
Zotero.Cache.prototype.objectCacheString = function(params){
	var paramVarsArray = [];
	Object.keys(params).forEach(function(index){
		var value = params[index];
		if(!value) { return; }
		else if(Array.isArray(value)){
			value.forEach(function(v, i){
				paramVarsArray.push(index + '/' + encodeURIComponent(v) );
			});
		}
		else{
			paramVarsArray.push(index + '/' + encodeURIComponent(value) );
		}
	});
	paramVarsArray.sort();
	Z.debug(paramVarsArray, 4);
	var objectCacheString = paramVarsArray.join('/');
	return objectCacheString;
};

//should use setItem and getItem if I extend that to the case where no Storage object is available in the browser
Zotero.Cache.prototype.save = function(params, object, cachetags){
	//cachetags for expiring entries
	if(!Array.isArray(cachetags)){
		cachetags = [];
	}
	//get registry object from storage
	var registry = JSON.parse(this.store._registry);
	if(!registry){
		registry = {};
	}
	var objectCacheString = this.objectCacheString(params);
	//save object in storage
	this.store[objectCacheString] = JSON.stringify(object);
	//make registry entry for object
	var registryEntry = {'id':objectCacheString, saved:Date.now(), cachetags:cachetags};
	registry[objectCacheString] = registryEntry;
	//save registry back to storage
	this.store._registry = JSON.stringify(registry);
};

Zotero.Cache.prototype.load = function(params){
	Z.debug("Zotero.Cache.load", 3);
	var objectCacheString = this.objectCacheString(params);
	Z.debug(objectCacheString, 4);
	try{
		var s = this.store[objectCacheString];
		if(!s){
			Z.warn("No value found in cache store - " + objectCacheString, 3);
			return null;
		}
		else{
			return JSON.parse(s);
		}
	}
	catch(e){
		Z.error('Error parsing retrieved cache data: ' + objectCacheString + ' : ' + s);
		return null;
	}
};

Zotero.Cache.prototype.expireCacheTag = function(tag){
	Z.debug("Zotero.Cache.expireCacheTag", 3);
	var registry = JSON.parse(this.store._registry);
	var store = this.store;
	Object.keys(registry).forEach(function(index){
		var value = registry[index];
		if(value.cachetags.indexOf(tag) != (-1)){
			Z.debug('tag ' + tag + ' found for item ' + value['id'] + ' : expiring', 4);
			delete store[value['id']];
			delete registry[value['id']];
		}
	});
};

Zotero.Cache.prototype.clear = function(){
	if(typeof(this.store.clear) == 'function'){
		this.store.clear();
	}
	else{
		this.store = {};
	}
};

Zotero.ajaxRequest = function(url, type, options){
	Z.debug("Zotero.ajaxRequest ==== " + url, 3);
	if(!type){
		type = 'GET';
	}
	if(!options){
		options = {};
	}
	var requestObject = {
		url: url,
		type: type,
	};
	requestObject = Z.extend({}, requestObject, options);
	Z.debug(requestObject, 3);
	return Zotero.net.queueRequest(requestObject);
};

//non-DOM (jquery) event management
Zotero.eventmanager = {
	callbacks: {}
};

Zotero.trigger = function(eventType, data={}, filter=false){
	if(filter){
		Z.debug("filter is not false", 3);
		eventType += "_" + filter;
	}
	Zotero.debug("Triggering eventful " + eventType, 3);
	
	data.zeventful = true;
	if(data.triggeringElement === null || data.triggeringElement === undefined){
		data.triggeringElement = J("#eventful");
	}
	Zotero.debug("Triggering eventful " + eventType, 3);
	try{
		if(Zotero.eventmanager.callbacks.hasOwnProperty(eventType)){
			var callbacks = Zotero.eventmanager.callbacks[eventType];
			callbacks.forEach(function(callback, ind){
				var data = callback.data;
				var e = {
					data: data
				};
				callback.f(e);
			});
		}
	}
	catch(e){
		Z.error("failed triggering:" + eventType);
		Z.error(e);
	}
};

Zotero.listen = function(events, handler, data, filter){
	Z.debug("Zotero.listen: " + events);
	//append filter to event strings if it's specified
	var eventsArray = events.split(" ");
	if(eventsArray.length > 0 && filter){
		for(var i = 0; i < eventsArray.length; i++){
			eventsArray[i] += "_" + filter;
		}
	}
	eventsArray.forEach(function(ev){
		if(Zotero.eventmanager.callbacks.hasOwnProperty(ev)){
			Zotero.eventmanager.callbacks[ev].push({
				data: data,
				f: handler
			});
		} else {
			Zotero.eventmanager.callbacks[ev] = [{
				data: data,
				f: handler
			}];
		}
	});
};

var Z = Zotero;


