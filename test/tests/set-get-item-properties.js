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


describe( 'Set/Get item properties', function() {
	it('should correctly set/get item properties', function(){

		var journalTemplate = {
			'itemType':'journalArticle',
			'title':'',
			'creators':[{'creatorType':'author','firstName':'','lastName':''}],
			'abstractNote':'',
			'publicationTitle':'',
			'volume':'',
			'issue':'',
			'pages':'',
			'date':'',
			'series':'',
			'seriesTitle':'',
			'seriesText':'',
			'journalAbbreviation':'',
			'language':'',
			'DOI':'',
			'ISSN':'',
			'shortTitle':'',
			'url':'',
			'accessDate':'',
			'archive':'',
			'archiveLocation':'',
			'libraryCatalog':'',
			'callNumber':'',
			'rights':'',
			'extra':'',
			'tags':[],
			'collections':[],
			'relations':{}
		};

		var item = new Zotero.Item();
		item.initEmptyFromTemplate(journalTemplate);

		item.set('title', 'Journal Article Title');
		item.set('key', 'ASDF1234');
		item.set('version', 74);
		item.set('itemType', 'conferencePaper');
		item.set('deleted', 1);
		item.set('parentItem', 'HJKL9876');
		item.set('abstractNote', 'This is a test item.');
		item.set('notRealField', 'Not a real field value.');

		//test that get returns what it should for each set
		assert.equal(item.get('title'), 'Journal Article Title', 'get title should return what was set.');
		assert.equal(item.get('key'), 'ASDF1234', 'get key should return what was set.');
		assert.equal(item.get('version'), 74, 'get version should return what was set.');
		assert.equal(item.get('itemType'), 'conferencePaper', 'get itemType should return what was set.');
		assert.equal(item.get('deleted'), 1, 'get deleted should return what was set.');
		assert.equal(item.get('parentItem'), 'HJKL9876', 'get parentItem should return what was set');
		assert.equal(item.get('abstractNote'), 'This is a test item.', 'get abstractNote should return what was set.');
		assert.equal(item.get('notRealField'), null, 'get fake field value should return null.');

		assert.equal(item.apiObj.data.title, 'Journal Article Title', 'title should be set on item apiObj');
		assert.equal(item.pristineData.title, '', 'title should not be set on item pristine');

		assert.equal(item.key, 'ASDF1234', 'key should be set on item object');
		assert.equal(item.apiObj.key, 'ASDF1234', 'key should be set on item apiObj');
		assert.equal(item.pristineData.key, undefined, 'key should be undefined on pristine');

		assert.equal(item.version, 74, 'version should be set on item object');
		assert.equal(item.apiObj.data.version, 74, 'version should be set on item apiObj');
		assert.equal(item.pristineData.version, undefined, 'version should be undefined on item pristine');

		assert.equal(item.deleted, undefined, 'deleted should not be set on item object');
		assert.equal(item.apiObj.data.deleted, 1, 'deleted should be set on item apiObj');
	});
});

