/* eslint-disable no-console */

let Zotero = require('../lib/libzotero.js');

// do everything inside an async function so we can use await syntax
let runFetcher = async () => {
	// configure the request of what we're fetching
	var config = new Zotero.RequestConfig()
		.LibraryType('group')
		.LibraryID(729)
		.Target('items')
		.TargetModifier('top')// only top level items, no child notes or attachments
		.config;
	// create a new Fetcher using that config
	var fetcher = new Zotero.Fetcher(config);

	// get the next result for the fetcher (in this case the first result)
	let response = await fetcher.next();
	// the parsed json array of items that the api returned is on response.data,
	// we can loop through them and create a Zotero.Item for each
	console.log('\naccessing the items directly from this response:');
	response.data.forEach((itemJson) => {
		let item = new Zotero.Item(itemJson);
		console.log(item.get('title'));
	});
	
	// the array was also saved in fetcher.results
	console.log('\nfetcher.results:');
	fetcher.results.forEach((itemJson) => {
		let item = new Zotero.Item(itemJson);
		console.log(item.get('title'));
	});
	
	// fetcher.hasMore indicates whether there are more results that can be fetched
	if (fetcher.hasMore) {
		console.log('\nfetcher still has more results we can retrieve with a next()');
	} else {
		console.log('\nwe got all the results there are');
	}

	// totalResults is populated when the first set is retrieved, so we can tell how many more there are
	console.log(`\nthere are ${fetcher.totalResults} results available, and we've already gotten ${fetcher.results.length}`);
	
	// if we didn't want to use fetchAll, but still want to get more than one batch,
	// we can loop through fetching results until we have the amount we want
	while (fetcher.results.length < 50 && fetcher.hasMore) {
		// eslint-disable-next-line no-await-in-loop
		await fetcher.next();
	}
	
	console.log(`\nthere are ${fetcher.totalResults} results available, and now we've gotten ${fetcher.results.length}`);
	
	fetcher.results.forEach((itemJson) => {
		let item = new Zotero.Item(itemJson);
		console.log(item.get('title'));
	});
};
runFetcher();
