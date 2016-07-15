'use strict';

var log = require('./Log.js').Logger('libZotero:Events');

var trigger = function(eventType, data={}, filter=false){
	if(filter){
		log.debug('filter is not false', 3);
		eventType += '_' + filter;
	}
	log.debug('Triggering eventful ' + eventType, 3);
	
	data.zeventful = true;
	// if(data.triggeringElement === null || data.triggeringElement === undefined){
	// 	data.triggeringElement = J('#eventful');
	// }
	
	try{
		if(Zotero.eventmanager.callbacks.hasOwnProperty(eventType)){
			var callbacks = Zotero.eventmanager.callbacks[eventType];
			callbacks.forEach(function(callback){
				var cdata = Z.extend({}, data, callback.data);
				var e = {
					data: cdata
				};
				callback.f(e);
			});
		}
	}
	catch(e){
		log.error(`failed triggering:${eventType}`);
		log.error(e);
	}
};

var listen = function(events, handler, data, filter){
	log.debug('Zotero.listen: ' + events, 3);
	//append filter to event strings if it's specified
	var eventsArray = events.split(' ');
	if(eventsArray.length > 0 && filter){
		for(var i = 0; i < eventsArray.length; i++){
			eventsArray[i] += '_' + filter;
		}
	}
	eventsArray.forEach(function(ev){
		if(Zotero.eventmanager.callbacks.hasOwnProperty(ev)){
			Zotero.eventmanager.callbacks[ev].push({
				data: data,
				f: handler
			});
		} else {
			Zotero.eventmanager.callbacks[ev] = [{
				data: data,
				f: handler
			}];
		}
	});
};

module.exports = {trigger, listen};
