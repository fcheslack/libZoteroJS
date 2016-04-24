'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../libzoterojs.js');

Zotero.testing = {
	libraryID: 0,
	libraryType: 'user'
};
Zotero.init();


describe.skip( 'Parse Tags Feed', function(){
	it('should correctly parse the tags feed without error', function(){
		
		J.get('../data/tagsjson.atom', function(data, textstatus, jqxhr){
			var library = new Zotero.Library('user', 1, 'test', null);
			
			var tagsfeed = new Zotero.Feed(data);
			var tags = library.tags;
			var addedTags = tags.addTagsFromFeed(tagsfeed);
			
			assert.equal(tagsfeed.title, 'Zotero / Z public library / Tags');
			assert.equal(tagsfeed.id, 'http://zotero.org/users/475425/tags?content=json');
			assert.equal(tagsfeed.totalResults, 192, 'test total Results');
			assert.equal(tagsfeed.apiVersion, null, 'test apiVersion');
			//deepassert.equal(tagsfeed.links, );
			assert.equal(tagsfeed.lastPageStart, 150, 'correctly found lastPageStart');
			assert.equal(tagsfeed.lastPage, 4, 'correctly found lastPage');
			assert.equal(tagsfeed.currentPage, 1, 'correctly found currentPage');
			
			var expectedDate = new Date();
			expectedDate.setTime( Date.parse( '2011-04-11T16:37:49Z' ) );
			assert.equal(tagsfeed.updated.toString(), expectedDate.toString(), 'found and parsed updated date' );
			
			
			start();
		});
	});
});