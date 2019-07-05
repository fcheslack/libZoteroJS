

import { Logger } from './Log.js';
const log = new Logger('libZotero:Fetcher');

class Fetcher {
	constructor(urlConfig = {}, requestConfig = {}) {
		let defaultUrlConfig = {
			start: 0,
			limit: 25
		};

		this.urlConfig = Object.assign({}, defaultUrlConfig, urlConfig);
		this.requestConfig = requestConfig;
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

		let urlconfig = Object.assign({}, this.urlConfig);
		let requestConfig = Object.assign({}, this.requestConfig, { url: urlconfig });
		// if currently backing off, wait until it's done to make the request
		if (this.backingOff) {
			await this.backoffDone;
			this.backingOff = false;
		}
		let response = await this.requestOrRetry(requestConfig);
		if (response.parsedLinks.hasOwnProperty('next')) {
			this.hasMore = true;
		} else {
			this.hasMore = false;
		}

		this.results = this.results.concat(response.data);
		this.totalResults = response.totalResults;

		let nconfig = Object.assign({}, urlconfig);
		nconfig.start += nconfig.limit;
		this.urlConfig = nconfig;

		return response;
	};

	fetchAll = async () => {
		let results = [];
		while (this.hasMore) {
			// eslint-disable-next-line no-await-in-loop
			let response = await this.next();
			results = results.concat(response.data);
		}
		return results;
	}
	
	requestOrRetry = async (requestConfig) => {
		log.debug('requestOrRetry', 3);
		let response = await Zotero.net.apiRequest(requestConfig);
		if (response.backoff) {
			this.backingOff = true;
			this.backoffDone = this.delaySeconds(response.backoff);
		}
		if (response.status == 429) {
			await this.delaySeconds(response.retryAfter);
			return this.requestOrRetry(requestConfig);
		}
		
		this.responses.push(response);
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
