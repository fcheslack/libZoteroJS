'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../libzoterojs.js');

Zotero.init();

var itemjson = require('../fixtures/item1.json');

describe('Zotero.Item', function(){
	describe('#Construct', function() {
		it('should instantiate item from api object', function(){
			var item = new Zotero.Item(itemjson);

			assert.equal(item.instance, 'Zotero.Item');
			assert.equal(item.key, 'NSBERGDK');
			assert.equal(item.version, 6821);
			assert.deepEqual(item.pristineData, itemjson.data);
			assert.equal(item.apiObj.data.title, '3D virtual worlds as collaborative communities enriching human endeavours: Innovative applications in e-Learning');
			assert.equal(item.get('title'), '3D virtual worlds as collaborative communities enriching human endeavours: Innovative applications in e-Learning');
			
			assert.lengthOf(item.get('creators'), 4);
		});
	});

	describe('#Construct empty', function() {
		it('should instantiate an empty item', function(){
			var item = new Zotero.Item();

			assert.equal(item.instance, 'Zotero.Item');
			assert.equal(item.key, '');
			assert.equal(item.version, 0);
			
		});
	});
});