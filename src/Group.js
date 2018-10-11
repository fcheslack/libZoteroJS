'use strict';

var log = require('./Log.js').Logger('libZotero:Group');
import {ApiObject} from './ApiObject';

class Group extends ApiObject{
	constructor(groupObj){
		super(groupObj);
		this.instance = 'Zotero.Group';
		if(groupObj){
			this.parseJsonGroup(groupObj);
		}
	}

	parseJsonGroup = (groupObj) => {
		var group = this;
		group.apiObj = groupObj;
		group.version = groupObj.version;
	}

	get = (key) => {
		var group = this;
		switch(key) {
			case 'title':
			case 'name':
				return group.apiObj.data.name;
			case 'members':
				if(!group.apiObj.data.members){
					return [];
				}
				return group.apiObj.data.members;
			case 'admins':
				if(!group.apiObj.data.admins){
					return [];
				}
				return group.apiObj.data.admins;
		}
		
		if(key in group.apiObj){
			return group.apiObj[key];
		}
		if(key in group.apiObj.data){
			return group.apiObj.data[key];
		}
		if(key in group.apiObj.meta){
			return group.apiObj.meta[key];
		}
		if(group.hasOwnProperty(key)){
			return group[key];
		}
		
		return null;
	}

	isWritable = (userID) => {
		var group = this;
		let admins = group.apiObj.data.admins;
		if(!admins){
			admins = [];
		}

		switch(true){
			case group.get('owner') == userID:
				return true;
			case (admins.indexOf(userID) != -1):
				return true;
			case ((group.apiObj.data.libraryEditing == 'members') &&
				(group.apiObj.data.members) &&
				(group.apiObj.data.members.indexOf(userID) != -1)):
				return true;
			default:
				return false;
		}
	}
}

Group.typeMap = {
	'Private': 'Private',
	'PublicOpen': 'Public, Open Membership',
	'PublicClosed': 'Public, Closed Membership'
};

Group.accessMap = {
	'all': {
		'members' : 'Anyone can view, only members can edit',
		'admins'  : 'Anyone can view, only admins can edit'
	},
	'members': {
		'members' : 'Only members can view and edit',
		'admins'  : 'Only members can view, only admins can edit'
	},
	'admins': {
		'members' : 'Only admins can view, only members can edit',
		'admins'  : 'Only admins can view and edit'
	}
};

export {Group};
