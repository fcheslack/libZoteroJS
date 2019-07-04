

import { Logger } from './Log.js';
const log = new Logger('libZotero:Client');

import { Fetcher } from './Fetcher.js';
import { Net } from './Net.js';

class Client {
	constructor(apiKey = '') {
		this._apiKey = apiKey;
		this.net = new Net();
	}

	getUserGroups = async (userID) => {
		var aparams = {
			target: 'userGroups',
			libraryType: 'user',
			libraryID: userID,
			order: 'title'
		};

		if (this._apiKey) {
			aparams.key = this._apiKey;
		}

		let response = await Zotero.ajaxRequest(aparams);
		let groupJson = response.data;
		let groups = groupJson.map(function (groupObj) {
			return new Zotero.Group(groupObj);
		});

		response.fetchedGroups = groups;
		return response;
	};

	getUserPublications = async (userID, config = {}) => {
		log.debug('Zotero.Client.loadPublications', 3);
		
		let defaultConfig = {
			target: 'publications',
			start: 0,
			limit: 50,
			order: Zotero.config.defaultSortColumn,
			sort: Zotero.config.defaultSortOrder,
			include: 'bib'
		};

		let urlconfig = Object.assign({}, defaultConfig, config, {
			target: 'publications',
			libraryType: 'user',
			libraryID: userID
		});

		let fetcher = new Fetcher(urlconfig);
		let results = await fetcher.fetchAll();
		return results.map(function (itemObj) {
			return new Zotero.Item(itemObj);
		});
	};

	getKeyPermissions = async (key = false) => {
		if (!key) {
			return false;
		}

		let urlconfig = { target: 'key', apiKey: key, libraryType: '' };

		let response = await Zotero.ajaxRequest(urlconfig);
		let keyObject = JSON.parse(response.data);
		return keyObject;
	};

	deleteKey = (key = false) => {
		if (!key) {
			return false;
		}

		return this.net.ajax();
	};
}

export { Client };
