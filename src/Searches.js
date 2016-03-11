'use strict';

module.exports = function(){
	this.instance = 'Zotero.Searches';
	this.searchObjects = {};
	this.syncState = {
		earliestVersion: null,
		latestVersion: null
	};
};
