Overview
--------
This is a Zotero API client for the browser and node.

Please note that this library should not be considered stable. Most of what is implemented works, but for the moment breaking changes may still happen in any release.

Getting The Library
-------------------

The easiest way to obtain the latest version is to use npm:

	npm i libzotero

Alternatively you can download the latest release directly from Github:

	https://github.com/fcheslack/libZoteroJS

Whichever option you choose, for the browser you will need to include `libzotero.js` from the `build` on your page. When included API will be accessbile via a global object `Zotero`. Additionaly this file follows an [Universal Module Definition](https://github.com/umdjs/umd) which means you can also use this library in systems that use AMD (e.g. [RequireJS](http://requirejs.org/)) or CommonJS module loader mechanism.

Alternatively, in node environemnt and within Browserify-based builds you can just do:

	var Zotero = require('libzotero');



###Using the library

libZotero provides various helper functions for working with the Zotero REST API, as well as 'classes' representing Zotero's fundamental objects and containers for those objects. Each object in a library has a key that uniquely identifies it within that library. A Library is of a particular type (user, group). Libraries contain Items, Collections, and Tags. Within Items are references to the collections and tags they are associated with. That is the core of the Zotero API. (There are also some more peripheral things like Settings for a library, which includes tag color associations.)

Access is managed with Zotero API keys. A key is associated with a single user, and can grant access (with various permissions) to any or all of the libraries the user has access to.

libZotero has been written with a primary use case of a single page application representing the primary objects in a single library. For such a use, the entry point will generally be to instantiate a Zotero.Library

	var library = new Zotero.Library(<user|group|publications>, <userID|groupID>, <urlIdentifier; can be left blank in most cases>, <apiKey>);`

which can then be used to load the various objects belonging to that library, using the provided API key for permissions, or making unprivileged requests for public resources.

Calls that use the network return promises with a response object. These can be made directly and return unprocessed data, but most of the helper functions will first process the returned data in some way, for example adding retrieved items to a Library's items container. The body of the request will be left intact as a `data` property accessible when the promise is resolved.

	library.loadItems().then((response)=>{
		//access the returned JSON directly
		let itemsJson = response.data;
		itemsJson.forEach((itemObj)=>{
			//create an instance of Zotero.Item from the JSON
			let item = new Zotero.Item(itemObj);
			console.log(item.get('title'));
		});
	});

Along with adding the items to the calling Library's Items container, Library.loadItems automatically does that for you, and includes the items as an array on the response:

	library.loadItems().then((response)=>{
		response.loadedItems.forEach((it)=>{
			console.log(it.get('title'));
		});
	});


For simpler needs, when all you want is to get a particular set of items to work with, you can use the more convenient Fetcher. A Fetcher takes a config describing the objects you want and allows you to either paginate through as many results as you need, or automatically fetch the entire set
(see the Fetcher.js and FetchAll.js examples).


####Request config

libZotero constructs requests based on a config object that can specify the paths and query parameters described in the [Zotero API documentation](https://www.zotero.org/support/dev/web_api/v3/basics).

Most of the helper functions will have default configs already specifying, for example, the library type, library ID, and object type you're requesting. This is combined with default arguments from Zotero.config, and can generally be overridden or extended by passing another object to the function you're calling.

That way, instead of loading an unfiltered set of items with 

	library.loadItems()

you can load only the items with a particular tag and in a particular collection, with

	library.loadItems({
		tag:'news',
		collectionKey:'ASDF1234'
	});

