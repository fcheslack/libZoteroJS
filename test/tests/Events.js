'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../src/libzotero.js');

describe('Zotero.Events', function(){
	let counter = 0;

	//set up listeners to increment and decrement counter
	
	Zotero.listen('increment', ()=>{counter = counter + 1;});
	Zotero.listen('decrement', ()=>{counter = counter - 1;});

	Zotero.listen('incrementBy', (ev)=>{counter = counter + ev.data.by;});
	Zotero.listen('decrementWithData', (ev)=>{counter = counter - ev.data.amount;}, {amount:5});


	it('should increment counter when we trigger an increment event', function(){
		Zotero.trigger('increment');

		assert.equal(counter, 1);
	});

	it('should decrement counter when we trigger a decrement event', function(){
		counter = 10;

		Zotero.trigger('decrement');
		assert.equal(counter, 9);
	});

	it('should increment by the amount passed in data', function(){
		counter = 0;

		Zotero.trigger('incrementBy', {by:7});
		assert.equal(counter, 7);
	});

	it('should decrement with the amount in listen data', function(){
		counter = 25;
		Zotero.trigger('decrementWithData');

		assert.equal(counter, 20);
	});
});