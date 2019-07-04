

import { Logger } from './Log.js';
const log = new Logger('libZotero:Search');

class Search {
	constructor() {
		this.instance = 'Zotero.Search';
		this.searchObject = {};
	}
}

export { Search };
