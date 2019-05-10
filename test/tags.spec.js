

const assert = require('chai').assert;
const Zotero = require('../src/libzotero.js');
const tagsApiObjectsFixture = require('./fixtures/tags-1.json');

describe('Zotero.Tags', () => {
	describe('Tags', () => {
		let tags;

		beforeEach(() => {
			tags = new Zotero.Tags();
			tags.addTagsFromJson(tagsApiObjectsFixture);
		});

		it('should instantiate tags from api objects', () => {
			assert.equal(tags.instance, 'Zotero.Tags');
			assert.lengthOf(tags.tagsArray, 23);
		});

		it('should allow access by tag string', () => {
			let t = tags.getTag('unread');
			assert.equal(t.instance, 'Zotero.Tag');
			assert.equal(t.get('tag'), 'unread');
			assert.equal(t.get('type'), 0);
			assert.equal(t.get('numItems'), 1);
		});
	});

	describe('TagColors', () => {
		let tagColors;

		beforeEach(() => {
			tagColors = new Zotero.TagColors([
				{ name: 'redtag', color: '#FF0000' },
				{ name: 'greentag', color: '#00FF00' },
				{ name: 'bluetag', color: '#0000FF' }
			]);
		});
		
		it('should instantiate TagColors from argument array', () => {
			assert.equal(tagColors.instance, 'Zotero.TagColors');
			assert.equal(tagColors.colors.size, 3);
			assert.lengthOf(tagColors.colorsArray, 3);
		});

		it('should return colors matching passed tags', () => {
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
