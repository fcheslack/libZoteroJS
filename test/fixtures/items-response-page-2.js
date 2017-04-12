const responseBody = require('./items-response-page-2-body.json');

module.exports = new Response(JSON.stringify(responseBody), {
	status:200,
	statusText:'OK',
	headers:{
		'Zotero-API-Version': 3,
		'Total-Results': 190,
		'Link': '<https://apidev.zotero.org/groups/12/items>; rel="first", <https://apidev.zotero.org/groups/12/items>; rel="prev", <https://apidev.zotero.org/groups/12/items?start=50>; rel="next", <https://apidev.zotero.org/groups/12/items?start=175>; rel="last", <https://staging.zotero.net/groups/12/items>; rel="alternate"',
		'Last-Modified-Version': 2869,
		'Vary': 'Host,Accept-Encoding',
		'Content-Type': 'application/json'
	}
});