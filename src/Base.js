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
	
	validator: require('./Validator.js'),
	
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