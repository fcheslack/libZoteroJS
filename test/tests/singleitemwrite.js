/* eslint-env node, mocha */
'use strict';

const assert = require('chai').assert;
const Zotero = require('../../src/libzotero.js');
const fetchMock = require('fetch-mock');

const bookTemplateFixture = require('../fixtures/book-template.json');

/*
 * Test cases:
 * create a new item with no children
 *     single POST to /items
 */
describe('Create item', () => {
	before(() => {
		fetchMock.get(
			/https:\/\/api\.zotero\.org\/items\/new\?itemType=book\&?/i,
			bookTemplateFixture
		);
		fetchMock.post(
			/https:\/\/api\.zotero\.org\/users\/1\/items\??/i,
			request => {
				let item = JSON.parse(request.body)[0];
				item.version = 12;
				return {
					headers: {
						'Last-Modified-Version': 12
					},
					body: {
						'successful': item,
						'success': {
							'0': item.key
						},
						'unchanged': {},
						'failed': {}
					}
				};
			}
		);
		fetchMock.mock('*', request => {
			throw(new Error(`A request to ${request.url} was not expected`));
		});
	});

	after(() => {
		fetchMock.restore();
	});
	
	it('should create item', done => {
		let library = new Zotero.Library('user', 1, '', '');
		let item = new Zotero.Item();

		item.associateWithLibrary(library);
		item.initEmpty('book')
			.then(item => {
				item.set('title', 'book-1');
				let version = item.version;
				item.writeItem()
					.then(function(responses) {
						let itemsArray = responses[0].returnItems;
						assert.equal(itemsArray.length, 1, 'We expect 1 items was written');
						assert.isOk(itemsArray[0].key, 'We expect the first item to have an itemKey');
						assert.equal(item.version, 12, 'We expect version number to be updated');
						done();
					}).catch(done);
			}).catch(done)
	});
});