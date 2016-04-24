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


/*
 * Test cases:
 * create a new item with no children
 *     single POST to /items
 */
describe.skip( 'Create item', function(){
	it("should create item", function(){
		console.log('config:');
		console.log(Zotero.config);
		var library = new Zotero.Library(Zotero.testing.libraryType, Zotero.testing.libraryID, '', '');
		
		var item = new Zotero.Item();
		item.associateWithLibrary(library);
		var d = item.initEmpty('conferencePaper');
		d.done(function(item){
			item.set('title', 'GurunGo: coupling personal computers and mobile devices through mobile data types');
			item.set('conferenceName', 'Eleventh Workshop on Mobile Computing Systems & Applications');
			
			var writeItemD = item.writeItem();
			writeItemD.done(function(itemsArray){
				assert.equal(itemsArray.length, 1, 'We expect 1 items was written');
				assert.isOk(itemsArray[0].itemKey, 'We expect the first item to have an itemKey');
				
				//delete the newly created items
				var deleteXhr = library.items.deleteItems(itemsArray);
				deleteXhr.done(function(data, statusText, jqxhr){
					assert.equal(jqxhr.status, 204, 'Expect successful delete to respond with 204 no content');
					start();
				});
			});
		}.bind(this) );
	});
});