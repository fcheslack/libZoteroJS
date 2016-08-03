'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var log = require('../../src/Log.js').Logger('libZotero:Tests:Net');
var Zotero = require('../../src/libzotero.js');

var fetchMock;

describe('Zotero.Net', function(){
	before(function(){
		fetchMock = require('fetch-mock');

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

		fetchMock.mock('errorString', {status:400, body:'unknown field'});

		fetchMock.mock('networkError', {throws:new TypeError('network error')});
	});

	after(function(){
		fetchMock.restore();
	});

	describe('ajax', function() {
		it('should return a promise that resolves with a standard Fetch API response object', function(){
			return Zotero.net.ajax({
				url:'https://api.zotero.org/itemTypes'
			}).then(function(response){
				assert.instanceOf(response, Response, 'response is an instance of Fetch API Response interface');
				return response;
			});
		});
	});

	describe('ajaxRequest', function() {
		it('should return a promise that resolves with a Zotero.ApiResponse', function(){
			var requestConfig = {
				url:'https://api.zotero.org/itemTypes'
			};
			return Zotero.net.ajaxRequest(requestConfig).then(function(response){
				assert.instanceOf(response, Zotero.ApiResponse, 'response is an instance of Zotero.ApiResponse');
				assert.instanceOf(response.rawResponse, Response, 'rawResponse is an instance of Fetch API Response interface');
				
				assert.equal(200, response.status);
				return response;
			});
		});

		it('should parse the json response into the data property', function(){
			var requestConfig = {
				url:'https://api.zotero.org/itemTypes'
			};
			return Zotero.net.ajaxRequest(requestConfig).then(function(response){
				assert.equal('artwork', response.data[0].itemType);
				return response;
			});
		});

		it('should return a rejected promise if the response has bad json', function(){
			var requestConfig = {
				url:'malformed'
			};
			return Zotero.net.ajaxRequest(requestConfig).then(function(response){
				assert.fail('should never happen');
				throw 'should never happen';
			}, function(err){
				assert.isNotNull(err);
				//log.debug(err);
			});
		});

		it('should throw a Zotero.ApiResponse indicating error for a 500 response', function(){
			var requestConfig = {
				url:'error'
			};
			return Zotero.net.ajaxRequest(requestConfig).then(function(response){
				assert.fail('should never happen');
				throw 'should never happen';
			}, function(response){
				assert.instanceOf(response, Zotero.ApiResponse, 'instance of Zotero.ApiResponse');
				assert.equal(true, response.isError);
				assert.equal(500, response.status);
			});
		});

		it('should handle a 400 error with a bare string response gracefully', function(){
			var requestConfig = {
				url:'errorString'
			};
			return Zotero.net.ajaxRequest(requestConfig).then(function(response){
				assert.fail('should never happen');
				throw 'should never happen';
			}, function(response){
				assert.instanceOf(response, Zotero.ApiResponse, 'instance of Zotero.ApiResponse');
				assert.equal(true, response.isError);
				assert.equal(400, response.status);
			});
		});

		it('should throw a Zotero.ApiResponse indicating a network error', function(){
			var requestConfig = {
				url:'networkError'
			};
			return Zotero.net.ajaxRequest(requestConfig).then(function(response){
				assert.fail('should never happen');
				throw 'should never happen';
			}, function(response){
				assert.instanceOf(response, Zotero.ApiResponse, 'instance of Zotero.ApiResponse');
				assert.equal(true, response.isError);
			});
		});
	});

	//queueRequest should behave the same as ajaxRequest for individual requests
	describe('queueRequest', function() {
		it('should return a promise that resolves with a Zotero.ApiResponse', function(){
			var requestConfig = {
				url:'https://api.zotero.org/itemTypes'
			};
			return Zotero.net.queueRequest(requestConfig).then(function(response){
				assert.instanceOf(response, Zotero.ApiResponse, 'response is an instance of Zotero.ApiResponse');
				assert.instanceOf(response.rawResponse, Response, 'rawResponse is an instance of Fetch API Response interface');
				
				assert.equal(200, response.status);
				return response;
			});
		});

		it('should parse the json response into the data property', function(){
			var requestConfig = {
				url:'https://api.zotero.org/itemTypes'
			};
			return Zotero.net.queueRequest(requestConfig).then(function(response){
				assert.equal('artwork', response.data[0].itemType);
				return response;
			});
		});

		it('should return a rejected promise if the response has bad json', function(){
			var requestConfig = {
				url:'malformed'
			};
			return Zotero.net.queueRequest(requestConfig).then(function(response){
				assert.fail('should never happen');
				throw 'should never happen';
			}, function(err){
				assert.isNotNull(err);
				//log.debug(err);
			});
		});

		it('should throw a Zotero.ApiResponse indicating error for a 500 response', function(){
			var requestConfig = {
				url:'error'
			};
			return Zotero.net.queueRequest(requestConfig).then(function(response){
				assert.fail('should never happen');
				throw 'should never happen';
			}, function(response){
				assert.instanceOf(response, Zotero.ApiResponse, 'instance of Zotero.ApiResponse');
				assert.equal(true, response.isError);
				assert.equal(500, response.status);
			});
		});

		it('should handle a 400 error with a bare string response gracefully', function(){
			var requestConfig = {
				url:'errorString'
			};
			return Zotero.net.queueRequest(requestConfig).then(function(response){
				assert.fail('should never happen');
				throw 'should never happen';
			}, function(response){
				assert.instanceOf(response, Zotero.ApiResponse, 'instance of Zotero.ApiResponse');
				assert.equal(true, response.isError);
				assert.equal(400, response.status);
			});
		});

		it('should throw a Zotero.ApiResponse indicating a network error', function(){
			var requestConfig = {
				url:'networkError'
			};
			return Zotero.net.queueRequest(requestConfig).then(function(response){
				assert.fail('should never happen');
				throw 'should never happen';
			}, function(response){
				assert.instanceOf(response, Zotero.ApiResponse, 'instance of Zotero.ApiResponse');
				assert.equal(true, response.isError);
			});
		});

		//run requests in parallel
		it('should accept an array of configs and all requests', function(){
			var requestConfigs = [
				{url:'https://api.zotero.org/itemTypes'},
				//{url:'https://api.zotero.org/itemTypes'},
				{url:'error'}
			];
			return Zotero.net.queueRequest(requestConfigs).then(function(responses){
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
});