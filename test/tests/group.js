'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../src/libzotero.js');

Zotero.init();

var groupjson = require('../fixtures/group1.json');

describe('Zotero.Group', function(){
	describe('#Construct', function() {
		it('should instantiate group from api object', function(){
			let group = new Zotero.Group(groupjson);

			assert.equal(group.instance, 'Zotero.Group');
			assert.equal(group.apiObj.id, 1);
			assert.equal(group.apiObj.version, 1);
			assert.deepEqual(group.apiObj.data, groupjson.data);
			assert.equal(group.get('id'), 1);
			assert.equal(group.get('version'), 1);
			assert.equal(group.get('name'), 'Panda');
			assert.equal(group.get('owner'), 14058);
			assert.equal(group.get('type'), 'PublicClosed');
			
			assert.lengthOf(group.get('admins'), 2);
			assert.lengthOf(group.get('members'), 1);
		});
	});

	describe('#get', function() {
		it('should return empty arrays when admin/members not set on api object', function(){
			let modifiedGroupJson = groupjson;
			delete modifiedGroupJson.data.admins;
			delete modifiedGroupJson.data.members;
			
			let group = new Zotero.Group(modifiedGroupJson);

			assert.equal(true, Array.isArray(group.get('admins')));
			assert.equal(true, Array.isArray(group.get('members')));
			assert.lengthOf(group.get('admins'), 0);
			assert.lengthOf(group.get('members'), 0);
		});
	});
});