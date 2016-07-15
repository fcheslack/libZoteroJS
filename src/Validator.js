var log = require('./Log.js').Logger('libZotero:Validator');

var validator = {
	patterns: {
		//'itemKey': /^([A-Z0-9]{8,},?)+$/,
		'itemKey': /^.+$/,
		'collectionKey': /^([A-Z0-9]{8,})|trash$/,
		//'tag': /^[^#]*$/,
		'libraryID': /^[0-9]+$/,
		'libraryType': /^(user|group|)$/,
		'target': /^(items?|collections?|tags|children|deleted|userGroups|key|settings|publications)$/,
		'targetModifier': /^(top|file|file\/view)$/,
		
		//get params
		'sort': /^(asc|desc)$/,
		'start': /^[0-9]*$/,
		'limit': /^[0-9]*$/,
		'order': /^\S*$/,
		'content': /^((html|json|data|bib|none|bibtex|bookmarks|coins|csljson|mods|refer|rdf_bibliontology|rdf_dc|rdf_zotero|ris|tei|wikipedia),?)+$/,
		'include': /^((html|json|data|bib|none|bibtex|bookmarks|coins|csljson|mods|refer|rdf_bibliontology|rdf_dc|rdf_zotero|ris|tei|wikipedia),?)+$/,
		'format': /^((atom|bib|json|keys|versions|bibtex|bookmarks|coins|csljson|mods|refer|rdf_bibliontology|rdf_dc|rdf_zotero|ris|tei|wikipedia),?)+$/,
		'q': /^.*$/,
		'fq': /^\S*$/,
		'itemType': /^\S*$/,
		'locale': /^\S*$/,
		'tag': /^.*$/,
		'tagType': /^(0|1)$/,
		'key': /^\S*/,
		'style': /^\S*$/,
		'linkwrap': /^(0|1)*$/
	},
	
	validate: function(arg, type){
		log.debug('Zotero.validate', 4);
		if(arg === ''){
			return null;
		}
		else if(arg === null){
			return true;
		}
		log.debug(arg + ' ' + type, 4);
		var patterns = this.patterns;
		
		if(patterns.hasOwnProperty(type)){
			return patterns[type].test(arg);
		}
		else{
			return null;
		}
	}
};

module.exports = validator;