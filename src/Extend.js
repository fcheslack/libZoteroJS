'use strict';

var extend = function() {
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
};

var deepExtend = function(out) {
  out = out || {};

  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];

    if (!obj)
      continue;

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object')
          out[key] = Zotero.deepExtend(out[key], obj[key]);
        else
          out[key] = obj[key];
      }
    }
  }

  return out;
};

module.exports = {extend, deepExtend};
