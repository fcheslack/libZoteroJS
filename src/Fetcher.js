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

	next(){
		if(this.hasMore == false){
			return Promise.resolve(null);
		}

		let urlconfig = Object.assign({}, this.config);
		let p = Zotero.net.queueRequest({url:urlconfig});
		p.then((response)=>{
			if(response.parsedLinks.hasOwnProperty('next')){
				this.hasMore = true;
			} else {
				this.hasMore = false;
			}

			this.results = this.results.concat(response.data);
			this.totalResults = response.totalResults;

			return response;
		});

		let nconfig = Object.assign({}, urlconfig);
		nconfig.start = nconfig.start + nconfig.limit;
		this.config = nconfig;
		return p;
	};

	fetchAll(){
		let results = [];
		let tryNext = () => {
			if(this.hasMore){
				return this.next().then((response)=>{
					results = results.concat(response.data);
				}).then(tryNext);
			} else {
				return Promise.resolve(results);
			}
		};

		return tryNext();
	}
}

export {Fetcher};
