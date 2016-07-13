'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../src/libzotero.js');

Zotero.init();

var itemsApiObjects = require('../fixtures/virtual_worlds_items.json');

describe('Zotero.Items', function(){
	describe('Items', function() {
		let items = new Zotero.Items();
		
		it('should instantiate items from api objects', function(){
			items.addItemsFromJson(itemsApiObjects);

			assert.equal(items.instance, 'Zotero.Items');

			assert.lengthOf(items.objectArray, 190);
		});
		it('should allow access by key', function(){
			let i = items.getItem('ZB3CU5JJ');
			assert.equal(i.instance, 'Zotero.Item');
			assert.equal(i.get('version'), 1);
			assert.equal(i.get('title'), '3D Social Virtual Worlds: Research Issues and Challenges');
		});
	});
});