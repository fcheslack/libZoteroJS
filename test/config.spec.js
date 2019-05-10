

const assert = require('chai').assert;
const Zotero = require('../src/libzotero.js');

describe('Zotero.config', () => {
	it('should have default values set', () => {
		assert.equal(Zotero.config.baseApiUrl, 'https://api.zotero.org');
		assert.equal(Zotero.config.baseZoteroWebsiteUrl, 'https://www.zotero.org');
		assert.deepEqual(Zotero.config.sortOrdering, {
			dateAdded: 'desc',
			dateModified: 'desc',
			date: 'desc',
			year: 'desc',
			accessDate: 'desc',
			title: 'asc',
			creator: 'asc'
		});
	});
});
