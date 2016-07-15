'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../src/libzotero.js');

var tagsApiObjects = require('../fixtures/tags1.json');

describe('Zotero.Tags', function(){
	describe('Tags', function() {
		let tags = new Zotero.Tags();
		
		it('should instantiate tags from api objects', function(){
			tags.addTagsFromJson(tagsApiObjects);

			assert.equal(tags.instance, 'Zotero.Tags');

			assert.lengthOf(tags.tagsArray, 23);
		});
		it('should allow access by tag string', function(){
			let t = tags.getTag('unread');
			assert.equal(t.instance, 'Zotero.Tag');
			assert.equal(t.get('tag'), 'unread');
			assert.equal(t.get('type'), 0);
			assert.equal(t.get('numItems'), 1);
		});
	});
});