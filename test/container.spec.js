'use strict';

const assert = require('chai').assert;
const Zotero = require('../src/libzotero.js');
const itemsApiObjectsFixture = require('./fixtures/items-response-body.json');

describe('Zotero.Container', () => {
	describe('Container', () => {
		let container = new Zotero.Container();
		let library = new Zotero.Library('user', 10150, 'fcheslack', '');
		let apiob = new Zotero.ApiObject();
		apiob.key = '1234ABCD';

		it('should add objects to map and array', () => {
			container.addObject(apiob);
			assert.equal(container.objectArray[0].key, '1234ABCD');
			assert.equal(container.objectMap['1234ABCD'], apiob);
			assert.lengthOf(container.objectArray, 1);
		});

		it('should allow getting objects by key', () => {
			let ob = container.getObject('1234ABCD');
			assert.deepEqual(ob, apiob);
		});
	});
});