'use strict';

var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var Zotero = require('../../src/libzoterojs.js');

Zotero.testing = {
	libraryID: 0,
	libraryType: 'user'
};
Zotero.init();


describe.skip( 'Fetch Groups', function(){
	it('should fetch groups without error', function(){
		Zotero.config.apiKey = '';
		var library = new Zotero.Library('user', 0, '', '');
		
		var d = library.groups.fetchUserGroups(0);
		
		d.done(function(){
			assert.isOk(library.groups.groupsArray.length > 0, 'non-empty groups array');
			console.log('num groups: ' + library.groups.groupsArray.length);
			console.log(library.groups.groupsArray);
			for(var i = 0; i < library.groups.groupsArray.length; i++){
				console.log('Group name: ' + library.groups.groupsArray[i].get('name'));
				console.log(library.groups.groupsArray[i]);
			}
			
			start();
		}.bind(this) );
	});
});