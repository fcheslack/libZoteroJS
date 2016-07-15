'use strict';

var defaultConfig = {
	librarySettings: {},
	baseApiUrl: 'https://api.zotero.org',
	baseWebsiteUrl: 'https://zotero.org',
	baseFeedUrl: 'https://api.zotero.org',
	baseZoteroWebsiteUrl: 'https://www.zotero.org',
	baseDownloadUrl: 'https://www.zotero.org',
	nonparsedBaseUrl: '',
	debugLogEndpoint: '',
	storeDebug: true,
	directDownloads: true,
	proxyPath: '/proxyrequest',
	ignoreLoggedInStatus: false,
	storePrefsRemote: true,
	preferUrlItem: true,
	sessionAuth: false,
	proxy: false,
	apiKey: '',
	apiVersion: 3,
	locale: 'en-US',
	cacheStoreType: 'localStorage',
	preloadCachedLibrary: true,
	sortOrdering: {
		'dateAdded': 'desc',
		'dateModified': 'desc',
		'date': 'desc',
		'year': 'desc',
		'accessDate': 'desc',
		'title': 'asc',
		'creator': 'asc'
	},
	defaultSortColumn: 'title',
	defaultSortOrder: 'asc',
	largeFields: {
		'title': 1,
		'abstractNote': 1,
		'extra' : 1
	},
	richTextFields: {
		'note': 1
	},
	maxFieldSummaryLength: {title:60},
	exportFormats: [
		'bibtex',
		'bookmarks',
		'mods',
		'refer',
		'rdf_bibliontology',
		'rdf_dc',
		'rdf_zotero',
		'ris',
		'wikipedia'
		],
	exportFormatsMap: {
		'bibtex': 'BibTeX',
		'bookmarks': 'Bookmarks',
		'mods': 'MODS',
		'refer': 'Refer/BibIX',
		'rdf_bibliontology': 'Bibliontology RDF',
		'rdf_dc': 'Unqualified Dublin Core RDF',
		'rdf_zotero': 'Zotero RDF',
		'ris': 'RIS',
		'wikipedia': 'Wikipedia Citation Templates'
	},
	defaultApiArgs: {
		'order': 'title',
		'sort': 'asc',
		'limit': 50,
		'start': 0
	}
};

module.exports = defaultConfig;
