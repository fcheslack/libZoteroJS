'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../src/libzotero.js');

Zotero.init();

describe('Zotero', function(){
	describe('TagColors', function() {
		let tagColors;
		
		it('should instantiate TagColors from argument array', function(){
			tagColors = new Zotero.TagColors([
				{name:'redtag', color:'#FF0000'},
				{name:'greentag', color:'#00FF00'},
				{name:'bluetag', color:'#0000FF'}
			]);
			
			assert.equal(tagColors.instance, 'Zotero.TagColors');
			assert.equal(tagColors.colors.size, 3);
			assert.lengthOf(tagColors.colorsArray, 3);
		});

		it('should return colors matching passed tags', function(){
			let matches = tagColors.match(['redtag', 'purpletag', 'pandatag']);

			assert.lengthOf(matches, 1);
			assert.equal(matches[0], '#FF0000');

			matches = tagColors.match(['purpletag', 'pandatag']);
			assert.lengthOf(matches, 0);

			matches = tagColors.match(['bluetag', 'redtag', 'purpletag']);
			assert.lengthOf(matches, 2);
			assert.equal(matches[0], '#0000FF');

		});
	});
});