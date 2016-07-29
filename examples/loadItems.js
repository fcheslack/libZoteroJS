var Zotero = require('../lib/libzotero.js');

var groupLib = new Zotero.Library('group', 729, 'all_things_zotero');

groupLib.loadItems({tag:'news'}).then((response)=>{
	response.loadedItems.forEach((it)=>{
		console.log(it.get('title'));
	});
});
