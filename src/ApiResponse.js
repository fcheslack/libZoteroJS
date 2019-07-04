

import { Logger } from './Log.js';
const log = new Logger('libZotero:ApiResponse');

class ApiResponse {
	constructor(response) {
		log.debug('Zotero.ApiResponse', 4);
		this.totalResults = 0;
		this.apiVersion = null;
		this.lastModifiedVersion = 0;
		this.linkHeader = '';
		this.links = {};

		if (response) {
			this.isError = !response.ok;
			// this.data = response.json;
			this.parseResponse(response);
		}
	}

	parseResponse(response) {
		log.debug('parseResponse', 4);
		this.rawResponse = response;
		this.status = response.status;
		// keep track of relevant headers
		this.lastModifiedVersion = response.headers.get('last-modified-version');
		this.apiVersion = response.headers.get('zotero-api-version');
		this.backoff = response.headers.get('backoff');
		this.retryAfter = response.headers.get('retry-after');
		this.contentType = response.headers.get('content-type');
		this.linkHeader = response.headers.get('link');
		this.totalResults = response.headers.get('total-results');
		if (this.backoff) {
			this.backoff = parseInt(this.backoff, 10);
		}
		if (this.retryAfter) {
			this.retryAfter = parseInt(this.retryAfter, 10);
		}
		// TODO: parse link header into individual links
		log.debug('parse link header', 4);
		log.debug(this.linkHeader, 4);
		if (this.linkHeader) {
			var links = this.linkHeader.split(',');
			var parsedLinks = {};
			var linkRegex = /^<([^>]+)>; rel="([^\"]*)"$/;
			for (var i = 0; i < links.length; i++) {
				var matches = linkRegex.exec(links[i].trim());
				if (matches[2]) {
					parsedLinks[matches[2]] = matches[1];
				}
			}
			this.parsedLinks = parsedLinks;
		}
	}
}

export { ApiResponse };
