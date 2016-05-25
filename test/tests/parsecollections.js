'use strict';

//var request = require('superagent');
//var superagentPromisePlugin = require('superagent-promise-plugin');

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../src/libzotero.js');

Zotero.testing = {
	libraryID: 0,
	libraryType: 'user'
};
Zotero.init();


describe.skip( 'Parse Collections Feed', function(){
	it('should correctly parse the collections feed without error', function(){
		request.get('../data/collectionsjson.atom')
		J.get('../data/collectionsjson.atom', function(data, textstatus, jqxhr){
			var library = new Zotero.Library('user', 1, 'test', null);
			
			var jFeedOb = J(data);
			var collectionfeed = new Zotero.Feed(data);
			var collections = library.collections;
			//clear out display items
			var collectionsAdded = collections.addCollectionsFromFeed(collectionfeed);
			for (var i = 0; i < collectionsAdded.length; i++) {
				collectionsAdded[i].associateWithLibrary(library);
			}
			
			
			assert.equal(collectionfeed.title, 'Zotero / Z public library / Collections');
			assert.equal(collectionfeed.id, 'http://zotero.org/users/475425/collections?content=json');
			assert.equal(collectionfeed.totalResults, 15);
			assert.equal(collectionfeed.apiVersion, null);
			//deepassert.equal(collectionfeed.links, );
			assert.equal(collectionfeed.lastPageStart, '');
			assert.equal(collectionfeed.lastPage, 1);
			assert.equal(collectionfeed.currentPage, 1);
			
			var expectedDate = new Date();
			expectedDate.setTime( Date.parse( '2011-06-29T14:29:32Z' ) );
			assert.equal(collectionfeed.updated.toString(), expectedDate.toString() );
			
			
			start();
		});
	});
});