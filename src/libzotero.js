// use strict;

var log = require('./Log.js').Logger('libZotero');

var globalScope;

if(typeof window === 'undefined') {
	globalScope = global;
	//add node-fetch
	if(!globalScope.fetch){
		var nfetch = require('node-fetch');
		globalScope.fetch = nfetch;
		globalScope.Response = nfetch.Response;
		globalScope.Headers = nfetch.Headers;
		globalScope.Request = nfetch.Request;
	}
} else {
	globalScope = window;
	if(typeof Promise === 'undefined') {
		require('es6-promise').polyfill();
	}
	
	//add github's whatwg-fetch for browsers
	if(!globalScope.fetch){
		require('whatwg-fetch');
	}
	//module.exports = self.fetch.bind(self);
}

import {Cache} from './Cache.js';
import {Ajax} from './Ajax.js';
import {ApiObject} from './ApiObject.js';
import {ApiResponse} from './ApiResponse.js';
import {Net} from './Net.js';
let net = new Net();
import {Library} from './Library.js';
import {Container} from './Container.js';
import {Collections} from './Collections.js';

var Zotero = {
	Cache: Cache,
	Ajax: Ajax,
	ajax: Ajax,
	ApiObject: ApiObject,
	ApiResponse: ApiResponse,
	Net: net,
	net: net,
	Library: Library,
	Container: Container,
	Collections: Collections
};

globalScope.Zotero = globalScope.Z = Zotero;
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
Zotero.Fetcher = require('./Fetcher.js');
Zotero.Writer = require('./Writer.js');
Zotero.TagColors = require('./TagColors.js');
Zotero.Validator = require('./Validator.js');
Zotero.RequestConfig = require('./RequestConfig.js');

Zotero.extend = require('./Extend.js');

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