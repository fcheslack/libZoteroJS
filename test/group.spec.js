

const assert = require('chai').assert;
const Zotero = require('../src/libzotero.js');
const fetchMock = require('fetch-mock');
const groupjsonFixture = require('./fixtures/group-1.json');

describe('Zotero.Group', () => {
	describe('Construct', () => {
		it('should instantiate group from api object', () => {
			const group = new Zotero.Group(groupjsonFixture);

			assert.equal(group.instance, 'Zotero.Group');
			assert.equal(group.apiObj.id, 1);
			assert.equal(group.apiObj.version, 1);
			assert.deepEqual(group.apiObj.data, groupjsonFixture.data);
			assert.equal(group.get('id'), 1);
			assert.equal(group.get('version'), 1);
			assert.equal(group.get('name'), 'Panda');
			assert.equal(group.get('owner'), 14058);
			assert.equal(group.get('type'), 'PublicClosed');
			assert.lengthOf(group.get('admins'), 2);
			assert.lengthOf(group.get('members'), 1);
		});

		it('should return empty arrays when admin/members not set on api object', () => {
			let modifiedGroupJson = Object.assign({}, groupjsonFixture);
			modifiedGroupJson.data = Object.assign({}, groupjsonFixture.data);
			delete modifiedGroupJson.data.admins;
			delete modifiedGroupJson.data.members;
			
			const group = new Zotero.Group(modifiedGroupJson);
			assert.equal(true, Array.isArray(group.get('admins')));
			assert.equal(true, Array.isArray(group.get('members')));
			assert.lengthOf(group.get('admins'), 0);
			assert.lengthOf(group.get('members'), 0);
		});
	});

	describe('Fetch', () => {
		beforeEach(() => {
			fetchMock.get(
				/https:\/\/api\.zotero\.org\/users\/1\/groups\?.*?/i,
				[groupjsonFixture]
			);

			fetchMock.catch((request) => {
				throw (new Error(`A request to ${request.url} was not expected`));
			});
		});

		afterEach(fetchMock.restore);

		it('should fetch user groups', async () => {
			var library = new Zotero.Library('user', 1, '', '');

			await library.groups.fetchUserGroups(1);
			assert.isOk(library.groups.groupsArray.length > 0);
			assert.equal(library.groups.groupsArray[0].get('name'), 'Panda');
			assert.equal(library.groups.groupsArray[0].get('owner'), 14058);
			assert.equal(library.groups.groupsArray[0].get('type'), 'PublicClosed');
			assert.lengthOf(library.groups.groupsArray[0].get('admins'), 2);
			assert.lengthOf(library.groups.groupsArray[0].get('members'), 1);
		});
	});
});
