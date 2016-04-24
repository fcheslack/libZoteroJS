'use strict';

var log = require('./Log.js').Logger('libZotero:Groups');

module.exports = function(){
	this.instance = 'Zotero.Groups';
	this.groupsArray = [];
};
/*
 module.exports.prototype.fetchGroup = function(groupID, apikey){
	//TODO: implement
};
*/
module.exports.prototype.addGroupsFromJson = function(jsonBody){
	var groups = this;
	var groupsAdded = [];
	jsonBody.forEach(function(groupObj){
		log.debug(groupObj, 3);
		var group = new Zotero.Group(groupObj);
		groups.groupsArray.push(group);
		groupsAdded.push(group);
	});
	return groupsAdded;
};

module.exports.prototype.fetchUserGroups = function(userID, apikey){
	var groups = this;
	var aparams = {
		'target':'userGroups',
		'libraryType':'user',
		'libraryID': userID,
		'order':'title'
	};
	
	if(apikey){
		aparams['key'] = apikey;
	}
	else if(groups.owningLibrary) {
		aparams['key'] = groups.owningLibrary._apiKey;
	}
	
	return Zotero.ajaxRequest(aparams)
	.then(function(response){
		log.debug('fetchUserGroups proxied callback', 3);
		var fetchedGroups = groups.addGroupsFromJson(response.data);
		response.fetchedGroups = fetchedGroups;
		return response;
	});
};

