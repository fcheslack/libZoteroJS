module.exports = function(jsonBody){
	this.instance = 'Zotero.Tags';
	//represent collections as array for ordering purposes
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
	if(jsonBody){
		this.addTagsFromJson(jsonBody);
	}
};

module.exports.prototype = new Zotero.Container();

module.exports.prototype.addTag = function(tag){
	var tags = this;
	tags.tagObjects[tag.apiObj.tag] = tag;
	tags.tagsArray.push(tag);
	if(tags.owningLibrary){
		tag.associateWithLibrary(tags.owningLibrary);
	}
};

module.exports.prototype.getTag = function(tagname){
	var tags = this;
	if(tags.tagObjects.hasOwnProperty(tagname)){
		return this.tagObjects[tagname];
	}
	return null;
};

module.exports.prototype.removeTag = function(tagname){
	var tags = this;
	delete tags.tagObjects[tagname];
	tags.updateSecondaryData();
};

module.exports.prototype.removeTags = function(tagnames){
	var tags = this;
	tagnames.forEach(function(tagname){
		delete tags.tagObjects[tagname];
	});
	tags.updateSecondaryData();
};

module.exports.prototype.plainTagsList = function(tagsArray){
	Z.debug('Zotero.Tags.plainTagsList', 3);
	var plainList = [];
	tagsArray.forEach(function(tag){
		plainList.push(tag.apiObj.tag);
	});
	return plainList;
};

module.exports.prototype.clear = function(){
	Z.debug('Zotero.Tags.clear', 3);
	this.tagsVersion = 0;
	this.syncState.earliestVersion = null;
	this.syncState.latestVersion = null;
	this.displayTagsArray = [];
	this.displayTagsUrl = '';
	this.tagObjects = {};
	this.tagsArray = [];
};

module.exports.prototype.updateSecondaryData = function(){
	Z.debug('Zotero.Tags.updateSecondaryData', 3);
	var tags = this;
	tags.tagsArray = [];
	Object.keys(tags.tagObjects).forEach(function(key){
		var val = tags.tagObjects[key];
		tags.tagsArray.push(val);
	});
	tags.tagsArray.sort(Zotero.Tag.prototype.tagComparer());
	var plainList = tags.plainTagsList(tags.tagsArray);
	plainList.sort(Zotero.Library.prototype.comparer());
	tags.plainList = plainList;
};

module.exports.prototype.updateTagsVersion = function(tagsVersion) {
	var tags = this;
	Object.keys(tags.tagObjects).forEach(function(key){
		var tag = tags.tagObjects[key];
		tag.set('version', tagsVersion);
	});
};

module.exports.prototype.rebuildTagsArray = function() {
	var tags = this;
	tags.tagsArray = [];
	Object.keys(tags.tagObjects).forEach(function(key){
		var tag = tags.tagObjects[key];
		tags.tagsArray.push(tag);
	});
};

module.exports.prototype.addTagsFromJson = function(jsonBody){
	Z.debug('Zotero.Tags.addTagsFromJson', 3);
	var tags = this;
	var tagsAdded = [];
	jsonBody.forEach(function(tagObj){
		var tag = new Zotero.Tag(tagObj);
		tags.addTag(tag);
		tagsAdded.push(tag);
	});
	return tagsAdded;
};
