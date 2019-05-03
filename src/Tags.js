

var log = require('./Log.js').Logger('libZotero:Tags');
import { Container } from './Container.js';

class Tags extends Container {
	constructor(jsonBody) {
		super(jsonBody);
		this.instance = 'Zotero.Tags';
		// represent collections as array for ordering purposes
		this.tagsVersion = 0;
		this.syncState = {
			earliestVersion: null,
			latestVersion: null
		};
		this.displayTagsArray = [];
		this.displayTagsUrl = '';
		this.tagObjects = {};
		this.tagsArray = [];
		this.loaded = false;
		if (jsonBody) {
			this.addTagsFromJson(jsonBody);
		}
	}

	addTag(tag) {
		var tags = this;
		tags.tagObjects[tag.apiObj.tag] = tag;
		tags.tagsArray.push(tag);
		if (tags.owningLibrary) {
			tag.associateWithLibrary(tags.owningLibrary);
		}
	}

	getTag(tagname) {
		var tags = this;
		if (tags.tagObjects.hasOwnProperty(tagname)) {
			return this.tagObjects[tagname];
		}
		return null;
	}

	removeTag(tagname) {
		var tags = this;
		delete tags.tagObjects[tagname];
		tags.updateSecondaryData();
	}

	removeTags(tagnames) {
		var tags = this;
		tagnames.forEach(function (tagname) {
			delete tags.tagObjects[tagname];
		});
		tags.updateSecondaryData();
	}

	plainTagsList(tagsArray) {
		log.debug('Zotero.Tags.plainTagsList', 3);
		var plainList = [];
		tagsArray.forEach(function (tag) {
			plainList.push(tag.apiObj.tag);
		});
		return plainList;
	}

	clear() {
		log.debug('Zotero.Tags.clear', 3);
		this.tagsVersion = 0;
		this.syncState.earliestVersion = null;
		this.syncState.latestVersion = null;
		this.displayTagsArray = [];
		this.displayTagsUrl = '';
		this.tagObjects = {};
		this.tagsArray = [];
	}

	updateSecondaryData() {
		log.debug('Zotero.Tags.updateSecondaryData', 3);
		var tags = this;
		tags.tagsArray = [];
		Object.keys(tags.tagObjects).forEach(function (key) {
			var val = tags.tagObjects[key];
			tags.tagsArray.push(val);
		});
		tags.tagsArray.sort(Zotero.Tag.prototype.tagComparer());
		var plainList = tags.plainTagsList(tags.tagsArray);
		plainList.sort(Zotero.Library.prototype.comparer());
		tags.plainList = plainList;
	}

	updateTagsVersion(tagsVersion) {
		var tags = this;
		Object.keys(tags.tagObjects).forEach(function (key) {
			var tag = tags.tagObjects[key];
			tag.set('version', tagsVersion);
		});
	}

	rebuildTagsArray() {
		var tags = this;
		tags.tagsArray = [];
		Object.keys(tags.tagObjects).forEach(function (key) {
			var tag = tags.tagObjects[key];
			tags.tagsArray.push(tag);
		});
	}

	addTagsFromJson(jsonBody) {
		log.debug('Zotero.Tags.addTagsFromJson', 3);
		var tags = this;
		var tagsAdded = [];
		jsonBody.forEach(function (tagObj) {
			var tag = new Zotero.Tag(tagObj);
			tags.addTag(tag);
			tagsAdded.push(tag);
		});
		return tagsAdded;
	}
}

export { Tags };
