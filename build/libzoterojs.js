(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Zotero = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

// use strict;
if (typeof window === 'undefined') {
	var globalScope = global;
	if (!globalScope.XMLHttpRequest) {
		globalScope.XMLHttpRequest = require('w3c-xmlhttprequest').XMLHttpRequest;
	}
} else {
	var globalScope = window;
	if (typeof Promise === 'undefined') {
		require('es6-promise').polyfill();
	}
}

var Zotero = require('./src/Base.js');
globalScope.Zotero = globalScope.Z = Zotero;
Zotero.Cache = require('./src/Cache.js');
Zotero.Ajax = Zotero.ajax = require('./src/Ajax.js');
Zotero.ApiObject = require('./src/ApiObject.js');
Zotero.ApiResponse = require('./src/ApiResponse.js');
Zotero.Net = Zotero.net = require('./src/Net.js');
Zotero.Library = require('./src/Library.js');
Zotero.Container = require('./src/Container');
Zotero.Collections = require('./src/Collections.js');
Zotero.Items = require('./src/Items.js');
Zotero.Tags = require('./src/Tags.js');
Zotero.Groups = require('./src/Groups.js');
Zotero.Searches = require('./src/Searches.js');
Zotero.Deleted = require('./src/Deleted.js');
Zotero.Collection = require('./src/Collection.js');
Zotero.Localizations = Zotero.localizations = require('./src/Localizations.js');
Zotero.Item = require('./src/Item.js');
Zotero.Tag = require('./src/Tag.js');
Zotero.Search = require('./src/Search.js');
Zotero.Group = require('./src/Group.js');
Zotero.User = require('./src/User.js');
Zotero.Utils = Zotero.utils = require('./src/Utils.js');
Zotero.Url = Zotero.url = require('./src/Url.js');
Zotero.File = Zotero.file = require('./src/File.js');
Zotero.Idb = require('./src/Idb.js');
Zotero.Preferences = require('./src/Preferences.js');

module.exports = Zotero;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./src/Ajax.js":97,"./src/ApiObject.js":98,"./src/ApiResponse.js":99,"./src/Base.js":100,"./src/Cache.js":101,"./src/Collection.js":102,"./src/Collections.js":103,"./src/Container":104,"./src/Deleted.js":105,"./src/File.js":106,"./src/Group.js":107,"./src/Groups.js":108,"./src/Idb.js":109,"./src/Item.js":110,"./src/Items.js":112,"./src/Library.js":113,"./src/Localizations.js":114,"./src/Net.js":116,"./src/Preferences.js":117,"./src/Search.js":118,"./src/Searches.js":119,"./src/Tag.js":120,"./src/Tags.js":121,"./src/Url.js":122,"./src/User.js":123,"./src/Utils.js":124,"es6-promise":83,"w3c-xmlhttprequest":2}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
'use strict';

var assign        = require('es5-ext/object/assign')
  , normalizeOpts = require('es5-ext/object/normalize-options')
  , isCallable    = require('es5-ext/object/is-callable')
  , contains      = require('es5-ext/string/#/contains')

  , d;

d = module.exports = function (dscr, value/*, options*/) {
	var c, e, w, options, desc;
	if ((arguments.length < 2) || (typeof dscr !== 'string')) {
		options = value;
		value = dscr;
		dscr = null;
	} else {
		options = arguments[2];
	}
	if (dscr == null) {
		c = w = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
		w = contains.call(dscr, 'w');
	}

	desc = { value: value, configurable: c, enumerable: e, writable: w };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

d.gs = function (dscr, get, set/*, options*/) {
	var c, e, options, desc;
	if (typeof dscr !== 'string') {
		options = set;
		set = get;
		get = dscr;
		dscr = null;
	} else {
		options = arguments[3];
	}
	if (get == null) {
		get = undefined;
	} else if (!isCallable(get)) {
		options = get;
		get = set = undefined;
	} else if (set == null) {
		set = undefined;
	} else if (!isCallable(set)) {
		options = set;
		set = undefined;
	}
	if (dscr == null) {
		c = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
	}

	desc = { get: get, set: set, configurable: c, enumerable: e };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

},{"es5-ext/object/assign":60,"es5-ext/object/is-callable":65,"es5-ext/object/normalize-options":71,"es5-ext/string/#/contains":75}],4:[function(require,module,exports){
'use strict';

var callable   = require('es5-ext/object/valid-callable')
  , d          = require('d')
  , isCallable = require('es5-ext/object/is-callable')
  , ee         = require('event-emitter')
  , isPromise  = require('./is-promise')

  , create = Object.create, defineProperty = Object.defineProperty
  , deferred, resolve, reject;

module.exports = exports = function (name, unres, onres, res) {
	name = String(name);
	(callable(res) && ((onres == null) || callable(onres)) && callable(unres));
	defineProperty(exports._unresolved, name, d(unres));
	exports._onresolve[name] = onres;
	defineProperty(exports._resolved, name, d(res));
	exports._names.push(name);
};

exports._names = ['done', 'then', 'valueOf'];

exports._unresolved = ee(create(Function.prototype, {
	then: d(function (win, fail) {
		var def;
		if (!this.pending) this.pending = [];
		def = deferred();
		this.pending.push('then', [win, fail, def.resolve, def.reject]);
		return def.promise;
	}),
	done: d(function (win, fail) {
		((win == null) || callable(win));
		((fail == null) || callable(fail));
		if (!this.pending) this.pending = [];
		this.pending.push('done', arguments);
	}),
	resolved: d(false),
	returnsPromise: d(true),
	valueOf: d(function () { return this; })
}));

exports._onresolve = {
	then: function (win, fail, resolve, reject) {
		var value, cb = this.failed ? fail : win;
		if (cb == null) {
			if (this.failed) reject(this.value);
			else resolve(this.value);
			return;
		}
		if (isCallable(cb)) {
			if (isPromise(cb)) {
				if (cb.resolved) {
					if (cb.failed) reject(cb.value);
					else resolve(cb.value);
					return;
				}
				cb.done(resolve, reject);
				return;
			}
			try { value = cb(this.value); } catch (e) {
				reject(e);
				return;
			}
			resolve(value);
			return;
		}
		resolve(cb);
	},
	done: function (win, fail) {
		if (this.failed) {
			if (fail) {
				fail(this.value);
				return;
			}
			throw this.value;
		}
		if (win) win(this.value);
	}
};

exports._resolved = ee(create(Function.prototype, {
	then: d(function (win, fail) {
		var value, cb = this.failed ? fail : win;
		if (cb == null) return this;
		if (isCallable(cb)) {
			if (isPromise(cb)) return cb;
			try { value = cb(this.value); } catch (e) { return reject(e); }
			return resolve(value);
		}
		return resolve(cb);
	}),
	done: d(function (win, fail) {
		((win == null) || callable(win));
		((fail == null) || callable(fail));
		if (this.failed) {
			if (fail) {
				fail(this.value);
				return;
			}
			throw this.value;
		}
		if (win) win(this.value);
	}),
	resolved: d(true),
	returnsPromise: d(true),
	valueOf: d(function () { return this.value; })
}));

deferred = require('./deferred');
resolve = deferred.resolve;
reject = deferred.reject;
deferred.extend = exports;

},{"./deferred":6,"./is-promise":33,"d":3,"es5-ext/object/is-callable":65,"es5-ext/object/valid-callable":72,"event-emitter":89}],5:[function(require,module,exports){
// Assimilate eventual foreign promise

'use strict';

var isObject  = require('es5-ext/object/is-object')
  , isPromise = require('./is-promise')
  , deferred  = require('./deferred')
  , nextTick  = require('next-tick')

  , getPrototypeOf = Object.getPrototypeOf;

module.exports = function self(value) {
	var then, done, def, resolve, reject;
	if (!value) return value;
	try {
		then = value.then;
	} catch (e) {
		return value;
	}
	if (typeof then !== 'function') return value;
	if (isPromise(value)) return value;
	if (!isObject(value)) return value;
	if (!getPrototypeOf(value)) return value;
	try {
		done = value.done;
	} catch (ignore) {}
	def = deferred();
	resolve = function (value) { def.resolve(self(value)); };
	reject = function (value) { def.reject(value); };
	if (typeof done === 'function') {
		try {
			done.call(value, resolve, reject);
		} catch (e) {
			return def.reject(e);
		}
		return def.promise;
	}
	try {
		then.call(value, function (value) { nextTick(function () {
			resolve(value);
		}); }, function (value) { nextTick(function () {
			reject(value);
		}); });
	} catch (e) {
		return def.reject(e);
	}
	return def.promise;
};

},{"./deferred":6,"./is-promise":33,"es5-ext/object/is-object":66,"next-tick":91}],6:[function(require,module,exports){
// Returns function that returns deferred or promise object.
//
// 1. If invoked without arguments then deferred object is returned
//    Deferred object consist of promise (unresolved) function and resolve
//    function through which we resolve promise
// 2. If invoked with one argument then promise is returned which resolved value
//    is given argument. Argument may be any value (even undefined),
//    if it's promise then same promise is returned
// 3. If invoked with more than one arguments then promise that resolves with
//    array of all resolved arguments is returned.

'use strict';

var isError    = require('es5-ext/error/is-error')
  , noop       = require('es5-ext/function/noop')
  , isPromise  = require('./is-promise')

  , every = Array.prototype.every, push = Array.prototype.push

  , Deferred, createDeferred, count = 0, timeout, extendShim, ext
  , protoSupported = Boolean(isPromise.__proto__)
  , resolve, assimilate;

extendShim = function (promise) {
	ext._names.forEach(function (name) {
		promise[name] = function () {
			return promise.__proto__[name].apply(promise, arguments);
		};
	});
	promise.returnsPromise = true;
	promise.resolved = promise.__proto__.resolved;
};

resolve = function (value, failed) {
	var promise = function (win, fail) { return promise.then(win, fail); };
	promise.value = value;
	promise.failed = failed;
	promise.__proto__ = ext._resolved;
	if (!protoSupported) { extendShim(promise); }
	if (createDeferred._profile) createDeferred._profile(true);
	return promise;
};

Deferred = function () {
	var promise = function (win, fail) { return promise.then(win, fail); };
	if (!count) timeout = setTimeout(noop, 1e9);
	++count;
	if (createDeferred._monitor) promise.monitor = createDeferred._monitor();
	promise.__proto__ = ext._unresolved;
	if (!protoSupported) extendShim(promise);
	(createDeferred._profile && createDeferred._profile());
	this.promise = promise;
	this.resolve = this.resolve.bind(this);
	this.reject = this.reject.bind(this);
};

Deferred.prototype = {
	resolved: false,
	_settle: function (value) {
		var i, name, data, deps, dPromise, nuDeps;
		this.promise.value = value;
		this.promise.__proto__ = ext._resolved;
		if (!protoSupported) this.promise.resolved = true;
		deps = this.promise.dependencies;
		delete this.promise.dependencies;
		while (deps) {
			for (i = 0; (dPromise = deps[i]); ++i) {
				dPromise.value = value;
				dPromise.failed = this.failed;
				dPromise.__proto__ = ext._resolved;
				if (!protoSupported) dPromise.resolved = true;
				delete dPromise.pending;
				if (dPromise.dependencies) {
					if (!nuDeps) nuDeps = dPromise.dependencies;
					else push.apply(nuDeps, dPromise.dependencies);
					delete dPromise.dependencies;
				}
			}
			deps = nuDeps;
			nuDeps = null;
		}
		if ((data = this.promise.pending)) {
			for (i = 0; (name = data[i]); ++i) {
				ext._onresolve[name].apply(this.promise, data[++i]);
			}
			delete this.promise.pending;
		}
		return this.promise;
	},
	resolve: function (value) {
		if (this.resolved) return this.promise;
		this.resolved = true;
		if (!--count) clearTimeout(timeout);
		if (this.promise.monitor) clearTimeout(this.promise.monitor);
		value = assimilate(value);
		if (isPromise(value)) {
			if (!value.resolved) {
				if (!value.dependencies) {
					value.dependencies = [];
				}
				value.dependencies.push(this.promise);
				if (this.promise.pending) {
					if (value.pending) {
						push.apply(value.pending, this.promise.pending);
						this.promise.pending = value.pending;
						if (this.promise.dependencies) {
							this.promise.dependencies.forEach(function self(dPromise) {
								dPromise.pending = value.pending;
								if (dPromise.dependencies) {
									dPromise.dependencies.forEach(self);
								}
							});
						}
					} else {
						value.pending = this.promise.pending;
					}
				} else if (value.pending) {
					this.promise.pending = value.pending;
				} else {
					this.promise.pending = value.pending = [];
				}
				return this.promise;
			}
			this.promise.failed = value.failed;
			value = value.value;
		}
		return this._settle(value);
	},
	reject: function (error) {
		if (this.resolved) return this.promise;
		this.resolved = true;
		if (!--count) clearTimeout(timeout);
		if (this.promise.monitor) clearTimeout(this.promise.monitor);
		this.promise.failed = true;
		return this._settle(error);
	}
};

module.exports = createDeferred = function (value) {
	var l = arguments.length, d, waiting, initialized, result;
	if (!l) return new Deferred();
	if (l > 1) {
		d = new Deferred();
		waiting = 0;
		result = new Array(l);
		every.call(arguments, function (value, index) {
			value = assimilate(value);
			if (!isPromise(value)) {
				result[index] = value;
				return true;
			}
			if (value.resolved) {
				if (value.failed) {
					d.reject(value.value);
					return false;
				}
				result[index] = value.value;
				return true;
			}
			++waiting;
			value.done(function (value) {
				result[index] = value;
				if (!--waiting && initialized) d.resolve(result);
			}, d.reject);
			return true;
		});
		initialized = true;
		if (!waiting) d.resolve(result);
		return d.promise;
	}
	value = assimilate(value);
	if (isPromise(value)) return value;
	return resolve(value, isError(value));
};

createDeferred.Deferred = Deferred;
createDeferred.reject = function (value) { return resolve(value, true); };
createDeferred.resolve = function (value) {
	value = assimilate(value);
	if (isPromise(value)) return value;
	return resolve(value, false);
};
ext = require('./_ext');
assimilate = require('./assimilate');

},{"./_ext":4,"./assimilate":5,"./is-promise":33,"es5-ext/error/is-error":45,"es5-ext/function/noop":51}],7:[function(require,module,exports){
// Dynamic queue handler
// Allows to create a promise queue, where new promises can be added to queue until last promise in
// a queue resolves. Queue promise resolves with `undefined` value, when last promises resolves.

'use strict';

var aFrom          = require('es5-ext/array/from')
  , ensureIterable = require('es5-ext/iterable/validate-object')
  , assign         = require('es5-ext/object/assign')
  , deferred       = require('./deferred')
  , isPromise      = require('./is-promise')
  , assimilate     = require('./assimilate')

  , DynamicQueue;

module.exports = DynamicQueue = function (list) {
	if (!(this instanceof DynamicQueue)) return new DynamicQueue(list);
	list = aFrom(ensureIterable(list));

	assign(this, deferred());
	list.every(this.add, this);
	if (!this.waiting) {
		this.resolve();
		return;
	}
	this.initialized = true;
};

DynamicQueue.prototype = {
	waiting: 0,
	initialized: false,
	add: function (value) {
		if (this.promise.resolved) throw new Error("Queue was already resolved");
		++this.waiting;
		value = assimilate(value);
		if (isPromise(value)) {
			if (!value.resolved) {
				value.done(this._processValue.bind(this), this.reject);
				return true;
			}
			if (value.failed) {
				this.reject(value.value);
				return false;
			}
		}
		return this._processValue();
	},
	_processValue: function () {
		if (this.promise.resolved) return;
		if (!--this.waiting && this.initialized) this.resolve();
		return true;
	}
};

},{"./assimilate":5,"./deferred":6,"./is-promise":33,"es5-ext/array/from":38,"es5-ext/iterable/validate-object":53,"es5-ext/object/assign":60}],8:[function(require,module,exports){
'use strict';

var arrayOf    = require('es5-ext/array/of')
  , deferred   = require('../deferred')
  , isPromise  = require('../is-promise')
  , assimilate = require('../assimilate')

  , push = Array.prototype.push, slice = Array.prototype.slice;

module.exports = function (args, length) {
	var i, l, arg;
	if ((length != null) && (args.length !== length)) {
		args = slice.call(args, 0, length);
		if (args.length < length) {
			push.apply(args, new Array(length - args.length));
		}
	}
	for (i = 0, l = args.length; i < l; ++i) {
		arg = assimilate(args[i]);
		if (isPromise(arg)) {
			if (!arg.resolved) {
				if (l > 1) return deferred.apply(null, args);
				return arg(arrayOf);
			}
			if (arg.failed) return arg;
			args[i] = arg.value;
		}
	}
	return args;
};

},{"../assimilate":5,"../deferred":6,"../is-promise":33,"es5-ext/array/of":41}],9:[function(require,module,exports){
// Promise aware Array's every

'use strict';

module.exports = require('../../lib/some-every')(false);

},{"../../lib/some-every":34}],10:[function(require,module,exports){
// Promise aware Array's find
// Additionally differs from some that it returns *first in order* item that matches constraint

'use strict';

var assign     = require('es5-ext/object/assign')
  , value      = require('es5-ext/object/valid-value')
  , callable   = require('es5-ext/object/valid-callable')
  , deferred   = require('../../deferred')
  , isPromise  = require('../../is-promise')
  , assimilate = require('../../assimilate')

  , call = Function.prototype.call
  , resolve = deferred.resolve
  , Find;

Find = function (list, cb, context) {
	this.list = list;
	this.cb = cb;
	this.context = context;
	this.length = list.length >>> 0;

	while (this.current < this.length) {
		if (this.current in list) {
			assign(this, deferred());
			this.processCb = this.processCb.bind(this);
			this.process();
			return this.promise;
		}
		++this.current;
	}
	return resolve(undefined);
};

Find.prototype = {
	current: 0,
	process: function () {
		var value = assimilate(this.list[this.current]);
		if (isPromise(value)) {
			if (!value.resolved) {
				value.done(this.processCb, this.reject);
				return;
			}
			if (value.failed) {
				this.reject(value.value);
				return;
			}
			value = value.value;
		}
		this.processCb(value);
	},
	processCb: function (listValue) {
		var value;
		if (this.cb) {
			try {
				value = call.call(this.cb, this.context, listValue, this.current, this.list);
			} catch (e) {
				this.reject(e);
				return;
			}
			value = assimilate(value);
			if (isPromise(value)) {
				if (!value.resolved) {
					value.done(this.processValue.bind(this, listValue), this.reject);
					return;
				}
				if (value.failed) {
					this.reject(value.value);
					return;
				}
				value = value.value;
			}
		} else {
			value = listValue;
		}
		this.processValue(listValue, value);
	},
	processValue: function (listValue, value) {
		if (value) {
			this.resolve(listValue);
			return;
		}
		while (++this.current < this.length) {
			if (this.current in this.list) {
				this.process();
				return;
			}
		}
		this.resolve(undefined);
	}
};

module.exports = function (cb/*, thisArg*/) {
	value(this);
	((cb == null) || callable(cb));

	return new Find(this, cb, arguments[1]);
};

},{"../../assimilate":5,"../../deferred":6,"../../is-promise":33,"es5-ext/object/assign":60,"es5-ext/object/valid-callable":72,"es5-ext/object/valid-value":74}],11:[function(require,module,exports){
// Promise aware Array's map

'use strict';

var assign     = require('es5-ext/object/assign')
  , value      = require('es5-ext/object/valid-value')
  , callable   = require('es5-ext/object/valid-callable')
  , deferred   = require('../../deferred')
  , isPromise  = require('../../is-promise')
  , assimilate = require('../../assimilate')

  , every = Array.prototype.every
  , call = Function.prototype.call

  , DMap;

DMap = function (list, cb, context) {
	this.list = list;
	this.cb = cb;
	this.context = context;
	this.result = new Array(list.length >>> 0);

	assign(this, deferred());
	every.call(list, this.process, this);
	if (!this.waiting) return this.resolve(this.result);
	this.initialized = true;

	return this.promise;
};

DMap.prototype = {
	waiting: 0,
	initialized: false,
	process: function (value, index) {
		++this.waiting;
		value = assimilate(value);
		if (isPromise(value)) {
			if (!value.resolved) {
				value.done(this.processCb.bind(this, index), this.reject);
				return true;
			}
			if (value.failed) {
				this.reject(value.value);
				return false;
			}
			value = value.value;
		}
		return this.processCb(index, value);
	},
	processCb: function (index, value) {
		if (this.promise.resolved) return false;
		if (this.cb) {
			try {
				value = call.call(this.cb, this.context, value, index, this.list);
			} catch (e) {
				this.reject(e);
				return false;
			}
			value = assimilate(value);
			if (isPromise(value)) {
				if (!value.resolved) {
					value.done(this.processValue.bind(this, index), this.reject);
					return true;
				}
				if (value.failed) {
					this.reject(value.value);
					return false;
				}
				value = value.value;
			}
		}
		this.processValue(index, value);
		return true;
	},
	processValue: function (index, value) {
		if (this.promise.resolved) return;
		this.result[index] = value;
		if (!--this.waiting && this.initialized) this.resolve(this.result);
	}
};

module.exports = function (cb/*, thisArg*/) {
	value(this);
	((cb == null) || callable(cb));

	return new DMap(this, cb, arguments[1]);
};

},{"../../assimilate":5,"../../deferred":6,"../../is-promise":33,"es5-ext/object/assign":60,"es5-ext/object/valid-callable":72,"es5-ext/object/valid-value":74}],12:[function(require,module,exports){
// Promise aware Array's reduce

'use strict';

var assign     = require('es5-ext/object/assign')
  , value      = require('es5-ext/object/valid-value')
  , callable   = require('es5-ext/object/valid-callable')
  , deferred   = require('../../deferred')
  , isPromise  = require('../../is-promise')
  , assimilate = require('../../assimilate')

  , call = Function.prototype.call
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , resolve = deferred.resolve
  , Reduce;

Reduce = function (list, cb, initial, initialized) {
	this.list = list;
	this.cb = cb;
	this.initialized = initialized;
	this.length = list.length >>> 0;

	initial = assimilate(initial);
	if (isPromise(initial)) {
		if (!initial.resolved) {
			assign(this, deferred());
			initial.done(function (initial) {
				this.value = initial;
				this.init();
			}.bind(this), this.reject);
			return this.promise;
		}
		this.value = initial.value;
		if (initial.failed) return initial;
	} else {
		this.value = initial;
	}

	return this.init();
};

Reduce.prototype = {
	current: 0,
	state: false,
	init: function () {
		while (this.current < this.length) {
			if (hasOwnProperty.call(this.list, this.current)) break;
			++this.current;
		}
		if (this.current === this.length) {
			if (!this.initialized) {
				throw new Error("Reduce of empty array with no initial value");
			}
			return this.resolve ? this.resolve(this.value) : resolve(this.value);
		}
		if (!this.promise) assign(this, deferred());
		this.processCb = this.processCb.bind(this);
		this.processValue = this.processValue.bind(this);
		this.continue();
		return this.promise;
	},
	continue: function () {
		var result;
		while (!this.state) {
			result = this.process();
			if (this.state !== 'cb') break;
			result = this.processCb(result);
			if (this.state !== 'value') break;
			this.processValue(result);
		}
	},
	process: function () {
		var value = assimilate(this.list[this.current]);
		if (isPromise(value)) {
			if (!value.resolved) {
				value.done(function (result) {
					result = this.processCb(result);
					if (this.state !== 'value') return;
					this.processValue(result);
					if (!this.state) this.continue();
				}.bind(this), this.reject);
				return;
			}
			if (value.failed) {
				this.reject(value.value);
				return;
			}
			value = value.value;
		}
		this.state = 'cb';
		return value;
	},
	processCb: function (value) {
		if (!this.initialized) {
			this.initialized = true;
			this.state = 'value';
			return value;
		}
		if (this.cb) {
			try {
				value = call.call(this.cb, undefined, this.value, value, this.current,
					this.list);
			} catch (e) {
				this.reject(e);
				return;
			}
			value = assimilate(value);
			if (isPromise(value)) {
				if (!value.resolved) {
					value.done(function (result) {
						this.state = 'value';
						this.processValue(result);
						if (!this.state) this.continue();
					}.bind(this), this.reject);
					return;
				}
				if (value.failed) {
					this.reject(value.value);
					return;
				}
				value = value.value;
			}
		}
		this.state = 'value';
		return value;
	},
	processValue: function (value) {
		this.value = value;
		while (++this.current < this.length) {
			if (hasOwnProperty.call(this.list, this.current)) {
				this.state = false;
				return;
			}
		}
		this.resolve(this.value);
	}
};

module.exports = function (cb/*, initial*/) {
	value(this);
	((cb == null) || callable(cb));

	return new Reduce(this, cb, arguments[1], arguments.length > 1);
};

},{"../../assimilate":5,"../../deferred":6,"../../is-promise":33,"es5-ext/object/assign":60,"es5-ext/object/valid-callable":72,"es5-ext/object/valid-value":74}],13:[function(require,module,exports){
// Promise aware Array's some

'use strict';

module.exports = require('../../lib/some-every')(true);

},{"../../lib/some-every":34}],14:[function(require,module,exports){
// Call asynchronous function

'use strict';

var toArray          = require('es5-ext/array/to-array')
  , callable         = require('es5-ext/object/valid-callable')
  , deferred         = require('../../deferred')
  , isPromise        = require('../../is-promise')
  , processArguments = require('../_process-arguments')

  , slice = Array.prototype.slice, apply = Function.prototype.apply

  , applyFn, callAsync;

applyFn = function (fn, args, def) {
	args = toArray(args);
	apply.call(fn,  this, args.concat(function (error, result) {
		if (error == null) {
			def.resolve((arguments.length > 2) ? slice.call(arguments, 1) : result);
		} else {
			def.reject(error);
		}
	}));
};

callAsync = function (fn, length, context, args) {
	var def;
	args = processArguments(args, length);
	if (isPromise(args)) {
		if (args.failed) return args;
		def = deferred();
		args.done(function (args) {
			if (fn.returnsPromise) return apply.call(fn, context, args);
			try {
				applyFn.call(context, fn, args, def);
			} catch (e) { def.reject(e); }
		}, def.reject);
		return def.promise;
	}
	if (fn.returnsPromise) return apply.call(fn, context, args);
	def = deferred();
	try {
		applyFn.call(context, fn, args, def);
	} catch (e) {
		def.reject(e);
		throw e;
	}
	return def.promise;
};

module.exports = exports = function (context/*, …args*/) {
	return callAsync(callable(this), null, context, slice.call(arguments, 1));
};

Object.defineProperty(exports, '_base', { configurable: true,
	enumerable: false, writable: true, value: callAsync });

},{"../../deferred":6,"../../is-promise":33,"../_process-arguments":8,"es5-ext/array/to-array":44,"es5-ext/object/valid-callable":72}],15:[function(require,module,exports){
// Delay function execution, return promise for delayed function result

'use strict';

var callable      = require('es5-ext/object/valid-callable')
  , nextTick      = require('next-tick')
  , ensureTimeout = require('timers-ext/valid-timeout')
  , deferred      = require('../../deferred')

  , apply    = Function.prototype.apply
  , delayed;

delayed = function (fn, args, resolve, reject) {
	var value;
	try {
		value = apply.call(fn, this, args);
	} catch (e) {
		reject(e);
		return;
	}
	resolve(value);
};

module.exports = function (timeout) {
	var fn, result, delay;
	fn = callable(this);
	if (timeout == null) {
		delay = nextTick;
	} else {
		timeout = ensureTimeout(timeout);
		delay = setTimeout;
	}
	result = function () {
		var def = deferred();
		delay(delayed.bind(this, fn, arguments, def.resolve, def.reject), timeout);
		return def.promise;
	};
	result.returnsPromise = true;
	return result;
};

},{"../../deferred":6,"es5-ext/object/valid-callable":72,"next-tick":91,"timers-ext/valid-timeout":96}],16:[function(require,module,exports){
// Limit number of concurrent function executions (to cLimit number).
// Limited calls are queued. Optionaly maximum queue length can also be
// controlled with qLimit value, any calls that would reach over that limit
// would be discarded (its promise would resolve with "Too many calls" error)

'use strict';

var toPosInt   = require('es5-ext/number/to-pos-integer')
  , callable   = require('es5-ext/object/valid-callable')
  , eeUnify    = require('event-emitter/unify')
  , deferred   = require('../../deferred')
  , isPromise  = require('../../is-promise')
  , assimilate = require('../../assimilate')

  , resolve = deferred.resolve, reject = deferred.reject
  , apply = Function.prototype.apply, max = Math.max
  , gateReject;

require('../promise/finally');

gateReject = function () {
	var e = new Error("Too many calls");
	e.type = 'deferred-gate-rejected';
	return reject(e);
};

module.exports = function (cLimit, qLimit) {
	var fn, count, decrement, unload, queue, run, result;
	fn = callable(this);
	cLimit = max(toPosInt(cLimit), 1);
	qLimit = ((qLimit == null) || isNaN(qLimit)) ? Infinity : toPosInt(qLimit);
	count = 0;
	queue = [];

	run = function (thisArg, args, def) {
		var r;
		try {
			r = apply.call(fn, thisArg, args);
		} catch (e) {
			if (!def) return reject(e);
			def.reject(e);
			unload();
			return;
		}
		r = assimilate(r);
		if (isPromise(r)) {
			if (def) eeUnify(def.promise, r);
			if (!r.resolved) {
				++count;
				if (def) def.resolve(r);
				return r.finally(decrement);
			}
			r = r.value;
		}
		if (!def) return resolve(r);
		def.resolve(r);
		unload();
	};

	decrement = function () {
		--count;
		unload();
	};

	unload = function () {
		var data;
		if ((data = queue.shift())) run.apply(null, data);
	};

	result = function () {
		var def;
		if (count >= cLimit) {
			if (queue.length < qLimit) {
				def = deferred();
				queue.push([this, arguments, def]);
				return def.promise;
			}
			return gateReject();
		}
		return run(this, arguments);
	};
	result.returnsPromise = true;
	return result;
};

},{"../../assimilate":5,"../../deferred":6,"../../is-promise":33,"../promise/finally":23,"es5-ext/number/to-pos-integer":58,"es5-ext/object/valid-callable":72,"event-emitter/unify":90}],17:[function(require,module,exports){
// Promisify synchronous function

'use strict';

var callable         = require('es5-ext/object/valid-callable')
  , deferred         = require('../../deferred')
  , isPromise        = require('../../is-promise')
  , processArguments = require('../_process-arguments')

  , apply = Function.prototype.apply

  , applyFn;

applyFn = function (fn, args, resolve, reject) {
	var value;
	try {
		value = apply.call(fn, this, args);
	} catch (e) {
		reject(e);
		return;
	}
	resolve(value);
};

module.exports = function (length) {
	var fn, result;
	fn = callable(this);
	if (fn.returnsPromise) return fn;
	if (length != null) length = length >>> 0;
	result = function () {
		var args, def;
		args = processArguments(arguments, length);

		if (isPromise(args)) {
			if (args.failed) return args;
			def = deferred();
			args.done(function (args) {
				applyFn.call(this, fn, args, def.resolve, def.reject);
			}.bind(this), def.reject);
		} else {
			def = deferred();
			applyFn.call(this, fn, args, def.resolve, def.reject);
		}

		return def.promise;
	};
	result.returnsPromise = true;
	return result;
};

},{"../../deferred":6,"../../is-promise":33,"../_process-arguments":8,"es5-ext/object/valid-callable":72}],18:[function(require,module,exports){
// Promisify asynchronous function

'use strict';

var callable  = require('es5-ext/object/valid-callable')
  , callAsync = require('./call-async')._base;

module.exports = function (length) {
	var fn, result;
	fn = callable(this);
	if (fn.returnsPromise) return fn;
	if (length != null) length = length >>> 0;
	result = function () { return callAsync(fn, length, this, arguments); };
	result.returnsPromise = true;
	return result;
};

},{"./call-async":14,"es5-ext/object/valid-callable":72}],19:[function(require,module,exports){
// Used by promise extensions that are based on array extensions.

'use strict';

var callable = require('es5-ext/object/valid-callable')
  , deferred = require('../../deferred')

  , reject = deferred.reject;

module.exports = function (name, ext) {
	deferred.extend(name, function (cb) {
		var def;
		((cb == null) || callable(cb));
		if (!this.pending) this.pending = [];
		def = deferred();
		this.pending.push(name, [arguments, def.resolve, def.reject]);
		return def.promise;
	}, function (args, resolve, reject) {
		var result;
		if (this.failed) {
			reject(this.value);
			return;
		}
		try {
			result = ext.apply(this.value, args);
		} catch (e) {
			reject(e);
			return;
		}
		resolve(result);
	}, function (cb) {
		((cb == null) || callable(cb));
		if (this.failed) return this;
		try {
			return ext.apply(this.value, arguments);
		} catch (e) {
			return reject(e);
		}
	});
};

},{"../../deferred":6,"es5-ext/object/valid-callable":72}],20:[function(require,module,exports){
// 'aside' - Promise extension
//
// promise.aside(win, fail)
//
// Works in analogous way as promise function itself (or `then`)
// but instead of adding promise to promise chain it returns context promise and
// lets callback carry on with other processing logic

'use strict';

var callable = require('es5-ext/object/valid-callable')
  , deferred = require('../../deferred');

deferred.extend('aside', function (win, fail) {
	((win == null) || callable(win));
	((fail == null) || callable(fail));
	if (win || fail) {
		if (!this.pending) {
			this.pending = [];
		}
		this.pending.push('aside', arguments);
	}
	return this;
}, function (win, fail) {
	var cb = this.failed ? fail : win;
	if (cb) {
		cb(this.value);
	}
}, function (win, fail) {
	var cb;
	((win == null) || callable(win));
	((fail == null) || callable(fail));
	cb = this.failed ? fail : win;
	if (cb) {
		cb(this.value);
	}
	return this;
});

},{"../../deferred":6,"es5-ext/object/valid-callable":72}],21:[function(require,module,exports){
// 'catch' - Promise extension
//
// promise.catch(cb)
//
// Same as `then` but accepts only onFail callback

'use strict';

var isCallable = require('es5-ext/object/is-callable')
  , validValue = require('es5-ext/object/valid-value')
  , deferred   = require('../../deferred')
  , isPromise  = require('../../is-promise')

  , resolve = deferred.resolve, reject = deferred.reject;

deferred.extend('catch', function (cb) {
	var def;
	validValue(cb);
	if (!this.pending) this.pending = [];
	def = deferred();
	this.pending.push('catch', [cb, def.resolve, def.reject]);
	return def.promise;
}, function (cb, resolve, reject) {
	var value;
	if (!this.failed) {
		resolve(this.value);
		return;
	}
	if (isCallable(cb)) {
		if (isPromise(cb)) {
			if (cb.resolved) {
				if (cb.failed) reject(cb.value);
				else resolve(cb.value);
			} else {
				cb.done(resolve, reject);
			}
			return;
		}
		try { value = cb(this.value); } catch (e) {
			reject(e);
			return;
		}
		resolve(value);
		return;
	}
	resolve(cb);
}, function (cb) {
	var value;
	validValue(cb);
	if (!this.failed) return this;
	if (isCallable(cb)) {
		if (isPromise(cb)) return cb;
		try { value = cb(this.value); } catch (e) {
			return reject(e);
		}
		return resolve(value);
	}
	return resolve(cb);
});

},{"../../deferred":6,"../../is-promise":33,"es5-ext/object/is-callable":65,"es5-ext/object/valid-value":74}],22:[function(require,module,exports){
// 'cb' - Promise extension
//
// promise.cb(cb)
//
// Handles asynchronous function style callback (which is run in next event loop
// the earliest). Returns self promise. Callback is optional.
//
// Useful when we want to configure typical asynchronous function which logic is
// internally configured with promises.
//
// Extension can be used as follows:
//
// var foo = function (arg1, arg2, cb) {
//     var d = deferred();
//     // ... implementation
//     return d.promise.cb(cb);
// };
//
// `cb` extension returns promise and handles eventual callback (optional)

'use strict';

var callable   = require('es5-ext/object/valid-callable')
  , nextTick   = require('next-tick')
  , deferred   = require('../../deferred');

deferred.extend('cb', function (cb) {
	if (cb == null) return this;
	callable(cb);
	nextTick(function () {
		if (this.resolved) {
			if (this.failed) cb(this.value);
			else cb(null, this.value);
		} else {
			if (!this.pending) this.pending = [];
			this.pending.push('cb', [cb]);
		}
	}.bind(this));
	return this;
}, function (cb) {
	if (this.failed) cb(this.value);
	else cb(null, this.value);
}, function (cb) {
	if (cb == null) return this;
	callable(cb);
	nextTick(function () {
		if (this.failed) cb(this.value);
		else cb(null, this.value);
	}.bind(this));
	return this;
});

},{"../../deferred":6,"es5-ext/object/valid-callable":72,"next-tick":91}],23:[function(require,module,exports){
// 'finally' - Promise extension
//
// promise.finally(cb)
//
// Called on promise resolution returns same promise, doesn't pass any values to
// provided callback

'use strict';

var callable = require('es5-ext/object/valid-callable')
  , deferred = require('../../deferred');

deferred.extend('finally', function (cb) {
	callable(cb);
	if (!this.pending) this.pending = [];
	this.pending.push('finally', arguments);
	return this;
}, function (cb) { cb(); }, function (cb) {
	callable(cb)();
	return this;
});

},{"../../deferred":6,"es5-ext/object/valid-callable":72}],24:[function(require,module,exports){
// 'get' - Promise extension
//
// promise.get(name)
//
// Resolves with property of resolved object

'use strict';

var value    = require('es5-ext/object/valid-value')
  , deferred = require('../../deferred')

  , reduce = Array.prototype.reduce
  , resolve = deferred.resolve, reject = deferred.reject;

deferred.extend('get', function (/*…name*/) {
	var def;
	if (!this.pending) this.pending = [];
	def = deferred();
	this.pending.push('get', [arguments, def.resolve, def.reject]);
	return def.promise;

}, function (args, resolve, reject) {
	var result;
	if (this.failed) reject(this.value);
	try {
		result = reduce.call(args, function (obj, key) {
			return value(obj)[String(key)];
		}, this.value);
	} catch (e) {
		reject(e);
		return;
	}
	resolve(result);
}, function (/*…name*/) {
	var result;
	if (this.failed) return this;
	try {
		result = reduce.call(arguments, function (obj, key) {
			return value(obj)[String(key)];
		}, this.value);
	} catch (e) {
		return reject(e);
	}
	return resolve(result);
});

},{"../../deferred":6,"es5-ext/object/valid-value":74}],25:[function(require,module,exports){
// 'invokeAsync' - Promise extension
//
// promise.invokeAsync(name[, arg0[, arg1[, ...]]])
//
// On resolved object calls asynchronous method that takes callback
// (Node.js style).
// Do not pass callback, it's handled by internal implementation.
// 'name' can be method name or method itself.

'use strict';

var toArray          = require('es5-ext/array/to-array')
  , isCallable       = require('es5-ext/object/is-callable')
  , deferred         = require('../../deferred')
  , isPromise        = require('../../is-promise')
  , processArguments = require('../_process-arguments')

  , slice = Array.prototype.slice, apply = Function.prototype.apply
  , reject = deferred.reject

  , applyFn;

applyFn = function (fn, args, resolve, reject) {
	var result;
	if (fn.returnsPromise) {
		try {
			result = apply.call(fn, this, args);
		} catch (e) {
			reject(e);
			return;
		}
		return resolve(result);
	}
	args = toArray(args).concat(function (error, result) {
		if (error == null) {
			resolve((arguments.length > 2) ? slice.call(arguments, 1) : result);
		} else {
			reject(error);
		}
	});
	try {
		apply.call(fn, this, args);
	} catch (e2) {
		reject(e2);
	}
};

deferred.extend('invokeAsync', function (method/*, …args*/) {
	var def;
	if (!this.pending) this.pending = [];
	def = deferred();
	this.pending.push('invokeAsync', [arguments, def.resolve, def.reject]);
	return def.promise;
}, function (args, resolve, reject) {
	var fn;
	if (this.failed) {
		reject(this.value);
		return;
	}

	if (this.value == null) {
		reject(new TypeError("Cannot use null or undefined"));
		return;
	}

	fn = args[0];
	if (!isCallable(fn)) {
		fn = String(fn);
		if (!isCallable(this.value[fn])) {
			reject(new TypeError(fn + " is not a function"));
			return;
		}
		fn = this.value[fn];
	}

	args = processArguments(slice.call(args, 1));
	if (isPromise(args)) {
		if (args.failed) {
			reject(args.value);
			return;
		}
		args.done(function (args) {
			applyFn.call(this, fn, args, resolve, reject);
		}.bind(this.value), reject);
	} else {
		applyFn.call(this.value, fn, args, resolve, reject);
	}
}, function (method/*, …args*/) {
	var args, def;
	if (this.failed) return this;

	if (this.value == null) {
		return reject(new TypeError("Cannot use null or undefined"));
	}

	if (!isCallable(method)) {
		method = String(method);
		if (!isCallable(this.value[method])) {
			return reject(new TypeError(method + " is not a function"));
		}
		method = this.value[method];
	}

	args = processArguments(slice.call(arguments, 1));
	if (isPromise(args)) {
		if (args.failed) return args;
		def = deferred();
		args.done(function (args) {
			applyFn.call(this, method, args, def.resolve, def.reject);
		}.bind(this.value), def.reject);
	} else if (!method.returnsPromise) {
		def = deferred();
		applyFn.call(this.value, method, args, def.resolve, def.reject);
	} else {
		return applyFn.call(this.value, method, args, deferred, reject);
	}
	return def.promise;
});

},{"../../deferred":6,"../../is-promise":33,"../_process-arguments":8,"es5-ext/array/to-array":44,"es5-ext/object/is-callable":65}],26:[function(require,module,exports){
// 'invoke' - Promise extension
//
// promise.invoke(name[, arg0[, arg1[, ...]]])
//
// On resolved object calls method that returns immediately.
// 'name' can be method name or method itself.

'use strict';

var isCallable       = require('es5-ext/object/is-callable')
  , deferred         = require('../../deferred')
  , isPromise        = require('../../is-promise')
  , processArguments = require('../_process-arguments')

  , slice = Array.prototype.slice, apply = Function.prototype.apply
  , reject = deferred.reject
  , applyFn;

applyFn = function (fn, args, resolve, reject) {
	var value;
	try {
		value = apply.call(fn, this, args);
	} catch (e) {
		return reject(e);
	}
	return resolve(value);
};

deferred.extend('invoke', function (method/*, …args*/) {
	var def;
	if (!this.pending) this.pending = [];
	def = deferred();
	this.pending.push('invoke', [arguments, def.resolve, def.reject]);
	return def.promise;
}, function (args, resolve, reject) {
	var fn;
	if (this.failed) {
		reject(this.value);
		return;
	}

	if (this.value == null) {
		reject(new TypeError("Cannot use null or undefined"));
		return;
	}

	fn = args[0];
	if (!isCallable(fn)) {
		fn = String(fn);
		if (!isCallable(this.value[fn])) {
			reject(new TypeError(fn + " is not a function"));
			return;
		}
		fn = this.value[fn];
	}

	args = processArguments(slice.call(args, 1));
	if (isPromise(args)) {
		if (args.failed) {
			reject(args.value);
			return;
		}
		args.done(function (args) {
			applyFn.call(this, fn, args, resolve, reject);
		}.bind(this.value), reject);
	} else {
		applyFn.call(this.value, fn, args, resolve, reject);
	}
}, function (method/*, …args*/) {
	var args, def;
	if (this.failed) return this;

	if (this.value == null) {
		return reject(new TypeError("Cannot use null or undefined"));
	}

	if (!isCallable(method)) {
		method = String(method);
		if (!isCallable(this.value[method])) {
			return reject(new TypeError(method + " is not a function"));
		}
		method = this.value[method];
	}

	args = processArguments(slice.call(arguments, 1));
	if (isPromise(args)) {
		if (args.failed) return args;
		def = deferred();
		args.done(function (args) {
			applyFn.call(this, method, args, def.resolve, def.reject);
		}.bind(this.value), def.reject);
		return def.promise;
	}
	return applyFn.call(this.value, method, args, deferred, reject);
});

},{"../../deferred":6,"../../is-promise":33,"../_process-arguments":8,"es5-ext/object/is-callable":65}],27:[function(require,module,exports){
// 'map' - Promise extension
//
// promise.map(fn[, thisArg[, concurrentLimit]])
//
// Promise aware map for array-like results

'use strict';

require('./_array')('map', require('../array/map'));

},{"../array/map":11,"./_array":19}],28:[function(require,module,exports){
// 'reduce' - Promise extension
//
// promise.reduce(fn[, initial])
//
// Promise aware reduce for array-like results

'use strict';

require('./_array')('reduce', require('../array/reduce'));

},{"../array/reduce":12,"./_array":19}],29:[function(require,module,exports){
// 'some' - Promise extension
//
// promise.some(fn[, thisArg])
//
// Promise aware some for array-like results

'use strict';

require('./_array')('some', require('../array/some'));

},{"../array/some":13,"./_array":19}],30:[function(require,module,exports){
// 'spread' - Promise extensions
//
// promise.spread(onsuccess, onerror)
//
// Matches eventual list result onto function arguments,
// otherwise works same as 'then' (promise function itself)

'use strict';

var spread     = require('es5-ext/function/#/spread')
  , callable   = require('es5-ext/object/valid-callable')
  , isCallable = require('es5-ext/object/is-callable')
  , isPromise  = require('../../is-promise')
  , deferred   = require('../../deferred')

  , resolve = deferred.resolve, reject = deferred.reject;

deferred.extend('spread', function (win, fail) {
	var def;
	((win == null) || callable(win));
	if (!win && (fail == null)) return this;
	if (!this.pending) this.pending = [];
	def = deferred();
	this.pending.push('spread', [win, fail, def.resolve, def.reject]);
	return def.promise;
}, function (win, fail, resolve, reject) {
	var cb, value;
	cb = this.failed ? fail : win;
	if (cb == null) {
		if (this.failed) reject(this.value);
		else resolve(this.value);
	}
	if (isCallable(cb)) {
		if (isPromise(cb)) {
			if (cb.resolved) {
				if (cb.failed) reject(cb.value);
				else resolve(cb.value);
			} else {
				cb.done(resolve, reject);
			}
			return;
		}
		if (!this.failed) cb = spread.call(cb);
		try {
			value = cb(this.value);
		} catch (e) {
			reject(e);
			return;
		}
		resolve(value);
	} else {
		resolve(cb);
	}
}, function (win, fail) {
	var cb, value;
	cb = this.failed ? fail : win;
	if (cb == null) return this;
	if (isCallable(cb)) {
		if (isPromise(cb)) return cb;
		if (!this.failed) cb = spread.call(cb);
		try {
			value = cb(this.value);
		} catch (e) {
			return reject(e);
		}
		return resolve(value);
	}
	return resolve(cb);
});

},{"../../deferred":6,"../../is-promise":33,"es5-ext/function/#/spread":47,"es5-ext/object/is-callable":65,"es5-ext/object/valid-callable":72}],31:[function(require,module,exports){
// This construct deferred with all needed goodies that are being exported
// when we import 'deferred' by main name.
// All available promise extensions are also initialized.

'use strict';

var call   = Function.prototype.call
  , assign = require('es5-ext/object/assign');

module.exports = assign(require('./deferred'), {
	invokeAsync:   require('./invoke-async'),
	isPromise:     require('./is-promise'),
	dynamicQueue:  require('./dynamic-queue'),
	validPromise:  require('./valid-promise'),
	callAsync:     call.bind(require('./ext/function/call-async')),
	delay:         call.bind(require('./ext/function/delay')),
	gate:          call.bind(require('./ext/function/gate')),
	monitor:       require('./monitor'),
	promisify:     call.bind(require('./ext/function/promisify')),
	promisifySync: call.bind(require('./ext/function/promisify-sync')),
	every:         call.bind(require('./ext/array/every')),
	find:          call.bind(require('./ext/array/find')),
	map:           call.bind(require('./ext/array/map')),
	reduce:        call.bind(require('./ext/array/reduce')),
	some:          call.bind(require('./ext/array/some'))
}, require('./profiler'));

require('./ext/promise/aside');
require('./ext/promise/catch');
require('./ext/promise/cb');
require('./ext/promise/finally');
require('./ext/promise/get');
require('./ext/promise/invoke');
require('./ext/promise/invoke-async');
require('./ext/promise/map');
require('./ext/promise/spread');
require('./ext/promise/some');
require('./ext/promise/reduce');

},{"./deferred":6,"./dynamic-queue":7,"./ext/array/every":9,"./ext/array/find":10,"./ext/array/map":11,"./ext/array/reduce":12,"./ext/array/some":13,"./ext/function/call-async":14,"./ext/function/delay":15,"./ext/function/gate":16,"./ext/function/promisify":18,"./ext/function/promisify-sync":17,"./ext/promise/aside":20,"./ext/promise/catch":21,"./ext/promise/cb":22,"./ext/promise/finally":23,"./ext/promise/get":24,"./ext/promise/invoke":26,"./ext/promise/invoke-async":25,"./ext/promise/map":27,"./ext/promise/reduce":28,"./ext/promise/some":29,"./ext/promise/spread":30,"./invoke-async":32,"./is-promise":33,"./monitor":35,"./profiler":36,"./valid-promise":37,"es5-ext/object/assign":60}],32:[function(require,module,exports){
// Invoke asynchronous function

'use strict';

var isCallable = require('es5-ext/object/is-callable')
  , callable   = require('es5-ext/object/valid-callable')
  , value      = require('es5-ext/object/valid-value')
  , callAsync  = require('./ext/function/call-async')._base

  , slice = Array.prototype.slice;

module.exports = function (obj, fn/*, …args*/) {
	value(obj);
	if (!isCallable(fn)) fn = callable(obj[fn]);
	return callAsync(fn, null, obj, slice.call(arguments, 2));
};

},{"./ext/function/call-async":14,"es5-ext/object/is-callable":65,"es5-ext/object/valid-callable":72,"es5-ext/object/valid-value":74}],33:[function(require,module,exports){
// Whether given object is a promise

'use strict';

module.exports = function (o) {
	return (typeof o === 'function') && (typeof o.then === 'function') && (o.end !== o.done);
};

},{}],34:[function(require,module,exports){
// Promise aware Array's some

'use strict';

var assign     = require('es5-ext/object/assign')
  , value      = require('es5-ext/object/valid-value')
  , callable   = require('es5-ext/object/valid-callable')
  , deferred   = require('../deferred')
  , isPromise  = require('../is-promise')
  , assimilate = require('../assimilate')

  , call = Function.prototype.call
  , resolve = deferred.resolve;

module.exports = function (resolvent) {
	var Iterator = function (list, cb, context) {
		this.list = list;
		this.cb = cb;
		this.context = context;
		this.length = list.length >>> 0;

		while (this.current < this.length) {
			if (this.current in list) {
				assign(this, deferred());
				this.processCb = this.processCb.bind(this);
				this.processValue = this.processValue.bind(this);
				this.continue();
				return this.promise;
			}
			++this.current;
		}
		return resolve(!resolvent);
	};

	Iterator.prototype = {
		current: 0,
		state: false,
		continue: function () {
			var result;
			while (!this.state) {
				result = this.process();
				if (this.state !== 'cb') break;
				result = this.processCb(result);
				if (this.state !== 'value') break;
				this.processValue(result);
			}
		},
		process: function () {
			var value = assimilate(this.list[this.current]);
			if (isPromise(value)) {
				if (!value.resolved) {
					value.done(function (result) {
						result = this.processCb(result);
						if (this.state !== 'value') return;
						this.processValue(result);
						if (!this.state) this.continue();
					}.bind(this), this.reject);
					return;
				}
				if (value.failed) {
					this.reject(value.value);
					return;
				}
				value = value.value;
			}
			this.state = 'cb';
			return value;
		},
		processCb: function (value) {
			if (this.cb) {
				try {
					value = call.call(this.cb, this.context, value, this.current, this.list);
				} catch (e) {
					this.reject(e);
					return;
				}
				value = assimilate(value);
				if (isPromise(value)) {
					if (!value.resolved) {
						value.done(function (result) {
							this.state = 'value';
							this.processValue(result);
							if (!this.state) this.continue();
						}.bind(this), this.reject);
						return;
					}
					if (value.failed) {
						this.reject(value.value);
						return;
					}
					value = value.value;
				}
			}
			this.state = 'value';
			return value;
		},
		processValue: function (value) {
			if (Boolean(value) === resolvent) {
				this.resolve(resolvent);
				return;
			}
			while (++this.current < this.length) {
				if (this.current in this.list) {
					this.state = false;
					return;
				}
			}
			this.resolve(!resolvent);
		}
	};

	return function (cb/*, thisArg*/) {
		value(this);
		((cb == null) || callable(cb));

		return new Iterator(this, cb, arguments[1]);
	};
};

},{"../assimilate":5,"../deferred":6,"../is-promise":33,"es5-ext/object/assign":60,"es5-ext/object/valid-callable":72,"es5-ext/object/valid-value":74}],35:[function(require,module,exports){
// Run if you want to monitor unresolved promises (in properly working
// application there should be no promises that are never resolved)

'use strict';

var max        = Math.max
  , callable   = require('es5-ext/object/valid-callable')
  , isCallable = require('es5-ext/object/is-callable')
  , toPosInt   = require('es5-ext/number/to-pos-integer')
  , deferred   = require('./deferred');

exports = module.exports = function (timeout, cb) {
	if (timeout === false) {
		// Cancel monitor
		delete deferred._monitor;
		delete exports.timeout;
		delete exports.callback;
		return;
	}
	exports.timeout = timeout = max(toPosInt(timeout) || 5000, 50);
	if (cb == null) {
		if ((typeof console !== 'undefined') && console &&
				isCallable(console.error)) {
			cb = function (e) {
				console.error(((e.stack && e.stack.toString()) ||
					"Unresolved promise: no stack available"));
			};
		}
	} else {
		callable(cb);
	}
	exports.callback = cb;

	deferred._monitor = function () {
		var e = new Error("Unresolved promise");
		return setTimeout(function () {
			if (cb) cb(e);
		}, timeout);
	};
};

},{"./deferred":6,"es5-ext/number/to-pos-integer":58,"es5-ext/object/is-callable":65,"es5-ext/object/valid-callable":72}],36:[function(require,module,exports){
'use strict';

var partial  = require('es5-ext/function/#/partial')
  , forEach  = require('es5-ext/object/for-each')
  , pad      = require('es5-ext/string/#/pad')
  , deferred = require('./deferred')

  , resolved, rStats, unresolved, uStats, profile;

exports.profile = function () {
	resolved = 0;
	rStats = {};
	unresolved = 0;
	uStats = {};
	deferred._profile = profile;
};

profile = function (isResolved) {
	var stack, data;

	if (isResolved) {
		++resolved;
		data = rStats;
	} else {
		++unresolved;
		data = uStats;
	}

	stack = (new Error()).stack;
	if (!stack.split('\n').slice(3).some(function (line) {
			if ((line.search(/[\/\\]deferred[\/\\]/) === -1) &&
					(line.search(/[\/\\]es5-ext[\/\\]/) === -1) &&
					(line.indexOf(' (native)') === -1)) {
				line = line.replace(/\n/g, "\\n").trim();
				if (!data[line]) {
					data[line] = { count: 0 };
				}
				++data[line].count;
				return true;
			}
		})) {
		if (!data.unknown) {
			data.unknown = { count: 0, stack: stack };
		}
		++data.unknown.count;
	}
};

exports.profileEnd = function () {
	var total, lpad, log = '';

	if (!deferred._profile) {
		throw new Error("Deferred profiler was not initialized");
	}
	delete deferred._profile;

	log += "------------------------------------------------------------\n";
	log += "Deferred usage statistics:\n\n";

	total = String(resolved + unresolved);
	lpad = partial.call(pad, " ", total.length);
	log += total + " Total promises initialized\n";
	log += lpad.call(unresolved) + " Initialized as Unresolved\n";
	log += lpad.call(resolved) + " Initialized as Resolved\n";

	if (unresolved) {
		log += "\nUnresolved promises were initialized at:\n";
		forEach(uStats, function (data, name) {
			log += lpad.call(data.count) + " " + name + "\n";
		}, null, function (a, b) {
			return this[b].count - this[a].count;
		});
	}

	if (resolved) {
		log += "\nResolved promises were initialized at:\n";
		forEach(rStats, function (data, name) {
			log += lpad.call(data.count) + " " + name + "\n";
		}, null, function (a, b) {
			return this[b].count - this[a].count;
		});
	}
	log += "------------------------------------------------------------\n";

	return {
		log: log,
		resolved: { count: resolved, stats: rStats },
		unresolved: { count: unresolved, stats: uStats }
	};
};

},{"./deferred":6,"es5-ext/function/#/partial":46,"es5-ext/object/for-each":63,"es5-ext/string/#/pad":78}],37:[function(require,module,exports){
'use strict';

var isPromise = require('./is-promise');

module.exports = function (x) {
	if (!isPromise(x)) {
		throw new TypeError(x + " is not a promise object");
	}
	return x;
};

},{"./is-promise":33}],38:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Array.from
	: require('./shim');

},{"./is-implemented":39,"./shim":40}],39:[function(require,module,exports){
'use strict';

module.exports = function () {
	var from = Array.from, arr, result;
	if (typeof from !== 'function') return false;
	arr = ['raz', 'dwa'];
	result = from(arr);
	return Boolean(result && (result !== arr) && (result[1] === 'dwa'));
};

},{}],40:[function(require,module,exports){
'use strict';

var iteratorSymbol = require('es6-symbol').iterator
  , isArguments    = require('../../function/is-arguments')
  , isFunction     = require('../../function/is-function')
  , toPosInt       = require('../../number/to-pos-integer')
  , callable       = require('../../object/valid-callable')
  , validValue     = require('../../object/valid-value')
  , isString       = require('../../string/is-string')

  , isArray = Array.isArray, call = Function.prototype.call
  , desc = { configurable: true, enumerable: true, writable: true, value: null }
  , defineProperty = Object.defineProperty;

module.exports = function (arrayLike/*, mapFn, thisArg*/) {
	var mapFn = arguments[1], thisArg = arguments[2], Constructor, i, j, arr, l, code, iterator
	  , result, getIterator, value;

	arrayLike = Object(validValue(arrayLike));

	if (mapFn != null) callable(mapFn);
	if (!this || (this === Array) || !isFunction(this)) {
		// Result: Plain array
		if (!mapFn) {
			if (isArguments(arrayLike)) {
				// Source: Arguments
				l = arrayLike.length;
				if (l !== 1) return Array.apply(null, arrayLike);
				arr = new Array(1);
				arr[0] = arrayLike[0];
				return arr;
			}
			if (isArray(arrayLike)) {
				// Source: Array
				arr = new Array(l = arrayLike.length);
				for (i = 0; i < l; ++i) arr[i] = arrayLike[i];
				return arr;
			}
		}
		arr = [];
	} else {
		// Result: Non plain array
		Constructor = this;
	}

	if (!isArray(arrayLike)) {
		if ((getIterator = arrayLike[iteratorSymbol]) !== undefined) {
			// Source: Iterator
			iterator = callable(getIterator).call(arrayLike);
			if (Constructor) arr = new Constructor();
			result = iterator.next();
			i = 0;
			while (!result.done) {
				value = mapFn ? call.call(mapFn, thisArg, result.value, i) : result.value;
				if (!Constructor) {
					arr[i] = value;
				} else {
					desc.value = value;
					defineProperty(arr, i, desc);
				}
				result = iterator.next();
				++i;
			}
			l = i;
		} else if (isString(arrayLike)) {
			// Source: String
			l = arrayLike.length;
			if (Constructor) arr = new Constructor();
			for (i = 0, j = 0; i < l; ++i) {
				value = arrayLike[i];
				if ((i + 1) < l) {
					code = value.charCodeAt(0);
					if ((code >= 0xD800) && (code <= 0xDBFF)) value += arrayLike[++i];
				}
				value = mapFn ? call.call(mapFn, thisArg, value, j) : value;
				if (!Constructor) {
					arr[j] = value;
				} else {
					desc.value = value;
					defineProperty(arr, j, desc);
				}
				++j;
			}
			l = j;
		}
	}
	if (l === undefined) {
		// Source: array or array-like
		l = toPosInt(arrayLike.length);
		if (Constructor) arr = new Constructor(l);
		for (i = 0; i < l; ++i) {
			value = mapFn ? call.call(mapFn, thisArg, arrayLike[i], i) : arrayLike[i];
			if (!Constructor) {
				arr[i] = value;
			} else {
				desc.value = value;
				defineProperty(arr, i, desc);
			}
		}
	}
	if (Constructor) {
		desc.value = null;
		arr.length = l;
	}
	return arr;
};

},{"../../function/is-arguments":49,"../../function/is-function":50,"../../number/to-pos-integer":58,"../../object/valid-callable":72,"../../object/valid-value":74,"../../string/is-string":82,"es6-symbol":84}],41:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Array.of
	: require('./shim');

},{"./is-implemented":42,"./shim":43}],42:[function(require,module,exports){
'use strict';

module.exports = function () {
	var of = Array.of, result;
	if (typeof of !== 'function') return false;
	result = of('foo', 'bar');
	return Boolean(result && (result[1] === 'bar'));
};

},{}],43:[function(require,module,exports){
'use strict';

var isFunction = require('../../function/is-function')

  , slice = Array.prototype.slice, defineProperty = Object.defineProperty
  , desc = { configurable: true, enumerable: true, writable: true, value: null };

module.exports = function (/*…items*/) {
	var result, i, l;
	if (!this || (this === Array) || !isFunction(this)) return slice.call(arguments);
	result = new this(l = arguments.length);
	for (i = 0; i < l; ++i) {
		desc.value = arguments[i];
		defineProperty(result, i, desc);
	}
	desc.value = null;
	result.length = l;
	return result;
};

},{"../../function/is-function":50}],44:[function(require,module,exports){
'use strict';

var from = require('./from')

  , isArray = Array.isArray;

module.exports = function (arrayLike) {
	return isArray(arrayLike) ? arrayLike : from(arrayLike);
};

},{"./from":38}],45:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call(new Error());

module.exports = function (x) {
	return (x && ((x instanceof Error) || (toString.call(x)) === id)) || false;
};

},{}],46:[function(require,module,exports){
'use strict';

var callable     = require('../../object/valid-callable')
  , aFrom        = require('../../array/from')
  , defineLength = require('../_define-length')

  , apply = Function.prototype.apply;

module.exports = function (/*…args*/) {
	var fn = callable(this)
	  , args = aFrom(arguments);

	return defineLength(function () {
		return apply.call(fn, this, args.concat(aFrom(arguments)));
	}, fn.length - args.length);
};

},{"../../array/from":38,"../../object/valid-callable":72,"../_define-length":48}],47:[function(require,module,exports){
'use strict';

var callable = require('../../object/valid-callable')

  , apply = Function.prototype.apply;

module.exports = function () {
	var fn = callable(this);
	return function (args) { return apply.call(fn, this, args); };
};

},{"../../object/valid-callable":72}],48:[function(require,module,exports){
'use strict';

var toPosInt = require('../number/to-pos-integer')

  , test = function (a, b) {}, desc, defineProperty
  , generate, mixin;

try {
	Object.defineProperty(test, 'length', { configurable: true, writable: false,
		enumerable: false, value: 1 });
} catch (ignore) {}

if (test.length === 1) {
	// ES6
	desc = { configurable: true, writable: false, enumerable: false };
	defineProperty = Object.defineProperty;
	module.exports = function (fn, length) {
		length = toPosInt(length);
		if (fn.length === length) return fn;
		desc.value = length;
		return defineProperty(fn, 'length', desc);
	};
} else {
	mixin = require('../object/mixin');
	generate = (function () {
		var cache = [];
		return function (l) {
			var args, i = 0;
			if (cache[l]) return cache[l];
			args = [];
			while (l--) args.push('a' + (++i).toString(36));
			return new Function('fn', 'return function (' + args.join(', ') +
				') { return fn.apply(this, arguments); };');
		};
	}());
	module.exports = function (src, length) {
		var target;
		length = toPosInt(length);
		if (src.length === length) return src;
		target = generate(length)(src);
		try { mixin(target, src); } catch (ignore) {}
		return target;
	};
}

},{"../number/to-pos-integer":58,"../object/mixin":70}],49:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call((function () { return arguments; }()));

module.exports = function (x) { return (toString.call(x) === id); };

},{}],50:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call(require('./noop'));

module.exports = function (f) {
	return (typeof f === "function") && (toString.call(f) === id);
};

},{"./noop":51}],51:[function(require,module,exports){
'use strict';

module.exports = function () {};

},{}],52:[function(require,module,exports){
'use strict';

var iteratorSymbol = require('es6-symbol').iterator
  , isArrayLike    = require('../object/is-array-like');

module.exports = function (x) {
	if (x == null) return false;
	if (typeof x[iteratorSymbol] === 'function') return true;
	return isArrayLike(x);
};

},{"../object/is-array-like":64,"es6-symbol":84}],53:[function(require,module,exports){
'use strict';

var isObject = require('../object/is-object')
  , is       = require('./is');

module.exports = function (x) {
	if (is(x) && isObject(x)) return x;
	throw new TypeError(x + " is not an iterable or array-like object");
};

},{"../object/is-object":66,"./is":52}],54:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Math.sign
	: require('./shim');

},{"./is-implemented":55,"./shim":56}],55:[function(require,module,exports){
'use strict';

module.exports = function () {
	var sign = Math.sign;
	if (typeof sign !== 'function') return false;
	return ((sign(10) === 1) && (sign(-20) === -1));
};

},{}],56:[function(require,module,exports){
'use strict';

module.exports = function (value) {
	value = Number(value);
	if (isNaN(value) || (value === 0)) return value;
	return (value > 0) ? 1 : -1;
};

},{}],57:[function(require,module,exports){
'use strict';

var sign = require('../math/sign')

  , abs = Math.abs, floor = Math.floor;

module.exports = function (value) {
	if (isNaN(value)) return 0;
	value = Number(value);
	if ((value === 0) || !isFinite(value)) return value;
	return sign(value) * floor(abs(value));
};

},{"../math/sign":54}],58:[function(require,module,exports){
'use strict';

var toInteger = require('./to-integer')

  , max = Math.max;

module.exports = function (value) { return max(0, toInteger(value)); };

},{"./to-integer":57}],59:[function(require,module,exports){
// Internal method, used by iteration functions.
// Calls a function for each key-value pair found in object
// Optionally takes compareFn to iterate object in specific order

'use strict';

var callable = require('./valid-callable')
  , value    = require('./valid-value')

  , bind = Function.prototype.bind, call = Function.prototype.call, keys = Object.keys
  , propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = function (method, defVal) {
	return function (obj, cb/*, thisArg, compareFn*/) {
		var list, thisArg = arguments[2], compareFn = arguments[3];
		obj = Object(value(obj));
		callable(cb);

		list = keys(obj);
		if (compareFn) {
			list.sort((typeof compareFn === 'function') ? bind.call(compareFn, obj) : undefined);
		}
		if (typeof method !== 'function') method = list[method];
		return call.call(method, list, function (key, index) {
			if (!propertyIsEnumerable.call(obj, key)) return defVal;
			return call.call(cb, thisArg, obj[key], key, obj, index);
		});
	};
};

},{"./valid-callable":72,"./valid-value":74}],60:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.assign
	: require('./shim');

},{"./is-implemented":61,"./shim":62}],61:[function(require,module,exports){
'use strict';

module.exports = function () {
	var assign = Object.assign, obj;
	if (typeof assign !== 'function') return false;
	obj = { foo: 'raz' };
	assign(obj, { bar: 'dwa' }, { trzy: 'trzy' });
	return (obj.foo + obj.bar + obj.trzy) === 'razdwatrzy';
};

},{}],62:[function(require,module,exports){
'use strict';

var keys  = require('../keys')
  , value = require('../valid-value')

  , max = Math.max;

module.exports = function (dest, src/*, …srcn*/) {
	var error, i, l = max(arguments.length, 2), assign;
	dest = Object(value(dest));
	assign = function (key) {
		try { dest[key] = src[key]; } catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < l; ++i) {
		src = arguments[i];
		keys(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

},{"../keys":67,"../valid-value":74}],63:[function(require,module,exports){
'use strict';

module.exports = require('./_iterate')('forEach');

},{"./_iterate":59}],64:[function(require,module,exports){
'use strict';

var isFunction = require('../function/is-function')
  , isObject   = require('./is-object');

module.exports = function (x) {
	return ((x != null) && (typeof x.length === 'number') &&

		// Just checking ((typeof x === 'object') && (typeof x !== 'function'))
		// won't work right for some cases, e.g.:
		// type of instance of NodeList in Safari is a 'function'

		((isObject(x) && !isFunction(x)) || (typeof x === "string"))) || false;
};

},{"../function/is-function":50,"./is-object":66}],65:[function(require,module,exports){
// Deprecated

'use strict';

module.exports = function (obj) { return typeof obj === 'function'; };

},{}],66:[function(require,module,exports){
'use strict';

var map = { function: true, object: true };

module.exports = function (x) {
	return ((x != null) && map[typeof x]) || false;
};

},{}],67:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.keys
	: require('./shim');

},{"./is-implemented":68,"./shim":69}],68:[function(require,module,exports){
'use strict';

module.exports = function () {
	try {
		Object.keys('primitive');
		return true;
	} catch (e) { return false; }
};

},{}],69:[function(require,module,exports){
'use strict';

var keys = Object.keys;

module.exports = function (object) {
	return keys(object == null ? object : Object(object));
};

},{}],70:[function(require,module,exports){
'use strict';

var value = require('./valid-value')

  , defineProperty = Object.defineProperty
  , getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
  , getOwnPropertyNames = Object.getOwnPropertyNames;

module.exports = function (target, source) {
	var error;
	target = Object(value(target));
	getOwnPropertyNames(Object(value(source))).forEach(function (name) {
		try {
			defineProperty(target, name, getOwnPropertyDescriptor(source, name));
		} catch (e) { error = e; }
	});
	if (error !== undefined) throw error;
	return target;
};

},{"./valid-value":74}],71:[function(require,module,exports){
'use strict';

var forEach = Array.prototype.forEach, create = Object.create;

var process = function (src, obj) {
	var key;
	for (key in src) obj[key] = src[key];
};

module.exports = function (options/*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (options == null) return;
		process(Object(options), result);
	});
	return result;
};

},{}],72:[function(require,module,exports){
'use strict';

module.exports = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
	return fn;
};

},{}],73:[function(require,module,exports){
'use strict';

var isObject = require('./is-object');

module.exports = function (value) {
	if (!isObject(value)) throw new TypeError(value + " is not an Object");
	return value;
};

},{"./is-object":66}],74:[function(require,module,exports){
'use strict';

module.exports = function (value) {
	if (value == null) throw new TypeError("Cannot use null or undefined");
	return value;
};

},{}],75:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? String.prototype.contains
	: require('./shim');

},{"./is-implemented":76,"./shim":77}],76:[function(require,module,exports){
'use strict';

var str = 'razdwatrzy';

module.exports = function () {
	if (typeof str.contains !== 'function') return false;
	return ((str.contains('dwa') === true) && (str.contains('foo') === false));
};

},{}],77:[function(require,module,exports){
'use strict';

var indexOf = String.prototype.indexOf;

module.exports = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

},{}],78:[function(require,module,exports){
'use strict';

var toInteger = require('../../number/to-integer')
  , value     = require('../../object/valid-value')
  , repeat    = require('./repeat')

  , abs = Math.abs, max = Math.max;

module.exports = function (fill/*, length*/) {
	var self = String(value(this))
	  , sLength = self.length
	  , length = arguments[1];

	length = isNaN(length) ? 1 : toInteger(length);
	fill = repeat.call(String(fill), abs(length));
	if (length >= 0) return fill.slice(0, max(0, length - sLength)) + self;
	return self + (((sLength + length) >= 0) ? '' : fill.slice(length + sLength));
};

},{"../../number/to-integer":57,"../../object/valid-value":74,"./repeat":79}],79:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? String.prototype.repeat
	: require('./shim');

},{"./is-implemented":80,"./shim":81}],80:[function(require,module,exports){
'use strict';

var str = 'foo';

module.exports = function () {
	if (typeof str.repeat !== 'function') return false;
	return (str.repeat(2) === 'foofoo');
};

},{}],81:[function(require,module,exports){
// Thanks: http://www.2ality.com/2014/01/efficient-string-repeat.html

'use strict';

var value     = require('../../../object/valid-value')
  , toInteger = require('../../../number/to-integer');

module.exports = function (count) {
	var str = String(value(this)), result;
	count = toInteger(count);
	if (count < 0) throw new RangeError("Count must be >= 0");
	if (!isFinite(count)) throw new RangeError("Count must be < ∞");
	result = '';
	if (!count) return result;
	while (true) {
		if (count & 1) result += str;
		count >>>= 1;
		if (count <= 0) break;
		str += str;
	}
	return result;
};

},{"../../../number/to-integer":57,"../../../object/valid-value":74}],82:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call('');

module.exports = function (x) {
	return (typeof x === 'string') || (x && (typeof x === 'object') &&
		((x instanceof String) || (toString.call(x) === id))) || false;
};

},{}],83:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.1.2
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // see https://github.com/cujojs/when/issues/410 for details
      return function() {
        process.nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertx() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }
    function lib$es6$promise$then$$then(onFulfillment, onRejection) {
      var parent = this;
      var state = parent._state;

      if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
        return this;
      }

      var child = new this.constructor(lib$es6$promise$$internal$$noop);
      var result = parent._result;

      if (state) {
        var callback = arguments[state - 1];
        lib$es6$promise$asap$$asap(function(){
          lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
        });
      } else {
        lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
      }

      return child;
    }
    var lib$es6$promise$then$$default = lib$es6$promise$then$$then;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFulfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable, then) {
      if (maybeThenable.constructor === promise.constructor &&
          then === lib$es6$promise$then$$default &&
          constructor.resolve === lib$es6$promise$promise$resolve$$default) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value, lib$es6$promise$$internal$$getThen(value));
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!lib$es6$promise$utils$$isArray(entries)) {
        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

    var lib$es6$promise$promise$$counter = 0;

    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this._id = lib$es6$promise$promise$$counter++;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        typeof resolver !== 'function' && lib$es6$promise$promise$$needsResolver();
        this instanceof lib$es6$promise$promise$$Promise ? lib$es6$promise$$internal$$initializePromise(this, resolver) : lib$es6$promise$promise$$needsNew();
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: lib$es6$promise$then$$default,

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;
    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      this._instanceConstructor = Constructor;
      this.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (Array.isArray(input)) {
        this._input     = input;
        this.length     = input.length;
        this._remaining = input.length;

        this._result = new Array(this.length);

        if (this.length === 0) {
          lib$es6$promise$$internal$$fulfill(this.promise, this._result);
        } else {
          this.length = this.length || 0;
          this._enumerate();
          if (this._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(this.promise, this._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(this.promise, this._validationError());
      }
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var length  = this.length;
      var input   = this._input;

      for (var i = 0; this._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        this._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var c = this._instanceConstructor;
      var resolve = c.resolve;

      if (resolve === lib$es6$promise$promise$resolve$$default) {
        var then = lib$es6$promise$$internal$$getThen(entry);

        if (then === lib$es6$promise$then$$default &&
            entry._state !== lib$es6$promise$$internal$$PENDING) {
          this._settledAt(entry._state, i, entry._result);
        } else if (typeof then !== 'function') {
          this._remaining--;
          this._result[i] = entry;
        } else if (c === lib$es6$promise$promise$$default) {
          var promise = new c(lib$es6$promise$$internal$$noop);
          lib$es6$promise$$internal$$handleMaybeThenable(promise, entry, then);
          this._willSettleAt(promise, i);
        } else {
          this._willSettleAt(new c(function(resolve) { resolve(entry); }), i);
        }
      } else {
        this._willSettleAt(resolve(entry), i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var promise = this.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        this._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          this._result[i] = value;
        }
      }

      if (this._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, this._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":92}],84:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')() ? Symbol : require('./polyfill');

},{"./is-implemented":85,"./polyfill":87}],85:[function(require,module,exports){
'use strict';

module.exports = function () {
	var symbol;
	if (typeof Symbol !== 'function') return false;
	symbol = Symbol('test symbol');
	try { String(symbol); } catch (e) { return false; }
	if (typeof Symbol.iterator === 'symbol') return true;

	// Return 'true' for polyfills
	if (typeof Symbol.isConcatSpreadable !== 'object') return false;
	if (typeof Symbol.iterator !== 'object') return false;
	if (typeof Symbol.toPrimitive !== 'object') return false;
	if (typeof Symbol.toStringTag !== 'object') return false;
	if (typeof Symbol.unscopables !== 'object') return false;

	return true;
};

},{}],86:[function(require,module,exports){
'use strict';

module.exports = function (x) {
	return (x && ((typeof x === 'symbol') || (x['@@toStringTag'] === 'Symbol'))) || false;
};

},{}],87:[function(require,module,exports){
// ES2015 Symbol polyfill for environments that do not support it (or partially support it_

'use strict';

var d              = require('d')
  , validateSymbol = require('./validate-symbol')

  , create = Object.create, defineProperties = Object.defineProperties
  , defineProperty = Object.defineProperty, objPrototype = Object.prototype
  , NativeSymbol, SymbolPolyfill, HiddenSymbol, globalSymbols = create(null);

if (typeof Symbol === 'function') NativeSymbol = Symbol;

var generateName = (function () {
	var created = create(null);
	return function (desc) {
		var postfix = 0, name, ie11BugWorkaround;
		while (created[desc + (postfix || '')]) ++postfix;
		desc += (postfix || '');
		created[desc] = true;
		name = '@@' + desc;
		defineProperty(objPrototype, name, d.gs(null, function (value) {
			// For IE11 issue see:
			// https://connect.microsoft.com/IE/feedbackdetail/view/1928508/
			//    ie11-broken-getters-on-dom-objects
			// https://github.com/medikoo/es6-symbol/issues/12
			if (ie11BugWorkaround) return;
			ie11BugWorkaround = true;
			defineProperty(this, name, d(value));
			ie11BugWorkaround = false;
		}));
		return name;
	};
}());

// Internal constructor (not one exposed) for creating Symbol instances.
// This one is used to ensure that `someSymbol instanceof Symbol` always return false
HiddenSymbol = function Symbol(description) {
	if (this instanceof HiddenSymbol) throw new TypeError('TypeError: Symbol is not a constructor');
	return SymbolPolyfill(description);
};

// Exposed `Symbol` constructor
// (returns instances of HiddenSymbol)
module.exports = SymbolPolyfill = function Symbol(description) {
	var symbol;
	if (this instanceof Symbol) throw new TypeError('TypeError: Symbol is not a constructor');
	symbol = create(HiddenSymbol.prototype);
	description = (description === undefined ? '' : String(description));
	return defineProperties(symbol, {
		__description__: d('', description),
		__name__: d('', generateName(description))
	});
};
defineProperties(SymbolPolyfill, {
	for: d(function (key) {
		if (globalSymbols[key]) return globalSymbols[key];
		return (globalSymbols[key] = SymbolPolyfill(String(key)));
	}),
	keyFor: d(function (s) {
		var key;
		validateSymbol(s);
		for (key in globalSymbols) if (globalSymbols[key] === s) return key;
	}),

	// If there's native implementation of given symbol, let's fallback to it
	// to ensure proper interoperability with other native functions e.g. Array.from
	hasInstance: d('', (NativeSymbol && NativeSymbol.hasInstance) || SymbolPolyfill('hasInstance')),
	isConcatSpreadable: d('', (NativeSymbol && NativeSymbol.isConcatSpreadable) ||
		SymbolPolyfill('isConcatSpreadable')),
	iterator: d('', (NativeSymbol && NativeSymbol.iterator) || SymbolPolyfill('iterator')),
	match: d('', (NativeSymbol && NativeSymbol.match) || SymbolPolyfill('match')),
	replace: d('', (NativeSymbol && NativeSymbol.replace) || SymbolPolyfill('replace')),
	search: d('', (NativeSymbol && NativeSymbol.search) || SymbolPolyfill('search')),
	species: d('', (NativeSymbol && NativeSymbol.species) || SymbolPolyfill('species')),
	split: d('', (NativeSymbol && NativeSymbol.split) || SymbolPolyfill('split')),
	toPrimitive: d('', (NativeSymbol && NativeSymbol.toPrimitive) || SymbolPolyfill('toPrimitive')),
	toStringTag: d('', (NativeSymbol && NativeSymbol.toStringTag) || SymbolPolyfill('toStringTag')),
	unscopables: d('', (NativeSymbol && NativeSymbol.unscopables) || SymbolPolyfill('unscopables'))
});

// Internal tweaks for real symbol producer
defineProperties(HiddenSymbol.prototype, {
	constructor: d(SymbolPolyfill),
	toString: d('', function () { return this.__name__; })
});

// Proper implementation of methods exposed on Symbol.prototype
// They won't be accessible on produced symbol instances as they derive from HiddenSymbol.prototype
defineProperties(SymbolPolyfill.prototype, {
	toString: d(function () { return 'Symbol (' + validateSymbol(this).__description__ + ')'; }),
	valueOf: d(function () { return validateSymbol(this); })
});
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toPrimitive, d('',
	function () { return validateSymbol(this); }));
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, d('c', 'Symbol'));

// Proper implementaton of toPrimitive and toStringTag for returned symbol instances
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toStringTag,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toStringTag]));

// Note: It's important to define `toPrimitive` as last one, as some implementations
// implement `toPrimitive` natively without implementing `toStringTag` (or other specified symbols)
// And that may invoke error in definition flow:
// See: https://github.com/medikoo/es6-symbol/issues/13#issuecomment-164146149
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toPrimitive,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive]));

},{"./validate-symbol":88,"d":3}],88:[function(require,module,exports){
'use strict';

var isSymbol = require('./is-symbol');

module.exports = function (value) {
	if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
	return value;
};

},{"./is-symbol":86}],89:[function(require,module,exports){
'use strict';

var d        = require('d')
  , callable = require('es5-ext/object/valid-callable')

  , apply = Function.prototype.apply, call = Function.prototype.call
  , create = Object.create, defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , descriptor = { configurable: true, enumerable: false, writable: true }

  , on, once, off, emit, methods, descriptors, base;

on = function (type, listener) {
	var data;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) {
		data = descriptor.value = create(null);
		defineProperty(this, '__ee__', descriptor);
		descriptor.value = null;
	} else {
		data = this.__ee__;
	}
	if (!data[type]) data[type] = listener;
	else if (typeof data[type] === 'object') data[type].push(listener);
	else data[type] = [data[type], listener];

	return this;
};

once = function (type, listener) {
	var once, self;

	callable(listener);
	self = this;
	on.call(this, type, once = function () {
		off.call(self, type, once);
		apply.call(listener, this, arguments);
	});

	once.__eeOnceListener__ = listener;
	return this;
};

off = function (type, listener) {
	var data, listeners, candidate, i;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) return this;
	data = this.__ee__;
	if (!data[type]) return this;
	listeners = data[type];

	if (typeof listeners === 'object') {
		for (i = 0; (candidate = listeners[i]); ++i) {
			if ((candidate === listener) ||
					(candidate.__eeOnceListener__ === listener)) {
				if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];
				else listeners.splice(i, 1);
			}
		}
	} else {
		if ((listeners === listener) ||
				(listeners.__eeOnceListener__ === listener)) {
			delete data[type];
		}
	}

	return this;
};

emit = function (type) {
	var i, l, listener, listeners, args;

	if (!hasOwnProperty.call(this, '__ee__')) return;
	listeners = this.__ee__[type];
	if (!listeners) return;

	if (typeof listeners === 'object') {
		l = arguments.length;
		args = new Array(l - 1);
		for (i = 1; i < l; ++i) args[i - 1] = arguments[i];

		listeners = listeners.slice();
		for (i = 0; (listener = listeners[i]); ++i) {
			apply.call(listener, this, args);
		}
	} else {
		switch (arguments.length) {
		case 1:
			call.call(listeners, this);
			break;
		case 2:
			call.call(listeners, this, arguments[1]);
			break;
		case 3:
			call.call(listeners, this, arguments[1], arguments[2]);
			break;
		default:
			l = arguments.length;
			args = new Array(l - 1);
			for (i = 1; i < l; ++i) {
				args[i - 1] = arguments[i];
			}
			apply.call(listeners, this, args);
		}
	}
};

methods = {
	on: on,
	once: once,
	off: off,
	emit: emit
};

descriptors = {
	on: d(on),
	once: d(once),
	off: d(off),
	emit: d(emit)
};

base = defineProperties({}, descriptors);

module.exports = exports = function (o) {
	return (o == null) ? create(base) : defineProperties(Object(o), descriptors);
};
exports.methods = methods;

},{"d":3,"es5-ext/object/valid-callable":72}],90:[function(require,module,exports){
'use strict';

var forEach    = require('es5-ext/object/for-each')
  , validValue = require('es5-ext/object/valid-object')

  , push = Array.prototype.apply, defineProperty = Object.defineProperty
  , create = Object.create, hasOwnProperty = Object.prototype.hasOwnProperty
  , d = { configurable: true, enumerable: false, writable: true };

module.exports = function (e1, e2) {
	var data;
	(validValue(e1) && validValue(e2));
	if (!hasOwnProperty.call(e1, '__ee__')) {
		if (!hasOwnProperty.call(e2, '__ee__')) {
			d.value = create(null);
			defineProperty(e1, '__ee__', d);
			defineProperty(e2, '__ee__', d);
			d.value = null;
			return;
		}
		d.value = e2.__ee__;
		defineProperty(e1, '__ee__', d);
		d.value = null;
		return;
	}
	data = d.value = e1.__ee__;
	if (!hasOwnProperty.call(e2, '__ee__')) {
		defineProperty(e2, '__ee__', d);
		d.value = null;
		return;
	}
	if (data === e2.__ee__) return;
	forEach(e2.__ee__, function (listener, name) {
		if (!data[name]) {
			data[name] = listener;
			return;
		}
		if (typeof data[name] === 'object') {
			if (typeof listener === 'object') push.apply(data[name], listener);
			else data[name].push(listener);
		} else if (typeof listener === 'object') {
			listener.unshift(data[name]);
			data[name] = listener;
		} else {
			data[name] = [data[name], listener];
		}
	});
	defineProperty(e2, '__ee__', d);
	d.value = null;
};

},{"es5-ext/object/for-each":63,"es5-ext/object/valid-object":73}],91:[function(require,module,exports){
(function (process){
'use strict';

var callable, byObserver;

callable = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
	return fn;
};

byObserver = function (Observer) {
	var node = document.createTextNode(''), queue, i = 0;
	new Observer(function () {
		var data;
		if (!queue) return;
		data = queue;
		queue = null;
		if (typeof data === 'function') {
			data();
			return;
		}
		data.forEach(function (fn) { fn(); });
	}).observe(node, { characterData: true });
	return function (fn) {
		callable(fn);
		if (queue) {
			if (typeof queue === 'function') queue = [queue, fn];
			else queue.push(fn);
			return;
		}
		queue = fn;
		node.data = (i = ++i % 2);
	};
};

module.exports = (function () {
	// Node.js
	if ((typeof process !== 'undefined') && process &&
			(typeof process.nextTick === 'function')) {
		return process.nextTick;
	}

	// MutationObserver=
	if ((typeof document === 'object') && document) {
		if (typeof MutationObserver === 'function') {
			return byObserver(MutationObserver);
		}
		if (typeof WebKitMutationObserver === 'function') {
			return byObserver(WebKitMutationObserver);
		}
	}

	// W3C Draft
	// http://dvcs.w3.org/hg/webperf/raw-file/tip/specs/setImmediate/Overview.html
	if (typeof setImmediate === 'function') {
		return function (cb) { setImmediate(callable(cb)); };
	}

	// Wide available standard
	if (typeof setTimeout === 'function') {
		return function (cb) { setTimeout(callable(cb), 0); };
	}

	return null;
}());

}).call(this,require('_process'))

},{"_process":92}],92:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],93:[function(require,module,exports){
(function (factory) {
    if (typeof exports === 'object') {
        // Node/CommonJS
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(factory);
    } else {
        // Browser globals (with support for web workers)
        var glob;

        try {
            glob = window;
        } catch (e) {
            glob = self;
        }

        glob.SparkMD5 = factory();
    }
}(function (undefined) {

    'use strict';

    /*
     * Fastest md5 implementation around (JKM md5).
     * Credits: Joseph Myers
     *
     * @see http://www.myersdaily.org/joseph/javascript/md5-text.html
     * @see http://jsperf.com/md5-shootout/7
     */

    /* this function is much faster,
      so if possible we use it. Some IEs
      are the only ones I know of that
      need the idiotic second function,
      generated by an if clause.  */
    var add32 = function (a, b) {
        return (a + b) & 0xFFFFFFFF;
    },
        hex_chr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];


    function cmn(q, a, b, x, s, t) {
        a = add32(add32(a, q), add32(x, t));
        return add32((a << s) | (a >>> (32 - s)), b);
    }

    function ff(a, b, c, d, x, s, t) {
        return cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    function gg(a, b, c, d, x, s, t) {
        return cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    function hh(a, b, c, d, x, s, t) {
        return cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function ii(a, b, c, d, x, s, t) {
        return cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    function md5cycle(x, k) {
        var a = x[0],
            b = x[1],
            c = x[2],
            d = x[3];

        a = ff(a, b, c, d, k[0], 7, -680876936);
        d = ff(d, a, b, c, k[1], 12, -389564586);
        c = ff(c, d, a, b, k[2], 17, 606105819);
        b = ff(b, c, d, a, k[3], 22, -1044525330);
        a = ff(a, b, c, d, k[4], 7, -176418897);
        d = ff(d, a, b, c, k[5], 12, 1200080426);
        c = ff(c, d, a, b, k[6], 17, -1473231341);
        b = ff(b, c, d, a, k[7], 22, -45705983);
        a = ff(a, b, c, d, k[8], 7, 1770035416);
        d = ff(d, a, b, c, k[9], 12, -1958414417);
        c = ff(c, d, a, b, k[10], 17, -42063);
        b = ff(b, c, d, a, k[11], 22, -1990404162);
        a = ff(a, b, c, d, k[12], 7, 1804603682);
        d = ff(d, a, b, c, k[13], 12, -40341101);
        c = ff(c, d, a, b, k[14], 17, -1502002290);
        b = ff(b, c, d, a, k[15], 22, 1236535329);

        a = gg(a, b, c, d, k[1], 5, -165796510);
        d = gg(d, a, b, c, k[6], 9, -1069501632);
        c = gg(c, d, a, b, k[11], 14, 643717713);
        b = gg(b, c, d, a, k[0], 20, -373897302);
        a = gg(a, b, c, d, k[5], 5, -701558691);
        d = gg(d, a, b, c, k[10], 9, 38016083);
        c = gg(c, d, a, b, k[15], 14, -660478335);
        b = gg(b, c, d, a, k[4], 20, -405537848);
        a = gg(a, b, c, d, k[9], 5, 568446438);
        d = gg(d, a, b, c, k[14], 9, -1019803690);
        c = gg(c, d, a, b, k[3], 14, -187363961);
        b = gg(b, c, d, a, k[8], 20, 1163531501);
        a = gg(a, b, c, d, k[13], 5, -1444681467);
        d = gg(d, a, b, c, k[2], 9, -51403784);
        c = gg(c, d, a, b, k[7], 14, 1735328473);
        b = gg(b, c, d, a, k[12], 20, -1926607734);

        a = hh(a, b, c, d, k[5], 4, -378558);
        d = hh(d, a, b, c, k[8], 11, -2022574463);
        c = hh(c, d, a, b, k[11], 16, 1839030562);
        b = hh(b, c, d, a, k[14], 23, -35309556);
        a = hh(a, b, c, d, k[1], 4, -1530992060);
        d = hh(d, a, b, c, k[4], 11, 1272893353);
        c = hh(c, d, a, b, k[7], 16, -155497632);
        b = hh(b, c, d, a, k[10], 23, -1094730640);
        a = hh(a, b, c, d, k[13], 4, 681279174);
        d = hh(d, a, b, c, k[0], 11, -358537222);
        c = hh(c, d, a, b, k[3], 16, -722521979);
        b = hh(b, c, d, a, k[6], 23, 76029189);
        a = hh(a, b, c, d, k[9], 4, -640364487);
        d = hh(d, a, b, c, k[12], 11, -421815835);
        c = hh(c, d, a, b, k[15], 16, 530742520);
        b = hh(b, c, d, a, k[2], 23, -995338651);

        a = ii(a, b, c, d, k[0], 6, -198630844);
        d = ii(d, a, b, c, k[7], 10, 1126891415);
        c = ii(c, d, a, b, k[14], 15, -1416354905);
        b = ii(b, c, d, a, k[5], 21, -57434055);
        a = ii(a, b, c, d, k[12], 6, 1700485571);
        d = ii(d, a, b, c, k[3], 10, -1894986606);
        c = ii(c, d, a, b, k[10], 15, -1051523);
        b = ii(b, c, d, a, k[1], 21, -2054922799);
        a = ii(a, b, c, d, k[8], 6, 1873313359);
        d = ii(d, a, b, c, k[15], 10, -30611744);
        c = ii(c, d, a, b, k[6], 15, -1560198380);
        b = ii(b, c, d, a, k[13], 21, 1309151649);
        a = ii(a, b, c, d, k[4], 6, -145523070);
        d = ii(d, a, b, c, k[11], 10, -1120210379);
        c = ii(c, d, a, b, k[2], 15, 718787259);
        b = ii(b, c, d, a, k[9], 21, -343485551);

        x[0] = add32(a, x[0]);
        x[1] = add32(b, x[1]);
        x[2] = add32(c, x[2]);
        x[3] = add32(d, x[3]);
    }

    function md5blk(s) {
        var md5blks = [],
            i; /* Andy King said do it this way. */

        for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
        }
        return md5blks;
    }

    function md5blk_array(a) {
        var md5blks = [],
            i; /* Andy King said do it this way. */

        for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24);
        }
        return md5blks;
    }

    function md51(s) {
        var n = s.length,
            state = [1732584193, -271733879, -1732584194, 271733878],
            i,
            length,
            tail,
            tmp,
            lo,
            hi;

        for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk(s.substring(i - 64, i)));
        }
        s = s.substring(i - 64);
        length = s.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
        }
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Beware that the final length might not fit in 32 bits so we take care of that
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;

        md5cycle(state, tail);
        return state;
    }

    function md51_array(a) {
        var n = a.length,
            state = [1732584193, -271733879, -1732584194, 271733878],
            i,
            length,
            tail,
            tmp,
            lo,
            hi;

        for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk_array(a.subarray(i - 64, i)));
        }

        // Not sure if it is a bug, however IE10 will always produce a sub array of length 1
        // containing the last element of the parent array if the sub array specified starts
        // beyond the length of the parent array - weird.
        // https://connect.microsoft.com/IE/feedback/details/771452/typed-array-subarray-issue
        a = (i - 64) < n ? a.subarray(i - 64) : new Uint8Array(0);

        length = a.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= a[i] << ((i % 4) << 3);
        }

        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Beware that the final length might not fit in 32 bits so we take care of that
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;

        md5cycle(state, tail);

        return state;
    }

    function rhex(n) {
        var s = '',
            j;
        for (j = 0; j < 4; j += 1) {
            s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
        }
        return s;
    }

    function hex(x) {
        var i;
        for (i = 0; i < x.length; i += 1) {
            x[i] = rhex(x[i]);
        }
        return x.join('');
    }

    // In some cases the fast add32 function cannot be used..
    if (hex(md51('hello')) !== '5d41402abc4b2a76b9719d911017c592') {
        add32 = function (x, y) {
            var lsw = (x & 0xFFFF) + (y & 0xFFFF),
                msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        };
    }

    // ---------------------------------------------------

    /**
     * ArrayBuffer slice polyfill.
     *
     * @see https://github.com/ttaubert/node-arraybuffer-slice
     */

    if (typeof ArrayBuffer !== 'undefined' && !ArrayBuffer.prototype.slice) {
        (function () {
            function clamp(val, length) {
                val = (val | 0) || 0;

                if (val < 0) {
                    return Math.max(val + length, 0);
                }

                return Math.min(val, length);
            }

            ArrayBuffer.prototype.slice = function (from, to) {
                var length = this.byteLength,
                    begin = clamp(from, length),
                    end = length,
                    num,
                    target,
                    targetArray,
                    sourceArray;

                if (to !== undefined) {
                    end = clamp(to, length);
                }

                if (begin > end) {
                    return new ArrayBuffer(0);
                }

                num = end - begin;
                target = new ArrayBuffer(num);
                targetArray = new Uint8Array(target);

                sourceArray = new Uint8Array(this, begin, num);
                targetArray.set(sourceArray);

                return target;
            };
        })();
    }

    // ---------------------------------------------------

    /**
     * Helpers.
     */

    function toUtf8(str) {
        if (/[\u0080-\uFFFF]/.test(str)) {
            str = unescape(encodeURIComponent(str));
        }

        return str;
    }

    function utf8Str2ArrayBuffer(str, returnUInt8Array) {
        var length = str.length,
           buff = new ArrayBuffer(length),
           arr = new Uint8Array(buff),
           i;

        for (i = 0; i < length; i += 1) {
            arr[i] = str.charCodeAt(i);
        }

        return returnUInt8Array ? arr : buff;
    }

    function arrayBuffer2Utf8Str(buff) {
        return String.fromCharCode.apply(null, new Uint8Array(buff));
    }

    function concatenateArrayBuffers(first, second, returnUInt8Array) {
        var result = new Uint8Array(first.byteLength + second.byteLength);

        result.set(new Uint8Array(first));
        result.set(new Uint8Array(second), first.byteLength);

        return returnUInt8Array ? result : result.buffer;
    }

    function hexToBinaryString(hex) {
        var bytes = [],
            length = hex.length,
            x;

        for (x = 0; x < length - 1; x += 2) {
            bytes.push(parseInt(hex.substr(x, 2), 16));
        }

        return String.fromCharCode.apply(String, bytes);
    }

    // ---------------------------------------------------

    /**
     * SparkMD5 OOP implementation.
     *
     * Use this class to perform an incremental md5, otherwise use the
     * static methods instead.
     */

    function SparkMD5() {
        // call reset to init the instance
        this.reset();
    }

    /**
     * Appends a string.
     * A conversion will be applied if an utf8 string is detected.
     *
     * @param {String} str The string to be appended
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.append = function (str) {
        // Converts the string to utf8 bytes if necessary
        // Then append as binary
        this.appendBinary(toUtf8(str));

        return this;
    };

    /**
     * Appends a binary string.
     *
     * @param {String} contents The binary string to be appended
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.appendBinary = function (contents) {
        this._buff += contents;
        this._length += contents.length;

        var length = this._buff.length,
            i;

        for (i = 64; i <= length; i += 64) {
            md5cycle(this._hash, md5blk(this._buff.substring(i - 64, i)));
        }

        this._buff = this._buff.substring(i - 64);

        return this;
    };

    /**
     * Finishes the incremental computation, reseting the internal state and
     * returning the result.
     *
     * @param {Boolean} raw True to get the raw string, false to get the hex string
     *
     * @return {String} The result
     */
    SparkMD5.prototype.end = function (raw) {
        var buff = this._buff,
            length = buff.length,
            i,
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ret;

        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= buff.charCodeAt(i) << ((i % 4) << 3);
        }

        this._finish(tail, length);
        ret = hex(this._hash);

        if (raw) {
            ret = hexToBinaryString(ret);
        }

        this.reset();

        return ret;
    };

    /**
     * Resets the internal state of the computation.
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.reset = function () {
        this._buff = '';
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];

        return this;
    };

    /**
     * Gets the internal state of the computation.
     *
     * @return {Object} The state
     */
    SparkMD5.prototype.getState = function () {
        return {
            buff: this._buff,
            length: this._length,
            hash: this._hash
        };
    };

    /**
     * Gets the internal state of the computation.
     *
     * @param {Object} state The state
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.setState = function (state) {
        this._buff = state.buff;
        this._length = state.length;
        this._hash = state.hash;

        return this;
    };

    /**
     * Releases memory used by the incremental buffer and other additional
     * resources. If you plan to use the instance again, use reset instead.
     */
    SparkMD5.prototype.destroy = function () {
        delete this._hash;
        delete this._buff;
        delete this._length;
    };

    /**
     * Finish the final calculation based on the tail.
     *
     * @param {Array}  tail   The tail (will be modified)
     * @param {Number} length The length of the remaining buffer
     */
    SparkMD5.prototype._finish = function (tail, length) {
        var i = length,
            tmp,
            lo,
            hi;

        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(this._hash, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Do the final computation based on the tail and length
        // Beware that the final length may not fit in 32 bits so we take care of that
        tmp = this._length * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;
        md5cycle(this._hash, tail);
    };

    /**
     * Performs the md5 hash on a string.
     * A conversion will be applied if utf8 string is detected.
     *
     * @param {String}  str The string
     * @param {Boolean} raw True to get the raw string, false to get the hex string
     *
     * @return {String} The result
     */
    SparkMD5.hash = function (str, raw) {
        // Converts the string to utf8 bytes if necessary
        // Then compute it using the binary function
        return SparkMD5.hashBinary(toUtf8(str), raw);
    };

    /**
     * Performs the md5 hash on a binary string.
     *
     * @param {String}  content The binary string
     * @param {Boolean} raw     True to get the raw string, false to get the hex string
     *
     * @return {String} The result
     */
    SparkMD5.hashBinary = function (content, raw) {
        var hash = md51(content),
            ret = hex(hash);

        return raw ? hexToBinaryString(ret) : ret;
    };

    // ---------------------------------------------------

    /**
     * SparkMD5 OOP implementation for array buffers.
     *
     * Use this class to perform an incremental md5 ONLY for array buffers.
     */
    SparkMD5.ArrayBuffer = function () {
        // call reset to init the instance
        this.reset();
    };

    /**
     * Appends an array buffer.
     *
     * @param {ArrayBuffer} arr The array to be appended
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.append = function (arr) {
        var buff = concatenateArrayBuffers(this._buff.buffer, arr, true),
            length = buff.length,
            i;

        this._length += arr.byteLength;

        for (i = 64; i <= length; i += 64) {
            md5cycle(this._hash, md5blk_array(buff.subarray(i - 64, i)));
        }

        this._buff = (i - 64) < length ? new Uint8Array(buff.buffer.slice(i - 64)) : new Uint8Array(0);

        return this;
    };

    /**
     * Finishes the incremental computation, reseting the internal state and
     * returning the result.
     *
     * @param {Boolean} raw True to get the raw string, false to get the hex string
     *
     * @return {String} The result
     */
    SparkMD5.ArrayBuffer.prototype.end = function (raw) {
        var buff = this._buff,
            length = buff.length,
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            i,
            ret;

        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= buff[i] << ((i % 4) << 3);
        }

        this._finish(tail, length);
        ret = hex(this._hash);

        if (raw) {
            ret = hexToBinaryString(ret);
        }

        this.reset();

        return ret;
    };

    /**
     * Resets the internal state of the computation.
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.reset = function () {
        this._buff = new Uint8Array(0);
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];

        return this;
    };

    /**
     * Gets the internal state of the computation.
     *
     * @return {Object} The state
     */
    SparkMD5.ArrayBuffer.prototype.getState = function () {
        var state = SparkMD5.prototype.getState.call(this);

        // Convert buffer to a string
        state.buff = arrayBuffer2Utf8Str(state.buff);

        return state;
    };

    /**
     * Gets the internal state of the computation.
     *
     * @param {Object} state The state
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.setState = function (state) {
        // Convert string to buffer
        state.buff = utf8Str2ArrayBuffer(state.buff, true);

        return SparkMD5.prototype.setState.call(this, state);
    };

    SparkMD5.ArrayBuffer.prototype.destroy = SparkMD5.prototype.destroy;

    SparkMD5.ArrayBuffer.prototype._finish = SparkMD5.prototype._finish;

    /**
     * Performs the md5 hash on an array buffer.
     *
     * @param {ArrayBuffer} arr The array buffer
     * @param {Boolean}     raw True to get the raw string, false to get the hex one
     *
     * @return {String} The result
     */
    SparkMD5.ArrayBuffer.hash = function (arr, raw) {
        var hash = md51_array(new Uint8Array(arr)),
            ret = hex(hash);

        return raw ? hexToBinaryString(ret) : ret;
    };

    return SparkMD5;
}));

},{}],94:[function(require,module,exports){
'use strict';

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.striptags = factory();
  }
}(this, function () {
    var STATE_OUTPUT       = 0,
        STATE_HTML         = 1,
        STATE_PRE_COMMENT  = 2,
        STATE_COMMENT      = 3,
        WHITESPACE         = /\s/,
        ALLOWED_TAGS_REGEX = /<(\w*)>/g;

    function striptags(html, allowableTags) {
        var html = html || '',
            state = STATE_OUTPUT,
            depth = 0,
            output = '',
            tagBuffer = '',
            inQuote = false,
            i, length, c;

        if (typeof allowableTags === 'string') {
            // Parse the string into an array of tags
            allowableTags = parseAllowableTags(allowableTags);
        } else if (!Array.isArray(allowableTags)) {
            // If it is not an array, explicitly set to null
            allowableTags = null;
        }

        for (i = 0, length = html.length; i < length; i++) {
            c = html[i];

            switch (c) {
                case '<': {
                    // ignore '<' if inside a quote
                    if (inQuote) {
                        break;
                    }

                    // '<' followed by a space is not a valid tag, continue
                    if (html[i + 1] == ' ') {
                        consumeCharacter(c);
                        break;
                    }

                    // change to STATE_HTML
                    if (state == STATE_OUTPUT) {
                        state = STATE_HTML;

                        consumeCharacter(c);
                        break;
                    }

                    // ignore additional '<' characters when inside a tag
                    if (state == STATE_HTML) {
                        depth++;
                        break;
                    }

                    consumeCharacter(c);
                    break;
                }

                case '>': {
                    // something like this is happening: '<<>>'
                    if (depth) {
                        depth--;
                        break;
                    }

                    // ignore '>' if inside a quote
                    if (inQuote) {
                        break;
                    }

                    // an HTML tag was closed
                    if (state == STATE_HTML) {
                        inQuote = state = 0;

                        if (allowableTags) {
                            tagBuffer += '>';
                            flushTagBuffer();
                        }

                        break;
                    }

                    // '<!' met its ending '>'
                    if (state == STATE_PRE_COMMENT) {
                        inQuote = state = 0;
                        tagBuffer = '';
                        break;
                    }

                    // if last two characters were '--', then end comment
                    if (state == STATE_COMMENT &&
                        html[i - 1] == '-' &&
                        html[i - 2] == '-') {

                        inQuote = state = 0;
                        tagBuffer = '';
                        break;
                    }

                    consumeCharacter(c);
                    break;
                }

                // catch both single and double quotes
                case '"':
                case '\'': {
                    if (state == STATE_HTML) {
                        if (inQuote == c) {
                            // end quote found
                            inQuote = false;
                        } else if (!inQuote) {
                            // start quote only if not already in one
                            inQuote = c;
                        }
                    }

                    consumeCharacter(c);
                    break;
                }

                case '!': {
                    if (state == STATE_HTML &&
                        html[i - 1] == '<') {

                        // looks like we might be starting a comment
                        state = STATE_PRE_COMMENT;
                        break;
                    }

                    consumeCharacter(c);
                    break;
                }

                case '-': {
                    // if the previous two characters were '!-', this is a comment
                    if (state == STATE_PRE_COMMENT &&
                        html[i - 1] == '-' &&
                        html[i - 2] == '!') {

                        state = STATE_COMMENT;
                        break;
                    }

                    consumeCharacter(c);
                    break;
                }

                case 'E':
                case 'e': {
                    // check for DOCTYPE, because it looks like a comment and isn't
                    if (state == STATE_PRE_COMMENT &&
                        html.substr(i - 6, 7).toLowerCase() == 'doctype') {

                        state = STATE_HTML;
                        break;
                    }

                    consumeCharacter(c);
                    break;
                }

                default: {
                    consumeCharacter(c);
                }
            }
        }

        function consumeCharacter(c) {
            if (state == STATE_OUTPUT) {
                output += c;
            } else if (allowableTags && state == STATE_HTML) {
                tagBuffer += c;
            }
        }

        function flushTagBuffer() {
            var normalized = '',
                nonWhitespaceSeen = false,
                i, length, c;

            normalizeTagBuffer:
            for (i = 0, length = tagBuffer.length; i < length; i++) {
                c = tagBuffer[i].toLowerCase();

                switch (c) {
                    case '<': {
                        break;
                    }

                    case '>': {
                        break normalizeTagBuffer;
                    }

                    case '/': {
                        nonWhitespaceSeen = true;
                        break;
                    }

                    default: {
                        if (!c.match(WHITESPACE)) {
                            nonWhitespaceSeen = true;
                            normalized += c;
                        } else if (nonWhitespaceSeen) {
                            break normalizeTagBuffer;
                        }
                    }
                }
            }

            if (allowableTags.indexOf(normalized) !== -1) {
                output += tagBuffer;
            }

            tagBuffer = '';
        }

        return output;
    }

    /**
     * Return an array containing tags that are allowed to pass through the
     * algorithm.
     *
     * @param string allowableTags A string of tags to allow (e.g. "<b><strong>").
     * @return array|null An array of allowed tags or null if none.
     */
    function parseAllowableTags(allowableTags) {
        var tagsArray = [],
            match;

        while ((match = ALLOWED_TAGS_REGEX.exec(allowableTags)) !== null) {
            tagsArray.push(match[1]);
        }

        return tagsArray.length !== 0 ? tagsArray : null;
    }

    return striptags;
}));

},{}],95:[function(require,module,exports){
'use strict';

module.exports = 2147483647;

},{}],96:[function(require,module,exports){
'use strict';

var toPosInt   = require('es5-ext/number/to-pos-integer')
  , maxTimeout = require('./max-timeout');

module.exports = function (value) {
	value = toPosInt(value);
	if (value > maxTimeout) throw new TypeError(value + " exceeds maximum possible timeout");
	return value;
};

},{"./max-timeout":95,"es5-ext/number/to-pos-integer":58}],97:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Ajax');
var Ajax = {};

Ajax.errorCallback = function (response) {
	//log.error(response);
	log.debug('ajax error callback', 2);
	log.debug('textStatus: ' + response.textStatus, 2);
	log.debug('errorThrown: ', 2);
	log.debug(response.errorThrown, 2);
	log.debug(response.jqxhr, 2);
};

Ajax.error = Ajax.errorCallback;
Ajax.activeRequests = [];

/*
 * Requires {target:items|collections|tags, libraryType:user|group, libraryID:<>}
 */
Ajax.apiRequestUrl = function (params) {
	log.debug('Zotero.Ajax.apiRequestUrl', 3);
	log.debug(params, 4);
	Object.keys(params).forEach(function (key) {
		var val = params[key];
		//should probably figure out exactly why I'm doing this, is it just to make sure no hashes snuck in?
		//if so the new validation below takes care of that instead
		if (typeof val == 'string') {
			val = val.split('#', 1);
			params[key] = val[0];
		}

		//validate params based on patterns in Zotero.validate
		if (Zotero.validator.validate(val, key) === false) {
			//warn on invalid parameter and drop from params that will be used
			log.warn('API argument failed validation: ' + key + ' cannot be ' + val);
			log.warn(params);
			delete params[key];
		}
	});

	if (!params.target) throw new Error('No target defined for api request');
	if (!(params.libraryType == 'user' || params.libraryType == 'group' || params.libraryType === '')) {
		throw new Error('Unexpected libraryType for api request ' + JSON.stringify(params));
	}
	if (params.libraryType && !params.libraryID) {
		throw new Error('No libraryID defined for api request');
	}
	if (params.target == 'publications' && params.libraryType != 'user') {
		throw new Error('publications is only valid for user libraries');
	}

	var base = Zotero.config.baseApiUrl;
	var url;

	if (params.libraryType !== '') {
		url = base + '/' + params.libraryType + 's/' + params.libraryID;
		if (params.collectionKey) {
			if (params.collectionKey == 'trash') {
				url += '/items/trash';
				return url;
			} else if (params.collectionKey.indexOf(',') !== -1) {} else if (params.target != 'collections') {
				url += '/collections/' + params.collectionKey;
			}
		}
	} else {
		url = base;
	}

	switch (params.target) {
		case 'items':
			url += '/items';
			break;
		case 'item':
			if (params.itemKey) {
				url += '/items/' + params.itemKey;
			} else {
				url += '/items';
			}
			break;
		case 'collections':
			url += '/collections';
			break;
		case 'childCollections':
			url += '/collections';
			break;
		case 'collection':
			break;
		case 'tags':
			url += '/tags';
			break;
		case 'children':
			url += '/items/' + params.itemKey + '/children';
			break;
		case 'key':
			url = base + '/users/' + params.libraryID + '/keys/' + params.apiKey;
			break;
		case 'deleted':
			url += '/deleted';
			break;
		case 'userGroups':
			url = base + '/users/' + params.libraryID + '/groups';
			break;
		case 'settings':
			url += '/settings/' + (params.settingsKey || '');
			break;
		case 'publications':
			url += '/publications/items';
			break;
		default:
			return false;
	}
	switch (params.targetModifier) {
		case 'top':
			url += '/top';
			break;
		case 'file':
			url += '/file';
			break;
		case 'viewsnapshot':
			url += '/file/view';
			break;
	}
	return url;
};

Ajax.apiQueryString = function (passedParams, useConfigKey) {
	log.debug('Zotero.Ajax.apiQueryString', 4);
	log.debug(passedParams, 4);
	if (useConfigKey === null || typeof useConfigKey === 'undefined') {
		useConfigKey = true;
	}

	Object.keys(passedParams).forEach(function (key) {
		var val = passedParams[key];
		if (typeof val == 'string') {
			val = val.split('#', 1);
			passedParams[key] = val[0];
		}
	});
	if (passedParams.hasOwnProperty('order') && passedParams['order'] == 'creatorSummary') {
		passedParams['order'] = 'creator';
	}
	if (passedParams.hasOwnProperty('order') && passedParams['order'] == 'year') {
		passedParams['order'] = 'date';
	}
	if (useConfigKey && Zotero.config.sessionAuth) {
		var sessionKey = Zotero.utils.readCookie(Zotero.config.sessionCookieName);
		passedParams['session'] = sessionKey;
	} else if (useConfigKey && Zotero.config.apiKey) {
		passedParams['key'] = Zotero.config.apiKey;
	}

	if (passedParams.hasOwnProperty('sort') && passedParams['sort'] == 'undefined') {
		//alert('fixed a bad sort');
		passedParams['sort'] = 'asc';
	}

	log.debug(passedParams, 4);

	var queryString = '?';
	var queryParamsArray = [];
	var queryParamOptions = ['start', 'limit', 'order', 'sort', 'content', 'include', 'format', 'q', 'fq', 'itemType', 'itemKey', 'collectionKey', 'searchKey', 'locale', 'tag', 'tagType', 'key', 'style', 'linkMode', 'linkwrap', 'session', 'newer', 'since'];
	queryParamOptions.sort();
	//build simple api query parameters object
	var queryParams = {};
	queryParamOptions.forEach(function (val) {
		if (passedParams.hasOwnProperty(val) && passedParams[val] !== '') {
			queryParams[val] = passedParams[val];
		}
	});

	//take out itemKey if it is not a list
	if (passedParams.hasOwnProperty('target') && passedParams['target'] !== 'items') {
		if (queryParams.hasOwnProperty('itemKey') && queryParams['itemKey'].indexOf(',') == -1) {
			delete queryParams['itemKey'];
		}
	}

	//take out collectionKey if it is not a list
	if (passedParams.hasOwnProperty('target') && passedParams['target'] !== 'collections') {
		if (queryParams.hasOwnProperty('collectionKey') && queryParams['collectionKey'].indexOf(',') === -1) {
			delete queryParams['collectionKey'];
		}
	}

	//add each of the found queryParams onto array
	Object.keys(queryParams).forEach(function (key) {
		var value = queryParams[key];
		if (Array.isArray(value)) {
			value.forEach(function (v) {
				if (key == 'tag' && v[0] == '-') {
					v = '\\' + v;
				}
				queryParamsArray.push(encodeURIComponent(key) + '=' + encodeURIComponent(v));
			});
		} else {
			if (key == 'tag' && value[0] == '-') {
				value = '\\' + value;
			}
			queryParamsArray.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
		}
	});

	//build query string by concatenating array
	queryString += queryParamsArray.join('&');
	return queryString;
};

Ajax.apiRequestString = function (config) {
	return Ajax.apiRequestUrl(config) + Ajax.apiQueryString(config);
};

Ajax.proxyWrapper = function (requestUrl, method) {
	if (Zotero.config.proxy) {
		if (!method) {
			method = 'GET';
		}
		return Zotero.config.proxyPath + '?requestMethod=' + method + '&requestUrl=' + encodeURIComponent(requestUrl);
	} else {
		return requestUrl;
	}
};

Ajax.parseQueryString = function (query) {};

Ajax.webUrl = function (args) {};

Ajax.downloadBlob = function (url) {
	return new Promise(function (resolve, reject) {
		var xhr = new XMLHttpRequest();
		var blob;

		xhr.open('GET', url, true);
		xhr.responseType = 'blob';

		xhr.addEventListener('load', function () {
			if (xhr.status === 200) {
				log.debug('downloadBlob Image retrieved. resolving', 3);
				resolve(xhr.response);
			} else {
				reject(xhr.response);
			}
		});
		// Send XHR
		xhr.send();
	});
};

module.exports = Ajax;

},{"./Log.js":115}],98:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var log = require('./Log.js').Logger('libZotero:ApiObject');

module.exports = function () {
	this.instance = 'Zotero.ApiObject';
	this.version = 0;
};

//associate Entry with a library so we can update it on the server
module.exports.prototype.associateWithLibrary = function (library) {
	var apiObject = this;
	apiObject.owningLibrary = library;
	if (_typeof(this.apiObj.library) == 'object') {
		this.apiObj.library.type = library.type;
		this.apiObj.library.id = library.libraryID;
	}
	return apiObject;
};

module.exports.prototype.fieldComparer = function (attr) {
	if (Intl) {
		var collator = new Intl.Collator();
		return function (a, b) {
			return collator.compare(a.apiObj.data[attr], b.apiObj.data[attr]);
		};
	} else {
		return function (a, b) {
			if (a.apiObj.data[attr].toLowerCase() == b.apiObj.data[attr].toLowerCase()) {
				return 0;
			}
			if (a.apiObj.data[attr].toLowerCase() < b.apiObj.data[attr].toLowerCase()) {
				return -1;
			}
			return 1;
		};
	}
};

},{"./Log.js":115}],99:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:ApiResponse');

module.exports = function (response) {
	log.debug('Zotero.ApiResponse', 3);
	this.totalResults = 0;
	this.apiVersion = null;
	this.lastModifiedVersion = 0;
	this.linkHeader = '';
	this.links = {};

	if (response) {
		if (!response.isError) {
			this.isError = false;
		} else {
			this.isError = true;
		}
		this.data = response.data;
		//this.jqxhr = response.jqxhr;
		this.parseResponse(response);
	}
};

module.exports.prototype.parseResponse = function (response) {
	log.debug('parseResponse', 3);
	var apiResponse = this;
	apiResponse.jqxhr = response.jqxhr;
	apiResponse.status = response.jqxhr.status;
	//keep track of relevant headers
	apiResponse.lastModifiedVersion = response.jqxhr.getResponseHeader('Last-Modified-Version');
	apiResponse.apiVersion = response.jqxhr.getResponseHeader('Zotero-API-Version');
	apiResponse.backoff = response.jqxhr.getResponseHeader('Backoff');
	apiResponse.retryAfter = response.jqxhr.getResponseHeader('Retry-After');
	apiResponse.contentType = response.jqxhr.getResponseHeader('Content-Type');
	apiResponse.linkHeader = response.jqxhr.getResponseHeader('Link');
	apiResponse.totalResults = response.jqxhr.getResponseHeader('Total-Results');
	if (apiResponse.backoff) {
		apiResponse.backoff = parseInt(apiResponse.backoff, 10);
	}
	if (apiResponse.retryAfter) {
		apiResponse.retryAfter = parseInt(apiResponse.retryAfter, 10);
	}
	//TODO: parse link header into individual links
	log.debug('parse link header', 4);
	log.debug(apiResponse.linkHeader, 4);
	if (apiResponse.linkHeader) {
		var links = apiResponse.linkHeader.split(',');
		var parsedLinks = {};
		var linkRegex = /^<([^>]+)>; rel="([^\"]*)"$/;
		for (var i = 0; i < links.length; i++) {
			var matches = linkRegex.exec(links[i].trim());
			if (matches[2]) {
				parsedLinks[matches[2]] = matches[1];
			}
		}
		apiResponse.parsedLinks = parsedLinks;
	}
};

},{"./Log.js":115}],100:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var log = require('./Log.js').Logger('libZotero:Base');

var Zotero = {
	callbacks: {},
	offline: {},
	temp: {},

	config: { librarySettings: {},
		baseApiUrl: 'https://api.zotero.org',
		baseWebsiteUrl: 'https://zotero.org',
		baseFeedUrl: 'https://api.zotero.org',
		baseZoteroWebsiteUrl: 'https://www.zotero.org',
		baseDownloadUrl: 'https://www.zotero.org',
		nonparsedBaseUrl: '',
		debugLogEndpoint: '',
		storeDebug: true,
		directDownloads: true,
		proxyPath: '/proxyrequest',
		ignoreLoggedInStatus: false,
		storePrefsRemote: true,
		preferUrlItem: true,
		sessionAuth: false,
		proxy: false,
		apiKey: '',
		apiVersion: 3,
		locale: 'en-US',
		cacheStoreType: 'localStorage',
		preloadCachedLibrary: true,
		sortOrdering: {
			'dateAdded': 'desc',
			'dateModified': 'desc',
			'date': 'desc',
			'year': 'desc',
			'accessDate': 'desc',
			'title': 'asc',
			'creator': 'asc'
		},
		defaultSortColumn: 'title',
		defaultSortOrder: 'asc',
		largeFields: {
			'title': 1,
			'abstractNote': 1,
			'extra': 1
		},
		richTextFields: {
			'note': 1
		},
		maxFieldSummaryLength: { title: 60 },
		exportFormats: ['bibtex', 'bookmarks', 'mods', 'refer', 'rdf_bibliontology', 'rdf_dc', 'rdf_zotero', 'ris', 'wikipedia'],
		exportFormatsMap: {
			'bibtex': 'BibTeX',
			'bookmarks': 'Bookmarks',
			'mods': 'MODS',
			'refer': 'Refer/BibIX',
			'rdf_bibliontology': 'Bibliontology RDF',
			'rdf_dc': 'Unqualified Dublin Core RDF',
			'rdf_zotero': 'Zotero RDF',
			'ris': 'RIS',
			'wikipedia': 'Wikipedia Citation Templates'
		},
		defaultApiArgs: {
			'order': 'title',
			'sort': 'asc',
			'limit': 50,
			'start': 0
		}
	},
	/*
 debug: function(debugstring, level){
 	var prefLevel = 3;
 	if(Zotero.config.storeDebug){
 		if(level <= prefLevel){
 			Zotero.debugstring += 'DEBUG:' + debugstring + '\n';
 		}
 	}
 	if(typeof console == 'undefined'){
 		return;
 	}
 	if(typeof(level) !== 'number'){
 		level = 1;
 	}
 	if(Zotero.preferences !== undefined){
 		prefLevel = Zotero.preferences.getPref('debug_level');
 	}
 	if(level <= prefLevel) {
 		console.log(debugstring);
 	}
 },
 
 warn: function(warnstring){
 	if(Zotero.config.storeDebug){
 		Zotero.debugstring += 'WARN:' + warnstring + '\n';
 	}
 	if(typeof console == 'undefined' || typeof console.warn == 'undefined'){
 		this.debug(warnstring);
 	}
 	else{
 		console.warn(warnstring);
 	}
 },
 
 error: function(errorstring){
 	if(Zotero.config.storeDebug){
 		Zotero.debugstring += 'ERROR:' + errorstring + '\n';
 	}
 	if(typeof console == 'undefined' || typeof console.error == 'undefined'){
 		this.debug(errorstring);
 	}
 	else{
 		console.error(errorstring);
 	}
 },
 */
	submitDebugLog: function submitDebugLog() {
		Zotero.net.ajax({
			url: Zotero.config.debugLogEndpoint,
			data: { 'debug_string': Zotero.debugstring }
		}).then(function (xhr) {
			var data = JSON.parse(xhr.responseText);
			if (data.logID) {
				alert('ZoteroWWW debug logID:' + data.logID);
			} else if (data.error) {
				alert('Error submitting ZoteroWWW debug log:' + data.error);
			}
		});
	},

	catchPromiseError: function catchPromiseError(err) {
		log.error(err);
	},

	libraries: {},

	validator: {
		patterns: {
			//'itemKey': /^([A-Z0-9]{8,},?)+$/,
			'itemKey': /^.+$/,
			'collectionKey': /^([A-Z0-9]{8,})|trash$/,
			//'tag': /^[^#]*$/,
			'libraryID': /^[0-9]+$/,
			'libraryType': /^(user|group|)$/,
			'target': /^(items?|collections?|tags|children|deleted|userGroups|key|settings|publications)$/,
			'targetModifier': /^(top|file|file\/view)$/,

			//get params
			'sort': /^(asc|desc)$/,
			'start': /^[0-9]*$/,
			'limit': /^[0-9]*$/,
			'order': /^\S*$/,
			'content': /^((html|json|data|bib|none|bibtex|bookmarks|coins|csljson|mods|refer|rdf_bibliontology|rdf_dc|ris|tei|wikipedia),?)+$/,
			'include': /^((html|json|data|bib|none|bibtex|bookmarks|coins|csljson|mods|refer|rdf_bibliontology|rdf_dc|ris|tei|wikipedia),?)+$/,
			'q': /^.*$/,
			'fq': /^\S*$/,
			'itemType': /^\S*$/,
			'locale': /^\S*$/,
			'tag': /^.*$/,
			'tagType': /^(0|1)$/,
			'key': /^\S*/,
			'format': /^(json|atom|bib|keys|versions|bibtex|bookmarks|mods|refer|rdf_bibliontology|rdf_dc|rdf_zotero|ris|wikipedia)$/,
			'style': /^\S*$/,
			'linkwrap': /^(0|1)*$/
		},

		validate: function validate(arg, type) {
			log.debug('Zotero.validate', 4);
			if (arg === '') {
				return null;
			} else if (arg === null) {
				return true;
			}
			log.debug(arg + ' ' + type, 4);
			var patterns = this.patterns;

			if (patterns.hasOwnProperty(type)) {
				return patterns[type].test(arg);
			} else {
				return null;
			}
		}
	},

	_logEnabled: 0,
	enableLogging: function enableLogging() {
		Zotero._logEnabled++;
		if (Zotero._logEnabled > 0) {
			//TODO: enable debug_log?
		}
	},

	disableLogging: function disableLogging() {
		Zotero._logEnabled--;
		if (Zotero._logEnabled <= 0) {
			Zotero._logEnabled = 0;
			//TODO: disable debug_log?
		}
	},

	init: function init() {
		var store;
		if (Zotero.config.cacheStoreType == 'localStorage' && typeof localStorage != 'undefined') {
			store = localStorage;
		} else if (Zotero.config.cacheStoreType == 'sessionStorage' && typeof sessionStorage != 'undefined') {
			store = sessionStorage;
		} else {
			store = {};
		}
		Zotero.store = store;

		Zotero.cache = new Zotero.Cache(store);

		//initialize global preferences object
		Zotero.preferences = new Zotero.Preferences(Zotero.store, 'global');

		//get localized item constants if not stored in localstorage
		var locale = 'en-US';
		if (Zotero.config.locale) {
			locale = Zotero.config.locale;
		}
		locale = 'en-US';
	}
};

Zotero.ajaxRequest = function (url, type, options) {
	log.debug('Zotero.ajaxRequest ==== ' + url, 3);
	if (!type) {
		type = 'GET';
	}
	if (!options) {
		options = {};
	}
	var requestObject = {
		url: url,
		type: type
	};
	requestObject = Z.extend({}, requestObject, options);
	log.debug(requestObject, 3);
	return Zotero.net.queueRequest(requestObject);
};

//non-DOM (jquery) event management
Zotero.eventmanager = {
	callbacks: {}
};

Zotero.trigger = function (eventType) {
	var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
	var filter = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

	if (filter) {
		log.debug('filter is not false', 3);
		eventType += '_' + filter;
	}
	log.debug('Triggering eventful ' + eventType, 3);

	data.zeventful = true;
	// if(data.triggeringElement === null || data.triggeringElement === undefined){
	// 	data.triggeringElement = J('#eventful');
	// }

	try {
		if (Zotero.eventmanager.callbacks.hasOwnProperty(eventType)) {
			var callbacks = Zotero.eventmanager.callbacks[eventType];
			callbacks.forEach(function (callback) {
				var cdata = Z.extend({}, data, callback.data);
				var e = {
					data: cdata
				};
				callback.f(e);
			});
		}
	} catch (e) {
		log.error('failed triggering:' + eventType);
		log.error(e);
	}
};

Zotero.listen = function (events, handler, data, filter) {
	log.debug('Zotero.listen: ' + events, 3);
	//append filter to event strings if it's specified
	var eventsArray = events.split(' ');
	if (eventsArray.length > 0 && filter) {
		for (var i = 0; i < eventsArray.length; i++) {
			eventsArray[i] += '_' + filter;
		}
	}
	eventsArray.forEach(function (ev) {
		if (Zotero.eventmanager.callbacks.hasOwnProperty(ev)) {
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

Zotero.extend = function () {
	var res = {};
	for (var i = 0; i < arguments.length; i++) {
		var a = arguments[i];
		if ((typeof a === 'undefined' ? 'undefined' : _typeof(a)) != 'object') {
			continue;
		}
		Object.keys(a).forEach(function (key) {
			res[key] = a[key];
		});
	}
	return res;
};

Zotero.deepExtend = function (out) {
	out = out || {};

	for (var i = 1; i < arguments.length; i++) {
		var obj = arguments[i];

		if (!obj) continue;

		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				if (_typeof(obj[key]) === 'object') out[key] = Zotero.deepExtend(out[key], obj[key]);else out[key] = obj[key];
			}
		}
	}

	return out;
};

module.exports = Zotero;

},{"./Log.js":115}],101:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Cache');

//build a consistent string from an object to use as a cache key
//put object key/value pairs into array, sort array, and concatenate
//array with '/'
module.exports = function (store) {
	this.store = store;
	var registry = this.store._registry;
	if (registry === null || typeof registry == 'undefined') {
		registry = {};
		this.store._registry = JSON.stringify(registry);
	}
};

module.exports.prototype.objectCacheString = function (params) {
	var paramVarsArray = [];
	Object.keys(params).forEach(function (index) {
		var value = params[index];
		if (!value) {
			return;
		} else if (Array.isArray(value)) {
			value.forEach(function (v) {
				paramVarsArray.push(index + '/' + encodeURIComponent(v));
			});
		} else {
			paramVarsArray.push(index + '/' + encodeURIComponent(value));
		}
	});
	paramVarsArray.sort();
	log.debug(paramVarsArray, 4);
	var objectCacheString = paramVarsArray.join('/');
	return objectCacheString;
};

//should use setItem and getItem if I extend that to the case where no Storage object is available in the browser
module.exports.prototype.save = function (params, object, cachetags) {
	//cachetags for expiring entries
	if (!Array.isArray(cachetags)) {
		cachetags = [];
	}
	//get registry object from storage
	var registry = JSON.parse(this.store._registry);
	if (!registry) {
		registry = {};
	}
	var objectCacheString = this.objectCacheString(params);
	//save object in storage
	this.store[objectCacheString] = JSON.stringify(object);
	//make registry entry for object
	var registryEntry = { 'id': objectCacheString, saved: Date.now(), cachetags: cachetags };
	registry[objectCacheString] = registryEntry;
	//save registry back to storage
	this.store._registry = JSON.stringify(registry);
};

module.exports.prototype.load = function (params) {
	log.debug('Zotero.Cache.load', 3);
	var objectCacheString = this.objectCacheString(params);
	log.debug(objectCacheString, 4);
	try {
		var s = this.store[objectCacheString];
		if (!s) {
			log.warn('No value found in cache store - ' + objectCacheString, 3);
			return null;
		} else {
			return JSON.parse(s);
		}
	} catch (e) {
		log.error('Error parsing retrieved cache data: ' + objectCacheString + ' : ' + s);
		return null;
	}
};

module.exports.prototype.expireCacheTag = function (tag) {
	log.debug('Zotero.Cache.expireCacheTag', 3);
	var registry = JSON.parse(this.store._registry);
	var store = this.store;
	Object.keys(registry).forEach(function (index) {
		var value = registry[index];
		if (value.cachetags.indexOf(tag) != -1) {
			log.debug('tag ' + tag + ' found for item ' + value['id'] + ' : expiring', 4);
			delete store[value['id']];
			delete registry[value['id']];
		}
	});
};

module.exports.prototype.clear = function () {
	if (typeof this.store.clear == 'function') {
		this.store.clear();
	} else {
		this.store = {};
	}
};

},{"./Log.js":115}],102:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Collection');

module.exports = function (collectionObj) {
	this.instance = 'Zotero.Collection';
	this.libraryUrlIdentifier = '';
	this.itemKeys = false;
	this.key = '';
	this.version = 0;
	this.synced = false;
	this.pristineData = null;
	this.apiObj = {
		'key': '',
		'version': 0,
		'library': {},
		'links': {},
		'meta': {},
		'data': {
			'key': '',
			'version': 0,
			'name': '',
			'parentCollection': false,
			'relations': {}
		}
	};
	this.children = [];
	this.topLevel = true;
	if (collectionObj) {
		this.parseJsonCollection(collectionObj);
	}
};

module.exports.prototype = new Zotero.ApiObject();
module.exports.prototype.instance = 'Zotero.Collection';

module.exports.prototype.updateObjectKey = function (collectionKey) {
	this.updateCollectionKey(collectionKey);
};

module.exports.prototype.updateCollectionKey = function (collectionKey) {
	var collection = this;
	collection.key = collectionKey;
	collection.apiObj.key = collectionKey;
	collection.apiObj.data.key = collectionKey;
	return collection;
};

module.exports.prototype.parseJsonCollection = function (apiObj) {
	log.debug('parseJsonCollection', 4);
	var collection = this;
	collection.key = apiObj.key;
	collection.version = apiObj.version;
	collection.apiObj = Z.extend({}, apiObj);
	collection.pristineData = Z.extend({}, apiObj.data);

	collection.parentCollection = false;
	collection.topLevel = true;
	collection.synced = true;
	collection.initSecondaryData();
};

module.exports.prototype.initSecondaryData = function () {
	var collection = this;

	if (collection.apiObj.data['parentCollection']) {
		collection.topLevel = false;
	} else {
		collection.topLevel = true;
	}

	if (Zotero.config.librarySettings.libraryPathString) {
		collection.websiteCollectionLink = Zotero.config.librarySettings.libraryPathString + '/collectionKey/' + collection.apiObj.key;
	} else {
		collection.websiteCollectionLink = '';
	}
	collection.hasChildren = collection.apiObj.meta.numCollections ? true : false;
};

module.exports.prototype.nestCollection = function (collectionsObject) {
	log.debug('Zotero.Collection.nestCollection', 4);
	var collection = this;
	var parentCollectionKey = collection.get('parentCollection');
	if (parentCollectionKey !== false) {
		if (collectionsObject.hasOwnProperty(parentCollectionKey)) {
			var parentOb = collectionsObject[parentCollectionKey];
			parentOb.children.push(collection);
			parentOb.hasChildren = true;
			collection.topLevel = false;
			return true;
		}
	}
	return false;
};

module.exports.prototype.addItems = function (itemKeys) {
	log.debug('Zotero.Collection.addItems', 3);
	var collection = this;
	var config = {
		'target': 'items',
		'libraryType': collection.apiObj.library.type,
		'libraryID': collection.apiObj.library.id,
		'collectionKey': collection.key
	};
	var requestData = itemKeys.join(' ');

	return Zotero.ajaxRequest(config, 'POST', {
		data: requestData
	});
};

module.exports.prototype.getMemberItemKeys = function () {
	log.debug('Zotero.Collection.getMemberItemKeys', 3);
	var collection = this;
	var config = {
		'target': 'items',
		'libraryType': collection.apiObj.library.type,
		'libraryID': collection.apiObj.library.id,
		'collectionKey': collection.key,
		'format': 'keys'
	};

	return Zotero.ajaxRequest(config, 'GET', { processData: false }).then(function (response) {
		log.debug('getMemberItemKeys proxied callback', 3);
		var result = response.data;
		var keys = result.trim().split(/[\s]+/);
		collection.itemKeys = keys;
		return keys;
	});
};

module.exports.prototype.removeItem = function (itemKey) {
	var collection = this;
	var config = {
		'target': 'item',
		'libraryType': collection.apiObj.library.type,
		'libraryID': collection.apiObj.library.id,
		'collectionKey': collection.key,
		'itemKey': itemKey
	};
	return Zotero.ajaxRequest(config, 'DELETE', {
		processData: false,
		cache: false
	});
};

module.exports.prototype.update = function (name, parentKey) {
	var collection = this;
	if (!parentKey) parentKey = false;
	var config = {
		'target': 'collection',
		'libraryType': collection.apiObj.library.type,
		'libraryID': collection.apiObj.library.id,
		'collectionKey': collection.key
	};

	collection.set('name', name);
	collection.set('parentCollection', parentKey);

	var writeObject = collection.writeApiObj();
	var requestData = JSON.stringify(writeObject);

	return Zotero.ajaxRequest(config, 'PUT', {
		data: requestData,
		processData: false,
		headers: {
			'If-Unmodified-Since-Version': collection.version
		},
		cache: false
	});
};

module.exports.prototype.writeApiObj = function () {
	var collection = this;
	var writeObj = Z.extend({}, collection.pristineData, collection.apiObj.data);
	return writeObj;
};

module.exports.prototype.remove = function () {
	log.debug('Zotero.Collection.delete', 3);
	var collection = this;
	var owningLibrary = collection.owningLibrary;
	var config = {
		'target': 'collection',
		'libraryType': collection.apiObj.library.type,
		'libraryID': collection.apiObj.library.id,
		'collectionKey': collection.key
	};

	return Zotero.ajaxRequest(config, 'DELETE', {
		processData: false,
		headers: {
			'If-Unmodified-Since-Version': collection.version
		},
		cache: false
	}).then(function () {
		log.debug('done deleting collection. remove local copy.', 3);
		owningLibrary.collections.removeLocalCollection(collection.key);
		owningLibrary.trigger('libraryCollectionsUpdated');
	});
};

module.exports.prototype.get = function (key) {
	var collection = this;
	switch (key) {
		case 'title':
		case 'name':
			return collection.apiObj.data.name;
		case 'collectionKey':
		case 'key':
			return collection.apiObj.key || collection.key;
		case 'collectionVersion':
		case 'version':
			return collection.apiObj.version;
		case 'parentCollection':
			return collection.apiObj.data.parentCollection;
	}

	if (key in collection.apiObj.data) {
		return collection.apiObj.data[key];
	} else if (collection.apiObj.meta.hasOwnProperty(key)) {
		return collection.apiObj.meta[key];
	} else if (collection.hasOwnProperty(key)) {
		return collection[key];
	}

	return null;
};
/*
 module.exports.prototype.get = function(key){
	var collection = this;
	switch(key) {
		case 'title':
		case 'name':
			return collection.apiObj.data['name'];
		case 'collectionKey':
		case 'key':
			return collection.apiObj.key;
		case 'parentCollection':
			return collection.apiObj.data['parentCollection'];
		case 'collectionVersion':
		case 'version':
			return collection.apiObj.version;
	}
	
	if(key in collection.apiObj.data){
		return collection.apiObj.data[key];
	}
	else if(key in collection.apiObj.meta){
		return collection.apiObj.meta[key];
	}
	else if(collection.hasOwnProperty(key)){
		return collection[key];
	}
	
	return null;
};
*/

module.exports.prototype.set = function (key, val) {
	var collection = this;
	if (key in collection.apiObj.data) {
		collection.apiObj.data[key] = val;
	}
	switch (key) {
		case 'title':
		case 'name':
			collection.apiObj.data['name'] = val;
			break;
		case 'collectionKey':
		case 'key':
			collection.key = val;
			collection.apiObj.key = val;
			collection.apiObj.data.key = val;
			break;
		case 'parentCollection':
			collection.apiObj.data['parentCollection'] = val;
			break;
		case 'collectionVersion':
		case 'version':
			collection.version = val;
			collection.apiObj.version = val;
			collection.apiObj.data.version = val;
			break;
	}

	if (collection.hasOwnProperty(key)) {
		collection[key] = val;
	}
};

},{"./Log.js":115}],103:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Collections');

module.exports = function (jsonBody) {
	var collections = this;
	this.instance = 'Zotero.Collections';
	this.version = 0;
	this.syncState = {
		earliestVersion: null,
		latestVersion: null
	};
	this.collectionObjects = {};
	this.collectionsArray = [];
	this.objectMap = this.collectionObjects;
	this.objectArray = this.collectionsArray;
	this.dirty = false;
	this.loaded = false;

	if (jsonBody) {
		this.addCollectionsFromJson(jsonBody);
		this.initSecondaryData();
	}
};

module.exports.prototype = new Zotero.Container();
//build up secondary data necessary to rendering and easy operations but that
//depend on all collections already being present
module.exports.prototype.initSecondaryData = function () {
	log.debug('Zotero.Collections.initSecondaryData', 3);
	var collections = this;

	//rebuild collectionsArray
	collections.collectionsArray = [];
	Object.keys(collections.collectionObjects).forEach(function (key) {
		var collection = collections.collectionObjects[key];
		collections.collectionsArray.push(collection);
	});

	collections.collectionsArray.sort(Zotero.ApiObject.prototype.fieldComparer('name'));
	collections.nestCollections();
	collections.assignDepths(0, collections.collectionsArray);
};

//take Collection XML and insert a Collection object
module.exports.prototype.addCollection = function (collection) {
	this.addObject(collection);
	return this;
};

module.exports.prototype.addCollectionsFromJson = function (jsonBody) {
	log.debug('addCollectionsFromJson');
	log.debug(jsonBody);
	var collections = this;
	var collectionsAdded = [];
	jsonBody.forEach(function (collectionObj) {
		var collection = new Zotero.Collection(collectionObj);
		collections.addObject(collection);
		collectionsAdded.push(collection);
	});
	return collectionsAdded;
};

module.exports.prototype.assignDepths = function (depth, cArray) {
	log.debug('Zotero.Collections.assignDepths', 3);
	var collections = this;
	var insertchildren = function insertchildren(depth, children) {
		children.forEach(function (col) {
			col.nestingDepth = depth;
			if (col.hasChildren) {
				insertchildren(depth + 1, col.children);
			}
		});
	};
	collections.collectionsArray.forEach(function (collection) {
		if (collection.topLevel) {
			collection.nestingDepth = 1;
			if (collection.hasChildren) {
				insertchildren(2, collection.children);
			}
		}
	});
};

module.exports.prototype.nestedOrderingArray = function () {
	log.debug('Zotero.Collections.nestedOrderingArray', 3);
	var collections = this;
	var nested = [];
	var insertchildren = function insertchildren(a, children) {
		children.forEach(function (col) {
			a.push(col);
			if (col.hasChildren) {
				insertchildren(a, col.children);
			}
		});
	};
	collections.collectionsArray.forEach(function (collection) {
		if (collection.topLevel) {
			nested.push(collection);
			if (collection.hasChildren) {
				insertchildren(nested, collection.children);
			}
		}
	});
	log.debug('Done with nestedOrderingArray', 3);
	return nested;
};

module.exports.prototype.getCollection = function (key) {
	return this.getObject(key);
};

module.exports.prototype.remoteDeleteCollection = function (collectionKey) {
	var collections = this;
	return collections.removeLocalCollection(collectionKey);
};

module.exports.prototype.removeLocalCollection = function (collectionKey) {
	var collections = this;
	return collections.removeLocalCollections([collectionKey]);
};

module.exports.prototype.removeLocalCollections = function (collectionKeys) {
	var collections = this;
	//delete Collection from collectionObjects
	for (var i = 0; i < collectionKeys.length; i++) {
		delete collections.collectionObjects[collectionKeys[i]];
	}

	//rebuild collectionsArray
	collections.initSecondaryData();
};

//reprocess all collections to add references to children inside their parents
module.exports.prototype.nestCollections = function () {
	var collections = this;
	//clear out all child references so we don't duplicate
	collections.collectionsArray.forEach(function (collection) {
		collection.children = [];
	});

	collections.collectionsArray.sort(Zotero.ApiObject.prototype.fieldComparer('name'));
	collections.collectionsArray.forEach(function (collection) {
		collection.nestCollection(collections.collectionObjects);
	});
};

module.exports.prototype.writeCollections = function (collectionsArray) {
	log.debug('Zotero.Collections.writeCollections', 3);
	var collections = this;
	var library = collections.owningLibrary;
	var i;

	var config = {
		'target': 'collections',
		'libraryType': collections.owningLibrary.libraryType,
		'libraryID': collections.owningLibrary.libraryID
	};
	var requestUrl = Zotero.ajax.apiRequestString(config);

	//add collectionKeys to collections if they don't exist yet
	for (i = 0; i < collectionsArray.length; i++) {
		var collection = collectionsArray[i];
		//generate a collectionKey if the collection does not already have one
		var collectionKey = collection.get('key');
		if (collectionKey === '' || collectionKey === null) {
			var newCollectionKey = Zotero.utils.getKey();
			collection.set('key', newCollectionKey);
			collection.set('version', 0);
		}
	}

	var writeChunks = collections.chunkObjectsArray(collectionsArray);
	var rawChunkObjects = collections.rawChunks(writeChunks);
	//update collections with server response if successful
	var writeCollectionsSuccessCallback = function writeCollectionsSuccessCallback(response) {
		log.debug('writeCollections successCallback', 3);
		var library = this.library;
		var writeChunk = this.writeChunk;
		library.collections.updateObjectsFromWriteResponse(this.writeChunk, response);
		//save updated collections to collections
		for (var i = 0; i < writeChunk.length; i++) {
			var collection = writeChunk[i];
			if (collection.synced && !collection.writeFailure) {
				library.collections.addCollection(collection);
				//save updated collections to IDB
				if (Zotero.config.useIndexedDB) {
					log.debug('updating indexedDB collections');
					library.idbLibrary.updateCollections(writeChunk);
				}
			}
		}
		response.returnCollections = writeChunk;
		return response;
	};

	log.debug('collections.version: ' + collections.version, 3);
	log.debug('collections.libraryVersion: ' + collections.libraryVersion, 3);

	var requestObjects = [];
	for (i = 0; i < writeChunks.length; i++) {
		var successContext = {
			writeChunk: writeChunks[i],
			library: library
		};

		var requestData = JSON.stringify(rawChunkObjects[i]);
		requestObjects.push({
			url: requestUrl,
			type: 'POST',
			data: requestData,
			processData: false,
			headers: {
				//'If-Unmodified-Since-Version': collections.version,
				//'Content-Type': 'application/json'
			},
			success: writeCollectionsSuccessCallback.bind(successContext)
		});
	}

	return library.sequentialRequests(requestObjects).then(function (responses) {
		log.debug('Done with writeCollections sequentialRequests promise', 3);
		collections.initSecondaryData();

		responses.forEach(function (response) {
			if (response.isError || response.data.hasOwnProperty('failed') && Object.keys(response.data.failed).length > 0) {
				throw new Error('failure when writing collections');
			}
		});
		return responses;
	}).catch(function (err) {
		log.error(err);
		//rethrow so widget doesn't report success
		throw err;
	});
};

},{"./Log.js":115}],104:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Container');

module.exports = function () {};

module.exports.prototype.initSecondaryData = function () {};

module.exports.prototype.addObject = function (object) {
	log.debug('Zotero.Container.addObject', 4);
	var container = this;
	container.objectArray.push(object);
	container.objectMap[object.key] = object;
	if (container.owningLibrary) {
		object.associateWithLibrary(container.owningLibrary);
	}

	return container;
};

module.exports.prototype.fieldComparer = function (field) {
	if (Intl) {
		var collator = new Intl.Collator();
		return function (a, b) {
			return collator.compare(a.apiObj.data[field], b.apiObj.data[field]);
		};
	} else {
		return function (a, b) {
			if (a.apiObj.data[field].toLowerCase() == b.apiObj.data[field].toLowerCase()) {
				return 0;
			}
			if (a.apiObj.data[field].toLowerCase() < b.apiObj.data[field].toLowerCase()) {
				return -1;
			}
			return 1;
		};
	}
};

module.exports.prototype.getObject = function (key) {
	var container = this;
	if (container.objectMap.hasOwnProperty(key)) {
		return container.objectMap[key];
	} else {
		return false;
	}
};

module.exports.prototype.getObjects = function (keys) {
	var container = this;
	var objects = [];
	var object;
	for (var i = 0; i < keys.length; i++) {
		object = container.getObject(keys[i]);
		if (object) {
			objects.push(object);
		}
	}
	return objects;
};

module.exports.prototype.removeObject = function (key) {
	var container = this;
	if (container.objectMap.hasOwnProperty(key)) {
		delete container.objectmap[key];
		container.initSecondaryData();
	}
};

module.exports.prototype.removeObjects = function (keys) {
	var container = this;
	//delete Objects from objectMap;
	for (var i = 0; i < keys.length; i++) {
		delete container.objectMap[keys[i]];
	}

	//rebuild array
	container.initSecondaryData();
};

module.exports.prototype.writeObjects = function (objects) {
	//TODO:implement
};

//generate keys for objects about to be written if they are new
module.exports.prototype.assignKeys = function (objectsArray) {
	var object;
	for (var i = 0; i < objectsArray.length; i++) {
		object = objectsArray[i];
		var key = object.get('key');
		if (!key) {
			var newObjectKey = Zotero.utils.getKey();
			object.set('key', newObjectKey);
			object.set('version', 0);
		}
	}
	return objectsArray;
};

//split an array of objects into chunks to write over multiple api requests
module.exports.prototype.chunkObjectsArray = function (objectsArray) {
	var chunkSize = 50;
	var writeChunks = [];

	for (var i = 0; i < objectsArray.length; i = i + chunkSize) {
		writeChunks.push(objectsArray.slice(i, i + chunkSize));
	}

	return writeChunks;
};

module.exports.prototype.rawChunks = function (chunks) {
	var rawChunkObjects = [];

	for (var i = 0; i < chunks.length; i++) {
		rawChunkObjects[i] = [];
		for (var j = 0; j < chunks[i].length; j++) {
			rawChunkObjects[i].push(chunks[i][j].writeApiObj());
		}
	}
	return rawChunkObjects;
};

/**
 * Update syncState property on container to keep track of updates that occur during sync process.
 * Set earliestVersion to MIN(earliestVersion, version).
 * Set latestVersion to MAX(latestVersion, version).
 * This should be called with the modifiedVersion header for each response tied to this container
 * during a sync process.
 * @param  {int} version
 * @return {null}
 */
module.exports.prototype.updateSyncState = function (version) {
	var container = this;
	log.debug('updateSyncState: ' + version, 3);
	if (!container.hasOwnProperty('syncState')) {
		log.debug('no syncState property');
		throw new Error('Attempt to update sync state of object with no syncState property');
	}
	if (container.syncState.earliestVersion === null) {
		container.syncState.earliestVersion = version;
	}
	if (container.syncState.latestVersion === null) {
		container.syncState.latestVersion = version;
	}
	if (version < container.syncState.earliestVersion) {
		container.syncState.earliestVersion = version;
	}
	if (version > container.syncState.latestVersion) {
		container.syncState.latestVersion = version;
	}
	log.debug('done updating sync state', 3);
};

module.exports.prototype.updateSyncedVersion = function (versionField) {
	var container = this;
	if (container.syncState.earliestVersion !== null && container.syncState.earliestVersion == container.syncState.latestVersion) {
		container.version = container.syncState.latestVersion;
		container.synced = true;
	} else if (container.syncState.earliestVersion !== null) {
		container.version = container.syncState.earliestVersion;
	}
};

module.exports.prototype.processDeletions = function (deletedKeys) {
	var container = this;
	for (var i = 0; i < deletedKeys.length; i++) {
		var localObject = container.get(deletedKeys[i]);
		if (localObject !== false) {
			//still have object locally
			if (localObject.synced === true) {
				//our object is not modified, so delete it as the server thinks we should
				container.removeObjects([deletedKeys[i]]);
			} else {
				//TODO: conflict resolution
			}
		}
	}
};

//update items appropriately based on response to multi-write request
//for success:
//  update objectKey if item doesn't have one yet (newly created item)
//  update itemVersion to response's Last-Modified-Version header
//  mark as synced
//for unchanged:
//  don't need to do anything? itemVersion should remain the same?
//  mark as synced if not already?
//for failed:
//  add the failure to the object under writeFailure
//  don't mark as synced
//  calling code should check for writeFailure after the written objects
//  are returned
module.exports.prototype.updateObjectsFromWriteResponse = function (objectsArray, response) {
	log.debug('Zotero.Container.updateObjectsFromWriteResponse', 3);
	log.debug('statusCode: ' + response.status, 3);
	var data = response.data;
	if (response.status == 200) {
		log.debug('newLastModifiedVersion: ' + response.lastModifiedVersion, 3);
		//make sure writes were actually successful and
		//update the itemKey for the parent
		if (data.hasOwnProperty('success')) {
			//update each successfully written item, possibly with new itemKeys
			Object.keys(data.success).forEach(function (ind) {
				var i = parseInt(ind, 10);
				var key = data.success[ind];
				var object = objectsArray[i];
				//throw error if objectKey mismatch
				if (object.key !== '' && object.key !== key) {
					throw new Error('object key mismatch in multi-write response');
				}
				if (object.key === '') {
					object.updateObjectKey(key);
				}
				object.set('version', response.lastModifiedVersion);
				object.synced = true;
				object.writeFailure = false;
			});
		}
		if (data.hasOwnProperty('failed')) {
			log.debug('updating objects with failed writes', 3);
			Object.keys(data.failed).forEach(function (ind) {
				var failure = data.failed[ind];
				log.error('failed write ' + ind + ' - ' + failure);
				var i = parseInt(ind, 10);
				var object = objectsArray[i];
				object.writeFailure = failure;
			});
		}
	} else if (response.status == 204) {
		//single item put response, this probably should never go to this function
		objectsArray[0].synced = true;
	}
};

//return the key as a string when passed an argument that
//could be either a string key or an object with a key property
module.exports.prototype.extractKey = function (object) {
	if (typeof object == 'string') {
		return object;
	}
	return object.get('key');
};

},{"./Log.js":115}],105:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Deleted');

module.exports = function (data) {
	this.instance = 'Zotero.Deleted';
	if (typeof data === 'string') {
		this.deletedData = JSON.parse(data);
	} else {
		this.deletedData = data;
	}
	this.untilVersion = null;
	this.sinceVersion = null;
	this.waitingPromises = [];
	this.pending = false;
};

//create, save referece, and return a Promise that will be resolved
//the next time we finish a deleted request
module.exports.prototype.addWaiter = function () {};

},{"./Log.js":115}],106:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:File');

var SparkMD5 = require('spark-md5');

module.exports = {};

module.exports.getFileInfo = function (file) {
	//fileInfo: md5, filename, filesize, mtime, zip, contentType, charset
	if (typeof FileReader === 'undefined') {
		return Promise.reject(new Error('FileReader not supported'));
	}

	return new Promise(function (resolve, reject) {
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
			//fileInfo.reader = reader;
			fileInfo.filedata = result;
			resolve(fileInfo);
		};

		reader.readAsArrayBuffer(file);
	});
};

module.exports.uploadFile = function (uploadInfo, fileInfo) {
	log.debug('Zotero.file.uploadFile', 3);
	log.debug(uploadInfo, 4);

	var formData = new FormData();
	Object.keys(uploadInfo.params).forEach(function (key) {
		var val = uploadInfo.params[key];
		formData.append(key, val);
	});

	var blobData = new Blob([fileInfo.filedata], { type: fileInfo.contentType });
	formData.append('file', blobData);

	var xhr = new XMLHttpRequest();

	xhr.open('POST', uploadInfo.url, true);

	return new Promise(function (resolve, reject) {
		xhr.onload = function (evt) {
			log.debug('uploadFile onload event', 3);
			if (this.status == 201) {
				log.debug('successful upload - 201', 3);
				resolve();
			} else {
				log.error('uploadFile failed - ' + xhr.status);
				reject({
					'message': 'Failure uploading file.',
					'code': xhr.status,
					'serverMessage': xhr.responseText
				});
			}
		};

		xhr.onprogress = function (evt) {
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

},{"./Log.js":115,"spark-md5":93}],107:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Group');

module.exports = function (groupObj) {
	var group = this;
	group.instance = 'Zotero.Group';
	if (groupObj) {
		this.parseJsonGroup(groupObj);
	}
};

module.exports.prototype = new Zotero.ApiObject();

module.exports.prototype.parseJsonGroup = function (groupObj) {
	var group = this;
	group.apiObj = groupObj;
};

module.exports.prototype.get = function (key) {
	var group = this;
	switch (key) {
		case 'title':
		case 'name':
			return group.apiObj.data.name;
	}

	if (key in group.apiObj) {
		return group.apiObj[key];
	}
	if (key in group.apiObj.data) {
		return group.apiObj.data[key];
	}
	if (key in group.apiObj.meta) {
		return group.apiObj.meta[key];
	}
	if (group.hasOwnProperty(key)) {
		return group[key];
	}

	return null;
};

module.exports.prototype.isWritable = function (userID) {
	var group = this;
	switch (true) {
		case group.get('owner') == userID:
			return true;
		case group.apiObj.data.admins && group.apiObj.data.admins.indexOf(userID) != -1:
			return true;
		case group.apiObj.data.libraryEditing == 'members' && group.apiObj.data.members && group.apiObj.data.members.indexOf(userID) != -1:
			return true;
		default:
			return false;
	}
};

module.exports.prototype.typeMap = {
	'Private': 'Private',
	'PublicOpen': 'Public, Open Membership',
	'PublicClosed': 'Public, Closed Membership'
};

module.exports.prototype.accessMap = {
	'all': {
		'members': 'Anyone can view, only members can edit',
		'admins': 'Anyone can view, only admins can edit'
	},
	'members': {
		'members': 'Only members can view and edit',
		'admins': 'Only members can view, only admins can edit'
	},
	'admins': {
		'members': 'Only admins can view, only members can edit',
		'admins': 'Only admins can view and edit'
	}
};

},{"./Log.js":115}],108:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Groups');

module.exports = function () {
	this.instance = 'Zotero.Groups';
	this.groupsArray = [];
};
/*
 module.exports.prototype.fetchGroup = function(groupID, apikey){
	//TODO: implement
};
*/
module.exports.prototype.addGroupsFromJson = function (jsonBody) {
	var groups = this;
	var groupsAdded = [];
	jsonBody.forEach(function (groupObj) {
		log.debug(groupObj, 3);
		var group = new Zotero.Group(groupObj);
		groups.groupsArray.push(group);
		groupsAdded.push(group);
	});
	return groupsAdded;
};

module.exports.prototype.fetchUserGroups = function (userID, apikey) {
	var groups = this;
	var aparams = {
		'target': 'userGroups',
		'libraryType': 'user',
		'libraryID': userID,
		'order': 'title'
	};

	if (apikey) {
		aparams['key'] = apikey;
	} else if (groups.owningLibrary) {
		aparams['key'] = groups.owningLibrary._apiKey;
	}

	return Zotero.ajaxRequest(aparams).then(function (response) {
		log.debug('fetchUserGroups proxied callback', 3);
		var fetchedGroups = groups.addGroupsFromJson(response.data);
		response.fetchedGroups = fetchedGroups;
		return response;
	});
};

},{"./Log.js":115}],109:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Idb');

module.exports = {};

//Initialize an indexedDB for the specified library user or group + id
//returns a promise that is resolved with a Zotero.Idb.Library instance when successful
//and rejected onerror
module.exports.Library = function (libraryString) {
	log.debug('Zotero.Idb.Library', 3);
	log.debug('Initializing Zotero IDB', 3);
	this.libraryString = libraryString;
	this.owningLibrary = null;
	this.initialized = false;
};

module.exports.Library.prototype.init = function () {
	var idbLibrary = this;
	return new Promise(function (resolve, reject) {
		//Don't bother with the prefixed names because they should all be irrelevant by now
		var indexedDB = window.indexedDB;
		idbLibrary.indexedDB = indexedDB;

		// Now we can open our database
		log.debug('requesting indexedDb from browser', 3);
		var request = indexedDB.open('Zotero_' + idbLibrary.libraryString, 4);
		request.onerror = function (e) {
			log.error('ERROR OPENING INDEXED DB');
			reject();
		};

		var upgradeCallback = function upgradeCallback(event) {
			log.debug('Zotero.Idb onupgradeneeded or onsuccess', 3);
			var oldVersion = event.oldVersion;
			log.debug('oldVersion: ' + event.oldVersion, 3);
			var db = event.target.result;
			idbLibrary.db = db;

			if (oldVersion < 4) {
				//delete old versions of object stores
				log.debug('Existing object store names:', 3);
				log.debug(JSON.stringify(db.objectStoreNames), 3);
				log.debug('Deleting old object stores', 3);
				if (db.objectStoreNames['items']) {
					db.deleteObjectStore('items');
				}
				if (db.objectStoreNames['tags']) {
					db.deleteObjectStore('tags');
				}
				if (db.objectStoreNames['collections']) {
					db.deleteObjectStore('collections');
				}
				if (db.objectStoreNames['files']) {
					db.deleteObjectStore('files');
				}
				if (db.objectStoreNames['versions']) {
					db.deleteObjectStore('versions');
				}
				log.debug('Existing object store names:', 3);
				log.debug(JSON.stringify(db.objectStoreNames), 3);

				// Create object stores to hold items, collections, and tags.
				// IDB keys are just the zotero object keys
				var itemStore = db.createObjectStore('items', { keyPath: 'key' });
				var collectionStore = db.createObjectStore('collections', { keyPath: 'key' });
				var tagStore = db.createObjectStore('tags', { keyPath: 'tag' });
				var fileStore = db.createObjectStore('files');
				var versionStore = db.createObjectStore('versions');

				log.debug('itemStore index names:', 3);
				log.debug(JSON.stringify(itemStore.indexNames), 3);
				log.debug('collectionStore index names:', 3);
				log.debug(JSON.stringify(collectionStore.indexNames), 3);
				log.debug('tagStore index names:', 3);
				log.debug(JSON.stringify(tagStore.indexNames), 3);

				// Create index to search/sort items by each attribute
				Object.keys(Zotero.Item.prototype.fieldMap).forEach(function (key) {
					log.debug('Creating index on ' + key, 3);
					itemStore.createIndex(key, 'data.' + key, { unique: false });
				});

				//itemKey index was created above with all other item fields
				//itemStore.createIndex("itemKey", "itemKey", { unique: false });

				//create multiEntry indices on item collectionKeys and tags
				itemStore.createIndex('collectionKeys', 'data.collections', { unique: false, multiEntry: true });
				//index on extra tagstrings array since tags are objects and we can't index them directly
				itemStore.createIndex('itemTagStrings', '_supplement.tagstrings', { unique: false, multiEntry: true });
				//example filter for tag: Zotero.Idb.filterItems("itemTagStrings", "Unread");
				//example filter collection: Zotero.Idb.filterItems("collectionKeys", "<collectionKey>");

				//itemStore.createIndex("itemType", "itemType", { unique: false });
				itemStore.createIndex('parentItemKey', 'data.parentItem', { unique: false });
				itemStore.createIndex('libraryKey', 'libraryKey', { unique: false });
				itemStore.createIndex('deleted', 'data.deleted', { unique: false });

				collectionStore.createIndex('name', 'data.name', { unique: false });
				collectionStore.createIndex('key', 'key', { unique: false });
				collectionStore.createIndex('parentCollection', 'data.parentCollection', { unique: false });
				//collectionStore.createIndex("libraryKey", "libraryKey", { unique: false });

				tagStore.createIndex('tag', 'tag', { unique: false });
				//tagStore.createIndex("libraryKey", "libraryKey", { unique: false });
			}
		};

		request.onupgradeneeded = upgradeCallback;

		request.onsuccess = function () {
			log.debug('IDB success', 3);
			idbLibrary.db = request.result;
			idbLibrary.initialized = true;
			resolve(idbLibrary);
		};
	});
};

module.exports.Library.prototype.deleteDB = function () {
	var idbLibrary = this;
	idbLibrary.db.close();
	return new Promise(function (resolve, reject) {
		var deleteRequest = idbLibrary.indexedDB.deleteDatabase('Zotero_' + idbLibrary.libraryString);
		deleteRequest.onerror = function () {
			log.error('Error deleting indexedDB');
			reject();
		};
		deleteRequest.onsuccess = function () {
			log.debug('Successfully deleted indexedDB', 2);
			resolve();
		};
	});
};

/**
* @param {string} store_name
* @param {string} mode either "readonly" or "readwrite"
*/
module.exports.Library.prototype.getObjectStore = function (store_name, mode) {
	var idbLibrary = this;
	var tx = idbLibrary.db.transaction(store_name, mode);
	return tx.objectStore(store_name);
};

module.exports.Library.prototype.clearObjectStore = function (store_name) {
	var idbLibrary = this;
	var store = idbLibrary.getObjectStore(store_name, 'readwrite');
	return new Promise(function (resolve, reject) {
		var req = store.clear();
		req.onsuccess = function (evt) {
			log.debug('Store cleared', 3);
			resolve();
		};
		req.onerror = function (evt) {
			log.error('clearObjectStore:', evt.target.errorCode);
			reject();
		};
	});
};

/**
* Add array of items to indexedDB
* @param {array} items
*/
module.exports.Library.prototype.addItems = function (items) {
	return this.addObjects(items, 'item');
};

/**
* Update/add array of items to indexedDB
* @param {array} items
*/
module.exports.Library.prototype.updateItems = function (items) {
	return this.updateObjects(items, 'item');
};

/**
* Remove array of items to indexedDB. Just references itemKey and does no other checks that items match
* @param {array} items
*/
module.exports.Library.prototype.removeItems = function (items) {
	return this.removeObjects(items, 'item');
};

/**
* Get item from indexedDB that has given itemKey
* @param {string} itemKey
*/
module.exports.Library.prototype.getItem = function (itemKey) {
	var idbLibrary = this;
	return new Promise(function (resolve, reject) {
		var success = function success(event) {
			resolve(event.target.result);
		};
		idbLibrary.db.transaction('items').objectStore(['items'], 'readonly').get(itemKey).onsuccess = success;
	});
};

/**
* Get all the items in this indexedDB
* @param {array} items
*/
module.exports.Library.prototype.getAllItems = function () {
	return this.getAllObjects('item');
};

module.exports.Library.prototype.getOrderedItemKeys = function (field, order) {
	var idbLibrary = this;
	log.debug('Zotero.Idb.getOrderedItemKeys', 3);
	log.debug('' + field + ' ' + order, 3);
	return new Promise(function (resolve, reject) {
		var objectStore = idbLibrary.db.transaction(['items'], 'readonly').objectStore('items');
		var index = objectStore.index(field);
		if (!index) {
			throw new Error("Index for requested field '" + field + "'' not found");
		}

		var cursorDirection = 'next';
		if (order == 'desc') {
			cursorDirection = 'prev';
		}

		var cursorRequest = index.openKeyCursor(null, cursorDirection);
		var itemKeys = [];
		cursorRequest.onsuccess = (function (event) {
			var cursor = event.target.result;
			if (cursor) {
				itemKeys.push(cursor.primaryKey);
				cursor.continue();
			} else {
				log.debug('No more cursor: done. Resolving deferred.', 3);
				resolve(itemKeys);
			}
		}).bind(this);

		cursorRequest.onfailure = (function (event) {
			reject();
		}).bind(this);
	});
};

//filter the items in indexedDB by value in field
module.exports.Library.prototype.filterItems = function (field, value) {
	var idbLibrary = this;
	log.debug('Zotero.Idb.filterItems ' + field + ' - ' + value, 3);
	return new Promise(function (resolve, reject) {
		var itemKeys = [];
		var objectStore = idbLibrary.db.transaction(['items'], 'readonly').objectStore('items');
		var index = objectStore.index(field);
		if (!index) {
			throw new Error("Index for requested field '" + field + "'' not found");
		}

		var cursorDirection = 'next';
		/*if(order == "desc"){
  	cursorDirection = "prev";
  }*/

		var range = IDBKeyRange.only(value);
		var cursorRequest = index.openKeyCursor(range, cursorDirection);
		cursorRequest.onsuccess = (function (event) {
			var cursor = event.target.result;
			if (cursor) {
				itemKeys.push(cursor.primaryKey);
				cursor.continue();
			} else {
				log.debug('No more cursor: done. Resolving deferred.', 3);
				resolve(itemKeys);
			}
		}).bind(this);

		cursorRequest.onfailure = (function (event) {
			reject();
		}).bind(this);
	});
};

module.exports.Library.prototype.inferType = function (object) {
	if (!object) {
		return false;
	}
	if (!object.instance) {
		return false;
	}
	switch (object.instance) {
		case 'Zotero.Item':
			return 'item';
		case 'Zotero.Collection':
			return 'collection';
		case 'Zotero.Tag':
			return 'tag';
		default:
			return false;
	}
};

module.exports.Library.prototype.getTransactionAndStore = function (type, access) {
	var idbLibrary = this;
	var transaction;
	var objectStore;
	switch (type) {
		case 'item':
			transaction = idbLibrary.db.transaction(['items'], access);
			objectStore = transaction.objectStore('items');
			break;
		case 'collection':
			transaction = idbLibrary.db.transaction(['collections'], access);
			objectStore = transaction.objectStore('collections');
			break;
		case 'tag':
			transaction = idbLibrary.db.transaction(['tags'], access);
			objectStore = transaction.objectStore('tags');
			break;
		default:
			return Promise.reject();
	}
	return [transaction, objectStore];
};

module.exports.Library.prototype.addObjects = function (objects, type) {
	log.debug('Zotero.Idb.Library.addObjects', 3);
	var idbLibrary = this;
	if (!type) {
		type = idbLibrary.inferType(objects[0]);
	}
	var TS = idbLibrary.getTransactionAndStore(type, 'readwrite');
	var transaction = TS[0];
	var objectStore = TS[1];

	return new Promise(function (resolve, reject) {
		transaction.oncomplete = function (event) {
			log.debug('Add Objects transaction completed.', 3);
			resolve();
		};

		transaction.onerror = function (event) {
			log.error('Add Objects transaction failed.');
			reject();
		};

		var reqSuccess = function reqSuccess(event) {
			log.debug('Added Object ' + event.target.result, 4);
		};
		for (var i in objects) {
			var request = objectStore.add(objects[i].apiObj);
			request.onsuccess = reqSuccess;
		}
	});
};

module.exports.Library.prototype.updateObjects = function (objects, type) {
	log.debug('Zotero.Idb.Library.updateObjects', 3);
	var idbLibrary = this;
	if (!type) {
		type = idbLibrary.inferType(objects[0]);
	}
	var TS = idbLibrary.getTransactionAndStore(type, 'readwrite');
	var transaction = TS[0];
	var objectStore = TS[1];

	return new Promise(function (resolve, reject) {
		transaction.oncomplete = function (event) {
			log.debug('Update Objects transaction completed.', 3);
			resolve();
		};

		transaction.onerror = function (event) {
			log.error('Update Objects transaction failed.');
			reject();
		};

		var reqSuccess = function reqSuccess(event) {
			log.debug('Updated Object ' + event.target.result, 4);
		};
		for (var i in objects) {
			var request = objectStore.put(objects[i].apiObj);
			request.onsuccess = reqSuccess;
		}
	});
};

module.exports.Library.prototype.removeObjects = function (objects, type) {
	var idbLibrary = this;
	if (!type) {
		type = idbLibrary.inferType(objects[0]);
	}
	var TS = idbLibrary.getTransactionAndStore(type, 'readwrite');
	var transaction = TS[0];
	var objectStore = TS[1];

	return new Promise(function (resolve, reject) {
		transaction.oncomplete = function (event) {
			log.debug('Remove Objects transaction completed.', 3);
			resolve();
		};

		transaction.onerror = function (event) {
			log.error('Remove Objects transaction failed.');
			reject();
		};

		var reqSuccess = function reqSuccess(event) {
			log.debug('Removed Object ' + event.target.result, 4);
		};
		for (var i in objects) {
			var request = objectStore.delete(objects[i].key);
			request.onsuccess = reqSuccess;
		}
	});
};

module.exports.Library.prototype.getAllObjects = function (type) {
	var idbLibrary = this;
	return new Promise(function (resolve, reject) {
		var objects = [];
		var objectStore = idbLibrary.db.transaction(type + 's').objectStore(type + 's');

		objectStore.openCursor().onsuccess = function (event) {
			var cursor = event.target.result;
			if (cursor) {
				objects.push(cursor.value);
				cursor.continue();
			} else {
				resolve(objects);
			}
		};
	});
};

module.exports.Library.prototype.addCollections = function (collections) {
	return this.addObjects(collections, 'collection');
};

module.exports.Library.prototype.updateCollections = function (collections) {
	log.debug('Zotero.Idb.Library.updateCollections', 3);
	return this.updateObjects(collections, 'collection');
};

/**
* Get collection from indexedDB that has given collectionKey
* @param {string} collectionKey
*/
module.exports.Library.prototype.getCollection = function (collectionKey) {
	var idbLibrary = this;
	return new Promise(function (resolve, reject) {
		var success = function success(event) {
			resolve(event.target.result);
		};
		idbLibrary.db.transaction('collections').objectStore(['collections'], 'readonly').get(collectionKey).onsuccess = success;
	});
};

module.exports.Library.prototype.removeCollections = function (collections) {
	log.debug('Zotero.Idb.Library.removeCollections', 3);
	return this.removeObjects(collections, 'collection');
};

module.exports.Library.prototype.getAllCollections = function () {
	log.debug('Zotero.Idb.Library.getAllCollections', 3);
	return this.getAllObjects('collection');
};

module.exports.Library.prototype.addTags = function (tags) {
	return this.addObjects(tags, 'tag');
};

module.exports.Library.prototype.updateTags = function (tags) {
	log.debug('Zotero.Idb.Library.updateTags', 3);
	return this.updateObjects(tags, 'tag');
};

module.exports.Library.prototype.getAllTags = function () {
	log.debug('getAllTags', 3);
	return this.getAllObjects('tag');
};

module.exports.Library.prototype.setVersion = function (type, version) {
	log.debug('Zotero.Idb.Library.setVersion', 3);
	var idbLibrary = this;
	return new Promise(function (resolve, reject) {
		var transaction = idbLibrary.db.transaction(['versions'], 'readwrite');

		transaction.oncomplete = function (event) {
			log.debug('set version transaction completed.', 3);
			resolve();
		};

		transaction.onerror = function (event) {
			log.error('set version transaction failed.');
			reject();
		};

		var versionStore = transaction.objectStore('versions');
		var reqSuccess = function reqSuccess(event) {
			log.debug('Set Version' + event.target.result, 3);
		};
		var request = versionStore.put(version, type);
		request.onsuccess = reqSuccess;
	});
};

/**
* Get version data from indexedDB
* @param {string} type
*/
module.exports.Library.prototype.getVersion = function (type) {
	log.debug('Zotero.Idb.Library.getVersion', 3);
	var idbLibrary = this;
	return new Promise(function (resolve, reject) {
		var success = function success(event) {
			log.debug('done getting version');
			resolve(event.target.result);
		};
		idbLibrary.db.transaction(['versions'], 'readonly').objectStore('versions').get(type).onsuccess = success;
	});
};

module.exports.Library.prototype.setFile = function (itemKey, fileData) {
	log.debug('Zotero.Idb.Library.setFile', 3);
	var idbLibrary = this;
	return new Promise(function (resolve, reject) {
		var transaction = idbLibrary.db.transaction(['files'], 'readwrite');

		transaction.oncomplete = function (event) {
			log.debug('set file transaction completed.', 3);
			resolve();
		};

		transaction.onerror = function (event) {
			log.error('set file transaction failed.');
			reject();
		};

		var fileStore = transaction.objectStore('files');
		var reqSuccess = function reqSuccess(event) {
			log.debug('Set File' + event.target.result, 3);
		};
		var request = fileStore.put(fileData, itemKey);
		request.onsuccess = reqSuccess;
	});
};

/**
* Get item from indexedDB that has given itemKey
* @param {string} itemKey
*/
module.exports.Library.prototype.getFile = function (itemKey) {
	log.debug('Zotero.Idb.Library.getFile', 3);
	var idbLibrary = this;
	return new Promise(function (resolve, reject) {
		var success = function success(event) {
			log.debug('done getting file');
			resolve(event.target.result);
		};
		idbLibrary.db.transaction(['files'], 'readonly').objectStore('files').get(itemKey).onsuccess = success;
	});
};

module.exports.Library.prototype.deleteFile = function (itemKey) {
	log.debug('Zotero.Idb.Library.deleteFile', 3);
	var idbLibrary = this;
	return new Promise(function (resolve, reject) {
		var transaction = idbLibrary.db.transaction(['files'], 'readwrite');

		transaction.oncomplete = function (event) {
			log.debug('delete file transaction completed.', 3);
			resolve();
		};

		transaction.onerror = function (event) {
			log.error('delete file transaction failed.');
			reject();
		};

		var fileStore = transaction.objectStore('files');
		var reqSuccess = function reqSuccess(event) {
			log.debug('Deleted File' + event.target.result, 4);
		};
		var request = fileStore.delete(itemKey);
		request.onsuccess = reqSuccess;
	});
};

//intersect two arrays of strings as an AND condition on index results
module.exports.Library.prototype.intersect = function (ar1, ar2) {
	var idbLibrary = this;
	var result = [];
	for (var i = 0; i < ar1.length; i++) {
		if (ar2.indexOf(ar1[i]) !== -1) {
			result.push(ar1[i]);
		}
	}
	return result;
};

//intersect an array of arrays of strings as an AND condition on index results
module.exports.Library.prototype.intersectAll = function (arrs) {
	var idbLibrary = this;
	var result = arrs[0];
	for (var i = 0; i < arrs.length - 1; i++) {
		result = idbLibrary.intersect(result, arrs[i + 1]);
	}
	return result;
};

},{"./Log.js":115}],110:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Item');

var striptags = require('striptags');
var ItemMaps = require('./ItemMaps.js');

/*
 * TODO: several functions should not work unless we build a fresh item with a template
 * or parsed an item from the api with json content (things that depend on apiObj)
 * There should be a flag to note whether this is the case and throwing on attempts to
 * use these functions when it is not.
 */
var Item = function Item(itemObj) {
	this.instance = 'Zotero.Item';
	this.version = 0;
	this.key = '';
	this.synced = false;
	this.apiObj = {};
	this.pristineData = null;
	this.childItemKeys = [];
	this.writeErrors = [];
	this.notes = [];
	if (itemObj) {
		this.parseJsonItem(itemObj);
	} else {
		this.parseJsonItem(this.emptyJsonItem());
	}
	this.initSecondaryData();
};

Item.prototype = new Zotero.ApiObject();

Item.prototype.parseJsonItem = function (apiObj) {
	var item = this;
	item.version = apiObj.version;
	item.key = apiObj.key;
	item.apiObj = Z.extend({}, apiObj);
	item.pristineData = Z.extend({}, apiObj.data);
	if (!item.apiObj._supplement) {
		item.apiObj._supplement = {};
	}
};

Item.prototype.emptyJsonItem = function () {
	return {
		key: '',
		version: 0,
		library: {},
		links: {},
		data: {
			key: '',
			version: 0,
			title: '',
			creators: [],
			collections: [],
			tags: [],
			relations: {}
		},
		meta: {},
		_supplement: {}
	};
};

//populate property values derived from json content
Item.prototype.initSecondaryData = function () {
	var item = this;

	item.version = item.apiObj.version;

	if (item.apiObj.data.itemType == 'attachment') {
		item.mimeType = item.apiObj.data.contentType;
		item.translatedMimeType = Zotero.utils.translateMimeType(item.mimeType);
	}
	if ('linkMode' in item.apiObj) {
		item.linkMode = item.apiObj.data.linkMode;
	}

	item.attachmentDownloadUrl = Zotero.url.attachmentDownloadUrl(item);

	if (item.apiObj.meta.parsedDate) {
		item.parsedDate = new Date(item.apiObj.meta.parsedDate);
	} else {
		item.parsedDate = false;
	}

	item.synced = false;

	item.updateTagStrings();
};

Item.prototype.updateTagStrings = function () {
	var item = this;
	var tagstrings = [];
	for (var i = 0; i < item.apiObj.data.tags.length; i++) {
		tagstrings.push(item.apiObj.data.tags[i].tag);
	}
	item.apiObj._supplement.tagstrings = tagstrings;
};

Item.prototype.initEmpty = function (itemType, linkMode) {
	var item = this;
	return item.getItemTemplate(itemType, linkMode).then(function (template) {
		item.initEmptyFromTemplate(template);
		return item;
	});
};

//special case note initialization to guarentee synchronous and simplify some uses
Item.prototype.initEmptyNote = function () {
	var item = this;
	item.version = 0;
	var noteTemplate = { 'itemType': 'note', 'note': '', 'tags': [], 'collections': [], 'relations': {} };

	item.initEmptyFromTemplate(noteTemplate);

	return item;
};

Item.prototype.initEmptyFromTemplate = function (template) {
	var item = this;
	item.version = 0;

	item.key = '';
	item.pristineData = Z.extend({}, template);
	item.apiObj = {
		key: '',
		version: 0,
		library: {},
		links: {},
		data: template,
		meta: {},
		_supplement: {}
	};

	item.initSecondaryData();
	return item;
};

Item.prototype.isSupplementaryItem = function () {
	var item = this;
	var itemType = item.get('itemType');
	if (itemType == 'attachment' || itemType == 'note') {
		return true;
	}
	return false;
};

Item.prototype.isSnapshot = function () {
	var item = this;
	if (item.apiObj.links['enclosure']) {
		var ftype = item.apiObj.links['enclosure'].type;
		if (!item.apiObj.links['enclosure']['length'] && ftype == 'text/html') {
			return true;
		}
	}
	return false;
};

Item.prototype.updateObjectKey = function (objectKey) {
	return this.updateItemKey(objectKey);
};

Item.prototype.updateItemKey = function (itemKey) {
	var item = this;
	item.key = itemKey;
	item.apiObj.key = itemKey;
	item.apiObj.data.key = itemKey;
	item.pristineData.key = itemKey;
	return item;
};

/*
 * Write updated information for the item to the api and potentiallyp
 * create new child notes (or attachments?) of this item
 */
Item.prototype.writeItem = function () {
	var item = this;
	if (!item.owningLibrary) {
		throw new Error('Item must be associated with a library');
	}
	return item.owningLibrary.items.writeItems([item]);
};

//get the JS object to be PUT/POSTed for write
Item.prototype.writeApiObj = function () {
	var item = this;

	//remove any creators that have no names
	if (item.apiObj.data.creators) {
		var newCreatorsArray = item.apiObj.data.creators.filter(function (c) {
			if (c.name || c.firstName || c.lastName) {
				return true;
			}
			return false;
		});
		item.apiObj.data.creators = newCreatorsArray;
	}

	//copy apiObj, extend with pristine to make sure required fields are present
	//and remove unwriteable fields(?)
	var writeApiObj = Z.extend({}, item.pristineData, item.apiObj.data);
	return writeApiObj;
};

Item.prototype.createChildNotes = function (notes) {
	var item = this;
	var childItems = [];
	var childItemPromises = [];

	notes.forEach(function (note) {
		var childItem = new Item();
		var p = childItem.initEmpty('note').then(function (noteItem) {
			noteItem.set('note', note.note);
			noteItem.set('parentItem', item.key);
			childItems.push(noteItem);
		});
		childItemPromises.push(p);
	});

	return Promise.all(childItemPromises).then(function () {
		return item.owningLibrary.writeItems(childItems);
	});
};

//TODO: implement
Item.prototype.writePatch = function () {};

Item.prototype.getChildren = function (library) {
	log.debug('Zotero.Item.getChildren', 4);
	var item = this;
	return Promise.resolve().then(function () {
		//short circuit if has item has no children
		if (!item.apiObj.meta.numChildren) {
			return [];
		}

		var config = {
			url: {
				'target': 'children',
				'libraryType': item.apiObj.library.type,
				'libraryID': item.apiObj.library.id,
				'itemKey': item.key
			}
		};

		return Zotero.net.queueRequest(config).then(function (response) {
			log.debug('getChildren proxied callback', 4);
			var items = library.items;
			var childItems = items.addItemsFromJson(response.data);
			for (var i = childItems.length - 1; i >= 0; i--) {
				childItems[i].associateWithLibrary(library);
			}

			return childItems;
		});
	});
};

Item.prototype.getItemTypes = function (locale) {
	log.debug('Zotero.Item.prototype.getItemTypes', 3);
	if (!locale) {
		locale = 'en-US';
	}
	locale = 'en-US';

	var itemTypes = Zotero.cache.load({ locale: locale, target: 'itemTypes' });
	if (itemTypes) {
		log.debug('have itemTypes in localStorage', 3);
		Item.prototype.itemTypes = itemTypes; //JSON.parse(Zotero.storage.localStorage['itemTypes']);
		return;
	}

	var query = Zotero.ajax.apiQueryString({ locale: locale });
	var url = Zotero.config.baseApiUrl + '/itemTypes' + query;
	Zotero.net.ajax({
		url: Zotero.ajax.proxyWrapper(url, 'GET'),
		type: 'GET'
	}).then(function (xhr) {
		log.debug('got itemTypes response', 3);
		log.debug(xhr.response, 4);
		Item.prototype.itemTypes = JSON.parse(xhr.responseText);
		Zotero.cache.save({ locale: locale, target: 'itemTypes' }, Item.prototype.itemTypes);
	});
};

Item.prototype.getItemFields = function (locale) {
	log.debug('Zotero.Item.prototype.getItemFields', 3);
	if (!locale) {
		locale = 'en-US';
	}
	locale = 'en-US';

	var itemFields = Zotero.cache.load({ locale: locale, target: 'itemFields' });
	if (itemFields) {
		log.debug('have itemFields in localStorage', 3);
		Item.prototype.itemFields = itemFields; //JSON.parse(Zotero.storage.localStorage['itemFields']);
		Object.keys(Item.prototype.itemFields).forEach(function (key) {
			var val = Item.prototype.itemFields[key];
			Zotero.localizations.fieldMap[val.field] = val.localized;
		});
		return;
	}

	var query = Zotero.ajax.apiQueryString({ locale: locale });
	var requestUrl = Zotero.config.baseApiUrl + '/itemFields' + query;
	Zotero.net.ajax({
		url: Zotero.ajax.proxyWrapper(requestUrl),
		type: 'GET'
	}).then(function (xhr) {
		log.debug('got itemTypes response', 4);
		var data = JSON.parse(xhr.responseText);
		Item.prototype.itemFields = data;
		Zotero.cache.save({ locale: locale, target: 'itemFields' }, data);
		//Zotero.storage.localStorage['itemFields'] = JSON.stringify(data);
		Object.keys(Item.prototype.itemFields).forEach(function (key) {
			var val = Item.prototype.itemFields[key];
			Zotero.localizations.fieldMap[val.field] = val.localized;
		});
	});
};

Item.prototype.getItemTemplate = function () {
	var itemType = arguments.length <= 0 || arguments[0] === undefined ? 'document' : arguments[0];
	var linkMode = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

	log.debug('Zotero.Item.prototype.getItemTemplate', 3);
	if (itemType == 'attachment' && linkMode == '') {
		throw new Error('attachment template requested with no linkMode');
	}

	var query = Zotero.ajax.apiQueryString({ itemType: itemType, linkMode: linkMode });
	var requestUrl = Zotero.config.baseApiUrl + '/items/new' + query;

	var cacheConfig = { itemType: itemType, target: 'itemTemplate' };
	var itemTemplate = Zotero.cache.load(cacheConfig);
	if (itemTemplate) {
		log.debug('have itemTemplate in localStorage', 3);
		var template = itemTemplate; // JSON.parse(Zotero.storage.localStorage[url]);
		return Promise.resolve(template);
	}

	return Zotero.ajaxRequest(requestUrl, 'GET', { dataType: 'json' }).then(function (response) {
		log.debug('got itemTemplate response', 3);
		Zotero.cache.save(cacheConfig, response.data);
		return response.data;
	});
};

Item.prototype.getUploadAuthorization = function (fileinfo) {
	//fileInfo: md5, filename, filesize, mtime, zip, contentType, charset
	log.debug('Zotero.Item.getUploadAuthorization', 3);
	var item = this;

	var config = {
		'target': 'item',
		'targetModifier': 'file',
		'libraryType': item.owningLibrary.type,
		'libraryID': item.owningLibrary.libraryID,
		'itemKey': item.key
	};
	var headers = {
		'Content-Type': 'application/x-www-form-urlencoded'
	};
	var oldmd5 = item.get('md5');
	if (oldmd5) {
		headers['If-Match'] = oldmd5;
	} else {
		headers['If-None-Match'] = '*';
	}

	return Zotero.ajaxRequest(config, 'POST', {
		processData: true,
		data: fileinfo,
		headers: headers
	});
};

Item.prototype.registerUpload = function (uploadKey) {
	log.debug('Zotero.Item.registerUpload', 3);
	var item = this;
	var config = {
		'target': 'item',
		'targetModifier': 'file',
		'libraryType': item.owningLibrary.type,
		'libraryID': item.owningLibrary.libraryID,
		'itemKey': item.key
	};
	var headers = {
		'Content-Type': 'application/x-www-form-urlencoded'
	};
	var oldmd5 = item.get('md5');
	if (oldmd5) {
		headers['If-Match'] = oldmd5;
	} else {
		headers['If-None-Match'] = '*';
	}

	return Zotero.ajaxRequest(config, 'POST', {
		processData: true,
		data: { upload: uploadKey },
		headers: headers
	});
};

Item.prototype.fullUpload = function (file) {};

Item.prototype.creatorTypes = {};

Item.prototype.getCreatorTypes = function (itemType) {
	log.debug('Zotero.Item.prototype.getCreatorTypes: ' + itemType, 3);
	if (!itemType) {
		itemType = 'document';
	}

	//parse stored creatorTypes object if it exists
	//creatorTypes maps itemType to the possible creatorTypes
	var creatorTypes = Zotero.cache.load({ target: 'creatorTypes' });
	if (creatorTypes) {
		log.debug('have creatorTypes in localStorage', 3);
		Item.prototype.creatorTypes = creatorTypes; //JSON.parse(Zotero.storage.localStorage['creatorTypes']);
	}

	if (Item.prototype.creatorTypes[itemType]) {
		log.debug('creatorTypes of requested itemType available in localStorage', 3);
		log.debug(Item.prototype.creatorTypes, 4);
		return Promise.resolve(Item.prototype.creatorTypes[itemType]);
	} else {
		log.debug('sending request for creatorTypes', 3);
		var query = Zotero.ajax.apiQueryString({ itemType: itemType });
		//TODO: this probably shouldn't be using baseApiUrl directly
		var requestUrl = Zotero.config.baseApiUrl + '/itemTypeCreatorTypes' + query;

		return Zotero.ajaxRequest(requestUrl, 'GET', { dataType: 'json' }).then(function (response) {
			log.debug('got creatorTypes response', 4);
			Item.prototype.creatorTypes[itemType] = response.data;
			//Zotero.storage.localStorage['creatorTypes'] = JSON.stringify(Item.prototype.creatorTypes);
			Zotero.cache.save({ target: 'creatorTypes' }, Item.prototype.creatorTypes);
			return Item.prototype.creatorTypes[itemType];
		});
	}
};

Item.prototype.getCreatorFields = function (locale) {
	log.debug('Zotero.Item.prototype.getCreatorFields', 3);
	var creatorFields = Zotero.cache.load({ target: 'creatorFields' });
	if (creatorFields) {
		log.debug('have creatorFields in localStorage', 3);
		Item.prototype.creatorFields = creatorFields; // JSON.parse(Zotero.storage.localStorage['creatorFields']);
		return Promise.resolve(creatorFields);
	}

	var requestUrl = Zotero.config.baseApiUrl + '/creatorFields';
	return Zotero.ajaxRequest(requestUrl, 'GET', { dataType: 'json' }).then(function (response) {
		log.debug('got itemTypes response', 4);
		Item.prototype.creatorFields = response.data;
		Zotero.cache.save({ target: 'creatorFields' }, response.data);
	});
};

//---Functions to manually add Zotero format data instead of fetching it from the API ---
//To be used first with cached data for offline, could also maybe be used for custom types
Item.prototype.addItemTypes = function (itemTypes, locale) {};

Item.prototype.addItemFields = function (itemType, itemFields) {};

Item.prototype.addCreatorTypes = function (itemType, creatorTypes) {};

Item.prototype.addCreatorFields = function (itemType, creatorFields) {};

Item.prototype.addItemTemplates = function (templates) {};

Item.prototype.itemTypeImageClass = function () {
	//linkModes: imported_file,imported_url,linked_file,linked_url
	var item = this;
	if (item.apiObj.data.itemType == 'attachment') {
		switch (item.apiObj.data.linkMode) {
			case 'imported_file':
				if (item.translatedMimeType == 'pdf') {
					return item.itemTypeImageSrc['attachmentPdf'];
				}
				return item.itemTypeImageSrc['attachmentFile'];
			case 'imported_url':
				if (item.translatedMimeType == 'pdf') {
					return item.itemTypeImageSrc['attachmentPdf'];
				}
				return item.itemTypeImageSrc['attachmentSnapshot'];
			case 'linked_file':
				return item.itemTypeImageSrc['attachmentLink'];
			case 'linked_url':
				return item.itemTypeImageSrc['attachmentWeblink'];
			default:
				return item.itemTypeImageSrc['attachment'];
		}
	} else {
		return item.apiObj.data.itemType;
	}
};

Item.prototype.itemTypeIconClass = function () {
	//linkModes: imported_file,imported_url,linked_file,linked_url
	var item = this;
	var defaultIcon = 'fa fa-file-text-o';
	switch (item.apiObj.data.itemType) {
		case 'attachment':
			switch (item.apiObj.data.linkMode) {
				case 'imported_file':
					if (item.translatedMimeType == 'pdf') {
						return 'fa fa-file-pdf-o';
					}
					return 'glyphicons glyphicons-file';
				case 'imported_url':
					if (item.translatedMimeType == 'pdf') {
						return 'fa fa-file-pdf-o';
					}
					return 'glyphicons glyphicons-file';
				case 'linked_file':
					return 'glyphicons glyphicons-link';
				//return item.itemTypeImageSrc['attachmentLink'];
				case 'linked_url':
					return 'glyphicons glyphicons-link';
				//return item.itemTypeImageSrc['attachmentWeblink'];
				default:
					return 'glyphicons glyphicons-paperclip';
				//return item.itemTypeImageSrc['attachment'];
			}
			return 'glyphicons file';
		case 'artwork':
			return 'glyphicons glyphicons-picture';
		case 'audioRecording':
			return 'glyphicons glyphicons-microphone';
		case 'bill':
			return defaultIcon;
		case 'blogPost':
			return 'glyphicons glyphicons-blog';
		case 'book':
			return 'glyphicons glyphicons-book';
		case 'bookSection':
			return 'glyphicons glyphicons-book-open';
		case 'case':
			return defaultIcon;
		case 'computerProgram':
			return 'glyphicons glyphicons-floppy-disk';
		case 'conferencePaper':
			return defaultIcon;
		case 'dictionaryEntry':
			return 'glyphicons glyphicons-translate';
		case 'document':
			return 'glyphicons glyphicons-file';
		case 'email':
			return 'glyphicons glyphicons-envelope';
		case 'encyclopediaArticle':
			return 'glyphicons glyphicons-bookmark';
		case 'film':
			return 'glyphicons glyphicons-film';
		case 'forumPost':
			return 'glyphicons glyphicons-bullhorn';
		case 'hearing':
			return 'fa fa-gavel';
		case 'instantMessage':
			return 'fa fa-comment-o';
		case 'interview':
			return 'fa fa-comments-o';
		case 'journalArticle':
			return 'fa fa-file-text-o';
		case 'letter':
			return 'glyphicons glyphicons-message-full';
		case 'magazineArticle':
			return defaultIcon;
		case 'manuscript':
			return 'glyphicons glyphicons-pen';
		case 'map':
			return 'glyphicons glyphicons-google-maps';
		case 'newspaperArticle':
			return 'fa fa-newspaper-o';
		case 'note':
			return 'glyphicons glyphicons-notes noteyellow';
		case 'patent':
			return 'glyphicons glyphicons-lightbulb';
		case 'podcast':
			return 'glyphicons glyphicons-ipod';
		case 'presentation':
			return 'glyphicons glyphicons-keynote';
		case 'radioBroadcast':
			return 'glyphicons glyphicons-wifi-alt';
		case 'report':
			return 'glyphicons glyphicons-notes-2';
		case 'statue':
			return 'glyphicons glyphicons-bank';
		case 'thesis':
			return 'fa fa-graduation-cap';
		case 'tvBroadcast':
			return 'glyphicons glyphicons-display';
		case 'videoRecording':
			return 'glyphicons glyphicons-facetime-video';
		case 'webpage':
			return 'glyphicons glyphicons-embed-close';
		default:
			return 'glyphicons file';
	}
};

Item.prototype.get = function (key) {
	var item = this;
	switch (key) {
		case 'title':
			var title = '';
			if (item.apiObj.data.itemType == 'note') {
				return item.noteTitle(item.apiObj.data.note);
			} else {
				return item.apiObj.data.title;
			}
			if (title === '') {
				return '[Untitled]';
			}
			return title;
		case 'creatorSummary':
		case 'creator':
			if (typeof item.apiObj.meta.creatorSummary !== 'undefined') {
				return item.apiObj.meta.creatorSummary;
			} else {
				return '';
			}
			break;
		case 'year':
			if (item.parsedDate) {
				return item.parsedDate.getFullYear();
			} else {
				return '';
			}
	}

	if (key in item.apiObj.data) {
		return item.apiObj.data[key];
	} else if (key in item.apiObj.meta) {
		return item.apiObj.meta[key];
	} else if (item.hasOwnProperty(key)) {
		return item[key];
	}

	return null;
};

Item.prototype.set = function (key, val) {
	var item = this;
	if (key in item.apiObj) {
		item.apiObj[key] = val;
	}
	if (key in item.apiObj.data) {
		item.apiObj.data[key] = val;
	}
	if (key in item.apiObj.meta) {
		item.apiObj.meta[key] = val;
	}

	switch (key) {
		case 'itemKey':
		case 'key':
			item.key = val;
			item.apiObj.data.key = val;
			break;
		case 'itemVersion':
		case 'version':
			item.version = val;
			item.apiObj.data.version = val;
			break;
		case 'itemType':
			item.itemType = val;
			//TODO: translate api object to new item type
			break;
		case 'linkMode':
			break;
		case 'deleted':
			item.apiObj.data.deleted = val;
			break;
		case 'parentItem':
			if (val === '') {
				val = false;
			}
			item.apiObj.data.parentItem = val;
			break;
	}

	//    item.synced = false;
	return item;
};

Item.prototype.noteTitle = function (note) {
	var len = 120;
	var notetext = striptags(note);
	var firstNewline = notetext.indexOf('\n');
	if (firstNewline != -1 && firstNewline < len) {
		return notetext.substr(0, firstNewline);
	} else {
		return notetext.substr(0, len);
	}
};

Item.prototype.setParent = function (parentItemKey) {
	var item = this;
	//pull out itemKey string if we were passed an item object
	if (typeof parentItemKey != 'string' && parentItemKey.hasOwnProperty('instance') && parentItemKey.instance == 'Zotero.Item') {
		parentItemKey = parentItemKey.key;
	}
	item.set('parentItem', parentItemKey);
	return item;
};

Item.prototype.addToCollection = function (collectionKey) {
	var item = this;
	//take out the collection key if we're passed a collection object instead
	if (typeof collectionKey != 'string') {
		if (collectionKey.instance == 'Zotero.Collection') {
			collectionKey = collectionKey.key;
		}
	}
	if (item.apiObj.data.collections.indexOf(collectionKey) === -1) {
		item.apiObj.data.collections.push(collectionKey);
	}
	return;
};

Item.prototype.removeFromCollection = function (collectionKey) {
	var item = this;
	//take out the collection key if we're passed a collection object instead
	if (typeof collectionKey != 'string') {
		if (collectionKey.instance == 'Zotero.Collection') {
			collectionKey = collectionKey.key;
		}
	}
	var index = item.apiObj.data.collections.indexOf(collectionKey);
	if (index != -1) {
		item.apiObj.data.collections.splice(index, 1);
	}
	return;
};

Item.prototype.uploadChildAttachment = function (childItem, fileInfo, progressCallback) {
	/*
  * write child item so that it exists
  * get upload authorization for actual file
  * perform full upload
  */
	var item = this;
	log.debug('uploadChildAttachment', 3);
	if (!item.owningLibrary) {
		return Promise.reject(new Error('Item must be associated with a library'));
	}

	//make sure childItem has parent set
	childItem.set('parentItem', item.key);
	childItem.associateWithLibrary(item.owningLibrary);

	return childItem.writeItem().then(function (response) {
		//successful attachmentItemWrite
		item.numChildren++;
		return childItem.uploadFile(fileInfo, progressCallback);
	}, function (response) {
		//failure during attachmentItem write
		throw {
			'message': 'Failure during attachmentItem write.',
			'code': response.status,
			'serverMessage': response.jqxhr.responseText,
			'response': response
		};
	});
};

Item.prototype.uploadFile = function (fileInfo, progressCallback) {
	var item = this;
	log.debug('Zotero.Item.uploadFile', 3);
	var uploadAuthFileData = {
		md5: fileInfo.md5,
		filename: item.get('title'),
		filesize: fileInfo.filesize,
		mtime: fileInfo.mtime,
		contentType: fileInfo.contentType,
		params: 1
	};
	if (fileInfo.contentType === '') {
		uploadAuthFileData.contentType = 'application/octet-stream';
	}
	return item.getUploadAuthorization(uploadAuthFileData).then(function (response) {
		log.debug('uploadAuth callback', 3);
		var upAuthOb;
		if (typeof response.data == 'string') {
			upAuthOb = JSON.parse(response.data);
		} else {
			upAuthOb = response.data;
		}
		if (upAuthOb.exists == 1) {
			return { 'message': 'File Exists' };
		} else {
			//TODO: add progress
			return Zotero.file.uploadFile(upAuthOb, fileInfo).then(function () {
				//upload was successful: register it
				return item.registerUpload(upAuthOb.uploadKey).then(function (response) {
					if (response.isError) {
						var e = {
							'message': 'Failed to register uploaded file.',
							'code': response.status,
							'serverMessage': response.jqxhr.responseText,
							'response': response
						};
						log.error(e);
						throw e;
					} else {
						return { 'message': 'Upload Successful' };
					}
				});
			});
		}
	}).catch(function (response) {
		log.debug('Failure caught during upload', 3);
		log.debug(response, 3);
		throw {
			'message': 'Failure during upload.',
			'code': response.status,
			'serverMessage': response.jqxhr.responseText,
			'response': response
		};
	});
};

Item.prototype.cslItem = function () {
	var zoteroItem = this;

	// don't return URL or accessed information for journal articles if a
	// pages field exists
	var itemType = zoteroItem.get('itemType'); //Zotero_ItemTypes::getName($zoteroItem->itemTypeID);
	var cslType = zoteroItem.cslTypeMap.hasOwnProperty(itemType) ? zoteroItem.cslTypeMap[itemType] : false;
	if (!cslType) cslType = 'article';
	var ignoreURL = (zoteroItem.get('accessDate') || zoteroItem.get('url')) && itemType in { 'journalArticle': 1, 'newspaperArticle': 1, 'magazineArticle': 1 } && zoteroItem.get('pages') && zoteroItem.citePaperJournalArticleURL;

	var cslItem = { 'type': cslType };
	if (zoteroItem.owningLibrary) {
		cslItem['id'] = zoteroItem.apiObj.library.id + '/' + zoteroItem.get('key');
	} else {
		cslItem['id'] = Zotero.utils.getKey();
	}

	// get all text variables (there must be a better way)
	// TODO: does citeproc-js permit short forms?
	Object.keys(zoteroItem.cslFieldMap).forEach(function (variable) {
		var fields = zoteroItem.cslFieldMap[variable];
		if (variable == 'URL' && ignoreURL) return;
		fields.forEach(function (field) {
			var value = zoteroItem.get(field);
			if (value) {
				//TODO: strip enclosing quotes? necessary when not pulling from DB?
				cslItem[variable] = value;
			}
		});
	});

	// separate name variables
	var creators = zoteroItem.get('creators');
	creators.forEach(function (creator) {
		var creatorType = creator['creatorType']; // isset(self::$zoteroNameMap[$creatorType]) ? self::$zoteroNameMap[$creatorType] : false;
		if (!creatorType) return;

		var nameObj;
		if (creator.hasOwnProperty('name')) {
			nameObj = { 'literal': creator['name'] };
		} else {
			nameObj = { 'family': creator['lastName'], 'given': creator['firstName'] };
		}

		if (cslItem.hasOwnProperty(creatorType)) {
			cslItem[creatorType].push(nameObj);
		} else {
			cslItem[creatorType] = [nameObj];
		}
	});

	// get date variables
	Object.keys(zoteroItem.cslDateMap).forEach(function (key) {
		var val = zoteroItem.cslDateMap[key];
		var date = zoteroItem.get(val);
		if (date) {
			cslItem[key] = { 'raw': date };
		}
	});

	return cslItem;
};

Object.keys(ItemMaps).forEach(function (key) {
	Item.prototype[key] = ItemMaps[key];
});

module.exports = Item;

},{"./ItemMaps.js":111,"./Log.js":115,"striptags":94}],111:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:ItemMaps');

var ItemMaps = {};

ItemMaps.fieldMap = {
	'itemType': 'Item Type',
	'title': 'Title',
	'dateAdded': 'Date Added',
	'dateModified': 'Date Modified',
	'source': 'Source',
	'notes': 'Notes',
	'tags': 'Tags',
	'attachments': 'Attachments',
	'related': 'Related',
	'url': 'URL',
	'rights': 'Rights',
	'series': 'Series',
	'volume': 'Volume',
	'issue': 'Issue',
	'edition': 'Edition',
	'place': 'Place',
	'publisher': 'Publisher',
	'pages': 'Pages',
	'ISBN': 'ISBN',
	'publicationTitle': 'Publication',
	'ISSN': 'ISSN',
	'date': 'Date',
	'year': 'Year',
	'section': 'Section',
	'callNumber': 'Call Number',
	'archive': 'Archive',
	'archiveLocation': 'Loc. in Archive',
	'libraryCatalog': 'Library Catalog',
	'distributor': 'Distributor',
	'extra': 'Extra',
	'journalAbbreviation': 'Journal Abbr',
	'DOI': 'DOI',
	'accessDate': 'Accessed',
	'seriesTitle': 'Series Title',
	'seriesText': 'Series Text',
	'seriesNumber': 'Series Number',
	'institution': 'Institution',
	'reportType': 'Report Type',
	'code': 'Code',
	'session': 'Session',
	'legislativeBody': 'Legislative Body',
	'history': 'History',
	'reporter': 'Reporter',
	'court': 'Court',
	'numberOfVolumes': '# of Volumes',
	'committee': 'Committee',
	'assignee': 'Assignee',
	'patentNumber': 'Patent Number',
	'priorityNumbers': 'Priority Numbers',
	'issueDate': 'Issue Date',
	'references': 'References',
	'legalStatus': 'Legal Status',
	'codeNumber': 'Code Number',
	'artworkMedium': 'Medium',
	'number': 'Number',
	'artworkSize': 'Artwork Size',
	'repository': 'Repository',
	'videoRecordingType': 'Recording Type',
	'interviewMedium': 'Medium',
	'letterType': 'Type',
	'manuscriptType': 'Type',
	'mapType': 'Type',
	'scale': 'Scale',
	'thesisType': 'Type',
	'websiteType': 'Website Type',
	'audioRecordingType': 'Recording Type',
	'label': 'Label',
	'presentationType': 'Type',
	'meetingName': 'Meeting Name',
	'studio': 'Studio',
	'runningTime': 'Running Time',
	'network': 'Network',
	'postType': 'Post Type',
	'audioFileType': 'File Type',
	'versionNumber': 'Version Number',
	'system': 'System',
	'company': 'Company',
	'conferenceName': 'Conference Name',
	'encyclopediaTitle': 'Encyclopedia Title',
	'dictionaryTitle': 'Dictionary Title',
	'language': 'Language',
	'programmingLanguage': 'Language',
	'university': 'University',
	'abstractNote': 'Abstract',
	'websiteTitle': 'Website Title',
	'reportNumber': 'Report Number',
	'billNumber': 'Bill Number',
	'codeVolume': 'Code Volume',
	'codePages': 'Code Pages',
	'dateDecided': 'Date Decided',
	'reporterVolume': 'Reporter Volume',
	'firstPage': 'First Page',
	'documentNumber': 'Document Number',
	'dateEnacted': 'Date Enacted',
	'publicLawNumber': 'Public Law Number',
	'country': 'Country',
	'applicationNumber': 'Application Number',
	'forumTitle': 'Forum/Listserv Title',
	'episodeNumber': 'Episode Number',
	'blogTitle': 'Blog Title',
	'caseName': 'Case Name',
	'nameOfAct': 'Name of Act',
	'subject': 'Subject',
	'proceedingsTitle': 'Proceedings Title',
	'bookTitle': 'Book Title',
	'shortTitle': 'Short Title',
	'docketNumber': 'Docket Number',
	'numPages': '# of Pages',
	'note': 'Note',
	'numChildren': '# of Children',
	'addedBy': 'Added By',
	'creator': 'Creator'
};

ItemMaps.typeMap = {
	'note': 'Note',
	'attachment': 'Attachment',
	'book': 'Book',
	'bookSection': 'Book Section',
	'journalArticle': 'Journal Article',
	'magazineArticle': 'Magazine Article',
	'newspaperArticle': 'Newspaper Article',
	'thesis': 'Thesis',
	'letter': 'Letter',
	'manuscript': 'Manuscript',
	'interview': 'Interview',
	'film': 'Film',
	'artwork': 'Artwork',
	'webpage': 'Web Page',
	'report': 'Report',
	'bill': 'Bill',
	'case': 'Case',
	'hearing': 'Hearing',
	'patent': 'Patent',
	'statute': 'Statute',
	'email': 'E-mail',
	'map': 'Map',
	'blogPost': 'Blog Post',
	'instantMessage': 'Instant Message',
	'forumPost': 'Forum Post',
	'audioRecording': 'Audio Recording',
	'presentation': 'Presentation',
	'videoRecording': 'Video Recording',
	'tvBroadcast': 'TV Broadcast',
	'radioBroadcast': 'Radio Broadcast',
	'podcast': 'Podcast',
	'computerProgram': 'Computer Program',
	'conferencePaper': 'Conference Paper',
	'document': 'Document',
	'encyclopediaArticle': 'Encyclopedia Article',
	'dictionaryEntry': 'Dictionary Entry'
};

ItemMaps.creatorMap = {
	'author': 'Author',
	'contributor': 'Contributor',
	'editor': 'Editor',
	'translator': 'Translator',
	'seriesEditor': 'Series Editor',
	'interviewee': 'Interview With',
	'interviewer': 'Interviewer',
	'director': 'Director',
	'scriptwriter': 'Scriptwriter',
	'producer': 'Producer',
	'castMember': 'Cast Member',
	'sponsor': 'Sponsor',
	'counsel': 'Counsel',
	'inventor': 'Inventor',
	'attorneyAgent': 'Attorney/Agent',
	'recipient': 'Recipient',
	'performer': 'Performer',
	'composer': 'Composer',
	'wordsBy': 'Words By',
	'cartographer': 'Cartographer',
	'programmer': 'Programmer',
	'reviewedAuthor': 'Reviewed Author',
	'artist': 'Artist',
	'commenter': 'Commenter',
	'presenter': 'Presenter',
	'guest': 'Guest',
	'podcaster': 'Podcaster'
};

ItemMaps.hideFields = ['mimeType', 'linkMode', 'charset', 'md5', 'mtime', 'version', 'key', 'collections', 'relations', 'parentItem', 'contentType', 'filename', 'tags'];

ItemMaps.noEditFields = ['accessDate', 'modified', 'filename', 'dateAdded', 'dateModified'];

ItemMaps.itemTypeImageSrc = {
	'note': 'note',
	'attachment': 'attachment-pdf',
	'attachmentPdf': 'attachment-pdf',
	'attachmentWeblink': 'attachment-web-link',
	'attachmentSnapshot': 'attachment-snapshot',
	'attachmentFile': 'attachment-file',
	'attachmentLink': 'attachment-link',
	'book': 'book',
	'bookSection': 'book_open',
	'journalArticle': 'page_white_text',
	'magazineArticle': 'layout',
	'newspaperArticle': 'newspaper',
	'thesis': 'report',
	'letter': 'email_open',
	'manuscript': 'script',
	'interview': 'comments',
	'film': 'film',
	'artwork': 'picture',
	'webpage': 'page',
	'report': 'report',
	'bill': 'page_white',
	'case': 'page_white',
	'hearing': 'page_white',
	'patent': 'page_white',
	'statute': 'page_white',
	'email': 'email',
	'map': 'map',
	'blogPost': 'layout',
	'instantMessage': 'page_white',
	'forumPost': 'page',
	'audioRecording': 'ipod',
	'presentation': 'page_white',
	'videoRecording': 'film',
	'tvBroadcast': 'television',
	'radioBroadcast': 'transmit',
	'podcast': 'ipod_cast',
	'computerProgram': 'page_white_code',
	'conferencePaper': 'treeitem-conferencePaper',
	'document': 'page_white',
	'encyclopediaArticle': 'page_white',
	'dictionaryEntry': 'page_white'
};

ItemMaps.cslNameMap = {
	'author': 'author',
	'editor': 'editor',
	'bookAuthor': 'container-author',
	'composer': 'composer',
	'interviewer': 'interviewer',
	'recipient': 'recipient',
	'seriesEditor': 'collection-editor',
	'translator': 'translator'
};

ItemMaps.cslFieldMap = {
	'title': ['title'],
	'container-title': ['publicationTitle', 'reporter', 'code'], /* reporter and code should move to SQL mapping tables */
	'collection-title': ['seriesTitle', 'series'],
	'collection-number': ['seriesNumber'],
	'publisher': ['publisher', 'distributor'], /* distributor should move to SQL mapping tables */
	'publisher-place': ['place'],
	'authority': ['court'],
	'page': ['pages'],
	'volume': ['volume'],
	'issue': ['issue'],
	'number-of-volumes': ['numberOfVolumes'],
	'number-of-pages': ['numPages'],
	'edition': ['edition'],
	'versionNumber': ['version'],
	'section': ['section'],
	'genre': ['type', 'artworkSize'], /* artworkSize should move to SQL mapping tables, or added as a CSL variable */
	'medium': ['medium', 'system'],
	'archive': ['archive'],
	'archive_location': ['archiveLocation'],
	'event': ['meetingName', 'conferenceName'], /* these should be mapped to the same base field in SQL mapping tables */
	'event-place': ['place'],
	'abstract': ['abstractNote'],
	'URL': ['url'],
	'DOI': ['DOI'],
	'ISBN': ['ISBN'],
	'call-number': ['callNumber'],
	'note': ['extra'],
	'number': ['number'],
	'references': ['history'],
	'shortTitle': ['shortTitle'],
	'journalAbbreviation': ['journalAbbreviation'],
	'language': ['language']
};

ItemMaps.cslDateMap = {
	'issued': 'date',
	'accessed': 'accessDate'
};

ItemMaps.cslTypeMap = {
	'book': 'book',
	'bookSection': 'chapter',
	'journalArticle': 'article-journal',
	'magazineArticle': 'article-magazine',
	'newspaperArticle': 'article-newspaper',
	'thesis': 'thesis',
	'encyclopediaArticle': 'entry-encyclopedia',
	'dictionaryEntry': 'entry-dictionary',
	'conferencePaper': 'paper-conference',
	'letter': 'personal_communication',
	'manuscript': 'manuscript',
	'interview': 'interview',
	'film': 'motion_picture',
	'artwork': 'graphic',
	'webpage': 'webpage',
	'report': 'report',
	'bill': 'bill',
	'case': 'legal_case',
	'hearing': 'bill', // ??
	'patent': 'patent',
	'statute': 'bill', // ??
	'email': 'personal_communication',
	'map': 'map',
	'blogPost': 'webpage',
	'instantMessage': 'personal_communication',
	'forumPost': 'webpage',
	'audioRecording': 'song', // ??
	'presentation': 'speech',
	'videoRecording': 'motion_picture',
	'tvBroadcast': 'broadcast',
	'radioBroadcast': 'broadcast',
	'podcast': 'song', // ??
	'computerProgram': 'book' // ??
};

ItemMaps.citePaperJournalArticleURL = false;

module.exports = ItemMaps;

},{"./Log.js":115}],112:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Items');

module.exports = function (jsonBody) {
	this.instance = 'Zotero.Items';
	//represent items as array for ordering purposes
	this.itemsVersion = 0;
	this.syncState = {
		earliestVersion: null,
		latestVersion: null
	};
	this.itemObjects = {};
	this.objectMap = this.itemObjects;
	this.objectArray = [];
	this.unsyncedItemKeys = [];

	if (jsonBody) {
		this.addItemsFromJson(jsonBody);
	}
};

module.exports.prototype = new Zotero.Container();

module.exports.prototype.getItem = function (key) {
	return this.getObject(key);
};

module.exports.prototype.getItems = function (keys) {
	return this.getObjects(keys);
};

module.exports.prototype.addItem = function (item) {
	this.addObject(item);
	return this;
};

module.exports.prototype.addItemsFromJson = function (jsonBody) {
	log.debug('addItemsFromJson', 3);
	var items = this;
	var parsedItemJson = jsonBody;
	var itemsAdded = [];
	parsedItemJson.forEach(function (itemObj) {
		var item = new Zotero.Item(itemObj);
		items.addItem(item);
		itemsAdded.push(item);
	});
	return itemsAdded;
};

//Remove item from local set if it has been marked as deleted by the server
module.exports.prototype.removeLocalItem = function (key) {
	return this.removeObject(key);
};

module.exports.prototype.removeLocalItems = function (keys) {
	return this.removeObjects(keys);
};

module.exports.prototype.deleteItem = function (itemKey) {
	log.debug('Zotero.Items.deleteItem', 3);
	var items = this;
	var item;

	if (!itemKey) return false;
	itemKey = items.extractKey(itemKey);
	item = items.getItem(itemKey);

	var urlconfig = {
		'target': 'item',
		'libraryType': items.owningLibrary.libraryType,
		'libraryID': items.owningLibrary.libraryID,
		'itemKey': item.key
	};
	var requestConfig = {
		url: Zotero.ajax.apiRequestString(urlconfig),
		type: 'DELETE',
		headers: { 'If-Unmodified-Since-Version': item.get('version') }
	};

	return Zotero.net.ajaxRequest(requestConfig);
};

module.exports.prototype.deleteItems = function (deleteItems, version) {
	//TODO: split into multiple requests if necessary
	log.debug('Zotero.Items.deleteItems', 3);
	var items = this;
	var deleteKeys = [];
	var i;
	if (!version && items.itemsVersion !== 0) {
		version = items.itemsVersion;
	}

	//make sure we're working with item keys, not items
	var key;
	for (i = 0; i < deleteItems.length; i++) {
		if (!deleteItems[i]) continue;
		key = items.extractKey(deleteItems[i]);
		if (key) {
			deleteKeys.push(key);
		}
	}

	//split keys into chunks of 50 per request
	var deleteChunks = items.chunkObjectsArray(deleteKeys);
	/*
 var successCallback = function(response){
 	var deleteProgress = index / deleteChunks.length;
 	Zotero.trigger("deleteProgress", {'progress': deleteProgress});
 	return response;
 };
 */
	var requestObjects = [];
	for (i = 0; i < deleteChunks.length; i++) {
		var deleteKeysString = deleteChunks[i].join(',');
		var urlconfig = {
			'target': 'items',
			'libraryType': items.owningLibrary.libraryType,
			'libraryID': items.owningLibrary.libraryID,
			'itemKey': deleteKeysString
		};
		//headers['If-Unmodified-Since-Version'] = version;

		var requestConfig = {
			url: urlconfig,
			type: 'DELETE'
		};
		requestObjects.push(requestConfig);
	}

	return Zotero.net.queueRequest(requestObjects);
};

module.exports.prototype.trashItems = function (itemsArray) {
	var items = this;
	var i;
	for (i = 0; i < itemsArray.length; i++) {
		var item = itemsArray[i];
		item.set('deleted', 1);
	}
	return items.writeItems(itemsArray);
};

module.exports.prototype.untrashItems = function (itemsArray) {
	var items = this;
	var i;
	for (i = 0; i < itemsArray.length; i++) {
		var item = itemsArray[i];
		item.set('deleted', 0);
	}
	return items.writeItems(itemsArray);
};

module.exports.prototype.findItems = function (config) {
	var items = this;
	var matchingItems = [];
	Object.keys(items.itemObjects).forEach(function (key) {
		var item = item.itemObjects[key];
		if (config.collectionKey && item.apiObj.collections.indexOf(config.collectionKey) === -1) {
			return;
		}
		matchingItems.push(items.itemObjects[key]);
	});
	return matchingItems;
};

//take an array of items and extract children into their own items
//for writing
module.exports.prototype.atomizeItems = function (itemsArray) {
	//process the array of items, pulling out child notes/attachments to write
	//separately with correct parentItem set and assign generated itemKeys to
	//new items
	var writeItems = [];
	var item;
	for (var i = 0; i < itemsArray.length; i++) {
		item = itemsArray[i];
		//generate an itemKey if the item does not already have one
		var itemKey = item.get('key');
		if (itemKey === '' || itemKey === null) {
			var newItemKey = Zotero.utils.getKey();
			item.set('key', newItemKey);
			item.set('version', 0);
		}
		//items that already have item key always in first pass, as are their children
		writeItems.push(item);
		if (item.hasOwnProperty('notes') && item.notes.length > 0) {
			for (var j = 0; j < item.notes.length; j++) {
				item.notes[j].set('parentItem', item.get('key'));
			}
			writeItems = writeItems.concat(item.notes);
		}
		if (item.hasOwnProperty('attachments') && item.attachments.length > 0) {
			for (var k = 0; k < item.attachments.length; k++) {
				item.attachments[k].set('parentItem', item.get('key'));
			}
			writeItems = writeItems.concat(item.attachments);
		}
	}
	return writeItems;
};

//accept an array of 'Zotero.Item's
module.exports.prototype.writeItems = function (itemsArray) {
	var items = this;
	var library = items.owningLibrary;
	var i;
	var writeItems = items.atomizeItems(itemsArray);

	var config = {
		'target': 'items',
		'libraryType': items.owningLibrary.libraryType,
		'libraryID': items.owningLibrary.libraryID
	};
	var requestUrl = Zotero.ajax.apiRequestString(config);

	var writeChunks = items.chunkObjectsArray(writeItems);
	var rawChunkObjects = items.rawChunks(writeChunks);

	//update item with server response if successful
	var writeItemsSuccessCallback = function writeItemsSuccessCallback(response) {
		log.debug('writeItem successCallback', 3);
		items.updateObjectsFromWriteResponse(this.writeChunk, response);
		//save updated items to IDB
		if (Zotero.config.useIndexedDB) {
			this.library.idbLibrary.updateItems(this.writeChunk);
		}

		Zotero.trigger('itemsChanged', { library: this.library });
		response.returnItems = this.writeChunk;
		return response;
	};

	log.debug('items.itemsVersion: ' + items.itemsVersion, 3);
	log.debug('items.libraryVersion: ' + items.libraryVersion, 3);

	var requestObjects = [];
	for (i = 0; i < writeChunks.length; i++) {
		var successContext = {
			writeChunk: writeChunks[i],
			library: library
		};

		var requestData = JSON.stringify(rawChunkObjects[i]);
		requestObjects.push({
			url: requestUrl,
			type: 'POST',
			data: requestData,
			processData: false,
			success: writeItemsSuccessCallback.bind(successContext)
		});
	}

	return library.sequentialRequests(requestObjects).then(function (responses) {
		log.debug('Done with writeItems sequentialRequests promise', 3);
		return responses;
	});
};

},{"./Log.js":115}],113:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Library');

/**
 * A user or group Zotero library. This is generally the top level object
 * through which interactions should happen. It houses containers for
 * Zotero API objects (collections, items, etc) and handles making requests
 * with particular API credentials, as well as storing data locally.
 * @param {string} type                 type of library, 'user' or 'group'
 * @param {int} libraryID            ID of the library
 * @param {string} libraryUrlIdentifier identifier used in urls, could be library id or user/group slug
 * @param {string} apiKey               key to use for API requests
 */
var Library = function Library(type, libraryID, libraryUrlIdentifier, apiKey) {
	log.debug('Zotero.Library constructor', 3);
	log.debug('Library Constructor: ' + type + ' ' + libraryID + ' ', 3);
	var library = this;
	log.debug(libraryUrlIdentifier, 4);
	library.instance = 'Zotero.Library';
	library.libraryVersion = 0;
	library.syncState = {
		earliestVersion: null,
		latestVersion: null
	};
	library._apiKey = apiKey || '';

	if (Zotero.config.librarySettings) {
		library.libraryBaseWebsiteUrl = Zotero.config.librarySettings.libraryPathString;
	} else {
		library.libraryBaseWebsiteUrl = Zotero.config.baseWebsiteUrl;
		if (type == 'group') {
			library.libraryBaseWebsiteUrl += 'groups/';
		}
		if (libraryUrlIdentifier) {
			this.libraryBaseWebsiteUrl += libraryUrlIdentifier + '/items';
		} else {
			log.warn('no libraryUrlIdentifier specified');
		}
	}
	//object holders within this library, whether tied to a specific library or not
	library.items = new Zotero.Items();
	library.items.owningLibrary = library;
	library.itemKeys = [];
	library.collections = new Zotero.Collections();
	library.collections.libraryUrlIdentifier = library.libraryUrlIdentifier;
	library.collections.owningLibrary = library;
	library.tags = new Zotero.Tags();
	library.searches = new Zotero.Searches();
	library.searches.owningLibrary = library;
	library.groups = new Zotero.Groups();
	library.groups.owningLibrary = library;
	library.deleted = new Zotero.Deleted();
	library.deleted.owningLibrary = library;

	if (!type) {
		//return early if library not specified
		log.warn('No type specified for library');
		return;
	}
	//attributes tying instance to a specific Zotero library
	library.type = type;
	library.libraryType = type;
	library.libraryID = libraryID;
	library.libraryString = Zotero.utils.libraryString(library.libraryType, library.libraryID);
	library.libraryUrlIdentifier = libraryUrlIdentifier;

	//initialize preferences object
	library.preferences = new Zotero.Preferences(Zotero.store, library.libraryString);

	if (typeof window === 'undefined') {
		Zotero.config.useIndexedDB = false;
		Zotero.warn('Node detected; disabling indexedDB');
	} else {
		//initialize indexedDB if we're supposed to use it
		//detect safari until they fix their shit
		var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
		var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
		var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
		var is_safari = navigator.userAgent.indexOf('Safari') > -1;
		var is_opera = navigator.userAgent.toLowerCase().indexOf('op') > -1;
		if (is_chrome && is_safari) {
			is_safari = false;
		}
		if (is_chrome && is_opera) {
			is_chrome = false;
		}
		if (is_safari) {
			Zotero.config.useIndexedDB = false;
			Zotero.warn('Safari detected; disabling indexedDB');
		}
	}

	if (Zotero.config.useIndexedDB === true) {
		log.debug('Library Constructor: indexedDB init', 3);
		var idbLibrary = new Zotero.Idb.Library(library.libraryString);
		idbLibrary.owningLibrary = this;
		library.idbLibrary = idbLibrary;
		idbLibrary.init().then(function () {
			log.debug('Library Constructor: idbInitD Done', 3);
			if (Zotero.config.preloadCachedLibrary === true) {
				log.debug('Library Constructor: preloading cached library', 3);
				var cacheLoadD = library.loadIndexedDBCache();
				cacheLoadD.then(function () {
					//TODO: any stuff that needs to execute only after cache is loaded
					//possibly fire new events to cause display to refresh after load
					log.debug('Library Constructor: Library.items.itemsVersion: ' + library.items.itemsVersion, 3);
					log.debug('Library Constructor: Library.collections.collectionsVersion: ' + library.collections.collectionsVersion, 3);
					log.debug('Library Constructor: Library.tags.tagsVersion: ' + library.tags.tagsVersion, 3);
					log.debug('Library Constructor: Triggering cachedDataLoaded', 3);
					library.trigger('cachedDataLoaded');
				}, function (err) {
					log.error('Error loading cached library');
					log.error(err);
					throw new Error('Error loading cached library');
				});
			} else {
				//trigger cachedDataLoaded since we are done with that step
				library.trigger('cachedDataLoaded');
			}
		}, function () {
			//can't use indexedDB. Set to false in config and trigger error to notify user
			Zotero.config.useIndexedDB = false;
			library.trigger('indexedDBError');
			library.trigger('cachedDataLoaded');
			log.error('Error initializing indexedDB. Promise rejected.');
			//don't re-throw error, since we can still load data from the API
		});
	}

	library.dirty = false;

	//set noop data-change callbacks
	library.tagsChanged = function () {};
	library.collectionsChanged = function () {};
	library.itemsChanged = function () {};
};
/**
 * Items columns for which sorting is supported
 * @type {Array}
 */
Library.prototype.sortableColumns = ['title', 'creator', 'itemType', 'date', 'year', 'publisher', 'publicationTitle', 'journalAbbreviation', 'language', 'accessDate', 'libraryCatalog', 'callNumber', 'rights', 'dateAdded', 'dateModified',
/*'numChildren',*/
'addedBy'
/*'modifiedBy'*/];
/**
 * Columns that can be displayed in an items table UI
 * @type {Array}
 */
Library.prototype.displayableColumns = ['title', 'creator', 'itemType', 'date', 'year', 'publisher', 'publicationTitle', 'journalAbbreviation', 'language', 'accessDate', 'libraryCatalog', 'callNumber', 'rights', 'dateAdded', 'dateModified', 'numChildren', 'addedBy'
/*'modifiedBy'*/];
/**
 * Items columns that only apply to group libraries
 * @type {Array}
 */
Library.prototype.groupOnlyColumns = ['addedBy'
/*'modifiedBy'*/];

/**
 * Sort function that converts strings to locale lower case before comparing,
 * however this is still not particularly effective at getting correct localized
 * sorting in modern browsers due to browser implementations being poor. What we
 * really want here is to strip diacritics first.
 * @param  {string} a [description]
 * @param  {string} b [description]
 * @return {int}   [description]
 */
Library.prototype.comparer = function () {
	if (Intl) {
		return new Intl.Collator().compare;
	} else {
		return function (a, b) {
			if (a.toLocaleLowerCase() == b.toLocaleLowerCase()) {
				return 0;
			}
			if (a.toLocaleLowerCase() < b.toLocaleLowerCase()) {
				return -1;
			}
			return 1;
		};
	}
};

//Zotero library wrapper around jQuery ajax that returns a jQuery promise
//@url String url to request or object for input to apiRequestUrl and query string
//@type request method
//@options jquery options that are not the default for Zotero requests
Library.prototype.ajaxRequest = function (url, type, options) {
	log.debug('Library.ajaxRequest', 3);
	if (!type) {
		type = 'GET';
	}
	if (!options) {
		options = {};
	}
	var requestObject = {
		url: url,
		type: type
	};
	requestObject = Z.extend({}, requestObject, options);
	log.debug(requestObject, 3);
	return Zotero.net.queueRequest(requestObject);
};

//Take an array of objects that specify Zotero API requests and perform them
//in sequence.
//return deferred that gets resolved when all requests have gone through.
//Update versions after each request, otherwise subsequent writes won't go through.
//or do we depend on specified callbacks to update versions if necessary?
//fail on error?
//request object must specify: url, method, body, headers, success callback, fail callback(?)

/**
 * Take an array of objects that specify Zotero API requests and perform them
 * in sequence. Return a promise that gets resolved when all requests have
 * gone through.
 * @param  {[] Objects} requests Array of objects specifying requests to be made
 * @return {Promise}          Promise that resolves/rejects along with requests
 */
Library.prototype.sequentialRequests = function (requests) {
	log.debug('Zotero.Library.sequentialRequests', 3);
	var library = this;
	return Zotero.net.queueRequest(requests);
};

/**
 * Generate a website url based on a dictionary of variables and the configured
 * libraryBaseWebsiteUrl
 * @param  {Object} urlvars Dictionary of key/value variables
 * @return {string}         website url
 */
Library.prototype.websiteUrl = function (urlvars) {
	log.debug('Zotero.library.websiteUrl', 3);
	log.debug(urlvars, 4);
	var library = this;

	var urlVarsArray = [];
	Object.keys(urlvars).forEach(function (key) {
		var value = urlvars[key];
		if (value === '') return;
		urlVarsArray.push(key + '/' + value);
	});
	urlVarsArray.sort();
	log.debug(urlVarsArray, 4);
	var pathVarsString = urlVarsArray.join('/');

	return library.libraryBaseWebsiteUrl + '/' + pathVarsString;
};

Library.prototype.synchronize = function () {
	//get updated group metadata if applicable
	//  (this is an individual library method, so only necessary if this is
	//  a group library and we want to keep info about it)
	//sync library data
	//  get updated collections versions newer than current library version
	//  get updated searches versions newer than current library version
	//  get updated item versions newer than current library version
	//
};

/**
 * Make and process API requests to update the local library items based on the
 * versions we have locally. When the promise is resolved, we should have up to
 * date items in this library's items container, as well as saved to indexedDB
 * if configured to use it.
 * @return {Promise} Promise
 */
Library.prototype.loadUpdatedItems = function () {
	log.debug('Zotero.Library.loadUpdatedItems', 3);
	var library = this;
	//sync from the libraryVersion if it exists, otherwise use the itemsVersion, which is likely
	//derived from the most recent version of any individual item we have.
	var syncFromVersion = library.libraryVersion ? library.libraryVersion : library.items.itemsVersion;
	return Promise.resolve(library.updatedVersions('items', syncFromVersion)).then(function (response) {
		log.debug('itemVersions resolved', 3);
		log.debug('items Last-Modified-Version: ' + response.lastModifiedVersion, 3);
		library.items.updateSyncState(response.lastModifiedVersion);

		var itemVersions = response.data;
		library.itemVersions = itemVersions;
		var itemKeys = [];
		Object.keys(itemVersions).forEach(function (key) {
			var val = itemVersions[key];
			var item = library.items.getItem(key);
			if (!item || item.apiObj.key != val) {
				itemKeys.push(key);
			}
		});
		return library.loadItemsFromKeys(itemKeys);
	}).then(function (responses) {
		log.debug('loadItemsFromKeys resolved', 3);
		library.items.updateSyncedVersion();

		//TODO: library needs its own state
		var displayParams = Zotero.state.getUrlVars();
		library.buildItemDisplayView(displayParams);
		//save updated items to IDB
		if (Zotero.config.useIndexedDB) {
			var saveItemsD = library.idbLibrary.updateItems(library.items.objectArray);
		}
	});
};

Library.prototype.loadUpdatedCollections = function () {
	log.debug('Zotero.Library.loadUpdatedCollections', 3);
	var library = this;
	//sync from the libraryVersion if it exists, otherwise use the collectionsVersion, which is likely
	//derived from the most recent version of any individual collection we have.
	log.debug('library.collections.collectionsVersion:' + library.collections.collectionsVersion, 4);
	var syncFromVersion = library.libraryVersion ? library.libraryVersion : library.collections.collectionsVersion;
	//we need modified collectionKeys regardless, so load them
	return library.updatedVersions('collections', syncFromVersion).then(function (response) {
		log.debug('collectionVersions finished', 3);
		log.debug('Collections Last-Modified-Version: ' + response.lastModifiedVersion, 3);
		//start the syncState version tracking. This should be the earliest version throughout
		library.collections.updateSyncState(response.lastModifiedVersion);

		var collectionVersions = response.data;
		library.collectionVersions = collectionVersions;
		var collectionKeys = [];
		Object.keys(collectionVersions).forEach(function (key) {
			var val = collectionVersions[key];
			var c = library.collections.getCollection(key);
			if (!c || c.apiObj.version != val) {
				collectionKeys.push(key);
			}
		});
		if (collectionKeys.length === 0) {
			log.debug('No collectionKeys need updating. resolving', 3);
			return response;
		} else {
			log.debug('fetching collections by key', 3);
			return library.loadCollectionsFromKeys(collectionKeys).then(function () {
				var collections = library.collections;
				collections.initSecondaryData();

				log.debug('All updated collections loaded', 3);
				library.collections.updateSyncedVersion();
				//TODO: library needs its own state
				var displayParams = Zotero.state.getUrlVars();
				//save updated collections to cache
				log.debug('loadUpdatedCollections complete - saving collections to cache before resolving', 3);
				log.debug('collectionsVersion: ' + library.collections.collectionsVersion, 3);
				//library.saveCachedCollections();
				//save updated collections to IDB
				if (Zotero.config.useIndexedDB) {
					return library.idbLibrary.updateCollections(collections.collectionsArray);
				}
			});
		}
	}).then(function () {
		log.debug('done getting collection data. requesting deleted data', 3);
		return library.getDeleted(library.libraryVersion);
	}).then(function (response) {
		log.debug('got deleted collections data: removing local copies', 3);
		log.debug(library.deleted, 3);
		if (library.deleted.deletedData.collections && library.deleted.deletedData.collections.length > 0) {
			library.collections.removeLocalCollections(library.deleted.deletedData.collections);
		}
	});
};

Library.prototype.loadUpdatedTags = function () {
	log.debug('Zotero.Library.loadUpdatedTags', 3);
	var library = this;
	log.debug('tagsVersion: ' + library.tags.tagsVersion, 3);
	return Promise.resolve(library.loadAllTags({ since: library.tags.tagsVersion })).then(function () {
		log.debug('done getting tags, request deleted tags data', 3);
		return library.getDeleted(library.libraryVersion);
	}).then(function (response) {
		log.debug('got deleted tags data', 3);
		if (library.deleted.deletedData.tags && library.deleted.deletedData.tags.length > 0) {
			library.tags.removeTags(library.deleted.deletedData.tags);
		}
		//save updated tags to IDB
		if (Zotero.config.useIndexedDB) {
			log.debug('saving updated tags to IDB', 3);
			var saveTagsD = library.idbLibrary.updateTags(library.tags.tagsArray);
		}
	});
};

Library.prototype.getDeleted = function (version) {
	log.debug('Zotero.Library.getDeleted', 3);
	var library = this;
	var urlconf = {
		target: 'deleted',
		libraryType: library.libraryType,
		libraryID: library.libraryID,
		since: version
	};

	//if there is already a request working, create a new promise to resolve
	//when the actual request finishes
	if (library.deleted.pending) {
		log.debug('getDeleted resolving with previously pending promise', 3);
		return Promise.resolve(library.deleted.pendingPromise);
	}

	//don't fetch again if version we'd be requesting is between
	//deleted.newer and delete.deleted versions, just use that one
	log.debug('version:' + version, 3);
	log.debug('sinceVersion:' + library.deleted.sinceVersion, 3);
	log.debug('untilVersion:' + library.deleted.untilVersion, 3);

	if (library.deleted.untilVersion && version >= library.deleted.sinceVersion /*&&
                                                                             version < library.deleted.untilVersion*/) {
			log.debug('deletedVersion matches requested: immediately resolving', 3);
			return Promise.resolve(library.deleted.deletedData);
		}

	library.deleted.pending = true;
	library.deleted.pendingPromise = library.ajaxRequest(urlconf).then(function (response) {
		log.debug('got deleted response', 3);
		library.deleted.deletedData = response.data;
		log.debug('Deleted Last-Modified-Version:' + response.lastModifiedVersion, 3);
		library.deleted.untilVersion = response.lastModifiedVersion;
		library.deleted.sinceVersion = version;
	}).then(function (response) {
		log.debug('cleaning up deleted pending', 3);
		library.deleted.pending = false;
		library.deleted.pendingPromise = false;
	});

	return library.deleted.pendingPromise;
};

Library.prototype.processDeletions = function (deletions) {
	var library = this;
	//process deleted collections
	library.collections.processDeletions(deletions.collections);
	//process deleted items
	library.items.processDeletions(deletions.items);
};

//Get a full bibliography from the API for web based citating
Library.prototype.loadFullBib = function (itemKeys, style) {
	var library = this;
	var itemKeyString = itemKeys.join(',');
	var urlconfig = {
		'target': 'items',
		'libraryType': library.libraryType,
		'libraryID': library.libraryID,
		'itemKey': itemKeyString,
		'format': 'bib',
		'linkwrap': '1'
	};
	if (itemKeys.length == 1) {
		urlconfig.target = 'item';
	}
	if (style) {
		urlconfig['style'] = style;
	}

	var loadBibPromise = library.ajaxRequest(urlconfig).then(function (response) {
		return response.data;
	});

	return loadBibPromise;
};

//load bib for a single item from the API
Library.prototype.loadItemBib = function (itemKey, style) {
	log.debug('Zotero.Library.loadItemBib', 3);
	var library = this;
	var urlconfig = {
		'target': 'item',
		'libraryType': library.libraryType,
		'libraryID': library.libraryID,
		'itemKey': itemKey,
		'content': 'bib'
	};
	if (style) {
		urlconfig['style'] = style;
	}

	var itemBibPromise = library.ajaxRequest(urlconfig).then(function (response) {
		var item = new Zotero.Item(response.data);
		var bibContent = item.apiObj.bib;
		return bibContent;
	});

	return itemBibPromise;
};

//load library settings from Zotero API and return a promise that gets resolved with
//the Zotero.Preferences object for this library
Library.prototype.loadSettings = function () {
	log.debug('Zotero.Library.loadSettings', 3);
	var library = this;
	var urlconfig = {
		'target': 'settings',
		'libraryType': library.libraryType,
		'libraryID': library.libraryID
	};

	return library.ajaxRequest(urlconfig).then(function (response) {
		var resultObject;
		if (typeof response.data == 'string') {
			resultObject = JSON.parse(response.data);
		} else {
			resultObject = response.data;
		}
		//save the full settings object so we have it available if we need to write,
		//even if it has settings we don't use or know about
		library.preferences.setPref('settings', resultObject);

		//pull out the settings we know we care about so we can query them directly
		if (resultObject.tagColors) {
			var tagColors = resultObject.tagColors.value;
			library.preferences.setPref('tagColors', tagColors);
			/*
   for(var i = 0; i < tagColors.length; i++){
   	var t = library.tags.getTag(tagColors[i].name);
   	if(t){
   		t.color = tagColors[i].color;
   	}
   }
   */
		}

		library.trigger('settingsLoaded');
		return library.preferences;
	});
};

//take an array of tags and return subset of tags that should be colored, along with
//the colors they should be
Library.prototype.matchColoredTags = function (tags) {
	var library = this;
	var i;
	var tagColorsSettings = library.preferences.getPref('tagColors');
	if (!tagColorsSettings) return [];

	var tagColorsMap = {};
	for (i = 0; i < tagColorsSettings.length; i++) {
		tagColorsMap[tagColorsSettings[i].name.toLowerCase()] = tagColorsSettings[i].color;
	}
	var resultTags = [];

	for (i = 0; i < tags.length; i++) {
		if (tagColorsMap.hasOwnProperty(tags[i])) {
			resultTags.push(tagColorsMap[tags[i]]);
		}
	}
	return resultTags;
};

/**
 * Duplicate existing Items from this library and save to foreignLibrary
 * with relationships indicating the ties. At time of writing, Zotero client
 * saves the relationship with either the destination group of two group
 * libraries or the personal library.
 * @param  {Zotero.Item[]} items
 * @param  {Zotero.Library} foreignLibrary
 * @return {Promise.Zotero.Item[]} - newly created items
 */
Library.prototype.sendToLibrary = function (items, foreignLibrary) {
	var foreignItems = [];
	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		var transferData = item.emptyJsonItem();
		transferData.data = Z.extend({}, items[i].apiObj.data);
		//clear data that shouldn't be transferred:itemKey, collections
		transferData.data.key = '';
		transferData.data.version = 0;
		transferData.data.collections = [];
		delete transferData.data.dateModified;
		delete transferData.data.dateAdded;

		var newForeignItem = new Zotero.Item(transferData);

		newForeignItem.pristine = Z.extend({}, newForeignItem.apiObj);
		newForeignItem.initSecondaryData();

		//set relationship to tie to old item
		if (!newForeignItem.apiObj.data.relations) {
			newForeignItem.apiObj.data.relations = {};
		}
		newForeignItem.apiObj.data.relations['owl:sameAs'] = Zotero.url.relationUrl(item.owningLibrary.libraryType, item.owningLibrary.libraryID, item.key);
		foreignItems.push(newForeignItem);
	}
	return foreignLibrary.items.writeItems(foreignItems);
};

/*METHODS FOR WORKING WITH THE ENTIRE LIBRARY -- NOT FOR GENERAL USE */

//sync pull:
//upload changed data
// get updatedVersions for collections
// get updatedVersions for searches
// get upatedVersions for items
// (sanity check versions we have for individual objects?)
// loadCollectionsFromKeys
// loadSearchesFromKeys
// loadItemsFromKeys
// process updated objects:
//      ...
// getDeletedData
// process deleted
// checkConcurrentUpdates (compare Last-Modified-Version from collections?newer request to one from /deleted request)

Library.prototype.updatedVersions = function () {
	var target = arguments.length <= 0 || arguments[0] === undefined ? 'items' : arguments[0];
	var version = arguments.length <= 1 || arguments[1] === undefined ? this.libraryVersion : arguments[1];

	log.debug('Library.updatedVersions', 3);
	var library = this;
	var urlconf = {
		target: target,
		format: 'versions',
		libraryType: library.libraryType,
		libraryID: library.libraryID,
		since: version
	};
	return library.ajaxRequest(urlconf);
};

//Download and save information about every item in the library
//keys is an array of itemKeys from this library that we need to download
Library.prototype.loadItemsFromKeys = function (keys) {
	log.debug('Zotero.Library.loadItemsFromKeys', 3);
	var library = this;
	return library.loadFromKeys(keys, 'items');
};

//keys is an array of collectionKeys from this library that we need to download
Library.prototype.loadCollectionsFromKeys = function (keys) {
	log.debug('Zotero.Library.loadCollectionsFromKeys', 3);
	var library = this;
	return library.loadFromKeys(keys, 'collections');
};

//keys is an array of searchKeys from this library that we need to download
Library.prototype.loadSeachesFromKeys = function (keys) {
	log.debug('Zotero.Library.loadSearchesFromKeys', 3);
	var library = this;
	return library.loadFromKeys(keys, 'searches');
};

Library.prototype.loadFromKeys = function (keys, objectType) {
	log.debug('Zotero.Library.loadFromKeys', 3);
	if (!objectType) objectType = 'items';
	var library = this;
	var keyslices = [];
	while (keys.length > 0) {
		keyslices.push(keys.splice(0, 50));
	}

	var requestObjects = [];
	keyslices.forEach(function (keyslice) {
		var keystring = keyslice.join(',');
		switch (objectType) {
			case 'items':
				requestObjects.push({
					url: {
						'target': 'items',
						'targetModifier': null,
						'itemKey': keystring,
						'limit': 50,
						'libraryType': library.libraryType,
						'libraryID': library.libraryID
					},
					type: 'GET',
					success: library.processLoadedItems.bind(library)
				});
				break;
			case 'collections':
				requestObjects.push({
					url: {
						'target': 'collections',
						'targetModifier': null,
						'collectionKey': keystring,
						'limit': 50,
						'libraryType': library.libraryType,
						'libraryID': library.libraryID
					},
					type: 'GET',
					success: library.processLoadedCollections.bind(library)
				});
				break;
			case 'searches':
				requestObjects.push({
					url: {
						'target': 'searches',
						'targetModifier': null,
						'searchKey': keystring,
						'limit': 50,
						'libraryType': library.libraryType,
						'libraryID': library.libraryID
					},
					type: 'GET'
					//success: library.processLoadedSearches.bind(library)
				});
				break;
		}
	});

	var promises = [];
	for (var i = 0; i < requestObjects.length; i++) {
		promises.push(Zotero.net.queueRequest(requestObjects[i]));
	}
	return Promise.all(promises);
	/*
 return Zotero.net.queueRequest(requestObjects);
 */
};

//publishes: displayedItemsUpdated
//assume we have up to date information about items in indexeddb.
//build a list of indexedDB filter requests to then intersect to get final result
Library.prototype.buildItemDisplayView = function (params) {
	log.debug('Zotero.Library.buildItemDisplayView', 3);
	log.debug(params, 4);
	//start with list of all items if we don't have collectionKey
	//otherwise get the list of items in that collection
	var library = this;
	//short-circuit if we don't have an initialized IDB yet
	if (!library.idbLibrary.db) {
		return Promise.resolve([]);
	}

	var filterPromises = [];
	if (params.collectionKey) {
		if (params.collectionKey == 'trash') {
			filterPromises.push(library.idbLibrary.filterItems('deleted', 1));
		} else {
			filterPromises.push(library.idbLibrary.filterItems('collectionKeys', params.collectionKey));
		}
	} else {
		filterPromises.push(library.idbLibrary.getOrderedItemKeys('title'));
	}

	//filter by selected tags
	var selectedTags = params.tag || [];
	if (typeof selectedTags == 'string') selectedTags = [selectedTags];
	for (var i = 0; i < selectedTags.length; i++) {
		log.debug('adding selected tag filter', 3);
		filterPromises.push(library.idbLibrary.filterItems('itemTagStrings', selectedTags[i]));
	}

	//TODO: filter by search term.
	//(need full text array or to decide what we're actually searching on to implement this locally)

	//when all the filters have been applied, combine and sort
	return Promise.all(filterPromises).then(function (results) {
		var i;
		for (i = 0; i < results.length; i++) {
			log.debug('result from filterPromise: ' + results[i].length, 3);
			log.debug(results[i], 3);
		}
		var finalItemKeys = library.idbLibrary.intersectAll(results);
		var itemsArray = library.items.getItems(finalItemKeys);

		log.debug('All filters applied - Down to ' + itemsArray.length + ' items displayed', 3);

		log.debug('remove child items and, if not viewing trash, deleted items', 3);
		var displayItemsArray = [];
		for (i = 0; i < itemsArray.length; i++) {
			if (itemsArray[i].apiObj.data.parentItem) {
				continue;
			}

			if (params.collectionKey != 'trash' && itemsArray[i].apiObj.deleted) {
				continue;
			}

			displayItemsArray.push(itemsArray[i]);
		}

		//sort displayedItemsArray by given or configured column
		var orderCol = params['order'] || 'title';
		var sort = params['sort'] || 'asc';
		log.debug('Sorting by ' + orderCol + ' - ' + sort, 3);

		var comparer = Zotero.Library.prototype.comparer();

		displayItemsArray.sort(function (a, b) {
			var aval = a.get(orderCol);
			var bval = b.get(orderCol);

			return comparer(aval, bval);
		});

		if (sort == 'desc') {
			log.debug('sort is desc - reversing array', 4);
			displayItemsArray.reverse();
		}

		//publish event signalling we're done
		log.debug('triggering publishing displayedItemsUpdated', 3);
		library.trigger('displayedItemsUpdated');
		return displayItemsArray;
	});
};

Library.prototype.trigger = function (eventType, data) {
	var library = this;
	Zotero.trigger(eventType, data, library.libraryString);
};

Library.prototype.listen = function (events, handler, data) {
	var library = this;
	var filter = library.libraryString;
	Zotero.listen(events, handler, data, filter);
};

//CollectionFunctions
Library.prototype.processLoadedCollections = function (response) {
	log.debug('processLoadedCollections', 3);
	var library = this;

	//clear out display items
	log.debug('adding collections to library.collections', 3);
	var collectionsAdded = library.collections.addCollectionsFromJson(response.data);
	for (var i = 0; i < collectionsAdded.length; i++) {
		collectionsAdded[i].associateWithLibrary(library);
	}
	//update sync state
	library.collections.updateSyncState(response.lastModifiedVersion);

	Zotero.trigger('loadedCollectionsProcessed', { library: library, collectionsAdded: collectionsAdded });
	return response;
};

//create+write a collection given a name and optional parentCollectionKey
Library.prototype.addCollection = function (name, parentCollection) {
	log.debug('Zotero.Library.addCollection', 3);
	var library = this;

	var collection = new Zotero.Collection();
	collection.associateWithLibrary(library);
	collection.set('name', name);
	collection.set('parentCollection', parentCollection);

	return library.collections.writeCollections([collection]);
};

//ItemFunctions
//make request for item keys and return jquery ajax promise
Library.prototype.fetchItemKeys = function () {
	var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	log.debug('Zotero.Library.fetchItemKeys', 3);
	var library = this;
	var urlconfig = Z.extend(true, {
		'target': 'items',
		'libraryType': this.libraryType,
		'libraryID': this.libraryID,
		'format': 'keys'
	}, config);

	return library.ajaxRequest(urlconfig);
};

//get keys of all items marked for deletion
Library.prototype.getTrashKeys = function () {
	log.debug('Zotero.Library.getTrashKeys', 3);
	var library = this;
	var urlconfig = {
		'target': 'items',
		'libraryType': library.libraryType,
		'libraryID': library.libraryID,
		'format': 'keys',
		'collectionKey': 'trash'
	};

	return library.ajaxRequest(urlconfig);
};

Library.prototype.emptyTrash = function () {
	log.debug('Zotero.Library.emptyTrash', 3);
	var library = this;
	return library.getTrashKeys().then(function (response) {
		var trashedItemKeys = response.data.split('\n');
		return library.items.deleteItems(trashedItemKeys, response.lastModifiedVersion);
	});
};

Library.prototype.loadItemKeys = function (config) {
	log.debug('Zotero.Library.loadItemKeys', 3);
	var library = this;
	return this.fetchItemKeys(config).then(function (response) {
		log.debug('loadItemKeys proxied callback', 3);
		var keys = response.data.split(/[\s]+/);
		library.itemKeys = keys;
	});
};

Library.prototype.loadItems = function (config) {
	log.debug('Zotero.Library.loadItems', 3);
	var library = this;
	if (!config) {
		config = {};
	}

	var defaultConfig = {
		target: 'items',
		targetModifier: 'top',
		start: 0,
		limit: 25,
		order: Zotero.config.defaultSortColumn,
		sort: Zotero.config.defaultSortOrder
	};

	//Build config object that should be displayed next and compare to currently displayed
	var newConfig = Z.extend({}, defaultConfig, config);
	//newConfig.start = parseInt(newConfig.limit, 10) * (parseInt(newConfig.itemPage, 10) - 1);

	var urlconfig = Z.extend({
		'target': 'items',
		'libraryType': library.libraryType,
		'libraryID': library.libraryID
	}, newConfig);
	var requestUrl = Zotero.ajax.apiRequestString(urlconfig);

	return library.ajaxRequest(requestUrl).then(function (response) {
		log.debug('loadItems proxied callback', 3);
		//var library = this;
		var items = library.items;
		//clear out display items
		var loadedItemsArray = items.addItemsFromJson(response.data);
		for (var i = 0; i < loadedItemsArray.length; i++) {
			loadedItemsArray[i].associateWithLibrary(library);
		}

		response.loadedItems = loadedItemsArray;
		Zotero.trigger('itemsChanged', { library: library });
		return response;
	});
};

Library.prototype.loadPublications = function (config) {
	log.debug('Zotero.Library.loadPublications', 3);
	var library = this;
	if (!config) {
		config = {};
	}

	var defaultConfig = {
		target: 'publications',
		start: 0,
		limit: 50,
		order: Zotero.config.defaultSortColumn,
		sort: Zotero.config.defaultSortOrder,
		include: 'bib'
	};

	//Build config object that should be displayed next and compare to currently displayed
	var newConfig = Z.extend({}, defaultConfig, config);

	var urlconfig = Z.extend({
		'target': 'publications',
		'libraryType': library.libraryType,
		'libraryID': library.libraryID
	}, newConfig);
	var requestUrl = Zotero.ajax.apiRequestString(urlconfig);

	return library.ajaxRequest(requestUrl).then(function (response) {
		log.debug('loadPublications proxied callback', 3);
		var publicationItems = [];
		var parsedItemJson = response.data;
		parsedItemJson.forEach(function (itemObj) {
			var item = new Zotero.Item(itemObj);
			publicationItems.push(item);
		});

		response.publicationItems = publicationItems;
		return response;
	});
};

Library.prototype.processLoadedItems = function (response) {
	log.debug('processLoadedItems', 3);
	var library = this;
	var items = library.items;
	//clear out display items
	var loadedItemsArray = items.addItemsFromJson(response.data);
	for (var i = 0; i < loadedItemsArray.length; i++) {
		loadedItemsArray[i].associateWithLibrary(library);
	}

	//update sync state
	library.items.updateSyncState(response.lastModifiedVersion);

	Zotero.trigger('itemsChanged', { library: library, loadedItems: loadedItemsArray });
	return response;
};

Library.prototype.loadItem = function (itemKey) {
	log.debug('Zotero.Library.loadItem', 3);
	var library = this;
	if (!config) {
		var config = {};
	}

	var urlconfig = {
		'target': 'item',
		'libraryType': library.libraryType,
		'libraryID': library.libraryID,
		'itemKey': itemKey
	};

	return library.ajaxRequest(urlconfig).then(function (response) {
		log.debug('Got loadItem response', 3);
		var item = new Zotero.Item(response.data);
		item.owningLibrary = library;
		library.items.itemObjects[item.key] = item;
		Zotero.trigger('itemsChanged', { library: library });
		return item;
	}, function (response) {
		log.warn('Error loading Item');
	});
};

Library.prototype.trashItem = function (itemKey) {
	var library = this;
	return library.items.trashItems([library.items.getItem(itemKey)]);
};

Library.prototype.untrashItem = function (itemKey) {
	log.debug('Zotero.Library.untrashItem', 3);
	if (!itemKey) return false;

	var item = this.items.getItem(itemKey);
	item.apiObj.deleted = 0;
	return item.writeItem();
};

Library.prototype.deleteItem = function (itemKey) {
	log.debug('Zotero.Library.deleteItem', 3);
	var library = this;
	return library.items.deleteItem(itemKey);
};

Library.prototype.deleteItems = function (itemKeys) {
	log.debug('Zotero.Library.deleteItems', 3);
	var library = this;
	return library.items.deleteItems(itemKeys);
};

Library.prototype.addNote = function (itemKey, note) {
	log.debug('Zotero.Library.prototype.addNote', 3);
	var library = this;
	var config = {
		'target': 'children',
		'libraryType': library.libraryType,
		'libraryID': library.libraryID,
		'itemKey': itemKey
	};

	var requestUrl = Zotero.ajax.apiRequestString(config);
	var item = this.items.getItem(itemKey);

	return library.ajaxRequest(requestUrl, 'POST', { processData: false });
};

Library.prototype.fetchGlobalItems = function (config) {
	log.debug('Zotero.Library.fetchGlobalItems', 3);
	var library = this;
	if (!config) {
		config = {};
	}

	var defaultConfig = {
		target: 'items',
		start: 0,
		limit: 25
	};

	//Build config object that should be displayed next and compare to currently displayed
	var newConfig = Z.extend({}, defaultConfig, config);
	//newConfig.start = parseInt(newConfig.limit, 10) * (parseInt(newConfig.itemPage, 10) - 1);

	var urlconfig = Z.extend({ 'target': 'items', 'libraryType': '' }, newConfig);
	var requestUrl = Zotero.ajax.apiRequestString(urlconfig);

	return library.ajaxRequest(requestUrl, 'GET', { dataType: 'json' }).then(function (response) {
		log.debug('globalItems callback', 3);
		return response.data;
	});
};

Library.prototype.fetchGlobalItem = function (globalKey) {
	log.debug('Zotero.Library.fetchGlobalItem', 3);
	log.debug(globalKey, 3);
	var library = this;

	var defaultConfig = { target: 'item' };

	//Build config object that should be displayed next and compare to currently displayed
	var newConfig = Z.extend({}, defaultConfig);
	var urlconfig = Z.extend({
		'target': 'item',
		'libraryType': '',
		'itemKey': globalKey
	}, newConfig);
	var requestUrl = Zotero.ajax.apiRequestString(urlconfig);

	return library.ajaxRequest(requestUrl, 'GET', { dataType: 'json' }).then(function (response) {
		log.debug('globalItem callback', 3);
		return response.data;
	});
};

//TagFunctions
Library.prototype.fetchTags = function (config) {
	log.debug('Zotero.Library.fetchTags', 3);
	var library = this;
	var defaultConfig = {
		target: 'tags',
		order: 'title',
		sort: 'asc',
		limit: 100
	};
	var newConfig = Z.extend({}, defaultConfig, config);
	var urlconfig = Z.extend({
		'target': 'tags',
		'libraryType': this.libraryType,
		'libraryID': this.libraryID
	}, newConfig);

	return Zotero.ajaxRequest(urlconfig);
};

Library.prototype.loadTags = function () {
	var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	log.debug('Zotero.Library.loadTags', 3);
	var library = this;

	if (config.showAutomaticTags && config.collectionKey) {
		delete config.collectionKey;
	}

	library.tags.displayTagsArray = [];
	return library.fetchTags(config).then(function (response) {
		log.debug('loadTags proxied callback', 3);
		var updatedVersion = response.lastModifiedVersion;
		library.tags.updateSyncState(updatedVersion);
		var addedTags = library.tags.addTagsFromJson(response.data);
		library.tags.updateTagsVersion(updatedVersion);
		library.tags.rebuildTagsArray();

		if (response.parsedLinks.hasOwnProperty('next')) {
			library.tags.hasNextLink = true;
			library.tags.nextLink = response.parsedLinks['next'];
		} else {
			library.tags.hasNextLink = false;
			library.tags.nextLink = null;
		}
		library.trigger('tagsChanged', { library: library });
		return library.tags;
	});
};

Library.prototype.loadAllTags = function () {
	var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	log.debug('Zotero.Library.loadAllTags', 3);
	var library = this;
	var defaultConfig = {
		target: 'tags',
		order: 'title',
		sort: 'asc',
		limit: 100,
		libraryType: library.libraryType,
		libraryID: library.libraryID
	};

	//Build config object that should be displayed next and compare to currently displayed
	var newConfig = Z.extend({}, defaultConfig, config);
	var urlconfig = Z.extend({}, newConfig);
	var requestUrl = Zotero.ajax.apiRequestString(urlconfig);
	var tags = library.tags;

	//check if already loaded tags are okay to use
	var loadedConfig = Z.extend({}, defaultConfig, tags.loadedConfig);
	var loadedConfigRequestUrl = tags.loadedRequestUrl;
	log.debug('requestUrl: ' + requestUrl, 4);
	log.debug('loadedConfigRequestUrl: ' + loadedConfigRequestUrl, 4);
	return new Promise(function (resolve, reject) {
		var continueLoadingCallback = function continueLoadingCallback(tags) {
			log.debug('loadAllTags continueLoadingCallback', 3);
			var plainList = Zotero.Tags.prototype.plainTagsList(tags.tagsArray);
			plainList.sort(Library.prototype.comparer());
			tags.plainList = plainList;

			if (tags.hasNextLink) {
				log.debug('still has next link.', 3);
				tags.tagsArray.sort(Zotero.Tag.prototype.tagComparer());
				plainList = Zotero.Tags.prototype.plainTagsList(tags.tagsArray);
				plainList.sort(Library.prototype.comparer());
				tags.plainList = plainList;

				var nextLink = tags.nextLink;
				var nextLinkConfig = Zotero.utils.parseQuery(Zotero.utils.querystring(nextLink));
				var newConfig = Z.extend({}, config);
				newConfig.start = nextLinkConfig.start;
				newConfig.limit = nextLinkConfig.limit;
				return library.loadTags(newConfig).then(continueLoadingCallback);
			} else {
				log.debug('no next in tags link', 3);
				tags.updateSyncedVersion();
				tags.tagsArray.sort(Zotero.Tag.prototype.tagComparer());
				plainList = Zotero.Tags.prototype.plainTagsList(tags.tagsArray);
				plainList.sort(Library.prototype.comparer());
				tags.plainList = plainList;
				log.debug('resolving loadTags deferred', 3);
				library.tagsLoaded = true;
				library.tags.loaded = true;
				tags.loadedConfig = config;
				tags.loadedRequestUrl = requestUrl;

				//update all tags with tagsVersion
				for (var i = 0; i < library.tags.tagsArray.length; i++) {
					tags.tagsArray[i].apiObj.version = tags.tagsVersion;
				}

				library.trigger('tagsChanged', { library: library });
				return tags;
			}
		};

		resolve(library.loadTags(urlconfig).then(continueLoadingCallback));
	});
};

//LibraryCache
//load objects from indexedDB
Library.prototype.loadIndexedDBCache = function () {
	log.debug('Zotero.Library.loadIndexedDBCache', 3);

	var library = this;

	var itemsPromise = library.idbLibrary.getAllItems();
	var collectionsPromise = library.idbLibrary.getAllCollections();
	var tagsPromise = library.idbLibrary.getAllTags();

	itemsPromise.then(function (itemsArray) {
		log.debug('loadIndexedDBCache itemsD done', 3);
		//create itemsDump from array of item objects
		var latestItemVersion = 0;
		for (var i = 0; i < itemsArray.length; i++) {
			var item = new Zotero.Item(itemsArray[i]);
			library.items.addItem(item);
			if (item.version > latestItemVersion) {
				latestItemVersion = item.version;
			}
		}
		library.items.itemsVersion = latestItemVersion;

		//TODO: add itemsVersion as last version in any of these items?
		//or store it somewhere else for indexedDB cache purposes
		library.items.loaded = true;
		log.debug('Done loading indexedDB items promise into library', 3);
	});

	collectionsPromise.then(function (collectionsArray) {
		log.debug('loadIndexedDBCache collectionsD done', 3);
		//create collectionsDump from array of collection objects
		var latestCollectionVersion = 0;
		for (var i = 0; i < collectionsArray.length; i++) {
			var collection = new Zotero.Collection(collectionsArray[i]);
			library.collections.addCollection(collection);
			if (collection.version > latestCollectionVersion) {
				latestCollectionVersion = collection.version;
			}
		}
		library.collections.collectionsVersion = latestCollectionVersion;

		//TODO: add collectionsVersion as last version in any of these items?
		//or store it somewhere else for indexedDB cache purposes
		library.collections.initSecondaryData();
		library.collections.loaded = true;
	});

	tagsPromise.then(function (tagsArray) {
		log.debug('loadIndexedDBCache tagsD done', 3);
		log.debug(tagsArray, 4);
		//create tagsDump from array of tag objects
		var latestVersion = 0;
		var tagsVersion = 0;
		for (var i = 0; i < tagsArray.length; i++) {
			var tag = new Zotero.Tag(tagsArray[i]);
			library.tags.addTag(tag);
			if (tagsArray[i].version > latestVersion) {
				latestVersion = tagsArray[i].version;
			}
		}
		tagsVersion = latestVersion;
		library.tags.tagsVersion = tagsVersion;

		//TODO: add tagsVersion as last version in any of these items?
		//or store it somewhere else for indexedDB cache purposes
		library.tags.loaded = true;
	});

	//resolve the overall deferred when all the child deferreds are finished
	return Promise.all([itemsPromise, collectionsPromise, tagsPromise]);
};

Library.prototype.saveIndexedDB = function () {
	var library = this;

	var saveItemsPromise = library.idbLibrary.updateItems(library.items.itemsArray);
	var saveCollectionsPromise = library.idbLibrary.updateCollections(library.collections.collectionsArray);
	var saveTagsPromise = library.idbLibrary.updateTags(library.tags.tagsArray);

	//resolve the overall deferred when all the child deferreds are finished
	return Promise.all([saveItemsPromise, saveCollectionsPromise, saveTagsPromise]);
};

module.exports = Library;

},{"./Log.js":115}],114:[function(require,module,exports){
'use strict';

var ItemMaps = require('./ItemMaps.js');

module.exports.fieldMap = ItemMaps.fieldMap;
module.exports.typeMap = ItemMaps.typeMap;
module.exports.creatorMap = ItemMaps.creatorMap;

},{"./ItemMaps.js":111}],115:[function(require,module,exports){
'use strict';

var log = {};

var prefLevel = 1;

var debugOut;
var warnOut;
var errorOut;

if (typeof console == 'undefined') {
	debugOut = function debugOut() {};
	warnOut = function warnOut() {};
	errorOut = function errorOut() {};
} else {
	debugOut = function debugOut(s) {
		console.log(s);
	};
	warnOut = function warnOut(s) {
		console.warn(s);
	};
	errorOut = function errorOut(s) {
		console.error(s);
	};
}

log.SetLevel = function (level) {
	prefLevel = level;
};

log.debug = function (debugstring, level) {
	if (typeof level !== 'number') {
		level = 1;
	}
	if (level <= prefLevel) {
		debugOut(debugstring);
	}
};

log.debugObject = function (obj, level) {
	if (typeof level !== 'number') {
		level = 1;
	}
	if (level <= prefLevel) {
		debugOut(obj);
	}
};

log.warn = function (warnstring) {
	warnOut(warnstring);
};

log.error = function (errorstring) {
	errorOut(errorstring);
};

log.Logger = function (prefix) {
	var llevel = arguments.length <= 1 || arguments[1] === undefined ? 3 : arguments[1];

	prefLevel = llevel;
	return {
		debug: function debug(debugstring, level) {
			if (typeof debugstring == 'string') {
				return log.debug(prefix + ': ' + debugstring, level);
			} else {
				log.debug(prefix + ': \\', level);
				log.debug(debugstring, level);
				return;
			}
		},
		warn: function warn(warnstring) {
			return log.warn(prefix + ': ' + warnstring);
		},
		error: function error(errorstring) {
			return log.error(prefix + ': ' + errorstring);
		}
	};
};

module.exports = log;

},{}],116:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var log = require('./Log.js').Logger('libZotero:Net');

var Deferred = require('deferred');
/*
 * Make concurrent and sequential network requests, respecting backoff/retry-after
 * headers, and keeping concurrent requests below a certain limit.
 * 
 * Push onto the queue individual or arrays of requestConfig objects
 * If there is room for requests and we are not currently backing off:
 *   start a sequential series, or individual request
 * When any request or set of requests finishes, we preprocess the response,
 * looking for backoff/retry-after to obey, and putting sequential responses
 * into an array. We then trigger the next waiting request.
 * 
 */

var Net = function Net() {
	this.deferredQueue = [];
	this.numRunning = 0;
	this.numConcurrent = 3;
	this.backingOff = false;
};

Net.prototype.queueDeferred = function () {
	var net = this;
	var d = new Deferred();
	net.deferredQueue.push(d);
	return Promise.resolve(d);
};

Net.prototype.queueRequest = function (requestObject) {
	log.debug('Zotero.Net.queueRequest', 3);
	var net = this;
	var resultPromise;

	if (Array.isArray(requestObject)) {
		resultPromise = net.queueDeferred().then(function () {
			log.debug('running sequential after queued deferred resolved', 4);
			return net.runSequential(requestObject);
		}).then(function (response) {
			log.debug('runSequential done', 3);
			net.queuedRequestDone();
			return response;
		});
	} else {
		resultPromise = net.queueDeferred().then(function () {
			log.debug('running concurrent after queued deferred resolved', 4);
			return net.runConcurrent(requestObject);
		}).then(function (response) {
			log.debug('done with queuedRequest', 4);
			net.queuedRequestDone();
			return response;
		});
	}

	net.runNext();
	return resultPromise.catch(function (error) {
		log.error('Error before leaving Zotero.Net');
		log.error(error);
	});
};

Net.prototype.runConcurrent = function (requestObject) {
	log.debug('Zotero.Net.runConcurrent', 3);
	return this.ajaxRequest(requestObject).then(function (response) {
		log.debug('done with runConcurrent request', 3);
		return response;
	});
};

//run the set of requests serially
//chaining each request onto the .then of the previous one, after
//adding the previous response to a responses array that will be
//returned via promise to the caller when all requests are complete
Net.prototype.runSequential = function (requestObjects) {
	log.debug('Zotero.Net.runSequential', 3);
	var net = this;
	var responses = [];
	var seqPromise = Promise.resolve();

	for (var i = 0; i < requestObjects.length; i++) {
		var requestObject = requestObjects[i];
		seqPromise = seqPromise.then(function () {
			var p = net.ajaxRequest(requestObject).then(function (response) {
				log.debug('pushing sequential response into result array', 3);
				responses.push(response);
			});
			return p;
		});
	}

	return seqPromise.then(function () {
		log.debug('done with sequential aggregator promise - returning responses', 4);
		return responses;
	});
};

//when one concurrent call, or a sequential series finishes, subtract it from the running
//count and run the next if there is something waiting to be run
Net.prototype.individualRequestDone = function (response) {
	log.debug('Zotero.Net.individualRequestDone', 3);
	var net = this;

	//check if we need to back off before making more requests
	var wait = net.checkDelay(response);
	if (wait > 0) {
		var waitms = wait * 1000;
		net.backingOff = true;
		var waitExpiration = Date.now() + waitms;
		if (waitExpiration > net.waitingExpires) {
			net.waitingExpires = waitExpiration;
		}
		setTimeout(net.runNext, waitms);
	}

	return response;
};

Net.prototype.queuedRequestDone = function (response) {
	log.debug('queuedRequestDone', 3);
	var net = this;
	net.numRunning--;
	net.runNext();
	return response;
};

Net.prototype.runNext = function () {
	log.debug('Zotero.Net.runNext', 3);
	var net = this;
	var nowms = Date.now();

	//check if we're backing off and need to remain backing off,
	//or if we should now continue
	if (net.backingOff && net.waitingExpires > nowms - 100) {
		log.debug('currently backing off', 3);
		var waitms = net.waitingExpires - nowms;
		setTimeout(net.runNext, waitms);
		return;
	} else if (net.backingOff && net.waitingExpires <= nowms - 100) {
		net.backingOff = false;
	}

	//continue making requests up to the concurrent limit
	log.debug(net.numRunning + '/' + net.numConcurrent + ' Running. ' + net.deferredQueue.length + ' queued.', 3);
	while (net.deferredQueue.length > 0 && net.numRunning < net.numConcurrent) {
		net.numRunning++;
		var nextD = net.deferredQueue.shift();
		nextD.resolve();
		log.debug(net.numRunning + '/' + net.numConcurrent + ' Running. ' + net.deferredQueue.length + ' queued.', 3);
	}
};

Net.prototype.checkDelay = function (response) {
	log.debug('Zotero.Net.checkDelay', 4);
	var net = this;
	var wait = 0;
	if (Array.isArray(response)) {
		for (var i = 0; i < response.length; i++) {
			var iwait = net.checkDelay(response[i]);
			if (iwait > wait) {
				wait = iwait;
			}
		}
	} else {
		if (response.status == 429) {
			wait = response.retryAfter;
		} else if (response.backoff) {
			wait = response.backoff;
		}
	}
	return wait;
};

Net.prototype.ajaxRequest = function (requestConfig) {
	log.debug('Zotero.Net.ajaxRequest', 3);
	var net = this;
	var defaultConfig = {
		type: 'GET',
		headers: {
			'Zotero-API-Version': Zotero.config.apiVersion,
			'Content-Type': 'application/json'
		},
		success: function success(response) {
			return response;
		},
		error: function error(response) {
			log.error('ajaxRequest rejected:' + response.jqxhr.status + ' - ' + response.jqxhr.responseText);
			return response;
		}
		//cache:false
	};
	var headers = Z.extend({}, defaultConfig.headers, requestConfig.headers);
	var config = Z.extend({}, defaultConfig, requestConfig);
	config.headers = headers;
	if (_typeof(config.url) == 'object') {
		config.url = Zotero.ajax.apiRequestString(config.url);
	}
	config.url = Zotero.ajax.proxyWrapper(config.url, config.type);

	if (!config.url) {
		throw 'No url specified in Zotero.Net.ajaxRequest';
	}
	//rename success/error callbacks so J.ajax does not actually use them
	//and we can use them as es6 promise result functions with expected
	//single value arguments
	config.zsuccess = config.success;
	config.zerror = config.error;
	delete config.success;
	delete config.error;

	log.debug('AJAX config', 4);
	log.debug(config, 4);
	var ajaxpromise = new Promise(function (resolve, reject) {
		net.ajax(config).then(function (request) {
			var data;

			if (request.responseType == 'json' || request.responseType === '' && request.getResponseHeader('content-type') === 'application/json') {
				try {
					data = JSON.parse(request.response);
				} catch (err) {
					data = request.response;
				}
			} else {
				data = request.response;
			}

			var r = new Zotero.ApiResponse({
				jqxhr: request,
				data: data,
				textStatus: request.responseText
			});
			resolve(r);
		}, function (request) {
			var r = new Zotero.ApiResponse({
				jqxhr: request,
				textStatus: request.responseText,
				isError: true
			});
			reject(r);
		});
	}).then(net.individualRequestDone.bind(net)).then(function (response) {
		//now that we're done handling, reject
		if (response.isError) {
			log.error('re-throwing ApiResponse that was a rejection');
			throw response;
		}
		return response;
	}).then(config.zsuccess, config.zerror);

	return ajaxpromise;
};

Net.prototype.ajax = function (config) {
	config = Zotero.extend({ type: 'GET' }, config);
	var promise = new Promise(function (resolve, reject) {
		var req = new XMLHttpRequest();
		var uri = config.url;
		req.open(config.type, uri);

		if (config.headers) {
			Object.keys(config.headers).forEach(function (key) {
				var val = config.headers[key];
				req.setRequestHeader(key, val);
			});
		}

		req.send(config.data);

		req.onload = function () {
			log.debug('XMLHttpRequest done', 4);
			log.debug(req, 4);
			if (req.status >= 200 && req.status < 300) {
				log.debug('200-300 response: resolving Net.ajax promise', 3);
				// Performs the function "resolve" when this.status is equal to 2xx
				resolve(req);
			} else {
				log.debug('not 200-300 response: rejecting Net.ajax promise', 3);
				// Performs the function "reject" when this.status is different than 2xx
				reject(req);
			}
		};
		req.onerror = function () {
			reject(req);
		};
	});

	return promise;
};

module.exports = new Net();

},{"./Log.js":115,"deferred":31}],117:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var log = require('./Log.js').Logger('libZotero:Preferences');

module.exports = function (store, idString) {
	this.store = store;
	this.idString = idString;
	this.preferencesObject = {};
	this.defaults = {
		debug_level: 3, //lower level is higher priority
		debug_log: true,
		debug_mock: false,
		listDisplayedFields: ['title', 'creator', 'dateModified'],
		showAutomaticTags: false, //tagType:1 is automatic, tagType:0 was added by user
		itemsPerPage: 25,
		order: 'title',
		title: 'asc'
	};
	this.load();
};

module.exports.prototype.setPref = function (key, value) {
	var preferences = this;
	preferences.preferencesObject[key] = value;
	preferences.persist();
};

module.exports.prototype.setPrefs = function (newPrefs) {
	var preferences = this;
	if ((typeof newPrefs === 'undefined' ? 'undefined' : _typeof(newPrefs)) != 'object') {
		throw new Error('Preferences must be an object');
	}
	preferences.preferencesObject = newPrefs;
	preferences.persist();
};

module.exports.prototype.getPref = function (key) {
	var preferences = this;
	if (preferences.preferencesObject[key]) {
		return preferences.preferencesObject[key];
	} else if (preferences.defaults[key]) {
		return preferences.defaults[key];
	} else {
		return null;
	}
};

module.exports.prototype.getPrefs = function () {
	var preferences = this;
	return preferences.preferencesObject;
};

module.exports.prototype.persist = function () {
	var preferences = this;
	var storageString = 'preferences_' + preferences.idString;
	preferences.store[storageString] = JSON.stringify(preferences.preferencesObject);
};

module.exports.prototype.load = function () {
	var preferences = this;
	var storageString = 'preferences_' + preferences.idString;
	var storageObjectString = preferences.store[storageString];
	if (!storageObjectString) {
		preferences.preferencesObject = {};
	} else {
		preferences.preferencesObject = JSON.parse(storageObjectString);
	}
};

},{"./Log.js":115}],118:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Search');

module.exports = function () {
	this.instance = 'Zotero.Search';
	this.searchObject = {};
};

},{"./Log.js":115}],119:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Searches');

module.exports = function () {
	this.instance = 'Zotero.Searches';
	this.searchObjects = {};
	this.syncState = {
		earliestVersion: null,
		latestVersion: null
	};
};

},{"./Log.js":115}],120:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var log = require('./Log.js').Logger('libZotero:Tag');

module.exports = function (tagObj) {
	this.instance = 'Zotero.Tag';
	this.color = null;
	this.version = 0;
	if ((typeof tagObj === 'undefined' ? 'undefined' : _typeof(tagObj)) == 'object') {
		this.parseJsonTag(tagObj);
	} else if (typeof tagObj == 'string') {
		this.parseJsonTag(this.templateApiObj(tagObj));
	} else {
		this.parseJsonTag(this.tamplateApiObj(''));
	}
};

module.exports.prototype = new Zotero.ApiObject();

module.exports.prototype.parseJsonTag = function (tagObj) {
	var tag = this;
	tag.apiObj = Z.extend({}, tagObj);
	tag.urlencodedtag = encodeURIComponent(tag.apiObj.tag);
	tag.version = tag.apiObj.version;
};

module.exports.prototype.templateApiObj = function (tagString) {
	return {
		tag: tagString,
		links: {},
		meta: {
			type: 0,
			numItems: 1
		}
	};
};

module.exports.prototype.tagComparer = function () {
	if (Intl) {
		var collator = new Intl.Collator();
		return function (a, b) {
			return collator.compare(a.apiObj.tag, b.apiObj.tag);
		};
	} else {
		return function (a, b) {
			if (a.apiObj.tag.toLocaleLowerCase() == b.apiObj.tag.toLocaleLowerCase()) {
				return 0;
			}
			if (a.apiObj.tag.toLocaleLowerCase() < b.apiObj.tag.toLocaleLowerCase()) {
				return -1;
			}
			return 1;
		};
	}
};

module.exports.prototype.set = function (key, val) {
	var tag = this;

	if (key in tag.apiObj) {
		tag.apiObj[key] = val;
	}
	if (key in tag.apiObj.meta) {
		tag.apiObj.meta[key] = val;
	}

	switch (key) {
		case 'tagVersion':
		case 'version':
			tag.version = val;
			tag.apiObj.version = val;
			break;
	}

	return tag;
};

},{"./Log.js":115}],121:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Tags');

module.exports = function (jsonBody) {
	this.instance = 'Zotero.Tags';
	//represent collections as array for ordering purposes
	this.tagsVersion = 0;
	this.syncState = {
		earliestVersion: null,
		latestVersion: null
	};
	this.displayTagsArray = [];
	this.displayTagsUrl = '';
	this.tagObjects = {};
	this.tagsArray = [];
	this.loaded = false;
	if (jsonBody) {
		this.addTagsFromJson(jsonBody);
	}
};

module.exports.prototype = new Zotero.Container();

module.exports.prototype.addTag = function (tag) {
	var tags = this;
	tags.tagObjects[tag.apiObj.tag] = tag;
	tags.tagsArray.push(tag);
	if (tags.owningLibrary) {
		tag.associateWithLibrary(tags.owningLibrary);
	}
};

module.exports.prototype.getTag = function (tagname) {
	var tags = this;
	if (tags.tagObjects.hasOwnProperty(tagname)) {
		return this.tagObjects[tagname];
	}
	return null;
};

module.exports.prototype.removeTag = function (tagname) {
	var tags = this;
	delete tags.tagObjects[tagname];
	tags.updateSecondaryData();
};

module.exports.prototype.removeTags = function (tagnames) {
	var tags = this;
	tagnames.forEach(function (tagname) {
		delete tags.tagObjects[tagname];
	});
	tags.updateSecondaryData();
};

module.exports.prototype.plainTagsList = function (tagsArray) {
	log.debug('Zotero.Tags.plainTagsList', 3);
	var plainList = [];
	tagsArray.forEach(function (tag) {
		plainList.push(tag.apiObj.tag);
	});
	return plainList;
};

module.exports.prototype.clear = function () {
	log.debug('Zotero.Tags.clear', 3);
	this.tagsVersion = 0;
	this.syncState.earliestVersion = null;
	this.syncState.latestVersion = null;
	this.displayTagsArray = [];
	this.displayTagsUrl = '';
	this.tagObjects = {};
	this.tagsArray = [];
};

module.exports.prototype.updateSecondaryData = function () {
	log.debug('Zotero.Tags.updateSecondaryData', 3);
	var tags = this;
	tags.tagsArray = [];
	Object.keys(tags.tagObjects).forEach(function (key) {
		var val = tags.tagObjects[key];
		tags.tagsArray.push(val);
	});
	tags.tagsArray.sort(Zotero.Tag.prototype.tagComparer());
	var plainList = tags.plainTagsList(tags.tagsArray);
	plainList.sort(Zotero.Library.prototype.comparer());
	tags.plainList = plainList;
};

module.exports.prototype.updateTagsVersion = function (tagsVersion) {
	var tags = this;
	Object.keys(tags.tagObjects).forEach(function (key) {
		var tag = tags.tagObjects[key];
		tag.set('version', tagsVersion);
	});
};

module.exports.prototype.rebuildTagsArray = function () {
	var tags = this;
	tags.tagsArray = [];
	Object.keys(tags.tagObjects).forEach(function (key) {
		var tag = tags.tagObjects[key];
		tags.tagsArray.push(tag);
	});
};

module.exports.prototype.addTagsFromJson = function (jsonBody) {
	log.debug('Zotero.Tags.addTagsFromJson', 3);
	var tags = this;
	var tagsAdded = [];
	jsonBody.forEach(function (tagObj) {
		var tag = new Zotero.Tag(tagObj);
		tags.addTag(tag);
		tagsAdded.push(tag);
	});
	return tagsAdded;
};

},{"./Log.js":115}],122:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Url');

// Url.js - construct certain urls and links locally that may depend on the
// current website's routing scheme etc. Not necessarily pointing to zotero.org
// - href for a particular item's local representation
// - link with appropriate text, to download file or view framed snapshot
// - href for file download/view, depending on whether config says to download
// directly from the api, or to proxy it
// - displayable string describing the attachment file (attachmentFileDetails)
// - list of urls for supported export formats
//

var Url = {};

//locally construct a url for the item on the current website
Url.itemHref = function (item) {
	var href = '';
	href += Zotero.config.librarySettings.libraryPathString + '/itemKey/' + item.get('key');
	return href;
};

//construct a download link for an item's enclosure file that takes into
//account size and whether the file is a snapshot
Url.attachmentDownloadLink = function (item) {
	var retString = '';
	var downloadUrl = item.attachmentDownloadUrl;
	var contentType = item.get('contentType');

	if (item.apiObj.links && item.apiObj.links['enclosure']) {
		if (!item.apiObj.links['enclosure']['length'] && item.isSnapshot()) {
			//snapshot: redirect to view
			retString += '<a href="' + downloadUrl + '">' + 'View Snapshot</a>';
		} else {
			//file: offer download
			var enctype = Zotero.utils.translateMimeType(item.apiObj.links['enclosure'].type);
			var enc = item.apiObj.links['enclosure'];
			var filesize = parseInt(enc['length'], 10);
			var filesizeString = '' + filesize + ' B';
			if (filesize > 1073741824) {
				filesizeString = '' + (filesize / 1073741824).toFixed(1) + ' GB';
			} else if (filesize > 1048576) {
				filesizeString = '' + (filesize / 1048576).toFixed(1) + ' MB';
			} else if (filesize > 1024) {
				filesizeString = '' + (filesize / 1024).toFixed(1) + ' KB';
			}
			log.debug(enctype, 3);
			retString += '<a href="' + downloadUrl + '">';
			if (enctype == 'undefined' || enctype === '' || typeof enctype == 'undefined') {
				retString += filesizeString + '</a>';
			} else {
				retString += enctype + ', ' + filesizeString + '</a>';
			}
			return retString;
		}
	}
	return retString;
};

Url.attachmentDownloadUrl = function (item) {
	if (item.apiObj.links && item.apiObj.links['enclosure']) {
		if (Zotero.config.proxyDownloads) {
			//we have a proxy for downloads at baseDownloadUrl so just pass an itemkey to that
			return Url.wwwDownloadUrl(item);
		} else {
			return Url.apiDownloadUrl(item);
		}
	}
	return false;
};

Url.apiDownloadUrl = function (item) {
	if (item.apiObj.links['enclosure']) {
		return item.apiObj.links['enclosure']['href'];
	}
	return false;
};

Url.proxyDownloadUrl = function (item) {
	if (item.apiObj.links['enclosure']) {
		if (Zotero.config.proxyDownloads) {
			return Zotero.config.baseDownloadUrl + '?itemkey=' + item.get('key');
		} else {
			return Url.apiDownloadUrl(item);
		}
	} else {
		return false;
	}
};

Url.wwwDownloadUrl = function (item) {
	if (item.apiObj.links['enclosure']) {
		return Zotero.config.baseZoteroWebsiteUrl + Zotero.config.librarySettings.libraryPathString + '/' + item.get('key') + '/file/view';
	} else {
		return false;
	}
};

Url.publicationsDownloadUrl = function (item) {
	if (item.apiObj.links['enclosure']) {
		return item.apiObj.links['enclosure']['href'];
	}
	return false;
};

Url.attachmentFileDetails = function (item) {
	//file: offer download
	if (!item.apiObj.links['enclosure']) return '';
	var enctype = Zotero.utils.translateMimeType(item.apiObj.links['enclosure'].type);
	var enc = item.apiObj.links['enclosure'];
	var filesizeString = '';
	if (enc['length']) {
		var filesize = parseInt(enc['length'], 10);
		filesizeString = '' + filesize + ' B';
		if (filesize > 1073741824) {
			filesizeString = '' + (filesize / 1073741824).toFixed(1) + ' GB';
		} else if (filesize > 1048576) {
			filesizeString = '' + (filesize / 1048576).toFixed(1) + ' MB';
		} else if (filesize > 1024) {
			filesizeString = '' + (filesize / 1024).toFixed(1) + ' KB';
		}
		return '(' + enctype + ', ' + filesizeString + ')';
	} else {
		return '(' + enctype + ')';
	}
};

Url.userWebLibrary = function (slug) {
	return [Zotero.config.baseWebsiteUrl, slug, 'items'].join('/');
};

Url.groupWebLibrary = function (group) {
	if (group.type == 'Private') {
		return [Zotero.config.baseWebsiteUrl, 'groups', group.get('id'), 'items'].join('/');
	} else {
		return [Zotero.config.baseWebsiteUrl, 'groups', Zotero.utils.slugify(group.get('name')), 'items'].join('/');
	}
};

Url.exportUrls = function (config) {
	log.debug('Zotero.url.exportUrls', 3);
	var exportUrls = {};
	var exportConfig = {};
	Zotero.config.exportFormats.forEach(function (format) {
		exportConfig = Z.extend(config, { 'format': format });
		exportUrls[format] = Zotero.ajax.apiRequestUrl(exportConfig) + Zotero.ajax.apiQueryString({ format: format, limit: '25' });
	});
	return exportUrls;
};

Url.relationUrl = function (libraryType, libraryID, itemKey) {
	return 'http://zotero.org/' + libraryType + 's/' + libraryID + '/items/' + itemKey;
};

module.exports = Url;

},{"./Log.js":115}],123:[function(require,module,exports){
'use strict';

module.exports = function () {
	this.instance = 'Zotero.User';
};
module.exports.prototype = new Zotero.ApiObject();
module.exports.prototype.loadObject = function (ob) {
	this.title = ob.title;
	this.author = ob.author;
	this.tagID = ob.tagID;
	this.published = ob.published;
	this.updated = ob.updated;
	this.links = ob.links;
	this.numItems = ob.numItems;
	this.items = ob.items;
	this.tagType = ob.tagType;
	this.modified = ob.modified;
	this.added = ob.added;
	this.key = ob.key;
};

module.exports.prototype.parseXmlUser = function (tel) {
	this.parseXmlEntry(tel);

	var tagEl = tel.find('content>tag');
	if (tagEl.length !== 0) {
		this.tagKey = tagEl.attr('key'); // find("zapi\\:itemID").text();
		this.libraryID = tagEl.attr('libraryID');
		this.tagName = tagEl.attr('name');
		this.dateAdded = tagEl.attr('dateAdded');
		this.dateModified = tagEl.attr('dateModified');
	}
};

},{}],124:[function(require,module,exports){
'use strict';

var log = require('./Log.js').Logger('libZotero:Utils');

var Utils = {
	randomString: function randomString(len, chars) {
		if (!chars) {
			chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		}
		if (!len) {
			len = 8;
		}
		var randomstring = '';
		for (var i = 0; i < len; i++) {
			var rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum, rnum + 1);
		}
		return randomstring;
	},

	getKey: function getKey() {
		var baseString = '23456789ABCDEFGHIJKMNPQRSTUVWXZ';
		return Utils.randomString(8, baseString);
	},

	slugify: function slugify(name) {
		var slug = name.trim();
		slug = slug.toLowerCase();
		slug = slug.replace(/[^a-z0-9 ._-]/g, '');
		slug = slug.replace(/\s/g, '_');

		return slug;
	},

	prependAutocomplete: function prependAutocomplete(pre, source) {
		log.debug('Zotero.utils.prependAutocomplete', 3);
		log.debug('prepend match: ' + pre, 4);
		var satisfy;
		if (!source) {
			log.warn('source is not defined');
		}
		if (pre === '') {
			satisfy = source.slice(0);
			return satisfy;
		}
		var plen = pre.length;
		var plower = pre.toLowerCase();
		satisfy = source.map(function (n) {
			if (n.substr(0, plen).toLowerCase() == plower) {
				return n;
			} else {
				return null;
			}
		});
		return satisfy;
	},

	matchAnyAutocomplete: function matchAnyAutocomplete(pre, source) {
		log.debug('Zotero.utils.matchAnyAutocomplete', 3);
		log.debug('matchAny match: ' + pre, 4);
		var satisfy;
		if (!source) {
			log.warn('source is not defined');
		}
		if (pre === '') {
			satisfy = source.slice(0);
			return satisfy;
		}
		var plower = pre.toLowerCase();
		satisfy = source.map(function (n) {
			if (n.toLowerCase().indexOf(plower) != -1) {
				return n;
			} else {
				return null;
			}
		});
		return satisfy;
	},

	libraryString: function libraryString(type, libraryID) {
		var lstring = '';
		if (type == 'user') lstring = 'u';else if (type == 'group') lstring = 'g';else if (type == 'publications') lstring = 'p';
		lstring += libraryID;
		return lstring;
	},

	parseLibString: function parseLibString(libraryString) {
		var type;
		var libraryID;
		if (libraryString.charAt(0) == 'u') {
			type = 'user';
		} else if (libraryString.charAt(0) == 'g') {
			type = 'group';
		} else if (libraryString.charAt(0) == 'p') {
			type = 'publications';
		} else {
			throw new Error('unexpected type character in libraryString');
		}
		libraryID = parseInt(libraryString.substring(1), 10);
		if (isNaN(libraryID)) {
			throw new Error('NaN libraryID');
		}
		return { libraryType: type, libraryID: libraryID };
	},

	//return true if retrieved more than lifetime minutes ago
	stale: function stale(retrievedDate, lifetime) {
		var now = Date.now(); //current local time
		var elapsed = now.getTime() - retrievedDate.getTime();
		if (elapsed / 60000 > lifetime) {
			return true;
		}
		return false;
	},

	entityify: function entityify(str) {
		var character = {
			'<': '&lt;',
			'>': '&gt;',
			'&': '&amp;',
			'"': '&quot;'
		};
		return str.replace(/[<>&"]/g, function (c) {
			return character[c];
		});
	},

	parseApiDate: function parseApiDate(datestr) {
		//var parsems = Date.parse(datestr);

		var re = /([0-9]+)-([0-9]+)-([0-9]+)T([0-9]+):([0-9]+):([0-9]+)Z/;
		var matches = re.exec(datestr);
		if (matches === null) {
			log.debug('error parsing api date: ' + datestr, 2);
			return null;
		} else {
			var date = new Date(Date.UTC(matches[1], matches[2] - 1, matches[3], matches[4], matches[5], matches[6]));
			return date;
		}
	},

	readCookie: function readCookie(name) {
		var nameEQ = name + '=';
		var ca = document.cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1, c.length);
			}if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
		}
		return null;
	},

	/**
  * Translate common mimetypes to user friendly versions
  *
  * @param string $mimeType
  * @return string
  */
	translateMimeType: function translateMimeType(mimeType) {
		switch (mimeType) {
			case 'text/html':
				return 'html';

			case 'application/pdf':
			case 'application/x-pdf':
			case 'application/acrobat':
			case 'applications/vnd.pdf':
			case 'text/pdf':
			case 'text/x-pdf':
				return 'pdf';

			case 'image/jpg':
			case 'image/jpeg':
				return 'jpg';

			case 'image/gif':
				return 'gif';

			case 'application/msword':
			case 'application/doc':
			case 'application/vnd.msword':
			case 'application/vnd.ms-word':
			case 'application/winword':
			case 'application/word':
			case 'application/x-msw6':
			case 'application/x-msword':
				return 'doc';

			case 'application/vnd.oasis.opendocument.text':
			case 'application/x-vnd.oasis.opendocument.text':
				return 'odt';

			case 'video/flv':
			case 'video/x-flv':
				return 'flv';

			case 'image/tif':
			case 'image/tiff':
			case 'image/x-tif':
			case 'image/x-tiff':
			case 'application/tif':
			case 'application/x-tif':
			case 'application/tiff':
			case 'application/x-tiff':
				return 'tiff';

			case 'application/zip':
			case 'application/x-zip':
			case 'application/x-zip-compressed':
			case 'application/x-compress':
			case 'application/x-compressed':
			case 'multipart/x-zip':
				return 'zip';

			case 'video/quicktime':
			case 'video/x-quicktime':
				return 'mov';

			case 'video/avi':
			case 'video/msvideo':
			case 'video/x-msvideo':
				return 'avi';

			case 'audio/wav':
			case 'audio/x-wav':
			case 'audio/wave':
				return 'wav';

			case 'audio/aiff':
			case 'audio/x-aiff':
			case 'sound/aiff':
				return 'aiff';

			case 'text/plain':
				return 'plain text';
			case 'application/rtf':
				return 'rtf';

			default:
				return mimeType;
		}
	},

	/**
  * Get the permissions a key has for a library
  * if no key is passed use the currently set key for the library
  *
  * @param int|string $userID
  * @param string $key
  * @return array $keyPermissions
  */
	getKeyPermissions: function getKeyPermissions(userID, key) {
		if (!userID) {
			return false;
		}

		if (!key) {
			return false;
		}

		var urlconfig = { 'target': 'key', 'libraryType': 'user', 'libraryID': userID, 'apiKey': key };
		var requestUrl = Zotero.ajax.apiRequestString(urlconfig);

		return Zotero.ajaxRequest(requestUrl).then(function (response) {
			var keyObject = JSON.parse(response.data);
			return keyObject;
		});
	},

	/**
  * Given a query string, parse keys/values into an object
  **/
	parseQuery: function parseQuery(query) {
		log.debug('parseQuery');
		log.debug(query);
		var params = {};
		var match;
		var pl = /\+/g; // Regex for replacing addition symbol with a space
		var search = /([^&=]+)=?([^&]*)/g;
		var decode = function decode(s) {
			return decodeURIComponent(s.replace(pl, ' '));
		};

		while (match = search.exec(query)) {
			params[decode(match[1])] = decode(match[2]);
		}
		return params;
	},

	buildQuery: function buildQuery() {
		var params = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		var q = '?';
		for (var p in params) {
			q += '&' + encodeURIComponent(p) + '=' + encodeURIComponent(params[p]);
		}
		return q;
	},

	//extract the section of a url between ? and #
	querystring: function querystring(href) {
		if (href.indexOf('?') == -1) {
			return '';
		}
		var hashindex = href.indexOf('#') != -1 ? href.indexOf('#') : undefined;
		var q = href.substring(href.indexOf('?') + 1, hashindex);
		return q;
	}
};

module.exports = Utils;

},{"./Log.js":115}]},{},[1])(1)
});


//# sourceMappingURL=libzoterojs.js.map
