

import { Logger } from './Log.js';
const log = new Logger('libZotero:File');

var SparkMD5 = require('spark-md5');

let getFileInfo = async function (file) {
	// fileInfo: md5, filename, filesize, mtime, zip, contentType, charset
	if (typeof FileReader === 'undefined') {
		return Promise.reject(new Error('FileReader not supported'));
	}
	
	return new Promise(function (resolve, _reject) {
		var fileInfo = {};
		var reader = new FileReader();
		reader.onload = function (e) {
			log.debug('Zotero.file.getFileInfo onloadFunc', 3);
			var result = e.target.result;
			log.debug(result, 3);
			fileInfo.md5 = SparkMD5.ArrayBuffer.hash(result);
			fileInfo.filename = file.name;
			fileInfo.filesize = file.size;
			fileInfo.mtime = Date.now();
			fileInfo.contentType = file.type;
			// fileInfo.reader = reader;
			fileInfo.filedata = result;
			resolve(fileInfo);
		};
		
		reader.readAsArrayBuffer(file);
	});
};

let uploadFile = async function (authData, fileInfo) {
	let prefix = new Uint8ClampedArray(authData.prefix.split('').map(e => e.charCodeAt(0)));
	let suffix = new Uint8ClampedArray(authData.suffix.split('').map(e => e.charCodeAt(0)));
	let body = new Uint8ClampedArray(prefix.byteLength + fileInfo.file.byteLength + suffix.byteLength);
	body.set(prefix, 0);
	body.set(new Uint8ClampedArray(fileInfo.file), prefix.byteLength);
	body.set(suffix, prefix.byteLength + fileInfo.file.byteLength);
	
	// follow-up request
	let uploadResponse = await fetch(authData.url, {
		headers: {
			'Content-Type': authData.contentType,
		},
		method: 'post',
		body: body.buffer
	});

	return uploadResponse;
};

export { getFileInfo, uploadFile };
