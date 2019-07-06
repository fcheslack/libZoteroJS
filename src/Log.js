/* eslint-disable no-console */

let defaultLogLevel = 1;
let setDefaultLogLevel = (level) => {
	defaultLogLevel = level;
};

let debugOut;
let warnOut;
let errorOut;

if (typeof console == 'undefined') {
	debugOut = function () {};
	warnOut = function () {};
	errorOut = function () {};
} else {
	debugOut = function (s) {
		console.log(s);
	};
	warnOut = function (s) {
		console.warn(s);
	};
	errorOut = function (s) {
		console.error(s);
	};
}

class Logger {
	constructor(prefix, logLevel = defaultLogLevel) {
		this.prefix = prefix;
		this.logLevel = logLevel;
	}
	
	setLevel = (level) => {
		this.logLevel = level;
	}

	debug = (debugstring, level) => {
		if (typeof (level) !== 'number') {
			level = 1;
		}
		if (level <= this.logLevel) {
			debugOut(debugstring);
		}
	}
	
	debugObject = (obj, level) => {
		if (typeof (level) !== 'number') {
			level = 1;
		}
		if (level <= this.logLevel) {
			debugOut(obj);
		}
	}
	
	warn = (warnstring) => {
		warnOut(warnstring);
	}
	
	error = (errorstring) => {
		errorOut(errorstring);
	}
}

export { Logger, setDefaultLogLevel };
