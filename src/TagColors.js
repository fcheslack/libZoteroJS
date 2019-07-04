

import { Logger } from './Log.js';
const log = new Logger('libZotero:TagColors');

class TagColors {
	constructor(tagColors = []) {
		this.instance = 'Zotero.TagColors';
		this.colorsArray = tagColors;
		this.colors = new Map();

		this.colorsArray.forEach((color) => {
			this.colors.set(color.name.toLowerCase(), color.color);
		});
	}

	// take an array of tags and return subset of tags that should be colored, along with
	// the colors they should be
	match(tags) {
		let resultTags = [];

		for (let i = 0; i < tags.length; i++) {
			let lowerTag = tags[i].toLowerCase();
			if (this.colors.has(lowerTag)) {
				resultTags.push(this.colors.get(lowerTag));
			}
		}
		return resultTags;
	}
}

export { TagColors };
