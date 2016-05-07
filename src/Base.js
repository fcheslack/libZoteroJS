'use strict';

var log = require('./Log.js').Logger('libZotero:Base');

var Zotero = {
	callbacks: {},
	offline: {},
	temp: {},
	
	config: {librarySettings: {},
			baseApiUrl: 'https://api.zotero.org',
			baseWebsiteUrl: 'https://zotero.org',
			baseFeedUrl: 'https://api.zotero.org',
			baseZoteroWebsiteUrl: 'https://www.zotero.org',
			baseDownloadUrl: 'https://www.zotero.org',
			nonparsedBaseUrl: '',
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
			apiVersion: 3,
			locale: 'en-US',
			cacheStoreType: 'localStorage',
			preloadCachedLibrary: true,
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
				'wikipedia': 'Wikipedia Citation Templates'
			},
			defaultApiArgs: {
				'order': 'title',
				'sort': 'asc',
				'limit': 50,
				'start': 0
			}
	},
	/*
	debug: function(debugstring, level){
		var prefLevel = 3;
		if(Zotero.config.storeDebug){
			if(level <= prefLevel){
				Zotero.debugstring += 'DEBUG:' + debugstring + '\n';
			}
		}
		if(typeof console == 'undefined'){
			return;
		}
		if(typeof(level) !== 'number'){
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
			Zotero.debugstring += 'WARN:' + warnstring + '\n';
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
			Zotero.debugstring += 'ERROR:' + errorstring + '\n';
		}
		if(typeof console == 'undefined' || typeof console.error == 'undefined'){
			this.debug(errorstring);
		}
		else{
			console.error(errorstring);
		}
	},
	*/
	submitDebugLog: function(){
		Zotero.net.ajax({
			url: Zotero.config.debugLogEndpoint,
			data: {'debug_string': Zotero.debugstring}
		}).then(function(xhr){
			var data = JSON.parse(xhr.responseText);
			if(data.logID) {
				alert('ZoteroWWW debug logID:' + data.logID);
			} else if (data.error) {
				alert('Error submitting ZoteroWWW debug log:' + data.error);
			}
		});
	},
	
	catchPromiseError: function(err){
		log.error(err);
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
			log.debug('Zotero.validate', 4);
			if(arg === ''){
				return null;
			}
			else if(arg === null){
				return true;
			}
			log.debug(arg + ' ' + type, 4);
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
	}
};


Zotero.ajaxRequest = function(url, type, options){
	log.debug('Zotero.ajaxRequest ==== ' + url, 3);
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
	requestObject = Z.extend({}, requestObject, options);
	log.debug(requestObject, 3);
	return Zotero.net.queueRequest(requestObject);
};

//non-DOM (jquery) event management
Zotero.eventmanager = {
	callbacks: {}
};

Zotero.trigger = function(eventType, data={}, filter=false){
	if(filter){
		log.debug('filter is not false', 3);
		eventType += '_' + filter;
	}
	log.debug('Triggering eventful ' + eventType, 3);
	
	data.zeventful = true;
	// if(data.triggeringElement === null || data.triggeringElement === undefined){
	// 	data.triggeringElement = J('#eventful');
	// }
	
	try{
		if(Zotero.eventmanager.callbacks.hasOwnProperty(eventType)){
			var callbacks = Zotero.eventmanager.callbacks[eventType];
			callbacks.forEach(function(callback){
				var cdata = Z.extend({}, data, callback.data);
				var e = {
					data: cdata
				};
				callback.f(e);
			});
		}
	}
	catch(e){
		log.error(`failed triggering:${eventType}`);
		log.error(e);
	}
};

Zotero.listen = function(events, handler, data, filter){
	log.debug('Zotero.listen: ' + events, 3);
	//append filter to event strings if it's specified
	var eventsArray = events.split(' ');
	if(eventsArray.length > 0 && filter){
		for(var i = 0; i < eventsArray.length; i++){
			eventsArray[i] += '_' + filter;
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

Zotero.extend = function() {
	var res = {};
	for(var i = 0; i < arguments.length; i++){
		var a = arguments[i];
		if(typeof a != 'object'){
			continue;
		}
		Object.keys(a).forEach(function(key){
			res[key] = a[key];
		});
	}
	return res;
};

Zotero.deepExtend = function(out) {
  out = out || {};

  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];

    if (!obj)
      continue;

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object')
          out[key] = Zotero.deepExtend(out[key], obj[key]);
        else
          out[key] = obj[key];
      }
    }
  }

  return out;
};

module.exports = Zotero;