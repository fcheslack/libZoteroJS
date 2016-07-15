// use strict;

var log = require('./Log.js').Logger('libZotero');

if(typeof window === 'undefined') {
	var globalScope = global;
	if(!globalScope.XMLHttpRequest) {
		globalScope.XMLHttpRequest = require('w3c-xmlhttprequest').XMLHttpRequest;
	}
} else {
	var globalScope = window;
	if(typeof Promise === 'undefined') {
		require('es6-promise').polyfill();
	}
}

var Zotero = {};
globalScope.Zotero = globalScope.Z = Zotero;
Zotero.Cache = require('./Cache.js');
Zotero.Ajax = Zotero.ajax = require('./Ajax.js');
Zotero.ApiObject = require('./ApiObject.js');
Zotero.ApiResponse = require('./ApiResponse.js');
Zotero.Net = Zotero.net = require('./Net.js');
Zotero.Library = require('./Library.js');
Zotero.Container = require('./Container');
Zotero.Collections = require('./Collections.js');
Zotero.Items = require('./Items.js');
Zotero.Tags = require('./Tags.js');
Zotero.Groups = require('./Groups.js');
Zotero.Searches = require('./Searches.js');
Zotero.Deleted = require('./Deleted.js');
Zotero.Collection = require('./Collection.js');
Zotero.Localizations = Zotero.localizations = require('./Localizations.js');
Zotero.Item = require('./Item.js');
Zotero.Tag = require('./Tag.js');
Zotero.Search = require('./Search.js');
Zotero.Group = require('./Group.js');
Zotero.User = require('./User.js');
Zotero.Utils = Zotero.utils = require('./Utils.js');
Zotero.Url = Zotero.url = require('./Url.js');
Zotero.File = Zotero.file = require('./File.js');
Zotero.Idb = require('./Idb.js');
Zotero.Preferences = require('./Preferences.js');
Zotero.Client = require('./Client.js');
Zotero.MultiFetch = require('./MultiFetch.js');
Zotero.TagColors = require('./TagColors.js');
Zotero.Validator = require('./Validator.js');

let {extend, deepExtend} = require('./Extend.js');
Zotero.extend = extend;
Zotero.deepExtend = deepExtend;

//non-DOM (jquery) event management
Zotero.eventmanager = {callbacks: {}};
let {trigger, listen} = require('./Events.js');
Zotero.trigger = trigger;
Zotero.listen = listen;

Zotero.libraries = {};
Zotero.config = require('./DefaultConfig.js');

Zotero.catchPromiseError = function(err){
	log.error(err);
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

Zotero.init = require('./Init.js');
Zotero.init();

module.exports = Zotero;