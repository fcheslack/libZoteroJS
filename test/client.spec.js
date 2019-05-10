

const assert = require('chai').assert;
const Zotero = require('../src/libzotero.js');
const fetchMock = require('fetch-mock');

const groupsFixture = require('./fixtures/groups-1.json');

describe('Zotero.Client', () => {
	beforeEach(() => {
		fetchMock.get(
			'begin:https://api.zotero.org/users/1/groups',
			groupsFixture
		);

		fetchMock.catch((request) => {
			throw (new Error(`A request to ${request.url} was not expected`));
		});
	});

	afterEach(fetchMock.restore);
	
	it('should get the groups a user belongs to', async () => {
		let client = new Zotero.Client('');
		let response = await client.getUserGroups(1);
		let fetchedGroups = response.fetchedGroups;
		assert.lengthOf(fetchedGroups, 4, 'should be 4 groups');
		assert.equal(fetchedGroups[0].version, 3, 'should be version 3');
		assert.equal(fetchedGroups[1].get('title'), 'Llamas');
		assert.equal(fetchedGroups[2].get('owner'), 23869);
		assert.equal(fetchedGroups[3].get('description'), "Test Group for Test user 1");
	});
});
