'use strict';

var log = require('./Log.js').Logger('libZotero:FetchNet', 3);

var Deferred = function(){
	var d = this;

	d.promise = new Promise(function(resolve, reject){
		d.resolve = resolve;
		d.reject = reject;
	});
};

//var Deferred = require('deferred');

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

var Net = function() {
	this.deferredQueue = [];
	this.numRunning = 0;
	this.numConcurrent = 3;
	this.backingOff = false;
};

Net.prototype.queueDeferred = function(){
	var net = this;
	var d = new Deferred();
	net.deferredQueue.push(d);
	return d.promise;
};

//add a request to the end of the queue, so that previously queue requests run first
//if requestObject is an array of requests, run them sequentially
Net.prototype.queueRequest = function(requestObject){
	log.debug('Zotero.Net.queueRequest', 3);
	var net = this;
	var resultPromise;
	
	if(Array.isArray(requestObject)){
		resultPromise = net.queueDeferred().then(function(){
			log.debug('running sequential after queued deferred resolved', 4);
			return net.runSequential(requestObject);
		}).then(function(response){
			net.queuedRequestDone();
			return response;
		}, function(response){
			net.queuedRequestDone();
			throw response;
		});
	}
	else {
		resultPromise = net.queueDeferred().then(function(){
			log.debug('running concurrent after queued deferred resolved', 4);
			return net.runConcurrent(requestObject);
		}).then(function(response){
			net.queuedRequestDone();
			return response;
		}, function(response){
			net.queuedRequestDone();
			throw response;
		});
	}
	
	net.runNext();
	return resultPromise;
};

//run a request without waiting for any other requests to complete
Net.prototype.runConcurrent = function(requestObject){
	log.debug('Zotero.Net.runConcurrent', 3);
	return this.ajaxRequest(requestObject).then(function(response){
		log.debug('done with runConcurrent request', 3);
		return response;
	});
};

//run the set of requests serially
//chaining each request onto the .then of the previous one, after
//adding the previous response to a responses array that will be
//returned via promise to the caller when all requests are complete
Net.prototype.runSequential = function(requestObjects){
	log.debug('Zotero.Net.runSequential', 3);
	var net = this;
	var responses = [];
	var seqPromise = Promise.resolve();
	
	for(var i = 0; i < requestObjects.length; i++){
		let requestObject = requestObjects[i];
		seqPromise = seqPromise.then(function(){
			var p = net.ajaxRequest(requestObject)
			.then(function(response){
				log.debug('pushing sequential response into result array', 3);
				responses.push(response);
			}, function(response){
				//return error responses too
				responses.push(response);
			});
			return p;
		});
	}
	
	return seqPromise.then(function(){
		log.debug('done with sequential aggregator promise - returning responses', 4);
		return responses;
	});
};

//when one concurrent call, or a sequential series finishes, subtract it from the running
//count and run the next if there is something waiting to be run
Net.prototype.individualRequestDone = function(response){
	log.debug('Zotero.Net.individualRequestDone', 3);
	var net = this;
	
	//check if we need to back off before making more requests
	var wait = net.checkDelay(response);
	if(wait > 0){
		var waitms = wait * 1000;
		net.backingOff = true;
		var waitExpiration = Date.now() + waitms;
		if(waitExpiration > net.waitingExpires){
			net.waitingExpires = waitExpiration;
		}
		setTimeout(net.runNext, waitms);
	}
	
	return response;
};

Net.prototype.queuedRequestDone = function(){
	log.debug('queuedRequestDone', 3);
	var net = this;
	net.numRunning--;
	net.runNext();
};

Net.prototype.runNext = function(){
	log.debug('Zotero.Net.runNext', 4);
	var net = this;
	var nowms = Date.now();
	
	//check if we're backing off and need to remain backing off,
	//or if we should now continue
	if(net.backingOff && (net.waitingExpires > (nowms - 100)) ){
		log.debug('currently backing off', 3);
		var waitms = net.waitingExpires - nowms;
		setTimeout(net.runNext, waitms);
		return;
	}
	else if(net.backingOff && (net.waitingExpires <= (nowms - 100))){
		net.backingOff = false;
	}
	
	//continue making requests up to the concurrent limit
	log.debug(net.numRunning + '/' + net.numConcurrent + ' Running. ' + net.deferredQueue.length + ' queued.', 4);
	while((net.deferredQueue.length > 0) && (net.numRunning < net.numConcurrent)){
		net.numRunning++;
		var nextD = net.deferredQueue.shift();
		nextD.resolve();
		log.debug(net.numRunning + '/' + net.numConcurrent + ' Running. ' + net.deferredQueue.length + ' queued.', 4);
	}
};

Net.prototype.checkDelay = function(response){
	log.debug('Zotero.Net.checkDelay', 4);
	var net = this;
	var wait = 0;
	if(Array.isArray(response)){
		for(var i = 0; i < response.length; i++){
			var iwait = net.checkDelay(response[i]);
			if(iwait > wait){
				wait = iwait;
			}
		}
	}
	else {
		if(response.status == 429){
			wait = response.retryAfter;
		}
		else if(response.backoff){
			wait = response.backoff;
		}
	}
	return wait;
};

//perform a network request defined by requestConfig
//convert the Response into a Zotero.ApiResponse, and attach the passed in
//success/failure handlers to the promise chain before returning (or default error logger
//if no failure handler is defined)
Net.prototype.ajaxRequest = function(requestConfig){
	log.debug('Zotero.Net.ajaxRequest', 3);
	var net = this;
	
	var defaultConfig = {
		type:'GET',
		headers:{
			'Zotero-API-Version': Zotero.config.apiVersion,
			'Content-Type': 'application/json'
		},
		success: function(response){
			return response;
		},
		error: function(response){
			if(!response instanceof Zotero.ApiResponse){
				log.error(`Response is not a Zotero.ApiResponse: ${response}`);
			} else if(response.rawResponse){
				log.error(`ajaxRequest rejected:${response.rawResponse.status} - ${response.rawResponse.statusText}`);
			} else {
				log.error('ajaxRequest rejected: No rawResponse set. (likely network error)');
				log.error(response.error);
			}
			throw response;
		}
		//cache:false
	};
	
	var headers = Z.extend({}, defaultConfig.headers, requestConfig.headers);
	if(requestConfig.key){
		headers = Z.extend(headers, {'Zotero-API-Key': requestConfig.key});
		delete requestConfig.key;
	}
	
	var config = Z.extend({}, defaultConfig, requestConfig);
	config.headers = headers;
	if(typeof config.url == 'object'){
		config.url = Zotero.ajax.apiRequestString(config.url);
	}
	config.url = Zotero.ajax.proxyWrapper(config.url, config.type);
	
	if(!config.url){
		throw 'No url specified in Zotero.Net.ajaxRequest';
	}
	
	log.debug('AJAX config', 4);
	log.debug(config, 4);
	var ajaxpromise = new Promise(function(resolve, reject){
		net.ajax(config)
		.then(function(response){
			var ar = new Zotero.ApiResponse(response);
			response.json().then(function(data){
				ar.data = data;
				resolve(ar);
			}, function(err){
				log.error(err);
				ar.isError = true;
				ar.error = err;
				reject(ar); //reject promise on malformed json
			});
		}, function(response){
			var ar;
			if(response instanceof Error){
				ar = new Zotero.ApiResponse();
				ar.isError = true;
				ar.error = response;
			} else {
				ar = new Zotero.ApiResponse(response);
			}
			
			resolve(ar);
		});
	})
	.then(net.individualRequestDone.bind(net))
	.then(function(response){
		//now that we're done handling, reject
		if(response.isError){
			//re-throw ApiResponse that was a rejection
			throw response;
		}
		return response;
	})
	.then(config.success, config.error);
	
	return ajaxpromise;
};

//perform a network request defined by config, and return a promise for a Response
//resolve with a successful status (200-300) reject, but with the same Response object otherwise
Net.prototype.ajax = function(config){
	config = Zotero.extend({type:'GET'}, config);
	let headersInit = config.headers || {};
	let headers = new Headers(headersInit);

	var request = new Request(config.url, {
		method:config.type,
		headers: headers,
		mode:'cors',
		body:config.data
	});
	
	return fetch(request).then(function(response){
		log.debug('fetch done', 4);
		log.debug(request, 4);
		if (response.status >= 200 && response.status < 300) {
			log.debug('200-300 response: resolving Net.ajax promise', 3);
			// Performs the function "resolve" when this.status is equal to 2xx
			return response;
		} else {
			log.debug('not 200-300 response: rejecting Net.ajax promise', 3);
			// Performs the function "reject" when this.status is different than 2xx
			throw response;
		}
	}, function(err){
		log.error(err);
		throw(err);
	});
};

module.exports = new Net();
