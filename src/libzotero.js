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
import {Items} from './Items.js';
import {Tags} from './Tags.js';
import {Groups} from './Groups.js';
import {Searches} from './Searches.js';
import {Deleted} from './Deleted.js';
import {Collection} from './Collection.js';
import {Item} from './Item.js';
import {Tag} from './Tag.js';
import {Search} from './Search.js';
import {Group} from './Group.js';
import {User} from './User.js';
import {Utils} from './Utils.js';

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
	Collections: Collections,
	Items: Items,
	Tags: Tags,
	Groups: Groups,
	Searches: Searches,
	Deleted: Deleted,
	Collection: Collection,
//localizations
	Item: Item,
	Tag: Tag,
	Search: Search,
	Group: Group,
	User: User,
	Utils: Utils,
	utils: Utils
};

globalScope.Zotero = globalScope.Z = Zotero;
Zotero.Localizations = Zotero.localizations = require('./Localizations.js');
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