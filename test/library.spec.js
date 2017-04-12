'use strict';

const assert = require('chai').assert;
const Zotero = require('../src/libzotero.js');

describe('Zotero.Library', function() {
	it('should instantiate user library', function() {
		const library = new Zotero.Library('user', 1, 'test', null);
		assert.equal(library.instance, 'Zotero.Library');
		assert.equal(library.items.instance, 'Zotero.Items');
		assert.equal(library.collections.instance, 'Zotero.Collections');
		assert.equal(library.tags.instance, 'Zotero.Tags');
		assert.equal(library.searches.instance, 'Zotero.Searches');
		assert.equal(library.libraryString, 'u1');
	});

	it('should instantiate group library', function() {
		const library = new Zotero.Library('group', 729, 'all_things_zotero');
		assert.equal(library.instance, 'Zotero.Library');
		assert.equal(library.items.instance, 'Zotero.Items');
		assert.equal(library.collections.instance, 'Zotero.Collections');
		assert.equal(library.tags.instance, 'Zotero.Tags');
		assert.equal(library.searches.instance, 'Zotero.Searches');
		assert.equal(library.type, 'group');
		assert.equal(library.libraryString, 'g729');
	});
});