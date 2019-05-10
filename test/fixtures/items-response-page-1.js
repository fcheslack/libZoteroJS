const responseBody = require('./items-response-page-1-body.json');

module.exports = new Response(JSON.stringify(responseBody), {
	status: 200,
	statusText: 'OK',
	headers: {
		'Zotero-API-Version': 3,
		'Total-Results': 190,
		Link: '<https://apidev.zotero.org/groups/12/items?start=25>; rel="next", <https://apidev.zotero.org/groups/12/items?start=175>; rel="last", <https://staging.zotero.net/groups/12/items>; rel="alternate"',
		'Last-Modified-Version': 2869,
		Vary: 'Host,Accept-Encoding',
		'Content-Type': 'application/json',
		'Transfer-Encoding': 'chunked'
	}
});
