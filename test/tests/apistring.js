'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../src/libzotero.js');

Zotero.testing = {
	libraryID: 0,
	libraryType: 'user'
};

describe( 'Zotero.Ajax.apiRequestUrl', function() {
	describe('#apiRequest()', function () {
		it("should generate the expected patterns from various configs", function(){
			
			var oldBaseApiUrl = Zotero.config.baseApiUrl;
			Zotero.config.baseApiUrl = 'https://api.zotero.org';
			
			var config;
			
			config = {'target':'collections', 'libraryType':'user', 'libraryID':1, 'content':'json', limit:'100'};

			assert.equal(Zotero.ajax.apiRequestUrl(config), 'https://api.zotero.org/users/1/collections');
			assert.equal(Zotero.ajax.apiQueryString(config), '?content=json&limit=100');
			
			config = {'target':'items', 'libraryType':'group', 'libraryID':1, 'format':'atom', 'content':'json', limit:'100'};
			assert.equal(Zotero.ajax.apiRequestUrl(config), 'https://api.zotero.org/groups/1/items');
			assert.equal(Zotero.ajax.apiQueryString(config), '?content=json&format=atom&limit=100');
			
			config = {'target':'item', 'libraryType':'user', 'libraryID':1, 'content':'json,coins', limit:'25'};
			assert.equal(Zotero.ajax.apiRequestUrl(config), 'https://api.zotero.org/users/1/items');
			assert.equal(Zotero.ajax.apiQueryString(config), '?content=json%2Ccoins&limit=25');
			
			config = {'target':'item', 'libraryType':'user', 'libraryID':1, 'content':'json', itemKey:'ASDF1234'};
			assert.equal(Zotero.ajax.apiRequestUrl(config), 'https://api.zotero.org/users/1/items/ASDF1234');
			assert.equal(Zotero.ajax.apiQueryString(config), '?content=json');
			
			config = {'target':'items', 'libraryType':'user', 'libraryID':1, 'content':'bibtex', limit:'100', itemKey:'ASDF1234,FDSA4321'};
			assert.equal(Zotero.ajax.apiRequestUrl(config), 'https://api.zotero.org/users/1/items');
			assert.equal(Zotero.ajax.apiQueryString(config), '?content=bibtex&itemKey=ASDF1234%2CFDSA4321&limit=100');
			
			config = {'target':'deleted', 'libraryType':'user', 'libraryID':1, 'content':'json', limit:'100'};
			assert.equal(Zotero.ajax.apiRequestUrl(config), 'https://api.zotero.org/users/1/deleted');
			assert.equal(Zotero.ajax.apiQueryString(config), '?content=json&limit=100');
			
			config = {'target':'children', 'libraryType':'user', 'libraryID':1, 'itemKey':'ASDF1234', 'content':'json', limit:'100'};
			assert.equal(Zotero.ajax.apiRequestUrl(config), 'https://api.zotero.org/users/1/items/ASDF1234/children');
			assert.equal(Zotero.ajax.apiQueryString(config), '?content=json&limit=100');

			config = {'target':'children', 'libraryType':'user', 'libraryID':1, 'itemKey':'ASDF1234', 'format':'csljson', limit:'100'};
			assert.equal(Zotero.ajax.apiRequestUrl(config), 'https://api.zotero.org/users/1/items/ASDF1234/children');
			assert.equal(Zotero.ajax.apiQueryString(config), '?format=csljson&limit=100');
			
			config = {'target':'key', apiKey:'NOTANAPIKEY', libraryType:''};
			assert.equal(Zotero.ajax.apiRequestUrl(config), 'https://api.zotero.org/keys/NOTANAPIKEY');
			assert.equal(Zotero.ajax.apiQueryString(config), '?');
			
			Zotero.config.baseApiUrl = oldBaseApiUrl;
		});
	});
} );

