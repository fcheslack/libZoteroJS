'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../src/libzotero.js');

//test that the Zotero object has a config set with some default values
describe('Zotero.config', function(){
	it('should have some default values set on Zotero.config', function(){
		assert.equal(Zotero.config.baseApiUrl, 'https://api.zotero.org');

		assert.equal(Zotero.config.baseZoteroWebsiteUrl, 'https://www.zotero.org');

		assert.deepEqual(Zotero.config.sortOrdering, {
			'dateAdded': 'desc',
			'dateModified': 'desc',
			'date': 'desc',
			'year': 'desc',
			'accessDate': 'desc',
			'title': 'asc',
			'creator': 'asc'
		});
	});
});
