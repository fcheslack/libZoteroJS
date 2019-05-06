

//var log = require('./Log.js').Logger('libZotero:Tag');
import { ApiObject } from './ApiObject';

class Tag extends ApiObject {
	constructor(tagObj) {
		super(tagObj);
		this.instance = 'Zotero.Tag';
		this.color = null;
		this.version = 0;
		if (typeof tagObj == 'object') {
			this.parseJsonTag(tagObj);
		} else if (typeof tagObj == 'string') {
			this.parseJsonTag(Tag.templateApiObj(tagObj));
		} else {
			this.parseJsonTag(Tag.templateApiObj(''));
		}
	}

	parseJsonTag(tagObj) {
		var tag = this;
		tag.apiObj = Object.assign({}, tagObj);
		tag.urlencodedtag = encodeURIComponent(tag.apiObj.tag);
		tag.version = tag.apiObj.version;
	}

	static templateApiObj(tagString) {
		return {
			tag: tagString,
			links: {},
			meta: {
				type: 0,
				numItems: 1
			}
		};
	}

	static tagComparer() {
		if (Intl) {
			var collator = new Intl.Collator();
			return function (a, b) {
				return collator.compare(a.apiObj.tag, b.apiObj.tag);
			};
		} else {
			return function (a, b) {
				if (a.apiObj.tag.toLocaleLowerCase() == b.apiObj.tag.toLocaleLowerCase()) {
					return 0;
				}
				if (a.apiObj.tag.toLocaleLowerCase() < b.apiObj.tag.toLocaleLowerCase()) {
					return -1;
				}
				return 1;
			};
		}
	}

	set(key, val) {
		var tag = this;
		
		if (key in tag.apiObj) {
			tag.apiObj[key] = val;
		}
		if (key in tag.apiObj.meta) {
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
	}

	get(key) {
		var tag = this;

		if (key in tag.apiObj) {
			return tag.apiObj[key];
		}
		if (key in tag.apiObj.meta) {
			return tag.apiObj.meta[key];
		}

		switch (key) {
		case 'tagVersion':
		case 'version':
			return tag.version;
		}

		return null;
	}
}

export { Tag };
