'use strict';

import 'babel-polyfill';
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
import {Url} from './Url.js';
import {getFileInfo, uploadFile} from './File.js';
import {IdbLibrary} from './Idb.js';
import {Preferences} from './Preferences.js';
import {Client} from './Client.js';
import {Fetcher} from './Fetcher.js';
import {Writer} from './Writer.js';
import {TagColors} from './TagColors.js';
import {Validator} from './Validator.js';
import {RequestConfig} from './RequestConfig.js';

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
	utils: Utils,
	Url: Url,
	url: Url,
	File: {getFileInfo, uploadFile},
	file: {getFileInfo, uploadFile},
	Idb: {Library: IdbLibrary},
	Preferences: Preferences,
	Client: Client,
	Fetcher: Fetcher,
	Writer: Writer,
	TagColors: TagColors,
	Validator: Validator,
	RequestConfig: RequestConfig
};

globalScope.Zotero = globalScope.Z = Zotero;
Zotero.Localizations = Zotero.localizations = require('./Localizations.js');

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
	requestObject = Object.assign({}, requestObject, options);
	log.debug(requestObject, 3);
	return Zotero.net.queueRequest(requestObject);
};

Zotero.init = require('./Init.js');
Zotero.init();

module.exports = Zotero;