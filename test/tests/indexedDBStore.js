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


describe.skip( 'Zotero.Idb', function() {
	it("test Zotero IDB", function(){
		//TODO: actually write tests
		//destroy any existing IDB
		//initialize Zotero.Idb
		//instantiate library
		//preload some items
		//preload some collections
		//preload some tags
		//save to indexedDB
		//delete library with all items, collections, tags
		//instantiate new library
		//load from indexedDB
		//test for accurate items
		//test for accurate collections
		//test for accurate tags
	});
} );

