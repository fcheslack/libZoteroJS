'use strict';

const assert = require('chai').assert;
const Zotero = require('../src/libzotero.js');
const fetchMock = require('fetch-mock');

const publicationsResponseFixture = require('./fixtures/publications-response.js');
const items1ResponseFixture = require('./fixtures/items-response-page-1.js');
const items2ResponseFixture = require('./fixtures/items-response-page-2.js');

const fetcher = new Zotero.Fetcher({
	'target':'publications',
	'libraryType':'user',
	'libraryID':3
});


const fetcher2 = new Zotero.Fetcher({
	'target': 'items',
	'libraryType': 'group',
	'libraryID': 12
});

describe('Zotero.Fetcher', function(){
	before(() => {		
		fetchMock.mock(
			'begin:https://api.zotero.org/users/3/publications/items',
			publicationsResponseFixture
		);

		fetchMock.mock(
			'begin:https://api.zotero.org/groups/12/items?limit=25&start=0',
			items1ResponseFixture
		);
		
		fetchMock.mock(
			'begin:https://api.zotero.org/groups/12/items?limit=25&start=25',
			items2ResponseFixture
		);
		
		fetchMock.catch(request => {
			throw(new Error(`A request to ${request.url} was not expected`));
		});
	});

	after(() => {
		fetchMock.restore();
	});
	

	describe('Fetchall', () =>  {
		it('should fetch all publications', () => {
			return fetcher.fetchAll()
			.then(publications => {
				assert.lengthOf(publications, 4);
				return publications;
			}, response => {
				assert.fail('caught error in Zotero.Fetcher Fetchall test');
				throw response;
			});
		});
	});

	describe('Fetch multiple',  () =>  {
		it('should fetch first page',  () => {
			return fetcher2.next()
			.then(response => {
				assert.lengthOf(response.data, 25);
				return response;
			}, () => {
				assert.fail('caught error in Zotero.Fetcher Fetch multiple test');
			}).then( () => {
				//log.debug(fetchMock.lastUrl('virtual_page1'));
			});
		});

		it('should fetch second page',  () => {
			return fetcher2.next()
			.then(response => {
				assert.lengthOf(response.data, 25);
				return response;
			},  response => {
				assert.fail('caught error in Zotero.Fetcher Fetch multiple test');
				throw response;
			});
		});
	});
});