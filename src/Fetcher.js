

var log = require('./Log.js').Logger('libZotero:Fetcher');

class Fetcher {
	constructor(config = {}) {
		let defaultConfig = {
			start: 0,
			limit: 25
		};

		this.config = Object.assign({}, defaultConfig, config);
		this.hasMore = true;

		this.results = [];
		this.responses = [];
		this.totalResults = null;
		this.resultInfo = {};
		this.backingOff = false;
		this.backoffDone = false;
	}

	next = async () => {
		if (this.hasMore == false) {
			return null;
		}

		let urlconfig = Object.assign({}, this.config);
		// if currently backing off, wait until it's done to make the request
		if (this.backingOff) {
			await this.backoffDone;
			this.backingOff = false;
		}
		let response = await this.requestOrRetry({ url: urlconfig });
		if (response.parsedLinks.hasOwnProperty('next')) {
			this.hasMore = true;
		} else {
			this.hasMore = false;
		}

		this.results = this.results.concat(response.data);
		this.totalResults = response.totalResults;

		let nconfig = Object.assign({}, urlconfig);
		nconfig.start += nconfig.limit;
		this.config = nconfig;

		this.responses.push(response);
		return response;
	};

	fetchAll = async () => {
		let results = [];
		while (this.hasMore) {
			let response = await this.next();
			results = results.concat(response.data);
		}
		return results;
	}
	
	requestOrRetry = async (config) => {
		let response = await Zotero.net.apiRequest(config);
		if (response.backoff) {
			this.backingOff = true;
			this.backoffDone = this.delaySeconds(response.backoff);
		}
		if (response.status == 429) {
			await this.delaySeconds(response.retryAfter);
			return this.requestOrRetry(config);
		}
		
		return response;
	}
	
	delaySeconds = (seconds) => {
		let delayMS = 1000 * seconds;
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve();
			}, delayMS);
		});
	}
}

export { Fetcher };
