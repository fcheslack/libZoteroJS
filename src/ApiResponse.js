

var log = require('./Log.js').Logger('libZotero:ApiResponse');

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
		var apiResponse = this;
		apiResponse.rawResponse = response;
		apiResponse.status = response.status;
		// keep track of relevant headers
		apiResponse.lastModifiedVersion = response.headers.get('last-modified-version');
		apiResponse.apiVersion = response.headers.get('zotero-api-version');
		apiResponse.backoff = response.headers.get('backoff');
		apiResponse.retryAfter = response.headers.get('retry-after');
		apiResponse.contentType = response.headers.get('content-type');
		apiResponse.linkHeader = response.headers.get('link');
		apiResponse.totalResults = response.headers.get('total-results');
		if (apiResponse.backoff) {
			apiResponse.backoff = parseInt(apiResponse.backoff, 10);
		}
		if (apiResponse.retryAfter) {
			apiResponse.retryAfter = parseInt(apiResponse.retryAfter, 10);
		}
		// TODO: parse link header into individual links
		log.debug('parse link header', 4);
		log.debug(apiResponse.linkHeader, 4);
		if (apiResponse.linkHeader) {
			var links = apiResponse.linkHeader.split(',');
			var parsedLinks = {};
			var linkRegex = /^<([^>]+)>; rel="([^\"]*)"$/;
			for (var i = 0; i < links.length; i++) {
				var matches = linkRegex.exec(links[i].trim());
				if (matches[2]) {
					parsedLinks[matches[2]] = matches[1];
				}
			}
			apiResponse.parsedLinks = parsedLinks;
		}
	}
}

export { ApiResponse };
