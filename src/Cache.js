'use strict';

var log = require('./Log.js').Logger('libZotero:Cache');

//build a consistent string from an object to use as a cache key
//put object key/value pairs into array, sort array, and concatenate
//array with '/'
module.exports = function(store) {
	this.store = store;
	var registry = this.store._registry;
	if(registry === null || typeof registry == 'undefined'){
		registry = {};
		this.store._registry = JSON.stringify(registry);
	}
};

module.exports.prototype.objectCacheString = function(params){
	var paramVarsArray = [];
	Object.keys(params).forEach(function(index){
		var value = params[index];
		if(!value) { return; }
		else if(Array.isArray(value)){
			value.forEach(function(v){
				paramVarsArray.push(index + '/' + encodeURIComponent(v) );
			});
		}
		else{
			paramVarsArray.push(index + '/' + encodeURIComponent(value) );
		}
	});
	paramVarsArray.sort();
	log.debug(paramVarsArray, 4);
	var objectCacheString = paramVarsArray.join('/');
	return objectCacheString;
};

//should use setItem and getItem if I extend that to the case where no Storage object is available in the browser
module.exports.prototype.save = function(params, object, cachetags){
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

module.exports.prototype.load = function(params){
	log.debug('Zotero.Cache.load', 3);
	var objectCacheString = this.objectCacheString(params);
	log.debug(objectCacheString, 4);
	try{
		var s = this.store[objectCacheString];
		if(!s){
			log.warn('No value found in cache store - ' + objectCacheString, 3);
			return null;
		}
		else{
			return JSON.parse(s);
		}
	}
	catch(e){
		log.error(`Error parsing retrieved cache data: ${objectCacheString} : ${s}`);
		return null;
	}
};

module.exports.prototype.expireCacheTag = function(tag){
	log.debug('Zotero.Cache.expireCacheTag', 3);
	var registry = JSON.parse(this.store._registry);
	var store = this.store;
	Object.keys(registry).forEach(function(index){
		var value = registry[index];
		if(value.cachetags.indexOf(tag) != (-1)){
			log.debug('tag ' + tag + ' found for item ' + value['id'] + ' : expiring', 4);
			delete store[value['id']];
			delete registry[value['id']];
		}
	});
};

module.exports.prototype.clear = function(){
	if(typeof(this.store.clear) == 'function'){
		this.store.clear();
	}
	else{
		this.store = {};
	}
};