'use strict';

var log = require('./Log.js').Logger('libZotero:Base');

var Zotero = {
	callbacks: {},
	offline: {},
	temp: {},
	
	config: require('./DefaultConfig.js'),

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


module.exports = Zotero;