'use strict';

var log = require('./Log.js').Logger('libZotero:Search');

module.exports = function(){
	this.instance = 'Zotero.Search';
	this.searchObject = {};
};
