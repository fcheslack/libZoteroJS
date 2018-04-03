'use strict';

var log = require('./Log.js').Logger('libZotero:ItemMaps');

var ItemMaps = {};

ItemMaps.fieldMap = {
	'itemType'				: 'Item Type',
	'title'					: 'Title',
	'dateAdded'				: 'Date Added',
	'dateModified'			: 'Date Modified',
	'source'				: 'Source',
	'notes'					: 'Notes',
	'tags'					: 'Tags',
	'attachments'			: 'Attachments',
	'related'				: 'Related',
	'url'					: 'URL',
	'rights'				: 'Rights',
	'series'				: 'Series',
	'volume'				: 'Volume',
	'issue'					: 'Issue',
	'edition'				: 'Edition',
	'place'					: 'Place',
	'publisher'				: 'Publisher',
	'pages'					: 'Pages',
	'ISBN'					: 'ISBN',
	'publicationTitle'		: 'Publication',
	'ISSN'					: 'ISSN',
	'date'					: 'Date',
	'year'					: 'Year',
	'section'				: 'Section',
	'callNumber'			: 'Call Number',
	'archive'				: 'Archive',
	'archiveLocation'		: 'Loc. in Archive',
	'libraryCatalog'		: 'Library Catalog',
	'distributor'			: 'Distributor',
	'extra'					: 'Extra',
	'journalAbbreviation'	: 'Journal Abbr',
	'DOI'					: 'DOI',
	'accessDate'			: 'Accessed',
	'seriesTitle'			: 'Series Title',
	'seriesText'			: 'Series Text',
	'seriesNumber'			: 'Series Number',
	'institution'			: 'Institution',
	'reportType'			: 'Report Type',
	'code'					: 'Code',
	'session'				: 'Session',
	'legislativeBody'		: 'Legislative Body',
	'history'				: 'History',
	'reporter'				: 'Reporter',
	'court'					: 'Court',
	'numberOfVolumes'		: '# of Volumes',
	'committee'				: 'Committee',
	'assignee'				: 'Assignee',
	'patentNumber'			: 'Patent Number',
	'priorityNumbers'		: 'Priority Numbers',
	'issueDate'				: 'Issue Date',
	'references'			: 'References',
	'legalStatus'			: 'Legal Status',
	'codeNumber'			: 'Code Number',
	'artworkMedium'			: 'Medium',
	'number'				: 'Number',
	'artworkSize'			: 'Artwork Size',
	'repository'			: 'Repository',
	'videoRecordingType'	: 'Recording Type',
	'interviewMedium'		: 'Medium',
	'letterType'			: 'Type',
	'manuscriptType'		: 'Type',
	'mapType'				: 'Type',
	'scale'					: 'Scale',
	'thesisType'			: 'Type',
	'websiteType'			: 'Website Type',
	'audioRecordingType'	: 'Recording Type',
	'label'					: 'Label',
	'presentationType'		: 'Type',
	'meetingName'			: 'Meeting Name',
	'studio'				: 'Studio',
	'runningTime'			: 'Running Time',
	'network'				: 'Network',
	'postType'				: 'Post Type',
	'audioFileType'			: 'File Type',
	'versionNumber'			: 'Version Number',
	'system'				: 'System',
	'company'				: 'Company',
	'conferenceName'		: 'Conference Name',
	'encyclopediaTitle'		: 'Encyclopedia Title',
	'dictionaryTitle'		: 'Dictionary Title',
	'language'				: 'Language',
	'programmingLanguage'	: 'Language',
	'university'			: 'University',
	'abstractNote'			: 'Abstract',
	'websiteTitle'			: 'Website Title',
	'reportNumber'			: 'Report Number',
	'billNumber'			: 'Bill Number',
	'codeVolume'			: 'Code Volume',
	'codePages'				: 'Code Pages',
	'dateDecided'			: 'Date Decided',
	'reporterVolume'		: 'Reporter Volume',
	'firstPage'				: 'First Page',
	'documentNumber'		: 'Document Number',
	'dateEnacted'			: 'Date Enacted',
	'publicLawNumber'		: 'Public Law Number',
	'country'				: 'Country',
	'applicationNumber'		: 'Application Number',
	'forumTitle'			: 'Forum/Listserv Title',
	'episodeNumber'			: 'Episode Number',
	'blogTitle'				: 'Blog Title',
	'caseName'				: 'Case Name',
	'nameOfAct'				: 'Name of Act',
	'subject'				: 'Subject',
	'proceedingsTitle'		: 'Proceedings Title',
	'bookTitle'				: 'Book Title',
	'shortTitle'			: 'Short Title',
	'docketNumber'			: 'Docket Number',
	'numPages'				: '# of Pages',
	'note'					: 'Note',
	'numChildren'			: '# of Children',
	'addedBy'				: 'Added By',
	'creator'				: 'Creator'
};

ItemMaps.typeMap = {
	'note'					: 'Note',
	'attachment'			: 'Attachment',
	'book'					: 'Book',
	'bookSection'			: 'Book Section',
	'journalArticle'		: 'Journal Article',
	'magazineArticle'		: 'Magazine Article',
	'newspaperArticle'		: 'Newspaper Article',
	'thesis'				: 'Thesis',
	'letter'				: 'Letter',
	'manuscript'			: 'Manuscript',
	'interview'				: 'Interview',
	'film'					: 'Film',
	'artwork'				: 'Artwork',
	'webpage'				: 'Web Page',
	'report'				: 'Report',
	'bill'					: 'Bill',
	'case'					: 'Case',
	'hearing'				: 'Hearing',
	'patent'				: 'Patent',
	'statute'				: 'Statute',
	'email'					: 'E-mail',
	'map'					: 'Map',
	'blogPost'				: 'Blog Post',
	'instantMessage'		: 'Instant Message',
	'forumPost'				: 'Forum Post',
	'audioRecording'		: 'Audio Recording',
	'presentation'			: 'Presentation',
	'videoRecording'		: 'Video Recording',
	'tvBroadcast'			: 'TV Broadcast',
	'radioBroadcast'		: 'Radio Broadcast',
	'podcast'				: 'Podcast',
	'computerProgram'		: 'Computer Program',
	'conferencePaper'		: 'Conference Paper',
	'document'				: 'Document',
	'encyclopediaArticle'	: 'Encyclopedia Article',
	'dictionaryEntry'		: 'Dictionary Entry'
};

ItemMaps.creatorMap = {
	'author'			: 'Author',
	'contributor'		: 'Contributor',
	'editor'			: 'Editor',
	'translator'		: 'Translator',
	'seriesEditor'		: 'Series Editor',
	'interviewee'		: 'Interview With',
	'interviewer'		: 'Interviewer',
	'director'			: 'Director',
	'scriptwriter'		: 'Scriptwriter',
	'producer'			: 'Producer',
	'castMember'		: 'Cast Member',
	'sponsor'			: 'Sponsor',
	'counsel'			: 'Counsel',
	'inventor'			: 'Inventor',
	'attorneyAgent'		: 'Attorney/Agent',
	'recipient'			: 'Recipient',
	'performer'			: 'Performer',
	'composer'			: 'Composer',
	'wordsBy'			: 'Words By',
	'cartographer'		: 'Cartographer',
	'programmer'		: 'Programmer',
	'reviewedAuthor'	: 'Reviewed Author',
	'artist'			: 'Artist',
	'commenter'			: 'Commenter',
	'presenter'			: 'Presenter',
	'guest'				: 'Guest',
	'podcaster'			: 'Podcaster'
};

ItemMaps.hideFields = [
	'mimeType',
	'linkMode',
	'charset',
	'md5',
	'mtime',
	'version',
	'key',
	'collections',
	'relations',
	'parentItem',
	'contentType',
	'filename',
	'tags'
];

ItemMaps.noEditFields = [
	'accessDate',
	'modified',
	'filename',
	'dateAdded',
	'dateModified'
];

ItemMaps.itemTypeImageSrc = {
	'note'					: 'note',
	'attachment'			: 'attachment-pdf',
	'attachmentPdf'			: 'attachment-pdf',
	'attachmentWeblink'		: 'attachment-web-link',
	'attachmentSnapshot'	: 'attachment-snapshot',
	'attachmentFile'		: 'attachment-file',
	'attachmentLink'		: 'attachment-link',
	'book'					: 'book',
	'bookSection'			: 'book_open',
	'journalArticle'		: 'page_white_text',
	'magazineArticle'		: 'layout',
	'newspaperArticle'		: 'newspaper',
	'thesis'				: 'report',
	'letter'				: 'email_open',
	'manuscript'			: 'script',
	'interview'				: 'comments',
	'film'					: 'film',
	'artwork'				: 'picture',
	'webpage'				: 'page',
	'report'				: 'report',
	'bill'					: 'page_white',
	'case'					: 'page_white',
	'hearing'				: 'page_white',
	'patent'				: 'page_white',
	'statute'				: 'page_white',
	'email'					: 'email',
	'map'					: 'map',
	'blogPost'				: 'layout',
	'instantMessage'		: 'page_white',
	'forumPost'				: 'page',
	'audioRecording'		: 'ipod',
	'presentation'			: 'page_white',
	'videoRecording'		: 'film',
	'tvBroadcast'			: 'television',
	'radioBroadcast'		: 'transmit',
	'podcast'				: 'ipod_cast',
	'computerProgram'		: 'page_white_code',
	'conferencePaper'		: 'treeitem-conferencePaper',
	'document'				: 'page_white',
	'encyclopediaArticle'	: 'page_white',
	'dictionaryEntry'		: 'page_white'
};

ItemMaps.cslNameMap = {
	'author': 'author',
	'editor': 'editor',
	'bookAuthor': 'container-author',
	'composer': 'composer',
	'interviewer': 'interviewer',
	'recipient': 'recipient',
	'seriesEditor': 'collection-editor',
	'translator': 'translator'
};

ItemMaps.cslFieldMap = {
	'title': ['title', 'nameOfAct', 'caseName', 'subject'],
	'container-title': ['publicationTitle',  'reporter', 'code'], /* reporter and code should move to SQL mapping tables */
	'collection-title': ['seriesTitle', 'series'],
	'collection-number': ['seriesNumber'],
	'publisher': ['publisher', 'distributor'], /* distributor should move to SQL mapping tables */
	'publisher-place': ['place'],
	'authority': ['court'],
	'page': ['pages'],
	'volume': ['volume'],
	'issue': ['issue'],
	'number-of-volumes': ['numberOfVolumes'],
	'number-of-pages': ['numPages'],
	'edition': ['edition'],
	'versionNumber': ['version'],
	'section': ['section'],
	'genre': ['type', 'artworkSize'], /* artworkSize should move to SQL mapping tables, or added as a CSL variable */
	'medium': ['medium', 'system'],
	'archive': ['archive'],
	'archive_location': ['archiveLocation'],
	'event': ['meetingName', 'conferenceName'], /* these should be mapped to the same base field in SQL mapping tables */
	'event-place': ['place'],
	'abstract': ['abstractNote'],
	'URL': ['url'],
	'DOI': ['DOI'],
	'ISBN': ['ISBN'],
	'call-number': ['callNumber'],
	'note': ['extra'],
	'number': ['number'],
	'references': ['history'],
	'shortTitle': ['shortTitle'],
	'journalAbbreviation': ['journalAbbreviation'],
	'language': ['language']
};

ItemMaps.cslDateMap = {
	'issued': 'date',
	'accessed': 'accessDate'
};

ItemMaps.cslTypeMap = {
	'book': 'book',
	'bookSection': 'chapter',
	'journalArticle': 'article-journal',
	'magazineArticle': 'article-magazine',
	'newspaperArticle': 'article-newspaper',
	'thesis': 'thesis',
	'encyclopediaArticle': 'entry-encyclopedia',
	'dictionaryEntry': 'entry-dictionary',
	'conferencePaper': 'paper-conference',
	'letter': 'personal_communication',
	'manuscript': 'manuscript',
	'interview': 'interview',
	'film': 'motion_picture',
	'artwork': 'graphic',
	'webpage': 'webpage',
	'report': 'report',
	'bill': 'bill',
	'case': 'legal_case',
	'hearing': 'bill',                // ??
	'patent': 'patent',
	'statute': 'legislation',
	'email': 'personal_communication',
	'map': 'map',
	'blogPost': 'webpage',
	'instantMessage': 'personal_communication',
	'forumPost': 'webpage',
	'audioRecording': 'song',     // ??
	'presentation': 'speech',
	'videoRecording': 'motion_picture',
	'tvBroadcast': 'broadcast',
	'radioBroadcast': 'broadcast',
	'podcast': 'song',            // ??
	'computerProgram': 'book'     // ??
};

ItemMaps.citePaperJournalArticleURL = false;

//itemType/baseField/field
ItemMaps.baseFieldMapping = {
	'bill': {
		'volume':'codeVolume',
	},
	'case': {
		'volume': 'reporterVolume',
		'pages': 'firstPage',
		'date': 'dateDecided',
		'number': 'docketNumber',
		'title': 'caseName'
	},
	'thesis':{
		'publisher':'university',
		'type':'thesisType'
	},
	'film':{
		'publisher':'distributor',
		'type':'genre',
		'medium':'videoRecordingFormat'
	},
	'report':{
		'publisher':'institution',
		'number': 'reportNumber',
		'type':'reportType'
	},
	'audioRecording':{
		'publisher':'label',
		'medium':'audioRecordingFormat'
	},
	'videoRecording':{
		'publisher':'studio',
		'medium':'videoRecordingFormat'
	},
	'tvBroadcast':{
		'publisher':'network',
		'publicationTitle':'programTitle',
		'number':'episodeNumber',
		'medium': 'videoRecordingMedium'
	},
	'radioBroadcast':{
		'publisher':'network',
		'publicationTitle':'programTitle',
		'number':'episodeNumber',
		'medium':'audioRecordingFormat'
	},
	'computerProgram':{
		'publisher':'company'
	},
	'bookSection':{
		'publicationTitle':'bookTitle'
	},
	'conferencePaper':{
		'publicationTitle':'proceedingsTitle'
	},
	'webpage':{
		'publicationTitle':'websiteTitle',
		'type':'websiteType'
	},
	'blogPost':{
		'publicationTitle':'blogTitle',
		'type':'websiteType'
	},
	'forumPost':{
		'publicationTitle':'blogTitle',
		'type':'postType'
	},
	encyclopediaEntry:{
		publicationTitle:'encyclopediaTitle'
	},
	dictionaryEntry:{
		publicationTitle:'dictionaryTitle'
	},
	patent:{
		date:'issueDate',
		number:'patentNumber'
	},
	statute:{
		date:'dateEnacted',
		number:'publicLawNumber',
		title:'nameOfAct'
	},
	hearing:{
		number:'documentNumber'
	},
	podcast:{
		number:'episodeNumber',
		medium:'audioFileType'
	},
	letter:{
		type:'letterType'
	},
	manuscript:{
		type:'manuscriptType'
	},
	map:{
		type:'mapType'
	},
	presentation:{
		type:'presentationType'
	},
	interview:{
		medium:'interviewMedium'
	},
	artwork:{
		medium:'artworkMedium'
	},
	email:{
		title:'subject'
	}
};

module.exports = ItemMaps;