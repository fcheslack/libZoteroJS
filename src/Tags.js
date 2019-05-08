

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
		this.tagObjects[tag.apiObj.tag] = tag;
		this.tagsArray.push(tag);
		if (this.owningLibrary) {
			tag.associateWithLibrary(this.owningLibrary);
		}
	}

	getTag(tagname) {
		if (this.tagObjects.hasOwnProperty(tagname)) {
			return this.tagObjects[tagname];
		}
		return null;
	}

	removeTag(tagname) {
		delete this.tagObjects[tagname];
		this.updateSecondaryData();
	}

	removeTags(tagnames) {
		tagnames.forEach((tagname) => {
			delete this.tagObjects[tagname];
		});
		this.updateSecondaryData();
	}

	static plainTagsList(tagsArray) {
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
		this.tagsArray = [];
		Object.keys(this.tagObjects).forEach((key) => {
			var val = this.tagObjects[key];
			this.tagsArray.push(val);
		});
		this.tagsArray.sort(Zotero.Tag.prototype.tagComparer());
		var plainList = Tags.plainTagsList(this.tagsArray);
		plainList.sort(Zotero.Library.prototype.comparer());
		this.plainList = plainList;
	}

	updateTagsVersion(tagsVersion) {
		Object.keys(this.tagObjects).forEach((key) => {
			var tag = this.tagObjects[key];
			tag.set('version', tagsVersion);
		});
	}

	rebuildTagsArray() {
		this.tagsArray = [];
		Object.keys(this.tagObjects).forEach((key) => {
			var tag = this.tagObjects[key];
			this.tagsArray.push(tag);
		});
	}

	addTagsFromJson(jsonBody) {
		log.debug('Zotero.Tags.addTagsFromJson', 3);
		var tagsAdded = [];
		jsonBody.forEach((tagObj) => {
			var tag = new Zotero.Tag(tagObj);
			this.addTag(tag);
			tagsAdded.push(tag);
		});
		return tagsAdded;
	}
}

export { Tags };
