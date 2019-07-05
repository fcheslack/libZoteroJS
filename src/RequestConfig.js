import { Logger } from './Log.js';
const log = new Logger('libZotero:RequestConfig');
import { Validator } from './Validator.js';

class RequestConfig {
	constructor() {
		this.config = {};
	}

	Target(val) {
		this.config.target = val;
		return this;
	}

	TargetModifier(val) {
		this.config.targetModifier = val;
		return this;
	}

	LibraryType(val) {
		this.config.libraryType = val;
		return this;
	}

	LibraryID(val) {
		this.config.libraryID = val;
		return this;
	}

	ItemType(val) {
		this.config.itemType = val;
		return this;
	}

	ItemKey(val) {
		this.config.itemKey = val;
		return this;
	}

	CollectionKey(val) {
		this.config.collectionKey = val;
		return this;
	}

	Sort(val) {
		this.config.sort = val;
		return this;
	}

	Order(val) {
		this.config.order = val;
		return this;
	}

	Start(val) {
		this.config.start = val;
		return this;
	}

	Limit(val) {
		this.config.limit = val;
		return this;
	}

	Content(val) {
		this.config.content = val;
		return this;
	}

	Include(val) {
		this.config.include = val;
		return this;
	}

	Format(val) {
		this.config.format = val;
		return this;
	}

	Q(val) {
		this.config.q = val;
		return this;
	}

	Fq(val) {
		this.config.fq = val;
		return this;
	}

	Tag(val) {
		this.config.tag = val;
		return this;
	}

	TagType(val) {
		this.config.tagType = val;
		return this;
	}

	Key(val) {
		this.config.key = val;
		return this;
	}

	Style(val) {
		this.config.style = val;
		return this;
	}

	LinkWrap(val) {
		this.config.linkwrap = val;
		return this;
	}

	Validate() {
		let params = this.config;
		let valid = true;

		Object.keys(params).forEach(function (key) {
			var val = params[key];
			// validate params based on patterns in Zotero.Validator
			if (Validator.validate(val, key) === false) {
				// warn on invalid parameter and drop from params that will be used
				log.warn('API argument failed validation: ' + key + ' cannot be ' + val);
				delete params[key];
				valid = false;
			}
		});

		return valid;
	}
	
	Since(val) {
		this.config.since = val;
		return this;
	}
}

export { RequestConfig };
