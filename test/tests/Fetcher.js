'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../src/libzotero.js');
var log = require('../../src/Log.js').Logger('libZotero:Fetcher:Test');

var fetchMock;

var config = {
	'target':'publications',
	'libraryType':'user',
	'libraryID':3
};

var fetcher = new Zotero.Fetcher(config);

var config2 = {
	'target': 'items',
	'libraryType': 'group',
	'libraryID': 12
};

var fetcher2 = new Zotero.Fetcher(config2);

describe('Zotero.Fetcher', function(){
	before(function(){
		fetchMock = require('fetch-mock');

		var pubResponse = require('../fixtures/publicationsResponse.js');
		fetchMock.mock('^https://api.zotero.org/users/3/publications/items', pubResponse, {name:'publications'});

		fetchMock.mock('^https://api.zotero.org/groups/12/items?limit=25&start=0', require('../fixtures/firstPageVirtualWorldsItemsResponse.js'), {name:'virtual_page1'});
		fetchMock.mock('^https://api.zotero.org/groups/12/items?limit=25&start=25', require('../fixtures/secondPageVirtualWorldsItemsResponse.js'), {name:'virtual_page2'});
		
		//catch unexpected urls and throw
		fetchMock.mock('*', {throws:'unmocked url matched'}, {name:'wildcard'});
	});

	after(function(){
		fetchMock.restore();
	});

	describe('Fetchall', function() {
		it('should fetch all publications', function(){
			return fetcher.fetchAll()
			.then(function(publications){
				assert.lengthOf(publications, 4);
				return publications;
			}, function(response){
				assert.fail('caught error in Zotero.Fetcher Fetchall test');
				log.debug(response);
				throw response;
			});
		});
	});

	describe('Fetch multiple', function() {
		it('should fetch first page', function(){
			return fetcher2.next()
			.then(function(response){
				assert.lengthOf(response.data, 25);
				return response;
			}, function(response){
				assert.fail('caught error in Zotero.Fetcher Fetch multiple test');
			}).then(function(){
				//log.debug(fetchMock.lastUrl('virtual_page1'));
			});
		});

		it('should fetch second page', function(){
			return fetcher2.next()
			.then(function(response){
				assert.lengthOf(response.data, 25);
				return response;
			}, function(response){
				assert.fail('caught error in Zotero.Fetcher Fetch multiple test');
				throw response;
			});
		});
	});
});