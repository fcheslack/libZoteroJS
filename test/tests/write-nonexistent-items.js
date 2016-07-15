'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../src/libzotero.js');

Zotero.testing = {
	libraryID: 0,
	libraryType: 'user'
};

describe.skip( 'Write Nonexistent Items', function(){
	it("should write nonexistent items", function(){
		console.log('config:');
		console.log(Zotero.testing);
		var library = new Zotero.Library(Zotero.testing.libraryType, Zotero.testing.libraryID, '', '');
		
		var item = new Zotero.Item();
		item.associateWithLibrary(library);
		var d = item.initEmpty('conferencePaper');
		d.done(function(item){
			item.updateItemKey('ASDF1234');
			item.set('itemVersion', 3);
			item.set('title', 'GurunGo: coupling personal computers and mobile devices through mobile data types');
			item.set('conferenceName', 'Eleventh Workshop on Mobile Computing Systems & Applications');
			
			var writeItemD = item.writeItem();
			writeItemD.done(function(itemsArray){
				assert.equal(itemsArray.length, 1, 'We expect 1 item to be affected');
				var itemAfter = itemsArray[0];
				assert.isOk(itemAfter.writeFailure, 'Expect item to have something in writeFailure');
				assert.equal(itemAfter.writeFailure.key, 'ASDF1234', 'Expect failed item to keep same fake key we gave it.');
				assert.equal(itemAfter.writeFailure.code, 400, 'Expect write to have failed because of invalid item key');
				assert.isOk(itemAfter.writeFailure.message, 'Expect some message text in the failure object, may not be fixed so anything will do.');
				
				//delete the non-existent items
				var deleteXhr = library.items.deleteItems(itemsArray);
				deleteXhr.done(function(data, statusText, jqxhr){
					assert.equal(jqxhr.status, 204, 'Expect multi-delete to respond with 204 even for non-existent item');
					
					//try deleting with single item method
					var delete2Xhr = library.items.deleteItem(item);
					delete2Xhr.always(function(jqxhr){
						assert.equal(jqxhr.status, 404, 'Expect delete of single non-existent item to respond with 404');
						
						start();
						
					}.bind(this) );
				}.bind(this) );
			}.bind(this) );
		}.bind(this) );
	});
});