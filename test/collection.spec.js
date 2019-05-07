const assert = require('chai').assert;
const Zotero = require('../src/libzotero.js');
const fetchMock = require('fetch-mock');

const collectionsJsonFixture = require('./fixtures/collections-1.json');

describe('Zotero.Collection', () => {
	describe('Construct', () => {
		it('should instantiate a collection', () => {
			const collection = new Zotero.Collection();

			assert.equal(collection.instance, 'Zotero.Collection');
			assert.equal(collection.key, '');
			assert.equal(collection.version, 0);
			assert.equal(collection.libraryUrlIdentifier, '');
			assert.equal(collection.itemKeys, false);
			assert.equal(collection.key, '');
			assert.equal(collection.version, 0);
			assert.equal(collection.synced, false);
			assert.equal(collection.pristineData, null);
			assert.isArray(collection.children);
			assert.lengthOf(collection.children, 0);
			assert.equal(collection.topLevel, true);
			assert.deepEqual(collection.apiObj, {
				key: '',
				version: 0,
				library: {},
				links: {},
				meta: {},
				data: {
					key: '',
					version: 0,
					name: '',
					parentCollection: false,
					relations: {}
				}
			});
		});

		it('should instantiate collection from api object', () => {
			const collection = new Zotero.Collection(collectionsJsonFixture[0]);

			assert.equal(collection.instance, 'Zotero.Collection');
			assert.equal(collection.key, 'TBGZPBMW');
			assert.equal(collection.version, 1);
			assert.deepEqual(collection.pristineData, collectionsJsonFixture[0].data);
			assert.equal(collection.apiObj.data.name, '001');
			assert.equal(collection.get('title'), '001');
			assert.equal(collection.get('name'), '001');
			assert.equal(collection.topLevel, false);
			assert.equal(collection.get('numItems'), 0);
			assert.equal(collection.get('numCollections'), 0);
			assert.equal(collection.get('parentCollection'), 'TMTT5PUG');
		});
	});

	describe('Properties', () => {
		it('should correctly set/get collection properties', () => {
			const collection = new Zotero.Collection();
			collection.set('title', 'Great Articles');
			collection.set('key', 'ASDF1234');
			collection.set('version', 74);
			collection.set('parentCollection', 'HJKL9876');
			
			// test that get returns what it should for each set
			assert.equal(collection.get('title'), 'Great Articles', 'get title should return what was set.');
			assert.equal(collection.get('key'), 'ASDF1234', 'get key should return what was set.');
			assert.equal(collection.get('version'), 74, 'get version should return what was set.');
			assert.equal(collection.get('parentCollection'), 'HJKL9876', 'get parentCollection should return what was set');
		});
	});
	
	describe('Write', () => {
		beforeEach(() => {
			fetchMock.catch((request) => {
				throw new Error(`A request to ${request.url} was not expected`);
			});
		});

		afterEach(fetchMock.restore);
		
		it('should create collection', async () => {
			const library = new Zotero.Library('user', 1, '', '');
			let collection = new Zotero.Collection();

			let reqCollection;
			fetchMock.mock({
				method: 'POST',
				matcher: (url, options, request) => {
					if (options.method != 'POST') {
						return false;
					}
					let parsedUrl = new URL(url);
					if (parsedUrl.origin != 'https://api.zotero.org' || parsedUrl.pathname != '/users/1/collections') {
						return false;
					}
					reqCollection = JSON.parse(request.body)[0];
					return true;
				},
				response: () => {
					let collection = reqCollection;
					collection.version = 12;
					return {
						headers: {
							'Last-Modified-Version': 12
						},
						body: {
							successful: collection,
							success: {
								0: collection.key
							},
							unchanged: {},
							failed: {}
						}
					};
				}
			});

			collection.associateWithLibrary(library);
			collection.set('name', 'collection-1');
			let responses = await collection.writeCollection();
			let collectionsArray = responses[0].returnCollections;
			assert.equal(collectionsArray.length, 1, 'We expect 1 collections was written');
			assert.isOk(collectionsArray[0].key, 'We expect the first collection to have an collectionKey');
			assert.equal(collection.version, 12, 'We expect version number to be updated');
		});

		it('should handle error responses', async () => {
			const library = new Zotero.Library('user', 1, '', '');
			let collection = new Zotero.Collection();

			let reqCollections;
			fetchMock.mock({
				method: 'POST',
				matcher: (url, options, request) => {
					if (options.method != 'POST') {
						return false;
					}
					let parsedUrl = new URL(url);
					if (parsedUrl.origin != 'https://api.zotero.org' || parsedUrl.pathname != '/users/1/collections') {
						return false;
					}
					reqCollections = JSON.parse(request.body);
					return true;
				},
				response: () => {
					let collection = reqCollections[0];
					collection.version = 12;
					return {
						headers: {
							'Last-Modified-Version': 12
						},
						body: {
							successful: {},
							success: {},
							unchanged: {},
							failed: {
								0: {
									code: 400,
									message: 'bad input error'
								}
							}
						}
					};
				}
			});

			collection.associateWithLibrary(library);
			collection.set('title', 'book-1');
			let responses = await collection.writeCollection();
			let collectionsArray = responses[0].returnCollections;
			assert.isOk(collectionsArray[0].writeFailure);
			assert.isOk('code' in collectionsArray[0].writeFailure);
			assert.equal(collectionsArray[0].writeFailure.code, 400);
			assert.equal(collectionsArray[0].writeFailure.message, 'bad input error');
		});
	});
});
