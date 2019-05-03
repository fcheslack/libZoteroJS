'use strict';

var log = require('./Log.js').Logger('libZotero:Fetcher');

class Fetcher{
	constructor(config={}){
		let defaultConfig = {
			start: 0,
			limit: 25
		};

		this.config = Object.assign({}, defaultConfig, config);
		this.hasMore = true;

		this.results = [];
		this.totalResults = null;
		this.resultInfo = {};
	}

	next = async () => {
		if(this.hasMore == false){
			return null;
		}

		let urlconfig = Object.assign({}, this.config);
		let response = await Zotero.net.apiRequest({url:urlconfig});
		if(response.parsedLinks.hasOwnProperty('next')){
			this.hasMore = true;
		} else {
			this.hasMore = false;
		}

		this.results = this.results.concat(response.data);
		this.totalResults = response.totalResults;

		let nconfig = Object.assign({}, urlconfig);
		nconfig.start = nconfig.start + nconfig.limit;
		this.config = nconfig;

		return response;
	};

	fetchAll = async () => {
		let results = [];
		while(this.hasMore){
			let response = await this.next();
			results = results.concat(response.data);
		}
		return results;
	}
}

export {Fetcher};
