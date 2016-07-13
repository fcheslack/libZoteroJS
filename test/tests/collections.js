'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../src/libzotero.js');

Zotero.init();

var collectionApiObjects = require('../fixtures/collections1.json');

describe('Zotero.Collections', function(){
	describe('#Construct', function() {
		let collections = new Zotero.Collections();
		
		it('should instantiate collections from api objects', function(){
			collections.addCollectionsFromJson(collectionApiObjects);
			collections.initSecondaryData();

			assert.equal(collections.instance, 'Zotero.Collections');

			assert.lengthOf(collections.collectionsArray, 72);
		});
		it('should have instances in both collectionObjects and collectionsArray', function(){
			let keys = Object.keys(collections.collectionObjects);
			assert.lengthOf(keys, 72);
		});

		it('should allow accessing collections by key', function(){
			let c = collections.getCollection('TVS6NGIC');
			assert.equal(c.instance, 'Zotero.Collection');
			assert.equal(c.key, 'TVS6NGIC');
			assert.equal(c.get('version'), 1);
			assert.equal(c.get('name'), 'samples');
		});

		it('should process collections with secondary attributes, including nesting', function(){
			let c = collections.getCollection('TVS6NGIC');
			assert.equal(c.hasChildren, true);
			assert.equal(c.nestingDepth, 1);
			assert.equal(c.hasChildren, true);
			assert.lengthOf(c.children, 7);
		});
	});
});