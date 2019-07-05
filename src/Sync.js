

//import { Logger } from './Log.js';
const log = new Logger('libZotero:Sync');

// sync pull:
// upload changed data
// get updatedVersions for collections
// get updatedVersions for searches
// get upatedVersions for items
// (sanity check versions we have for individual objects?)
// loadCollectionsFromKeys
// loadSearchesFromKeys
// loadItemsFromKeys
// process updated objects:
//      ...
// getDeletedData
// process deleted
// checkConcurrentUpdates (compare Last-Modified-Version from collections?newer request to one from /deleted request)
Zotero.Library.prototype.syncLibrary = async function (_full) {
	// TODO: upload dirty collections
	// TODO: upload dirty items
	
	// pull down updated collections
	await this.loadUpdatedCollections();
	await this.loadUpdatedItems();
};
