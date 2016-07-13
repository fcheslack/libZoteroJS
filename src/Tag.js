'use strict';

var log = require('./Log.js').Logger('libZotero:Tag');

module.exports = function (tagObj) {
	this.instance = 'Zotero.Tag';
	this.color = null;
	this.version = 0;
	if( typeof tagObj == 'object'){
		this.parseJsonTag(tagObj);
	} else if(typeof tagObj == 'string') {
		this.parseJsonTag(this.templateApiObj(tagObj));
	} else {
		this.parseJsonTag(this.tamplateApiObj(''));
	}
};

module.exports.prototype = new Zotero.ApiObject();

module.exports.prototype.parseJsonTag = function(tagObj) {
	var tag = this;
	tag.apiObj = Z.extend({}, tagObj);
	tag.urlencodedtag = encodeURIComponent(tag.apiObj.tag);
	tag.version = tag.apiObj.version;
};

module.exports.prototype.templateApiObj = function(tagString) {
	return {
		tag: tagString,
		links: {},
		meta: {
			type:0,
			numItems:1
		}
	};
};

module.exports.prototype.tagComparer = function(){
	if(Intl){
		var collator = new Intl.Collator();
		return function(a, b){
			return collator.compare(a.apiObj.tag, b.apiObj.tag);
		};
	} else {
		return function(a, b) {
			if(a.apiObj.tag.toLocaleLowerCase() == b.apiObj.tag.toLocaleLowerCase()){
				return 0;
			}
			if(a.apiObj.tag.toLocaleLowerCase() < b.apiObj.tag.toLocaleLowerCase()){
				return -1;
			}
			return 1;
		};
	}
};

module.exports.prototype.set = function(key, val){
	var tag = this;
	
	if(key in tag.apiObj){
		tag.apiObj[key] = val;
	}
	if(key in tag.apiObj.meta){
		tag.apiObj.meta[key] = val;
	}
	
	switch (key) {
		case 'tagVersion':
		case 'version':
			tag.version = val;
			tag.apiObj.version = val;
			break;
	}
	
	return tag;
};

module.exports.prototype.get = function(key){
	var tag = this;

	if(key in tag.apiObj){
		return tag.apiObj[key];
	}
	if(key in tag.apiObj.meta){
		return tag.apiObj.meta[key];
	}

	switch (key) {
		case 'tagVersion':
		case 'version':
			return tag.version;
	}

	return null;
};

