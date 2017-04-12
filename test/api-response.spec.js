'use strict';

const assert = require('chai').assert;
const Zotero = require('../src/libzotero.js');
const responseFixture = require('./fixtures/items-response-page-1.js');

describe('Zotero.ApiResponse', function(){
	describe('construct', () => {
		it('should instantiate with no argument with default values', () => {
			let ar = new Zotero.ApiResponse();
			assert.instanceOf(ar, Zotero.ApiResponse);
			assert.equal(0, ar.totalResults);
		});

		it('should parse the headers when constructed with a Response', () => {
			let r = responseFixture;
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

		it('should parse backoff and retry-after headers into ints', () => {
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