var Zotero = require('../lib/libzotero.js');

var config = new Zotero.RequestConfig().LibraryType('user').LibraryID(3).Target('publications').config;
var fetcher = new Zotero.Fetcher(config);

fetcher.next().then((response)=>{
	//the parsed json array of items that the api returned is on response.data,
	//we can loop through them and create a Zotero.Item for each
	console.log('\naccessing the items directly from this response:')
	response.data.forEach((itemJson)=>{
		let item = new Zotero.Item(itemJson);
		console.log(item.get('title'));
	});
}).then(()=>{
	//the array was also saved in fetcher.results
	console.log('\nfetcher.results:');
	fetcher.results.forEach((itemJson)=>{
		let item = new Zotero.Item(itemJson);
		console.log(item.get('title'));
	});
}).then(()=>{
	if(fetcher.hasMore){
		console.log('\nfetcher still has more results we can retrieve with a next()');
	} else {
		console.log('\nwe got all the results there are');
	}

	//totalResults is populated when the first set is retrieved, so we can tell how many more there are
	console.log(`\nthere are ${fetcher.totalResults} results available, and we've already gotten ${fetcher.results.length}`);
});

