

import { Logger } from './Log.js';
const log = new Logger('libZotero:Deleted');

class Deleted {
	constructor(data) {
		this.instance = 'Zotero.Deleted';
		if (typeof data === 'string') {
			this.deletedData = JSON.parse(data);
		} else {
			this.deletedData = data;
		}
		this.untilVersion = null;
		this.sinceVersion = null;
		this.waitingPromises = [];
		this.pending = false;
	}

	// create, save referece, and return a Promise that will be resolved
	// the next time we finish a deleted request
	addWaiter() {
		
	}
}

export { Deleted };
