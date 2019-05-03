

let baseApiUrl = 'https://api.zotero.org';
let baseWebsiteUrl = 'https://zotero.org';
let baseFeedUrl = 'https://api.zotero.org';
let baseZoteroWebsiteUrl = 'https://www.zotero.org';
let baseDownloadUrl = 'https://www.zotero.org';

if (process.env.NODE_ENV == 'development') {
	baseApiUrl = 'https://apidev.zotero.org';
	baseWebsiteUrl = 'https://dockerzotero.test:8081';
	baseFeedUrl = 'https://apidev.zotero.org';
	baseZoteroWebsiteUrl = 'https://dockerzotero.test:8081';
	baseDownloadUrl = 'https://dockerzotero.test:8081';
}

var defaultConfig = {
	librarySettings: {},
	baseApiUrl,
	baseWebsiteUrl,
	baseFeedUrl,
	baseZoteroWebsiteUrl,
	baseDownloadUrl,
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
		dateAdded: 'desc',
		dateModified: 'desc',
		date: 'desc',
		year: 'desc',
		accessDate: 'desc',
		title: 'asc',
		creator: 'asc'
	},
	defaultSortColumn: 'title',
	defaultSortOrder: 'asc',
	largeFields: {
		title: 1,
		abstractNote: 1,
		extra: 1
	},
	richTextFields: {
		note: 1
	},
	maxFieldSummaryLength: { title: 60 },
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
		bibtex: 'BibTeX',
		bookmarks: 'Bookmarks',
		mods: 'MODS',
		refer: 'Refer/BibIX',
		rdf_bibliontology: 'Bibliontology RDF',
		rdf_dc: 'Unqualified Dublin Core RDF',
		rdf_zotero: 'Zotero RDF',
		ris: 'RIS',
		wikipedia: 'Wikipedia Citation Templates'
	},
	defaultApiArgs: {
		order: 'title',
		sort: 'asc',
		limit: 50,
		start: 0
	}
};

module.exports = defaultConfig;
