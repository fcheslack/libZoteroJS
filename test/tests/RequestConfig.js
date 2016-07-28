'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var RequestConfig = require('../../src/RequestConfig.js');

describe('RequestConfig', function(){
	describe('build', function() {
		it('should add properties to config as we chain the various methods', function(){
			let rc = new RequestConfig().LibraryType('group').LibraryID(1).Target('items');
			assert.equal('group', rc.config['libraryType']);
			assert.equal(1, rc.config['libraryID']);
			assert.equal('items', rc.config['target']);
		});

		it('should validate cleanly when config is good', function(){
			let rc = new RequestConfig().LibraryType('group').LibraryID(1).Target('items');
			assert.equal(true, rc.Validate());
		});

		it('should return false validation when config has a bad parameter', function(){
			let rc = new RequestConfig().LibraryType('group').LibraryID(1).Target('items').CollectionKey('invalidCollectionKey');
			assert.equal(false, rc.Validate());
		});

		it('should strip out the bad parameter from config when validating', function(){
			let rc = new RequestConfig().LibraryType('group').LibraryID(1).Target('items').CollectionKey('invalidCollectionKey');
			assert.equal(false, rc.Validate());
			assert.notEqual('invalidCollectionKey', rc.config['collectionKey']);
		});
	});
});