'use strict';

var log = require('./Log.js').Logger('libZotero:Deleted');

module.exports = function(data){
	this.instance = 'Zotero.Deleted';
	if(typeof data === 'string'){
		this.deletedData = JSON.parse(data);
	}
	else {
		this.deletedData = data;
	}
	this.untilVersion = null;
	this.sinceVersion = null;
	this.waitingPromises = [];
	this.pending = false;
};

//create, save referece, and return a Promise that will be resolved
//the next time we finish a deleted request
module.exports.prototype.addWaiter = function(){
	
};
