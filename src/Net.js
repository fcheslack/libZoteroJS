

let log = require('./Log.js').Logger('libZotero:Net', 3);
require('cross-fetch/polyfill');

import { ApiResponse } from './ApiResponse.js';
import { Ajax as ajax } from './Ajax.js';

/*
 * Make concurrent and sequential network requests, respecting backoff/retry-after
 * headers, and keeping concurrent requests below a certain limit.
 *
 * Push onto the queue individual or arrays of requestConfig objects
 * If there is room for requests and we are not currently backing off:
 *   start a sequential series, or individual request
 * When any request or set of requests finishes, we preprocess the response,
 * looking for backoff/retry-after to obey, and putting sequential responses
 * into an array. We then trigger the next waiting request.
 *
 */

class Net {
	constructor() {
		this.deferredQueue = [];
		this.numRunning = 0;
		this.numConcurrent = 3;
		this.backingOff = false;
	}

	// run a request without waiting for any other requests to complete
	runConcurrent = async (requestObject) => {
		log.debug('Net.runConcurrent', 3);
		const response = await this.ajaxRequest(requestObject);
		log.debug('done with runConcurrent request', 3);
		return response;
	}

	// run set of requests serially, awaiting on response before running each subsequent one
	// all responses are added to an array in order of request
	// returned via promise to the caller that resolves when all requests are complete
	runSequential = async (requestObjects) => {
		log.debug('Net.runSequential', 3);
		var responses = [];
		var seqPromise = Promise.resolve();
		
		for (var i = 0; i < requestObjects.length; i++) {
			let requestObject = requestObjects[i];
			let response = await this.ajaxRequest(requestObject);// eslint-disable-line no-await-in-loop
			log.debug('pushing sequential response into result array', 3);
			responses.push(response);
		}
		
		await seqPromise;
		log.debug('done with sequential aggregator promise - returning responses', 4);
		return responses;
	}

	// when one concurrent call, or a sequential series finishes, subtract it from the running
	// count and run the next if there is something waiting to be run
	individualRequestDone = (response) => {
		log.debug('Net.individualRequestDone', 3);
		// check if we need to back off before making more requests
		var wait = this.checkDelay(response);
		if (wait > 0) {
			var waitms = wait * 1000;
			this.backingOff = true;
			var waitExpiration = Date.now() + waitms;
			if (waitExpiration > this.waitingExpires) {
				this.waitingExpires = waitExpiration;
			}
			setTimeout(this.runNext, waitms);
		}
		
		return response;
	}

	queuedRequestDone = () => {
		log.debug('queuedRequestDone', 3);
		this.numRunning--;
		this.runNext();
	}

	runNext = () => {
		log.debug('Net.runNext', 4);
		var nowms = Date.now();
		
		// check if we're backing off and need to remain backing off,
		// or if we should now continue
		if (this.backingOff && (this.waitingExpires > (nowms - 100))) {
			log.debug('currently backing off', 3);
			var waitms = this.waitingExpires - nowms;
			setTimeout(this.runNext, waitms);
			return;
		} else if (this.backingOff && (this.waitingExpires <= (nowms - 100))) {
			this.backingOff = false;
		}
		
		// continue making requests up to the concurrent limit
		log.debug(this.numRunning + '/' + this.numConcurrent + ' Running. ' + this.deferredQueue.length + ' queued.', 4);
		while ((this.deferredQueue.length > 0) && (this.numRunning < this.numConcurrent)) {
			this.numRunning++;
			var nextD = this.deferredQueue.shift();
			nextD.resolve();
			log.debug(this.numRunning + '/' + this.numConcurrent + ' Running. ' + this.deferredQueue.length + ' queued.', 4);
		}
	}

	checkDelay = (response) => {
		log.debug('Net.checkDelay', 4);
		var wait = 0;
		if (Array.isArray(response)) {
			for (var i = 0; i < response.length; i++) {
				var iwait = this.checkDelay(response[i]);
				if (iwait > wait) {
					wait = iwait;
				}
			}
		} else if (response.status == 429) {
			wait = response.retryAfter;
		} else if (response.backoff) {
			wait = response.backoff;
		}
		return wait;
	}

	// perform API request defined by requestConfig
	apiRequest = async (requestConfig) => {
		let defaultConfig = {
			type: 'GET',
			headers: {
				'Zotero-API-Version': 3,
				'Content-Type': 'application/json'
			},
			success: function (response) {
				return response;
			},
			error: function (response) {
				if (!(response instanceof ApiResponse)) {
					log.error(`Response is not a Zotero.ApiResponse: ${response}`);
				} else if (response.rawResponse) {
					log.error(`apiRequest rejected:${response.rawResponse.status} - ${response.rawResponse.statusText}`);
				} else {
					log.error('apiRequest rejected: No rawResponse set. (likely network error)');
					log.error(response.error);
				}
				throw response;
			}
		};
		var headers = Object.assign({}, defaultConfig.headers, requestConfig.headers);
		if (requestConfig.key) {
			headers = Object.assign(headers, { 'Zotero-API-Key': requestConfig.key });
			delete requestConfig.key;
		}
		var config = Object.assign({}, defaultConfig, requestConfig);
		config.headers = headers;
		if (typeof config.url == 'object') {
			config.url = ajax.apiRequestString(config.url);
		}
		if (!config.url) {
			throw new Error('No url specified in Net.apiRequest');
		}
		let response;
		let ar;
		try {
			response = await this.ajax(config);
			ar = new ApiResponse(response);
			if ('processData' in config && config.processData === false) {
				await config.success(response);
				return response;
			} else {
				let data = await response.json();
				ar.data = data;
				ar = await config.success(ar);
			}
		} catch (response) {
			if (response instanceof Error) {
				ar = new ApiResponse();
				ar.isError = true;
				ar.error = response;
			} else {
				ar = new ApiResponse(response);
			}
			ar = await config.error(ar);
		}

		// this.individualRequestDone(ar);
		return ar;
	}

	// perform a network request defined by requestConfig
	// convert the Response into a Zotero.ApiResponse, and attach the passed in
	// success/failure handlers to the promise chain before returning (or default error logger
	// if no failure handler is defined)
	ajaxRequest = (requestConfig) => {
		log.debug('Net.ajaxRequest', 3);
		var net = this;
		
		var defaultConfig = {
			type: 'GET',
			headers: {
				'Zotero-API-Version': 3,
				'Content-Type': 'application/json'
			},
			success: function (response) {
				return response;
			},
			error: function (response) {
				if (!(response instanceof ApiResponse)) {
					log.error(`Response is not a Zotero.ApiResponse: ${response}`);
				} else if (response.rawResponse) {
					log.debug('ajaxRequest response.rawResponse is set');
					log.error(`ajaxRequest rejected:${response.rawResponse.status} - ${response.rawResponse.statusText}`);
				} else {
					log.error('ajaxRequest rejected: No rawResponse set. (likely network error)');
					log.error(response.error);
				}
				throw response;
			}
			// cache:false
		};
		
		var headers = Object.assign({}, defaultConfig.headers, requestConfig.headers);
		if (requestConfig.key) {
			headers = Object.assign(headers, { 'Zotero-API-Key': requestConfig.key });
			delete requestConfig.key;
		}
		
		var config = Object.assign({}, defaultConfig, requestConfig);
		config.headers = headers;
		if (typeof config.url == 'object') {
			config.url = ajax.apiRequestString(config.url);
		}
		// config.url = ajax.proxyWrapper(config.url, config.type);
		
		if (!config.url) {
			throw new Error('No url specified in Net.ajaxRequest');
		}
		
		log.debug('AJAX config', 4);
		log.debug(config, 4);

		let handleSuccessCallback = (response) => {
			return new Promise((resolve) => {
				if (config.success) {
					let maybePromise = config.success(response);
					if (maybePromise && 'then' in maybePromise) {
						maybePromise.then(() => {
							resolve();
						});
					} else {
						resolve();
					}
				} else {
					resolve();
				}
			});
		};

		var ajaxpromise = new Promise(function (resolve, reject) {
			net.ajax(config)
				.then(function (response) {
					var ar = new ApiResponse(response);
					if ('processData' in config && config.processData === false) {
						handleSuccessCallback(response).then(() => resolve(response));
					} else {
						response.json().then(function (data) {
							ar.data = data;
							handleSuccessCallback(ar).then(() => resolve(ar));
						}, function (err) {
							log.error(err);
							ar.isError = true;
							ar.error = err;
							reject(ar); // reject promise on malformed json
						});
					}
				}, function (response) {
					var ar;
					if (response instanceof Error) {
						ar = new ApiResponse();
						ar.isError = true;
						ar.error = response;
					} else {
						ar = new ApiResponse(response);
					}
				
					resolve(ar);
				});
		})
			.then(net.individualRequestDone.bind(net))
			.then(function (response) {
			// now that we're done handling, reject
				if (response.isError) {
				// re-throw ApiResponse that was a rejection
					throw response;
				}
				return response;
			})
			.catch(config.error);
		
		return ajaxpromise;
	}

	// perform a network request defined by config, and return a promise for a Response
	// resolve with a successful status (200-300) reject, but with the same Response object otherwise
	ajax = async (config) => {
		config = Object.assign({ type: 'GET' }, config);
		let headersInit = config.headers || {};
		let headers = new Headers(headersInit);

		let request = new Request(config.url, {
			method: config.type,
			headers: headers,
			mode: 'cors',
			credentials: 'omit',
			body: config.data
		});
		
		try {
			let response = await fetch(request);
			if (response.status >= 200 && response.status < 300) {
				log.debug('200-300 response: resolving Net.ajax promise', 3);
				// Performs the function "resolve" when this.status is equal to 2xx
				return response;
			} else {
				log.debug('not 200-300 response: rejecting Net.ajax promise', 3);
				// Performs the function "reject" when this.status is different than 2xx
				throw response;
			}
		} catch (err) {
			log.error(err);
			throw (err);
		}
	}
}

export { Net };
