'use strict';

var log = require('./Log.js').Logger('libZotero:File');

var SparkMD5 = require('spark-md5');

let getFileInfo = function(file){
	//fileInfo: md5, filename, filesize, mtime, zip, contentType, charset
	if(typeof FileReader === 'undefined'){
		return Promise.reject(new Error('FileReader not supported'));
	}
	
	return new Promise(function(resolve, reject){
		var fileInfo = {};
		var reader = new FileReader();
		reader.onload = function(e){
			log.debug('Zotero.file.getFileInfo onloadFunc', 3);
			var result = e.target.result;
			log.debug(result, 3);
			fileInfo.md5 = SparkMD5.ArrayBuffer.hash(result);
			fileInfo.filename = file.name;
			fileInfo.filesize = file.size;
			fileInfo.mtime = Date.now();
			fileInfo.contentType = file.type;
			//fileInfo.reader = reader;
			fileInfo.filedata = result;
			resolve(fileInfo);
		};
		
		reader.readAsArrayBuffer(file);
	});
};

let uploadFile = function(uploadInfo, fileInfo){
	log.debug('Zotero.file.uploadFile', 3);
	log.debug(uploadInfo, 4);
	
	var formData = new FormData();
	Object.keys(uploadInfo.params).forEach(function(key){
		var val = uploadInfo.params[key];
		formData.append(key, val);
	});
	
	var blobData = new Blob([fileInfo.filedata], {type : fileInfo.contentType});
	formData.append('file', blobData);
	
	var xhr = new XMLHttpRequest();
	
	xhr.open('POST', uploadInfo.url, true);
	
	return new Promise(function(resolve, reject){
		xhr.onload = function(evt){
			log.debug('uploadFile onload event', 3);
			if(this.status == 201){
				log.debug('successful upload - 201', 3);
				resolve();
			}
			else {
				log.error('uploadFile failed - ' + xhr.status);
				reject({
					'message': 'Failure uploading file.',
					'code': xhr.status,
					'serverMessage': xhr.responseText
				});
			}
		};
		
		xhr.onprogress = function(evt){
			log.debug('progress event');
			log.debug(evt);
		};
		xhr.send(formData);
	});
	
	//If CORS is not enabled on s3 this XHR will not have the normal status
	//information, but will still fire readyStateChanges so you can tell
	//when the upload has finished (even if you can't tell if it was successful
	//from JS)
};

export {getFileInfo, uploadFile};
