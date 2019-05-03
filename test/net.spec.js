

const assert = require('chai').assert;
const fetchMock = require('fetch-mock');
const Zotero = require('../src/libzotero.js');

describe('Zotero.Net', () => {
	before(() => {
		fetchMock.mock('https://api.zotero.org/itemTypes', `[
		    {
		        "itemType": "artwork",
		        "localized": "Artwork"
		    },
		    {
		        "itemType": "audioRecording",
		        "localized": "Audio Recording"
		    },
		    {
		        "itemType": "bill",
		        "localized": "Bill"
		    }
		]`);

		fetchMock.mock('malformed', `[
		    {
		        "itemType": "artwork",
		        "localized": "Artwork"
		    }
		`);

		fetchMock.mock('error', 500);

		fetchMock.mock('errorString', { status: 400, body: 'unknown field' });

		fetchMock.mock('networkError', { throws: new TypeError('network error') });
	});

	after(fetchMock.restore);

	describe('ajax', () => {
		it('should return a promise that resolves with a standard Fetch API response object', () => {
			return Zotero.net.ajax({
				url: 'https://api.zotero.org/itemTypes'
			}).then((response) => {
				assert.instanceOf(response, Response, 'response is an instance of Fetch API Response interface');
				return response;
			});
		});
	});

	describe('ajaxRequest', () => {
		it('should return a promise that resolves with a Zotero.ApiResponse', () => {
			var requestConfig = {
				url: 'https://api.zotero.org/itemTypes'
			};
			return Zotero.net.ajaxRequest(requestConfig).then((response) => {
				assert.instanceOf(response, Zotero.ApiResponse, 'response is an instance of Zotero.ApiResponse');
				assert.instanceOf(response.rawResponse, Response, 'rawResponse is an instance of Fetch API Response interface');
				
				assert.equal(200, response.status);
				return response;
			});
		});

		it('should parse the json response into the data property', () => {
			var requestConfig = {
				url: 'https://api.zotero.org/itemTypes'
			};
			return Zotero.net.ajaxRequest(requestConfig).then((response) => {
				assert.equal('artwork', response.data[0].itemType);
				return response;
			});
		});

		it('should return a rejected promise if the response has bad json', () => {
			var requestConfig = {
				url: 'malformed'
			};
			
			return Zotero.net.ajaxRequest(requestConfig).then(() => {
				assert.fail('should never happen');
				throw new Error('should never happen');
			}, (err) => {
				assert.isNotNull(err);
				// log.debug(err);
			});
		});

		it('should throw a Zotero.ApiResponse indicating error for a 500 response', () => {
			var requestConfig = {
				url: 'error'
			};
			return Zotero.net.ajaxRequest(requestConfig).then(() => {
				assert.fail('should never happen');
				throw new Error('should never happen');
			}, (response) => {
				assert.instanceOf(response, Zotero.ApiResponse, 'instance of Zotero.ApiResponse');
				assert.equal(true, response.isError);
				assert.equal(500, response.status);
			});
		});

		it('should handle a 400 error with a bare string response gracefully', () => {
			var requestConfig = {
				url: 'errorString'
			};
			return Zotero.net.ajaxRequest(requestConfig).then(() => {
				assert.fail('should never happen');
				throw new Error('should never happen');
			}, (response) => {
				assert.instanceOf(response, Zotero.ApiResponse, 'instance of Zotero.ApiResponse');
				assert.equal(true, response.isError);
				assert.equal(400, response.status);
			});
		});

		it('should throw a Zotero.ApiResponse indicating a network error', () => {
			var requestConfig = {
				url: 'networkError'
			};
			return Zotero.net.ajaxRequest(requestConfig).then(() => {
				assert.fail('should never happen');
				throw new Error('should never happen');
			}, (response) => {
				assert.instanceOf(response, Zotero.ApiResponse, 'instance of Zotero.ApiResponse');
				assert.equal(true, response.isError);
			});
		});
	});

	/*
	//queueRequest should behave the same as ajaxRequest for individual requests
	describe('queueRequest', () =>  {
		it('should return a promise that resolves with a Zotero.ApiResponse', () => {
			var requestConfig = {
				url:'https://api.zotero.org/itemTypes'
			};
			return Zotero.net.queueRequest(requestConfig).then(response => {
				assert.instanceOf(response, Zotero.ApiResponse, 'response is an instance of Zotero.ApiResponse');
				assert.instanceOf(response.rawResponse, Response, 'rawResponse is an instance of Fetch API Response interface');
				
				assert.equal(200, response.status);
				return response;
			});
		});

		it('should parse the json response into the data property', () => {
			var requestConfig = {
				url:'https://api.zotero.org/itemTypes'
			};
			return Zotero.net.queueRequest(requestConfig).then(response => {
				assert.equal('artwork', response.data[0].itemType);
				return response;
			});
		});

		it('should return a rejected promise if the response has bad json', () => {
			var requestConfig = {
				url:'malformed'
			};
			return Zotero.net.queueRequest(requestConfig).then(() => {
				assert.fail('should never happen');
				throw 'should never happen';
			}, (err) => {
				assert.isNotNull(err);
				//log.debug(err);
			});
		});

		it('should throw a Zotero.ApiResponse indicating error for a 500 response', () => {
			var requestConfig = {
				url:'error'
			};
			return Zotero.net.queueRequest(requestConfig).then(() => {
				assert.fail('should never happen');
				throw 'should never happen';
			}, response => {
				assert.instanceOf(response, Zotero.ApiResponse, 'instance of Zotero.ApiResponse');
				assert.equal(true, response.isError);
				assert.equal(500, response.status);
			});
		});

		it('should handle a 400 error with a bare string response gracefully', () => {
			var requestConfig = {
				url:'errorString'
			};
			return Zotero.net.queueRequest(requestConfig).then(() => {
				assert.fail('should never happen');
				throw 'should never happen';
			}, response => {
				assert.instanceOf(response, Zotero.ApiResponse, 'instance of Zotero.ApiResponse');
				assert.equal(true, response.isError);
				assert.equal(400, response.status);
			});
		});

		it('should throw a Zotero.ApiResponse indicating a network error', () => {
			var requestConfig = {
				url:'networkError'
			};
			return Zotero.net.queueRequest(requestConfig).then(() => {
				assert.fail('should never happen');
				throw 'should never happen';
			}, response => {
				assert.instanceOf(response, Zotero.ApiResponse, 'instance of Zotero.ApiResponse');
				assert.equal(true, response.isError);
			});
		});

		//run requests in parallel
		it('should accept an array of configs and all requests', () => {
			var requestConfigs = [
				{url:'https://api.zotero.org/itemTypes'},
				//{url:'https://api.zotero.org/itemTypes'},
				{url:'error'}
			];
			return Zotero.net.queueRequest(requestConfigs).then((responses) => {
				assert.lengthOf(responses, 2);

				assert.instanceOf(responses[0], Zotero.ApiResponse, 'response is an instance of Zotero.ApiResponse');
				assert.instanceOf(responses[1], Zotero.ApiResponse, 'response is an instance of Zotero.ApiResponse');

				assert.instanceOf(responses[0].rawResponse, Response, 'rawResponse is an instance of Fetch API Response interface');
				assert.instanceOf(responses[1].rawResponse, Response, 'rawResponse is an instance of Fetch API Response interface');

				assert.equal(200, responses[0].status);
				assert.equal(500, responses[1].status);

				return responses;
			});
		});

	});
	*/
});
