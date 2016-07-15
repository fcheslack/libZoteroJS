
var submitDebugLog = function(){
	Zotero.net.ajax({
		url: Zotero.config.debugLogEndpoint,
		data: {'debug_string': Zotero.debugstring}
	}).then(function(xhr){
		var data = JSON.parse(xhr.responseText);
		if(data.logID) {
			alert('ZoteroWWW debug logID:' + data.logID);
		} else if (data.error) {
			alert('Error submitting ZoteroWWW debug log:' + data.error);
		}
	});
};

module.exports = submitDebugLog;
