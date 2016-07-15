'use strict';

var init = function(){
	var store;
	if(Zotero.config.cacheStoreType == 'localStorage' && typeof localStorage != 'undefined'){
		store = localStorage;
	} else if(Zotero.config.cacheStoreType == 'sessionStorage' && typeof sessionStorage != 'undefined'){
		store = sessionStorage;
	} else{
		store = {};
	}
	Zotero.store = store;
	
	Zotero.cache = new Zotero.Cache(store);
	
	//initialize global preferences object
	Zotero.preferences = new Zotero.Preferences(Zotero.store, 'global');
};

module.exports = init;