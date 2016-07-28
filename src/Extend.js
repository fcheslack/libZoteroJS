'use strict';

var extend = function() {
	return Object.assign(...arguments);
	/*
	var res = {};
	for(var i = 0; i < arguments.length; i++){
		var a = arguments[i];
		if(typeof a != 'object'){
			continue;
		}
		Object.keys(a).forEach(function(key){
			res[key] = a[key];
		});
	}
	return res;
	*/
};

module.exports = extend;