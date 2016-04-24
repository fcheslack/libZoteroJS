'use strict';

var log = require('./Log.js').Logger('libZotero:Searches');

module.exports = function(){
	this.instance = 'Zotero.Searches';
	this.searchObjects = {};
	this.syncState = {
		earliestVersion: null,
		latestVersion: null
	};
};
