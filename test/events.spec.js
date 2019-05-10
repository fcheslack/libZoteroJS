

const assert = require('chai').assert;
const Zotero = require('../src/libzotero.js');

describe('Zotero.Events', () => {
	let counter = 0;

	// set up listeners to increment and decrement counter
	Zotero.listen('increment', () => {
		counter += 1;
	});
	Zotero.listen('decrement', () => {
		counter -= 1;
	});

	Zotero.listen('incrementBy', (ev) => {
		counter += ev.data.by;
	});
	Zotero.listen('decrementWithData', (ev) => {
		counter -= ev.data.amount;
	}, { amount: 5 });

	it('should increment counter when we trigger an increment event', () => {
		Zotero.trigger('increment');

		assert.equal(counter, 1);
	});

	it('should decrement counter when we trigger a decrement event', () => {
		counter = 10;

		Zotero.trigger('decrement');
		assert.equal(counter, 9);
	});

	it('should increment by the amount passed in data', () => {
		counter = 0;

		Zotero.trigger('incrementBy', { by: 7 });
		assert.equal(counter, 7);
	});

	it('should decrement with the amount in listen data', () => {
		counter = 25;
		Zotero.trigger('decrementWithData');

		assert.equal(counter, 20);
	});
});
