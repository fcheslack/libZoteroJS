

import { Logger } from './Log.js';
const log = new Logger('libZotero:Searches');

class Searches {
	constructor() {
		this.instance = 'Zotero.Searches';
		this.searchObjects = {};
		this.syncState = {
			earliestVersion: null,
			latestVersion: null
		};
	}
}

export { Searches };
