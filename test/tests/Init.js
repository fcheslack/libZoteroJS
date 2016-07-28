'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;

var config = {
	'target':'publications',
	'libraryType':'user',
	'libraryID':3
};

describe('Zotero.Init', function(){
	it('should have already be initialized when it is required', function(){
		var Zotero = require('../../src/libzotero.js');
		var groupLib = new Zotero.Library('group', 729, 'all_things_zotero');
		
	});
});