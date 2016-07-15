'use strict';

var assert = require("chai").assert;
var should = require("chai").should();
var expect = require("chai").expect;

var Utils = require("../../src/Utils.js");

describe('Zotero.Utils', function() {
	describe('#randomString()', function () {
		it("should return an 8 character string", function(){
			var s = Utils.randomString(8);
			assert.equal(8, s.length);
		});
		it("should return all As", function(){
			var s = Utils.randomString(8, "A");
			assert.equal("AAAAAAAA", s);
		});
	});

	describe('#getKey()', function () {
		it("should return an 8 character string", function(){
			var s = Utils.getKey();
			assert.equal(8, s.length);
		});
	});
	
	describe("#slugify()", function() {
		it("should lowercase and strip out or convert url hostile chars", function(){
			assert.equal(Utils.slugify("Faolan C-P"), "faolan_c-p");
			assert.equal(Utils.slugify("test group & name"), "test_group__name");
			assert.equal(Utils.slugify("name@mail.com"), "namemail.com");
		});
	});

	describe("#libraryString()", function() {
		it("should construct proper library strings from type/id", function(){
			assert.equal(Utils.libraryString("group", 74), "g74");
			assert.equal(Utils.libraryString("user", 10150), "u10150");
			assert.equal(Utils.libraryString("publications", 56), "p56");
		});
	});

	describe("#parseLibString()", function() {
		it("should deconstruct proper library strings to type/id", function(){
			assert.equal(Utils.parseLibString("g74").libraryType, 'group');
			assert.equal(Utils.parseLibString("g74").libraryID, 74);
			
			assert.equal(Utils.parseLibString("u10150").libraryType, 'user');
			assert.equal(Utils.parseLibString("u10150").libraryID, 10150);
			
			assert.equal(Utils.parseLibString("p56").libraryType, 'publications');
			assert.equal(Utils.parseLibString("p56").libraryID, 56);
		});

		it("should throw on bad library strings", function(){
			expect(Utils.parseLibString.bind(Utils, "ug10")).to.throw(Error);
			expect(Utils.parseLibString.bind(Utils, "r34")).to.throw(Error);
			expect(Utils.parseLibString.bind(Utils, "upanda")).to.throw(Error);
		});
	});

	describe("#parseApiDate()", function() {
		it("should parse a properly formatted date string from the Zotero API", function(){
			var parsed = Utils.parseApiDate("2010-09-04T09:34:42Z");
			var created = new Date(Date.UTC(2010, 8, 4, 9, 34, 42));
			assert.equal(parsed.toISOString, created.toISOString);
		});

		it('should return null if the date is not formatted properly', function(){
			assert.equal(Utils.parseApiDate("2010/09/04T09:34:42Z"), null);
			assert.equal(Utils.parseApiDate("June 12, 1994"), null);
		});
	});
});