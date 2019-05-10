

const assert = require('chai').assert;
const Zotero = require('../src/libzotero.js');
const itemsApiObjectsFixture = require('./fixtures/items-response-body.json');

describe('Zotero.Items', () => {
	describe('Items', () => {
		let items = new Zotero.Items();
		
		it('should instantiate items from api objects', () => {
			items.addItemsFromJson(itemsApiObjectsFixture);
			assert.equal(items.instance, 'Zotero.Items');
			assert.lengthOf(items.objectArray, 190);
		});

		it('should allow access by key', () => {
			let i = items.getItem('ZB3CU5JJ');
			assert.equal(i.instance, 'Zotero.Item');
			assert.equal(i.get('version'), 1);
			assert.equal(i.get('title'), '3D Social Virtual Worlds: Research Issues and Challenges');
		});
	});
});
