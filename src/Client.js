'use strict';

var log = require('./Log.js').Logger('libZotero:Client');

import {Fetcher} from './Fetcher.js';
import {Net} from './Net.js';

class Client{
	constructor(apiKey=''){
		this._apiKey = apiKey;
		this.net = new Net();
	}

	getUserGroups(userID) {
		var aparams = {
			'target':'userGroups',
			'libraryType':'user',
			'libraryID': userID,
			'order':'title'
		};

		if(this._apiKey){
			aparams['key'] = this._apiKey;
		}

		return Zotero.ajaxRequest(aparams)
		.then(function(response){
			log.debug('fetchUserGroups proxied callback', 3);
			let groupJson = response.data;
			let groups = groupJson.map(function(groupObj){
				return new Zotero.Group(groupObj);
			});

			var fetchedGroups = groups.addGroupsFromJson(response.data);
			response.fetchedGroups = fetchedGroups;
			return response;
		});
	};

	getUserPublications(userID, config={}) {
		log.debug('Zotero.Client.loadPublications', 3);
		
		let defaultConfig = {
			target:'publications',
			start: 0,
			limit: 50,
			order: Zotero.config.defaultSortColumn,
			sort: Zotero.config.defaultSortOrder,
			include: 'bib'
		};

		let urlconfig = Z.extend({}, defaultConfig, config, {
			'target':'publications',
			'libraryType':'user',
			'libraryID':userID
		});

		let fetcher = new Fetcher(urlconfig);
		return fetcher.fetchAll().then((results)=>{
			return results.map(function(itemObj){
				return new Zotero.Item(itemObj);
			});
		});
	};

	getKeyPermissions(key=false) {
		if(!key){
			return false;
		}

		let urlconfig = {'target':'key', 'apiKey':key, 'libraryType':''};

		return Zotero.ajaxRequest(urlconfig)
		.then(function(response){
			let keyObject = JSON.parse(response.data);
			return keyObject;
		});
	};

	deleteKey(key=false) {
		if(!key){
			return false;
		}

		return this.net.ajax();
	};
}

export {Client};
