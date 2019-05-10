

const assert = require('chai').assert;
const expect = require('chai').expect;
const Zotero = require('../src/libzotero.js');
const Utils = Zotero.Utils;

describe('Zotero.Utils', () => {
	describe('randomString()', () => {
		it('should return an 8 character string', () => {
			var s = Utils.randomString(8);
			assert.equal(8, s.length);
		});
		it('should return all As', () => {
			var s = Utils.randomString(8, 'A');
			assert.equal('AAAAAAAA', s);
		});
	});

	describe('getKey()', () => {
		it('should return an 8 character string', () => {
			var s = Utils.getKey();
			assert.equal(8, s.length);
		});
	});
	
	describe('slugify()', () => {
		it('should lowercase and strip out or convert url hostile chars', () => {
			assert.equal(Utils.slugify('Faolan C-P'), 'faolan_c-p');
			assert.equal(Utils.slugify('test group & name'), 'test_group__name');
			assert.equal(Utils.slugify('name@mail.com'), 'namemail.com');
		});
	});

	describe('libraryString()', () => {
		it('should construct proper library strings from type/id', () => {
			assert.equal(Utils.libraryString('group', 74), 'g74');
			assert.equal(Utils.libraryString('user', 10150), 'u10150');
			assert.equal(Utils.libraryString('publications', 56), 'p56');
		});
	});

	describe('parseLibString()', () => {
		it('should deconstruct proper library strings to type/id', () => {
			assert.equal(Utils.parseLibString('g74').libraryType, 'group');
			assert.equal(Utils.parseLibString('g74').libraryID, 74);
			
			assert.equal(Utils.parseLibString('u10150').libraryType, 'user');
			assert.equal(Utils.parseLibString('u10150').libraryID, 10150);
			
			assert.equal(Utils.parseLibString('p56').libraryType, 'publications');
			assert.equal(Utils.parseLibString('p56').libraryID, 56);
		});

		it('should throw on bad library strings', () => {
			expect(Utils.parseLibString.bind(Utils, 'ug10')).to.throw(Error);
			expect(Utils.parseLibString.bind(Utils, 'r34')).to.throw(Error);
			expect(Utils.parseLibString.bind(Utils, 'upanda')).to.throw(Error);
		});
	});

	describe('parseApiDate()', () => {
		it('should parse a properly formatted date string from the Zotero API', () => {
			var parsed = Utils.parseApiDate('2010-09-04T09:34:42Z');
			var created = new Date(Date.UTC(2010, 8, 4, 9, 34, 42));
			assert.equal(parsed.toISOString, created.toISOString);
		});

		it('should return null if the date is not formatted properly', () => {
			assert.equal(Utils.parseApiDate('2010/09/04T09:34:42Z'), null);
			assert.equal(Utils.parseApiDate('June 12, 1994'), null);
		});
	});
});
