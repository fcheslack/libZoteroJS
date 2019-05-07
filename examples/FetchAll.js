/* eslint-disable no-console */

let Zotero = require('../lib/libzotero.js');

// if we want know we want to get all the results, we can have a Fetcher do that before we look at any of them
// note that this could take a while if there are a lot of results.
var config = new Zotero.RequestConfig()
	.LibraryType('group')
	.LibraryID(729)
	.Target('items')
	.config;
var fetcher = new Zotero.Fetcher(config);

fetcher.fetchAll().then(() => {
	let results = fetcher.results;
	console.log(`\nthere are ${fetcher.totalResults} results available, and we've already gotten ${results.length}\n`);

	results.forEach((itemJson) => {
		let item = new Zotero.Item(itemJson);
		console.log(item.get('title'));
	});
});
