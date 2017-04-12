'use strict';

const assert = require('chai').assert;
const Zotero = require('../src/libzotero.js');
const collectionApiObjectsFixture = require('./fixtures/collections-1.json');

describe('Zotero.Collections', () => {
	describe('Construct', () => {
		let collections = new Zotero.Collections();
		
		it('should instantiate collections from api objects', () => {
			collections.addCollectionsFromJson(collectionApiObjectsFixture);
			collections.initSecondaryData();

			assert.equal(collections.instance, 'Zotero.Collections');
			assert.lengthOf(collections.collectionsArray, 72);
		});

		it('should have instances in both collectionObjects and collectionsArray', () => {
			let keys = Object.keys(collections.collectionObjects);
			assert.lengthOf(keys, 72);
		});

		it('should allow accessing collections by key', () => {
			let c = collections.getCollection('TVS6NGIC');
			assert.equal(c.instance, 'Zotero.Collection');
			assert.equal(c.key, 'TVS6NGIC');
			assert.equal(c.get('version'), 1);
			assert.equal(c.get('name'), 'samples');
		});

		it('should process collections with secondary attributes, including nesting', () => {
			let c = collections.getCollection('TVS6NGIC');
			assert.equal(c.hasChildren, true);
			assert.equal(c.nestingDepth, 1);
			assert.equal(c.hasChildren, true);
			assert.lengthOf(c.children, 7);
		});
	});
});