'use strict';

var assert = require('chai').assert;
var Zotero = require('../src/libzotero.js');

describe('Zotero.extend', function(){
	
	it('should extend an object', function(){
		let ext = Zotero.extend({red:'red'}, {blue:'blue'});
		assert.equal(ext.red, 'red');
		assert.equal(ext.blue, 'blue');
	});
	/*
	it('should deep extend an object', function(){
		let original = {purple:'purple'};
		let ext = Zotero.deepExtend({red:'red'}, {blue:'blue'}, {nested:original});
		assert.equal(ext.red, 'red');
		assert.equal(ext.blue, 'blue');
		assert.equal(ext.nested.purple, 'purple');

		original.purple = 'notpurple';
		assert.equal(ext.nested.purple, 'purple');
	});

	it('should deep extend an object with a nested array', function(){
		let original = ['purple', 'green'];
		let ext = Zotero.deepExtend({red:'red'}, {blue:'blue'}, {nested:original});
		assert.equal(ext.red, 'red');
		assert.equal(ext.blue, 'blue');
		assert.equal(ext.nested, original);

		original.purple = 'notpurple';
		assert.equal(['purple', 'green'], ext.nested);
	});
	*/
});