

var assert = require('chai').assert;
import { RequestConfig } from '../src/RequestConfig.js';

describe('RequestConfig', () => {
	describe('build', () => {
		it('should add properties to config as we chain the various methods', () => {
			let rc = new RequestConfig().LibraryType('group').LibraryID(1)
				.Target('items');
			assert.equal(rc.config.libraryType, 'group');
			assert.equal(rc.config.libraryID, 1);
			assert.equal(rc.config.target, 'items');
		});

		it('should validate cleanly when config is good', () => {
			let rc = new RequestConfig().LibraryType('group').LibraryID(1)
				.Target('items');
			assert.equal(rc.Validate(), true);
		});

		it('should return false validation when config has a bad parameter', () => {
			let rc = new RequestConfig().LibraryType('group').LibraryID(1)
				.Target('items')
				.CollectionKey('invalidCollectionKey');
			assert.equal(rc.Validate(), false);
		});

		it('should strip out the bad parameter from config when validating', () => {
			let rc = new RequestConfig().LibraryType('group').LibraryID(1)
				.Target('items')
				.CollectionKey('invalidCollectionKey');
			assert.equal(rc.Validate(), false);
			assert.notEqual(rc.config.collectionKey, 'invalidCollectionKey');
		});
	});
});
