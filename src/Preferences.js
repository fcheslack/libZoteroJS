'use strict';

var log = require('./Log.js').Logger('libZotero:Preferences');

class Preferences{
	constructor(store, idString){
		this.store = store;
		this.idString = idString;
		this.preferencesObject = {};
		this.defaults = {
			debug_level: 3, //lower level is higher priority
			debug_log: true,
			debug_mock: false,
			listDisplayedFields: ['title', 'creator', 'dateModified'],
			showAutomaticTags: false,//tagType:1 is automatic, tagType:0 was added by user
			itemsPerPage: 25,
			order: 'title',
			title: 'asc'
		};
		this.load();
	}

	setPref(key, value) {
		var preferences = this;
		preferences.preferencesObject[key] = value;
		preferences.persist();
	}

	setPrefs(newPrefs) {
		var preferences = this;
		if(typeof(newPrefs) != 'object') {
			throw new Error('Preferences must be an object');
		}
		preferences.preferencesObject = newPrefs;
		preferences.persist();
	}

	getPref(key){
		var preferences = this;
		if(preferences.preferencesObject[key]){
			return preferences.preferencesObject[key];
		}
		else if(preferences.defaults[key]){
			return preferences.defaults[key];
		}
		else {
			return null;
		}
	}

	getPrefs(){
		var preferences = this;
		return preferences.preferencesObject;
	}

	persist(){
		var preferences = this;
		var storageString = 'preferences_' + preferences.idString;
		preferences.store[storageString] = JSON.stringify(preferences.preferencesObject);
	}

	load(){
		var preferences = this;
		var storageString = 'preferences_' + preferences.idString;
		var storageObjectString = preferences.store[storageString];
		if(!storageObjectString){
			preferences.preferencesObject = {};
		}
		else {
			preferences.preferencesObject = JSON.parse(storageObjectString);
		}
	}
}

export {Preferences};
