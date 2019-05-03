

var log = require('./Log.js').Logger('libZotero:Groups');

class Groups {
	constructor() {
		this.instance = 'Zotero.Groups';
		this.groupsArray = [];
	}

	addGroupsFromJson = (jsonBody) => {
		var groups = this;
		var groupsAdded = [];
		jsonBody.forEach(function (groupObj) {
			log.debug(groupObj, 3);
			var group = new Zotero.Group(groupObj);
			groups.groupsArray.push(group);
			groupsAdded.push(group);
		});
		return groupsAdded;
	}

	fetchUserGroups = (userID, apikey) => {
		var aparams = {
			target: 'userGroups',
			libraryType: 'user',
			libraryID: userID,
			order: 'title'
		};
		
		if (apikey) {
			aparams.key = apikey;
		} else if (this.owningLibrary) {
			aparams.key = this.owningLibrary._apiKey;
		}
		
		return Zotero.ajaxRequest(aparams)
			.then((response) => {
				log.debug('fetchUserGroups proxied callback', 3);
				var fetchedGroups = this.addGroupsFromJson(response.data);
				response.fetchedGroups = fetchedGroups;
				return response;
			});
	}
}

export { Groups };
