'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../../libzoterojs.js');

Zotero.testing = {
	libraryID: 0,
	libraryType: 'user'
};
Zotero.init();


describe('new Zotero.Library', function() {
	it( 'should instantiate user library', function() {
		var library = new Zotero.Library('user', 1, 'test', null);
		assert.equal(library.instance, 'Zotero.Library');
		assert.equal(library.items.instance, 'Zotero.Items');
		assert.equal(library.collections.instance, 'Zotero.Collections');
		assert.equal(library.tags.instance, 'Zotero.Tags');
		assert.equal(library.searches.instance, 'Zotero.Searches');
	});
});