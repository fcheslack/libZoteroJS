'use strict';

var log = require('./Log.js').Logger('libZotero:Search');

class Search {
	constructor(){
		this.instance = 'Zotero.Search';
		this.searchObject = {};
	}
};

export {Search};
