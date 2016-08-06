'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../src/libzotero.js');

describe('Zotero.ApiResponse', function(){
	before(function(){});

	after(function(){});

	describe('construct', function() {
		it('should instantiate with no argument with default values', function(){
			let ar = new Zotero.ApiResponse();
			assert.instanceOf(ar, Zotero.ApiResponse);
			assert.equal(0, ar.totalResults);
		});

		it('should parse the headers when constructed with a Response', function(){
			let r = require('../fixtures/firstPageVirtualWorldsItemsResponse.js');
			let ar = new Zotero.ApiResponse(r);

			assert.instanceOf(ar, Zotero.ApiResponse);
			assert.equal(190, ar.totalResults);
			assert.equal(3, ar.apiVersion);
			assert.equal(2869, ar.lastModifiedVersion);
			assert.equal('application/json', ar.contentType);
			
			assert.equal(ar.parsedLinks['next'], 'https://apidev.zotero.org/groups/12/items?start=25');
			assert.equal(ar.parsedLinks['last'], 'https://apidev.zotero.org/groups/12/items?start=175');
			assert.equal(ar.parsedLinks['alternate'], 'https://staging.zotero.net/groups/12/items');
		});

		it('should parse backoff and retry-after headers into ints', function(){
			let r = new Response(null, {
				headers: {
					backoff: '5',
					'retry-after': '10'
				}
			});
			let ar = new Zotero.ApiResponse(r);

			assert.equal(ar.backoff, 5);
			assert.equal(ar.retryAfter, 10);
		});
	});
});