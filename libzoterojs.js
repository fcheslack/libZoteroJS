if(typeof window === 'undefined') {
	var globalScope = global;
} else {
	var globalScope = window;
	require('es6-promise').polyfill();
}

var Zotero = require('./src/Base.js');
globalScope.Zotero = globalScope.Z = Zotero;
Zotero.Cache = require('./src/Cache.js');
Zotero.Ajax = Zotero.ajax = require('./src/Ajax.js');
Zotero.ApiObject = require('./src/ApiObject.js');
Zotero.ApiResponse = require('./src/ApiResponse.js');
Zotero.Net = Zotero.net = require('./src/Net.js');
Zotero.Library = require('./src/Library.js');
Zotero.Container = require('./src/Container');
Zotero.Collections = require('./src/Collections.js');
Zotero.Items = require('./src/Items.js');
Zotero.Tags = require('./src/Tags.js');
Zotero.Groups = require('./src/Groups.js');
Zotero.Searches = require('./src/Searches.js');
Zotero.Deleted = require('./src/Deleted.js');
Zotero.Collection = require('./src/Collection.js');
Zotero.Localizations = Zotero.localizations = require('./src/Localizations.js');
Zotero.Item = require('./src/Item.js');
Zotero.Tag = require('./src/Tag.js');
Zotero.Search = require('./src/Search.js');
Zotero.Group = require('./src/Group.js');
Zotero.User = require('./src/User.js');
Zotero.Utils = Zotero.utils = require('./src/Utils.js');
Zotero.Url = Zotero.url = require('./src/Url.js');
Zotero.File = Zotero.file = require('./src/File.js');
Zotero.Idb = require('./src/Idb.js');
Zotero.Preferences = require('./src/Preferences.js');

module.exports = Zotero;