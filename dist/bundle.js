/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/backo2/index.js":
/*!**************************************!*\
  !*** ./node_modules/backo2/index.js ***!
  \**************************************/
/***/ ((module) => {


/**
 * Expose `Backoff`.
 */

module.exports = Backoff;

/**
 * Initialize backoff timer with `opts`.
 *
 * - `min` initial timeout in milliseconds [100]
 * - `max` max timeout [10000]
 * - `jitter` [0]
 * - `factor` [2]
 *
 * @param {Object} opts
 * @api public
 */

function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 10000;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}

/**
 * Return the backoff duration.
 *
 * @return {Number}
 * @api public
 */

Backoff.prototype.duration = function(){
  var ms = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var rand =  Math.random();
    var deviation = Math.floor(rand * this.jitter * ms);
    ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
  }
  return Math.min(ms, this.max) | 0;
};

/**
 * Reset the number of attempts.
 *
 * @api public
 */

Backoff.prototype.reset = function(){
  this.attempts = 0;
};

/**
 * Set the minimum duration
 *
 * @api public
 */

Backoff.prototype.setMin = function(min){
  this.ms = min;
};

/**
 * Set the maximum duration
 *
 * @api public
 */

Backoff.prototype.setMax = function(max){
  this.max = max;
};

/**
 * Set the jitter
 *
 * @api public
 */

Backoff.prototype.setJitter = function(jitter){
  this.jitter = jitter;
};



/***/ }),

/***/ "./node_modules/base64-arraybuffer/lib/base64-arraybuffer.js":
/*!*******************************************************************!*\
  !*** ./node_modules/base64-arraybuffer/lib/base64-arraybuffer.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, exports) => {

/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
(function(chars){
  "use strict";

  exports.encode = function(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
    i, len = bytes.length, base64 = "";

    for (i = 0; i < len; i+=3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
  };

  exports.decode =  function(base64) {
    var bufferLength = base64.length * 0.75,
    len = base64.length, i, p = 0,
    encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i+=4) {
      encoded1 = chars.indexOf(base64[i]);
      encoded2 = chars.indexOf(base64[i+1]);
      encoded3 = chars.indexOf(base64[i+2]);
      encoded4 = chars.indexOf(base64[i+3]);

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
  };
})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");


/***/ }),

/***/ "./node_modules/component-emitter/index.js":
/*!*************************************************!*\
  !*** ./node_modules/component-emitter/index.js ***!
  \*************************************************/
/***/ ((module) => {


/**
 * Expose `Emitter`.
 */

if (true) {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }

  // Remove event specific arrays for event types that no
  // one is subscribed for to avoid memory leak.
  if (callbacks.length === 0) {
    delete this._callbacks['$' + event];
  }

  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};

  var args = new Array(arguments.length - 1)
    , callbacks = this._callbacks['$' + event];

  for (var i = 1; i < arguments.length; i++) {
    args[i - 1] = arguments[i];
  }

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};


/***/ }),

/***/ "./node_modules/debug/node_modules/ms/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/debug/node_modules/ms/index.js ***!
  \*****************************************************/
/***/ ((module) => {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}


/***/ }),

/***/ "./node_modules/debug/src/browser.js":
/*!*******************************************!*\
  !*** ./node_modules/debug/src/browser.js ***!
  \*******************************************/
/***/ ((module, exports, __webpack_require__) => {

/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug');
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = __webpack_require__(/*! ./common */ "./node_modules/debug/src/common.js")(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};


/***/ }),

/***/ "./node_modules/debug/src/common.js":
/*!******************************************!*\
  !*** ./node_modules/debug/src/common.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = __webpack_require__(/*! ms */ "./node_modules/debug/node_modules/ms/index.js");
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;
		let namespacesCache;
		let enabledCache;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return '%';
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => {
				if (enableOverride !== null) {
					return enableOverride;
				}
				if (namespacesCache !== createDebug.namespaces) {
					namespacesCache = createDebug.namespaces;
					enabledCache = createDebug.enabled(namespace);
				}

				return enabledCache;
			},
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);
		createDebug.namespaces = namespaces;

		createDebug.names = [];
		createDebug.skips = [];

		let i;
		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
		const len = split.length;

		for (i = 0; i < len; i++) {
			if (!split[i]) {
				// ignore empty strings
				continue;
			}

			namespaces = split[i].replace(/\*/g, '.*?');

			if (namespaces[0] === '-') {
				createDebug.skips.push(new RegExp('^' + namespaces.slice(1) + '$'));
			} else {
				createDebug.names.push(new RegExp('^' + namespaces + '$'));
			}
		}
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names.map(toNamespace),
			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		if (name[name.length - 1] === '*') {
			return true;
		}

		let i;
		let len;

		for (i = 0, len = createDebug.skips.length; i < len; i++) {
			if (createDebug.skips[i].test(name)) {
				return false;
			}
		}

		for (i = 0, len = createDebug.names.length; i < len; i++) {
			if (createDebug.names[i].test(name)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Convert regexp to namespace
	*
	* @param {RegExp} regxep
	* @return {String} namespace
	* @api private
	*/
	function toNamespace(regexp) {
		return regexp.toString()
			.substring(2, regexp.toString().length - 2)
			.replace(/\.\*\?$/, '*');
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

module.exports = setup;


/***/ }),

/***/ "./node_modules/engine.io-client/lib/globalThis.browser.js":
/*!*****************************************************************!*\
  !*** ./node_modules/engine.io-client/lib/globalThis.browser.js ***!
  \*****************************************************************/
/***/ ((module) => {

module.exports = (() => {
  if (typeof self !== "undefined") {
    return self;
  } else if (typeof window !== "undefined") {
    return window;
  } else {
    return Function("return this")();
  }
})();


/***/ }),

/***/ "./node_modules/engine.io-client/lib/index.js":
/*!****************************************************!*\
  !*** ./node_modules/engine.io-client/lib/index.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const Socket = __webpack_require__(/*! ./socket */ "./node_modules/engine.io-client/lib/socket.js");

module.exports = (uri, opts) => new Socket(uri, opts);

/**
 * Expose deps for legacy compatibility
 * and standalone browser access.
 */

module.exports.Socket = Socket;
module.exports.protocol = Socket.protocol; // this is an int
module.exports.Transport = __webpack_require__(/*! ./transport */ "./node_modules/engine.io-client/lib/transport.js");
module.exports.transports = __webpack_require__(/*! ./transports/index */ "./node_modules/engine.io-client/lib/transports/index.js");
module.exports.parser = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/lib/index.js");


/***/ }),

/***/ "./node_modules/engine.io-client/lib/socket.js":
/*!*****************************************************!*\
  !*** ./node_modules/engine.io-client/lib/socket.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const transports = __webpack_require__(/*! ./transports/index */ "./node_modules/engine.io-client/lib/transports/index.js");
const Emitter = __webpack_require__(/*! component-emitter */ "./node_modules/component-emitter/index.js");
const debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("engine.io-client:socket");
const parser = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/lib/index.js");
const parseuri = __webpack_require__(/*! parseuri */ "./node_modules/parseuri/index.js");
const parseqs = __webpack_require__(/*! parseqs */ "./node_modules/parseqs/index.js");

class Socket extends Emitter {
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri or options
   * @param {Object} options
   * @api public
   */
  constructor(uri, opts = {}) {
    super();

    if (uri && "object" === typeof uri) {
      opts = uri;
      uri = null;
    }

    if (uri) {
      uri = parseuri(uri);
      opts.hostname = uri.host;
      opts.secure = uri.protocol === "https" || uri.protocol === "wss";
      opts.port = uri.port;
      if (uri.query) opts.query = uri.query;
    } else if (opts.host) {
      opts.hostname = parseuri(opts.host).host;
    }

    this.secure =
      null != opts.secure
        ? opts.secure
        : typeof location !== "undefined" && "https:" === location.protocol;

    if (opts.hostname && !opts.port) {
      // if no port is specified manually, use the protocol default
      opts.port = this.secure ? "443" : "80";
    }

    this.hostname =
      opts.hostname ||
      (typeof location !== "undefined" ? location.hostname : "localhost");
    this.port =
      opts.port ||
      (typeof location !== "undefined" && location.port
        ? location.port
        : this.secure
        ? 443
        : 80);

    this.transports = opts.transports || ["polling", "websocket"];
    this.readyState = "";
    this.writeBuffer = [];
    this.prevBufferLen = 0;

    this.opts = Object.assign(
      {
        path: "/engine.io",
        agent: false,
        withCredentials: false,
        upgrade: true,
        jsonp: true,
        timestampParam: "t",
        rememberUpgrade: false,
        rejectUnauthorized: true,
        perMessageDeflate: {
          threshold: 1024
        },
        transportOptions: {}
      },
      opts
    );

    this.opts.path = this.opts.path.replace(/\/$/, "") + "/";

    if (typeof this.opts.query === "string") {
      this.opts.query = parseqs.decode(this.opts.query);
    }

    // set on handshake
    this.id = null;
    this.upgrades = null;
    this.pingInterval = null;
    this.pingTimeout = null;

    // set on heartbeat
    this.pingTimeoutTimer = null;

    if (typeof addEventListener === "function") {
      addEventListener(
        "beforeunload",
        () => {
          if (this.transport) {
            // silently close the transport
            this.transport.removeAllListeners();
            this.transport.close();
          }
        },
        false
      );
    }

    this.open();
  }

  /**
   * Creates transport of the given type.
   *
   * @param {String} transport name
   * @return {Transport}
   * @api private
   */
  createTransport(name) {
    debug('creating transport "%s"', name);
    const query = clone(this.opts.query);

    // append engine.io protocol identifier
    query.EIO = parser.protocol;

    // transport name
    query.transport = name;

    // session id if we already have one
    if (this.id) query.sid = this.id;

    const opts = Object.assign(
      {},
      this.opts.transportOptions[name],
      this.opts,
      {
        query,
        socket: this,
        hostname: this.hostname,
        secure: this.secure,
        port: this.port
      }
    );

    debug("options: %j", opts);

    return new transports[name](opts);
  }

  /**
   * Initializes transport to use and starts probe.
   *
   * @api private
   */
  open() {
    let transport;
    if (
      this.opts.rememberUpgrade &&
      Socket.priorWebsocketSuccess &&
      this.transports.indexOf("websocket") !== -1
    ) {
      transport = "websocket";
    } else if (0 === this.transports.length) {
      // Emit error on next tick so it can be listened to
      const self = this;
      setTimeout(function() {
        self.emit("error", "No transports available");
      }, 0);
      return;
    } else {
      transport = this.transports[0];
    }
    this.readyState = "opening";

    // Retry with the next transport if the transport is disabled (jsonp: false)
    try {
      transport = this.createTransport(transport);
    } catch (e) {
      debug("error while creating transport: %s", e);
      this.transports.shift();
      this.open();
      return;
    }

    transport.open();
    this.setTransport(transport);
  }

  /**
   * Sets the current transport. Disables the existing one (if any).
   *
   * @api private
   */
  setTransport(transport) {
    debug("setting transport %s", transport.name);
    const self = this;

    if (this.transport) {
      debug("clearing existing transport %s", this.transport.name);
      this.transport.removeAllListeners();
    }

    // set up transport
    this.transport = transport;

    // set up transport listeners
    transport
      .on("drain", function() {
        self.onDrain();
      })
      .on("packet", function(packet) {
        self.onPacket(packet);
      })
      .on("error", function(e) {
        self.onError(e);
      })
      .on("close", function() {
        self.onClose("transport close");
      });
  }

  /**
   * Probes a transport.
   *
   * @param {String} transport name
   * @api private
   */
  probe(name) {
    debug('probing transport "%s"', name);
    let transport = this.createTransport(name, { probe: 1 });
    let failed = false;
    const self = this;

    Socket.priorWebsocketSuccess = false;

    function onTransportOpen() {
      if (self.onlyBinaryUpgrades) {
        const upgradeLosesBinary =
          !this.supportsBinary && self.transport.supportsBinary;
        failed = failed || upgradeLosesBinary;
      }
      if (failed) return;

      debug('probe transport "%s" opened', name);
      transport.send([{ type: "ping", data: "probe" }]);
      transport.once("packet", function(msg) {
        if (failed) return;
        if ("pong" === msg.type && "probe" === msg.data) {
          debug('probe transport "%s" pong', name);
          self.upgrading = true;
          self.emit("upgrading", transport);
          if (!transport) return;
          Socket.priorWebsocketSuccess = "websocket" === transport.name;

          debug('pausing current transport "%s"', self.transport.name);
          self.transport.pause(function() {
            if (failed) return;
            if ("closed" === self.readyState) return;
            debug("changing transport and sending upgrade packet");

            cleanup();

            self.setTransport(transport);
            transport.send([{ type: "upgrade" }]);
            self.emit("upgrade", transport);
            transport = null;
            self.upgrading = false;
            self.flush();
          });
        } else {
          debug('probe transport "%s" failed', name);
          const err = new Error("probe error");
          err.transport = transport.name;
          self.emit("upgradeError", err);
        }
      });
    }

    function freezeTransport() {
      if (failed) return;

      // Any callback called by transport should be ignored since now
      failed = true;

      cleanup();

      transport.close();
      transport = null;
    }

    // Handle any error that happens while probing
    function onerror(err) {
      const error = new Error("probe error: " + err);
      error.transport = transport.name;

      freezeTransport();

      debug('probe transport "%s" failed because of error: %s', name, err);

      self.emit("upgradeError", error);
    }

    function onTransportClose() {
      onerror("transport closed");
    }

    // When the socket is closed while we're probing
    function onclose() {
      onerror("socket closed");
    }

    // When the socket is upgraded while we're probing
    function onupgrade(to) {
      if (transport && to.name !== transport.name) {
        debug('"%s" works - aborting "%s"', to.name, transport.name);
        freezeTransport();
      }
    }

    // Remove all listeners on the transport and on self
    function cleanup() {
      transport.removeListener("open", onTransportOpen);
      transport.removeListener("error", onerror);
      transport.removeListener("close", onTransportClose);
      self.removeListener("close", onclose);
      self.removeListener("upgrading", onupgrade);
    }

    transport.once("open", onTransportOpen);
    transport.once("error", onerror);
    transport.once("close", onTransportClose);

    this.once("close", onclose);
    this.once("upgrading", onupgrade);

    transport.open();
  }

  /**
   * Called when connection is deemed open.
   *
   * @api public
   */
  onOpen() {
    debug("socket open");
    this.readyState = "open";
    Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
    this.emit("open");
    this.flush();

    // we check for `readyState` in case an `open`
    // listener already closed the socket
    if (
      "open" === this.readyState &&
      this.opts.upgrade &&
      this.transport.pause
    ) {
      debug("starting upgrade probes");
      let i = 0;
      const l = this.upgrades.length;
      for (; i < l; i++) {
        this.probe(this.upgrades[i]);
      }
    }
  }

  /**
   * Handles a packet.
   *
   * @api private
   */
  onPacket(packet) {
    if (
      "opening" === this.readyState ||
      "open" === this.readyState ||
      "closing" === this.readyState
    ) {
      debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

      this.emit("packet", packet);

      // Socket is live - any packet counts
      this.emit("heartbeat");

      switch (packet.type) {
        case "open":
          this.onHandshake(JSON.parse(packet.data));
          break;

        case "ping":
          this.resetPingTimeout();
          this.sendPacket("pong");
          this.emit("pong");
          break;

        case "error":
          const err = new Error("server error");
          err.code = packet.data;
          this.onError(err);
          break;

        case "message":
          this.emit("data", packet.data);
          this.emit("message", packet.data);
          break;
      }
    } else {
      debug('packet received with socket readyState "%s"', this.readyState);
    }
  }

  /**
   * Called upon handshake completion.
   *
   * @param {Object} handshake obj
   * @api private
   */
  onHandshake(data) {
    this.emit("handshake", data);
    this.id = data.sid;
    this.transport.query.sid = data.sid;
    this.upgrades = this.filterUpgrades(data.upgrades);
    this.pingInterval = data.pingInterval;
    this.pingTimeout = data.pingTimeout;
    this.onOpen();
    // In case open handler closes socket
    if ("closed" === this.readyState) return;
    this.resetPingTimeout();
  }

  /**
   * Sets and resets ping timeout timer based on server pings.
   *
   * @api private
   */
  resetPingTimeout() {
    clearTimeout(this.pingTimeoutTimer);
    this.pingTimeoutTimer = setTimeout(() => {
      this.onClose("ping timeout");
    }, this.pingInterval + this.pingTimeout);
  }

  /**
   * Called on `drain` event
   *
   * @api private
   */
  onDrain() {
    this.writeBuffer.splice(0, this.prevBufferLen);

    // setting prevBufferLen = 0 is very important
    // for example, when upgrading, upgrade packet is sent over,
    // and a nonzero prevBufferLen could cause problems on `drain`
    this.prevBufferLen = 0;

    if (0 === this.writeBuffer.length) {
      this.emit("drain");
    } else {
      this.flush();
    }
  }

  /**
   * Flush write buffers.
   *
   * @api private
   */
  flush() {
    if (
      "closed" !== this.readyState &&
      this.transport.writable &&
      !this.upgrading &&
      this.writeBuffer.length
    ) {
      debug("flushing %d packets in socket", this.writeBuffer.length);
      this.transport.send(this.writeBuffer);
      // keep track of current length of writeBuffer
      // splice writeBuffer and callbackBuffer on `drain`
      this.prevBufferLen = this.writeBuffer.length;
      this.emit("flush");
    }
  }

  /**
   * Sends a message.
   *
   * @param {String} message.
   * @param {Function} callback function.
   * @param {Object} options.
   * @return {Socket} for chaining.
   * @api public
   */
  write(msg, options, fn) {
    this.sendPacket("message", msg, options, fn);
    return this;
  }

  send(msg, options, fn) {
    this.sendPacket("message", msg, options, fn);
    return this;
  }

  /**
   * Sends a packet.
   *
   * @param {String} packet type.
   * @param {String} data.
   * @param {Object} options.
   * @param {Function} callback function.
   * @api private
   */
  sendPacket(type, data, options, fn) {
    if ("function" === typeof data) {
      fn = data;
      data = undefined;
    }

    if ("function" === typeof options) {
      fn = options;
      options = null;
    }

    if ("closing" === this.readyState || "closed" === this.readyState) {
      return;
    }

    options = options || {};
    options.compress = false !== options.compress;

    const packet = {
      type: type,
      data: data,
      options: options
    };
    this.emit("packetCreate", packet);
    this.writeBuffer.push(packet);
    if (fn) this.once("flush", fn);
    this.flush();
  }

  /**
   * Closes the connection.
   *
   * @api private
   */
  close() {
    const self = this;

    if ("opening" === this.readyState || "open" === this.readyState) {
      this.readyState = "closing";

      if (this.writeBuffer.length) {
        this.once("drain", function() {
          if (this.upgrading) {
            waitForUpgrade();
          } else {
            close();
          }
        });
      } else if (this.upgrading) {
        waitForUpgrade();
      } else {
        close();
      }
    }

    function close() {
      self.onClose("forced close");
      debug("socket closing - telling transport to close");
      self.transport.close();
    }

    function cleanupAndClose() {
      self.removeListener("upgrade", cleanupAndClose);
      self.removeListener("upgradeError", cleanupAndClose);
      close();
    }

    function waitForUpgrade() {
      // wait for upgrade to finish since we can't send packets while pausing a transport
      self.once("upgrade", cleanupAndClose);
      self.once("upgradeError", cleanupAndClose);
    }

    return this;
  }

  /**
   * Called upon transport error
   *
   * @api private
   */
  onError(err) {
    debug("socket error %j", err);
    Socket.priorWebsocketSuccess = false;
    this.emit("error", err);
    this.onClose("transport error", err);
  }

  /**
   * Called upon transport close.
   *
   * @api private
   */
  onClose(reason, desc) {
    if (
      "opening" === this.readyState ||
      "open" === this.readyState ||
      "closing" === this.readyState
    ) {
      debug('socket close with reason: "%s"', reason);
      const self = this;

      // clear timers
      clearTimeout(this.pingIntervalTimer);
      clearTimeout(this.pingTimeoutTimer);

      // stop event from firing again for transport
      this.transport.removeAllListeners("close");

      // ensure transport won't stay open
      this.transport.close();

      // ignore further transport communication
      this.transport.removeAllListeners();

      // set ready state
      this.readyState = "closed";

      // clear session id
      this.id = null;

      // emit close event
      this.emit("close", reason, desc);

      // clean buffers after, so users can still
      // grab the buffers on `close` event
      self.writeBuffer = [];
      self.prevBufferLen = 0;
    }
  }

  /**
   * Filters upgrades, returning only those matching client transports.
   *
   * @param {Array} server upgrades
   * @api private
   *
   */
  filterUpgrades(upgrades) {
    const filteredUpgrades = [];
    let i = 0;
    const j = upgrades.length;
    for (; i < j; i++) {
      if (~this.transports.indexOf(upgrades[i]))
        filteredUpgrades.push(upgrades[i]);
    }
    return filteredUpgrades;
  }
}

Socket.priorWebsocketSuccess = false;

/**
 * Protocol version.
 *
 * @api public
 */

Socket.protocol = parser.protocol; // this is an int

function clone(obj) {
  const o = {};
  for (let i in obj) {
    if (obj.hasOwnProperty(i)) {
      o[i] = obj[i];
    }
  }
  return o;
}

module.exports = Socket;


/***/ }),

/***/ "./node_modules/engine.io-client/lib/transport.js":
/*!********************************************************!*\
  !*** ./node_modules/engine.io-client/lib/transport.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const parser = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/lib/index.js");
const Emitter = __webpack_require__(/*! component-emitter */ "./node_modules/component-emitter/index.js");
const debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("engine.io-client:transport");

class Transport extends Emitter {
  /**
   * Transport abstract constructor.
   *
   * @param {Object} options.
   * @api private
   */
  constructor(opts) {
    super();

    this.opts = opts;
    this.query = opts.query;
    this.readyState = "";
    this.socket = opts.socket;
  }

  /**
   * Emits an error.
   *
   * @param {String} str
   * @return {Transport} for chaining
   * @api public
   */
  onError(msg, desc) {
    const err = new Error(msg);
    err.type = "TransportError";
    err.description = desc;
    this.emit("error", err);
    return this;
  }

  /**
   * Opens the transport.
   *
   * @api public
   */
  open() {
    if ("closed" === this.readyState || "" === this.readyState) {
      this.readyState = "opening";
      this.doOpen();
    }

    return this;
  }

  /**
   * Closes the transport.
   *
   * @api private
   */
  close() {
    if ("opening" === this.readyState || "open" === this.readyState) {
      this.doClose();
      this.onClose();
    }

    return this;
  }

  /**
   * Sends multiple packets.
   *
   * @param {Array} packets
   * @api private
   */
  send(packets) {
    if ("open" === this.readyState) {
      this.write(packets);
    } else {
      // this might happen if the transport was silently closed in the beforeunload event handler
      debug("transport is not open, discarding packets");
    }
  }

  /**
   * Called upon open
   *
   * @api private
   */
  onOpen() {
    this.readyState = "open";
    this.writable = true;
    this.emit("open");
  }

  /**
   * Called with data.
   *
   * @param {String} data
   * @api private
   */
  onData(data) {
    const packet = parser.decodePacket(data, this.socket.binaryType);
    this.onPacket(packet);
  }

  /**
   * Called with a decoded packet.
   */
  onPacket(packet) {
    this.emit("packet", packet);
  }

  /**
   * Called upon close.
   *
   * @api private
   */
  onClose() {
    this.readyState = "closed";
    this.emit("close");
  }
}

module.exports = Transport;


/***/ }),

/***/ "./node_modules/engine.io-client/lib/transports/index.js":
/*!***************************************************************!*\
  !*** ./node_modules/engine.io-client/lib/transports/index.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const XMLHttpRequest = __webpack_require__(/*! xmlhttprequest-ssl */ "./node_modules/engine.io-client/lib/xmlhttprequest.js");
const XHR = __webpack_require__(/*! ./polling-xhr */ "./node_modules/engine.io-client/lib/transports/polling-xhr.js");
const JSONP = __webpack_require__(/*! ./polling-jsonp */ "./node_modules/engine.io-client/lib/transports/polling-jsonp.js");
const websocket = __webpack_require__(/*! ./websocket */ "./node_modules/engine.io-client/lib/transports/websocket.js");

exports.polling = polling;
exports.websocket = websocket;

/**
 * Polling transport polymorphic constructor.
 * Decides on xhr vs jsonp based on feature detection.
 *
 * @api private
 */

function polling(opts) {
  let xhr;
  let xd = false;
  let xs = false;
  const jsonp = false !== opts.jsonp;

  if (typeof location !== "undefined") {
    const isSSL = "https:" === location.protocol;
    let port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    xd = opts.hostname !== location.hostname || port !== opts.port;
    xs = opts.secure !== isSSL;
  }

  opts.xdomain = xd;
  opts.xscheme = xs;
  xhr = new XMLHttpRequest(opts);

  if ("open" in xhr && !opts.forceJSONP) {
    return new XHR(opts);
  } else {
    if (!jsonp) throw new Error("JSONP disabled");
    return new JSONP(opts);
  }
}


/***/ }),

/***/ "./node_modules/engine.io-client/lib/transports/polling-jsonp.js":
/*!***********************************************************************!*\
  !*** ./node_modules/engine.io-client/lib/transports/polling-jsonp.js ***!
  \***********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const Polling = __webpack_require__(/*! ./polling */ "./node_modules/engine.io-client/lib/transports/polling.js");
const globalThis = __webpack_require__(/*! ../globalThis */ "./node_modules/engine.io-client/lib/globalThis.browser.js");

const rNewline = /\n/g;
const rEscapedNewline = /\\n/g;

/**
 * Global JSONP callbacks.
 */

let callbacks;

class JSONPPolling extends Polling {
  /**
   * JSONP Polling constructor.
   *
   * @param {Object} opts.
   * @api public
   */
  constructor(opts) {
    super(opts);

    this.query = this.query || {};

    // define global callbacks array if not present
    // we do this here (lazily) to avoid unneeded global pollution
    if (!callbacks) {
      // we need to consider multiple engines in the same page
      callbacks = globalThis.___eio = globalThis.___eio || [];
    }

    // callback identifier
    this.index = callbacks.length;

    // add callback to jsonp global
    const self = this;
    callbacks.push(function(msg) {
      self.onData(msg);
    });

    // append to query string
    this.query.j = this.index;
  }

  /**
   * JSONP only supports binary as base64 encoded strings
   */
  get supportsBinary() {
    return false;
  }

  /**
   * Closes the socket.
   *
   * @api private
   */
  doClose() {
    if (this.script) {
      // prevent spurious errors from being emitted when the window is unloaded
      this.script.onerror = () => {};
      this.script.parentNode.removeChild(this.script);
      this.script = null;
    }

    if (this.form) {
      this.form.parentNode.removeChild(this.form);
      this.form = null;
      this.iframe = null;
    }

    super.doClose();
  }

  /**
   * Starts a poll cycle.
   *
   * @api private
   */
  doPoll() {
    const self = this;
    const script = document.createElement("script");

    if (this.script) {
      this.script.parentNode.removeChild(this.script);
      this.script = null;
    }

    script.async = true;
    script.src = this.uri();
    script.onerror = function(e) {
      self.onError("jsonp poll error", e);
    };

    const insertAt = document.getElementsByTagName("script")[0];
    if (insertAt) {
      insertAt.parentNode.insertBefore(script, insertAt);
    } else {
      (document.head || document.body).appendChild(script);
    }
    this.script = script;

    const isUAgecko =
      "undefined" !== typeof navigator && /gecko/i.test(navigator.userAgent);

    if (isUAgecko) {
      setTimeout(function() {
        const iframe = document.createElement("iframe");
        document.body.appendChild(iframe);
        document.body.removeChild(iframe);
      }, 100);
    }
  }

  /**
   * Writes with a hidden iframe.
   *
   * @param {String} data to send
   * @param {Function} called upon flush.
   * @api private
   */
  doWrite(data, fn) {
    const self = this;
    let iframe;

    if (!this.form) {
      const form = document.createElement("form");
      const area = document.createElement("textarea");
      const id = (this.iframeId = "eio_iframe_" + this.index);

      form.className = "socketio";
      form.style.position = "absolute";
      form.style.top = "-1000px";
      form.style.left = "-1000px";
      form.target = id;
      form.method = "POST";
      form.setAttribute("accept-charset", "utf-8");
      area.name = "d";
      form.appendChild(area);
      document.body.appendChild(form);

      this.form = form;
      this.area = area;
    }

    this.form.action = this.uri();

    function complete() {
      initIframe();
      fn();
    }

    function initIframe() {
      if (self.iframe) {
        try {
          self.form.removeChild(self.iframe);
        } catch (e) {
          self.onError("jsonp polling iframe removal error", e);
        }
      }

      try {
        // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
        const html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
        iframe = document.createElement(html);
      } catch (e) {
        iframe = document.createElement("iframe");
        iframe.name = self.iframeId;
        iframe.src = "javascript:0";
      }

      iframe.id = self.iframeId;

      self.form.appendChild(iframe);
      self.iframe = iframe;
    }

    initIframe();

    // escape \n to prevent it from being converted into \r\n by some UAs
    // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
    data = data.replace(rEscapedNewline, "\\\n");
    this.area.value = data.replace(rNewline, "\\n");

    try {
      this.form.submit();
    } catch (e) {}

    if (this.iframe.attachEvent) {
      this.iframe.onreadystatechange = function() {
        if (self.iframe.readyState === "complete") {
          complete();
        }
      };
    } else {
      this.iframe.onload = complete;
    }
  }
}

module.exports = JSONPPolling;


/***/ }),

/***/ "./node_modules/engine.io-client/lib/transports/polling-xhr.js":
/*!*********************************************************************!*\
  !*** ./node_modules/engine.io-client/lib/transports/polling-xhr.js ***!
  \*********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* global attachEvent */

const XMLHttpRequest = __webpack_require__(/*! xmlhttprequest-ssl */ "./node_modules/engine.io-client/lib/xmlhttprequest.js");
const Polling = __webpack_require__(/*! ./polling */ "./node_modules/engine.io-client/lib/transports/polling.js");
const Emitter = __webpack_require__(/*! component-emitter */ "./node_modules/component-emitter/index.js");
const { pick } = __webpack_require__(/*! ../util */ "./node_modules/engine.io-client/lib/util.js");
const globalThis = __webpack_require__(/*! ../globalThis */ "./node_modules/engine.io-client/lib/globalThis.browser.js");

const debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("engine.io-client:polling-xhr");

/**
 * Empty function
 */

function empty() {}

const hasXHR2 = (function() {
  const xhr = new XMLHttpRequest({ xdomain: false });
  return null != xhr.responseType;
})();

class XHR extends Polling {
  /**
   * XHR Polling constructor.
   *
   * @param {Object} opts
   * @api public
   */
  constructor(opts) {
    super(opts);

    if (typeof location !== "undefined") {
      const isSSL = "https:" === location.protocol;
      let port = location.port;

      // some user agents have empty `location.port`
      if (!port) {
        port = isSSL ? 443 : 80;
      }

      this.xd =
        (typeof location !== "undefined" &&
          opts.hostname !== location.hostname) ||
        port !== opts.port;
      this.xs = opts.secure !== isSSL;
    }
    /**
     * XHR supports binary
     */
    const forceBase64 = opts && opts.forceBase64;
    this.supportsBinary = hasXHR2 && !forceBase64;
  }

  /**
   * Creates a request.
   *
   * @param {String} method
   * @api private
   */
  request(opts = {}) {
    Object.assign(opts, { xd: this.xd, xs: this.xs }, this.opts);
    return new Request(this.uri(), opts);
  }

  /**
   * Sends data.
   *
   * @param {String} data to send.
   * @param {Function} called upon flush.
   * @api private
   */
  doWrite(data, fn) {
    const req = this.request({
      method: "POST",
      data: data
    });
    const self = this;
    req.on("success", fn);
    req.on("error", function(err) {
      self.onError("xhr post error", err);
    });
  }

  /**
   * Starts a poll cycle.
   *
   * @api private
   */
  doPoll() {
    debug("xhr poll");
    const req = this.request();
    const self = this;
    req.on("data", function(data) {
      self.onData(data);
    });
    req.on("error", function(err) {
      self.onError("xhr poll error", err);
    });
    this.pollXhr = req;
  }
}

class Request extends Emitter {
  /**
   * Request constructor
   *
   * @param {Object} options
   * @api public
   */
  constructor(uri, opts) {
    super();
    this.opts = opts;

    this.method = opts.method || "GET";
    this.uri = uri;
    this.async = false !== opts.async;
    this.data = undefined !== opts.data ? opts.data : null;

    this.create();
  }

  /**
   * Creates the XHR object and sends the request.
   *
   * @api private
   */
  create() {
    const opts = pick(
      this.opts,
      "agent",
      "enablesXDR",
      "pfx",
      "key",
      "passphrase",
      "cert",
      "ca",
      "ciphers",
      "rejectUnauthorized"
    );
    opts.xdomain = !!this.opts.xd;
    opts.xscheme = !!this.opts.xs;

    const xhr = (this.xhr = new XMLHttpRequest(opts));
    const self = this;

    try {
      debug("xhr open %s: %s", this.method, this.uri);
      xhr.open(this.method, this.uri, this.async);
      try {
        if (this.opts.extraHeaders) {
          xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
          for (let i in this.opts.extraHeaders) {
            if (this.opts.extraHeaders.hasOwnProperty(i)) {
              xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
            }
          }
        }
      } catch (e) {}

      if ("POST" === this.method) {
        try {
          xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
        } catch (e) {}
      }

      try {
        xhr.setRequestHeader("Accept", "*/*");
      } catch (e) {}

      // ie6 check
      if ("withCredentials" in xhr) {
        xhr.withCredentials = this.opts.withCredentials;
      }

      if (this.opts.requestTimeout) {
        xhr.timeout = this.opts.requestTimeout;
      }

      if (this.hasXDR()) {
        xhr.onload = function() {
          self.onLoad();
        };
        xhr.onerror = function() {
          self.onError(xhr.responseText);
        };
      } else {
        xhr.onreadystatechange = function() {
          if (4 !== xhr.readyState) return;
          if (200 === xhr.status || 1223 === xhr.status) {
            self.onLoad();
          } else {
            // make sure the `error` event handler that's user-set
            // does not throw in the same tick and gets caught here
            setTimeout(function() {
              self.onError(typeof xhr.status === "number" ? xhr.status : 0);
            }, 0);
          }
        };
      }

      debug("xhr data %s", this.data);
      xhr.send(this.data);
    } catch (e) {
      // Need to defer since .create() is called directly from the constructor
      // and thus the 'error' event can only be only bound *after* this exception
      // occurs.  Therefore, also, we cannot throw here at all.
      setTimeout(function() {
        self.onError(e);
      }, 0);
      return;
    }

    if (typeof document !== "undefined") {
      this.index = Request.requestsCount++;
      Request.requests[this.index] = this;
    }
  }

  /**
   * Called upon successful response.
   *
   * @api private
   */
  onSuccess() {
    this.emit("success");
    this.cleanup();
  }

  /**
   * Called if we have data.
   *
   * @api private
   */
  onData(data) {
    this.emit("data", data);
    this.onSuccess();
  }

  /**
   * Called upon error.
   *
   * @api private
   */
  onError(err) {
    this.emit("error", err);
    this.cleanup(true);
  }

  /**
   * Cleans up house.
   *
   * @api private
   */
  cleanup(fromError) {
    if ("undefined" === typeof this.xhr || null === this.xhr) {
      return;
    }
    // xmlhttprequest
    if (this.hasXDR()) {
      this.xhr.onload = this.xhr.onerror = empty;
    } else {
      this.xhr.onreadystatechange = empty;
    }

    if (fromError) {
      try {
        this.xhr.abort();
      } catch (e) {}
    }

    if (typeof document !== "undefined") {
      delete Request.requests[this.index];
    }

    this.xhr = null;
  }

  /**
   * Called upon load.
   *
   * @api private
   */
  onLoad() {
    const data = this.xhr.responseText;
    if (data !== null) {
      this.onData(data);
    }
  }

  /**
   * Check if it has XDomainRequest.
   *
   * @api private
   */
  hasXDR() {
    return typeof XDomainRequest !== "undefined" && !this.xs && this.enablesXDR;
  }

  /**
   * Aborts the request.
   *
   * @api public
   */
  abort() {
    this.cleanup();
  }
}

/**
 * Aborts pending requests when unloading the window. This is needed to prevent
 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
 * emitted.
 */

Request.requestsCount = 0;
Request.requests = {};

if (typeof document !== "undefined") {
  if (typeof attachEvent === "function") {
    attachEvent("onunload", unloadHandler);
  } else if (typeof addEventListener === "function") {
    const terminationEvent = "onpagehide" in globalThis ? "pagehide" : "unload";
    addEventListener(terminationEvent, unloadHandler, false);
  }
}

function unloadHandler() {
  for (let i in Request.requests) {
    if (Request.requests.hasOwnProperty(i)) {
      Request.requests[i].abort();
    }
  }
}

module.exports = XHR;
module.exports.Request = Request;


/***/ }),

/***/ "./node_modules/engine.io-client/lib/transports/polling.js":
/*!*****************************************************************!*\
  !*** ./node_modules/engine.io-client/lib/transports/polling.js ***!
  \*****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const Transport = __webpack_require__(/*! ../transport */ "./node_modules/engine.io-client/lib/transport.js");
const parseqs = __webpack_require__(/*! parseqs */ "./node_modules/parseqs/index.js");
const parser = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/lib/index.js");
const yeast = __webpack_require__(/*! yeast */ "./node_modules/yeast/index.js");

const debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("engine.io-client:polling");

class Polling extends Transport {
  /**
   * Transport name.
   */
  get name() {
    return "polling";
  }

  /**
   * Opens the socket (triggers polling). We write a PING message to determine
   * when the transport is open.
   *
   * @api private
   */
  doOpen() {
    this.poll();
  }

  /**
   * Pauses polling.
   *
   * @param {Function} callback upon buffers are flushed and transport is paused
   * @api private
   */
  pause(onPause) {
    const self = this;

    this.readyState = "pausing";

    function pause() {
      debug("paused");
      self.readyState = "paused";
      onPause();
    }

    if (this.polling || !this.writable) {
      let total = 0;

      if (this.polling) {
        debug("we are currently polling - waiting to pause");
        total++;
        this.once("pollComplete", function() {
          debug("pre-pause polling complete");
          --total || pause();
        });
      }

      if (!this.writable) {
        debug("we are currently writing - waiting to pause");
        total++;
        this.once("drain", function() {
          debug("pre-pause writing complete");
          --total || pause();
        });
      }
    } else {
      pause();
    }
  }

  /**
   * Starts polling cycle.
   *
   * @api public
   */
  poll() {
    debug("polling");
    this.polling = true;
    this.doPoll();
    this.emit("poll");
  }

  /**
   * Overloads onData to detect payloads.
   *
   * @api private
   */
  onData(data) {
    const self = this;
    debug("polling got data %s", data);
    const callback = function(packet, index, total) {
      // if its the first message we consider the transport open
      if ("opening" === self.readyState && packet.type === "open") {
        self.onOpen();
      }

      // if its a close packet, we close the ongoing requests
      if ("close" === packet.type) {
        self.onClose();
        return false;
      }

      // otherwise bypass onData and handle the message
      self.onPacket(packet);
    };

    // decode payload
    parser.decodePayload(data, this.socket.binaryType).forEach(callback);

    // if an event did not trigger closing
    if ("closed" !== this.readyState) {
      // if we got data we're not polling
      this.polling = false;
      this.emit("pollComplete");

      if ("open" === this.readyState) {
        this.poll();
      } else {
        debug('ignoring poll - transport state "%s"', this.readyState);
      }
    }
  }

  /**
   * For polling, send a close packet.
   *
   * @api private
   */
  doClose() {
    const self = this;

    function close() {
      debug("writing close packet");
      self.write([{ type: "close" }]);
    }

    if ("open" === this.readyState) {
      debug("transport open - closing");
      close();
    } else {
      // in case we're trying to close while
      // handshaking is in progress (GH-164)
      debug("transport not open - deferring close");
      this.once("open", close);
    }
  }

  /**
   * Writes a packets payload.
   *
   * @param {Array} data packets
   * @param {Function} drain callback
   * @api private
   */
  write(packets) {
    this.writable = false;

    parser.encodePayload(packets, data => {
      this.doWrite(data, () => {
        this.writable = true;
        this.emit("drain");
      });
    });
  }

  /**
   * Generates uri for connection.
   *
   * @api private
   */
  uri() {
    let query = this.query || {};
    const schema = this.opts.secure ? "https" : "http";
    let port = "";

    // cache busting is forced
    if (false !== this.opts.timestampRequests) {
      query[this.opts.timestampParam] = yeast();
    }

    if (!this.supportsBinary && !query.sid) {
      query.b64 = 1;
    }

    query = parseqs.encode(query);

    // avoid port if default for schema
    if (
      this.opts.port &&
      (("https" === schema && Number(this.opts.port) !== 443) ||
        ("http" === schema && Number(this.opts.port) !== 80))
    ) {
      port = ":" + this.opts.port;
    }

    // prepend ? to query
    if (query.length) {
      query = "?" + query;
    }

    const ipv6 = this.opts.hostname.indexOf(":") !== -1;
    return (
      schema +
      "://" +
      (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
      port +
      this.opts.path +
      query
    );
  }
}

module.exports = Polling;


/***/ }),

/***/ "./node_modules/engine.io-client/lib/transports/websocket-constructor.browser.js":
/*!***************************************************************************************!*\
  !*** ./node_modules/engine.io-client/lib/transports/websocket-constructor.browser.js ***!
  \***************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const globalThis = __webpack_require__(/*! ../globalThis */ "./node_modules/engine.io-client/lib/globalThis.browser.js");

module.exports = {
  WebSocket: globalThis.WebSocket || globalThis.MozWebSocket,
  usingBrowserWebSocket: true,
  defaultBinaryType: "arraybuffer"
};


/***/ }),

/***/ "./node_modules/engine.io-client/lib/transports/websocket.js":
/*!*******************************************************************!*\
  !*** ./node_modules/engine.io-client/lib/transports/websocket.js ***!
  \*******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const Transport = __webpack_require__(/*! ../transport */ "./node_modules/engine.io-client/lib/transport.js");
const parser = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/lib/index.js");
const parseqs = __webpack_require__(/*! parseqs */ "./node_modules/parseqs/index.js");
const yeast = __webpack_require__(/*! yeast */ "./node_modules/yeast/index.js");
const { pick } = __webpack_require__(/*! ../util */ "./node_modules/engine.io-client/lib/util.js");
const {
  WebSocket,
  usingBrowserWebSocket,
  defaultBinaryType
} = __webpack_require__(/*! ./websocket-constructor */ "./node_modules/engine.io-client/lib/transports/websocket-constructor.browser.js");

const debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("engine.io-client:websocket");

// detect ReactNative environment
const isReactNative =
  typeof navigator !== "undefined" &&
  typeof navigator.product === "string" &&
  navigator.product.toLowerCase() === "reactnative";

class WS extends Transport {
  /**
   * WebSocket transport constructor.
   *
   * @api {Object} connection options
   * @api public
   */
  constructor(opts) {
    super(opts);

    this.supportsBinary = !opts.forceBase64;
  }

  /**
   * Transport name.
   *
   * @api public
   */
  get name() {
    return "websocket";
  }

  /**
   * Opens socket.
   *
   * @api private
   */
  doOpen() {
    if (!this.check()) {
      // let probe timeout
      return;
    }

    const uri = this.uri();
    const protocols = this.opts.protocols;

    // React Native only supports the 'headers' option, and will print a warning if anything else is passed
    const opts = isReactNative
      ? {}
      : pick(
          this.opts,
          "agent",
          "perMessageDeflate",
          "pfx",
          "key",
          "passphrase",
          "cert",
          "ca",
          "ciphers",
          "rejectUnauthorized",
          "localAddress",
          "protocolVersion",
          "origin",
          "maxPayload",
          "family",
          "checkServerIdentity"
        );

    if (this.opts.extraHeaders) {
      opts.headers = this.opts.extraHeaders;
    }

    try {
      this.ws =
        usingBrowserWebSocket && !isReactNative
          ? protocols
            ? new WebSocket(uri, protocols)
            : new WebSocket(uri)
          : new WebSocket(uri, protocols, opts);
    } catch (err) {
      return this.emit("error", err);
    }

    this.ws.binaryType = this.socket.binaryType || defaultBinaryType;

    this.addEventListeners();
  }

  /**
   * Adds event listeners to the socket
   *
   * @api private
   */
  addEventListeners() {
    const self = this;

    this.ws.onopen = function() {
      self.onOpen();
    };
    this.ws.onclose = function() {
      self.onClose();
    };
    this.ws.onmessage = function(ev) {
      self.onData(ev.data);
    };
    this.ws.onerror = function(e) {
      self.onError("websocket error", e);
    };
  }

  /**
   * Writes data to socket.
   *
   * @param {Array} array of packets.
   * @api private
   */
  write(packets) {
    const self = this;
    this.writable = false;

    // encodePacket efficient as it uses WS framing
    // no need for encodePayload
    let total = packets.length;
    let i = 0;
    const l = total;
    for (; i < l; i++) {
      (function(packet) {
        parser.encodePacket(packet, self.supportsBinary, function(data) {
          // always create a new object (GH-437)
          const opts = {};
          if (!usingBrowserWebSocket) {
            if (packet.options) {
              opts.compress = packet.options.compress;
            }

            if (self.opts.perMessageDeflate) {
              const len =
                "string" === typeof data
                  ? Buffer.byteLength(data)
                  : data.length;
              if (len < self.opts.perMessageDeflate.threshold) {
                opts.compress = false;
              }
            }
          }

          // Sometimes the websocket has already been closed but the browser didn't
          // have a chance of informing us about it yet, in that case send will
          // throw an error
          try {
            if (usingBrowserWebSocket) {
              // TypeError is thrown when passing the second argument on Safari
              self.ws.send(data);
            } else {
              self.ws.send(data, opts);
            }
          } catch (e) {
            debug("websocket closed before onclose event");
          }

          --total || done();
        });
      })(packets[i]);
    }

    function done() {
      self.emit("flush");

      // fake drain
      // defer to next tick to allow Socket to clear writeBuffer
      setTimeout(function() {
        self.writable = true;
        self.emit("drain");
      }, 0);
    }
  }

  /**
   * Called upon close
   *
   * @api private
   */
  onClose() {
    Transport.prototype.onClose.call(this);
  }

  /**
   * Closes socket.
   *
   * @api private
   */
  doClose() {
    if (typeof this.ws !== "undefined") {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Generates uri for connection.
   *
   * @api private
   */
  uri() {
    let query = this.query || {};
    const schema = this.opts.secure ? "wss" : "ws";
    let port = "";

    // avoid port if default for schema
    if (
      this.opts.port &&
      (("wss" === schema && Number(this.opts.port) !== 443) ||
        ("ws" === schema && Number(this.opts.port) !== 80))
    ) {
      port = ":" + this.opts.port;
    }

    // append timestamp to URI
    if (this.opts.timestampRequests) {
      query[this.opts.timestampParam] = yeast();
    }

    // communicate binary support capabilities
    if (!this.supportsBinary) {
      query.b64 = 1;
    }

    query = parseqs.encode(query);

    // prepend ? to query
    if (query.length) {
      query = "?" + query;
    }

    const ipv6 = this.opts.hostname.indexOf(":") !== -1;
    return (
      schema +
      "://" +
      (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
      port +
      this.opts.path +
      query
    );
  }

  /**
   * Feature detection for WebSocket.
   *
   * @return {Boolean} whether this transport is available.
   * @api public
   */
  check() {
    return (
      !!WebSocket &&
      !("__initialize" in WebSocket && this.name === WS.prototype.name)
    );
  }
}

module.exports = WS;


/***/ }),

/***/ "./node_modules/engine.io-client/lib/util.js":
/*!***************************************************!*\
  !*** ./node_modules/engine.io-client/lib/util.js ***!
  \***************************************************/
/***/ ((module) => {

module.exports.pick = (obj, ...attr) => {
  return attr.reduce((acc, k) => {
    if (obj.hasOwnProperty(k)) {
      acc[k] = obj[k];
    }
    return acc;
  }, {});
};


/***/ }),

/***/ "./node_modules/engine.io-client/lib/xmlhttprequest.js":
/*!*************************************************************!*\
  !*** ./node_modules/engine.io-client/lib/xmlhttprequest.js ***!
  \*************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// browser shim for xmlhttprequest module

const hasCORS = __webpack_require__(/*! has-cors */ "./node_modules/has-cors/index.js");
const globalThis = __webpack_require__(/*! ./globalThis */ "./node_modules/engine.io-client/lib/globalThis.browser.js");

module.exports = function(opts) {
  const xdomain = opts.xdomain;

  // scheme must be same when usign XDomainRequest
  // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
  const xscheme = opts.xscheme;

  // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
  // https://github.com/Automattic/engine.io-client/pull/217
  const enablesXDR = opts.enablesXDR;

  // XMLHttpRequest can be disabled on IE
  try {
    if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) {}

  // Use XDomainRequest for IE8 if enablesXDR is true
  // because loading bar keeps flashing when using jsonp-polling
  // https://github.com/yujiosaka/socke.io-ie8-loading-example
  try {
    if ("undefined" !== typeof XDomainRequest && !xscheme && enablesXDR) {
      return new XDomainRequest();
    }
  } catch (e) {}

  if (!xdomain) {
    try {
      return new globalThis[["Active"].concat("Object").join("X")](
        "Microsoft.XMLHTTP"
      );
    } catch (e) {}
  }
};


/***/ }),

/***/ "./node_modules/engine.io-parser/lib/commons.js":
/*!******************************************************!*\
  !*** ./node_modules/engine.io-parser/lib/commons.js ***!
  \******************************************************/
/***/ ((module) => {

const PACKET_TYPES = Object.create(null); // no Map = no polyfill
PACKET_TYPES["open"] = "0";
PACKET_TYPES["close"] = "1";
PACKET_TYPES["ping"] = "2";
PACKET_TYPES["pong"] = "3";
PACKET_TYPES["message"] = "4";
PACKET_TYPES["upgrade"] = "5";
PACKET_TYPES["noop"] = "6";

const PACKET_TYPES_REVERSE = Object.create(null);
Object.keys(PACKET_TYPES).forEach(key => {
  PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
});

const ERROR_PACKET = { type: "error", data: "parser error" };

module.exports = {
  PACKET_TYPES,
  PACKET_TYPES_REVERSE,
  ERROR_PACKET
};


/***/ }),

/***/ "./node_modules/engine.io-parser/lib/decodePacket.browser.js":
/*!*******************************************************************!*\
  !*** ./node_modules/engine.io-parser/lib/decodePacket.browser.js ***!
  \*******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { PACKET_TYPES_REVERSE, ERROR_PACKET } = __webpack_require__(/*! ./commons */ "./node_modules/engine.io-parser/lib/commons.js");

const withNativeArrayBuffer = typeof ArrayBuffer === "function";

let base64decoder;
if (withNativeArrayBuffer) {
  base64decoder = __webpack_require__(/*! base64-arraybuffer */ "./node_modules/base64-arraybuffer/lib/base64-arraybuffer.js");
}

const decodePacket = (encodedPacket, binaryType) => {
  if (typeof encodedPacket !== "string") {
    return {
      type: "message",
      data: mapBinary(encodedPacket, binaryType)
    };
  }
  const type = encodedPacket.charAt(0);
  if (type === "b") {
    return {
      type: "message",
      data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
    };
  }
  const packetType = PACKET_TYPES_REVERSE[type];
  if (!packetType) {
    return ERROR_PACKET;
  }
  return encodedPacket.length > 1
    ? {
        type: PACKET_TYPES_REVERSE[type],
        data: encodedPacket.substring(1)
      }
    : {
        type: PACKET_TYPES_REVERSE[type]
      };
};

const decodeBase64Packet = (data, binaryType) => {
  if (base64decoder) {
    const decoded = base64decoder.decode(data);
    return mapBinary(decoded, binaryType);
  } else {
    return { base64: true, data }; // fallback for old browsers
  }
};

const mapBinary = (data, binaryType) => {
  switch (binaryType) {
    case "blob":
      return data instanceof ArrayBuffer ? new Blob([data]) : data;
    case "arraybuffer":
    default:
      return data; // assuming the data is already an ArrayBuffer
  }
};

module.exports = decodePacket;


/***/ }),

/***/ "./node_modules/engine.io-parser/lib/encodePacket.browser.js":
/*!*******************************************************************!*\
  !*** ./node_modules/engine.io-parser/lib/encodePacket.browser.js ***!
  \*******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { PACKET_TYPES } = __webpack_require__(/*! ./commons */ "./node_modules/engine.io-parser/lib/commons.js");

const withNativeBlob =
  typeof Blob === "function" ||
  (typeof Blob !== "undefined" &&
    Object.prototype.toString.call(Blob) === "[object BlobConstructor]");
const withNativeArrayBuffer = typeof ArrayBuffer === "function";

// ArrayBuffer.isView method is not defined in IE10
const isView = obj => {
  return typeof ArrayBuffer.isView === "function"
    ? ArrayBuffer.isView(obj)
    : obj && obj.buffer instanceof ArrayBuffer;
};

const encodePacket = ({ type, data }, supportsBinary, callback) => {
  if (withNativeBlob && data instanceof Blob) {
    if (supportsBinary) {
      return callback(data);
    } else {
      return encodeBlobAsBase64(data, callback);
    }
  } else if (
    withNativeArrayBuffer &&
    (data instanceof ArrayBuffer || isView(data))
  ) {
    if (supportsBinary) {
      return callback(data);
    } else {
      return encodeBlobAsBase64(new Blob([data]), callback);
    }
  }
  // plain string
  return callback(PACKET_TYPES[type] + (data || ""));
};

const encodeBlobAsBase64 = (data, callback) => {
  const fileReader = new FileReader();
  fileReader.onload = function() {
    const content = fileReader.result.split(",")[1];
    callback("b" + content);
  };
  return fileReader.readAsDataURL(data);
};

module.exports = encodePacket;


/***/ }),

/***/ "./node_modules/engine.io-parser/lib/index.js":
/*!****************************************************!*\
  !*** ./node_modules/engine.io-parser/lib/index.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const encodePacket = __webpack_require__(/*! ./encodePacket */ "./node_modules/engine.io-parser/lib/encodePacket.browser.js");
const decodePacket = __webpack_require__(/*! ./decodePacket */ "./node_modules/engine.io-parser/lib/decodePacket.browser.js");

const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text

const encodePayload = (packets, callback) => {
  // some packets may be added to the array while encoding, so the initial length must be saved
  const length = packets.length;
  const encodedPackets = new Array(length);
  let count = 0;

  packets.forEach((packet, i) => {
    // force base64 encoding for binary packets
    encodePacket(packet, false, encodedPacket => {
      encodedPackets[i] = encodedPacket;
      if (++count === length) {
        callback(encodedPackets.join(SEPARATOR));
      }
    });
  });
};

const decodePayload = (encodedPayload, binaryType) => {
  const encodedPackets = encodedPayload.split(SEPARATOR);
  const packets = [];
  for (let i = 0; i < encodedPackets.length; i++) {
    const decodedPacket = decodePacket(encodedPackets[i], binaryType);
    packets.push(decodedPacket);
    if (decodedPacket.type === "error") {
      break;
    }
  }
  return packets;
};

module.exports = {
  protocol: 4,
  encodePacket,
  encodePayload,
  decodePacket,
  decodePayload
};


/***/ }),

/***/ "./node_modules/has-cors/index.js":
/*!****************************************!*\
  !*** ./node_modules/has-cors/index.js ***!
  \****************************************/
/***/ ((module) => {


/**
 * Module exports.
 *
 * Logic borrowed from Modernizr:
 *
 *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
 */

try {
  module.exports = typeof XMLHttpRequest !== 'undefined' &&
    'withCredentials' in new XMLHttpRequest();
} catch (err) {
  // if XMLHttp support is disabled in IE then it will throw
  // when trying to create
  module.exports = false;
}


/***/ }),

/***/ "./node_modules/parseqs/index.js":
/*!***************************************!*\
  !*** ./node_modules/parseqs/index.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports) => {

/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */

exports.encode = function (obj) {
  var str = '';

  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (str.length) str += '&';
      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
    }
  }

  return str;
};

/**
 * Parses a simple querystring into an object
 *
 * @param {String} qs
 * @api private
 */

exports.decode = function(qs){
  var qry = {};
  var pairs = qs.split('&');
  for (var i = 0, l = pairs.length; i < l; i++) {
    var pair = pairs[i].split('=');
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return qry;
};


/***/ }),

/***/ "./node_modules/parseuri/index.js":
/*!****************************************!*\
  !*** ./node_modules/parseuri/index.js ***!
  \****************************************/
/***/ ((module) => {

/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

module.exports = function parseuri(str) {
    var src = str,
        b = str.indexOf('['),
        e = str.indexOf(']');

    if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
    }

    var m = re.exec(str || ''),
        uri = {},
        i = 14;

    while (i--) {
        uri[parts[i]] = m[i] || '';
    }

    if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
    }

    uri.pathNames = pathNames(uri, uri['path']);
    uri.queryKey = queryKey(uri, uri['query']);

    return uri;
};

function pathNames(obj, path) {
    var regx = /\/{2,9}/g,
        names = path.replace(regx, "/").split("/");

    if (path.substr(0, 1) == '/' || path.length === 0) {
        names.splice(0, 1);
    }
    if (path.substr(path.length - 1, 1) == '/') {
        names.splice(names.length - 1, 1);
    }

    return names;
}

function queryKey(uri, query) {
    var data = {};

    query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
        if ($1) {
            data[$1] = $2;
        }
    });

    return data;
}


/***/ }),

/***/ "./node_modules/socket.io-parser/dist/binary.js":
/*!******************************************************!*\
  !*** ./node_modules/socket.io-parser/dist/binary.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.reconstructPacket = exports.deconstructPacket = void 0;
const is_binary_1 = __webpack_require__(/*! ./is-binary */ "./node_modules/socket.io-parser/dist/is-binary.js");
/**
 * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
 *
 * @param {Object} packet - socket.io event packet
 * @return {Object} with deconstructed packet and list of buffers
 * @public
 */
function deconstructPacket(packet) {
    const buffers = [];
    const packetData = packet.data;
    const pack = packet;
    pack.data = _deconstructPacket(packetData, buffers);
    pack.attachments = buffers.length; // number of binary 'attachments'
    return { packet: pack, buffers: buffers };
}
exports.deconstructPacket = deconstructPacket;
function _deconstructPacket(data, buffers) {
    if (!data)
        return data;
    if (is_binary_1.isBinary(data)) {
        const placeholder = { _placeholder: true, num: buffers.length };
        buffers.push(data);
        return placeholder;
    }
    else if (Array.isArray(data)) {
        const newData = new Array(data.length);
        for (let i = 0; i < data.length; i++) {
            newData[i] = _deconstructPacket(data[i], buffers);
        }
        return newData;
    }
    else if (typeof data === "object" && !(data instanceof Date)) {
        const newData = {};
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                newData[key] = _deconstructPacket(data[key], buffers);
            }
        }
        return newData;
    }
    return data;
}
/**
 * Reconstructs a binary packet from its placeholder packet and buffers
 *
 * @param {Object} packet - event packet with placeholders
 * @param {Array} buffers - binary buffers to put in placeholder positions
 * @return {Object} reconstructed packet
 * @public
 */
function reconstructPacket(packet, buffers) {
    packet.data = _reconstructPacket(packet.data, buffers);
    packet.attachments = undefined; // no longer useful
    return packet;
}
exports.reconstructPacket = reconstructPacket;
function _reconstructPacket(data, buffers) {
    if (!data)
        return data;
    if (data && data._placeholder === true) {
        const isIndexValid = typeof data.num === "number" &&
            data.num >= 0 &&
            data.num < buffers.length;
        if (isIndexValid) {
            return buffers[data.num]; // appropriate buffer (should be natural order anyway)
        }
        else {
            throw new Error("illegal attachments");
        }
    }
    else if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            data[i] = _reconstructPacket(data[i], buffers);
        }
    }
    else if (typeof data === "object") {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                data[key] = _reconstructPacket(data[key], buffers);
            }
        }
    }
    return data;
}


/***/ }),

/***/ "./node_modules/socket.io-parser/dist/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/socket.io-parser/dist/index.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Decoder = exports.Encoder = exports.PacketType = exports.protocol = void 0;
const Emitter = __webpack_require__(/*! component-emitter */ "./node_modules/component-emitter/index.js");
const binary_1 = __webpack_require__(/*! ./binary */ "./node_modules/socket.io-parser/dist/binary.js");
const is_binary_1 = __webpack_require__(/*! ./is-binary */ "./node_modules/socket.io-parser/dist/is-binary.js");
const debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("socket.io-parser");
/**
 * Protocol version.
 *
 * @public
 */
exports.protocol = 5;
var PacketType;
(function (PacketType) {
    PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
    PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
    PacketType[PacketType["EVENT"] = 2] = "EVENT";
    PacketType[PacketType["ACK"] = 3] = "ACK";
    PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
    PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
    PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
})(PacketType = exports.PacketType || (exports.PacketType = {}));
/**
 * A socket.io Encoder instance
 */
class Encoder {
    /**
     * Encode a packet as a single string if non-binary, or as a
     * buffer sequence, depending on packet type.
     *
     * @param {Object} obj - packet object
     */
    encode(obj) {
        debug("encoding packet %j", obj);
        if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
            if (is_binary_1.hasBinary(obj)) {
                obj.type =
                    obj.type === PacketType.EVENT
                        ? PacketType.BINARY_EVENT
                        : PacketType.BINARY_ACK;
                return this.encodeAsBinary(obj);
            }
        }
        return [this.encodeAsString(obj)];
    }
    /**
     * Encode packet as string.
     */
    encodeAsString(obj) {
        // first is type
        let str = "" + obj.type;
        // attachments if we have them
        if (obj.type === PacketType.BINARY_EVENT ||
            obj.type === PacketType.BINARY_ACK) {
            str += obj.attachments + "-";
        }
        // if we have a namespace other than `/`
        // we append it followed by a comma `,`
        if (obj.nsp && "/" !== obj.nsp) {
            str += obj.nsp + ",";
        }
        // immediately followed by the id
        if (null != obj.id) {
            str += obj.id;
        }
        // json data
        if (null != obj.data) {
            str += JSON.stringify(obj.data);
        }
        debug("encoded %j as %s", obj, str);
        return str;
    }
    /**
     * Encode packet as 'buffer sequence' by removing blobs, and
     * deconstructing packet into object with placeholders and
     * a list of buffers.
     */
    encodeAsBinary(obj) {
        const deconstruction = binary_1.deconstructPacket(obj);
        const pack = this.encodeAsString(deconstruction.packet);
        const buffers = deconstruction.buffers;
        buffers.unshift(pack); // add packet info to beginning of data list
        return buffers; // write all the buffers
    }
}
exports.Encoder = Encoder;
/**
 * A socket.io Decoder instance
 *
 * @return {Object} decoder
 */
class Decoder extends Emitter {
    constructor() {
        super();
    }
    /**
     * Decodes an encoded packet string into packet JSON.
     *
     * @param {String} obj - encoded packet
     */
    add(obj) {
        let packet;
        if (typeof obj === "string") {
            if (this.reconstructor) {
                throw new Error("got plaintext data when reconstructing a packet");
            }
            packet = this.decodeString(obj);
            if (packet.type === PacketType.BINARY_EVENT ||
                packet.type === PacketType.BINARY_ACK) {
                // binary packet's json
                this.reconstructor = new BinaryReconstructor(packet);
                // no attachments, labeled binary but no binary data to follow
                if (packet.attachments === 0) {
                    super.emit("decoded", packet);
                }
            }
            else {
                // non-binary full packet
                super.emit("decoded", packet);
            }
        }
        else if (is_binary_1.isBinary(obj) || obj.base64) {
            // raw binary data
            if (!this.reconstructor) {
                throw new Error("got binary data when not reconstructing a packet");
            }
            else {
                packet = this.reconstructor.takeBinaryData(obj);
                if (packet) {
                    // received final buffer
                    this.reconstructor = null;
                    super.emit("decoded", packet);
                }
            }
        }
        else {
            throw new Error("Unknown type: " + obj);
        }
    }
    /**
     * Decode a packet String (JSON data)
     *
     * @param {String} str
     * @return {Object} packet
     */
    decodeString(str) {
        let i = 0;
        // look up type
        const p = {
            type: Number(str.charAt(0)),
        };
        if (PacketType[p.type] === undefined) {
            throw new Error("unknown packet type " + p.type);
        }
        // look up attachments if type binary
        if (p.type === PacketType.BINARY_EVENT ||
            p.type === PacketType.BINARY_ACK) {
            const start = i + 1;
            while (str.charAt(++i) !== "-" && i != str.length) { }
            const buf = str.substring(start, i);
            if (buf != Number(buf) || str.charAt(i) !== "-") {
                throw new Error("Illegal attachments");
            }
            p.attachments = Number(buf);
        }
        // look up namespace (if any)
        if ("/" === str.charAt(i + 1)) {
            const start = i + 1;
            while (++i) {
                const c = str.charAt(i);
                if ("," === c)
                    break;
                if (i === str.length)
                    break;
            }
            p.nsp = str.substring(start, i);
        }
        else {
            p.nsp = "/";
        }
        // look up id
        const next = str.charAt(i + 1);
        if ("" !== next && Number(next) == next) {
            const start = i + 1;
            while (++i) {
                const c = str.charAt(i);
                if (null == c || Number(c) != c) {
                    --i;
                    break;
                }
                if (i === str.length)
                    break;
            }
            p.id = Number(str.substring(start, i + 1));
        }
        // look up json data
        if (str.charAt(++i)) {
            const payload = tryParse(str.substr(i));
            if (Decoder.isPayloadValid(p.type, payload)) {
                p.data = payload;
            }
            else {
                throw new Error("invalid payload");
            }
        }
        debug("decoded %s as %j", str, p);
        return p;
    }
    static isPayloadValid(type, payload) {
        switch (type) {
            case PacketType.CONNECT:
                return typeof payload === "object";
            case PacketType.DISCONNECT:
                return payload === undefined;
            case PacketType.CONNECT_ERROR:
                return typeof payload === "string" || typeof payload === "object";
            case PacketType.EVENT:
            case PacketType.BINARY_EVENT:
                return Array.isArray(payload) && payload.length > 0;
            case PacketType.ACK:
            case PacketType.BINARY_ACK:
                return Array.isArray(payload);
        }
    }
    /**
     * Deallocates a parser's resources
     */
    destroy() {
        if (this.reconstructor) {
            this.reconstructor.finishedReconstruction();
        }
    }
}
exports.Decoder = Decoder;
function tryParse(str) {
    try {
        return JSON.parse(str);
    }
    catch (e) {
        return false;
    }
}
/**
 * A manager of a binary event's 'buffer sequence'. Should
 * be constructed whenever a packet of type BINARY_EVENT is
 * decoded.
 *
 * @param {Object} packet
 * @return {BinaryReconstructor} initialized reconstructor
 */
class BinaryReconstructor {
    constructor(packet) {
        this.packet = packet;
        this.buffers = [];
        this.reconPack = packet;
    }
    /**
     * Method to be called when binary data received from connection
     * after a BINARY_EVENT packet.
     *
     * @param {Buffer | ArrayBuffer} binData - the raw binary data received
     * @return {null | Object} returns null if more binary data is expected or
     *   a reconstructed packet object if all buffers have been received.
     */
    takeBinaryData(binData) {
        this.buffers.push(binData);
        if (this.buffers.length === this.reconPack.attachments) {
            // done with buffer list
            const packet = binary_1.reconstructPacket(this.reconPack, this.buffers);
            this.finishedReconstruction();
            return packet;
        }
        return null;
    }
    /**
     * Cleans up binary packet reconstruction variables.
     */
    finishedReconstruction() {
        this.reconPack = null;
        this.buffers = [];
    }
}


/***/ }),

/***/ "./node_modules/socket.io-parser/dist/is-binary.js":
/*!*********************************************************!*\
  !*** ./node_modules/socket.io-parser/dist/is-binary.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.hasBinary = exports.isBinary = void 0;
const withNativeArrayBuffer = typeof ArrayBuffer === "function";
const isView = (obj) => {
    return typeof ArrayBuffer.isView === "function"
        ? ArrayBuffer.isView(obj)
        : obj.buffer instanceof ArrayBuffer;
};
const toString = Object.prototype.toString;
const withNativeBlob = typeof Blob === "function" ||
    (typeof Blob !== "undefined" &&
        toString.call(Blob) === "[object BlobConstructor]");
const withNativeFile = typeof File === "function" ||
    (typeof File !== "undefined" &&
        toString.call(File) === "[object FileConstructor]");
/**
 * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
 *
 * @private
 */
function isBinary(obj) {
    return ((withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj))) ||
        (withNativeBlob && obj instanceof Blob) ||
        (withNativeFile && obj instanceof File));
}
exports.isBinary = isBinary;
function hasBinary(obj, toJSON) {
    if (!obj || typeof obj !== "object") {
        return false;
    }
    if (Array.isArray(obj)) {
        for (let i = 0, l = obj.length; i < l; i++) {
            if (hasBinary(obj[i])) {
                return true;
            }
        }
        return false;
    }
    if (isBinary(obj)) {
        return true;
    }
    if (obj.toJSON &&
        typeof obj.toJSON === "function" &&
        arguments.length === 1) {
        return hasBinary(obj.toJSON(), true);
    }
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
            return true;
        }
    }
    return false;
}
exports.hasBinary = hasBinary;


/***/ }),

/***/ "./src/actionTab.ts":
/*!**************************!*\
  !*** ./src/actionTab.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ActionTab = exports.ActionState = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var ActionState;
(function (ActionState) {
    ActionState[ActionState["READY"] = 0] = "READY";
    ActionState[ActionState["ATTACK"] = 1] = "ATTACK";
    ActionState[ActionState["WAIT"] = 2] = "WAIT";
    ActionState[ActionState["HALFATTACK"] = 3] = "HALFATTACK";
    ActionState[ActionState["MOVE"] = 4] = "MOVE";
})(ActionState = exports.ActionState || (exports.ActionState = {}));
var ActionTab = /** @class */ (function () {
    function ActionTab(inventory, game) {
        var _this = this;
        this.tick = function () { };
        this.getWeapon = function (player) {
            _this.weapon = player.inventory.weapon;
        };
        this.setState = function (state) {
            _this.actionState = state;
        };
        this.draw = function (delta) {
            var tabX = levelConstants_1.LevelConstants.SCREEN_W / 2;
            var tabY = levelConstants_1.LevelConstants.SCREEN_H - 1;
            var action = _this.actionState;
            var actionString = "" + ActionState[action];
            var width = game_1.Game.measureText(actionString).width;
            var actionX = 4 - width / 2;
            var actionY = -1;
            game_1.Game.fillTextOutline(actionString, tabX * gameConstants_1.GameConstants.TILESIZE + actionX, tabY * gameConstants_1.GameConstants.TILESIZE + actionY, gameConstants_1.GameConstants.OUTLINE, "white");
        };
        this.weapon = inventory.weapon;
        this.game = game;
    }
    return ActionTab;
}());
exports.ActionTab = ActionTab;


/***/ }),

/***/ "./src/astarclass.ts":
/*!***************************!*\
  !*** ./src/astarclass.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.astar = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy/enemy */ "./src/enemy/enemy.ts");
var astar;
(function (astar_1) {
    //================== start graph js
    /*
    graph.js http://github.com/bgrins/javascript-astar
    MIT License
    Creates a Graph class used in the astar search algorithm.
    Includes Binary Heap (with modifications) from Marijn Haverbeke
        URL: http://eloquentjavascript.net/appendix2.html
        License: http://creativecommons.org/licenses/by/3.0/
    */
    var GraphNodeType;
    (function (GraphNodeType) {
        GraphNodeType[GraphNodeType["WALL"] = 0] = "WALL";
        GraphNodeType[GraphNodeType["OPEN"] = 1] = "OPEN";
    })(GraphNodeType = astar_1.GraphNodeType || (astar_1.GraphNodeType = {}));
    var getTileCost = function (tile) {
        if (tile)
            return (tile.isSolid() || tile.isDoor) ? 99999999 : 1;
        else
            return 99999999;
    };
    var Graph = /** @class */ (function () {
        function Graph(grid) {
            this.elements = grid;
            var nodes = [];
            var row, rowLength, len = grid.length;
            for (var x = 0; x < len; ++x) {
                row = grid[x];
                rowLength = row.length;
                nodes[x] = new Array(rowLength); // optimum array with size
                for (var y = 0; y < rowLength; ++y) {
                    nodes[x][y] = new GraphNode(x, y, row[y]);
                }
            }
            this.nodes = nodes;
        }
        Graph.prototype.toString = function () {
            var graphString = "\n";
            var nodes = this.nodes;
            var rowDebug, row, y, l;
            for (var x = 0, len = nodes.length; x < len;) {
                rowDebug = "";
                row = nodes[x++];
                for (y = 0, l = row.length; y < l;) {
                    rowDebug += row[y++].type + " ";
                }
                graphString = graphString + rowDebug + "\n";
            }
            return graphString;
        };
        return Graph;
    }());
    astar_1.Graph = Graph;
    var GraphNode = /** @class */ (function () {
        function GraphNode(x, y, type) {
            this.data = {};
            this.x = x;
            this.y = y;
            this.pos = { x: x, y: y };
            this.type = type;
        }
        GraphNode.prototype.toString = function () {
            return "[" + this.x + " " + this.y + "]";
        };
        GraphNode.prototype.isWall = function () {
            return this.type == GraphNodeType.WALL;
        };
        return GraphNode;
    }());
    astar_1.GraphNode = GraphNode;
    var BinaryHeap = /** @class */ (function () {
        function BinaryHeap(scoreFunction) {
            this.content = [];
            this.scoreFunction = scoreFunction;
        }
        BinaryHeap.prototype.push = function (node) {
            // Add the new node to the end of the array.
            this.content.push(node);
            // Allow it to sink down.
            this.sinkDown(this.content.length - 1);
        };
        BinaryHeap.prototype.pop = function () {
            // Store the first node so we can return it later.
            var result = this.content[0];
            // Get the node at the end of the array.
            var end = this.content.pop();
            // If there are any elements left, put the end node at the
            // start, and let it bubble up.
            if (this.content.length > 0) {
                this.content[0] = end;
                this.bubbleUp(0);
            }
            return result;
        };
        BinaryHeap.prototype.remove = function (node) {
            var i = this.content.indexOf(node);
            // When it is found, the process seen in 'pop' is repeated
            // to fill up the hole.
            var end = this.content.pop();
            if (i !== this.content.length - 1) {
                this.content[i] = end;
                if (this.scoreFunction(end) < this.scoreFunction(node))
                    this.sinkDown(i);
                else
                    this.bubbleUp(i);
            }
        };
        BinaryHeap.prototype.size = function () {
            return this.content.length;
        };
        BinaryHeap.prototype.rescoreElement = function (node) {
            this.sinkDown(this.content.indexOf(node));
        };
        BinaryHeap.prototype.sinkDown = function (n) {
            // Fetch the element that has to be sunk.
            var element = this.content[n];
            // When at 0, an element can not sink any further.
            while (n > 0) {
                // Compute the parent element's index, and fetch it.
                var parentN = ((n + 1) >> 1) - 1, parent = this.content[parentN];
                // Swap the elements if the parent is greater.
                if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                    this.content[parentN] = element;
                    this.content[n] = parent;
                    // Update 'n' to continue at the new position.
                    n = parentN;
                }
                else {
                    // Found a parent that is less, no need to sink any further.
                    break;
                }
            }
        };
        BinaryHeap.prototype.bubbleUp = function (n) {
            // Look up the target element and its score.
            var length = this.content.length, element = this.content[n], elemScore = this.scoreFunction(element);
            while (true) {
                // Compute the indices of the child elements.
                var child2N = (n + 1) << 1, child1N = child2N - 1;
                // This is used to store the new position of the element,
                // if any.
                var swap = null;
                // If the first child exists (is inside the array)...
                if (child1N < length) {
                    // Look it up and compute its score.
                    var child1 = this.content[child1N], child1Score = this.scoreFunction(child1);
                    // If the score is less than our element's, we need to swap.
                    if (child1Score < elemScore)
                        swap = child1N;
                }
                // Do the same checks for the other child.
                if (child2N < length) {
                    var child2 = this.content[child2N], child2Score = this.scoreFunction(child2);
                    if (child2Score < (swap === null ? elemScore : child1Score))
                        swap = child2N;
                }
                // If the element needs to be moved, swap it, and continue.
                if (swap !== null) {
                    this.content[n] = this.content[swap];
                    this.content[swap] = element;
                    n = swap;
                }
                else {
                    // Otherwise, we are done.
                    break;
                }
            }
        };
        return BinaryHeap;
    }());
    astar_1.BinaryHeap = BinaryHeap;
    var AStar = /** @class */ (function () {
        function AStar(grid, disablePoints, enableCost) {
            this.grid = [];
            for (var x = 0, xl = grid.length; x < xl; x++) {
                this.grid[x] = [];
                for (var y = 0, yl = grid[x].length; y < yl; y++) {
                    var cost = getTileCost(grid[x][y]);
                    this.grid[x][y] = {
                        org: grid[x][y],
                        f: 0,
                        g: 0,
                        h: 0,
                        cost: cost,
                        visited: false,
                        closed: false,
                        pos: {
                            x: x,
                            y: y,
                        },
                        parent: null,
                    };
                }
            }
            if (disablePoints !== undefined) {
                for (var i = 0; i < disablePoints.length; i++)
                    this.grid[disablePoints[i].x][disablePoints[i].y].cost = 99999999;
            }
        }
        AStar.prototype.heap = function () {
            return new BinaryHeap(function (node) {
                return node.f;
            });
        };
        AStar.prototype._find = function (org) {
            for (var x = 0; x < this.grid.length; x++)
                for (var y = 0; y < this.grid[x].length; y++)
                    if (this.grid[x][y].org == org)
                        return this.grid[x][y];
        };
        AStar.prototype._search = function (start, end, diagonal, diagonalsOnly, turnCostsExtra, turnDirection, heuristic, diagonalsOmni) {
            heuristic = heuristic || this.manhattan;
            diagonal = !!diagonal;
            diagonalsOnly = !!diagonalsOnly;
            turnCostsExtra = !!turnCostsExtra;
            diagonalsOmni = !!diagonalsOmni;
            var openHeap = this.heap();
            var _start, _end;
            if (start.x !== undefined && start.y !== undefined)
                _start = this.grid[start.x][start.y];
            else
                _start = this._find(start);
            if (end.x !== undefined && end.y !== undefined)
                _end = this.grid[end.x][end.y];
            else
                _end = this._find(end);
            if (AStar.NO_CHECK_START_POINT == false && _start.cost <= 0)
                return [];
            openHeap.push(_start);
            while (openHeap.size() > 0) {
                // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
                var currentNode = openHeap.pop();
                // End case -- result has been found, return the traced path.
                if (currentNode === _end) {
                    var curr = currentNode;
                    var ret = [];
                    while (curr.parent) {
                        ret.push(curr);
                        curr = curr.parent;
                    }
                    return ret.reverse();
                }
                // Normal case -- move currentNode from open to closed, process each of its neighbors.
                currentNode.closed = true;
                // Find all neighbors for the current node. Optionally find diagonal neighbors as well (false by default).
                var neighbors = this.neighbors(currentNode, diagonal, diagonalsOnly, diagonalsOmni);
                for (var i = 0, il = neighbors.length; i < il; i++) {
                    var neighbor = neighbors[i];
                    if (neighbor.closed || neighbor.cost <= 0) {
                        // Not a valid node to process, skip to next neighbor.
                        continue;
                    }
                    // The g score is the shortest distance from start to current node.
                    // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
                    var gScore = currentNode.g + neighbor.cost;
                    if (turnCostsExtra) {
                        var isTurn = false;
                        if (currentNode.parent)
                            isTurn = !((currentNode.parent.pos.x === currentNode.pos.x && currentNode.pos.x === neighbor.pos.x) || (currentNode.parent.pos.y === currentNode.pos.y && currentNode.pos.y === neighbor.pos.y));
                        else { // initial step
                            isTurn = true;
                            if (neighbor.pos.x - currentNode.pos.x === 0 && neighbor.pos.y - currentNode.pos.y === -1 && turnDirection === enemy_1.EnemyDirection.UP)
                                isTurn = false;
                            if (neighbor.pos.x - currentNode.pos.x === 0 && neighbor.pos.y - currentNode.pos.y === 1 && turnDirection === enemy_1.EnemyDirection.DOWN)
                                isTurn = false;
                            if (neighbor.pos.x - currentNode.pos.x === 1 && neighbor.pos.y - currentNode.pos.y === 0 && turnDirection === enemy_1.EnemyDirection.RIGHT)
                                isTurn = false;
                            if (neighbor.pos.x - currentNode.pos.x === -1 && neighbor.pos.y - currentNode.pos.y === 0 && turnDirection === enemy_1.EnemyDirection.LEFT)
                                isTurn = false;
                        }
                        if (isTurn)
                            gScore++;
                    }
                    var beenVisited = neighbor.visited;
                    if (!beenVisited || gScore < neighbor.g) {
                        // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                        neighbor.visited = true;
                        neighbor.parent = currentNode;
                        neighbor.h = neighbor.h || heuristic(neighbor.pos, _end.pos);
                        neighbor.g = gScore;
                        neighbor.f = neighbor.g + neighbor.h;
                        if (!beenVisited) {
                            // Pushing to heap will put it in proper place based on the 'f' value.
                            openHeap.push(neighbor);
                        }
                        else {
                            // Already seen the node, but since it has been rescored we need to reorder it in the heap
                            openHeap.rescoreElement(neighbor);
                        }
                    }
                }
            }
            // No result was found - empty array signifies failure to find path.
            return [];
        };
        AStar.search = function (grid, start, end, disablePoints, diagonal, diagonalsOnly, turnCostsExtra, turnDirection, heuristic, diagonalsOmni) {
            var astar = new AStar(grid, disablePoints);
            return astar._search(start, end, diagonal, diagonalsOnly, turnCostsExtra, turnDirection, heuristic, diagonalsOmni);
        };
        AStar.prototype.manhattan = function (pos0, pos1) {
            // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            return d1 + d2;
        };
        AStar.prototype.neighbors = function (node, diagonals, diagonalsOnly, diagonalsOmni) {
            var grid = this.grid;
            var ret = [];
            var x = node.pos.x;
            var y = node.pos.y;
            if (!diagonalsOnly) {
                // West
                if (grid[x - 1] && grid[x - 1][y]) {
                    ret.push(grid[x - 1][y]);
                }
                // East
                if (grid[x + 1] && grid[x + 1][y]) {
                    ret.push(grid[x + 1][y]);
                }
                // South
                if (grid[x] && grid[x][y - 1]) {
                    ret.push(grid[x][y - 1]);
                }
                // North
                if (grid[x] && grid[x][y + 1]) {
                    ret.push(grid[x][y + 1]);
                }
            }
            if (diagonals) {
                // Southwest
                if (grid[x - 1] && grid[x - 1][y - 1]) {
                    ret.push(grid[x - 1][y - 1]);
                }
                // Southeast
                if (grid[x + 1] && grid[x + 1][y - 1]) {
                    ret.push(grid[x + 1][y - 1]);
                }
                // Northwest
                if (grid[x - 1] && grid[x - 1][y + 1]) {
                    ret.push(grid[x - 1][y + 1]);
                }
                // Northeast
                if (grid[x + 1] && grid[x + 1][y + 1]) {
                    ret.push(grid[x + 1][y + 1]);
                }
            }
            function getRandomBoolean() {
                return Math.random() < 0.5;
            }
            if (diagonalsOmni) {
                var randomBool = getRandomBoolean();
                // West
                if (grid[x - 1] && grid[x - 1][y]) {
                    // Instead of pushing West, choose between Southwest and Northwest
                    if (randomBool == true) {
                        ret.push(grid[x - 1][y - 1]), console.log("Southwest");
                        return;
                    }
                    else {
                        ret.push(grid[x - 1][y + 1]), console.log("Northwest");
                        return;
                    }
                }
                // East
                if (grid[x + 1] && grid[x + 1][y]) {
                    if (randomBool == true) {
                        ret.push(grid[x + 1][y - 1]), console.log("Southeast");
                        return;
                    }
                    else {
                        ret.push(grid[x + 1][y + 1]), console.log("Northeast");
                        return;
                    }
                }
                // South
                if (grid[x] && grid[x][y - 1]) {
                    if (randomBool == true) {
                        ret.push(grid[x - 1][y - 1]), console.log("Southwest");
                        return;
                    }
                    else {
                        ret.push(grid[x + 1][y - 1]), console.log("Southeast");
                        return;
                    }
                }
                // North
                if (grid[x] && grid[x][y + 1]) {
                    if (randomBool == true) {
                        ret.push(grid[x - 1][y + 1]), console.log("Northwest");
                        return;
                    }
                    else {
                        ret.push(grid[x + 1][y + 1]), console.log("Northeast");
                        return;
                    }
                }
                else {
                    return;
                }
            }
            return ret;
        };
        AStar.NO_CHECK_START_POINT = false;
        return AStar;
    }());
    astar_1.AStar = AStar;
})(astar = exports.astar || (exports.astar = {}));


/***/ }),

/***/ "./src/drawable.ts":
/*!*************************!*\
  !*** ./src/drawable.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Drawable = void 0;
var Drawable = /** @class */ (function () {
    function Drawable() {
        this.drawableY = 0;
        this.draw = function (delta) { };
    }
    return Drawable;
}());
exports.Drawable = Drawable;


/***/ }),

/***/ "./src/enemy/armoredzombieEnemy.ts":
/*!*****************************************!*\
  !*** ./src/enemy/armoredzombieEnemy.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ArmoredzombieEnemy = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coin_1 = __webpack_require__(/*! ../item/coin */ "./src/item/coin.ts");
var greengem_1 = __webpack_require__(/*! ../item/greengem */ "./src/item/greengem.ts");
var random_1 = __webpack_require__(/*! ../random */ "./src/random.ts");
var astarclass_1 = __webpack_require__(/*! ../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../tile/spiketrap */ "./src/tile/spiketrap.ts");
var pickaxe_1 = __webpack_require__(/*! ../weapon/pickaxe */ "./src/weapon/pickaxe.ts");
var ArmoredzombieEnemy = /** @class */ (function (_super) {
    __extends(ArmoredzombieEnemy, _super);
    function ArmoredzombieEnemy(level, game, x, y, rand, drop) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hit = function () {
            return 1;
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                //this.facePlayer(playerHitBy); // 
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.health -= damage;
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
                genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, _this.deathParticleColor);
            }
        };
        _this.tick = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.ticks++;
                if (!_this.seenPlayer) {
                    var p = _this.nearestPlayer();
                    if (p !== false) {
                        var distance = p[0], player = p[1];
                        if (distance <= 4) {
                            _this.targetPlayer = player;
                            _this.facePlayer(player);
                            _this.seenPlayer = true;
                            if (player === _this.game.players[_this.game.localPlayerID])
                                _this.alertTicks = 1;
                            /*this.level.hitwarnings.push(new HitWarning(this.game, this.x - 1, this.y));
                            this.level.hitwarnings.push(new HitWarning(this.game, this.x + 1, this.y));
                            this.level.hitwarnings.push(new HitWarning(this.game, this.x, this.y - 1));
                            this.level.hitwarnings.push(new HitWarning(this.game, this.x, this.y + 1));*/
                        }
                    }
                }
                else if (_this.seenPlayer) {
                    if (_this.level.playerTicked === _this.targetPlayer) {
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        var oldX = _this.x;
                        var oldY = _this.y;
                        var disablePositions = Array();
                        for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                            var e = _a[_i];
                            if (e !== _this) {
                                disablePositions.push({ x: e.x, y: e.y });
                            }
                        }
                        for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                            for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                if (_this.level.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                    _this.level.roomArray[xx][yy].on) {
                                    // don't walk on active spiketraps
                                    disablePositions.push({ x: xx, y: yy });
                                }
                            }
                        }
                        var grid = [];
                        for (var x = 0; x < _this.level.roomX + _this.level.width; x++) {
                            grid[x] = [];
                            for (var y = 0; y < _this.level.roomY + _this.level.height; y++) {
                                if (_this.level.roomArray[x] && _this.level.roomArray[x][y])
                                    grid[x][y] = _this.level.roomArray[x][y];
                                else
                                    grid[x][y] = false;
                            }
                        }
                        var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, false, false, true, _this.direction);
                        if (moves.length > 0) {
                            var moveX = moves[0].pos.x;
                            var moveY = moves[0].pos.y;
                            var oldDir = _this.direction;
                            var player = _this.targetPlayer;
                            _this.facePlayer(player);
                            if (moveX > oldX)
                                _this.direction = enemy_1.EnemyDirection.RIGHT;
                            else if (moveX < oldX)
                                _this.direction = enemy_1.EnemyDirection.LEFT;
                            else if (moveY > oldY)
                                _this.direction = enemy_1.EnemyDirection.DOWN;
                            else if (moveY < oldY)
                                _this.direction = enemy_1.EnemyDirection.UP;
                            if (oldDir == _this.direction) {
                                var hitPlayer = false;
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.level && _this.game.players[i].x === moveX && _this.game.players[i].y === moveY && (oldDir == _this.direction)) {
                                        _this.game.players[i].hurt(_this.hit(), "armored zombie");
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] === _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                    }
                                }
                                if (!hitPlayer) {
                                    _this.tryMove(moveX, moveY);
                                    _this.drawX = _this.x - oldX;
                                    _this.drawY = _this.y - oldY;
                                    if (_this.x > oldX)
                                        _this.direction = enemy_1.EnemyDirection.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = enemy_1.EnemyDirection.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = enemy_1.EnemyDirection.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = enemy_1.EnemyDirection.UP;
                                }
                            }
                        }
                        if (_this.direction == enemy_1.EnemyDirection.LEFT) {
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                            disablePositions.push({ x: _this.x, y: _this.y + 1 });
                            disablePositions.push({ x: _this.x, y: _this.y - 1 });
                        }
                        if (_this.direction == enemy_1.EnemyDirection.RIGHT) {
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                            disablePositions.push({ x: _this.x, y: _this.y + 1 });
                            disablePositions.push({ x: _this.x, y: _this.y - 1 });
                        }
                        if (_this.direction == enemy_1.EnemyDirection.DOWN) {
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                            disablePositions.push({ x: _this.x + 1, y: _this.y });
                            disablePositions.push({ x: _this.x - 1, y: _this.y });
                        }
                        if (_this.direction == enemy_1.EnemyDirection.UP) {
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                            disablePositions.push({ x: _this.x + 1, y: _this.y });
                            disablePositions.push({ x: _this.x - 1, y: _this.y });
                        }
                    }
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !== -1;
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 && (targetPlayerOffline || distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    if (_this.direction == enemy_1.EnemyDirection.LEFT) {
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                                    }
                                    if (_this.direction == enemy_1.EnemyDirection.RIGHT) {
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                                    }
                                    if (_this.direction == enemy_1.EnemyDirection.DOWN) {
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                                    }
                                    if (_this.direction == enemy_1.EnemyDirection.UP) {
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.tileX = 27;
                _this.tileY = 8;
                if (_this.health <= 1) {
                    _this.tileX = 17;
                    _this.tileY = 8;
                }
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + (_this.tileX === 5 ? Math.floor(_this.frame) : 0), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 2;
        _this.maxHealth = 1;
        _this.tileX = 17;
        _this.tileY = 8;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.deathParticleColor = "#ffffff";
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.025)
                _this.drop = new pickaxe_1.Pickaxe(_this.level, 0, 0);
            else if (dropProb < 0.02)
                _this.drop = new greengem_1.GreenGem(_this.level, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.level, 0, 0);
        }
        return _this;
    }
    return ArmoredzombieEnemy;
}(enemy_1.Enemy));
exports.ArmoredzombieEnemy = ArmoredzombieEnemy;


/***/ }),

/***/ "./src/enemy/barrel.ts":
/*!*****************************!*\
  !*** ./src/enemy/barrel.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Barrel = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var enemy_2 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var Barrel = /** @class */ (function (_super) {
    __extends(Barrel, _super);
    function Barrel(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.kill = function () {
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#9badb7");
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            _this.drawX += -0.5 * _this.drawX;
            _this.drawY += -0.5 * _this.drawY;
        };
        _this.level = level;
        _this.health = 1;
        _this.tileX = 1;
        _this.tileY = 0;
        _this.hasShadow = false;
        _this.pushable = true;
        _this.entityType = enemy_2.EntityType.Prop;
        return _this;
    }
    return Barrel;
}(enemy_1.Enemy));
exports.Barrel = Barrel;


/***/ }),

/***/ "./src/enemy/bigSkullEnemy.ts":
/*!************************************!*\
  !*** ./src/enemy/bigSkullEnemy.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BigSkullEnemy = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coin_1 = __webpack_require__(/*! ../item/coin */ "./src/item/coin.ts");
var redgem_1 = __webpack_require__(/*! ../item/redgem */ "./src/item/redgem.ts");
var spear_1 = __webpack_require__(/*! ../weapon/spear */ "./src/weapon/spear.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var deathParticle_1 = __webpack_require__(/*! ../particle/deathParticle */ "./src/particle/deathParticle.ts");
var BigSkullEnemy = /** @class */ (function (_super) {
    __extends(BigSkullEnemy, _super);
    function BigSkullEnemy(level, game, x, y, rand, drop) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.REGEN_TICKS = 5;
        _this.addHitWarnings = function () {
            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y + 1));
            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 2, _this.y));
            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 2, _this.y + 1));
            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y - 1));
            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 2));
            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y + 2));
        };
        _this.hit = function () {
            return 1;
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.ticksSinceFirstHit = 0;
            _this.health -= damage;
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
                genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 1, _this.y + 1, _this.deathParticleColor);
            }
        };
        _this.killNoBones = function () {
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 1, _this.y + 1, _this.deathParticleColor);
            _this.level.particles.push(new deathParticle_1.DeathParticle(_this.x + 0.5, _this.y + 0.5));
            _this.dropLoot();
        };
        _this.tick = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (_this.health == 1) {
                    _this.ticksSinceFirstHit++;
                    if (_this.ticksSinceFirstHit >= _this.REGEN_TICKS) {
                        _this.health++;
                        _this.ticksSinceFirstHit = 0;
                    }
                }
                else {
                    _this.ticks++;
                    if (!_this.seenPlayer) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4) {
                                _this.targetPlayer = player;
                                _this.facePlayer(player);
                                _this.seenPlayer = true;
                                if (player === _this.game.players[_this.game.localPlayerID])
                                    _this.alertTicks = 1;
                                if (_this.health >= 3)
                                    _this.addHitWarnings();
                            }
                        }
                    }
                    else if (_this.seenPlayer) {
                        if (_this.level.playerTicked === _this.targetPlayer) {
                            _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                            var oldX = _this.x;
                            var oldY = _this.y;
                            var moveX = _this.x;
                            var moveY = _this.y;
                            if (_this.ticks % 2 === 0) { // horizontal preference
                                if (_this.targetPlayer.x >= _this.x + _this.w)
                                    moveX++;
                                else if (_this.targetPlayer.x < _this.x)
                                    moveX--;
                                else if (_this.targetPlayer.y >= _this.y + _this.h)
                                    moveY++;
                                else if (_this.targetPlayer.y < _this.y)
                                    moveY--;
                            }
                            else { // vertical preference
                                if (_this.targetPlayer.y >= _this.y + _this.h)
                                    moveY++;
                                else if (_this.targetPlayer.y < _this.y)
                                    moveY--;
                                else if (_this.targetPlayer.x >= _this.x + _this.w)
                                    moveX++;
                                else if (_this.targetPlayer.x < _this.x)
                                    moveX--;
                            }
                            var hitPlayer = false;
                            if (_this.health >= 3) {
                                var wouldHit = function (player, moveX, moveY) {
                                    return player.x >= moveX && player.x < moveX + _this.w && player.y >= moveY && player.y < moveY + _this.h;
                                };
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.level && wouldHit(_this.game.players[i], moveX, moveY)) {
                                        _this.game.players[i].hurt(_this.hit(), "big skeleton");
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] === _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                    }
                                }
                            }
                            if (!hitPlayer) {
                                _this.tryMove(moveX, moveY);
                                _this.drawX = _this.x - oldX;
                                _this.drawY = _this.y - oldY;
                                if (_this.x > oldX)
                                    _this.direction = enemy_1.EnemyDirection.RIGHT;
                                else if (_this.x < oldX)
                                    _this.direction = enemy_1.EnemyDirection.LEFT;
                                else if (_this.y > oldY)
                                    _this.direction = enemy_1.EnemyDirection.DOWN;
                                else if (_this.y < oldY)
                                    _this.direction = enemy_1.EnemyDirection.UP;
                            }
                            if (_this.health < _this.maxHealth) {
                                _this.ticksSinceFirstHit++;
                                if (_this.ticksSinceFirstHit >= _this.REGEN_TICKS) {
                                    _this.health++;
                                    _this.ticksSinceFirstHit = 0;
                                }
                            }
                            if (_this.health >= 3)
                                _this.addHitWarnings();
                        }
                        var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !== -1;
                        if (!_this.aggro || targetPlayerOffline) {
                            var p = _this.nearestPlayer();
                            if (p !== false) {
                                var distance = p[0], player = p[1];
                                if (distance <= 4 && (targetPlayerOffline || distance < _this.playerDistance(_this.targetPlayer))) {
                                    if (player !== _this.targetPlayer) {
                                        _this.targetPlayer = player;
                                        _this.facePlayer(player);
                                        if (player === _this.game.players[_this.game.localPlayerID])
                                            _this.alertTicks = 1;
                                        if (_this.health >= 3)
                                            _this.addHitWarnings();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.tileX = 21;
                _this.tileY = 0;
                if (_this.health === 3) {
                    _this.tileX = 21;
                    _this.tileY = 4;
                    if (_this.ticksSinceFirstHit >= 3) {
                        _this.flashingFrame += 0.1 * delta;
                        if (Math.floor(_this.flashingFrame) % 2 === 0) {
                            _this.tileY = 0;
                        }
                    }
                }
                else if (_this.health === 2) {
                    _this.tileX = 21;
                    _this.tileY = 8;
                    if (_this.ticksSinceFirstHit >= 3) {
                        _this.flashingFrame += 0.1 * delta;
                        if (Math.floor(_this.flashingFrame) % 2 === 0) {
                            _this.tileY = 4;
                        }
                    }
                }
                else if (_this.health === 1) {
                    _this.tileX = 21;
                    _this.tileY = 12;
                    if (_this.ticksSinceFirstHit >= 3) {
                        _this.flashingFrame += 0.1 * delta;
                        if (Math.floor(_this.flashingFrame) % 2 === 0) {
                            _this.tileY = 8;
                        }
                    }
                }
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(18, 0, 2, 2, _this.x - _this.drawX, _this.y - _this.drawY, 2, 2, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + (_this.tileX === 20 ? Math.floor(_this.frame) * 2 : 0), _this.tileY, 2, 4, _this.x - _this.drawX, _this.y - 2.5 - _this.drawY, 2, 4, _this.level.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta, gameConstants_1.GameConstants.TILESIZE * 0.5, gameConstants_1.GameConstants.TILESIZE * -1);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta, gameConstants_1.GameConstants.TILESIZE * 0.5, gameConstants_1.GameConstants.TILESIZE * -1);
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            _this.healthBar.draw(delta, _this.health, _this.maxHealth, _this.x + 0.5, _this.y, true);
            _this.drawX += -0.5 * _this.drawX;
            _this.drawY += -0.5 * _this.drawY;
        };
        _this.dropLoot = function () {
            var dropOffsets = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
                { x: 1, y: 1 },
            ];
            for (var i = 0; i < _this.drops.length; i++) {
                _this.drops[i].level = _this.level;
                _this.drops[i].x = _this.x + dropOffsets[i].x;
                _this.drops[i].y = _this.y + dropOffsets[i].y;
                _this.level.items.push(_this.drops[i]);
            }
        };
        _this.w = 2;
        _this.h = 2;
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 4;
        _this.maxHealth = 4;
        _this.tileX = 21;
        _this.tileY = 0;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.ticksSinceFirstHit = 0;
        _this.flashingFrame = 0;
        _this.deathParticleColor = "#ffffff";
        _this.chainPushable = false;
        _this.drops = [];
        if (drop)
            _this.drops.push(drop);
        while (_this.drops.length < 4) {
            var dropProb = rand();
            if (dropProb < 0.005)
                _this.drops.push(new spear_1.Spear(_this.level, 0, 0));
            else if (dropProb < 0.04)
                _this.drops.push(new redgem_1.RedGem(_this.level, 0, 0));
            else if (dropProb < 0.075)
                _this.drops.push(new redgem_1.RedGem(_this.level, 0, 0));
            else if (dropProb < 0.1)
                _this.drops.push(new redgem_1.RedGem(_this.level, 0, 0));
            else
                _this.drops.push(new coin_1.Coin(_this.level, 0, 0));
        }
        return _this;
    }
    return BigSkullEnemy;
}(enemy_1.Enemy));
exports.BigSkullEnemy = BigSkullEnemy;


/***/ }),

/***/ "./src/enemy/bishopEnemy.ts":
/*!**********************************!*\
  !*** ./src/enemy/bishopEnemy.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BishopEnemy = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coin_1 = __webpack_require__(/*! ../item/coin */ "./src/item/coin.ts");
var greengem_1 = __webpack_require__(/*! ../item/greengem */ "./src/item/greengem.ts");
var random_1 = __webpack_require__(/*! ../random */ "./src/random.ts");
var astarclass_1 = __webpack_require__(/*! ../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../tile/spiketrap */ "./src/tile/spiketrap.ts");
var candle_1 = __webpack_require__(/*! ../item/candle */ "./src/item/candle.ts");
var BishopEnemy = /** @class */ (function (_super) {
    __extends(BishopEnemy, _super);
    function BishopEnemy(level, game, x, y, rand, drop) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.tryMove = function (x, y) {
            var pointWouldBeIn = function (someX, someY) {
                return (someX >= x && someX < x + _this.w && someY >= y && someY < y + _this.h);
            };
            var enemyCollide = function (enemy) {
                if (enemy.x >= x + _this.w || enemy.x + enemy.w <= x)
                    return false;
                if (enemy.y >= y + _this.h || enemy.y + enemy.h <= y)
                    return false;
                return true;
            };
            for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e !== _this && enemyCollide(e)) {
                    return;
                }
            }
            for (var i in _this.game.players) {
                if (pointWouldBeIn(_this.game.players[i].x, _this.game.players[i].y)) {
                    return;
                }
            }
            var tiles = [];
            for (var xx = 0; xx < _this.w; xx++) {
                for (var yy = 0; yy < _this.h; yy++) {
                    if (!_this.level.roomArray[x + xx][y + yy].isSolid()) {
                        tiles.push(_this.level.roomArray[x + xx][y + yy]);
                    }
                    else {
                        return;
                    }
                }
            }
            for (var _b = 0, tiles_1 = tiles; _b < tiles_1.length; _b++) {
                var tile = tiles_1[_b];
                tile.onCollideEnemy(_this);
            }
            _this.x = x;
            _this.y = y;
        };
        _this.hit = function () {
            return 1;
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.health -= damage;
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
                genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, _this.deathParticleColor);
            }
        };
        _this.tick = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.ticks++;
                if (!_this.seenPlayer) {
                    var p = _this.nearestPlayer();
                    if (p !== false) {
                        var distance = p[0], player = p[1];
                        if (distance <= 4) {
                            _this.targetPlayer = player;
                            _this.facePlayer(player);
                            _this.seenPlayer = true;
                            if (player === _this.game.players[_this.game.localPlayerID])
                                _this.alertTicks = 1;
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y - 1));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y + 1));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y - 1));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y + 1));
                        }
                    }
                }
                else if (_this.seenPlayer) {
                    if (_this.level.playerTicked === _this.targetPlayer) {
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        var oldX = _this.x;
                        var oldY = _this.y;
                        var disablePositions = Array();
                        for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                            var e = _a[_i];
                            if (e !== _this) {
                                disablePositions.push({ x: e.x, y: e.y });
                            }
                            /*disablePositions.push({ x: oldX + 1, y: oldY } as astar.Position);
                          disablePositions.push({ x: oldX - 1, y: oldY } as astar.Position);
                          disablePositions.push({ x: oldX, y: oldY + 1 } as astar.Position);
                          disablePositions.push({ x: oldX, y: oldY - 1} as astar.Position);*/
                        }
                        for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                            for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                if (_this.level.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                    _this.level.roomArray[xx][yy].on) {
                                    // don't walk on active spiketraps
                                    disablePositions.push({ x: xx, y: yy });
                                }
                            }
                        }
                        var grid = [];
                        for (var x = 0; x < _this.level.roomX + _this.level.width; x++) {
                            grid[x] = [];
                            for (var y = 0; y < _this.level.roomY + _this.level.height; y++) {
                                if (_this.level.roomArray[x] && _this.level.roomArray[x][y])
                                    grid[x][y] = _this.level.roomArray[x][y];
                                else
                                    grid[x][y] = false;
                            }
                        }
                        var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, true, //diagonals
                        true, //diagonalsOnly
                        undefined, undefined, undefined, false //diagonalsOmni
                        );
                        if (moves.length > 0) {
                            disablePositions.push({ x: oldX + 1, y: oldY });
                            disablePositions.push({ x: oldX - 1, y: oldY });
                            disablePositions.push({ x: oldX, y: oldY + 1 });
                            disablePositions.push({ x: oldX, y: oldY - 1 });
                            var moveX = moves[0].pos.x;
                            var moveY = moves[0].pos.y;
                            var hitPlayer = false;
                            for (var i in _this.game.players) {
                                if (_this.game.rooms[_this.game.players[i].levelID] === _this.level &&
                                    _this.game.players[i].x === moveX &&
                                    _this.game.players[i].y === moveY) {
                                    _this.game.players[i].hurt(_this.hit(), "bishop");
                                    _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                    _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                    if (_this.game.players[i] ===
                                        _this.game.players[_this.game.localPlayerID])
                                        _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                }
                            }
                            if (!hitPlayer) {
                                //if ()
                                _this.tryMove(moveX, moveY);
                                _this.drawX = _this.x - oldX;
                                _this.drawY = _this.y - oldY;
                                /*if (this.x > oldX) this.direction = EnemyDirection.RIGHT;
                                else if (this.x < oldX) this.direction = EnemyDirection.LEFT;
                                else if (this.y > oldY) this.direction = EnemyDirection.DOWN;
                                else if (this.y < oldY) this.direction = EnemyDirection.UP;*/
                            }
                        }
                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y - 1));
                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y + 1));
                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y - 1));
                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y + 1));
                    }
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !==
                        -1;
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 &&
                                (targetPlayerOffline ||
                                    distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y - 1));
                                    _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y + 1));
                                    _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y - 1));
                                    _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y + 1));
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + Math.floor(_this.frame), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 23;
        _this.tileY = 8;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.deathParticleColor = "#ffffff";
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.005)
                _this.drop = new candle_1.Candle(_this.level, 0, 0);
            else if (dropProb < 0.04)
                _this.drop = new greengem_1.GreenGem(_this.level, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.level, 0, 0);
        }
        return _this;
    }
    return BishopEnemy;
}(enemy_1.Enemy));
exports.BishopEnemy = BishopEnemy;


/***/ }),

/***/ "./src/enemy/chargeEnemy.ts":
/*!**********************************!*\
  !*** ./src/enemy/chargeEnemy.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChargeEnemy = exports.ChargeEnemyState = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var coin_1 = __webpack_require__(/*! ../item/coin */ "./src/item/coin.ts");
var door_1 = __webpack_require__(/*! ../tile/door */ "./src/tile/door.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var random_1 = __webpack_require__(/*! ../random */ "./src/random.ts");
var pickaxe_1 = __webpack_require__(/*! ../weapon/pickaxe */ "./src/weapon/pickaxe.ts");
var greengem_1 = __webpack_require__(/*! ../item/greengem */ "./src/item/greengem.ts");
var ChargeEnemyState;
(function (ChargeEnemyState) {
    ChargeEnemyState[ChargeEnemyState["IDLE"] = 0] = "IDLE";
    ChargeEnemyState[ChargeEnemyState["ALERTED"] = 1] = "ALERTED";
    ChargeEnemyState[ChargeEnemyState["CHARGING"] = 2] = "CHARGING";
})(ChargeEnemyState = exports.ChargeEnemyState || (exports.ChargeEnemyState = {}));
var ChargeEnemy = /** @class */ (function (_super) {
    __extends(ChargeEnemy, _super);
    function ChargeEnemy(level, game, x, y, drop) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hit = function () {
            return 1;
        };
        _this.canMoveOver = function (x, y) {
            for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e !== _this && x === e.x && y === e.y)
                    return false;
            }
            var t = _this.level.roomArray[x][y];
            return !(t.isSolid() || t instanceof door_1.Door);
        };
        _this.tick = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.ticks++;
                if (_this.state === ChargeEnemyState.IDLE) {
                    var blocked = false;
                    var dx = 0;
                    var dy = 0;
                    for (var i in _this.game.players) {
                        if (_this.x === _this.game.players[i].x) {
                            if (_this.y < _this.game.players[i].y)
                                dy = 1;
                            else
                                dy = -1;
                            for (var yy = _this.y; yy !== _this.game.players[i].y; yy += dy) {
                                if (!_this.canMoveOver(_this.x, yy))
                                    blocked = true;
                            }
                        }
                        else if (_this.y === _this.game.players[i].y) {
                            if (_this.x < _this.game.players[i].x)
                                dx = 1;
                            else
                                dx = -1;
                            for (var xx = _this.x; xx !== _this.game.players[i].x; xx += dx) {
                                if (!_this.canMoveOver(xx, _this.y))
                                    blocked = true;
                            }
                        }
                        if ((dx !== 0 || dy !== 0) && !blocked) {
                            _this.state = ChargeEnemyState.ALERTED;
                            _this.targetX = _this.x;
                            _this.targetY = _this.y;
                            while (_this.canMoveOver(_this.targetX + dx, _this.targetY + dy)) {
                                _this.targetX += dx;
                                _this.targetY += dy;
                                if ((_this.targetX === _this.game.players[i].x &&
                                    _this.targetY === _this.game.players[i].y) ||
                                    (_this.targetX === _this.game.players[i].x - 1 &&
                                        _this.targetY === _this.game.players[i].y) ||
                                    (_this.targetX === _this.game.players[i].x + 1 &&
                                        _this.targetY === _this.game.players[i].y) ||
                                    (_this.targetX === _this.game.players[i].x &&
                                        _this.targetY === _this.game.players[i].y - 1) ||
                                    (_this.targetX === _this.game.players[i].x &&
                                        _this.targetY === _this.game.players[i].y + 1))
                                    _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.targetX, _this.targetY));
                            }
                            _this.visualTargetX = _this.targetX + 0.5 * dx;
                            _this.visualTargetY = _this.targetY + 0.5 * dy;
                            if (dy === 1)
                                _this.visualTargetY += 0.65;
                            if (dx > 0)
                                _this.direction = enemy_1.EnemyDirection.RIGHT;
                            else if (dx < 0)
                                _this.direction = enemy_1.EnemyDirection.LEFT;
                            else if (dy < 0)
                                _this.direction = enemy_1.EnemyDirection.UP;
                            else if (dy > 0)
                                _this.direction = enemy_1.EnemyDirection.DOWN;
                            break;
                        }
                    }
                }
                else if (_this.state === ChargeEnemyState.ALERTED) {
                    _this.state = ChargeEnemyState.CHARGING;
                    _this.trailFrame = 0;
                    for (var i in _this.game.players) {
                        if ((_this.y === _this.game.players[i].y &&
                            ((_this.x < _this.game.players[i].x &&
                                _this.game.players[i].x <= _this.targetX) ||
                                (_this.targetX <= _this.game.players[i].x &&
                                    _this.game.players[i].x < _this.x))) ||
                            (_this.x === _this.game.players[i].x &&
                                ((_this.y < _this.game.players[i].y &&
                                    _this.game.players[i].y <= _this.targetY) ||
                                    (_this.targetY <= _this.game.players[i].y &&
                                        _this.game.players[i].y < _this.y)))) {
                            _this.game.players[i].hurt(_this.hit(), "charge knight");
                        }
                    }
                    _this.startX = _this.x;
                    _this.startY = _this.y;
                    _this.drawX = _this.targetX - _this.x;
                    _this.drawY = _this.targetY - _this.y;
                    _this.x = _this.targetX;
                    _this.y = _this.targetY;
                }
                else if (_this.state === ChargeEnemyState.CHARGING) {
                    _this.state = ChargeEnemyState.IDLE;
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if ((_this.state === ChargeEnemyState.CHARGING &&
                    Math.abs(_this.drawX) > 0.1) ||
                    Math.abs(_this.drawY) > 0.1) {
                    genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x - _this.drawX + 0.5, _this.y - _this.drawY + 0.5, "black");
                    genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x - _this.drawX + 0.5, _this.y - _this.drawY + 0.5, "white");
                }
                if (_this.state === ChargeEnemyState.CHARGING) {
                    _this.trailFrame += 0.01 * delta;
                    var t = _this.trailFrame;
                    if (t >= 0 && t <= 1) {
                        game_1.Game.ctx.strokeStyle = "white";
                        if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                            game_1.Game.ctx.globalAlpha = 1 - t;
                        game_1.Game.ctx.lineWidth = gameConstants_1.GameConstants.TILESIZE * 0.25;
                        game_1.Game.ctx.beginPath();
                        game_1.Game.ctx.moveTo((_this.startX + 0.5) * gameConstants_1.GameConstants.TILESIZE, (_this.startY + 0.5) * gameConstants_1.GameConstants.TILESIZE);
                        game_1.Game.ctx.lineCap = "round";
                        game_1.Game.ctx.lineTo((_this.x - _this.drawX + 0.5) * gameConstants_1.GameConstants.TILESIZE, (_this.y - _this.drawY + 0.5) * gameConstants_1.GameConstants.TILESIZE);
                        game_1.Game.ctx.stroke();
                        game_1.Game.ctx.globalAlpha = 1;
                    }
                }
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + Math.floor(_this.frame), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
                if (_this.state === ChargeEnemyState.IDLE) {
                    _this.drawSleepingZs(delta);
                }
                else if (_this.state === ChargeEnemyState.ALERTED) {
                    _this.drawExclamation(delta);
                }
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            _this.healthBar.draw(delta, _this.health, _this.maxHealth, _this.x, _this.y, true);
            _this.drawX += -0.5 * _this.drawX;
            _this.drawY += -0.5 * _this.drawY;
            if (_this.state === ChargeEnemyState.ALERTED) {
                _this.trailFrame += 0.4 * delta;
                if (Math.floor(_this.trailFrame) % 2 === 0) {
                    var startX = (_this.x + 0.5) * gameConstants_1.GameConstants.TILESIZE;
                    var startY = (_this.y - 0.25) * gameConstants_1.GameConstants.TILESIZE;
                    if (_this.direction === enemy_1.EnemyDirection.LEFT)
                        startX -= 3;
                    else if (_this.direction === enemy_1.EnemyDirection.RIGHT)
                        startX += 3;
                    else if (_this.direction === enemy_1.EnemyDirection.DOWN)
                        startY += 2;
                    else if (_this.direction === enemy_1.EnemyDirection.UP)
                        startY -= 8;
                    game_1.Game.ctx.strokeStyle = "white";
                    game_1.Game.ctx.lineWidth = gameConstants_1.GameConstants.TILESIZE * 0.25;
                    game_1.Game.ctx.beginPath();
                    game_1.Game.ctx.moveTo(Math.round(startX), Math.round(startY));
                    game_1.Game.ctx.lineCap = "round";
                    game_1.Game.ctx.lineTo(Math.round((_this.visualTargetX + 0.5) * gameConstants_1.GameConstants.TILESIZE), Math.round((_this.visualTargetY - 0.25) * gameConstants_1.GameConstants.TILESIZE));
                    game_1.Game.ctx.stroke();
                    game_1.Game.ctx.globalAlpha = 1;
                }
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 13;
        _this.tileY = 8;
        _this.trailFrame = 0;
        _this.alertTicks = 0;
        _this.deathParticleColor = "#ffffff";
        _this.lastX = _this.x;
        _this.lastY = _this.y;
        _this.state = ChargeEnemyState.IDLE;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.025)
                _this.drop = new pickaxe_1.Pickaxe(_this.level, 0, 0);
            else if (dropProb < 0.02)
                _this.drop = new greengem_1.GreenGem(_this.level, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.level, 0, 0);
        }
        return _this;
    }
    return ChargeEnemy;
}(enemy_1.Enemy));
exports.ChargeEnemy = ChargeEnemy;


/***/ }),

/***/ "./src/enemy/chest.ts":
/*!****************************!*\
  !*** ./src/enemy/chest.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Chest = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var key_1 = __webpack_require__(/*! ../item/key */ "./src/item/key.ts");
var heart_1 = __webpack_require__(/*! ../item/heart */ "./src/item/heart.ts");
var armor_1 = __webpack_require__(/*! ../item/armor */ "./src/item/armor.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var greengem_1 = __webpack_require__(/*! ../item/greengem */ "./src/item/greengem.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var redgem_1 = __webpack_require__(/*! ../item/redgem */ "./src/item/redgem.ts");
var bluegem_1 = __webpack_require__(/*! ../item/bluegem */ "./src/item/bluegem.ts");
var enemy_2 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var Chest = /** @class */ (function (_super) {
    __extends(Chest, _super);
    function Chest(level, game, x, y, rand) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.kill = function () {
            if (_this.level === _this.game.level)
                sound_1.Sound.chest();
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#fbf236");
            _this.level.items.push(_this.drop);
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.tileX = 4;
        _this.tileY = 0;
        _this.health = 1;
        _this.entityType = enemy_2.EntityType.Chest;
        var drop = game_1.Game.randTable([1, 1, 1, 1, 1, 1, 1, 2, 3, 4], rand);
        switch (drop) {
            case 1:
                _this.drop = new heart_1.Heart(_this.level, _this.x, _this.y);
                break;
            case 2:
                _this.drop = new greengem_1.GreenGem(_this.level, _this.x, _this.y);
                break;
            case 3:
                _this.drop = new redgem_1.RedGem(_this.level, _this.x, _this.y);
                break;
            case 4:
                _this.drop = new bluegem_1.BlueGem(_this.level, _this.x, _this.y);
                break;
            case 5:
                _this.drop = new key_1.Key(_this.level, _this.x, _this.y);
                break;
            case 6:
                _this.drop = new armor_1.Armor(_this.level, _this.x, _this.y);
                break;
        }
        return _this;
    }
    return Chest;
}(enemy_1.Enemy));
exports.Chest = Chest;


/***/ }),

/***/ "./src/enemy/coalResource.ts":
/*!***********************************!*\
  !*** ./src/enemy/coalResource.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CoalResource = void 0;
var resource_1 = __webpack_require__(/*! ./resource */ "./src/enemy/resource.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coal_1 = __webpack_require__(/*! ../item/coal */ "./src/item/coal.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var CoalResource = /** @class */ (function (_super) {
    __extends(CoalResource, _super);
    function CoalResource(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hurtCallback = function () {
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#ffffff");
            if (_this.level === _this.game.level)
                sound_1.Sound.mine();
        };
        _this.kill = function () {
            if (_this.level === _this.game.level)
                sound_1.Sound.breakRock();
            _this.dead = true;
            _this.level.items.push(new coal_1.Coal(_this.level, _this.x, _this.y));
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.tileX = 12;
        _this.tileY = 0;
        _this.health = 1;
        return _this;
    }
    return CoalResource;
}(resource_1.Resource));
exports.CoalResource = CoalResource;


/***/ }),

/***/ "./src/enemy/crate.ts":
/*!****************************!*\
  !*** ./src/enemy/crate.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Crate = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var enemy_2 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var Crate = /** @class */ (function (_super) {
    __extends(Crate, _super);
    function Crate(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.kill = function () {
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#d9a066");
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            _this.drawX += -0.5 * _this.drawX;
            _this.drawY += -0.5 * _this.drawY;
        };
        _this.level = level;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 0;
        _this.tileY = 0;
        _this.hasShadow = false;
        _this.pushable = true;
        _this.entityType = enemy_2.EntityType.Prop;
        return _this;
    }
    return Crate;
}(enemy_1.Enemy));
exports.Crate = Crate;


/***/ }),

/***/ "./src/enemy/emeraldResource.ts":
/*!**************************************!*\
  !*** ./src/enemy/emeraldResource.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmeraldResource = void 0;
var greengem_1 = __webpack_require__(/*! ../item/greengem */ "./src/item/greengem.ts");
var resource_1 = __webpack_require__(/*! ./resource */ "./src/enemy/resource.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var EmeraldResource = /** @class */ (function (_super) {
    __extends(EmeraldResource, _super);
    function EmeraldResource(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hurtCallback = function () {
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#fbf236");
            if (_this.level === _this.game.level)
                sound_1.Sound.mine();
        };
        _this.kill = function () {
            if (_this.level === _this.game.level)
                sound_1.Sound.breakRock();
            _this.dead = true;
            _this.level.items.push(new greengem_1.GreenGem(_this.level, _this.x, _this.y));
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.tileX = 14;
        _this.tileY = 0;
        _this.health = 3;
        return _this;
    }
    return EmeraldResource;
}(resource_1.Resource));
exports.EmeraldResource = EmeraldResource;


/***/ }),

/***/ "./src/enemy/enemy.ts":
/*!****************************!*\
  !*** ./src/enemy/enemy.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Enemy = exports.EntityType = exports.EnemyDirection = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var bones_1 = __webpack_require__(/*! ../tile/bones */ "./src/tile/bones.ts");
var deathParticle_1 = __webpack_require__(/*! ../particle/deathParticle */ "./src/particle/deathParticle.ts");
var floor_1 = __webpack_require__(/*! ../tile/floor */ "./src/tile/floor.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var healthbar_1 = __webpack_require__(/*! ../healthbar */ "./src/healthbar.ts");
var drawable_1 = __webpack_require__(/*! ../drawable */ "./src/drawable.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var EnemyDirection;
(function (EnemyDirection) {
    EnemyDirection[EnemyDirection["DOWN"] = 0] = "DOWN";
    EnemyDirection[EnemyDirection["UP"] = 1] = "UP";
    EnemyDirection[EnemyDirection["RIGHT"] = 2] = "RIGHT";
    EnemyDirection[EnemyDirection["LEFT"] = 3] = "LEFT";
})(EnemyDirection = exports.EnemyDirection || (exports.EnemyDirection = {}));
var EntityType;
(function (EntityType) {
    EntityType[EntityType["Enemy"] = 0] = "Enemy";
    EntityType[EntityType["Friendly"] = 1] = "Friendly";
    EntityType[EntityType["Resource"] = 2] = "Resource";
    EntityType[EntityType["Prop"] = 3] = "Prop";
    EntityType[EntityType["Chest"] = 4] = "Chest";
})(EntityType = exports.EntityType || (exports.EntityType = {}));
var Enemy = /** @class */ (function (_super) {
    __extends(Enemy, _super);
    function Enemy(level, game, x, y) {
        var _this = _super.call(this) || this;
        _this.sleepingZFrame = 0;
        _this.tryMove = function (x, y) {
            var pointWouldBeIn = function (someX, someY) {
                return (someX >= x && someX < x + _this.w && someY >= y && someY < y + _this.h);
            };
            var enemyCollide = function (enemy) {
                if (enemy.x >= x + _this.w || enemy.x + enemy.w <= x)
                    return false;
                if (enemy.y >= y + _this.h || enemy.y + enemy.h <= y)
                    return false;
                return true;
            };
            for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e !== _this && enemyCollide(e)) {
                    return;
                }
            }
            for (var i in _this.game.players) {
                if (pointWouldBeIn(_this.game.players[i].x, _this.game.players[i].y)) {
                    return;
                }
            }
            var tiles = [];
            for (var xx = 0; xx < _this.w; xx++) {
                for (var yy = 0; yy < _this.h; yy++) {
                    if (!_this.level.roomArray[x + xx][y + yy].isSolid()) {
                        tiles.push(_this.level.roomArray[x + xx][y + yy]);
                    }
                    else {
                        return;
                    }
                }
            }
            for (var _b = 0, tiles_1 = tiles; _b < tiles_1.length; _b++) {
                var tile = tiles_1[_b];
                tile.onCollideEnemy(_this);
            }
            _this.x = x;
            _this.y = y;
        };
        _this.hit = function () {
            return 0;
        };
        _this.hurtCallback = function () { };
        _this.playerKilledBy = function (enemy) {
            return enemy;
        };
        _this.pointIn = function (x, y) {
            return (x >= _this.x && x < _this.x + _this.w && y >= _this.y && y < _this.y + _this.h);
        };
        _this.hurt = function (playerHitBy, damage) {
            _this.healthBar.hurt();
            _this.health -= damage;
            if (_this.health <= 0)
                _this.kill();
            else
                _this.hurtCallback();
        };
        _this.interact = function (player) { };
        _this.dropLoot = function () {
            if (_this.drop) {
                _this.drop.level = _this.level;
                if (!_this.level.roomArray[_this.x][_this.y].isSolid()) {
                    _this.drop.x = _this.x;
                    _this.drop.y = _this.y;
                }
                else if (_this.level.roomArray[_this.x][_this.y].isSolid()) {
                    _this.drop.x = _this.lastX;
                    _this.drop.y = _this.lastY;
                }
                _this.level.items.push(_this.drop);
                _this.drop.onDrop();
            }
        };
        _this.kill = function () {
            if (_this.level.roomArray[_this.x][_this.y] instanceof floor_1.Floor) {
                var b = new bones_1.Bones(_this.level, _this.x, _this.y);
                b.skin = _this.level.roomArray[_this.x][_this.y].skin;
                _this.level.roomArray[_this.x][_this.y] = b;
            }
            _this.killNoBones();
        };
        _this.killNoBones = function () {
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, _this.deathParticleColor);
            _this.level.particles.push(new deathParticle_1.DeathParticle(_this.x, _this.y));
            _this.dropLoot();
        };
        _this.shadeAmount = function () {
            return _this.level.softVis[_this.x][_this.y];
        };
        _this.doneMoving = function () {
            var EPSILON = 0.01;
            return Math.abs(_this.drawX) < EPSILON && Math.abs(_this.drawY) < EPSILON;
        };
        _this.nearestPlayer = function () {
            var maxDistance = 138291380921; // pulled this straight outta my ass
            var closestDistance = maxDistance;
            var closestPlayer = null;
            for (var i in _this.game.players) {
                if (_this.game.rooms[_this.game.players[i].levelID] === _this.level) {
                    var distance = _this.playerDistance(_this.game.players[i]);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPlayer = _this.game.players[i];
                    }
                }
            }
            if (closestDistance === maxDistance)
                return false;
            else
                return [closestDistance, closestPlayer];
        };
        _this.playerDistance = function (player) {
            return Math.max(Math.abs(_this.x - player.x), Math.abs(_this.y - player.y));
        };
        _this.facePlayer = function (player) {
            var dx = player.x - _this.x;
            var dy = player.y - _this.y;
            if (Math.abs(dx) === Math.abs(dy)) {
                // just moved, already facing player
            }
            else if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0)
                    _this.direction = EnemyDirection.RIGHT;
                if (dx < 0)
                    _this.direction = EnemyDirection.LEFT;
            }
            else {
                if (dy > 0)
                    _this.direction = EnemyDirection.DOWN;
                if (dy < 0)
                    _this.direction = EnemyDirection.UP;
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX, _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.tick = function () { };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y - _this.drawY;
            _this.healthBar.draw(delta, _this.health, _this.maxHealth, _this.x, _this.y, true);
            _this.drawX += -0.5 * _this.drawX;
            _this.drawY += -0.5 * _this.drawY;
        };
        _this.drawSleepingZs = function (delta, offsetX, offsetY) {
            if (offsetX === void 0) { offsetX = 0; }
            if (offsetY === void 0) { offsetY = 0; }
            _this.sleepingZFrame += delta;
            var numZs = 2;
            var t = _this.sleepingZFrame * 0.01; // 0 <= t < 1
            t -= Math.floor(t);
            //let whichway = Math.floor(this.sleepingZFrame * 0.02 / numZs) % 2;
            for (var off = numZs - 1; off >= 0; off--) {
                var yoff = (t + off) * 7;
                var alpha = Math.min(1 - (t + off) / numZs, (2 * (t + off)) / numZs);
                var xoff = 0;
                if (off === 0)
                    xoff = 1;
                if (t >= 0.33 && t < 0.66)
                    xoff = off;
                if (t >= 0.33 && t < 0.66)
                    xoff = off;
                var width = game_1.Game.measureText("Z").width;
                if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                    game_1.Game.ctx.globalAlpha = alpha;
                game_1.Game.fillTextOutline("Z", (_this.x + 0.5) * gameConstants_1.GameConstants.TILESIZE - width / 2 + xoff + offsetX, (_this.y - 0.6) * gameConstants_1.GameConstants.TILESIZE - yoff + offsetY, gameConstants_1.GameConstants.OUTLINE, "white");
                game_1.Game.ctx.globalAlpha = 1;
            }
        };
        _this.drawExclamation = function (delta, offsetX, offsetY) {
            if (offsetX === void 0) { offsetX = 0; }
            if (offsetY === void 0) { offsetY = 0; }
            _this.exclamationFrame += delta;
            var yoff = 0;
            var yoffs = [0, -1, -2, -3, -5, -7, -4];
            if (_this.exclamationFrame > yoffs.length)
                yoff = yoffs[yoffs.length - 1];
            else
                yoff = yoffs[_this.exclamationFrame];
            var width = game_1.Game.measureText("!").width;
            game_1.Game.ctx.globalAlpha = 1;
            if (yoff !== false) {
                game_1.Game.fillTextOutline("!", (_this.x + 0.5) * gameConstants_1.GameConstants.TILESIZE - width / 2 + offsetX, (_this.y - 0.75) * gameConstants_1.GameConstants.TILESIZE + yoff + offsetY, gameConstants_1.GameConstants.OUTLINE, gameConstants_1.GameConstants.WARNING_RED);
            }
        };
        _this.level = level;
        _this.x = x;
        _this.y = y;
        _this.w = 1;
        _this.h = 1;
        _this.game = game;
        _this.drawX = 0;
        _this.drawY = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 0;
        _this.tileY = 0;
        _this.hasShadow = true;
        _this.skipNextTurns = 0;
        _this.direction = EnemyDirection.DOWN;
        _this.destroyable = true;
        _this.pushable = false;
        _this.chainPushable = true;
        _this.interactable = false;
        _this.deathParticleColor = "#ff00ff";
        _this.healthBar = new healthbar_1.HealthBar();
        _this.alertTicks = 0;
        _this.exclamationFrame = 0;
        _this.lastX = x;
        _this.lastY = y;
        _this.entityType = EntityType.Enemy;
        return _this;
    }
    return Enemy;
}(drawable_1.Drawable));
exports.Enemy = Enemy;


/***/ }),

/***/ "./src/enemy/goldResource.ts":
/*!***********************************!*\
  !*** ./src/enemy/goldResource.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GoldResource = void 0;
var resource_1 = __webpack_require__(/*! ./resource */ "./src/enemy/resource.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var gold_1 = __webpack_require__(/*! ../item/gold */ "./src/item/gold.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var GoldResource = /** @class */ (function (_super) {
    __extends(GoldResource, _super);
    function GoldResource(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hurtCallback = function () {
            if (_this.level === _this.game.level)
                sound_1.Sound.mine();
        };
        _this.kill = function () {
            if (_this.level === _this.game.level)
                sound_1.Sound.breakRock();
            _this.dead = true;
            _this.level.items.push(new gold_1.Gold(_this.level, _this.x, _this.y));
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#fbf236");
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.tileX = 13;
        _this.tileY = 0;
        _this.health = 2;
        return _this;
    }
    return GoldResource;
}(resource_1.Resource));
exports.GoldResource = GoldResource;


/***/ }),

/***/ "./src/enemy/knightEnemy.ts":
/*!**********************************!*\
  !*** ./src/enemy/knightEnemy.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.KnightEnemy = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var astarclass_1 = __webpack_require__(/*! ../astarclass */ "./src/astarclass.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var spiketrap_1 = __webpack_require__(/*! ../tile/spiketrap */ "./src/tile/spiketrap.ts");
var coin_1 = __webpack_require__(/*! ../item/coin */ "./src/item/coin.ts");
var dualdagger_1 = __webpack_require__(/*! ../weapon/dualdagger */ "./src/weapon/dualdagger.ts");
var KnightEnemy = /** @class */ (function (_super) {
    __extends(KnightEnemy, _super);
    function KnightEnemy(level, game, x, y, rand, drop) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.healthBar.hurt();
            _this.health -= damage;
            if (_this.health <= 0)
                _this.kill();
            else
                _this.hurtCallback();
        };
        _this.hit = function () {
            return 1;
        };
        _this.tick = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (!_this.seenPlayer) {
                    var result = _this.nearestPlayer();
                    if (result !== false) {
                        var distance = result[0], p = result[1];
                        if (distance < 4) {
                            _this.seenPlayer = true;
                            _this.targetPlayer = p;
                            _this.facePlayer(p);
                            if (p === _this.game.players[_this.game.localPlayerID])
                                _this.alertTicks = 1;
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                        }
                    }
                }
                else if (_this.seenPlayer) {
                    if (_this.level.playerTicked === _this.targetPlayer) {
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        _this.ticks++;
                        if (_this.ticks % 2 === 1) {
                            var oldX = _this.x;
                            var oldY = _this.y;
                            var disablePositions = Array();
                            for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                                var e = _a[_i];
                                if (e !== _this) {
                                    disablePositions.push({ x: e.x, y: e.y });
                                }
                            }
                            for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                                for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                    if (_this.level.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                        _this.level.roomArray[xx][yy].on) {
                                        // don't walk on active spiketraps
                                        disablePositions.push({ x: xx, y: yy });
                                    }
                                }
                            }
                            var grid = [];
                            for (var x = 0; x < _this.level.roomX + _this.level.width; x++) {
                                grid[x] = [];
                                for (var y = 0; y < _this.level.roomY + _this.level.height; y++) {
                                    if (_this.level.roomArray[x] && _this.level.roomArray[x][y])
                                        grid[x][y] = _this.level.roomArray[x][y];
                                    else
                                        grid[x][y] = false;
                                }
                            }
                            var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions);
                            if (moves.length > 0) {
                                var hitPlayer = false;
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.level &&
                                        _this.game.players[i].x === moves[0].pos.x &&
                                        _this.game.players[i].y === moves[0].pos.y) {
                                        _this.game.players[i].hurt(_this.hit(), "burrow knight");
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] === _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                        hitPlayer = true;
                                    }
                                }
                                if (!hitPlayer) {
                                    _this.tryMove(moves[0].pos.x, moves[0].pos.y);
                                    _this.drawX = _this.x - oldX;
                                    _this.drawY = _this.y - oldY;
                                    if (_this.x > oldX)
                                        _this.direction = enemy_1.EnemyDirection.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = enemy_1.EnemyDirection.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = enemy_1.EnemyDirection.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = enemy_1.EnemyDirection.UP;
                                }
                            }
                        }
                        else {
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                        }
                    }
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !== -1;
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 && (targetPlayerOffline || distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    if (_this.ticks % 2 === 0) {
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                if (_this.ticks % 2 === 0) {
                    _this.tileX = 9;
                    _this.tileY = 8;
                }
                else {
                    _this.tileX = 4;
                    _this.tileY = 0;
                }
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + (_this.tileX === 4 ? 0 : Math.floor(_this.frame)), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY + (_this.tileX === 4 ? 0.1875 : 0), 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 2;
        _this.maxHealth = 2;
        _this.tileX = 9;
        _this.tileY = 8;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.deathParticleColor = "#ffffff";
        _this.lastX = _this.x;
        _this.lastY = _this.y;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = rand();
            if (dropProb < 0.025)
                _this.drop = new dualdagger_1.DualDagger(_this.level, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.level, 0, 0);
        }
        return _this;
    }
    return KnightEnemy;
}(enemy_1.Enemy));
exports.KnightEnemy = KnightEnemy;


/***/ }),

/***/ "./src/enemy/mushrooms.ts":
/*!********************************!*\
  !*** ./src/enemy/mushrooms.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Mushrooms = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var shrooms_1 = __webpack_require__(/*! ../item/shrooms */ "./src/item/shrooms.ts");
var enemy_2 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var Mushrooms = /** @class */ (function (_super) {
    __extends(Mushrooms, _super);
    function Mushrooms(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.kill = function () {
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#ac3232");
            _this.level.items.push(new shrooms_1.Shrooms(_this.level, _this.x, _this.y));
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                _this.drawX += -0.5 * _this.drawX;
                _this.drawY += -0.5 * _this.drawY;
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.level = level;
        _this.health = 1;
        _this.tileX = 9;
        _this.tileY = 2;
        _this.hasShadow = false;
        _this.chainPushable = false;
        _this.entityType = enemy_2.EntityType.Prop;
        return _this;
    }
    return Mushrooms;
}(enemy_1.Enemy));
exports.Mushrooms = Mushrooms;


/***/ }),

/***/ "./src/enemy/pot.ts":
/*!**************************!*\
  !*** ./src/enemy/pot.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Pot = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var enemy_2 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var Pot = /** @class */ (function (_super) {
    __extends(Pot, _super);
    function Pot(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.kill = function () {
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#ce736a");
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                _this.drawX += -0.5 * _this.drawX;
                _this.drawY += -0.5 * _this.drawY;
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.level = level;
        _this.health = 1;
        _this.tileX = 11;
        _this.tileY = 0;
        _this.hasShadow = false;
        _this.chainPushable = false;
        _this.entityType = enemy_2.EntityType.Prop;
        return _this;
    }
    return Pot;
}(enemy_1.Enemy));
exports.Pot = Pot;


/***/ }),

/***/ "./src/enemy/pottedPlant.ts":
/*!**********************************!*\
  !*** ./src/enemy/pottedPlant.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PottedPlant = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var heart_1 = __webpack_require__(/*! ../item/heart */ "./src/item/heart.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coin_1 = __webpack_require__(/*! ../item/coin */ "./src/item/coin.ts");
var enemy_2 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var PottedPlant = /** @class */ (function (_super) {
    __extends(PottedPlant, _super);
    function PottedPlant(level, game, x, y, rand, drop) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hurtCallback = function () {
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#5d9250");
        };
        _this.kill = function () {
            _this.dead = true;
            _this.killNoBones();
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#ce736a");
        };
        _this.killNoBones = function () {
            _this.dead = true;
            _this.dropLoot();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                _this.drawX += -0.5 * _this.drawX;
                _this.drawY += -0.5 * _this.drawY;
                if (_this.health <= 1)
                    _this.tileX = 2;
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.dropLoot = function () {
            _this.drop.level = _this.level;
            _this.drop.x = _this.x;
            _this.drop.y = _this.y;
            _this.level.items.push(_this.drop);
        };
        _this.level = level;
        _this.health = 2;
        _this.tileX = 3;
        _this.tileY = 0;
        _this.hasShadow = false;
        _this.chainPushable = false;
        _this.entityType = enemy_2.EntityType.Prop;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = rand();
            if (dropProb < 0.025)
                _this.drop = new heart_1.Heart(_this.level, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.level, 0, 0);
        }
        return _this;
    }
    return PottedPlant;
}(enemy_1.Enemy));
exports.PottedPlant = PottedPlant;


/***/ }),

/***/ "./src/enemy/resource.ts":
/*!*******************************!*\
  !*** ./src/enemy/resource.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Resource = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var enemy_2 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var Resource = /** @class */ (function (_super) {
    __extends(Resource, _super);
    function Resource(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy.inventory.getWeapon().canMine === true) {
                _this.healthBar.hurt();
                _this.health -= damage;
                if (_this.health <= 0)
                    _this.kill();
                else {
                    _this.game.pushMessage("Your weapon fails to damage the rock.");
                    _this.hurtCallback();
                }
            }
            else
                return;
        };
        _this.kill = function () {
            _this.dead = true;
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.tileX = 12;
        _this.tileY = 0;
        _this.health = 1;
        _this.chainPushable = false;
        _this.entityType = enemy_2.EntityType.Resource;
        return _this;
    }
    return Resource;
}(enemy_1.Enemy));
exports.Resource = Resource;


/***/ }),

/***/ "./src/enemy/rockResource.ts":
/*!***********************************!*\
  !*** ./src/enemy/rockResource.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Rock = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var stone_1 = __webpack_require__(/*! ../item/stone */ "./src/item/stone.ts");
var resource_1 = __webpack_require__(/*! ./resource */ "./src/enemy/resource.ts");
var Rock = /** @class */ (function (_super) {
    __extends(Rock, _super);
    function Rock(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hurtCallback = function () {
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#ffffff");
            if (_this.level === _this.game.level)
                sound_1.Sound.mine();
        };
        _this.kill = function () {
            if (_this.level === _this.game.level)
                sound_1.Sound.breakRock();
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#9badb7");
            _this.level.items.push(new stone_1.Stone(_this.level, _this.x, _this.y));
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                _this.drawX += -0.5 * _this.drawX;
                _this.drawY += -0.5 * _this.drawY;
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.level = level;
        _this.health = 2;
        _this.tileX = 8;
        _this.tileY = 2;
        _this.hasShadow = false;
        _this.chainPushable = false;
        return _this;
    }
    return Rock;
}(resource_1.Resource));
exports.Rock = Rock;


/***/ }),

/***/ "./src/enemy/skullEnemy.ts":
/*!*********************************!*\
  !*** ./src/enemy/skullEnemy.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SkullEnemy = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coin_1 = __webpack_require__(/*! ../item/coin */ "./src/item/coin.ts");
var redgem_1 = __webpack_require__(/*! ../item/redgem */ "./src/item/redgem.ts");
var spear_1 = __webpack_require__(/*! ../weapon/spear */ "./src/weapon/spear.ts");
var astarclass_1 = __webpack_require__(/*! ../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../tile/spiketrap */ "./src/tile/spiketrap.ts");
var candle_1 = __webpack_require__(/*! ../item/candle */ "./src/item/candle.ts");
var SkullEnemy = /** @class */ (function (_super) {
    __extends(SkullEnemy, _super);
    function SkullEnemy(level, game, x, y, rand, drop) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.REGEN_TICKS = 5;
        _this.hit = function () {
            return 1;
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.ticksSinceFirstHit = 0;
            _this.health -= damage;
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
                genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, _this.deathParticleColor);
            }
        };
        _this.tick = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            //set last positions
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (_this.health <= 1) {
                    _this.ticksSinceFirstHit++;
                    if (_this.ticksSinceFirstHit >= _this.REGEN_TICKS) {
                        _this.health = 2;
                    }
                }
                else {
                    _this.ticks++;
                    if (!_this.seenPlayer) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4) {
                                _this.targetPlayer = player;
                                _this.facePlayer(player);
                                _this.seenPlayer = true;
                                if (player === _this.game.players[_this.game.localPlayerID])
                                    _this.alertTicks = 1;
                                _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                                _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                                _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                                _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                            }
                        }
                    }
                    else if (_this.seenPlayer) {
                        if (_this.level.playerTicked === _this.targetPlayer) {
                            _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                            var oldX = _this.x;
                            var oldY = _this.y;
                            var disablePositions = Array();
                            for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                                var e = _a[_i];
                                if (e !== _this) {
                                    disablePositions.push({ x: e.x, y: e.y });
                                }
                            }
                            for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                                for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                    if (_this.level.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                        _this.level.roomArray[xx][yy].on) {
                                        // don't walk on active spiketraps
                                        disablePositions.push({ x: xx, y: yy });
                                    }
                                }
                            }
                            var grid = [];
                            for (var x = 0; x < _this.level.roomX + _this.level.width; x++) {
                                grid[x] = [];
                                for (var y = 0; y < _this.level.roomY + _this.level.height; y++) {
                                    if (_this.level.roomArray[x] && _this.level.roomArray[x][y])
                                        grid[x][y] = _this.level.roomArray[x][y];
                                    else
                                        grid[x][y] = false;
                                }
                            }
                            var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions);
                            if (moves.length > 0) {
                                var moveX = moves[0].pos.x;
                                var moveY = moves[0].pos.y;
                                var hitPlayer = false;
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.level && _this.game.players[i].x === moveX && _this.game.players[i].y === moveY) {
                                        _this.game.players[i].hurt(_this.hit(), "skeleton");
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] === _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                    }
                                }
                                if (!hitPlayer) {
                                    _this.tryMove(moveX, moveY);
                                    _this.drawX = _this.x - oldX;
                                    _this.drawY = _this.y - oldY;
                                    if (_this.x > oldX)
                                        _this.direction = enemy_1.EnemyDirection.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = enemy_1.EnemyDirection.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = enemy_1.EnemyDirection.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = enemy_1.EnemyDirection.UP;
                                }
                            }
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                        }
                        var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !== -1;
                        if (!_this.aggro || targetPlayerOffline) {
                            var p = _this.nearestPlayer();
                            if (p !== false) {
                                var distance = p[0], player = p[1];
                                if (distance <= 4 && (targetPlayerOffline || distance < _this.playerDistance(_this.targetPlayer))) {
                                    if (player !== _this.targetPlayer) {
                                        _this.targetPlayer = player;
                                        _this.facePlayer(player);
                                        if (player === _this.game.players[_this.game.localPlayerID])
                                            _this.alertTicks = 1;
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.tileX = 5;
                _this.tileY = 8;
                if (_this.health <= 1) {
                    _this.tileX = 3;
                    _this.tileY = 0;
                    if (_this.ticksSinceFirstHit >= 3) {
                        _this.flashingFrame += 0.1 * delta;
                        if (Math.floor(_this.flashingFrame) % 2 === 0) {
                            _this.tileX = 2;
                        }
                    }
                }
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + (_this.tileX === 5 ? Math.floor(_this.frame) : 0), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 2;
        _this.maxHealth = 2;
        _this.tileX = 5;
        _this.tileY = 8;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.ticksSinceFirstHit = 0;
        _this.flashingFrame = 0;
        _this.deathParticleColor = "#ffffff";
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = rand();
            if (dropProb < 0.005)
                _this.drop = new spear_1.Spear(_this.level, 0, 0);
            else if (dropProb < 0.04)
                _this.drop = new redgem_1.RedGem(_this.level, 0, 0);
            else if (dropProb < 0.2)
                _this.drop = new candle_1.Candle(_this.level, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.level, 0, 0);
        }
        return _this;
    }
    return SkullEnemy;
}(enemy_1.Enemy));
exports.SkullEnemy = SkullEnemy;


/***/ }),

/***/ "./src/enemy/slimeEnemy.ts":
/*!*********************************!*\
  !*** ./src/enemy/slimeEnemy.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SlimeEnemy = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var astarclass_1 = __webpack_require__(/*! ../astarclass */ "./src/astarclass.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var spiketrap_1 = __webpack_require__(/*! ../tile/spiketrap */ "./src/tile/spiketrap.ts");
var coin_1 = __webpack_require__(/*! ../item/coin */ "./src/item/coin.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var SlimeEnemy = /** @class */ (function (_super) {
    __extends(SlimeEnemy, _super);
    function SlimeEnemy(level, game, x, y, rand, drop) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.healthBar.hurt();
            _this.health -= damage;
            if (_this.health <= 0)
                _this.kill();
            else
                _this.hurtCallback();
        };
        _this.hit = function () {
            return 1;
        };
        _this.tick = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (!_this.seenPlayer) {
                    var result = _this.nearestPlayer();
                    if (result !== false) {
                        var distance = result[0], p = result[1];
                        if (distance < 4) {
                            _this.seenPlayer = true;
                            _this.targetPlayer = p;
                            _this.facePlayer(p);
                            if (p === _this.game.players[_this.game.localPlayerID])
                                _this.alertTicks = 1;
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                        }
                    }
                }
                else if (_this.seenPlayer) {
                    if (_this.level.playerTicked === _this.targetPlayer) {
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        _this.ticks++;
                        if (_this.ticks % 2 === 1) {
                            var oldX = _this.x;
                            var oldY = _this.y;
                            var disablePositions = Array();
                            for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                                var e = _a[_i];
                                if (e !== _this) {
                                    disablePositions.push({ x: e.x, y: e.y });
                                }
                            }
                            for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                                for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                    if (_this.level.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                        _this.level.roomArray[xx][yy].on) {
                                        // don't walk on active spiketraps
                                        disablePositions.push({ x: xx, y: yy });
                                    }
                                }
                            }
                            var grid = [];
                            for (var x = 0; x < _this.level.roomX + _this.level.width; x++) {
                                grid[x] = [];
                                for (var y = 0; y < _this.level.roomY + _this.level.height; y++) {
                                    if (_this.level.roomArray[x] && _this.level.roomArray[x][y])
                                        grid[x][y] = _this.level.roomArray[x][y];
                                    else
                                        grid[x][y] = false;
                                }
                            }
                            var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions);
                            if (moves.length > 0) {
                                var hitPlayer = false;
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.level &&
                                        _this.game.players[i].x === moves[0].pos.x &&
                                        _this.game.players[i].y === moves[0].pos.y) {
                                        _this.game.players[i].hurt(_this.hit(), "crab");
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] === _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                        hitPlayer = true;
                                    }
                                }
                                if (!hitPlayer) {
                                    _this.tryMove(moves[0].pos.x, moves[0].pos.y);
                                    _this.drawX = _this.x - oldX;
                                    _this.drawY = _this.y - oldY;
                                    if (_this.x > oldX)
                                        _this.direction = enemy_1.EnemyDirection.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = enemy_1.EnemyDirection.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = enemy_1.EnemyDirection.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = enemy_1.EnemyDirection.UP;
                                }
                            }
                        }
                        else {
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                        }
                    }
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !== -1;
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 && (targetPlayerOffline || distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    if (_this.ticks % 2 === 0) {
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                if (_this.ticks % 2 === 0) {
                    _this.tileX = 9;
                    _this.tileY = 4;
                }
                else {
                    _this.tileX = 8;
                    _this.tileY = 4;
                }
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX, _this.tileY + _this.direction, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta, 0, 0.75 * gameConstants_1.GameConstants.TILESIZE);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta, 0, 0.75 * gameConstants_1.GameConstants.TILESIZE);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 8;
        _this.tileY = 4;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.deathParticleColor = "#ffffff";
        if (drop)
            _this.drop = drop;
        else {
            _this.drop = new coin_1.Coin(_this.level, 0, 0);
        }
        return _this;
    }
    return SlimeEnemy;
}(enemy_1.Enemy));
exports.SlimeEnemy = SlimeEnemy;


/***/ }),

/***/ "./src/enemy/spawner.ts":
/*!******************************!*\
  !*** ./src/enemy/spawner.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Spawner = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var skullEnemy_1 = __webpack_require__(/*! ./skullEnemy */ "./src/enemy/skullEnemy.ts");
var enemySpawnAnimation_1 = __webpack_require__(/*! ../projectile/enemySpawnAnimation */ "./src/projectile/enemySpawnAnimation.ts");
var bluegem_1 = __webpack_require__(/*! ../item/bluegem */ "./src/item/bluegem.ts");
var knightEnemy_1 = __webpack_require__(/*! ./knightEnemy */ "./src/enemy/knightEnemy.ts");
var wizardEnemy_1 = __webpack_require__(/*! ./wizardEnemy */ "./src/enemy/wizardEnemy.ts");
var Spawner = /** @class */ (function (_super) {
    __extends(Spawner, _super);
    function Spawner(level, game, x, y, rand) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hit = function () {
            return 1;
        };
        _this.tick = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.tileX = 6;
                if (_this.ticks % 8 === 0) {
                    var positions = _this.level
                        .getEmptyTiles()
                        .filter(function (t) { return Math.abs(t.x - _this.x) <= 1 && Math.abs(t.y - _this.y) <= 1; });
                    if (positions.length > 0) {
                        _this.tileX = 7;
                        var position = game_1.Game.randTable(positions, _this.rand);
                        var spawned = void 0;
                        switch (_this.enemySpawnType) {
                            case 1:
                                spawned = new knightEnemy_1.KnightEnemy(_this.level, _this.game, position.x, position.y, _this.rand);
                                break;
                            case 2:
                                spawned = new skullEnemy_1.SkullEnemy(_this.level, _this.game, position.x, position.y, _this.rand);
                                break;
                            case 3:
                                spawned = new wizardEnemy_1.WizardEnemy(_this.level, _this.game, position.x, position.y, _this.rand);
                                break;
                        }
                        _this.level.projectiles.push(new enemySpawnAnimation_1.EnemySpawnAnimation(_this.level, spawned, position.x, position.y));
                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, position.x, position.y));
                    }
                }
                _this.ticks++;
            }
        };
        _this.dropLoot = function () {
            _this.level.items.push(new bluegem_1.BlueGem(_this.level, _this.x, _this.y));
        };
        _this.ticks = 0;
        _this.health = 4;
        _this.maxHealth = 4;
        _this.tileX = 6;
        _this.tileY = 4;
        _this.seenPlayer = true;
        _this.enemySpawnType = game_1.Game.randTable([1, 2, 2, 2, 2, 3], rand);
        _this.deathParticleColor = "#ffffff";
        _this.rand = rand;
        return _this;
    }
    return Spawner;
}(enemy_1.Enemy));
exports.Spawner = Spawner;


/***/ }),

/***/ "./src/enemy/tombStone.ts":
/*!********************************!*\
  !*** ./src/enemy/tombStone.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TombStone = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var enemy_2 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var skullEnemy_1 = __webpack_require__(/*! ./skullEnemy */ "./src/enemy/skullEnemy.ts");
var random_1 = __webpack_require__(/*! ../random */ "./src/random.ts");
var spellbook_1 = __webpack_require__(/*! ../weapon/spellbook */ "./src/weapon/spellbook.ts");
var TombStone = /** @class */ (function (_super) {
    __extends(TombStone, _super);
    function TombStone(level, game, x, y, skinType, rand, drop) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.kill = function () {
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#d9a066");
            _this.dropLoot();
        };
        _this.hurt = function (playerHitBy, damage) {
            _this.healthBar.hurt();
            _this.health -= damage;
            if (_this.health === 1) {
                var positions = _this.level
                    .getEmptyTiles()
                    .filter(function (t) { return Math.abs(t.x - _this.x) <= 1 && Math.abs(t.y - _this.y) <= 1; });
                if (positions.length > 0) {
                    for (var _i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
                        var position = positions_1[_i];
                        for (var i in _this.game.players) {
                            var playerX = _this.game.players[i].x;
                            var playerY = _this.game.players[i].y;
                            if ((playerX !== position.x && playerY === position.y) ||
                                (playerX === position.x && playerY !== position.y)) {
                                _this.level.enemies.push(new skullEnemy_1.SkullEnemy(_this.level, _this.game, position.x, position.y, random_1.Random.rand));
                            }
                        }
                    }
                }
                _this.tileX += 2;
                //draw half broken tombstone based on skintype after it takes one damage
            }
            if (_this.health <= 0)
                _this.kill();
            else
                _this.hurtCallback();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            _this.drawX += -0.5 * _this.drawX;
            _this.drawY += -0.5 * _this.drawY;
        };
        _this.skinType = skinType;
        _this.level = level;
        _this.health = 2;
        _this.maxHealth = 2;
        _this.tileX = 11 + _this.skinType;
        _this.tileY = 2;
        _this.hasShadow = false;
        _this.pushable = false;
        _this.entityType = enemy_2.EntityType.Prop;
        _this.destroyable = true;
        _this.skinType = skinType;
        _this.rand = rand;
        _this.chainPushable = false;
        var dropProb = random_1.Random.rand();
        if (dropProb < 0.05)
            _this.drop = new spellbook_1.Spellbook(_this.level, 0, 0);
        return _this;
    }
    return TombStone;
}(enemy_1.Enemy));
exports.TombStone = TombStone;


/***/ }),

/***/ "./src/enemy/vendingMachine.ts":
/*!*************************************!*\
  !*** ./src/enemy/vendingMachine.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VendingMachine = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var coin_1 = __webpack_require__(/*! ../item/coin */ "./src/item/coin.ts");
var coal_1 = __webpack_require__(/*! ../item/coal */ "./src/item/coal.ts");
var greengem_1 = __webpack_require__(/*! ../item/greengem */ "./src/item/greengem.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var shotgun_1 = __webpack_require__(/*! ../weapon/shotgun */ "./src/weapon/shotgun.ts");
var armor_1 = __webpack_require__(/*! ../item/armor */ "./src/item/armor.ts");
var heart_1 = __webpack_require__(/*! ../item/heart */ "./src/item/heart.ts");
var spear_1 = __webpack_require__(/*! ../weapon/spear */ "./src/weapon/spear.ts");
var gold_1 = __webpack_require__(/*! ../item/gold */ "./src/item/gold.ts");
var bluegem_1 = __webpack_require__(/*! ../item/bluegem */ "./src/item/bluegem.ts");
var dualdagger_1 = __webpack_require__(/*! ../weapon/dualdagger */ "./src/weapon/dualdagger.ts");
var lantern_1 = __webpack_require__(/*! ../item/lantern */ "./src/item/lantern.ts");
var redgem_1 = __webpack_require__(/*! ../item/redgem */ "./src/item/redgem.ts");
var enemy_2 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var OPEN_TIME = 150;
var FILL_COLOR = "#5a595b";
var OUTLINE_COLOR = "#292c36";
var FULL_OUTLINE = "white";
var VendingMachine = /** @class */ (function (_super) {
    __extends(VendingMachine, _super);
    function VendingMachine(level, game, x, y, item, rand) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.open = false;
        _this.openTime = 0;
        _this.isInf = false;
        _this.quantity = 1;
        _this.buyAnimAmount = 0;
        _this.interact = function (player) {
            if (_this.isInf || _this.quantity > 0) {
                if (_this.open)
                    _this.playerOpened.openVendingMachine = null;
                _this.open = true;
                _this.playerOpened = player;
                _this.openTime = Date.now();
                if (_this.playerOpened.openVendingMachine && _this.playerOpened.openVendingMachine !== _this)
                    _this.playerOpened.openVendingMachine.close();
                _this.playerOpened.openVendingMachine = _this;
            }
        };
        _this.close = function () {
            _this.open = false;
            _this.playerOpened.openVendingMachine = null;
        };
        _this.space = function () {
            if (_this.open) {
                // check if player can pay
                for (var _i = 0, _a = _this.costItems; _i < _a.length; _i++) {
                    var i = _a[_i];
                    if (!_this.playerOpened.inventory.hasItemCount(i))
                        return;
                }
                for (var _b = 0, _c = _this.costItems; _b < _c.length; _b++) {
                    var i = _c[_b];
                    _this.playerOpened.inventory.subtractItemCount(i);
                }
                var x_1, y_1;
                do {
                    x_1 = game_1.Game.rand(_this.x - 1, _this.x + 1, _this.rand);
                    y_1 = game_1.Game.rand(_this.y - 1, _this.y + 1, _this.rand);
                } while ((x_1 === _this.x && y_1 === _this.y) || _this.level.roomArray[x_1][y_1].isSolid() || _this.level.enemies.some(function (e) { return e.x === x_1 && e.y === y_1; }));
                var newItem = new _this.item.constructor();
                newItem = newItem.constructor(_this.level, x_1, y_1);
                _this.level.items.push(newItem);
                if (!_this.isInf) {
                    _this.quantity--;
                    if (_this.quantity <= 0)
                        _this.close();
                }
                _this.buyAnimAmount = 0.99;
                if (_this.playerOpened === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(0, 4);
            }
        };
        _this.draw = function (delta) {
            var tileX = 19;
            if (!_this.isInf && _this.quantity === 0)
                tileX = 20;
            game_1.Game.drawObj(tileX, 0, 1, 2, _this.x, _this.y - 1, 1, 2, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            if (_this.open && _this.playerOpened === _this.game.players[_this.game.localPlayerID]) {
                var s = Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME); // size of box
                var b = 2; // border
                var g = -2; // gap
                var hg = 3; // highlighted growth
                var ob = 1; // outer border
                var width = (_this.costItems.length + 2) * (s + 2 * b + g) - g;
                var height = s + 2 * b + g - g;
                var cx = (_this.x + 0.5) * gameConstants_1.GameConstants.TILESIZE;
                var cy = (_this.y - 1.5) * gameConstants_1.GameConstants.TILESIZE;
                game_1.Game.ctx.fillStyle = FULL_OUTLINE;
                game_1.Game.ctx.fillRect(Math.round(cx - 0.5 * width) - ob, Math.round(cy - 0.5 * height) - ob, Math.round(width + 2 * ob), Math.round(height + 2 * ob));
                for (var x = 0; x < _this.costItems.length + 2; x++) {
                    game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                    game_1.Game.ctx.fillRect(Math.round(cx - 0.5 * width + x * (s + 2 * b + g)), Math.round(cy - 0.5 * height), Math.round(s + 2 * b), Math.round(s + 2 * b));
                    if (x !== _this.costItems.length) {
                        game_1.Game.ctx.fillStyle = FILL_COLOR;
                        game_1.Game.ctx.fillRect(Math.round(cx - 0.5 * width + x * (s + 2 * b + g) + b), Math.round(cy - 0.5 * height + b), Math.round(s), Math.round(s));
                    }
                }
                if (Date.now() - _this.openTime >= OPEN_TIME) {
                    for (var i = 0; i < _this.costItems.length + 2; i++) {
                        var drawX = Math.round(cx -
                            0.5 * width +
                            i * (s + 2 * b + g) +
                            b +
                            Math.floor(0.5 * s) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawY = Math.round(cy - 0.5 * height + b + Math.floor(0.5 * s) - 0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                        var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                        if (i < _this.costItems.length) {
                            var a = 1;
                            if (!_this.playerOpened.inventory.hasItemCount(_this.costItems[i]))
                                a = 0.15;
                            _this.costItems[i].drawIcon(delta, drawXScaled, drawYScaled, a);
                        }
                        else if (i === _this.costItems.length) {
                            game_1.Game.drawFX(0, 1, 1, 1, drawXScaled, drawYScaled, 1, 1);
                        }
                        else if (i === _this.costItems.length + 1) {
                            _this.item.drawIcon(delta, drawXScaled, drawYScaled);
                        }
                    }
                }
                _this.buyAnimAmount *= _this.buyAnimAmount;
                if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                    game_1.Game.ctx.globalAlpha = _this.buyAnimAmount;
                game_1.Game.ctx.fillStyle = FULL_OUTLINE;
                game_1.Game.ctx.fillRect(Math.round(cx - 0.5 * width) - ob, Math.round(cy - 0.5 * height) - ob, Math.round(width + 2 * ob), Math.round(height + 2 * ob));
                game_1.Game.ctx.globalAlpha = 1.0;
            }
        };
        _this.rand = rand;
        _this.destroyable = false;
        _this.pushable = false;
        _this.chainPushable = false;
        _this.interactable = true;
        _this.costItems = [];
        _this.entityType = enemy_2.EntityType.Friendly;
        _this.item = item;
        if (_this.item instanceof shotgun_1.Shotgun) {
            var g = new bluegem_1.BlueGem(level, 0, 0);
            g.stackCount = game_1.Game.randTable([5, 5, 6, 7], _this.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof heart_1.Heart) {
            var c = new coin_1.Coin(level, 0, 0);
            c.stackCount = 10;
            _this.costItems = [c];
            _this.isInf = true;
        }
        else if (_this.item instanceof spear_1.Spear) {
            var g = new greengem_1.GreenGem(level, 0, 0);
            g.stackCount = game_1.Game.randTable([5, 5, 6, 7], _this.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof armor_1.Armor) {
            var g = new gold_1.Gold(level, 0, 0);
            g.stackCount = game_1.Game.randTable([5, 5, 6, 7], _this.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof dualdagger_1.DualDagger) {
            var g = new redgem_1.RedGem(level, 0, 0);
            g.stackCount = game_1.Game.randTable([5, 5, 6, 7], _this.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof lantern_1.Lantern) {
            var g = new coal_1.Coal(level, 0, 0);
            g.stackCount = game_1.Game.randTable([25, 26, 27, 28], _this.rand);
            _this.costItems = [g];
        }
        return _this;
    }
    return VendingMachine;
}(enemy_1.Enemy));
exports.VendingMachine = VendingMachine;


/***/ }),

/***/ "./src/enemy/wizardEnemy.ts":
/*!**********************************!*\
  !*** ./src/enemy/wizardEnemy.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WizardEnemy = exports.WizardState = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var floor_1 = __webpack_require__(/*! ../tile/floor */ "./src/tile/floor.ts");
var bones_1 = __webpack_require__(/*! ../tile/bones */ "./src/tile/bones.ts");
var deathParticle_1 = __webpack_require__(/*! ../particle/deathParticle */ "./src/particle/deathParticle.ts");
var wizardTeleportParticle_1 = __webpack_require__(/*! ../particle/wizardTeleportParticle */ "./src/particle/wizardTeleportParticle.ts");
var wizardFireball_1 = __webpack_require__(/*! ../projectile/wizardFireball */ "./src/projectile/wizardFireball.ts");
var coin_1 = __webpack_require__(/*! ../item/coin */ "./src/item/coin.ts");
var bluegem_1 = __webpack_require__(/*! ../item/bluegem */ "./src/item/bluegem.ts");
var random_1 = __webpack_require__(/*! ../random */ "./src/random.ts");
var WizardState;
(function (WizardState) {
    WizardState[WizardState["idle"] = 0] = "idle";
    WizardState[WizardState["attack"] = 1] = "attack";
    WizardState[WizardState["justAttacked"] = 2] = "justAttacked";
    WizardState[WizardState["teleport"] = 3] = "teleport";
})(WizardState = exports.WizardState || (exports.WizardState = {}));
var WizardEnemy = /** @class */ (function (_super) {
    __extends(WizardEnemy, _super);
    function WizardEnemy(level, game, x, y, rand, drop) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.ATTACK_RADIUS = 5;
        _this.hit = function () {
            return 1;
        };
        _this.withinAttackingRangeOfPlayer = function () {
            var withinRange = false;
            for (var i in _this.game.players) {
                if (Math.pow((_this.x - _this.game.players[i].x), 2) + Math.pow((_this.y - _this.game.players[i].y), 2) <=
                    Math.pow(_this.ATTACK_RADIUS, 2)) {
                    withinRange = true;
                }
            }
            return withinRange;
        };
        _this.shuffle = function (a) {
            var j, x, i;
            for (i = a.length - 1; i > 0; i--) {
                j = Math.floor(random_1.Random.rand() * (i + 1));
                x = a[i];
                a[i] = a[j];
                a[j] = x;
            }
            return a;
        };
        _this.tick = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (!_this.seenPlayer) {
                    var p = _this.nearestPlayer();
                    if (p !== false) {
                        var distance = p[0], player = p[1];
                        if (distance <= 4) {
                            _this.seenPlayer = true;
                            _this.alertTicks = 1;
                        }
                    }
                }
                else if (_this.seenPlayer) {
                    _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                    switch (_this.state) {
                        case WizardState.attack:
                            if (_this.level.getTile(_this.x - 1, _this.y) && !_this.level.roomArray[_this.x - 1][_this.y].isSolid()) {
                                _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x - 1, _this.y));
                                if (_this.level.getTile(_this.x - 2, _this.y) && !_this.level.roomArray[_this.x - 2][_this.y].isSolid()) {
                                    _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x - 2, _this.y));
                                }
                            }
                            if (_this.level.getTile(_this.x + 1, _this.y) && !_this.level.roomArray[_this.x + 1][_this.y].isSolid()) {
                                _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x + 1, _this.y));
                                if (_this.level.getTile(_this.x + 2, _this.y) && !_this.level.roomArray[_this.x + 2][_this.y].isSolid()) {
                                    _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x + 2, _this.y));
                                }
                            }
                            if (_this.level.getTile(_this.x, _this.y - 1) && !_this.level.roomArray[_this.x][_this.y - 1].isSolid()) {
                                _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x, _this.y - 1));
                                if (_this.level.getTile(_this.x, _this.y - 2) && !_this.level.roomArray[_this.x][_this.y - 2].isSolid()) {
                                    _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x, _this.y - 2));
                                }
                            }
                            if (_this.level.getTile(_this.x, _this.y + 1) && !_this.level.roomArray[_this.x][_this.y + 1].isSolid()) {
                                _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x, _this.y + 1));
                                if (_this.level.getTile(_this.x, _this.y + 2) && !_this.level.roomArray[_this.x][_this.y + 2].isSolid()) {
                                    _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x, _this.y + 2));
                                }
                            }
                            _this.state = WizardState.justAttacked;
                            break;
                        case WizardState.justAttacked:
                            _this.state = WizardState.idle;
                            break;
                        case WizardState.teleport:
                            var oldX = _this.x;
                            var oldY = _this.y;
                            var min = 100000;
                            var bestPos = void 0;
                            var emptyTiles = _this.shuffle(_this.level.getEmptyTiles());
                            var optimalDist = game_1.Game.randTable([2, 2, 3, 3, 3, 3, 3], random_1.Random.rand);
                            // pick a random player to target
                            var player_ids = [];
                            for (var i in _this.game.players)
                                player_ids.push(i);
                            var target_player_id = game_1.Game.randTable(player_ids, random_1.Random.rand);
                            for (var _i = 0, emptyTiles_1 = emptyTiles; _i < emptyTiles_1.length; _i++) {
                                var t = emptyTiles_1[_i];
                                var newPos = t;
                                var dist = Math.abs(newPos.x - _this.game.players[target_player_id].x) + Math.abs(newPos.y - _this.game.players[target_player_id].y);
                                if (Math.abs(dist - optimalDist) < Math.abs(min - optimalDist)) {
                                    min = dist;
                                    bestPos = newPos;
                                }
                            }
                            _this.tryMove(bestPos.x, bestPos.y);
                            _this.drawX = _this.x - oldX;
                            _this.drawY = _this.y - oldY;
                            _this.frame = 0; // trigger teleport animation
                            _this.level.particles.push(new wizardTeleportParticle_1.WizardTeleportParticle(oldX, oldY));
                            if (_this.withinAttackingRangeOfPlayer()) {
                                _this.state = WizardState.attack;
                            }
                            else {
                                _this.state = WizardState.idle;
                            }
                            break;
                        case WizardState.idle:
                            _this.state = WizardState.teleport;
                            break;
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                if (_this.state === WizardState.attack)
                    _this.tileX = 7;
                else
                    _this.tileX = 6;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                if (_this.frame >= 0) {
                    game_1.Game.drawMob(Math.floor(_this.frame) + 6, 2, 1, 2, _this.x, _this.y - 1.5, 1, 2, _this.level.shadeColor, _this.shadeAmount());
                    _this.frame += 0.4 * delta;
                    if (_this.frame > 11)
                        _this.frame = -1;
                }
                else {
                    game_1.Game.drawMob(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
                }
                if (!_this.seenPlayer) {
                    _this.drawSleepingZs(delta);
                }
                if (_this.alertTicks > 0) {
                    _this.drawExclamation(delta);
                }
            }
        };
        _this.kill = function () {
            if (_this.level.roomArray[_this.x][_this.y] instanceof floor_1.Floor) {
                var b = new bones_1.Bones(_this.level, _this.x, _this.y);
                b.skin = _this.level.roomArray[_this.x][_this.y].skin;
                _this.level.roomArray[_this.x][_this.y] = b;
            }
            _this.dead = true;
            _this.level.particles.push(new deathParticle_1.DeathParticle(_this.x, _this.y));
            _this.dropLoot();
        };
        _this.ticks = 0;
        _this.health = 1;
        _this.tileX = 6;
        _this.tileY = 0;
        _this.frame = 0;
        _this.state = WizardState.attack;
        _this.seenPlayer = false;
        _this.alertTicks = 0;
        _this.deathParticleColor = "#ffffff";
        _this.rand = rand;
        if (drop)
            _this.drop = drop;
        else {
            if (_this.rand() < 0.02)
                _this.drop = new bluegem_1.BlueGem(_this.level, _this.x, _this.y);
            else
                _this.drop = new coin_1.Coin(_this.level, _this.x, _this.y);
        }
        return _this;
    }
    return WizardEnemy;
}(enemy_1.Enemy));
exports.WizardEnemy = WizardEnemy;


/***/ }),

/***/ "./src/enemy/zombieEnemy.ts":
/*!**********************************!*\
  !*** ./src/enemy/zombieEnemy.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ZombieEnemy = void 0;
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/enemy/enemy.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coin_1 = __webpack_require__(/*! ../item/coin */ "./src/item/coin.ts");
var greengem_1 = __webpack_require__(/*! ../item/greengem */ "./src/item/greengem.ts");
var random_1 = __webpack_require__(/*! ../random */ "./src/random.ts");
var astarclass_1 = __webpack_require__(/*! ../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../tile/spiketrap */ "./src/tile/spiketrap.ts");
var pickaxe_1 = __webpack_require__(/*! ../weapon/pickaxe */ "./src/weapon/pickaxe.ts");
var ZombieEnemy = /** @class */ (function (_super) {
    __extends(ZombieEnemy, _super);
    function ZombieEnemy(level, game, x, y, rand, drop) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hit = function () {
            return 1;
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.health -= damage;
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
                genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, _this.deathParticleColor);
            }
        };
        _this.tick = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.ticks++;
                if (!_this.seenPlayer) {
                    var p = _this.nearestPlayer();
                    if (p !== false) {
                        var distance = p[0], player = p[1];
                        if (distance <= 4) {
                            _this.targetPlayer = player;
                            _this.facePlayer(player);
                            _this.seenPlayer = true;
                            if (player === _this.game.players[_this.game.localPlayerID])
                                _this.alertTicks = 1;
                            /*this.level.hitwarnings.push(new HitWarning(this.game, this.x - 1, this.y));
                            this.level.hitwarnings.push(new HitWarning(this.game, this.x + 1, this.y));
                            this.level.hitwarnings.push(new HitWarning(this.game, this.x, this.y - 1));
                            this.level.hitwarnings.push(new HitWarning(this.game, this.x, this.y + 1));*/
                        }
                    }
                }
                else if (_this.seenPlayer) {
                    if (_this.level.playerTicked === _this.targetPlayer) {
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        var oldX = _this.x;
                        var oldY = _this.y;
                        var disablePositions = Array();
                        for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                            var e = _a[_i];
                            if (e !== _this) {
                                disablePositions.push({ x: e.x, y: e.y });
                            }
                        }
                        for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                            for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                if (_this.level.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                    _this.level.roomArray[xx][yy].on) {
                                    // don't walk on active spiketraps
                                    disablePositions.push({ x: xx, y: yy });
                                }
                            }
                        }
                        var grid = [];
                        for (var x = 0; x < _this.level.roomX + _this.level.width; x++) {
                            grid[x] = [];
                            for (var y = 0; y < _this.level.roomY + _this.level.height; y++) {
                                if (_this.level.roomArray[x] && _this.level.roomArray[x][y])
                                    grid[x][y] = _this.level.roomArray[x][y];
                                else
                                    grid[x][y] = false;
                            }
                        }
                        var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, false, false, true, _this.direction);
                        if (moves.length > 0) {
                            var moveX = moves[0].pos.x;
                            var moveY = moves[0].pos.y;
                            var oldDir = _this.direction;
                            var player = _this.targetPlayer;
                            _this.facePlayer(player);
                            if (moveX > oldX)
                                _this.direction = enemy_1.EnemyDirection.RIGHT;
                            else if (moveX < oldX)
                                _this.direction = enemy_1.EnemyDirection.LEFT;
                            else if (moveY > oldY)
                                _this.direction = enemy_1.EnemyDirection.DOWN;
                            else if (moveY < oldY)
                                _this.direction = enemy_1.EnemyDirection.UP;
                            if (oldDir == _this.direction) {
                                var hitPlayer = false;
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.level && _this.game.players[i].x === moveX && _this.game.players[i].y === moveY) {
                                        _this.game.players[i].hurt(_this.hit(), "zombie");
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] === _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                    }
                                }
                                if (!hitPlayer) {
                                    _this.tryMove(moveX, moveY);
                                    _this.drawX = _this.x - oldX;
                                    _this.drawY = _this.y - oldY;
                                    if (_this.x > oldX)
                                        _this.direction = enemy_1.EnemyDirection.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = enemy_1.EnemyDirection.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = enemy_1.EnemyDirection.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = enemy_1.EnemyDirection.UP;
                                }
                            }
                        }
                        if (_this.direction == enemy_1.EnemyDirection.LEFT) {
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                            disablePositions.push({ x: _this.x, y: _this.y + 1 });
                            disablePositions.push({ x: _this.x, y: _this.y - 1 });
                        }
                        if (_this.direction == enemy_1.EnemyDirection.RIGHT) {
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                            disablePositions.push({ x: _this.x, y: _this.y + 1 });
                            disablePositions.push({ x: _this.x, y: _this.y - 1 });
                        }
                        if (_this.direction == enemy_1.EnemyDirection.DOWN) {
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                            disablePositions.push({ x: _this.x + 1, y: _this.y });
                            disablePositions.push({ x: _this.x - 1, y: _this.y });
                        }
                        if (_this.direction == enemy_1.EnemyDirection.UP) {
                            _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                            disablePositions.push({ x: _this.x + 1, y: _this.y });
                            disablePositions.push({ x: _this.x - 1, y: _this.y });
                        }
                    }
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !== -1;
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 && (targetPlayerOffline || distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    if (_this.direction == enemy_1.EnemyDirection.LEFT) {
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                                    }
                                    if (_this.direction == enemy_1.EnemyDirection.RIGHT) {
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                                    }
                                    if (_this.direction == enemy_1.EnemyDirection.DOWN) {
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                                    }
                                    if (_this.direction == enemy_1.EnemyDirection.UP) {
                                        _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + Math.floor(_this.frame), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 17;
        _this.tileY = 8;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.deathParticleColor = "#ffffff";
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.025)
                _this.drop = new pickaxe_1.Pickaxe(_this.level, 0, 0);
            else if (dropProb < 0.02)
                _this.drop = new greengem_1.GreenGem(_this.level, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.level, 0, 0);
        }
        return _this;
    }
    return ZombieEnemy;
}(enemy_1.Enemy));
exports.ZombieEnemy = ZombieEnemy;


/***/ }),

/***/ "./src/game.ts":
/*!*********************!*\
  !*** ./src/game.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Game = exports.MenuState = exports.ChatMessage = exports.LevelState = void 0;
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var player_1 = __webpack_require__(/*! ./player */ "./src/player.ts");
var door_1 = __webpack_require__(/*! ./tile/door */ "./src/tile/door.ts");
var sound_1 = __webpack_require__(/*! ./sound */ "./src/sound.ts");
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var input_1 = __webpack_require__(/*! ./input */ "./src/input.ts");
var downLadder_1 = __webpack_require__(/*! ./tile/downLadder */ "./src/tile/downLadder.ts");
var socket_io_client_1 = __webpack_require__(/*! socket.io-client */ "./node_modules/socket.io-client/build/index.js");
var serverAddress_1 = __webpack_require__(/*! ./serverAddress */ "./src/serverAddress.ts");
var textbox_1 = __webpack_require__(/*! ./textbox */ "./src/textbox.ts");
var gameState_1 = __webpack_require__(/*! ./gameState */ "./src/gameState.ts");
var random_1 = __webpack_require__(/*! ./random */ "./src/random.ts");
var door_2 = __webpack_require__(/*! ./tile/door */ "./src/tile/door.ts");
var LevelState;
(function (LevelState) {
    LevelState[LevelState["IN_LEVEL"] = 0] = "IN_LEVEL";
    LevelState[LevelState["TRANSITIONING"] = 1] = "TRANSITIONING";
    LevelState[LevelState["TRANSITIONING_LADDER"] = 2] = "TRANSITIONING_LADDER";
})(LevelState = exports.LevelState || (exports.LevelState = {}));
var ChatMessage = /** @class */ (function () {
    function ChatMessage(message) {
        this.message = message;
        this.timestamp = Date.now();
    }
    return ChatMessage;
}());
exports.ChatMessage = ChatMessage;
var getShadeCanvasKey = function (set, sx, sy, sw, sh, opacity) {
    return set.src + "," + sx + "," + sy + "," + sw + "," + sh + "," + opacity;
};
var MenuState;
(function (MenuState) {
    MenuState[MenuState["LOADING"] = 0] = "LOADING";
    MenuState[MenuState["LOGIN_USERNAME"] = 1] = "LOGIN_USERNAME";
    MenuState[MenuState["LOGIN_PASSWORD"] = 2] = "LOGIN_PASSWORD";
    MenuState[MenuState["SELECT_WORLD"] = 3] = "SELECT_WORLD";
    MenuState[MenuState["IN_GAME"] = 4] = "IN_GAME";
})(MenuState = exports.MenuState || (exports.MenuState = {}));
// fps counter
var times = [];
var fps;
var Game = /** @class */ (function () {
    function Game() {
        var _this = this;
        this.input_history = [];
        this.mostRecentInputReceived = true;
        this.loginMessage = "";
        this.keyDownListener = function (key) {
            if (_this.menuState === MenuState.LOGIN_USERNAME) {
                _this.usernameTextBox.handleKeyPress(key);
            }
            else if (_this.menuState === MenuState.LOGIN_PASSWORD) {
                _this.passwordTextBox.handleKeyPress(key);
            }
            else if (_this.menuState === MenuState.SELECT_WORLD) {
                switch (key) {
                    case "ArrowUp":
                        _this.selectedWorldCode = Math.max(0, _this.selectedWorldCode - 1);
                        break;
                    case "ArrowDown":
                        _this.selectedWorldCode = Math.min(_this.worldCodes.length + 1, _this.selectedWorldCode + 1);
                        break;
                    case "Enter":
                        if (_this.selectedWorldCode === 0)
                            _this.socket.emit("get available worlds");
                        else if (_this.selectedWorldCode === 1)
                            _this.socket.emit("join new world");
                        else if (_this.worldCodes[_this.selectedWorldCode - 2])
                            _this.socket.emit("join world", _this.worldCodes[_this.selectedWorldCode - 2]);
                        break;
                }
            }
            else if (_this.menuState === MenuState.IN_GAME) {
                if (!_this.chatOpen) {
                    switch (key.toUpperCase()) {
                        case "C":
                            _this.chatOpen = true;
                            break;
                        case "/":
                            _this.chatOpen = true;
                            _this.chatTextBox.clear();
                            _this.chatTextBox.handleKeyPress(key);
                            break;
                        case "A":
                        case "ARROWLEFT":
                            _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.LEFT);
                            break;
                        case "D":
                        case "ARROWRIGHT":
                            _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.RIGHT);
                            break;
                        case "W":
                        case "ARROWUP":
                            _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.UP);
                            break;
                        case "S":
                        case "ARROWDOWN":
                            _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.DOWN);
                            break;
                        case " ":
                            _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.SPACE);
                            break;
                        case "I":
                            _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.I);
                            break;
                        case "Q":
                            _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.Q);
                            break;
                    }
                }
                else {
                    _this.chatTextBox.handleKeyPress(key);
                }
            }
        };
        this.sendInput = function (input) {
            if (_this.mostRecentInputReceived) {
                _this.mostRecentInputReceived = false;
                _this.socket.emit("input", _this.localPlayerID, input, random_1.Random.state);
            }
        };
        this.changeLevel = function (player, newLevel) {
            player.levelID = _this.rooms.indexOf(newLevel);
            if (_this.players[_this.localPlayerID] === player) {
                //this.level.exitLevel();
                _this.level = newLevel;
            }
            newLevel.enterLevel(player);
        };
        this.changeLevelThroughLadder = function (player, ladder) {
            player.levelID = _this.rooms.indexOf(ladder.linkedLevel);
            if (ladder instanceof downLadder_1.DownLadder)
                ladder.generate();
            if (_this.players[_this.localPlayerID] === player) {
                _this.levelState = LevelState.TRANSITIONING_LADDER;
                _this.transitionStartTime = Date.now();
                _this.transitioningLadder = ladder;
            }
            else {
                ladder.linkedLevel.enterLevel(player, ladder.linkedLevel); // since it's not a local player, don't wait for transition
            }
        };
        this.changeLevelThroughDoor = function (player, door, side) {
            player.levelID = _this.rooms.indexOf(door.level);
            if (_this.players[_this.localPlayerID] === player) {
                _this.levelState = LevelState.TRANSITIONING;
                _this.transitionStartTime = Date.now();
                var oldX = _this.players[_this.localPlayerID].x;
                var oldY = _this.players[_this.localPlayerID].y;
                _this.prevLevel = _this.level;
                //this.level.exitLevel();
                _this.level = door.level;
                door.level.enterLevelThroughDoor(player, door, side);
                _this.transitionX =
                    (_this.players[_this.localPlayerID].x - oldX) * gameConstants_1.GameConstants.TILESIZE;
                _this.transitionY =
                    (_this.players[_this.localPlayerID].y - oldY) * gameConstants_1.GameConstants.TILESIZE;
                _this.upwardTransition = false;
                _this.sideTransition = false;
                _this.sideTransitionDirection = side;
                if (door instanceof door_1.Door &&
                    [door_2.DoorDir.East, door_2.DoorDir.West].includes(door.doorDir))
                    _this.sideTransition = true;
                else if (door instanceof door_1.Door && door.doorDir === door_2.DoorDir.South)
                    _this.upwardTransition = true;
            }
            else {
                door.level.enterLevelThroughDoor(player, door, side);
            }
        };
        this.run = function (timestamp) {
            if (!_this.previousFrameTimestamp)
                _this.previousFrameTimestamp = timestamp - 1000.0 / gameConstants_1.GameConstants.FPS;
            // normalized so 1.0 = 60fps
            var delta = ((timestamp - _this.previousFrameTimestamp) * 60.0) / 1000.0;
            while (times.length > 0 && times[0] <= timestamp - 1000) {
                times.shift();
            }
            times.push(timestamp);
            fps = times.length;
            _this.update();
            _this.draw(delta);
            window.requestAnimationFrame(_this.run);
            _this.previousFrameTimestamp = timestamp;
        };
        this.update = function () {
            input_1.Input.checkIsTapHold();
            if (input_1.Input.lastPressTime !== 0 &&
                Date.now() - input_1.Input.lastPressTime > gameConstants_1.GameConstants.KEY_REPEAT_TIME) {
                input_1.Input.onKeydown({
                    repeat: false,
                    code: input_1.Input.lastPressKeyCode,
                });
            }
            if (_this.menuState === MenuState.IN_GAME) {
                if (_this.levelState === LevelState.TRANSITIONING) {
                    if (Date.now() - _this.transitionStartTime >=
                        levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME) {
                        _this.levelState = LevelState.IN_LEVEL;
                    }
                }
                if (_this.levelState === LevelState.TRANSITIONING_LADDER) {
                    if (Date.now() - _this.transitionStartTime >=
                        levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME_LADDER) {
                        _this.levelState = LevelState.IN_LEVEL;
                    }
                }
                for (var i in _this.players) {
                    _this.players[i].update();
                    _this.rooms[_this.players[i].levelID].update();
                    if (_this.players[i].dead) {
                        for (var j in _this.players) {
                            _this.players[j].dead = true;
                        }
                    }
                }
            }
        };
        this.lerp = function (a, b, t) {
            return (1 - t) * a + t * b;
        };
        this.pushMessage = function (message) {
            _this.chat.push(new ChatMessage(message));
        };
        this.onResize = function () {
            var maxWidthScale = Math.floor(window.innerWidth / gameConstants_1.GameConstants.DEFAULTWIDTH);
            var maxHeightScale = Math.floor(window.innerHeight / gameConstants_1.GameConstants.DEFAULTHEIGHT);
            Game.scale = Math.min(maxWidthScale, maxHeightScale);
            if (Game.scale === 0) {
                maxWidthScale = window.innerWidth / gameConstants_1.GameConstants.DEFAULTWIDTH;
                maxHeightScale = window.innerHeight / gameConstants_1.GameConstants.DEFAULTHEIGHT;
            }
            Game.scale = Math.min(maxWidthScale, maxHeightScale);
            levelConstants_1.LevelConstants.SCREEN_W = Math.floor(window.innerWidth / Game.scale / gameConstants_1.GameConstants.TILESIZE);
            levelConstants_1.LevelConstants.SCREEN_H = Math.floor(window.innerHeight / Game.scale / gameConstants_1.GameConstants.TILESIZE);
            gameConstants_1.GameConstants.WIDTH = levelConstants_1.LevelConstants.SCREEN_W * gameConstants_1.GameConstants.TILESIZE;
            gameConstants_1.GameConstants.HEIGHT = levelConstants_1.LevelConstants.SCREEN_H * gameConstants_1.GameConstants.TILESIZE;
            Game.ctx.canvas.setAttribute("width", "".concat(gameConstants_1.GameConstants.WIDTH));
            Game.ctx.canvas.setAttribute("height", "".concat(gameConstants_1.GameConstants.HEIGHT));
            Game.ctx.canvas.setAttribute("style", "width: ".concat(gameConstants_1.GameConstants.WIDTH * Game.scale, "px; height: ").concat(gameConstants_1.GameConstants.HEIGHT * Game.scale, "px;\n    display: block;\n    margin: 0 auto;\n  \n    image-rendering: optimizeSpeed; /* Older versions of FF          */\n    image-rendering: -moz-crisp-edges; /* FF 6.0+                       */\n    image-rendering: -webkit-optimize-contrast; /* Safari                        */\n    image-rendering: -o-crisp-edges; /* OS X & Windows Opera (12.02+) */\n    image-rendering: pixelated; /* Awesome future-browsers       */\n  \n    -ms-interpolation-mode: nearest-neighbor;"));
            //Game.ctx.canvas.width = window.innerWidth;
            //Game.ctx.canvas.height = window.innerHeight;
        };
        this.shakeScreen = function (shakeX, shakeY) {
            _this.screenShakeX = shakeX;
            _this.screenShakeY = shakeY;
        };
        this.draw = function (delta) {
            Game.ctx.globalAlpha = 1;
            Game.ctx.fillStyle = "black";
            if (_this.menuState === MenuState.IN_GAME)
                Game.ctx.fillStyle = _this.level.shadeColor;
            Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
            if (_this.menuState === MenuState.LOADING) {
                Game.ctx.fillStyle = "white";
                var loadingString = "loading...";
                Game.fillText(loadingString, gameConstants_1.GameConstants.WIDTH * 0.5 - Game.measureText(loadingString).width * 0.5, gameConstants_1.GameConstants.HEIGHT * 0.5 - Game.letter_height * 0.5);
            }
            else if (_this.menuState === MenuState.LOGIN_USERNAME) {
                Game.ctx.fillStyle = "white";
                Game.fillText(_this.loginMessage, gameConstants_1.GameConstants.WIDTH * 0.5 -
                    Game.measureText(_this.loginMessage).width * 0.5, gameConstants_1.GameConstants.HEIGHT * 0.5 - Game.letter_height * 3);
                var prompt_1 = "username: ";
                var usernameString = prompt_1 + _this.usernameTextBox.text;
                Game.fillText(usernameString, gameConstants_1.GameConstants.WIDTH * 0.5 -
                    Game.measureText(usernameString).width * 0.5, gameConstants_1.GameConstants.HEIGHT * 0.5 - Game.letter_height * 0.5);
                var cursorX = Game.measureText(usernameString.substring(0, prompt_1.length + _this.usernameTextBox.cursor)).width;
                Game.ctx.fillRect(Math.round(gameConstants_1.GameConstants.WIDTH * 0.5 -
                    Game.measureText(usernameString).width * 0.5 +
                    cursorX), Math.round(gameConstants_1.GameConstants.HEIGHT * 0.5 - Game.letter_height * 0.5), 1, Game.letter_height);
                prompt_1 = "password: ";
                var passwordString = prompt_1;
                for (var _i = 0, _a = _this.passwordTextBox.text; _i < _a.length; _i++) {
                    var i = _a[_i];
                    passwordString += "-";
                }
                Game.fillText(passwordString, gameConstants_1.GameConstants.WIDTH * 0.5 -
                    Game.measureText(passwordString).width * 0.5, gameConstants_1.GameConstants.HEIGHT * 0.5 + Game.letter_height * 0.5);
            }
            else if (_this.menuState === MenuState.LOGIN_PASSWORD) {
                Game.ctx.fillStyle = "white";
                Game.fillText(_this.loginMessage, gameConstants_1.GameConstants.WIDTH * 0.5 -
                    Game.measureText(_this.loginMessage).width * 0.5, gameConstants_1.GameConstants.HEIGHT * 0.5 - Game.letter_height * 3);
                var prompt_2 = "username: ";
                var usernameString = prompt_2 + _this.usernameTextBox.text;
                Game.fillText(usernameString, gameConstants_1.GameConstants.WIDTH * 0.5 -
                    Game.measureText(usernameString).width * 0.5, gameConstants_1.GameConstants.HEIGHT * 0.5 - Game.letter_height * 0.5);
                prompt_2 = "password: ";
                var passwordString = prompt_2;
                for (var _b = 0, _c = _this.passwordTextBox.text; _b < _c.length; _b++) {
                    var i = _c[_b];
                    passwordString += "-";
                }
                Game.fillText(passwordString, gameConstants_1.GameConstants.WIDTH * 0.5 -
                    Game.measureText(passwordString).width * 0.5, gameConstants_1.GameConstants.HEIGHT * 0.5 + Game.letter_height * 0.5);
                var cursorX = Game.measureText(passwordString.substring(0, prompt_2.length + _this.passwordTextBox.cursor)).width;
                Game.ctx.fillRect(Math.round(gameConstants_1.GameConstants.WIDTH * 0.5 -
                    Game.measureText(passwordString).width * 0.5 +
                    cursorX), Math.round(gameConstants_1.GameConstants.HEIGHT * 0.5 + Game.letter_height * 0.5), 1, Game.letter_height);
            }
            else if (_this.menuState === MenuState.SELECT_WORLD) {
                var c = ["refresh", "new world"];
                c = c.concat(_this.worldCodes);
                c[_this.selectedWorldCode] = "[ " + c[_this.selectedWorldCode] + " ]";
                for (var i = 0; i < c.length; i++) {
                    var ind = i - _this.selectedWorldCode;
                    var spacing = Game.letter_height + 2;
                    Game.ctx.fillStyle = "grey";
                    if (ind === 0)
                        Game.ctx.fillStyle = "white";
                    Game.fillText(c[i], gameConstants_1.GameConstants.WIDTH * 0.5 - Game.measureText(c[i]).width * 0.5, gameConstants_1.GameConstants.HEIGHT * 0.5 - Game.letter_height * 0.5 + ind * spacing);
                }
            }
            else if (_this.menuState === MenuState.IN_GAME) {
                if (_this.levelState === LevelState.TRANSITIONING) {
                    var levelOffsetX = Math.floor(_this.lerp((Date.now() - _this.transitionStartTime) /
                        levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME, 0, -_this.transitionX));
                    var levelOffsetY = Math.floor(_this.lerp((Date.now() - _this.transitionStartTime) /
                        levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME, 0, -_this.transitionY));
                    var playerOffsetX = levelOffsetX - _this.transitionX;
                    var playerOffsetY = levelOffsetY - _this.transitionY;
                    var playerCX = (_this.players[_this.localPlayerID].x -
                        _this.players[_this.localPlayerID].drawX +
                        0.5) *
                        gameConstants_1.GameConstants.TILESIZE;
                    var playerCY = (_this.players[_this.localPlayerID].y -
                        _this.players[_this.localPlayerID].drawY +
                        0.5) *
                        gameConstants_1.GameConstants.TILESIZE;
                    Game.ctx.translate(-Math.round(playerCX + playerOffsetX - 0.5 * gameConstants_1.GameConstants.WIDTH), -Math.round(playerCY + playerOffsetY - 0.5 * gameConstants_1.GameConstants.HEIGHT));
                    var extraTileLerp = Math.floor(_this.lerp((Date.now() - _this.transitionStartTime) /
                        levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME, 0, gameConstants_1.GameConstants.TILESIZE));
                    var newLevelOffsetX = playerOffsetX;
                    var newLevelOffsetY = playerOffsetY;
                    if (_this.sideTransition) {
                        if (_this.sideTransitionDirection > 0) {
                            levelOffsetX += extraTileLerp;
                            newLevelOffsetX += extraTileLerp + gameConstants_1.GameConstants.TILESIZE;
                        }
                        else {
                            levelOffsetX -= extraTileLerp;
                            newLevelOffsetX -= extraTileLerp + gameConstants_1.GameConstants.TILESIZE;
                        }
                    }
                    else if (_this.upwardTransition) {
                        levelOffsetY -= extraTileLerp;
                        newLevelOffsetY -= extraTileLerp + gameConstants_1.GameConstants.TILESIZE;
                    }
                    else {
                        levelOffsetY += extraTileLerp;
                        newLevelOffsetY += extraTileLerp + gameConstants_1.GameConstants.TILESIZE;
                    }
                    var ditherFrame = Math.floor((7 * (Date.now() - _this.transitionStartTime)) /
                        levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME);
                    Game.ctx.translate(levelOffsetX, levelOffsetY);
                    _this.prevLevel.draw(delta);
                    _this.prevLevel.drawEntities(delta);
                    for (var x = _this.prevLevel.roomX - 1; x <= _this.prevLevel.roomX + _this.prevLevel.width; x++) {
                        for (var y = _this.prevLevel.roomY - 1; y <= _this.prevLevel.roomY + _this.prevLevel.height; y++) {
                            Game.drawFX(7 - ditherFrame, 10, 1, 1, x, y, 1, 1);
                        }
                    }
                    Game.ctx.translate(-levelOffsetX, -levelOffsetY);
                    Game.ctx.translate(newLevelOffsetX, newLevelOffsetY);
                    _this.level.draw(delta);
                    _this.level.drawEntities(delta, true);
                    for (var x = _this.level.roomX - 1; x <= _this.level.roomX + _this.level.width; x++) {
                        for (var y = _this.level.roomY - 1; y <= _this.level.roomY + _this.level.height; y++) {
                            Game.drawFX(ditherFrame, 10, 1, 1, x, y, 1, 1);
                        }
                    }
                    Game.ctx.translate(-newLevelOffsetX, -newLevelOffsetY);
                    Game.ctx.translate(playerOffsetX, playerOffsetY);
                    _this.players[_this.localPlayerID].draw(delta);
                    Game.ctx.translate(-playerOffsetX, -playerOffsetY);
                    Game.ctx.translate(newLevelOffsetX, newLevelOffsetY);
                    _this.level.drawShade(delta);
                    _this.level.drawOverShade(delta);
                    Game.ctx.translate(-newLevelOffsetX, -newLevelOffsetY);
                    Game.ctx.translate(Math.round(playerCX + playerOffsetX - 0.5 * gameConstants_1.GameConstants.WIDTH), Math.round(playerCY + playerOffsetY - 0.5 * gameConstants_1.GameConstants.HEIGHT));
                    _this.players[_this.localPlayerID].drawGUI(delta);
                    for (var i in _this.players)
                        _this.players[i].updateDrawXY(delta);
                }
                else if (_this.levelState === LevelState.TRANSITIONING_LADDER) {
                    var playerCX = (_this.players[_this.localPlayerID].x -
                        _this.players[_this.localPlayerID].drawX +
                        0.5) *
                        gameConstants_1.GameConstants.TILESIZE;
                    var playerCY = (_this.players[_this.localPlayerID].y -
                        _this.players[_this.localPlayerID].drawY +
                        0.5) *
                        gameConstants_1.GameConstants.TILESIZE;
                    Game.ctx.translate(-Math.round(playerCX - 0.5 * gameConstants_1.GameConstants.WIDTH), -Math.round(playerCY - 0.5 * gameConstants_1.GameConstants.HEIGHT));
                    var deadFrames = 6;
                    var ditherFrame = Math.floor(((7 * 2 + deadFrames) * (Date.now() - _this.transitionStartTime)) /
                        levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME_LADDER);
                    if (ditherFrame < 7) {
                        _this.level.draw(delta);
                        _this.level.drawEntities(delta);
                        _this.level.drawShade(delta);
                        _this.level.drawOverShade(delta);
                        for (var x = _this.level.roomX - 1; x <= _this.level.roomX + _this.level.width; x++) {
                            for (var y = _this.level.roomY - 1; y <= _this.level.roomY + _this.level.height; y++) {
                                Game.drawFX(7 - ditherFrame, 10, 1, 1, x, y, 1, 1);
                            }
                        }
                    }
                    else if (ditherFrame >= 7 + deadFrames) {
                        if (_this.transitioningLadder) {
                            _this.prevLevel = _this.level;
                            _this.level.exitLevel();
                            _this.level = _this.transitioningLadder.linkedLevel;
                            _this.level.enterLevel(_this.players[_this.localPlayerID]);
                            _this.transitioningLadder = null;
                        }
                        _this.level.draw(delta);
                        _this.level.drawEntities(delta);
                        _this.level.drawShade(delta);
                        _this.level.drawOverShade(delta);
                        for (var x = _this.level.roomX - 1; x <= _this.level.roomX + _this.level.width; x++) {
                            for (var y = _this.level.roomY - 1; y <= _this.level.roomY + _this.level.height; y++) {
                                Game.drawFX(ditherFrame - (7 + deadFrames), 10, 1, 1, x, y, 1, 1);
                            }
                        }
                    }
                    Game.ctx.translate(Math.round(playerCX - 0.5 * gameConstants_1.GameConstants.WIDTH), Math.round(playerCY - 0.5 * gameConstants_1.GameConstants.HEIGHT));
                    _this.players[_this.localPlayerID].drawGUI(delta);
                    for (var i in _this.players)
                        _this.players[i].updateDrawXY(delta);
                }
                else {
                    _this.screenShakeX *= -0.8;
                    _this.screenShakeY *= -0.8;
                    var playerDrawX = _this.players[_this.localPlayerID].drawX;
                    var playerDrawY = _this.players[_this.localPlayerID].drawY;
                    var cameraX = Math.round((_this.players[_this.localPlayerID].x - playerDrawX + 0.5) *
                        gameConstants_1.GameConstants.TILESIZE -
                        0.5 * gameConstants_1.GameConstants.WIDTH -
                        _this.screenShakeX);
                    var cameraY = Math.round((_this.players[_this.localPlayerID].y - playerDrawY + 0.5) *
                        gameConstants_1.GameConstants.TILESIZE -
                        0.5 * gameConstants_1.GameConstants.HEIGHT -
                        _this.screenShakeY);
                    Game.ctx.translate(-cameraX, -cameraY);
                    _this.level.draw(delta);
                    _this.level.drawEntities(delta);
                    _this.level.drawShade(delta);
                    _this.level.drawOverShade(delta);
                    _this.players[_this.localPlayerID].drawTopLayer(delta);
                    Game.ctx.translate(cameraX, cameraY);
                    _this.level.drawTopLayer(delta);
                    _this.players[_this.localPlayerID].drawGUI(delta);
                    for (var i in _this.players)
                        _this.players[i].updateDrawXY(delta);
                }
                // draw chat
                var CHAT_X = 10;
                var CHAT_BOTTOM_Y = gameConstants_1.GameConstants.HEIGHT - Game.letter_height - 14;
                var CHAT_OPACITY = 0.5;
                if (_this.chatOpen) {
                    Game.ctx.fillStyle = "black";
                    if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                        Game.ctx.globalAlpha = 0.75;
                    Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
                    Game.ctx.globalAlpha = 1;
                    Game.ctx.fillStyle = "white";
                    Game.fillText(_this.chatTextBox.text, CHAT_X, CHAT_BOTTOM_Y);
                    var cursorX = Game.measureText(_this.chatTextBox.text.substring(0, _this.chatTextBox.cursor)).width;
                    Game.ctx.fillRect(CHAT_X + cursorX, CHAT_BOTTOM_Y, 1, Game.letter_height);
                }
                for (var i = 0; i < _this.chat.length; i++) {
                    Game.ctx.fillStyle = "white";
                    if (_this.chat[i][0] === "/")
                        Game.ctx.fillStyle = gameConstants_1.GameConstants.GREEN;
                    var y = CHAT_BOTTOM_Y - (_this.chat.length - 1 - i) * (Game.letter_height + 1);
                    if (_this.chatOpen)
                        y -= Game.letter_height + 1;
                    var age = Date.now() - _this.chat[i].timestamp;
                    if (_this.chatOpen) {
                        Game.ctx.globalAlpha = 1;
                    }
                    else {
                        if (age <= gameConstants_1.GameConstants.CHAT_APPEAR_TIME) {
                            if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                                Game.ctx.globalAlpha = CHAT_OPACITY;
                        }
                        else if (age <=
                            gameConstants_1.GameConstants.CHAT_APPEAR_TIME + gameConstants_1.GameConstants.CHAT_FADE_TIME) {
                            if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                                Game.ctx.globalAlpha =
                                    CHAT_OPACITY *
                                        (1 -
                                            (age - gameConstants_1.GameConstants.CHAT_APPEAR_TIME) /
                                                gameConstants_1.GameConstants.CHAT_FADE_TIME);
                        }
                        else {
                            Game.ctx.globalAlpha = 0;
                        }
                    }
                    Game.fillText(_this.chat[i].message, CHAT_X, y);
                }
            }
            // game version
            if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                Game.ctx.globalAlpha = 0.1;
            Game.ctx.fillStyle = levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR;
            Game.fillText(gameConstants_1.GameConstants.VERSION, gameConstants_1.GameConstants.WIDTH - Game.measureText(gameConstants_1.GameConstants.VERSION).width - 1, 1);
            Game.ctx.globalAlpha = 1;
            // fps
            if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                Game.ctx.globalAlpha = 0.1;
            Game.ctx.fillStyle = levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR;
            Game.fillText(fps + "fps", 1, 1);
            Game.ctx.globalAlpha = 1;
        };
        window.addEventListener("load", function () {
            _this.socket = (0, socket_io_client_1.io)(serverAddress_1.ServerAddress.address, { transports: ["websocket"] });
            _this.socket.on("new connect", function () {
                if (_this.menuState !== MenuState.LOADING) //what sets the menu state??
                    _this.loginMessage = "disconnected";
                _this.menuState = MenuState.LOGIN_USERNAME;
            });
            _this.socket.on("unrecognized session", function () {
                _this.loginMessage = "unrecognized session";
                _this.menuState = MenuState.LOGIN_USERNAME;
            });
            _this.socket.on("incorrect password", function () {
                _this.passwordTextBox.clear();
                _this.loginMessage = "incorrect password, try again";
                _this.menuState = MenuState.LOGIN_USERNAME;
            });
            _this.socket.on("login already active", function () {
                _this.usernameTextBox.clear();
                _this.passwordTextBox.clear();
                _this.loginMessage = "account currently logged in";
                _this.menuState = MenuState.LOGIN_USERNAME;
            });
            _this.socket.on("logged in", function () {
                _this.socket.emit("get available worlds");
                _this.menuState = MenuState.SELECT_WORLD;
            });
            _this.socket.on("world codes", function (codes) {
                _this.worldCodes = codes;
                _this.selectedWorldCode = 0;
            });
            _this.socket.on("welcome", function (activeUsernames, state) {
                _this.players = {};
                _this.offlinePlayers = {};
                (0, gameState_1.loadGameState)(_this, activeUsernames, state);
                _this.chatOpen = false;
                _this.screenShakeX = 0;
                _this.screenShakeY = 0;
                _this.menuState = MenuState.IN_GAME;
                _this.levelState = LevelState.IN_LEVEL;
            });
            _this.socket.on("get state", function () {
                _this.socket.emit("game state", (0, gameState_1.createGameState)(_this));
            });
            _this.socket.on("input", function (tickPlayerID, input, randState) {
                if (random_1.Random.state !== randState) {
                    _this.chat.push(new ChatMessage("RAND STATES OUT OF SYNC"));
                    _this.chat.push(new ChatMessage("Received " + randState));
                    _this.chat.push(new ChatMessage("Current " + random_1.Random.state));
                }
                var decode_input = function (input) {
                    if (input === input_1.InputEnum.I)
                        return "I";
                    if (input === input_1.InputEnum.Q)
                        return "Q";
                    if (input === input_1.InputEnum.LEFT)
                        return "LEFT";
                    if (input === input_1.InputEnum.RIGHT)
                        return "RIGHT";
                    if (input === input_1.InputEnum.UP)
                        return "UP";
                    if (input === input_1.InputEnum.DOWN)
                        return "DOWN";
                    if (input === input_1.InputEnum.SPACE)
                        return "SPACE";
                };
                _this.input_history.push(tickPlayerID + ", " + decode_input(input));
                // make sure player exists
                if (!(tickPlayerID in _this.players) &&
                    !(tickPlayerID in _this.offlinePlayers)) {
                    // new player
                    _this.players[_this.localPlayerID] = new player_1.Player(_this, 0, 0, true);
                    _this.players[_this.localPlayerID].levelID =
                        _this.levelgen.currentFloorFirstLevelID;
                    _this.players[_this.localPlayerID].x =
                        _this.rooms[_this.levelgen.currentFloorFirstLevelID].roomX +
                            Math.floor(_this.rooms[_this.levelgen.currentFloorFirstLevelID].width / 2);
                    _this.players[_this.localPlayerID].y =
                        _this.rooms[_this.levelgen.currentFloorFirstLevelID].roomY +
                            Math.floor(_this.rooms[_this.levelgen.currentFloorFirstLevelID].height / 2);
                }
                if (tickPlayerID in _this.offlinePlayers) {
                    // old player rejoining
                    _this.players[tickPlayerID] = _this.offlinePlayers[tickPlayerID];
                    delete _this.offlinePlayers[tickPlayerID];
                }
                // process input
                switch (input) {
                    case input_1.InputEnum.I:
                        _this.players[tickPlayerID].iListener();
                        break;
                    case input_1.InputEnum.Q:
                        _this.players[tickPlayerID].qListener();
                        break;
                    case input_1.InputEnum.LEFT:
                        _this.players[tickPlayerID].leftListener(false);
                        break;
                    case input_1.InputEnum.RIGHT:
                        _this.players[tickPlayerID].rightListener(false);
                        break;
                    case input_1.InputEnum.UP:
                        _this.players[tickPlayerID].upListener(false);
                        break;
                    case input_1.InputEnum.DOWN:
                        _this.players[tickPlayerID].downListener(false);
                        break;
                    case input_1.InputEnum.SPACE:
                        _this.players[tickPlayerID].spaceListener();
                        break;
                }
                if (tickPlayerID === _this.localPlayerID) {
                    _this.mostRecentInputReceived = true;
                }
            });
            _this.socket.on("chat message", function (message) {
                _this.chat.push(new ChatMessage(message));
            });
            _this.socket.on("player joined", function (connectedPlayerID) {
                if (connectedPlayerID in _this.offlinePlayers) {
                    // old player reconnecting
                    _this.players[connectedPlayerID] =
                        _this.offlinePlayers[connectedPlayerID];
                    if (_this.players[connectedPlayerID].levelID <
                        _this.levelgen.currentFloorFirstLevelID) {
                        _this.players[connectedPlayerID].levelID =
                            _this.levelgen.currentFloorFirstLevelID;
                        _this.players[connectedPlayerID].x =
                            _this.rooms[_this.levelgen.currentFloorFirstLevelID].roomX +
                                Math.floor(_this.rooms[_this.levelgen.currentFloorFirstLevelID].width / 2);
                        _this.players[connectedPlayerID].y =
                            _this.rooms[_this.levelgen.currentFloorFirstLevelID].roomY +
                                Math.floor(_this.rooms[_this.levelgen.currentFloorFirstLevelID].height / 2);
                    }
                    delete _this.offlinePlayers[connectedPlayerID];
                }
                else if (!(connectedPlayerID in _this.players)) {
                    // new player connecting
                    _this.players[connectedPlayerID] = new player_1.Player(_this, 0, 0, false);
                    _this.players[connectedPlayerID].levelID =
                        _this.levelgen.currentFloorFirstLevelID;
                    _this.players[connectedPlayerID].x =
                        _this.rooms[_this.levelgen.currentFloorFirstLevelID].roomX +
                            Math.floor(_this.rooms[_this.levelgen.currentFloorFirstLevelID].width / 2);
                    _this.players[connectedPlayerID].y =
                        _this.rooms[_this.levelgen.currentFloorFirstLevelID].roomY +
                            Math.floor(_this.rooms[_this.levelgen.currentFloorFirstLevelID].height / 2);
                }
            });
            _this.socket.on("player left", function (disconnectPlayerID) {
                _this.offlinePlayers[disconnectPlayerID] =
                    _this.players[disconnectPlayerID];
                delete _this.players[disconnectPlayerID];
            });
            var canvas = document.getElementById("gameCanvas");
            Game.ctx = canvas.getContext("2d", {
                alpha: false,
            });
            _this.chat = [];
            _this.chatTextBox = new textbox_1.TextBox();
            _this.chatTextBox.setEnterCallback(function () {
                if (_this.chatTextBox.text.length > 0) {
                    _this.socket.emit("chat message", _this.chatTextBox.text);
                    // chat commands
                    if (_this.chatTextBox.text === "/logout") {
                        _this.socket.emit("game state", (0, gameState_1.createGameState)(_this));
                        _this.socket.emit("logout");
                        _this.menuState = MenuState.LOGIN_USERNAME;
                        _this.usernameTextBox.clear();
                        _this.passwordTextBox.clear();
                        _this.rooms = [];
                        _this.players = {};
                        _this.offlinePlayers = {};
                    }
                    else if (_this.chatTextBox.text === "/leave") {
                        _this.socket.emit("game state", (0, gameState_1.createGameState)(_this));
                        _this.socket.emit("leave world");
                        _this.socket.emit("get available worlds");
                        _this.menuState = MenuState.SELECT_WORLD;
                        _this.rooms = [];
                        _this.players = {};
                        _this.offlinePlayers = {};
                    }
                    else if (_this.chatTextBox.text === "/save") {
                        _this.socket.emit("game state", (0, gameState_1.createGameState)(_this));
                    }
                    else if (_this.chatTextBox.text === "/r") {
                        console.log(random_1.Random.state);
                    }
                    else if (_this.chatTextBox.text === "/seed") {
                        console.log(_this.levelgen.seed);
                    }
                    else if (_this.chatTextBox.text === "/i") {
                        for (var i = 0; i < _this.input_history.length; i++) {
                            console.log(i + ": " + _this.input_history[i]);
                        }
                    }
                    else if (_this.chatTextBox.text.substring(0, 8) === "/invite ")
                        _this.socket.emit("invite", _this.chatTextBox.text.substring(8));
                    _this.chatTextBox.clear();
                }
                else {
                    _this.chatOpen = false;
                }
            });
            _this.chatTextBox.setEscapeCallback(function () {
                _this.chatOpen = false;
            });
            _this.chatOpen = false;
            _this.usernameTextBox = new textbox_1.TextBox();
            _this.usernameTextBox.allowedCharacters =
                "abcdefghijklmnopqrstuvwxyz1234567890 ,.!?:'()[]%-";
            _this.usernameTextBox.setEnterCallback(function () {
                if (_this.usernameTextBox.text.length < 1) {
                    _this.loginMessage = "username too short";
                }
                else {
                    _this.loginMessage = "";
                    _this.menuState = MenuState.LOGIN_PASSWORD;
                }
            });
            _this.passwordTextBox = new textbox_1.TextBox();
            _this.passwordTextBox.allowedCharacters =
                "abcdefghijklmnopqrstuvwxyz1234567890 ,.!?:'()[]%-";
            _this.passwordTextBox.setEnterCallback(function () {
                if (_this.passwordTextBox.text.length < 8) {
                    _this.loginMessage = "password too short";
                }
                else {
                    _this.localPlayerID = _this.usernameTextBox.text;
                    _this.socket.emit("login", _this.localPlayerID, _this.passwordTextBox.text);
                }
            });
            _this.worldCodes = [];
            _this.selectedWorldCode = 0;
            Game.shade_canvases = {};
            Game.text_rendering_canvases = {};
            Game.tileset = new Image();
            Game.tileset.src = "res/tileset.png";
            Game.objset = new Image();
            Game.objset.src = "res/objset.png";
            Game.mobset = new Image();
            Game.mobset.src = "res/mobset.png";
            Game.itemset = new Image();
            Game.itemset.src = "res/itemset.png";
            Game.fxset = new Image();
            Game.fxset.src = "res/fxset.png";
            Game.fontsheet = new Image();
            Game.fontsheet.src = "res/font.png";
            Game.scale = 1;
            sound_1.Sound.loadSounds();
            sound_1.Sound.playMusic(); // loops forever
            document.addEventListener("touchstart", function (e) {
                if (e.target == canvas) {
                    e.preventDefault();
                }
            }, false);
            document.addEventListener("touchend", function (e) {
                if (e.target == canvas) {
                    e.preventDefault();
                }
            }, false);
            document.addEventListener("touchmove", function (e) {
                if (e.target == canvas) {
                    e.preventDefault();
                }
            }, false);
            document.addEventListener("touchstart", input_1.Input.handleTouchStart, {
                passive: false,
            });
            document.addEventListener("touchmove", input_1.Input.handleTouchMove, {
                passive: false,
            });
            document.addEventListener("touchend", input_1.Input.handleTouchEnd, {
                passive: false,
            });
            input_1.Input.keyDownListener = function (key) {
                _this.keyDownListener(key);
            };
            _this.menuState = MenuState.LOADING;
            window.requestAnimationFrame(_this.run);
            _this.onResize();
            window.addEventListener("resize", _this.onResize);
        });
    }
    Game.letters = "abcdefghijklmnopqrstuvwxyz1234567890,.!?:'()[]%-/";
    Game.letter_widths = [
        4, 4, 4, 4, 3, 3, 4, 4, 1, 4, 4, 3, 5, 5, 4, 4, 4, 4, 4, 3, 4, 5, 5, 5, 5,
        3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 1, 1, 4, 1, 1, 2, 2, 2, 2, 5, 3, 3,
    ];
    Game.letter_height = 6;
    Game.letter_positions = [];
    // [min, max] inclusive
    Game.rand = function (min, max, rand) {
        if (max < min)
            return min;
        return Math.floor(rand() * (max - min + 1) + min);
    };
    Game.randTable = function (table, rand) {
        return table[Game.rand(0, table.length - 1, rand)];
    };
    Game.measureText = function (text) {
        var w = 0;
        for (var _i = 0, _a = text.toLowerCase(); _i < _a.length; _i++) {
            var letter = _a[_i];
            if (letter === " ")
                w += 4;
            else
                for (var i = 0; i < Game.letters.length; i++) {
                    if (Game.letters[i] === letter) {
                        w += Game.letter_widths[i] + 1;
                    }
                }
        }
        return { width: w, height: Game.letter_height };
    };
    Game.fillText = function (text, x, y, maxWidth) {
        x = Math.round(x);
        y = Math.round(y);
        if (Game.letter_positions.length === 0) {
            // calculate letter positions
            for (var i = 0; i < Game.letter_widths.length; i++) {
                if (i === 0)
                    Game.letter_positions[0] = 0;
                else
                    Game.letter_positions[i] =
                        Game.letter_positions[i - 1] + Game.letter_widths[i - 1] + 2;
            }
        }
        else {
            var dimensions = Game.measureText(text);
            if (dimensions.width > 0) {
                var key = text + Game.ctx.fillStyle;
                if (!Game.text_rendering_canvases[key]) {
                    Game.text_rendering_canvases[key] = document.createElement("canvas");
                    Game.text_rendering_canvases[key].width = dimensions.width;
                    Game.text_rendering_canvases[key].height = dimensions.height;
                    var bx = Game.text_rendering_canvases[key].getContext("2d");
                    var letter_x = 0;
                    for (var _i = 0, _a = text.toLowerCase(); _i < _a.length; _i++) {
                        var letter = _a[_i];
                        if (letter === " ")
                            letter_x += 4;
                        else
                            for (var i = 0; i < Game.letters.length; i++) {
                                if (Game.letters[i] === letter) {
                                    bx.drawImage(Game.fontsheet, Game.letter_positions[i] + 1, 0, Game.letter_widths[i], Game.letter_height, letter_x, 0, Game.letter_widths[i], Game.letter_height);
                                    letter_x += Game.letter_widths[i] + 1;
                                }
                            }
                    }
                    bx.fillStyle = Game.ctx.fillStyle;
                    bx.globalCompositeOperation = "source-in";
                    bx.fillRect(0, 0, Game.text_rendering_canvases[key].width, Game.text_rendering_canvases[key].height);
                    Game.ctx.drawImage(Game.text_rendering_canvases[key], x, y);
                }
                else {
                    Game.ctx.drawImage(Game.text_rendering_canvases[key], x, y);
                }
            }
        }
    };
    Game.fillTextOutline = function (text, x, y, outlineColor, fillColor) {
        Game.ctx.fillStyle = outlineColor;
        for (var xx = -1; xx <= 1; xx++) {
            for (var yy = -1; yy <= 1; yy++) {
                Game.fillText(text, x + xx, y + yy);
            }
        }
        Game.ctx.fillStyle = fillColor;
        Game.fillText(text, x, y);
    };
    Game.drawHelper = function (set, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        // snap to nearest shading increment
        shadeOpacity =
            Math.round(shadeOpacity * gameConstants_1.GameConstants.SHADE_LEVELS) /
                gameConstants_1.GameConstants.SHADE_LEVELS;
        var key = getShadeCanvasKey(set, sX, sY, sW, sH, shadeOpacity);
        if (!Game.shade_canvases[key]) {
            Game.shade_canvases[key] = document.createElement("canvas");
            Game.shade_canvases[key].width = Math.round(sW * gameConstants_1.GameConstants.TILESIZE);
            Game.shade_canvases[key].height = Math.round(sH * gameConstants_1.GameConstants.TILESIZE);
            var shCtx = Game.shade_canvases[key].getContext("2d");
            shCtx.clearRect(0, 0, Game.shade_canvases[key].width, Game.shade_canvases[key].height);
            shCtx.globalCompositeOperation = "source-over";
            shCtx.drawImage(set, Math.round(sX * gameConstants_1.GameConstants.TILESIZE), Math.round(sY * gameConstants_1.GameConstants.TILESIZE), Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE), 0, 0, Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE));
            shCtx.globalAlpha = shadeOpacity;
            shCtx.fillStyle = shadeColor;
            shCtx.fillRect(0, 0, Game.shade_canvases[key].width, Game.shade_canvases[key].height);
            shCtx.globalAlpha = 1.0;
            shCtx.globalCompositeOperation = "destination-in";
            shCtx.drawImage(set, Math.round(sX * gameConstants_1.GameConstants.TILESIZE), Math.round(sY * gameConstants_1.GameConstants.TILESIZE), Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE), 0, 0, Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE));
        }
        Game.ctx.drawImage(Game.shade_canvases[key], Math.round(dX * gameConstants_1.GameConstants.TILESIZE), Math.round(dY * gameConstants_1.GameConstants.TILESIZE), Math.round(dW * gameConstants_1.GameConstants.TILESIZE), Math.round(dH * gameConstants_1.GameConstants.TILESIZE));
    };
    Game.drawTile = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.tileset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
        /*Game.ctx.drawImage(
          Game.tileset,
          Math.round(sX * GameConstants.TILESIZE),
          Math.round(sY * GameConstants.TILESIZE),
          Math.round(sW * GameConstants.TILESIZE),
          Math.round(sH * GameConstants.TILESIZE),
          Math.round(dX * GameConstants.TILESIZE),
          Math.round(dY * GameConstants.TILESIZE),
          Math.round(dW * GameConstants.TILESIZE),
          Math.round(dH * GameConstants.TILESIZE)
        );
    
        if (GameConstants.ALPHA_ENABLED) {
          Game.ctx.globalAlpha = shadeOpacity;
          Game.ctx.fillStyle = shadeColor;
          Game.ctx.fillRect(
            Math.round(dX * GameConstants.TILESIZE),
            Math.round(dY * GameConstants.TILESIZE),
            Math.round(dW * GameConstants.TILESIZE),
            Math.round(dH * GameConstants.TILESIZE)
          );
          Game.ctx.globalAlpha = 1.0;
        }*/
    };
    Game.drawObj = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.objset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
    };
    Game.drawMob = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.mobset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
    };
    Game.drawItem = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.itemset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
    };
    Game.drawFX = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.fxset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
    };
    return Game;
}());
exports.Game = Game;
var game = new Game();


/***/ }),

/***/ "./src/gameConstants.ts":
/*!******************************!*\
  !*** ./src/gameConstants.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameConstants = void 0;
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var GameConstants = /** @class */ (function () {
    function GameConstants() {
    }
    GameConstants.VERSION = "v0.6.3";
    GameConstants.FPS = 120;
    GameConstants.ALPHA_ENABLED = true;
    GameConstants.SHADE_LEVELS = 10;
    GameConstants.TILESIZE = 16;
    GameConstants.SCALE = 1;
    GameConstants.SWIPE_THRESH = Math.pow(50, 2); // (size of swipe threshold circle)^2
    GameConstants.KEY_REPEAT_TIME = 300; // millseconds
    GameConstants.CHAT_APPEAR_TIME = 10000;
    GameConstants.CHAT_FADE_TIME = 1000;
    GameConstants.DEFAULTWIDTH = 12 * GameConstants.TILESIZE;
    GameConstants.DEFAULTHEIGHT = 12 * GameConstants.TILESIZE;
    GameConstants.WIDTH = levelConstants_1.LevelConstants.SCREEN_W * GameConstants.TILESIZE;
    GameConstants.HEIGHT = levelConstants_1.LevelConstants.SCREEN_H * GameConstants.TILESIZE;
    GameConstants.scrolling = true;
    GameConstants.SCRIPT_FONT_SIZE = 16;
    GameConstants.FONT_SIZE = 7;
    GameConstants.BIG_FONT_SIZE = 15;
    GameConstants.RED = "#ac3232";
    GameConstants.WARNING_RED = "#ff0000";
    GameConstants.GREEN = "#6abe30";
    GameConstants.ARMOR_GREY = "#9badb7";
    GameConstants.OUTLINE = "#222034";
    GameConstants.HIT_ENEMY_TEXT_COLOR = "#76428a";
    GameConstants.HEALTH_BUFF_COLOR = "#d77bba";
    GameConstants.MISS_COLOR = "#639bff";
    return GameConstants;
}());
exports.GameConstants = GameConstants;


/***/ }),

/***/ "./src/gameState.ts":
/*!**************************!*\
  !*** ./src/gameState.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.loadGameState = exports.createGameState = exports.GameState = exports.PlayerState = exports.InventoryState = exports.ItemState = exports.ItemType = exports.LevelState = exports.EnemyState = exports.EnemyType = exports.ProjectileState = exports.ProjectileType = exports.HitWarningState = void 0;
var barrel_1 = __webpack_require__(/*! ./enemy/barrel */ "./src/enemy/barrel.ts");
var bigSkullEnemy_1 = __webpack_require__(/*! ./enemy/bigSkullEnemy */ "./src/enemy/bigSkullEnemy.ts");
var chargeEnemy_1 = __webpack_require__(/*! ./enemy/chargeEnemy */ "./src/enemy/chargeEnemy.ts");
var chest_1 = __webpack_require__(/*! ./enemy/chest */ "./src/enemy/chest.ts");
var coalResource_1 = __webpack_require__(/*! ./enemy/coalResource */ "./src/enemy/coalResource.ts");
var crate_1 = __webpack_require__(/*! ./enemy/crate */ "./src/enemy/crate.ts");
var emeraldResource_1 = __webpack_require__(/*! ./enemy/emeraldResource */ "./src/enemy/emeraldResource.ts");
var goldResource_1 = __webpack_require__(/*! ./enemy/goldResource */ "./src/enemy/goldResource.ts");
var knightEnemy_1 = __webpack_require__(/*! ./enemy/knightEnemy */ "./src/enemy/knightEnemy.ts");
var pottedPlant_1 = __webpack_require__(/*! ./enemy/pottedPlant */ "./src/enemy/pottedPlant.ts");
var pot_1 = __webpack_require__(/*! ./enemy/pot */ "./src/enemy/pot.ts");
var skullEnemy_1 = __webpack_require__(/*! ./enemy/skullEnemy */ "./src/enemy/skullEnemy.ts");
var slimeEnemy_1 = __webpack_require__(/*! ./enemy/slimeEnemy */ "./src/enemy/slimeEnemy.ts");
var spawner_1 = __webpack_require__(/*! ./enemy/spawner */ "./src/enemy/spawner.ts");
var vendingMachine_1 = __webpack_require__(/*! ./enemy/vendingMachine */ "./src/enemy/vendingMachine.ts");
var wizardEnemy_1 = __webpack_require__(/*! ./enemy/wizardEnemy */ "./src/enemy/wizardEnemy.ts");
var zombieEnemy_1 = __webpack_require__(/*! ./enemy/zombieEnemy */ "./src/enemy/zombieEnemy.ts");
var hitWarning_1 = __webpack_require__(/*! ./hitWarning */ "./src/hitWarning.ts");
var armor_1 = __webpack_require__(/*! ./item/armor */ "./src/item/armor.ts");
var bluegem_1 = __webpack_require__(/*! ./item/bluegem */ "./src/item/bluegem.ts");
var candle_1 = __webpack_require__(/*! ./item/candle */ "./src/item/candle.ts");
var coal_1 = __webpack_require__(/*! ./item/coal */ "./src/item/coal.ts");
var coin_1 = __webpack_require__(/*! ./item/coin */ "./src/item/coin.ts");
var equippable_1 = __webpack_require__(/*! ./item/equippable */ "./src/item/equippable.ts");
var gold_1 = __webpack_require__(/*! ./item/gold */ "./src/item/gold.ts");
var goldenKey_1 = __webpack_require__(/*! ./item/goldenKey */ "./src/item/goldenKey.ts");
var greengem_1 = __webpack_require__(/*! ./item/greengem */ "./src/item/greengem.ts");
var heart_1 = __webpack_require__(/*! ./item/heart */ "./src/item/heart.ts");
var key_1 = __webpack_require__(/*! ./item/key */ "./src/item/key.ts");
var lantern_1 = __webpack_require__(/*! ./item/lantern */ "./src/item/lantern.ts");
var redgem_1 = __webpack_require__(/*! ./item/redgem */ "./src/item/redgem.ts");
var torch_1 = __webpack_require__(/*! ./item/torch */ "./src/item/torch.ts");
var levelGenerator_1 = __webpack_require__(/*! ./levelGenerator */ "./src/levelGenerator.ts");
var player_1 = __webpack_require__(/*! ./player */ "./src/player.ts");
var enemySpawnAnimation_1 = __webpack_require__(/*! ./projectile/enemySpawnAnimation */ "./src/projectile/enemySpawnAnimation.ts");
var wizardFireball_1 = __webpack_require__(/*! ./projectile/wizardFireball */ "./src/projectile/wizardFireball.ts");
var random_1 = __webpack_require__(/*! ./random */ "./src/random.ts");
var dagger_1 = __webpack_require__(/*! ./weapon/dagger */ "./src/weapon/dagger.ts");
var dualdagger_1 = __webpack_require__(/*! ./weapon/dualdagger */ "./src/weapon/dualdagger.ts");
var shotgun_1 = __webpack_require__(/*! ./weapon/shotgun */ "./src/weapon/shotgun.ts");
var spear_1 = __webpack_require__(/*! ./weapon/spear */ "./src/weapon/spear.ts");
var pickaxe_1 = __webpack_require__(/*! ./weapon/pickaxe */ "./src/weapon/pickaxe.ts");
var backpack_1 = __webpack_require__(/*! ./item/backpack */ "./src/item/backpack.ts");
var HitWarningState = /** @class */ (function () {
    function HitWarningState(hw) {
        this.x = hw.x;
        this.y = hw.y;
        this.dead = hw.dead;
    }
    return HitWarningState;
}());
exports.HitWarningState = HitWarningState;
var loadHitWarning = function (hws, game) {
    var hw = new hitWarning_1.HitWarning(game, hws.x, hws.y);
    hw.dead = hws.dead;
    return hw;
};
var ProjectileType;
(function (ProjectileType) {
    ProjectileType[ProjectileType["SPAWN"] = 0] = "SPAWN";
    ProjectileType[ProjectileType["WIZARD"] = 1] = "WIZARD";
})(ProjectileType = exports.ProjectileType || (exports.ProjectileType = {}));
var ProjectileState = /** @class */ (function () {
    function ProjectileState(projectile, game) {
        this.x = projectile.x;
        this.y = projectile.y;
        this.dead = projectile.dead;
        if (projectile instanceof enemySpawnAnimation_1.EnemySpawnAnimation) {
            this.type = ProjectileType.SPAWN;
            this.levelID = game.rooms.indexOf(projectile.level);
            this.enemySpawn = new EnemyState(projectile.enemy, game);
        }
        if (projectile instanceof wizardFireball_1.WizardFireball) {
            this.type = ProjectileType.WIZARD;
            this.wizardState = projectile.state;
            this.levelID = game.rooms.indexOf(projectile.parent.level);
            this.wizardParentID = projectile.parent.level.enemies.indexOf(projectile.parent);
        }
    }
    return ProjectileState;
}());
exports.ProjectileState = ProjectileState;
var loadProjectile = function (ps, game) {
    if (ps.type === ProjectileType.SPAWN) {
        var level = game.rooms[ps.levelID];
        var enemy = loadEnemy(ps.enemySpawn, game);
        var p = new enemySpawnAnimation_1.EnemySpawnAnimation(level, enemy, ps.x, ps.y);
        p.dead = ps.dead;
        return p;
    }
    if (ps.type === ProjectileType.WIZARD) {
        var wizard = game.rooms[ps.levelID].enemies[ps.wizardParentID];
        var p = new wizardFireball_1.WizardFireball(wizard, ps.x, ps.y);
        p.state = ps.wizardState;
        return p;
    }
};
var EnemyType;
(function (EnemyType) {
    EnemyType[EnemyType["BARREL"] = 0] = "BARREL";
    EnemyType[EnemyType["BIGSKULL"] = 1] = "BIGSKULL";
    EnemyType[EnemyType["CHARGE"] = 2] = "CHARGE";
    EnemyType[EnemyType["CHEST"] = 3] = "CHEST";
    EnemyType[EnemyType["COAL"] = 4] = "COAL";
    EnemyType[EnemyType["CRATE"] = 5] = "CRATE";
    EnemyType[EnemyType["EMERALD"] = 6] = "EMERALD";
    EnemyType[EnemyType["GOLD"] = 7] = "GOLD";
    EnemyType[EnemyType["KNIGHT"] = 8] = "KNIGHT";
    EnemyType[EnemyType["PLANT"] = 9] = "PLANT";
    EnemyType[EnemyType["SKULL"] = 10] = "SKULL";
    EnemyType[EnemyType["SLIME"] = 11] = "SLIME";
    EnemyType[EnemyType["SPAWNER"] = 12] = "SPAWNER";
    EnemyType[EnemyType["VENDINGMACHINE"] = 13] = "VENDINGMACHINE";
    EnemyType[EnemyType["WIZARD"] = 14] = "WIZARD";
    EnemyType[EnemyType["ZOMBIE"] = 15] = "ZOMBIE";
})(EnemyType = exports.EnemyType || (exports.EnemyType = {}));
var EnemyState = /** @class */ (function () {
    function EnemyState(enemy, game) {
        this.levelID = game.rooms.indexOf(enemy.level);
        this.x = enemy.x;
        this.y = enemy.y;
        this.health = enemy.health;
        this.direction = enemy.direction;
        this.dead = enemy.dead;
        this.skipNextTurns = enemy.skipNextTurns;
        this.hasDrop = false;
        if (enemy.drop) {
            this.hasDrop = true;
            this.drop = new ItemState(enemy.drop, game);
        }
        this.alertTicks = enemy.alertTicks;
        if (enemy instanceof barrel_1.Barrel)
            this.type = EnemyType.BARREL;
        if (enemy instanceof bigSkullEnemy_1.BigSkullEnemy) {
            this.type = EnemyType.BIGSKULL;
            this.ticks = enemy.ticks;
            this.ticksSinceFirstHit = enemy.ticksSinceFirstHit;
            this.seenPlayer = enemy.seenPlayer;
            if (enemy.seenPlayer) {
                this.targetPlayerID = Object.keys(game.players).find(function (key) { return game.players[key] === enemy.targetPlayer; });
                if (!this.targetPlayerID)
                    this.targetPlayerID = Object.keys(game.offlinePlayers).find(function (key) { return game.offlinePlayers[key] === enemy.targetPlayer; });
            }
            this.drops = [];
            for (var _i = 0, _a = enemy.drops; _i < _a.length; _i++) {
                var d = _a[_i];
                this.drops.push(new ItemState(d, game));
            }
        }
        if (enemy instanceof chargeEnemy_1.ChargeEnemy) {
            this.type = EnemyType.CHARGE;
            this.ticks = enemy.ticks;
            this.chargeEnemyState = enemy.state;
            this.startX = enemy.startX;
            this.startY = enemy.startY;
            this.targetX = enemy.targetX;
            this.targetY = enemy.targetY;
            this.visualTargetX = enemy.visualTargetX;
            this.visualTargetY = enemy.visualTargetY;
        }
        if (enemy instanceof chest_1.Chest)
            this.type = EnemyType.CHEST;
        if (enemy instanceof coalResource_1.CoalResource)
            this.type = EnemyType.COAL;
        if (enemy instanceof crate_1.Crate)
            this.type = EnemyType.CRATE;
        if (enemy instanceof emeraldResource_1.EmeraldResource)
            this.type = EnemyType.EMERALD;
        if (enemy instanceof goldResource_1.GoldResource)
            this.type = EnemyType.GOLD;
        if (enemy instanceof knightEnemy_1.KnightEnemy) {
            this.type = EnemyType.KNIGHT;
            this.ticks = enemy.ticks;
            this.seenPlayer = enemy.seenPlayer;
            if (enemy.seenPlayer) {
                this.targetPlayerID = Object.keys(game.players).find(function (key) { return game.players[key] === enemy.targetPlayer; });
                if (!this.targetPlayerID)
                    this.targetPlayerID = Object.keys(game.offlinePlayers).find(function (key) { return game.offlinePlayers[key] === enemy.targetPlayer; });
            }
        }
        if (enemy instanceof pottedPlant_1.PottedPlant)
            this.type = EnemyType.PLANT;
        if (enemy instanceof pot_1.Pot)
            this.type = EnemyType.PLANT;
        if (enemy instanceof skullEnemy_1.SkullEnemy) {
            this.type = EnemyType.SKULL;
            this.ticks = enemy.ticks;
            this.ticksSinceFirstHit = enemy.ticksSinceFirstHit;
            this.seenPlayer = enemy.seenPlayer;
            if (enemy.seenPlayer) {
                this.targetPlayerID = Object.keys(game.players).find(function (key) { return game.players[key] === enemy.targetPlayer; });
                if (!this.targetPlayerID)
                    this.targetPlayerID = Object.keys(game.offlinePlayers).find(function (key) { return game.offlinePlayers[key] === enemy.targetPlayer; });
            }
        }
        if (enemy instanceof slimeEnemy_1.SlimeEnemy) {
            this.type = EnemyType.SLIME;
            this.ticks = enemy.ticks;
            this.seenPlayer = enemy.seenPlayer;
            if (enemy.seenPlayer) {
                this.targetPlayerID = Object.keys(game.players).find(function (key) { return game.players[key] === enemy.targetPlayer; });
                if (!this.targetPlayerID)
                    this.targetPlayerID = Object.keys(game.offlinePlayers).find(function (key) { return game.offlinePlayers[key] === enemy.targetPlayer; });
            }
        }
        if (enemy instanceof spawner_1.Spawner) {
            this.type = EnemyType.SPAWNER;
            this.ticks = enemy.ticks;
            this.seenPlayer = enemy.seenPlayer;
            this.enemySpawnType = enemy.enemySpawnType;
        }
        if (enemy instanceof vendingMachine_1.VendingMachine) {
            this.type = EnemyType.VENDINGMACHINE;
            this.isPlayerOpened = false;
            if (enemy.playerOpened) {
                this.isPlayerOpened = true;
                this.playerOpenedID = Object.keys(game.players).find(function (key) { return game.players[key] === enemy.playerOpened; });
                if (!this.playerOpenedID)
                    this.playerOpenedID = Object.keys(game.offlinePlayers).find(function (key) { return game.offlinePlayers[key] === enemy.playerOpened; });
            }
            this.open = enemy.open;
            this.costItems = [];
            for (var _b = 0, _c = enemy.costItems; _b < _c.length; _b++) {
                var item = _c[_b];
                this.costItems.push(new ItemState(item, game));
            }
            this.item = new ItemState(enemy.item, game);
            this.isInf = enemy.isInf;
            this.quantity = enemy.quantity;
        }
        if (enemy instanceof wizardEnemy_1.WizardEnemy) {
            this.type = EnemyType.WIZARD;
            this.ticks = enemy.ticks;
            this.wizardState = enemy.state;
            this.seenPlayer = enemy.seenPlayer;
        }
        if (enemy instanceof zombieEnemy_1.ZombieEnemy) {
            this.type = EnemyType.ZOMBIE;
            this.ticks = enemy.ticks;
            this.seenPlayer = enemy.seenPlayer;
            if (enemy.seenPlayer) {
                this.targetPlayerID = Object.keys(game.players).find(function (key) { return game.players[key] === enemy.targetPlayer; });
                if (!this.targetPlayerID)
                    this.targetPlayerID = Object.keys(game.offlinePlayers).find(function (key) { return game.offlinePlayers[key] === enemy.targetPlayer; });
            }
        }
    }
    return EnemyState;
}());
exports.EnemyState = EnemyState;
var loadEnemy = function (es, game) {
    var enemy;
    var level = game.rooms[es.levelID];
    if (es.type === EnemyType.BARREL)
        enemy = new barrel_1.Barrel(level, game, es.x, es.y);
    if (es.type === EnemyType.BIGSKULL) {
        enemy = new bigSkullEnemy_1.BigSkullEnemy(level, game, es.x, es.y, random_1.Random.rand);
        enemy.ticks = es.ticks;
        enemy.ticksSinceFirstHit = es.ticksSinceFirstHit;
        enemy.seenPlayer = es.seenPlayer;
        if (es.seenPlayer) {
            enemy.targetPlayer = game.players[es.targetPlayerID];
            if (!enemy.targetPlayer)
                enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
        }
        enemy.drops = [];
        for (var _i = 0, _a = es.drops; _i < _a.length; _i++) {
            var d = _a[_i];
            enemy.drops.push(loadItem(d, game));
        }
    }
    if (es.type === EnemyType.CHARGE) {
        enemy = new chargeEnemy_1.ChargeEnemy(level, game, es.x, es.y);
        enemy.ticks = es.ticks;
        enemy.state = es.chargeEnemyState;
        enemy.startX = es.startX;
        enemy.startY = es.startY;
        enemy.targetX = es.targetX;
        enemy.targetY = es.targetY;
        enemy.visualTargetX = es.visualTargetX;
        enemy.visualTargetY = es.visualTargetY;
    }
    if (es.type === EnemyType.CHEST)
        enemy = new chest_1.Chest(level, game, es.x, es.y, random_1.Random.rand);
    if (es.type === EnemyType.COAL)
        enemy = new coalResource_1.CoalResource(level, game, es.x, es.y);
    if (es.type === EnemyType.CRATE)
        enemy = new crate_1.Crate(level, game, es.x, es.y);
    if (es.type === EnemyType.EMERALD)
        enemy = new emeraldResource_1.EmeraldResource(level, game, es.x, es.y);
    if (es.type === EnemyType.GOLD)
        enemy = new goldResource_1.GoldResource(level, game, es.x, es.y);
    if (es.type === EnemyType.KNIGHT) {
        enemy = new knightEnemy_1.KnightEnemy(level, game, es.x, es.y, random_1.Random.rand);
        enemy.ticks = es.ticks;
        enemy.seenPlayer = es.seenPlayer;
        if (es.seenPlayer) {
            enemy.targetPlayer = game.players[es.targetPlayerID];
            if (!enemy.targetPlayer)
                enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
        }
    }
    if (es.type === EnemyType.PLANT)
        enemy = new pottedPlant_1.PottedPlant(level, game, es.x, es.y, random_1.Random.rand);
    if (es.type === EnemyType.PLANT)
        enemy = new pot_1.Pot(level, game, es.x, es.y);
    if (es.type === EnemyType.SKULL) {
        enemy = new skullEnemy_1.SkullEnemy(level, game, es.x, es.y, random_1.Random.rand);
        enemy.ticks = es.ticks;
        enemy.ticksSinceFirstHit = es.ticksSinceFirstHit;
        enemy.seenPlayer = es.seenPlayer;
        if (es.seenPlayer) {
            enemy.targetPlayer = game.players[es.targetPlayerID];
            if (!enemy.targetPlayer)
                enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
        }
    }
    if (es.type === EnemyType.SLIME) {
        enemy = new slimeEnemy_1.SlimeEnemy(level, game, es.x, es.y, random_1.Random.rand);
        enemy.ticks = es.ticks;
        enemy.seenPlayer = es.seenPlayer;
        if (es.seenPlayer) {
            enemy.targetPlayer = game.players[es.targetPlayerID];
            if (!enemy.targetPlayer)
                enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
        }
    }
    if (es.type === EnemyType.SPAWNER) {
        enemy = new spawner_1.Spawner(level, game, es.x, es.y, random_1.Random.rand);
        enemy.ticks = es.ticks;
        enemy.seenPlayer = es.seenPlayer;
        enemy.enemySpawnType = es.enemySpawnType;
    }
    if (es.type === EnemyType.VENDINGMACHINE) {
        var item = loadItem(es.item, game);
        enemy = new vendingMachine_1.VendingMachine(level, game, es.x, es.y, item, random_1.Random.rand);
        if (es.isPlayerOpened) {
            enemy.playerOpened = game.players[es.playerOpenedID];
            if (!enemy.playerOpened)
                enemy.playerOpened = game.offlinePlayers[es.playerOpenedID];
        }
        enemy.open = es.open;
        enemy.costItems = [];
        for (var _b = 0, _c = es.costItems; _b < _c.length; _b++) {
            var item_1 = _c[_b];
            enemy.costItems.push(loadItem(item_1, game));
        }
        enemy.isInf = es.isInf;
        enemy.quantity = es.quantity;
    }
    if (es.type === EnemyType.WIZARD) {
        enemy = new wizardEnemy_1.WizardEnemy(level, game, es.x, es.y, random_1.Random.rand);
        enemy.ticks = es.ticks;
        enemy.state = es.wizardState;
        enemy.seenPlayer = es.seenPlayer;
    }
    if (es.type === EnemyType.ZOMBIE) {
        enemy = new zombieEnemy_1.ZombieEnemy(level, game, es.x, es.y, random_1.Random.rand);
        enemy.ticks = es.ticks;
        enemy.seenPlayer = es.seenPlayer;
        if (es.seenPlayer) {
            enemy.targetPlayer = game.players[es.targetPlayerID];
            if (!enemy.targetPlayer)
                enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
        }
    }
    enemy.x = es.x;
    enemy.y = es.y;
    enemy.health = es.health;
    enemy.direction = es.direction;
    enemy.dead = es.dead;
    enemy.skipNextTurns = es.skipNextTurns;
    if (es.hasDrop)
        enemy.drop = loadItem(es.drop, game);
    enemy.alertTicks = es.alertTicks;
    return enemy;
};
var LevelState = /** @class */ (function () {
    function LevelState(level, game) {
        this.levelID = game.rooms.indexOf(level);
        this.entered = level.entered;
        this.enemies = [];
        this.items = [];
        this.projectiles = [];
        this.hitwarnings = [];
        for (var _i = 0, _a = level.enemies; _i < _a.length; _i++) {
            var enemy = _a[_i];
            this.enemies.push(new EnemyState(enemy, game));
        }
        for (var _b = 0, _c = level.items; _b < _c.length; _b++) {
            var item = _c[_b];
            this.items.push(new ItemState(item, game));
        }
        for (var _d = 0, _e = level.projectiles; _d < _e.length; _d++) {
            var projectile = _e[_d];
            this.projectiles.push(new ProjectileState(projectile, game));
        }
        for (var _f = 0, _g = level.hitwarnings; _f < _g.length; _f++) {
            var hw = _g[_f];
            this.hitwarnings.push(new HitWarningState(hw));
        }
    }
    return LevelState;
}());
exports.LevelState = LevelState;
var loadLevel = function (level, levelState, game) {
    level.entered = levelState.entered;
    level.enemies = [];
    level.items = [];
    level.projectiles = [];
    level.hitwarnings = [];
    for (var _i = 0, _a = levelState.enemies; _i < _a.length; _i++) {
        var enemy = _a[_i];
        level.enemies.push(loadEnemy(enemy, game));
    }
    for (var _b = 0, _c = levelState.items; _b < _c.length; _b++) {
        var item = _c[_b];
        level.items.push(loadItem(item, game));
    }
    for (var _d = 0, _e = levelState.projectiles; _d < _e.length; _d++) {
        var projectile = _e[_d];
        level.projectiles.push(loadProjectile(projectile, game));
    }
    for (var _f = 0, _g = levelState.hitwarnings; _f < _g.length; _f++) {
        var hw = _g[_f];
        level.hitwarnings.push(loadHitWarning(hw, game));
    }
};
var ItemType;
(function (ItemType) {
    ItemType[ItemType["ARMOR"] = 0] = "ARMOR";
    ItemType[ItemType["BLUEGEM"] = 1] = "BLUEGEM";
    ItemType[ItemType["CANDLE"] = 2] = "CANDLE";
    ItemType[ItemType["COAL"] = 3] = "COAL";
    ItemType[ItemType["COIN"] = 4] = "COIN";
    ItemType[ItemType["GOLD"] = 5] = "GOLD";
    ItemType[ItemType["GOLDENKEY"] = 6] = "GOLDENKEY";
    ItemType[ItemType["GREENGEM"] = 7] = "GREENGEM";
    ItemType[ItemType["HEART"] = 8] = "HEART";
    ItemType[ItemType["KEY"] = 9] = "KEY";
    ItemType[ItemType["LANTERN"] = 10] = "LANTERN";
    ItemType[ItemType["REDGEM"] = 11] = "REDGEM";
    ItemType[ItemType["TORCH"] = 12] = "TORCH";
    ItemType[ItemType["DAGGER"] = 13] = "DAGGER";
    ItemType[ItemType["DUALDAGGER"] = 14] = "DUALDAGGER";
    ItemType[ItemType["SHOTGUN"] = 15] = "SHOTGUN";
    ItemType[ItemType["SPEAR"] = 16] = "SPEAR";
    ItemType[ItemType["PICKAXE"] = 17] = "PICKAXE";
    ItemType[ItemType["BACKPACK"] = 18] = "BACKPACK";
})(ItemType = exports.ItemType || (exports.ItemType = {}));
var ItemState = /** @class */ (function () {
    function ItemState(item, game) {
        if (item instanceof armor_1.Armor)
            this.type = ItemType.ARMOR;
        if (item instanceof bluegem_1.BlueGem)
            this.type = ItemType.BLUEGEM;
        if (item instanceof candle_1.Candle)
            this.type = ItemType.CANDLE;
        if (item instanceof coal_1.Coal)
            this.type = ItemType.COAL;
        if (item instanceof coin_1.Coin)
            this.type = ItemType.COIN;
        if (item instanceof gold_1.Gold)
            this.type = ItemType.GOLD;
        if (item instanceof goldenKey_1.GoldenKey)
            this.type = ItemType.GOLDENKEY;
        if (item instanceof greengem_1.GreenGem)
            this.type = ItemType.GREENGEM;
        if (item instanceof heart_1.Heart)
            this.type = ItemType.HEART;
        if (item instanceof key_1.Key)
            this.type = ItemType.KEY;
        if (item instanceof lantern_1.Lantern)
            this.type = ItemType.LANTERN;
        if (item instanceof redgem_1.RedGem)
            this.type = ItemType.REDGEM;
        if (item instanceof torch_1.Torch)
            this.type = ItemType.TORCH;
        if (item instanceof dagger_1.Dagger)
            this.type = ItemType.DAGGER;
        if (item instanceof dualdagger_1.DualDagger)
            this.type = ItemType.DUALDAGGER;
        if (item instanceof shotgun_1.Shotgun)
            this.type = ItemType.SHOTGUN;
        if (item instanceof spear_1.Spear)
            this.type = ItemType.SPEAR;
        if (item instanceof pickaxe_1.Pickaxe)
            this.type = ItemType.PICKAXE;
        if (item instanceof backpack_1.Backpack)
            this.type = ItemType.BACKPACK;
        this.equipped = item instanceof equippable_1.Equippable && item.equipped;
        this.x = item.x;
        this.y = item.y;
        this.levelID = game.rooms.indexOf(item.level);
        if (this.levelID === -1)
            this.levelID = 0;
        this.stackCount = item.stackCount;
        this.pickedUp = item.pickedUp;
    }
    return ItemState;
}());
exports.ItemState = ItemState;
var loadItem = function (i, game, player) {
    var level = game.rooms[i.levelID];
    var item;
    if (i.type === ItemType.ARMOR)
        item = new armor_1.Armor(level, i.x, i.y);
    if (i.type === ItemType.BLUEGEM)
        item = new bluegem_1.BlueGem(level, i.x, i.y);
    if (i.type === ItemType.CANDLE)
        item = new candle_1.Candle(level, i.x, i.y);
    if (i.type === ItemType.COAL)
        item = new coal_1.Coal(level, i.x, i.y);
    if (i.type === ItemType.COIN)
        item = new coin_1.Coin(level, i.x, i.y);
    if (i.type === ItemType.GOLD)
        item = new gold_1.Gold(level, i.x, i.y);
    if (i.type === ItemType.GOLDENKEY)
        item = new goldenKey_1.GoldenKey(level, i.x, i.y);
    if (i.type === ItemType.GREENGEM)
        item = new greengem_1.GreenGem(level, i.x, i.y);
    if (i.type === ItemType.HEART)
        item = new heart_1.Heart(level, i.x, i.y);
    if (i.type === ItemType.KEY)
        item = new key_1.Key(level, i.x, i.y);
    if (i.type === ItemType.LANTERN)
        item = new lantern_1.Lantern(level, i.x, i.y);
    if (i.type === ItemType.REDGEM)
        item = new redgem_1.RedGem(level, i.x, i.y);
    if (i.type === ItemType.TORCH)
        item = new torch_1.Torch(level, i.x, i.y);
    if (i.type === ItemType.DAGGER) {
        item = new dagger_1.Dagger(level, i.x, i.y);
    }
    if (i.type === ItemType.DUALDAGGER) {
        item = new dualdagger_1.DualDagger(level, i.x, i.y);
    }
    if (i.type === ItemType.SHOTGUN) {
        item = new shotgun_1.Shotgun(level, i.x, i.y);
    }
    if (i.type === ItemType.SPEAR) {
        item = new spear_1.Spear(level, i.x, i.y);
    }
    if (i.type === ItemType.PICKAXE) {
        item = new pickaxe_1.Pickaxe(level, i.x, i.y);
    }
    if (i.type === ItemType.BACKPACK) {
        item = new backpack_1.Backpack(level, i.x, i.y);
    }
    if (i.equipped)
        item.equipped = true;
    if (item instanceof equippable_1.Equippable)
        item.setWielder(player);
    item.stackCount = i.stackCount;
    item.pickedUp = i.pickedUp;
    return item;
};
var InventoryState = /** @class */ (function () {
    function InventoryState(inventory, game) {
        this.isOpen = inventory.isOpen;
        this.cols = inventory.cols;
        this.rows = inventory.rows;
        this.equipAnimAmount = inventory.equipAnimAmount.map(function (x) { return x; });
        this.isWeaponEquipped = false;
        if (inventory.weapon) {
            this.isWeaponEquipped = true;
            this.weaponI = inventory.items.indexOf(inventory.weapon);
        }
        this.coins = inventory.coins;
        this.selX = inventory.selX;
        this.selY = inventory.selY;
        this.items = Array();
        for (var _i = 0, _a = inventory.items; _i < _a.length; _i++) {
            var item = _a[_i];
            this.items.push(new ItemState(item, game));
        }
    }
    return InventoryState;
}());
exports.InventoryState = InventoryState;
var loadInventory = function (inventory, i, game) {
    inventory.clear();
    inventory.isOpen = i.isOpen;
    inventory.cols = i.cols;
    inventory.rows = i.rows;
    inventory.selX = i.selX;
    inventory.selY = i.selY;
    inventory.equipAnimAmount = i.equipAnimAmount.map(function (x) { return x; });
    inventory.coins = i.coins;
    for (var _i = 0, _a = i.items; _i < _a.length; _i++) {
        var item = _a[_i];
        inventory.items.push(loadItem(item, game, inventory.player));
    }
    if (i.isWeaponEquipped)
        inventory.weapon = inventory.items[i.weaponI];
};
var PlayerState = /** @class */ (function () {
    function PlayerState(player, game) {
        this.x = player.x;
        this.y = player.y;
        this.dead = player.dead;
        this.levelID = player.levelID;
        this.direction = player.direction;
        this.health = player.health;
        this.maxHealth = player.maxHealth;
        this.lastTickHealth = player.lastTickHealth;
        this.inventory = new InventoryState(player.inventory, game);
        this.hasOpenVendingMachine = false;
        if (player.openVendingMachine) {
            this.hasOpenVendingMachine = true;
            this.openVendingMachineLevelID = game.rooms.indexOf(player.openVendingMachine.level);
            this.openVendingMachineID = player.openVendingMachine.level.enemies.indexOf(player.openVendingMachine);
        }
        this.sightRadius = player.sightRadius;
    }
    return PlayerState;
}());
exports.PlayerState = PlayerState;
var loadPlayer = function (id, p, game) {
    var player = new player_1.Player(game, p.x, p.y, id === game.localPlayerID);
    player.dead = p.dead;
    player.levelID = p.levelID;
    if (player.levelID < game.levelgen.currentFloorFirstLevelID) { // catch up to the current level
        player.levelID = game.levelgen.currentFloorFirstLevelID;
        player.x = game.rooms[player.levelID].roomX + Math.floor(game.rooms[player.levelID].width / 2);
        player.y = game.rooms[player.levelID].roomY + Math.floor(game.rooms[player.levelID].height / 2);
    }
    player.direction = p.direction;
    player.health = p.health;
    player.maxHealth = p.maxHealth;
    player.lastTickHealth = p.lastTickHealth;
    loadInventory(player.inventory, p.inventory, game);
    if (p.hasOpenVendingMachine) {
        player.openVendingMachine = game.rooms[p.openVendingMachineLevelID].enemies[p.openVendingMachineID];
    }
    player.sightRadius = p.sightRadius;
    return player;
};
var GameState = /** @class */ (function () {
    function GameState() {
        this.seed = 0;
        this.randomState = 0;
        this.depth = 0;
        this.players = {};
        this.offlinePlayers = {};
        this.levels = [];
    }
    return GameState;
}());
exports.GameState = GameState;
var createGameState = function (game) {
    var gs = new GameState();
    gs.seed = game.levelgen.seed; // random state for generating levels
    gs.randomState = random_1.Random.state; // current random state
    gs.depth = game.levelgen.depthReached;
    for (var i in game.players)
        gs.players[i] = new PlayerState(game.players[i], game);
    for (var i in game.offlinePlayers) {
        gs.offlinePlayers[i] = new PlayerState(game.offlinePlayers[i], game);
    }
    for (var _i = 0, _a = game.rooms; _i < _a.length; _i++) {
        var level = _a[_i];
        level.catchUp();
        gs.levels.push(new LevelState(level, game));
    }
    return gs;
};
exports.createGameState = createGameState;
var loadGameState = function (game, activeUsernames, gameState) {
    game.rooms = Array();
    game.levelgen = new levelGenerator_1.LevelGenerator();
    game.levelgen.setSeed(gameState.seed);
    if (gameState.init_state)
        gameState.depth = 0;
    game.levelgen.generateFirstNFloors(game, gameState.depth);
    if (!gameState.init_state) {
        if (gameState.players) {
            for (var i in gameState.players) {
                if (activeUsernames.includes(i))
                    game.players[i] = loadPlayer(i, gameState.players[i], game);
                else
                    game.offlinePlayers[i] = loadPlayer(i, gameState.players[i], game);
            }
        }
        if (gameState.offlinePlayers) {
            for (var i in gameState.offlinePlayers) {
                if (i === game.localPlayerID)
                    game.players[i] = loadPlayer(i, gameState.offlinePlayers[i], game);
                else if (activeUsernames.includes(i))
                    game.players[i] = loadPlayer(i, gameState.offlinePlayers[i], game);
                else
                    game.offlinePlayers[i] = loadPlayer(i, gameState.offlinePlayers[i], game);
            }
        }
        for (var _i = 0, _a = gameState.levels; _i < _a.length; _i++) {
            var levelState = _a[_i];
            for (var i = 0; i < game.rooms.length; i++) {
                if (i === levelState.levelID) {
                    loadLevel(game.rooms[i], levelState, game);
                }
            }
        }
        if (!(game.localPlayerID in gameState.players) && !(game.localPlayerID in gameState.offlinePlayers)) { // we're not in the gamestate, create a new player
            game.players[game.localPlayerID] = new player_1.Player(game, 0, 0, true);
            game.players[game.localPlayerID].levelID = game.levelgen.currentFloorFirstLevelID;
            game.players[game.localPlayerID].x = game.rooms[game.levelgen.currentFloorFirstLevelID].roomX + Math.floor(game.rooms[game.levelgen.currentFloorFirstLevelID].width / 2);
            game.players[game.localPlayerID].y = game.rooms[game.levelgen.currentFloorFirstLevelID].roomY + Math.floor(game.rooms[game.levelgen.currentFloorFirstLevelID].height / 2);
            game.level = game.rooms[game.levelgen.currentFloorFirstLevelID];
            game.level.enterLevel(game.players[game.localPlayerID]);
        }
        else {
            game.level = game.rooms[game.players[game.localPlayerID].levelID];
        }
    }
    else { // stub game state, start a new world
        game.players[game.localPlayerID] = new player_1.Player(game, 0, 0, true);
        game.level = game.rooms[game.players[game.localPlayerID].levelID];
        game.level.enterLevel(game.players[game.localPlayerID]);
    }
    random_1.Random.setState(gameState.randomState);
    game.level.updateLighting();
    game.chat = [];
};
exports.loadGameState = loadGameState;


/***/ }),

/***/ "./src/healthbar.ts":
/*!**************************!*\
  !*** ./src/healthbar.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthBar = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var HealthBar = /** @class */ (function () {
    function HealthBar() {
        var _this = this;
        this.hurt = function () {
            _this.hurtTimer = Date.now();
        };
        this.draw = function (delta, hearts, maxHearts, x, y, flashing) {
            var t = Date.now() - _this.hurtTimer;
            if (t <= levelConstants_1.LevelConstants.HEALTH_BAR_TOTALTIME) {
                var fullHearts = Math.floor(hearts);
                var halfHearts = Math.ceil(hearts - fullHearts);
                var emptyHearts = maxHearts - fullHearts - halfHearts;
                // I wouldn't normally use magic numbers here, but these are hardcoded based on the tileset
                //   (which isn't really parameterizable)
                var drawWidth = Math.round(Math.min(9, Math.min(0.05 * (levelConstants_1.LevelConstants.HEALTH_BAR_TOTALTIME - t), 0.05 * t)));
                var drawHeight = Math.round(Math.min(0.5, Math.min(0.003 * (levelConstants_1.LevelConstants.HEALTH_BAR_TOTALTIME - t), 0.003 * t)) * 16) / 16.0;
                var width = (drawWidth * (maxHearts - 1) + 8) / 16.0;
                var xxStart = 0.5 + -width / 2;
                for (var i = 0; i < Math.ceil(0.5 * maxHearts); i++) {
                    var tileX = 0;
                    if (!flashing)
                        tileX = 1.5;
                    else if (i < fullHearts)
                        tileX = 0;
                    else if (i < fullHearts + halfHearts)
                        tileX = 0.5;
                    else
                        tileX = 1;
                    var xx = (drawWidth * i) / 16.0 + xxStart;
                    game_1.Game.drawFX(tileX, 8, 0.5, 0.5, x + xx, y - 1 - drawHeight / 2, 0.5, drawHeight);
                    xx += 9.0 / 16.0;
                    var j = maxHearts - i - 1;
                    if (j !== i) {
                        var tileX_1 = 0;
                        if (!flashing)
                            tileX_1 = 1.5;
                        else if (j < fullHearts)
                            tileX_1 = 0;
                        else if (j < fullHearts + halfHearts)
                            tileX_1 = 0.5;
                        else
                            tileX_1 = 1;
                        var xx_1 = (drawWidth * j) / 16.0 + xxStart;
                        game_1.Game.drawFX(tileX_1, 8, 0.5, 0.5, x + xx_1, y - 1 - drawHeight / 2, 0.5, drawHeight);
                        xx_1 += 9.0 / 16.0;
                    }
                }
            }
        };
        this.hurtTimer = 0;
    }
    return HealthBar;
}());
exports.HealthBar = HealthBar;


/***/ }),

/***/ "./src/hitWarning.ts":
/*!***************************!*\
  !*** ./src/hitWarning.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HitWarning = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var drawable_1 = __webpack_require__(/*! ./drawable */ "./src/drawable.ts");
var HitWarning = /** @class */ (function (_super) {
    __extends(HitWarning, _super);
    function HitWarning(game, x, y) {
        var _this = _super.call(this) || this;
        _this.tick = function () {
            _this.dead = true;
        };
        _this.draw = function (delta) {
            if ((_this.x === _this.game.players[_this.game.localPlayerID].x && Math.abs(_this.y - _this.game.players[_this.game.localPlayerID].y) <= 1) ||
                (_this.y === _this.game.players[_this.game.localPlayerID].y && Math.abs(_this.x - _this.game.players[_this.game.localPlayerID].x) <= 1))
                game_1.Game.drawFX(18 + Math.floor(HitWarning.frame), 6, 1, 1, _this.x, _this.y, 1, 1);
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            if ((_this.x === _this.game.players[_this.game.localPlayerID].x && Math.abs(_this.y - _this.game.players[_this.game.localPlayerID].y) <= 1) ||
                (_this.y === _this.game.players[_this.game.localPlayerID].y && Math.abs(_this.x - _this.game.players[_this.game.localPlayerID].x) <= 1))
                game_1.Game.drawFX(18 + Math.floor(HitWarning.frame), 5, 1, 1, _this.x, _this.y, 1, 1);
        };
        _this.x = x;
        _this.y = y;
        _this.dead = false;
        _this.game = game;
        return _this;
    }
    HitWarning.frame = 0;
    HitWarning.updateFrame = function (delta) {
        HitWarning.frame += 0.125 * delta;
        if (HitWarning.frame >= 4)
            HitWarning.frame = 0;
    };
    return HitWarning;
}(drawable_1.Drawable));
exports.HitWarning = HitWarning;


/***/ }),

/***/ "./src/input.ts":
/*!**********************!*\
  !*** ./src/input.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Input = exports.InputEnum = void 0;
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var InputEnum;
(function (InputEnum) {
    InputEnum[InputEnum["I"] = 0] = "I";
    InputEnum[InputEnum["M"] = 1] = "M";
    InputEnum[InputEnum["M_UP"] = 2] = "M_UP";
    InputEnum[InputEnum["Q"] = 3] = "Q";
    InputEnum[InputEnum["LEFT"] = 4] = "LEFT";
    InputEnum[InputEnum["RIGHT"] = 5] = "RIGHT";
    InputEnum[InputEnum["UP"] = 6] = "UP";
    InputEnum[InputEnum["DOWN"] = 7] = "DOWN";
    InputEnum[InputEnum["SPACE"] = 8] = "SPACE";
})(InputEnum = exports.InputEnum || (exports.InputEnum = {}));
exports.Input = {
    _pressed: {},
    isTapHold: false,
    tapStartTime: null,
    IS_TAP_HOLD_THRESH: 300,
    keyDownListener: function (key) { },
    iListener: function () { },
    mListener: function () { },
    mUpListener: function () { },
    qListener: function () { },
    leftListener: function () { },
    rightListener: function () { },
    upListener: function () { },
    downListener: function () { },
    aListener: function () { exports.Input.leftListener(); },
    dListener: function () { exports.Input.rightListener(); },
    wListener: function () { exports.Input.upListener(); },
    sListener: function () { exports.Input.downListener(); },
    spaceListener: function () { },
    leftSwipeListener: function () { },
    rightSwipeListener: function () { },
    upSwipeListener: function () { },
    downSwipeListener: function () { },
    tapListener: function () { },
    mouseLeftClickListeners: [],
    mouseLeftClickListener: function (x, y) {
        for (var i = 0; i < exports.Input.mouseLeftClickListeners.length; i++)
            exports.Input.mouseLeftClickListeners[i](x, y);
    },
    mouseX: 0,
    mouseY: 0,
    lastPressTime: 0,
    lastPressKeyCode: "",
    SPACE: "Space",
    LEFT: "ArrowLeft",
    UP: "ArrowUp",
    RIGHT: "ArrowRight",
    DOWN: "ArrowDown",
    W: "KeyW",
    A: "KeyA",
    S: "KeyS",
    D: "KeyD",
    M: "KeyM",
    N: "KeyN",
    I: "KeyI",
    Q: "KeyQ",
    isDown: function (keyCode) {
        return this._pressed[keyCode];
    },
    onKeydown: function (event) {
        if (event.key)
            exports.Input.keyDownListener(event.key);
        if (event.cancelable && event.key != "F12" && event.key != "F5")
            event.preventDefault();
        if (event.repeat)
            return; // ignore repeat keypresses
        exports.Input.lastPressTime = Date.now();
        exports.Input.lastPressKeyCode = event.code;
        exports.Input._pressed[event.code] = true;
        switch (event.code) {
            case exports.Input.LEFT:
                exports.Input.leftListener();
                break;
            case exports.Input.A:
                exports.Input.aListener();
                break;
            case exports.Input.RIGHT:
                exports.Input.rightListener();
                break;
            case exports.Input.D:
                exports.Input.dListener();
                break;
            case exports.Input.UP:
                exports.Input.upListener();
                break;
            case exports.Input.W:
                exports.Input.wListener();
                break;
            case exports.Input.DOWN:
                exports.Input.downListener();
                break;
            case exports.Input.S:
                exports.Input.sListener();
                break;
            case exports.Input.SPACE:
                exports.Input.spaceListener();
                break;
            case exports.Input.M:
                exports.Input.mListener();
                break;
            case exports.Input.I:
                exports.Input.iListener();
                break;
            case exports.Input.Q:
                exports.Input.qListener();
                break;
        }
    },
    onKeyup: function (event) {
        delete this._pressed[event.code];
        if (event.code === this.lastPressKeyCode) {
            this.lastPressTime = 0;
            this.lastPressKeyCode = 0;
        }
        if (event.code === exports.Input.M)
            exports.Input.mUpListener();
    },
    mouseClickListener: function (event) {
        if (event.button === 0) {
            var rect = window.document.getElementById("gameCanvas").getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            exports.Input.mouseLeftClickListener(Math.floor(x / game_1.Game.scale), Math.floor(y / game_1.Game.scale));
        }
    },
    updateMousePos: function (event) {
        var rect = window.document.getElementById("gameCanvas").getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        exports.Input.mouseX = Math.floor(x / game_1.Game.scale);
        exports.Input.mouseY = Math.floor(y / game_1.Game.scale);
    },
    getTouches: function (evt) {
        return (evt.touches || evt.originalEvent.touches // browser API
        ); // jQuery
    },
    xDown: null,
    yDown: null,
    currentX: 0,
    currentY: 0,
    swiped: false,
    handleTouchStart: function (evt) {
        evt.preventDefault();
        var firstTouch = exports.Input.getTouches(evt)[0];
        exports.Input.xDown = firstTouch.clientX;
        exports.Input.yDown = firstTouch.clientY;
        exports.Input.currentX = firstTouch.clientX;
        exports.Input.currentY = firstTouch.clientY;
        exports.Input.tapStartTime = Date.now();
        exports.Input.updateMousePos({
            clientX: exports.Input.currentX,
            clientY: exports.Input.currentY,
        });
        exports.Input.swiped = false;
    },
    handleTouchMove: function (evt) {
        evt.preventDefault();
        exports.Input.currentX = evt.touches[0].clientX;
        exports.Input.currentY = evt.touches[0].clientY;
        exports.Input.updateMousePos({
            clientX: exports.Input.currentX,
            clientY: exports.Input.currentY,
        });
        if (exports.Input.swiped)
            return;
        var xDiff = exports.Input.xDown - exports.Input.currentX;
        var yDiff = exports.Input.yDown - exports.Input.currentY;
        // we have not swiped yet
        // check if we've swiped
        if (Math.pow(xDiff, 2) + Math.pow(yDiff, 2) >= gameConstants_1.GameConstants.SWIPE_THRESH) {
            if (Math.abs(xDiff) > Math.abs(yDiff)) {
                /*most significant*/
                if (xDiff > 0) {
                    exports.Input.leftSwipeListener();
                }
                else {
                    exports.Input.rightSwipeListener();
                }
                exports.Input.swiped = true;
            }
            else {
                if (yDiff > 0) {
                    exports.Input.upSwipeListener();
                }
                else {
                    exports.Input.downSwipeListener();
                }
                exports.Input.swiped = true;
            }
        }
    },
    handleTouchEnd: function (evt) {
        evt.preventDefault();
        if (!exports.Input.isTapHold && !exports.Input.swiped)
            exports.Input.tapListener();
        exports.Input.isTapHold = false;
        exports.Input.tapStartTime = null;
        // we've already swiped, don't count the click
        if (exports.Input.swiped)
            return;
        exports.Input.mouseClickListener({
            button: 0,
            clientX: exports.Input.currentX,
            clientY: exports.Input.currentY,
        });
        exports.Input.updateMousePos({
            clientX: 0,
            clientY: 0,
        });
    },
    checkIsTapHold: function () {
        if (exports.Input.tapStartTime !== null && Date.now() >= exports.Input.tapStartTime + exports.Input.IS_TAP_HOLD_THRESH)
            exports.Input.isTapHold = true;
    },
};
window.addEventListener("keyup", function (event) {
    exports.Input.onKeyup(event);
}, false);
window.addEventListener("keydown", function (event) {
    exports.Input.onKeydown(event);
}, false);
window.document
    .getElementById("gameCanvas")
    .addEventListener("click", function (event) { return exports.Input.mouseClickListener(event); }, false);
window.document
    .getElementById("gameCanvas")
    .addEventListener("mousemove", function (event) { return exports.Input.updateMousePos(event); });


/***/ }),

/***/ "./src/inventory.ts":
/*!**************************!*\
  !*** ./src/inventory.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Inventory = void 0;
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var equippable_1 = __webpack_require__(/*! ./item/equippable */ "./src/item/equippable.ts");
var armor_1 = __webpack_require__(/*! ./item/armor */ "./src/item/armor.ts");
var coin_1 = __webpack_require__(/*! ./item/coin */ "./src/item/coin.ts");
var coal_1 = __webpack_require__(/*! ./item/coal */ "./src/item/coal.ts");
var weapon_1 = __webpack_require__(/*! ./weapon/weapon */ "./src/weapon/weapon.ts");
var dagger_1 = __webpack_require__(/*! ./weapon/dagger */ "./src/weapon/dagger.ts");
var usable_1 = __webpack_require__(/*! ./item/usable */ "./src/item/usable.ts");
var candle_1 = __webpack_require__(/*! ./item/candle */ "./src/item/candle.ts");
var lantern_1 = __webpack_require__(/*! ./item/lantern */ "./src/item/lantern.ts");
var backpack_1 = __webpack_require__(/*! ./item/backpack */ "./src/item/backpack.ts");
var heart_1 = __webpack_require__(/*! ./item/heart */ "./src/item/heart.ts");
var OPEN_TIME = 100; // milliseconds
var FILL_COLOR = "#5a595b";
var OUTLINE_COLOR = "#292c36";
var EQUIP_COLOR = "#85a8e6";
var FULL_OUTLINE = "white";
var Inventory = /** @class */ (function () {
    function Inventory(game, player) {
        var _this = this;
        this.rows = 2;
        this.cols = 5;
        this.selX = 0;
        this.selY = 0;
        this.expansion = 0;
        this.clear = function () {
            _this.items = [];
            for (var i = 0; i < (_this.rows + _this.expansion) * _this.cols; i++)
                _this.equipAnimAmount[i] = 0;
        };
        this.open = function () {
            _this.isOpen = !_this.isOpen;
            if (_this.isOpen)
                _this.openTime = Date.now();
        };
        this.close = function () {
            _this.isOpen = false;
        };
        this.left = function () {
            _this.selX--;
            if (_this.selX < 0)
                _this.selX = 0;
        };
        this.right = function () {
            _this.selX++;
            if (_this.selX > _this.cols - 1)
                _this.selX = _this.cols - 1;
        };
        this.up = function () {
            _this.selY--;
            if (_this.selY < 0)
                _this.selY = 0;
        };
        this.down = function () {
            _this.selY++;
            if (_this.selY > _this.rows + _this.expansion - 1)
                _this.selY = _this.rows + _this.expansion - 1;
        };
        this.space = function () {
            var i = _this.selX + _this.selY * _this.cols;
            if (_this.items[i] instanceof usable_1.Usable) {
                _this.items[i].onUse(_this.player);
                //this.items.splice(i, 0);
            }
            else if (_this.items[i] instanceof equippable_1.Equippable) {
                //dont equip on the same tick as using an item
                var e = _this.items[i];
                e.toggleEquip();
                if (e instanceof weapon_1.Weapon) {
                    if (e.equipped)
                        _this.weapon = e;
                    else
                        _this.weapon = null;
                }
                if (e.equipped) {
                    for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                        var i_1 = _a[_i];
                        if (i_1 instanceof equippable_1.Equippable && i_1 !== e && !e.coEquippable(i_1)) {
                            i_1.equipped = false; // prevent user from equipping two not coEquippable items
                        }
                    }
                }
            }
        };
        this.drop = function () {
            var i = _this.selX + _this.selY * _this.cols;
            if (i < _this.items.length) {
                if (_this.items[i] instanceof equippable_1.Equippable)
                    _this.items[i].equipped = false;
                _this.items[i].level = _this.game.rooms[_this.player.levelID];
                _this.items[i].x = _this.player.x;
                _this.items[i].y = _this.player.y;
                _this.items[i].pickedUp = false;
                _this.equipAnimAmount[i] = 0;
                _this.game.rooms[_this.player.levelID].items.push(_this.items[i]);
                _this.items.splice(i, 1);
            }
        };
        this.hasItem = function (itemType) {
            // itemType is class of Item we're looking for
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i instanceof itemType)
                    return i;
            }
            return null;
        };
        this.hasItemCount = function (item) {
            if (item instanceof coin_1.Coin)
                return _this.coinCount() >= item.stackCount;
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.constructor === item.constructor && i.stackCount >= item.stackCount)
                    return true;
            }
            return false;
        };
        this.subtractItemCount = function (item) {
            if (item instanceof coin_1.Coin) {
                _this.subtractCoins(item.stackCount);
                return;
            }
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.constructor === item.constructor) {
                    i.stackCount -= item.stackCount;
                    if (i.stackCount <= 0)
                        _this.items.splice(_this.items.indexOf(i), 1);
                }
            }
        };
        this.coinCount = function () {
            return _this.coins;
        };
        this.subtractCoins = function (n) {
            _this.coins -= n;
            if (_this.coins < 0)
                _this.coins = 0;
        };
        this.addCoins = function (n) {
            _this.coins += n;
        };
        this.isFull = function () {
            return _this.items.length >= (_this.rows + _this.expansion) * _this.cols;
        };
        this.addItem = function (item) {
            if (item instanceof coin_1.Coin) {
                _this.coins += item.stack;
                return true;
            }
            if (item instanceof equippable_1.Equippable) {
                item.setWielder(_this.player);
            }
            if (item.stackable) {
                for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                    var i = _a[_i];
                    if (i.constructor === item.constructor) {
                        // we already have an item of the same type
                        i.stackCount += item.stackCount;
                        return true;
                    }
                }
            }
            if (!_this.isFull()) {
                // item is either not stackable, or it's stackable but we don't have one yet
                _this.items.push(item);
                return true;
            }
            return false;
        };
        this.removeItem = function (item) {
            var i = _this.items.indexOf(item);
            if (i !== -1) {
                _this.items.splice(i, 1);
            }
        };
        this.getArmor = function () {
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i instanceof armor_1.Armor && i.equipped)
                    return i;
            }
            return null;
        };
        this.hasWeapon = function () {
            return _this.weapon !== null;
        };
        this.getWeapon = function () {
            return _this.weapon;
        };
        this.tick = function () {
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                i.tickInInventory();
            }
        };
        this.textWrap = function (text, x, y, maxWidth) {
            // returns y value for next line
            var words = text.split(" ");
            var line = "";
            while (words.length > 0) {
                if (game_1.Game.measureText(line + words[0]).width > maxWidth) {
                    game_1.Game.fillText(line, x, y);
                    line = "";
                    y += 8;
                }
                else {
                    if (line !== "")
                        line += " ";
                    line += words[0];
                    words.splice(0, 1);
                }
            }
            if (line !== " ") {
                game_1.Game.fillText(line, x, y);
                y += 8;
            }
            return y;
        };
        this.drawCoins = function (delta) {
            var coinX = levelConstants_1.LevelConstants.SCREEN_W - 1;
            var coinY = levelConstants_1.LevelConstants.SCREEN_H - 1;
            game_1.Game.drawItem(19, 0, 1, 2, coinX, coinY - 1, 1, 2);
            var countText = "" + _this.coins;
            var width = game_1.Game.measureText(countText).width;
            var countX = 4 - width;
            var countY = -1;
            game_1.Game.fillTextOutline(countText, coinX * gameConstants_1.GameConstants.TILESIZE + countX, coinY * gameConstants_1.GameConstants.TILESIZE + countY, gameConstants_1.GameConstants.OUTLINE, "white");
            var turnCountText = _this.player.turnCount.toString();
            game_1.Game.fillTextOutline(turnCountText, coinX * gameConstants_1.GameConstants.TILESIZE + countX, coinY * gameConstants_1.GameConstants.TILESIZE + countY - 15, gameConstants_1.GameConstants.OUTLINE, "white");
        };
        this.pointInside = function (x, y) {
            var s = Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME); // size of box
            var b = 2; // border
            var g = -2; // gap
            var hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
            var ob = 1; // outer border
            var width = _this.cols * (s + 2 * b + g) - g;
            var height = (_this.rows + _this.expansion) * (s + 2 * b + g) - g;
            return (x >= Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width) - ob &&
                x <=
                    Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width) -
                        ob +
                        Math.round(width + 2 * ob) &&
                y >= Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height) - ob &&
                y <=
                    Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height) -
                        ob +
                        Math.round(height + 2 * ob));
        };
        this.draw = function (delta) {
            _this.drawCoins(delta);
            if (_this.isOpen) {
                for (var i_2 = 0; i_2 < _this.equipAnimAmount.length; i_2++) {
                    if (_this.items[i_2] instanceof equippable_1.Equippable) {
                        if (_this.items[i_2].equipped) {
                            _this.equipAnimAmount[i_2] += 0.2 * (1 - _this.equipAnimAmount[i_2]);
                        }
                        else {
                            _this.equipAnimAmount[i_2] += 0.2 * (0 - _this.equipAnimAmount[i_2]);
                        }
                    }
                    else {
                        _this.equipAnimAmount[i_2] = 0;
                    }
                }
                game_1.Game.ctx.fillStyle = "rgb(0, 0, 0, 0.8)";
                game_1.Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
                game_1.Game.ctx.globalAlpha = 1;
                var s = Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME); // size of box
                var b = 2; // border
                var g = -2; // gap
                var hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
                var ob = 1; // outer border
                var width = _this.cols * (s + 2 * b + g) - g;
                var height = (_this.rows + _this.expansion) * (s + 2 * b + g) - g;
                game_1.Game.ctx.fillStyle = FULL_OUTLINE;
                game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width) - ob, Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height) - ob, Math.round(width + 2 * ob), Math.round(height + 2 * ob));
                game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + _this.selX * (s + 2 * b + g)) -
                    hg -
                    ob, Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                    0.5 * height +
                    _this.selY * (s + 2 * b + g)) -
                    hg -
                    ob, Math.round(s + 2 * b + 2 * hg) + 2 * ob, Math.round(s + 2 * b + 2 * hg) + 2 * ob);
                for (var x = 0; x < _this.cols; x++) {
                    for (var y = 0; y < _this.rows + _this.expansion; y++) {
                        game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                        game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + x * (s + 2 * b + g)), Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height + y * (s + 2 * b + g)), Math.round(s + 2 * b), Math.round(s + 2 * b));
                        game_1.Game.ctx.fillStyle = FILL_COLOR;
                        game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + x * (s + 2 * b + g) + b), Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height +
                            y * (s + 2 * b + g) +
                            b), Math.round(s), Math.round(s));
                        var i_3 = x + y * _this.cols;
                        game_1.Game.ctx.fillStyle = EQUIP_COLOR;
                        var yOff = s * (1 - _this.equipAnimAmount[i_3]);
                        game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + x * (s + 2 * b + g) + b), Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height +
                            y * (s + 2 * b + g) +
                            b +
                            yOff), Math.round(s), Math.round(s - yOff));
                    }
                }
                if (Date.now() - _this.openTime >= OPEN_TIME) {
                    for (var i_4 = 0; i_4 < _this.items.length; i_4++) {
                        var x = i_4 % _this.cols;
                        var y = Math.floor(i_4 / _this.cols);
                        var drawX_1 = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                            0.5 * width +
                            x * (s + 2 * b + g) +
                            b +
                            Math.floor(0.5 * s) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawY_1 = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height +
                            y * (s + 2 * b + g) +
                            b +
                            Math.floor(0.5 * s) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawXScaled_1 = drawX_1 / gameConstants_1.GameConstants.TILESIZE;
                        var drawYScaled_1 = drawY_1 / gameConstants_1.GameConstants.TILESIZE;
                        _this.items[i_4].drawIcon(delta, drawXScaled_1, drawYScaled_1);
                        //if (this.items[i] instanceof Equippable && (this.items[i] as Equippable).equipped) {
                        //  Game.drawItem(0, 4, 2, 2, x - 0.5, y - 0.5, 2, 2);
                        //}
                    }
                    game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                    game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                        0.5 * width +
                        _this.selX * (s + 2 * b + g)) - hg, Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                        0.5 * height +
                        _this.selY * (s + 2 * b + g)) - hg, Math.round(s + 2 * b + 2 * hg), Math.round(s + 2 * b + 2 * hg));
                    game_1.Game.ctx.fillStyle = FILL_COLOR;
                    game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                        0.5 * width +
                        _this.selX * (s + 2 * b + g) +
                        b -
                        hg), Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                        0.5 * height +
                        _this.selY * (s + 2 * b + g) +
                        b -
                        hg), Math.round(s + 2 * hg), Math.round(s + 2 * hg));
                    var i_5 = _this.selX + _this.selY * _this.cols;
                    game_1.Game.ctx.fillStyle = EQUIP_COLOR;
                    var yOff = (s + 2 * hg) * (1 - _this.equipAnimAmount[i_5]);
                    game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                        0.5 * width +
                        _this.selX * (s + 2 * b + g) +
                        b -
                        hg), Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                        0.5 * height +
                        _this.selY * (s + 2 * b + g) +
                        b -
                        hg +
                        yOff), Math.round(s + 2 * hg), Math.round(s + 2 * hg - yOff));
                    var drawX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                        0.5 * width +
                        _this.selX * (s + 2 * b + g) +
                        b +
                        Math.floor(0.5 * s) -
                        0.5 * gameConstants_1.GameConstants.TILESIZE);
                    var drawY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                        0.5 * height +
                        _this.selY * (s + 2 * b + g) +
                        b +
                        Math.floor(0.5 * s) -
                        0.5 * gameConstants_1.GameConstants.TILESIZE);
                    var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                    var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                    if (i_5 < _this.items.length)
                        _this.items[i_5].drawIcon(delta, drawXScaled, drawYScaled);
                }
                var i = _this.selX + _this.selY * _this.cols;
                if (i < _this.items.length) {
                    game_1.Game.ctx.fillStyle = "white";
                    var topPhrase = "";
                    if (_this.items[i] instanceof equippable_1.Equippable) {
                        var e = _this.items[i];
                        topPhrase = "[SPACE] to equip";
                        if (e.equipped)
                            topPhrase = "[SPACE] to unequip";
                    }
                    if (_this.items[i] instanceof usable_1.Usable) {
                        topPhrase = "[SPACE] to use";
                    }
                    game_1.Game.ctx.fillStyle = "white";
                    var w = game_1.Game.measureText(topPhrase).width;
                    game_1.Game.fillText(topPhrase, 0.5 * (gameConstants_1.GameConstants.WIDTH - w), 5);
                    var lines = _this.items[i].getDescription().split("\n");
                    var nextY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                        0.5 * height +
                        (_this.rows + _this.expansion) * (s + 2 * b + g) +
                        b +
                        5);
                    for (var j = 0; j < lines.length; j++) {
                        nextY = _this.textWrap(lines[j], 5, nextY, gameConstants_1.GameConstants.WIDTH - 10);
                    }
                }
            }
        };
        this.game = game;
        this.player = player;
        this.items = new Array();
        this.equipAnimAmount = [];
        for (var i = 0; i < this.rows * this.cols; i++) {
            this.equipAnimAmount[i] = 0;
        }
        //Input.mouseLeftClickListeners.push(this.mouseLeftClickListener);
        this.coins = 0;
        this.openTime = Date.now();
        this.weapon = null;
        this.expansion = 0;
        var a = function (i) {
            if (i instanceof equippable_1.Equippable) {
                i.setWielder(_this.player);
            }
            if (i instanceof weapon_1.Weapon) {
                i.toggleEquip();
                _this.weapon = i;
            }
            _this.addItem(i);
        };
        a(new dagger_1.Dagger({ game: this.game }, 0, 0));
        a(new coal_1.Coal({ game: this.game }, 0, 0));
        a(new coal_1.Coal({ game: this.game }, 0, 0));
        a(new coal_1.Coal({ game: this.game }, 0, 0));
        a(new coal_1.Coal({ game: this.game }, 0, 0));
        a(new coal_1.Coal({ game: this.game }, 0, 0));
        a(new lantern_1.Lantern({ game: this.game }, 0, 0));
        a(new candle_1.Candle({ game: this.game }, 0, 0));
        a(new backpack_1.Backpack({ game: this.game }, 0, 0));
        a(new heart_1.Heart({ game: this.game }, 0, 0));
        a(new armor_1.Armor({ game: this.game }, 0, 0));
    }
    return Inventory;
}());
exports.Inventory = Inventory;


/***/ }),

/***/ "./src/item/armor.ts":
/*!***************************!*\
  !*** ./src/item/armor.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Armor = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var levelConstants_1 = __webpack_require__(/*! ../levelConstants */ "./src/levelConstants.ts");
var equippable_1 = __webpack_require__(/*! ./equippable */ "./src/item/equippable.ts");
var Armor = /** @class */ (function (_super) {
    __extends(Armor, _super);
    function Armor(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.RECHARGE_TURNS = 15;
        _this.coEquippable = function (other) {
            if (other instanceof Armor)
                return false;
            return true;
        };
        _this.getDescription = function () {
            return ("ENCHANTED ARMOR\nA magic suit of armor. Absorbs one hit and regenerates after " +
                _this.RECHARGE_TURNS +
                " turns.");
        };
        _this.tickInInventory = function () {
            if (_this.rechargeTurnCounter > 0) {
                _this.rechargeTurnCounter--;
                if (_this.rechargeTurnCounter === 0) {
                    _this.rechargeTurnCounter = -1;
                    _this.health = 1;
                }
            }
        };
        _this.hurt = function (damage) {
            if (_this.health <= 0)
                return;
            _this.health -= damage;
            _this.rechargeTurnCounter = _this.RECHARGE_TURNS + 1;
        };
        _this.drawGUI = function (delta, playerHealth) {
            if (_this.rechargeTurnCounter === -1)
                game_1.Game.drawFX(5, 2, 1, 1, playerHealth, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
            else {
                var rechargeProportion = 1 - _this.rechargeTurnCounter / _this.RECHARGE_TURNS;
                if (rechargeProportion < 0.5)
                    game_1.Game.drawFX(7, 2, 1, 1, playerHealth, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
                else
                    game_1.Game.drawFX(8, 2, 1, 1, playerHealth, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
            }
        };
        _this.health = 1;
        _this.rechargeTurnCounter = -1;
        _this.tileX = 5;
        _this.tileY = 0;
        return _this;
    }
    return Armor;
}(equippable_1.Equippable));
exports.Armor = Armor;


/***/ }),

/***/ "./src/item/backpack.ts":
/*!******************************!*\
  !*** ./src/item/backpack.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Backpack = void 0;
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var usable_1 = __webpack_require__(/*! ./usable */ "./src/item/usable.ts");
var Backpack = /** @class */ (function (_super) {
    __extends(Backpack, _super);
    function Backpack(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onUse = function (player) {
            if (_this.level.game.rooms[player.levelID] === _this.level.game.level)
                sound_1.Sound.heal();
            player.inventory.expansion += 1;
            //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
        };
        _this.getDescription = function () {
            return "BACKPACK\nA normal looking backpack. Increases the amount you can carry. ";
        };
        _this.tileX = 4;
        _this.tileY = 0;
        _this.offsetY = 0;
        return _this;
    }
    return Backpack;
}(usable_1.Usable));
exports.Backpack = Backpack;


/***/ }),

/***/ "./src/item/bluegem.ts":
/*!*****************************!*\
  !*** ./src/item/bluegem.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BlueGem = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var BlueGem = /** @class */ (function (_super) {
    __extends(BlueGem, _super);
    function BlueGem(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "ZIRCON";
        };
        _this.tileX = 13;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return BlueGem;
}(item_1.Item));
exports.BlueGem = BlueGem;


/***/ }),

/***/ "./src/item/candle.ts":
/*!****************************!*\
  !*** ./src/item/candle.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Candle = void 0;
var torch_1 = __webpack_require__(/*! ./torch */ "./src/item/torch.ts");
var lantern_1 = __webpack_require__(/*! ./lantern */ "./src/item/lantern.ts");
var light_1 = __webpack_require__(/*! ./light */ "./src/item/light.ts");
var Candle = /** @class */ (function (_super) {
    __extends(Candle, _super);
    function Candle(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.tickInInventory = function () {
            if (_this.fuel <= 0) {
                _this.wielder.game.pushMessage("Your candle burns out.");
                _this.wielder.inventory.subtractItemCount(_this);
            }
            if (_this.ignite()) {
                _this.fuel -= 1;
                _this.wielder.sightRadius = Math.min(_this.fuel / 5 + 2, 4);
            }
            console.log("fuel:" + _this.fuel);
        };
        _this.coEquippable = function (other) {
            return !(other instanceof Candle ||
                other instanceof torch_1.Torch ||
                other instanceof lantern_1.Lantern);
        };
        _this.toggleEquip = function () {
            _this.equipped = !_this.equipped;
            if (_this.ignite()) {
                _this.wielder.sightRadius = Math.min(_this.fuel / 5 + 2, 4);
            }
            //if (!this.equipped) this.wielder.sightRadius = this.wielder.defaultSightRadius
        };
        _this.getDescription = function () {
            var percentage = (_this.fuel / 50) * 100;
            return "Candle: ".concat(percentage, "%");
        };
        _this.fuel = 100; //how many turns before it burns out
        _this.tileX = 27;
        _this.tileY = 0;
        return _this;
    }
    return Candle;
}(light_1.Light));
exports.Candle = Candle;


/***/ }),

/***/ "./src/item/coal.ts":
/*!**************************!*\
  !*** ./src/item/coal.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Coal = void 0;
var usable_1 = __webpack_require__(/*! ./usable */ "./src/item/usable.ts");
var lantern_1 = __webpack_require__(/*! ./lantern */ "./src/item/lantern.ts");
var Coal = /** @class */ (function (_super) {
    __extends(Coal, _super);
    function Coal(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onUse = function (player) {
            var l = player.inventory.hasItem(lantern_1.Lantern);
            if (l instanceof lantern_1.Lantern) {
                if (l.fuel <= l.fuelCap - 50) {
                    l.addFuel(50);
                    player.game.pushMessage("You add some fuel to your lantern.");
                    _this.stackCount -= 1;
                    if (_this.stackCount <= 0) {
                        player.inventory.removeItem(_this);
                    }
                }
            }
        };
        _this.getDescription = function () {
            return "COAL\nA lump of coal.";
        };
        _this.tileX = 17;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return Coal;
}(usable_1.Usable));
exports.Coal = Coal;


/***/ }),

/***/ "./src/item/coin.ts":
/*!**************************!*\
  !*** ./src/item/coin.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Coin = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var Coin = /** @class */ (function (_super) {
    __extends(Coin, _super);
    //checked: boolean;
    function Coin(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onDrop = function () {
            var coinList = []; //array to store coin objects
            for (var _i = 0, _a = _this.level.items; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item instanceof Coin)
                    coinList.push(item);
            }
            var _loop_1 = function (otherCoin) {
                if (_this !== otherCoin &&
                    _this.x === otherCoin.x &&
                    _this.y === otherCoin.y) {
                    _this.stack += otherCoin.stack;
                    _this.level.items = _this.level.items.filter(function (x) { return x !== otherCoin; });
                }
                if (_this.stack === 2)
                    _this.tileX = 20;
                else if (_this.stack >= 3)
                    _this.tileX = 21;
            };
            for (var _b = 0, coinList_1 = coinList; _b < coinList_1.length; _b++) {
                var otherCoin = coinList_1[_b];
                _loop_1(otherCoin);
            }
        };
        _this.draw = function (delta) {
            if (!_this.pickedUp) {
                _this.drawableY = _this.y;
                if (_this.scaleFactor < 1)
                    _this.scaleFactor += 0.04;
                else
                    _this.scaleFactor = 1;
                game_1.Game.drawItem(0, 0, 1, 1, _this.x, _this.y, 1, 1);
                _this.frame += (delta * (Math.PI * 2)) / 60;
                game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, _this.x + _this.w * (_this.scaleFactor * -0.5 + 0.5), _this.y +
                    Math.sin(_this.frame) * 0.07 -
                    1 +
                    _this.offsetY +
                    _this.h * (_this.scaleFactor * -0.5 + 0.5), _this.w * _this.scaleFactor, _this.h * _this.scaleFactor, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.pickupSound = function () {
            if (_this.level === _this.level.game.level)
                sound_1.Sound.pickupCoin();
        };
        _this.tileX = 19;
        _this.tileY = 0;
        _this.stack = 1;
        _this.stackable = true;
        return _this;
    }
    return Coin;
}(item_1.Item));
exports.Coin = Coin;


/***/ }),

/***/ "./src/item/equippable.ts":
/*!********************************!*\
  !*** ./src/item/equippable.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Equippable = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var Equippable = /** @class */ (function (_super) {
    __extends(Equippable, _super);
    function Equippable(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.setWielder = function (wielder) {
            _this.wielder = wielder;
        };
        _this.coEquippable = function (other) {
            return true;
        };
        _this.toggleEquip = function () {
            _this.equipped = !_this.equipped;
        };
        _this.drawEquipped = function (delta, x, y) {
            game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, x, y - 1, _this.w, _this.h);
        };
        _this.equipped = false;
        return _this;
    }
    return Equippable;
}(item_1.Item));
exports.Equippable = Equippable;


/***/ }),

/***/ "./src/item/gold.ts":
/*!**************************!*\
  !*** ./src/item/gold.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Gold = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var Gold = /** @class */ (function (_super) {
    __extends(Gold, _super);
    function Gold(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "GOLD\nA nugget of gold.";
        };
        _this.tileX = 18;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return Gold;
}(item_1.Item));
exports.Gold = Gold;


/***/ }),

/***/ "./src/item/goldenKey.ts":
/*!*******************************!*\
  !*** ./src/item/goldenKey.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GoldenKey = void 0;
var equippable_1 = __webpack_require__(/*! ./equippable */ "./src/item/equippable.ts");
var GoldenKey = /** @class */ (function (_super) {
    __extends(GoldenKey, _super);
    function GoldenKey(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "GOLD KEY\nA heavy gold key.";
        };
        _this.tileX = 6;
        _this.tileY = 0;
        return _this;
    }
    return GoldenKey;
}(equippable_1.Equippable));
exports.GoldenKey = GoldenKey;


/***/ }),

/***/ "./src/item/greengem.ts":
/*!******************************!*\
  !*** ./src/item/greengem.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GreenGem = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var GreenGem = /** @class */ (function (_super) {
    __extends(GreenGem, _super);
    function GreenGem(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "PERIDOT";
        };
        _this.tileX = 11;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return GreenGem;
}(item_1.Item));
exports.GreenGem = GreenGem;


/***/ }),

/***/ "./src/item/heart.ts":
/*!***************************!*\
  !*** ./src/item/heart.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Heart = void 0;
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var usable_1 = __webpack_require__(/*! ./usable */ "./src/item/usable.ts");
var Heart = /** @class */ (function (_super) {
    __extends(Heart, _super);
    function Heart(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onUse = function (player) {
            player.health = Math.min(player.maxHealth, player.health + 1);
            if (_this.level.game.rooms[player.levelID] === _this.level.game.level)
                sound_1.Sound.heal();
            player.inventory.removeItem(_this);
            //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
        };
        _this.getDescription = function () {
            return "HEALTH POTION\nRestores 1 heart";
        };
        _this.tileX = 8;
        _this.tileY = 0;
        _this.offsetY = 0;
        return _this;
    }
    return Heart;
}(usable_1.Usable));
exports.Heart = Heart;


/***/ }),

/***/ "./src/item/item.ts":
/*!**************************!*\
  !*** ./src/item/item.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Item = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var drawable_1 = __webpack_require__(/*! ../drawable */ "./src/drawable.ts");
// Item class extends Drawable class and represents an item in the game
var Item = /** @class */ (function (_super) {
    __extends(Item, _super);
    // Constructor for the Item class
    function Item(level, x, y) {
        var _this = _super.call(this) || this;
        // Empty tick function to be overridden by subclasses
        _this.tick = function () { };
        // Empty tick function for inventory behavior to be overridden by subclasses
        _this.tickInInventory = function () { };
        // Function to get description of the item, to be overridden by subclasses
        _this.getDescription = function () {
            return "";
        };
        // Function to play sound when item is picked up
        _this.pickupSound = function () {
            if (_this.level === _this.level.game.level)
                sound_1.Sound.genericPickup();
        };
        // Empty function to be called when item is dropped, to be overridden by subclasses
        _this.onDrop = function () { };
        // Function to be called when item is picked up
        _this.onPickup = function (player) {
            if (!_this.pickedUp) {
                _this.pickedUp = player.inventory.addItem(_this);
                if (_this.pickedUp)
                    _this.pickupSound();
            }
        };
        // Function to get the amount of shade at the item's location
        _this.shadeAmount = function () {
            return _this.level.softVis[_this.x][_this.y];
        };
        // Function to draw the item
        _this.draw = function (delta) {
            if (!_this.pickedUp) {
                _this.drawableY = _this.y;
                if (_this.scaleFactor < 1)
                    _this.scaleFactor += 0.04;
                else
                    _this.scaleFactor = 1;
                game_1.Game.drawItem(0, 0, 1, 1, _this.x, _this.y, 1, 1);
                _this.frame += (delta * (Math.PI * 2)) / 60;
                game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, _this.x + _this.w * (_this.scaleFactor * -0.5 + 0.5), _this.y +
                    Math.sin(_this.frame) * 0.07 -
                    1 +
                    _this.offsetY +
                    _this.h * (_this.scaleFactor * -0.5 + 0.5), _this.w * _this.scaleFactor, _this.h * _this.scaleFactor, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        // Function to draw the top layer of the item
        _this.drawTopLayer = function (delta) {
            if (_this.pickedUp) {
                _this.y -= 0.125;
                _this.alpha -= 0.03;
                if (_this.y < -1)
                    _this.level.items = _this.level.items.filter(function (x) { return x !== _this; }); // removes itself from the level
                if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                    game_1.Game.ctx.globalAlpha = Math.max(0, _this.alpha);
                game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, _this.x, _this.y - 1, _this.w, _this.h);
                game_1.Game.ctx.globalAlpha = 1.0;
            }
        };
        // Function to draw the item's icon
        _this.drawIcon = function (delta, x, y, opacity) {
            if (opacity === void 0) { opacity = 1; }
            if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                game_1.Game.ctx.globalAlpha = opacity;
            game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, x, y - 1, _this.w, _this.h);
            game_1.Game.ctx.globalAlpha = 1;
            var countText = _this.stackCount <= 1 ? "" : "" + _this.stackCount;
            var width = game_1.Game.measureText(countText).width;
            var countX = 16 - width;
            var countY = 10;
            game_1.Game.fillTextOutline(countText, x * gameConstants_1.GameConstants.TILESIZE + countX, y * gameConstants_1.GameConstants.TILESIZE + countY, gameConstants_1.GameConstants.OUTLINE, "white");
        };
        // Initialize properties
        _this.level = level;
        _this.x = x;
        _this.y = y;
        _this.drawableY = y;
        _this.w = 1;
        _this.h = 2;
        _this.tileX = 0;
        _this.tileY = 0;
        _this.frame = 0;
        _this.stackable = false;
        _this.stackCount = 1;
        _this.pickedUp = false;
        _this.alpha = 1;
        _this.scaleFactor = 0.2;
        _this.offsetY = -0.25;
        return _this;
    }
    return Item;
}(drawable_1.Drawable));
exports.Item = Item;


/***/ }),

/***/ "./src/item/key.ts":
/*!*************************!*\
  !*** ./src/item/key.ts ***!
  \*************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Key = void 0;
var equippable_1 = __webpack_require__(/*! ./equippable */ "./src/item/equippable.ts");
var Key = /** @class */ (function (_super) {
    __extends(Key, _super);
    function Key(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "KEY\nAn iron key.";
        };
        _this.tileX = 1;
        _this.tileY = 0;
        return _this;
    }
    return Key;
}(equippable_1.Equippable));
exports.Key = Key;


/***/ }),

/***/ "./src/item/lantern.ts":
/*!*****************************!*\
  !*** ./src/item/lantern.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Lantern = void 0;
var candle_1 = __webpack_require__(/*! ./candle */ "./src/item/candle.ts");
var torch_1 = __webpack_require__(/*! ./torch */ "./src/item/torch.ts");
var light_1 = __webpack_require__(/*! ./light */ "./src/item/light.ts");
var Lantern = /** @class */ (function (_super) {
    __extends(Lantern, _super);
    function Lantern(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.addFuel = function (amount) {
            _this.fuel += amount;
        };
        _this.coEquippable = function (other) {
            return !(other instanceof candle_1.Candle ||
                other instanceof torch_1.Torch ||
                other instanceof Lantern);
        };
        _this.tickInInventory = function () {
            if (_this.fuel === 0 && _this.equipped) {
                _this.equipped = false;
                _this.wielder.game.pushMessage("Your lantern runs out of fuel.");
            }
            if (_this.ignite()) {
                _this.fuel -= 1;
                _this.wielder.sightRadius = Math.min(_this.fuel / 4 + 3, 7);
                console.log("sight radius:" + _this.wielder.sightRadius);
            }
            console.log("fuel:" + _this.fuel);
        };
        _this.toggleEquip = function () {
            if (_this.fuel > 0) {
                _this.equipped = !_this.equipped;
                if (_this.ignite()) {
                    _this.wielder.sightRadius = Math.min(_this.fuel / 4 + 3, 7);
                } //else this.wielder.sightRadius = 3;
            }
            else
                _this.wielder.game.pushMessage("I'll need some fuel before I can use this");
            //Math.max(this.wielder.defaultSightRadius, this.fuel / 25)}
        };
        _this.getDescription = function () {
            var percentage = Math.round((_this.fuel / _this.fuelCap) * 100);
            return "LANTERN - Fuel: ".concat(percentage, "%, Capacity: ").concat(_this.fuelCap / 50);
        };
        _this.fuel = 0;
        _this.tileX = 29;
        _this.tileY = 0;
        _this.fuelCap = 250;
        return _this;
    }
    return Lantern;
}(light_1.Light));
exports.Lantern = Lantern;


/***/ }),

/***/ "./src/item/light.ts":
/*!***************************!*\
  !*** ./src/item/light.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Light = void 0;
var equippable_1 = __webpack_require__(/*! ./equippable */ "./src/item/equippable.ts");
var Light = /** @class */ (function (_super) {
    __extends(Light, _super);
    function Light(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.ignite = function () {
            if (_this.fuel > 0 && _this.equipped) {
                return true;
            }
            else
                return false;
        };
        _this.toggleEquip = function () {
            _this.equipped = !_this.equipped;
            if (_this.equipped) {
                _this.wielder.sightRadius = 12;
            }
            else
                _this.wielder.sightRadius = _this.wielder.defaultSightRadius;
        };
        _this.getDescription = function () {
            return "TORCH";
        };
        _this.tileX = 28;
        _this.tileY = 0;
        _this.fuel = 0;
        _this.fuelCap = 250;
        return _this;
    }
    return Light;
}(equippable_1.Equippable));
exports.Light = Light;


/***/ }),

/***/ "./src/item/redgem.ts":
/*!****************************!*\
  !*** ./src/item/redgem.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedGem = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var RedGem = /** @class */ (function (_super) {
    __extends(RedGem, _super);
    function RedGem(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "GARNET";
        };
        _this.tileX = 12;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return RedGem;
}(item_1.Item));
exports.RedGem = RedGem;


/***/ }),

/***/ "./src/item/shrooms.ts":
/*!*****************************!*\
  !*** ./src/item/shrooms.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Shrooms = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var Shrooms = /** @class */ (function (_super) {
    __extends(Shrooms, _super);
    function Shrooms(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "SHROOMS\nI don't think I should eat these...";
        };
        _this.tileX = 6;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return Shrooms;
}(item_1.Item));
exports.Shrooms = Shrooms;


/***/ }),

/***/ "./src/item/stone.ts":
/*!***************************!*\
  !*** ./src/item/stone.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Stone = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var Stone = /** @class */ (function (_super) {
    __extends(Stone, _super);
    function Stone(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "STONE\nSome fragments of stone.";
        };
        _this.tileX = 15;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return Stone;
}(item_1.Item));
exports.Stone = Stone;


/***/ }),

/***/ "./src/item/torch.ts":
/*!***************************!*\
  !*** ./src/item/torch.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Torch = void 0;
var candle_1 = __webpack_require__(/*! ./candle */ "./src/item/candle.ts");
var lantern_1 = __webpack_require__(/*! ./lantern */ "./src/item/lantern.ts");
var light_1 = __webpack_require__(/*! ./light */ "./src/item/light.ts");
var Torch = /** @class */ (function (_super) {
    __extends(Torch, _super);
    function Torch(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.toggleEquip = function () {
            _this.equipped = !_this.equipped;
            if (_this.equipped) {
                _this.wielder.sightRadius = 12;
            }
            else
                _this.wielder.sightRadius = _this.wielder.defaultSightRadius;
        };
        _this.coEquippable = function (other) {
            return !(other instanceof candle_1.Candle ||
                other instanceof Torch ||
                other instanceof lantern_1.Lantern);
        };
        _this.getDescription = function () {
            return "TORCH";
        };
        _this.tileX = 28;
        _this.tileY = 0;
        return _this;
    }
    return Torch;
}(light_1.Light));
exports.Torch = Torch;


/***/ }),

/***/ "./src/item/usable.ts":
/*!****************************!*\
  !*** ./src/item/usable.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Usable = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var Usable = /** @class */ (function (_super) {
    __extends(Usable, _super);
    function Usable(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onUse = function (player) { };
        return _this;
    }
    return Usable;
}(item_1.Item));
exports.Usable = Usable;


/***/ }),

/***/ "./src/levelConstants.ts":
/*!*******************************!*\
  !*** ./src/levelConstants.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LevelConstants = void 0;
var LevelConstants = /** @class */ (function () {
    function LevelConstants() {
    }
    LevelConstants.SCREEN_W = 1;
    LevelConstants.SCREEN_H = 1;
    LevelConstants.COMPUTER_TURN_DELAY = 300; // milliseconds
    LevelConstants.TURN_TIME = 1000; // milliseconds
    LevelConstants.LEVEL_TRANSITION_TIME = 300; // milliseconds
    LevelConstants.LEVEL_TRANSITION_TIME_LADDER = 1000; // milliseconds
    LevelConstants.ROOM_COUNT = 15;
    LevelConstants.HEALTH_BAR_FADEIN = 100;
    LevelConstants.HEALTH_BAR_FADEOUT = 100;
    LevelConstants.HEALTH_BAR_TOTALTIME = 2500;
    LevelConstants.SHADED_TILE_CUTOFF = 1;
    LevelConstants.SMOOTH_LIGHTING = false; //doesn't work
    LevelConstants.MIN_VISIBILITY = 2.0; // visibility level of places you've already seen
    LevelConstants.LIGHTING_ANGLE_STEP = 5; // how many degrees between each ray
    LevelConstants.LEVEL_TEXT_COLOR = "yellow";
    return LevelConstants;
}());
exports.LevelConstants = LevelConstants;


/***/ }),

/***/ "./src/levelGenerator.ts":
/*!*******************************!*\
  !*** ./src/levelGenerator.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LevelGenerator = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var room_1 = __webpack_require__(/*! ./room */ "./src/room.ts");
var random_1 = __webpack_require__(/*! ./random */ "./src/random.ts");
var downLadder_1 = __webpack_require__(/*! ./tile/downLadder */ "./src/tile/downLadder.ts");
//Goal: CRACK THE LEVEL GENERATOR
var PartitionConnection = /** @class */ (function () {
    function PartitionConnection(x, y, other) {
        this.x = x;
        this.y = y;
        this.other = other;
    }
    return PartitionConnection;
}());
var Partition = /** @class */ (function () {
    function Partition(x, y, w, h) {
        var _this = this;
        this.split = function () {
            var rand_mid = function () {
                var center = 0.5;
                var width = 0.6;
                return (random_1.Random.rand() - 0.5) * width + center;
            };
            var MIN_SIZE = 3;
            if (_this.w > _this.h) {
                //if the partitions width is greater than its height
                var w1 = Math.floor(rand_mid() * _this.w);
                //choose a random tile within the width of the tiles
                var w2 = _this.w - w1 - 1;
                //The remaining border - 1
                if (w1 < MIN_SIZE || w2 < MIN_SIZE)
                    return [_this];
                //if either of these are less than the min size: return an array with this Partition
                return [
                    new Partition(_this.x, _this.y, w1, _this.h),
                    new Partition(_this.x + w1 + 1, _this.y, w2, _this.h),
                ];
                //return an array with two new partitions
            }
            else {
                var h1 = Math.floor(rand_mid() * _this.h);
                var h2 = _this.h - h1 - 1;
                if (h1 < MIN_SIZE || h2 < MIN_SIZE)
                    return [_this];
                return [
                    new Partition(_this.x, _this.y, _this.w, h1),
                    new Partition(_this.x, _this.y + h1 + 1, _this.w, h2),
                ];
                //identical code for case where height > width
            }
        };
        this.point_in = function (x, y) {
            //given the input argument x,y coordinates output boolean
            return (x >= _this.x && x < _this.x + _this.w && y >= _this.y && y < _this.y + _this.h);
            //only return true if both input x and input y are within the partitions x and y
        };
        this.point_next_to = function (x, y) {
            return ((x >= _this.x - 1 &&
                x < _this.x + _this.w + 1 &&
                y >= _this.y &&
                y < _this.y + _this.h) ||
                (x >= _this.x &&
                    x < _this.x + _this.w &&
                    y >= _this.y - 1 &&
                    y < _this.y + _this.h + 1));
            //return true if the input x and y are next to any point of the partition
        };
        this.area = function () {
            return _this.w * _this.h;
            //return the damn area
        };
        this.overlaps = function (other) {
            return (other.x < _this.x + _this.w + 1 &&
                other.x + other.w > _this.x - 1 &&
                other.y < _this.y + _this.h + 1 &&
                other.y + other.h > _this.y - 1);
            //takes another partition instance as argument
            //returns true if any points of each overlap
        };
        this.get_branch_point = function () {
            var points = [];
            for (var x = _this.x; x < _this.x + _this.w; x++) {
                //count up from the partitions x to it's width
                points.push({ x: x, y: _this.y - 1 /*one row above partition*/ });
                points.push({ x: x, y: _this.y + _this.h /*one row below partition*/ });
            } // pushes the points above and below the partition
            for (var y = _this.y; y < _this.y + _this.h; y++) {
                points.push({ x: _this.x - 1, y: y });
                points.push({ x: _this.x + _this.w, y: y });
            } //pushes points to left an right of the partition
            points = points.filter(function (p) {
                return !_this.connections.some(function (c) { return Math.abs(c.x - p.x) + Math.abs(c.y - p.y) <= 1; });
            }
            //if the sum of the distance between the input x and y values and the partitions x and y values is > 1
            //delete those from the points array
            );
            points.sort(function () { return 0.5 - random_1.Random.rand(); });
            return points[0]; //return first or last object of x y points in array points
        };
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.type = room_1.RoomType.DUNGEON;
        this.connections = [];
        this.distance = 1000;
    }
    return Partition;
}()); //end of Partition class
var split_partitions = function (partitions, prob) {
    var _loop_1 = function (partition) {
        if (random_1.Random.rand() < prob) {
            partitions = partitions.filter(function (p) { return p !== partition; }); // remove partition
            partitions = partitions.concat(partition.split()); // add splits
        }
    };
    for (var _i = 0, partitions_1 = partitions; _i < partitions_1.length; _i++) {
        var partition = partitions_1[_i];
        _loop_1(partition);
    }
    return partitions;
    //takes input partitions array, randomly removes partitions and adds splits, output modified partitions array
};
var remove_wall_rooms = function (partitions, w, h) {
    var _loop_2 = function (partition) {
        if (partition.x === 0 ||
            partition.y === 0 ||
            partition.x + partition.w === w ||
            partition.y + partition.h === h
        //delete any partition where the x or y is zero
        ) {
            partitions = partitions.filter(function (p) { return p != partition; });
        }
    };
    for (var _i = 0, partitions_2 = partitions; _i < partitions_2.length; _i++) {
        var partition = partitions_2[_i];
        _loop_2(partition);
    }
    return partitions;
    //return partitions array with no wall rooms
};
var populate_grid = function (partitions, grid, w, h) {
    for (var x = 0; x < w; x++) { //loop through the horizontal tiles
        grid[x] = []; //empty array at x index
        for (var y = 0; y < h; y++) {
            grid[x][y] = false;
            for (var _i = 0, partitions_3 = partitions; _i < partitions_3.length; _i++) {
                var partition = partitions_3[_i];
                if (partition.point_in(x, y))
                    grid[x][y] = partition;
            }
        }
    }
    return grid;
    //input grid array, partitions array and width and height
    //output grid array that indicates which cells are in which partition
};
var generate_dungeon_candidate = function (map_w, map_h) {
    var partitions = [new Partition(0, 0, map_w, map_h)];
    var grid = [];
    //add a new partition and define grid as empty array
    for (var i = 0; i < 3; i++)
        partitions = split_partitions(partitions, 0.75);
    for (var i = 0; i < 3; i++)
        partitions = split_partitions(partitions, 1);
    for (var i = 0; i < 3; i++)
        partitions = split_partitions(partitions, 0.5);
    //split partitions 3 times with different probabilities
    partitions = remove_wall_rooms(partitions, map_w, map_h);
    grid = populate_grid(partitions, grid, map_w, map_h);
    //remove wall rooms and populate dat grid
    partitions.sort(function (a, b) { return a.area() - b.area(); });
    //sort the partitions list by ... area? I think?
    var spawn = partitions[0];
    //spawn is the first Partition instance
    spawn.type = room_1.RoomType.START;
    //set the roomtype for the partition accordingly
    partitions[partitions.length - 1].type = room_1.RoomType.BOSS;
    //set the largest room as boss room?
    var connected = [spawn];
    var frontier = [spawn];
    var found_boss = false;
    // connect rooms until we find the boss
    while (frontier.length > 0 && !found_boss) {
        var room = frontier[0];
        frontier.splice(0, 1);
        var doors_found = 0;
        var num_doors = Math.floor(random_1.Random.rand() * 2 + 1);
        var tries = 0;
        var max_tries = 100;
        while (doors_found < num_doors && tries < max_tries) {
            var point = room.get_branch_point();
            for (var _i = 0, partitions_4 = partitions; _i < partitions_4.length; _i++) {
                var p = partitions_4[_i];
                if (p !== room &&
                    connected.indexOf(p) === -1 &&
                    p.point_next_to(point.x, point.y)) {
                    room.connections.push(new PartitionConnection(point.x, point.y, p));
                    p.connections.push(new PartitionConnection(point.x, point.y, room));
                    frontier.push(p);
                    connected.push(p);
                    doors_found++;
                    if (p.type === room_1.RoomType.BOSS)
                        found_boss = true;
                    break;
                }
            }
            tries++;
        }
    }
    var _loop_3 = function (partition) {
        if (partition.connections.length === 0)
            partitions = partitions.filter(function (p) { return p !== partition; });
    };
    // remove rooms we haven't connected to yet
    for (var _a = 0, partitions_5 = partitions; _a < partitions_5.length; _a++) {
        var partition = partitions_5[_a];
        _loop_3(partition);
    }
    grid = populate_grid(partitions, grid, map_w, map_h); // recalculate with removed rooms
    // make sure we haven't removed all the rooms
    if (partitions.length === 0) {
        return []; // for now just return an empty list so we can retry
    }
    // make some loops
    var num_loop_doors = Math.floor(random_1.Random.rand() * 4 + 4);
    var _loop_4 = function (i) {
        var roomIndex = Math.floor(random_1.Random.rand() * partitions.length);
        var room = partitions[roomIndex];
        var found_door = false;
        var tries = 0;
        var max_tries = 100;
        var not_already_connected = partitions.filter(function (p) { return !room.connections.some(function (c) { return c.other === p; }); });
        while (!found_door && tries < max_tries) {
            var point = room.get_branch_point();
            for (var _e = 0, not_already_connected_1 = not_already_connected; _e < not_already_connected_1.length; _e++) {
                var p = not_already_connected_1[_e];
                if (p !== room && p.point_next_to(point.x, point.y)) {
                    room.connections.push(new PartitionConnection(point.x, point.y, p));
                    p.connections.push(new PartitionConnection(point.x, point.y, room));
                    found_door = true;
                    break;
                }
            }
            tries++;
        }
    };
    for (var i = 0; i < num_loop_doors; i++) {
        _loop_4(i);
    }
    // add stair room
    if (!partitions.some(function (p) { return p.type === room_1.RoomType.BOSS; }))
        return [];
    var boss = partitions.find(function (p) { return p.type === room_1.RoomType.BOSS; });
    var found_stair = false;
    var max_stair_tries = 100;
    var _loop_5 = function (stair_tries) {
        var stair = new Partition(game_1.Game.rand(boss.x - 1, boss.x + boss.w - 2, random_1.Random.rand), boss.y - 4, 3, 3);
        stair.type = room_1.RoomType.DOWNLADDER;
        if (!partitions.some(function (p) { return p.overlaps(stair); })) {
            found_stair = true;
            partitions.push(stair);
            stair.connections.push(new PartitionConnection(stair.x + 1, stair.y + 3, boss));
            boss.connections.push(new PartitionConnection(stair.x + 1, stair.y + 3, stair));
            return "break";
        }
    };
    for (var stair_tries = 0; stair_tries < max_stair_tries; stair_tries++) {
        var state_1 = _loop_5(stair_tries);
        if (state_1 === "break")
            break;
    }
    if (!found_stair)
        return [];
    // calculate room distances
    frontier = [spawn];
    var seen = [];
    spawn.distance = 0;
    while (frontier.length > 0) {
        var room = frontier[0];
        frontier.splice(0, 1);
        seen.push(room);
        for (var _b = 0, _c = room.connections; _b < _c.length; _b++) {
            var c = _c[_b];
            var other = c.other;
            other.distance = Math.min(other.distance, room.distance + 1);
            if (seen.indexOf(other) === -1)
                frontier.push(other);
        }
    }
    // add special rooms
    var added_rope_hole = false;
    for (var _d = 0, partitions_6 = partitions; _d < partitions_6.length; _d++) {
        var p = partitions_6[_d];
        if (p.type === room_1.RoomType.DUNGEON) {
            if (p.distance > 4 && p.area() <= 30 && random_1.Random.rand() < 0.1) {
                p.type = room_1.RoomType.TREASURE;
            }
            else if (!added_rope_hole &&
                p.distance > 3 &&
                p.area() <= 20 &&
                random_1.Random.rand() < 0.5) {
                p.type = room_1.RoomType.ROPEHOLE;
                added_rope_hole = true;
            }
        }
    }
    return partitions;
};
var generate_dungeon = function (map_w, map_h) {
    var passes_checks = false;
    var partitions;
    var tries = 0;
    while (!passes_checks) {
        partitions = generate_dungeon_candidate(map_w, map_h);
        passes_checks = true;
        if (partitions.length < 6)
            passes_checks = false;
        if (!partitions.some(function (p) { return p.type === room_1.RoomType.BOSS; }))
            passes_checks = false;
        else if (partitions.find(function (p) { return p.type === room_1.RoomType.BOSS; }).distance < 3)
            passes_checks = false;
        tries++;
        if (tries > 100)
            break;
    }
    return partitions;
};
var generate_cave_candidate = function (map_w, map_h, num_rooms) {
    var partitions = [new Partition(0, 0, map_w, map_h)];
    var grid = [];
    for (var i = 0; i < 3; i++)
        partitions = split_partitions(partitions, 0.75);
    for (var i = 0; i < 3; i++)
        partitions = split_partitions(partitions, 1);
    for (var i = 0; i < 3; i++)
        partitions = split_partitions(partitions, 0.5);
    grid = populate_grid(partitions, grid, map_w, map_h);
    partitions.sort(function (a, b) { return a.area() - b.area(); });
    var spawn = partitions[0];
    spawn.type = room_1.RoomType.ROPECAVE;
    for (var i = 1; i < partitions.length; i++)
        partitions[i].type = room_1.RoomType.CAVE;
    var connected = [spawn];
    var frontier = [spawn];
    // connect rooms until we find the boss
    while (frontier.length > 0 && connected.length < num_rooms) {
        var room = frontier[0];
        frontier.splice(0, 1);
        var doors_found = 0;
        var num_doors = Math.floor(random_1.Random.rand() * 2 + 1);
        var tries = 0;
        var max_tries = 100;
        while (doors_found < num_doors &&
            tries < max_tries &&
            connected.length < num_rooms) {
            var point = room.get_branch_point();
            for (var _i = 0, partitions_7 = partitions; _i < partitions_7.length; _i++) {
                var p = partitions_7[_i];
                if (p !== room &&
                    connected.indexOf(p) === -1 &&
                    p.point_next_to(point.x, point.y)) {
                    room.connections.push(new PartitionConnection(point.x, point.y, p));
                    p.connections.push(new PartitionConnection(point.x, point.y, room));
                    frontier.push(p);
                    connected.push(p);
                    doors_found++;
                    break;
                }
            }
            tries++;
        }
    }
    var _loop_6 = function (partition) {
        if (partition.connections.length === 0)
            partitions = partitions.filter(function (p) { return p !== partition; });
    };
    // remove rooms we haven't connected to yet
    for (var _a = 0, partitions_8 = partitions; _a < partitions_8.length; _a++) {
        var partition = partitions_8[_a];
        _loop_6(partition);
    }
    grid = populate_grid(partitions, grid, map_w, map_h); // recalculate with removed rooms
    // make sure we haven't removed all the rooms
    if (partitions.length === 0) {
        return []; // for now just return an empty list so we can retry
    }
    // make some loops
    var num_loop_doors = Math.floor(random_1.Random.rand() * 4 + 4);
    var _loop_7 = function (i) {
        var roomIndex = Math.floor(random_1.Random.rand() * partitions.length);
        var room = partitions[roomIndex];
        var found_door = false;
        var tries = 0;
        var max_tries = 100;
        var not_already_connected = partitions.filter(function (p) { return !room.connections.some(function (c) { return c.other === p; }); });
        while (!found_door && tries < max_tries) {
            var point = room.get_branch_point();
            for (var _d = 0, not_already_connected_2 = not_already_connected; _d < not_already_connected_2.length; _d++) {
                var p = not_already_connected_2[_d];
                if (p !== room && p.point_next_to(point.x, point.y)) {
                    room.connections.push(new PartitionConnection(point.x, point.y, p));
                    p.connections.push(new PartitionConnection(point.x, point.y, room));
                    found_door = true;
                    break;
                }
            }
            tries++;
        }
    };
    for (var i = 0; i < num_loop_doors; i++) {
        _loop_7(i);
    }
    // calculate room distances
    frontier = [spawn];
    var seen = [];
    spawn.distance = 0;
    while (frontier.length > 0) {
        var room = frontier[0];
        frontier.splice(0, 1);
        seen.push(room);
        for (var _b = 0, _c = room.connections; _b < _c.length; _b++) {
            var c = _c[_b];
            var other = c.other;
            other.distance = Math.min(other.distance, room.distance + 1);
            if (seen.indexOf(other) === -1)
                frontier.push(other);
        }
    }
    return partitions;
};
var generate_cave = function (map_w, map_h) {
    var passes_checks = false;
    var partitions;
    while (!passes_checks) {
        var NUM_ROOMS = 100;
        partitions = generate_cave_candidate(map_w, map_h, NUM_ROOMS);
        passes_checks = true;
        if (partitions.length < NUM_ROOMS)
            passes_checks = false;
    }
    return partitions;
};
var LevelGenerator = /** @class */ (function () {
    function LevelGenerator() {
        var _this = this;
        this.depthReached = 0;
        this.currentFloorFirstLevelID = 0;
        this.getLevels = function (partitions, depth, mapGroup) {
            var levels = [];
            for (var i = 0; i < partitions.length; i++) {
                var level = new room_1.Room(_this.game, partitions[i].x - 1, partitions[i].y - 1, partitions[i].w + 2, partitions[i].h + 2, partitions[i].type, depth, mapGroup, random_1.Random.rand);
                levels.push(level);
            }
            var doors_added = [];
            for (var i = 0; i < partitions.length; i++) {
                var _loop_8 = function (connection) {
                    var d = levels[i].addDoor(connection.x, connection.y);
                    var existing_door = doors_added.find(function (e) { return e.x === d.x && e.y === d.y; });
                    if (existing_door) {
                        existing_door.link(d);
                        d.link(existing_door);
                    }
                    doors_added.push(d);
                };
                for (var _i = 0, _a = partitions[i].connections; _i < _a.length; _i++) {
                    var connection = _a[_i];
                    _loop_8(connection);
                }
            }
            for (var _b = 0, levels_1 = levels; _b < levels_1.length; _b++) {
                var level = levels_1[_b];
                level.populate(random_1.Random.rand);
            }
            return levels;
        };
        this.setSeed = function (seed) {
            _this.seed = seed;
        };
        this.generate = function (game, depth, cave) {
            if (cave === void 0) { cave = false; }
            console.assert(cave || _this.depthReached === 0 || depth === _this.depthReached + 1);
            _this.depthReached = depth;
            random_1.Random.setState(_this.seed + depth);
            _this.game = game;
            var mapGroup = 0;
            if (_this.game.rooms.length > 0)
                mapGroup = _this.game.rooms[_this.game.rooms.length - 1].mapGroup + 1;
            var partitions;
            if (cave)
                partitions = generate_cave(20, 20);
            else
                partitions = generate_dungeon(35, 35);
            var levels = _this.getLevels(partitions, depth, mapGroup);
            var numExistingLevels = _this.game.rooms.length;
            if (!cave)
                _this.currentFloorFirstLevelID = numExistingLevels;
            _this.game.rooms = _this.game.rooms.concat(levels);
            for (var i = numExistingLevels; i < numExistingLevels + levels.length; i++) {
                var found = false;
                if (_this.game.rooms[i].type === room_1.RoomType.ROPEHOLE) {
                    for (var x = _this.game.rooms[i].roomX; x < _this.game.rooms[i].roomX + _this.game.rooms[i].width; x++) {
                        for (var y = _this.game.rooms[i].roomY; y < _this.game.rooms[i].roomY + _this.game.rooms[i].height; y++) {
                            var tile = _this.game.rooms[i].roomArray[x][y];
                            if (tile instanceof downLadder_1.DownLadder && tile.isRope) {
                                tile.generate();
                                found = true;
                            }
                        }
                    }
                }
                if (found)
                    break;
            }
            if (cave)
                return levels.find(function (l) { return l.type === room_1.RoomType.ROPECAVE; });
            else
                return levels.find(function (l) { return l.type === room_1.RoomType.START; });
        };
        this.generateFirstNFloors = function (game, numFloors) {
            _this.generate(game, 0, false);
            for (var i = 0; i < numFloors; i++) {
                var found = false;
                for (var j = _this.game.rooms.length - 1; j >= 0; j--) {
                    if (_this.game.rooms[j].type === room_1.RoomType.DOWNLADDER) {
                        for (var x = _this.game.rooms[j].roomX; x < _this.game.rooms[j].roomX + _this.game.rooms[j].width; x++) {
                            for (var y = _this.game.rooms[j].roomY; y < _this.game.rooms[j].roomY + _this.game.rooms[j].height; y++) {
                                var tile = _this.game.rooms[j].roomArray[x][y];
                                if (tile instanceof downLadder_1.DownLadder) {
                                    tile.generate();
                                    found = true;
                                }
                            }
                        }
                    }
                    if (found)
                        break;
                }
            }
        };
    }
    return LevelGenerator;
}());
exports.LevelGenerator = LevelGenerator;


/***/ }),

/***/ "./src/lightSource.ts":
/*!****************************!*\
  !*** ./src/lightSource.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LightSource = void 0;
var LightSource = /** @class */ (function () {
    function LightSource(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
    }
    return LightSource;
}());
exports.LightSource = LightSource;


/***/ }),

/***/ "./src/map.ts":
/*!********************!*\
  !*** ./src/map.ts ***!
  \********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Map = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var room_1 = __webpack_require__(/*! ./room */ "./src/room.ts");
var enemy_1 = __webpack_require__(/*! ./enemy/enemy */ "./src/enemy/enemy.ts");
var Map = /** @class */ (function () {
    function Map(game) {
        var _this = this;
        this.draw = function (delta) {
            var s = 2;
            if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                game_1.Game.ctx.globalAlpha = .2;
            game_1.Game.ctx.fillStyle = "#006A6E";
            var x = game_1.Game.ctx.globalCompositeOperation;
            game_1.Game.ctx.globalCompositeOperation = "screen";
            game_1.Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
            game_1.Game.ctx.globalCompositeOperation = x;
            game_1.Game.ctx.translate(0.75 * gameConstants_1.GameConstants.WIDTH -
                _this.game.level.roomX -
                Math.floor(0.5 * _this.game.level.width) +
                20, 0.25 * gameConstants_1.GameConstants.HEIGHT -
                _this.game.level.roomY -
                Math.floor(0.5 * _this.game.level.height));
            game_1.Game.ctx.globalAlpha = 1;
            for (var _i = 0, _a = _this.game.rooms; _i < _a.length; _i++) {
                var level = _a[_i];
                if (_this.game.level.mapGroup === level.mapGroup && level.entered) {
                    game_1.Game.ctx.fillStyle = "#5A5A5A";
                    game_1.Game.ctx.fillRect(level.roomX * s + 0, level.roomY * s + 0, level.width * s - 0, level.height * s - 0);
                    if (level.type === room_1.RoomType.UPLADDER)
                        game_1.Game.ctx.fillStyle = "#101460";
                    if (level.type === room_1.RoomType.DOWNLADDER)
                        game_1.Game.ctx.fillStyle = "#601410";
                    game_1.Game.ctx.fillStyle = "black";
                    game_1.Game.ctx.fillRect(level.roomX * s + 1, level.roomY * s + 1, level.width * s - 2, level.height * s - 2);
                    for (var _b = 0, _c = level.walls; _b < _c.length; _b++) {
                        var wall = _c[_b];
                        game_1.Game.ctx.fillStyle = "#404040";
                        game_1.Game.ctx.fillRect(wall.x * s, wall.y * s, 1 * s, 1 * s);
                    }
                    for (var _d = 0, _e = level.doors; _d < _e.length; _d++) {
                        var door = _e[_d];
                        if (door.opened === false)
                            game_1.Game.ctx.fillStyle = "#5A5A5A";
                        if (door.opened === true)
                            (game_1.Game.ctx.fillStyle = "black"),
                                game_1.Game.ctx.fillRect(door.x * s, door.y * s, 1 * s, 1 * s);
                    }
                    for (var _f = 0, _g = level.enemies; _f < _g.length; _f++) {
                        var enemy = _g[_f];
                        if (enemy.entityType === enemy_1.EntityType.Enemy) {
                            game_1.Game.ctx.fillStyle = "yellow";
                        }
                        if (enemy.entityType === enemy_1.EntityType.Prop) {
                            game_1.Game.ctx.fillStyle = "#847e87";
                        }
                        if (enemy.entityType === enemy_1.EntityType.Resource) {
                            game_1.Game.ctx.fillStyle = "#5a595b";
                        }
                        if (enemy.entityType === enemy_1.EntityType.Friendly) {
                            game_1.Game.ctx.fillStyle = "cyan";
                        }
                        game_1.Game.ctx.fillRect(enemy.x * s, enemy.y * s, 1 * s, 1 * s);
                    }
                    for (var _h = 0, _j = level.items; _h < _j.length; _h++) {
                        var item = _j[_h];
                        var x_1 = item.x;
                        var y = item.y;
                        game_1.Game.ctx.fillStyle = "#ac3232";
                        if (!item.pickedUp) {
                            game_1.Game.ctx.fillRect(item.x * s, item.y * s, 1 * s, 1 * s);
                        }
                    }
                }
            }
            for (var i in _this.game.players) {
                game_1.Game.ctx.fillStyle = "white";
                if (_this.game.rooms[_this.game.players[i].levelID].mapGroup ===
                    _this.game.level.mapGroup) {
                    game_1.Game.ctx.fillRect(_this.game.players[i].x * s, _this.game.players[i].y * s, 1 * s, 1 * s);
                }
            }
            game_1.Game.ctx.setTransform(1, 0, 0, 1, 0, 0);
        };
        this.game = game;
    }
    return Map;
}());
exports.Map = Map;


/***/ }),

/***/ "./src/particle/deathParticle.ts":
/*!***************************************!*\
  !*** ./src/particle/deathParticle.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeathParticle = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var particle_1 = __webpack_require__(/*! ./particle */ "./src/particle/particle.ts");
var DeathParticle = /** @class */ (function (_super) {
    __extends(DeathParticle, _super);
    function DeathParticle(x, y) {
        var _this = _super.call(this) || this;
        _this.draw = function (delta) {
            if (_this.dead)
                return;
            var yOffset = Math.max(0, ((_this.frame - 3) * 3) / gameConstants_1.GameConstants.TILESIZE);
            var f = Math.round(_this.frame);
            if (f == 2 || f == 4 || f == 6)
                game_1.Game.drawMob(2, 0, 1, 2, _this.x, _this.y - yOffset, 1, 2);
            else
                game_1.Game.drawFX(Math.round(_this.frame), 4, 1, 2, _this.x, _this.y - yOffset, 1, 2);
            _this.frame += 0.3 * delta;
            if (_this.frame > 10)
                _this.dead = true;
        };
        _this.x = x;
        _this.y = y - 1.5;
        _this.dead = false;
        _this.frame = 0;
        return _this;
    }
    return DeathParticle;
}(particle_1.Particle));
exports.DeathParticle = DeathParticle;


/***/ }),

/***/ "./src/particle/genericParticle.ts":
/*!*****************************************!*\
  !*** ./src/particle/genericParticle.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GenericParticle = void 0;
var particle_1 = __webpack_require__(/*! ./particle */ "./src/particle/particle.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var GenericParticle = /** @class */ (function (_super) {
    __extends(GenericParticle, _super);
    function GenericParticle(level, x, y, z, s, dx, dy, dz, color, delay, expirationTimer, targetX, targetY, targetZ) {
        var _this = _super.call(this) || this;
        _this.render = function () {
            var scale = gameConstants_1.GameConstants.TILESIZE;
            var scaledS = _this.s * _this.alpha; // using alpha for scaling, not alpha
            var halfS = 0.5 * scaledS;
            var oldFillStyle = game_1.Game.ctx.fillStyle;
            game_1.Game.ctx.fillStyle = _this.color;
            game_1.Game.ctx.beginPath();
            game_1.Game.ctx.arc(Math.round(_this.x * scale), Math.round((_this.y - _this.z) * scale), Math.round(halfS * scale), 0, 2 * Math.PI, false);
            game_1.Game.ctx.fill();
            game_1.Game.ctx.fillStyle = oldFillStyle;
        };
        _this.draw = function (delta) {
            if (_this.targetX)
                _this.x += 0.1 * (_this.targetX - _this.x);
            else
                _this.x += _this.dx;
            if (_this.targetY)
                _this.y += 0.1 * (_this.targetY - _this.y);
            else
                _this.y += _this.dy;
            if (_this.targetZ)
                _this.z += 0.1 * (_this.targetZ - _this.z);
            else
                _this.z += _this.dz;
            _this.dx *= 0.97;
            _this.dy *= 0.97;
            if (_this.z <= 0) {
                _this.z = 0;
                _this.dz *= -0.8;
            }
            // apply gravity
            _this.dz -= 0.01;
            if (_this.alpha < 0.2)
                _this.alpha -= 0.007;
            else
                _this.alpha -= 0.02;
            if (_this.alpha <= 0.1)
                _this.dead = true;
            _this.expirationTimer--;
            if (_this.expirationTimer <= 0)
                _this.dead = true;
            if (_this.dead)
                return;
            _this.drawableY = _this.y;
            _this.render();
        };
        _this.level = level;
        _this.x = x;
        _this.y = y;
        _this.z = z;
        _this.s = s;
        _this.dx = dx;
        _this.dy = dy;
        _this.dz = dz;
        _this.color = color;
        _this.alpha = 1.0;
        if (delay !== undefined)
            _this.delay = delay;
        _this.targetX = targetX;
        _this.targetY = targetY;
        _this.targetZ = targetZ;
        _this.expirationTimer = 1000000;
        if (expirationTimer !== undefined)
            _this.expirationTimer = expirationTimer;
        return _this;
    }
    GenericParticle.shotgun = function (level, cx, cy, tx, ty, color) {
        for (var i = 0; i < 4; i++) {
            level.particles.push(new GenericParticle(level, cx, cy, 0, Math.random() * 0.5 + 0.3, 0, 0, 0, color, 0, 10000000, tx + Math.random() - 0.5, ty + Math.random() - 0.5, 0));
        }
    };
    GenericParticle.spawnCluster = function (level, cx, cy, color) {
        for (var i = 0; i < 4; i++) {
            level.particles.push(new GenericParticle(level, cx + Math.random() * 0.05 - 0.025, cy + Math.random() * 0.05 - 0.025, Math.random() * 0.5, 0.0625 * (i + 8), 0.025 * (Math.random() * 2 - 1), 0.025 * (Math.random() * 2 - 1), 0.2 * (Math.random() - 1), color, 0));
        }
    };
    return GenericParticle;
}(particle_1.Particle));
exports.GenericParticle = GenericParticle;


/***/ }),

/***/ "./src/particle/particle.ts":
/*!**********************************!*\
  !*** ./src/particle/particle.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Particle = void 0;
var drawable_1 = __webpack_require__(/*! ../drawable */ "./src/drawable.ts");
var Particle = /** @class */ (function (_super) {
    __extends(Particle, _super);
    function Particle() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Particle;
}(drawable_1.Drawable));
exports.Particle = Particle;


/***/ }),

/***/ "./src/particle/slashParticle.ts":
/*!***************************************!*\
  !*** ./src/particle/slashParticle.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SlashParticle = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var particle_1 = __webpack_require__(/*! ./particle */ "./src/particle/particle.ts");
var SlashParticle = /** @class */ (function (_super) {
    __extends(SlashParticle, _super);
    function SlashParticle(x, y) {
        var _this = _super.call(this) || this;
        _this.draw = function (delta) {
            if (_this.dead)
                return;
            game_1.Game.drawFX(Math.round(_this.frame), 13, 1, 1, _this.x, _this.y, 1, 1);
            _this.frame += 0.5 * delta;
            if (_this.frame > 9)
                _this.dead = true;
        };
        _this.x = x;
        _this.y = y - 0.25;
        _this.dead = false;
        _this.frame = 0;
        return _this;
    }
    return SlashParticle;
}(particle_1.Particle));
exports.SlashParticle = SlashParticle;


/***/ }),

/***/ "./src/particle/wizardTeleportParticle.ts":
/*!************************************************!*\
  !*** ./src/particle/wizardTeleportParticle.ts ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WizardTeleportParticle = void 0;
var particle_1 = __webpack_require__(/*! ./particle */ "./src/particle/particle.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var WizardTeleportParticle = /** @class */ (function (_super) {
    __extends(WizardTeleportParticle, _super);
    function WizardTeleportParticle(x, y) {
        var _this = _super.call(this) || this;
        _this.draw = function (delta) {
            if (_this.dead)
                return;
            game_1.Game.drawFX(Math.floor(_this.frame), 3, 1, 1, _this.x, _this.y - _this.z, 1, 1);
            _this.z += _this.dz;
            _this.dz *= 0.9;
            _this.frame += 0.25 * delta;
            if (_this.frame > 6)
                _this.dead = true;
        };
        _this.x = x;
        _this.y = y;
        _this.dead = false;
        _this.frame = 0;
        _this.z = 0;
        _this.dz = 0.1;
        return _this;
    }
    return WizardTeleportParticle;
}(particle_1.Particle));
exports.WizardTeleportParticle = WizardTeleportParticle;


/***/ }),

/***/ "./src/player.ts":
/*!***********************!*\
  !*** ./src/player.ts ***!
  \***********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Player = exports.PlayerDirection = void 0;
var input_1 = __webpack_require__(/*! ./input */ "./src/input.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var door_1 = __webpack_require__(/*! ./tile/door */ "./src/tile/door.ts");
var trapdoor_1 = __webpack_require__(/*! ./tile/trapdoor */ "./src/tile/trapdoor.ts");
var inventory_1 = __webpack_require__(/*! ./inventory */ "./src/inventory.ts");
var sound_1 = __webpack_require__(/*! ./sound */ "./src/sound.ts");
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var map_1 = __webpack_require__(/*! ./map */ "./src/map.ts");
var slashParticle_1 = __webpack_require__(/*! ./particle/slashParticle */ "./src/particle/slashParticle.ts");
var healthbar_1 = __webpack_require__(/*! ./healthbar */ "./src/healthbar.ts");
var drawable_1 = __webpack_require__(/*! ./drawable */ "./src/drawable.ts");
var actionTab_1 = __webpack_require__(/*! ./actionTab */ "./src/actionTab.ts");
var PlayerDirection;
(function (PlayerDirection) {
    PlayerDirection[PlayerDirection["DOWN"] = 0] = "DOWN";
    PlayerDirection[PlayerDirection["UP"] = 1] = "UP";
    PlayerDirection[PlayerDirection["RIGHT"] = 2] = "RIGHT";
    PlayerDirection[PlayerDirection["LEFT"] = 3] = "LEFT";
})(PlayerDirection = exports.PlayerDirection || (exports.PlayerDirection = {}));
var Player = /** @class */ (function (_super) {
    __extends(Player, _super);
    function Player(game, x, y, isLocalPlayer) {
        var _this = _super.call(this) || this;
        _this.inputHandler = function (input) {
            switch (input) {
                case input_1.InputEnum.LEFT:
                case input_1.InputEnum.RIGHT:
                case input_1.InputEnum.UP:
                case input_1.InputEnum.DOWN:
                    if (!_this.ignoreDirectionInput())
                        _this.game.sendInput(input);
                    break;
                case input_1.InputEnum.I:
                case input_1.InputEnum.Q:
                case input_1.InputEnum.SPACE:
                    _this.game.sendInput(input);
                    break;
            }
        };
        _this.tapListener = function () {
            _this.inventory.open();
        };
        _this.iListener = function () {
            _this.inventory.open();
        };
        _this.qListener = function () {
            if (_this.inventory.isOpen) {
                _this.inventory.drop();
            }
        };
        _this.ignoreDirectionInput = function () {
            return (!_this.inventory.isOpen &&
                (_this.dead || _this.game.levelState !== game_1.LevelState.IN_LEVEL));
        };
        _this.leftListener = function (isLocal) {
            if (_this.inventory.isOpen) {
                _this.inventory.left();
                return true;
            }
            if (!_this.dead &&
                (!isLocal || _this.game.levelState === game_1.LevelState.IN_LEVEL)) {
                _this.left();
                return true;
            }
            return false;
        };
        _this.rightListener = function (isLocal) {
            if (_this.inventory.isOpen) {
                _this.inventory.right();
                return true;
            }
            if (!_this.dead &&
                (!isLocal || _this.game.levelState === game_1.LevelState.IN_LEVEL)) {
                _this.right();
                return true;
            }
            return false;
        };
        _this.upListener = function (isLocal) {
            if (_this.inventory.isOpen) {
                _this.inventory.up();
                return true;
            }
            if (!_this.dead &&
                (!isLocal || _this.game.levelState === game_1.LevelState.IN_LEVEL)) {
                _this.up();
                return true;
            }
            return false;
        };
        _this.downListener = function (isLocal) {
            if (_this.inventory.isOpen) {
                _this.inventory.down();
                return true;
            }
            if (!_this.dead &&
                (!isLocal || _this.game.levelState === game_1.LevelState.IN_LEVEL)) {
                _this.down();
                return true;
            }
            return false;
        };
        _this.spaceListener = function () {
            if (_this.inventory.isOpen) {
                _this.inventory.space();
                return;
            }
            if (_this.openVendingMachine) {
                _this.openVendingMachine.space();
            }
        };
        _this.left = function () {
            _this.tryMove(_this.x - 1, _this.y);
            _this.direction = PlayerDirection.LEFT;
        };
        _this.right = function () {
            _this.tryMove(_this.x + 1, _this.y);
            _this.direction = PlayerDirection.RIGHT;
        };
        _this.up = function () {
            _this.tryMove(_this.x, _this.y - 1);
            _this.direction = PlayerDirection.UP;
        };
        _this.down = function () {
            _this.tryMove(_this.x, _this.y + 1);
            _this.direction = PlayerDirection.DOWN;
        };
        _this.hit = function () {
            return 1;
        };
        _this.tryCollide = function (other, newX, newY) {
            if (newX >= other.x + other.w || newX + _this.w <= other.x)
                return false;
            if (newY >= other.y + other.h || newY + _this.h <= other.y)
                return false;
            return true;
        };
        _this.tryMove = function (x, y) {
            var newMove = { x: x, y: y };
            // TODO don't move if hit by enemy
            _this.game.rooms[_this.levelID].catchUp();
            if (_this.dead)
                return;
            for (var i = 0; i < 2; i++)
                if (_this.inventory.hasWeapon() &&
                    !_this.inventory.getWeapon().weaponMove(x, y)) {
                    //for (let h of this.game.levels[this.levelID].hitwarnings) {
                    //if (newMove instanceof HitWarning)
                    return;
                    //}
                }
            for (var _i = 0, _a = _this.game.rooms[_this.levelID].enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (_this.tryCollide(e, x, y)) {
                    if (e.pushable) {
                        // pushing a crate or barrel
                        var dx = x - _this.x;
                        var dy = y - _this.y;
                        var nextX = x + dx;
                        var nextY = y + dy;
                        var foundEnd = false; // end of the train of whatever we're pushing
                        var enemyEnd = false; // end of the train is a solid enemy (i.e. potted plant)
                        var pushedEnemies = [];
                        while (true) {
                            foundEnd = true;
                            for (var _b = 0, _c = _this.game.rooms[_this.levelID].enemies; _b < _c.length; _b++) {
                                var f = _c[_b];
                                if (f.pointIn(nextX, nextY)) {
                                    if (!f.chainPushable) {
                                        enemyEnd = true;
                                        foundEnd = true;
                                        break;
                                    }
                                    foundEnd = false;
                                    pushedEnemies.push(f);
                                    break;
                                }
                            }
                            if (foundEnd)
                                break;
                            nextX += dx * pushedEnemies[pushedEnemies.length - 1].w;
                            nextY += dy * pushedEnemies[pushedEnemies.length - 1].h;
                        }
                        /* if no enemies and there is a wall, no move
                        otherwise, push everything, killing last enemy if there is a wall */
                        // here, (nextX, nextY) is the position immediately after the end of the train
                        if (pushedEnemies.length === 0 &&
                            (_this.game.rooms[_this.levelID].roomArray[nextX][nextY].canCrushEnemy() ||
                                enemyEnd)) {
                            if (e.destroyable) {
                                e.kill();
                                if (_this.game.rooms[_this.levelID] === _this.game.level)
                                    sound_1.Sound.hit();
                                _this.drawX = 0.5 * (_this.x - e.x);
                                _this.drawY = 0.5 * (_this.y - e.y);
                                _this.game.rooms[_this.levelID].particles.push(new slashParticle_1.SlashParticle(e.x, e.y));
                                _this.game.rooms[_this.levelID].tick(_this);
                                _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                return;
                            }
                        }
                        else {
                            if (_this.game.rooms[_this.levelID] === _this.game.level)
                                sound_1.Sound.push();
                            // here pushedEnemies may still be []
                            for (var _d = 0, pushedEnemies_1 = pushedEnemies; _d < pushedEnemies_1.length; _d++) {
                                var f = pushedEnemies_1[_d];
                                f.x += dx;
                                f.y += dy;
                                f.drawX = dx;
                                f.drawY = dy;
                                f.skipNextTurns = 1; // skip next turn, so they don't move while we're pushing them
                            }
                            if (_this.game.rooms[_this.levelID].roomArray[nextX][nextY].canCrushEnemy() ||
                                enemyEnd) {
                                pushedEnemies[pushedEnemies.length - 1].killNoBones();
                                if (_this.game.rooms[_this.levelID] === _this.game.level)
                                    sound_1.Sound.hit();
                            }
                            e.x += dx;
                            e.y += dy;
                            e.drawX = dx;
                            e.drawY = dy;
                            _this.move(x, y);
                            _this.game.rooms[_this.levelID].tick(_this);
                            return;
                        }
                    }
                    else {
                        // if we're trying to hit an enemy, check if it's destroyable
                        if (!e.dead) {
                            if (e.interactable)
                                e.interact(_this);
                            _this.actionTab.actionState = actionTab_1.ActionState.ATTACK;
                            //sets the action tab state to Attack
                            return;
                        }
                    }
                }
            }
            var other = _this.game.rooms[_this.levelID].roomArray[x][y];
            if (!other.isSolid()) {
                _this.move(x, y);
                other.onCollide(_this);
                if (!(other instanceof door_1.Door ||
                    other instanceof trapdoor_1.Trapdoor))
                    _this.game.rooms[_this.levelID].tick(_this);
            }
            else {
                if (other instanceof door_1.Door) {
                    _this.drawX = (_this.x - x) * 0.5;
                    _this.drawY = (_this.y - y) * 0.5;
                    if (other.canUnlock(_this))
                        other.unlock(_this);
                }
            }
        };
        _this.hurt = function (damage, enemy) {
            if (_this.game.rooms[_this.levelID] === _this.game.level)
                sound_1.Sound.hurt();
            if (_this.inventory.getArmor() && _this.inventory.getArmor().health > 0) {
                _this.inventory.getArmor().hurt(damage);
            }
            else {
                _this.lastHitBy = enemy;
                console.log("Last Hit by: ", enemy);
                _this.healthBar.hurt();
                _this.flashing = true;
                _this.health -= damage;
                if (_this.health <= 0) {
                    _this.health = 0;
                    _this.dead = true;
                }
            }
        };
        _this.dashMove = function (x, y) {
            _this.x = x;
            _this.y = y;
            for (var _i = 0, _a = _this.game.rooms[_this.levelID].items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.x === x && i.y === y) {
                    i.onPickup(_this);
                }
            }
            _this.game.rooms[_this.levelID].updateLighting();
        };
        _this.doneMoving = function () {
            var EPSILON = 0.01;
            return Math.abs(_this.drawX) < EPSILON && Math.abs(_this.drawY) < EPSILON;
        };
        _this.move = function (x, y) {
            _this.actionTab.setState(actionTab_1.ActionState.MOVE);
            if (_this.game.rooms[_this.levelID] === _this.game.level)
                sound_1.Sound.playerStoneFootstep();
            if (_this.openVendingMachine)
                _this.openVendingMachine.close();
            _this.drawX = x - _this.x;
            _this.drawY = y - _this.y;
            _this.x = x;
            _this.y = y;
            for (var _i = 0, _a = _this.game.rooms[_this.levelID].items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.x === x && i.y === y) {
                    i.onPickup(_this);
                }
            }
            _this.game.rooms[_this.levelID].updateLighting();
        };
        _this.moveNoSmooth = function (x, y) {
            // doesn't touch smoothing
            _this.x = x;
            _this.y = y;
        };
        _this.moveSnap = function (x, y) {
            // no smoothing
            _this.x = x;
            _this.y = y;
            _this.drawX = 0;
            _this.drawY = 0;
        };
        _this.update = function () { };
        _this.finishTick = function () {
            _this.turnCount += 1;
            _this.inventory.tick();
            _this.flashing = false;
            var totalHealthDiff = _this.health - _this.lastTickHealth;
            _this.lastTickHealth = _this.health; // update last tick health
            if (totalHealthDiff < 0) {
                _this.flashing = true;
            }
            _this.actionTab.actionState = actionTab_1.ActionState.READY;
            //Sets the action tab state to Wait (during enemy turn)
        };
        _this.drawPlayerSprite = function (delta) {
            _this.frame += 0.1 * delta;
            if (_this.frame >= 4)
                _this.frame = 0;
            game_1.Game.drawMob(1 + Math.floor(_this.frame), 8 + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY, 1, 2);
            if (_this.inventory.getArmor() && _this.inventory.getArmor().health > 0) {
                // TODO draw armor
            }
        };
        _this.draw = function (delta) {
            _this.drawableY = _this.y;
            _this.flashingFrame += (delta * 12) / gameConstants_1.GameConstants.FPS;
            if (!_this.dead) {
                game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1);
                if (!_this.flashing || Math.floor(_this.flashingFrame) % 2 === 0) {
                    _this.drawPlayerSprite(delta);
                }
            }
        };
        _this.heartbeat = function () {
            _this.guiHeartFrame = 1;
        };
        _this.tapHoldHandler = function () {
            _this.mapToggled = !_this.mapToggled;
        };
        _this.drawTopLayer = function (delta) {
            _this.healthBar.draw(delta, _this.health, _this.maxHealth, _this.x - _this.drawX, _this.y - _this.drawY, !_this.flashing || Math.floor(_this.flashingFrame) % 2 === 0);
        };
        _this.drawGUI = function (delta) {
            if (!_this.dead) {
                _this.inventory.draw(delta);
                _this.actionTab.draw(delta);
                if (_this.guiHeartFrame > 0)
                    _this.guiHeartFrame += delta;
                if (_this.guiHeartFrame > 5) {
                    _this.guiHeartFrame = 0;
                }
                for (var i = 0; i < _this.maxHealth; i++) {
                    var frame = _this.guiHeartFrame > 0 ? 1 : 0;
                    if (i >= Math.floor(_this.health)) {
                        if (i == Math.floor(_this.health) && (_this.health * 2) % 2 == 1) {
                            // draw half heart
                            game_1.Game.drawFX(4, 2, 1, 1, i, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
                        }
                        else {
                            game_1.Game.drawFX(3, 2, 1, 1, i, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
                        }
                    }
                    else
                        game_1.Game.drawFX(frame, 2, 1, 1, i, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
                }
                if (_this.inventory.getArmor())
                    _this.inventory.getArmor().drawGUI(delta, _this.maxHealth);
            }
            else {
                game_1.Game.ctx.fillStyle = levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR;
                var gameOverString = "Game Over";
                if (_this.lastHitBy !== "enemy") {
                    gameOverString = "You were slain by ".concat(_this.lastHitBy, ".");
                }
                game_1.Game.fillText(gameOverString, gameConstants_1.GameConstants.WIDTH / 2 - game_1.Game.measureText(gameOverString).width / 2, gameConstants_1.GameConstants.HEIGHT / 2 - game_1.Game.letter_height + 2);
            }
            /*if ((Input.isDown(Input.M) || Input.isTapHold) && !this.game.chatOpen) {
              this.tapHoldHandler();
            }*/
            if (_this.mapToggled === true)
                _this.map.draw(delta);
            //this.actionTab.draw(this, this.inventory);
            //render the action tab
        };
        _this.updateDrawXY = function (delta) {
            _this.drawX += -0.5 * _this.drawX;
            _this.drawY += -0.5 * _this.drawY;
        };
        _this.game = game;
        _this.levelID = 0;
        _this.x = x;
        _this.y = y;
        _this.w = 1;
        _this.h = 1;
        _this.drawX = 0;
        _this.drawY = 0;
        _this.frame = 0;
        _this.direction = PlayerDirection.UP;
        _this.isLocalPlayer = isLocalPlayer;
        if (isLocalPlayer) {
            input_1.Input.leftSwipeListener = function () { return _this.inputHandler(input_1.InputEnum.LEFT); };
            input_1.Input.rightSwipeListener = function () { return _this.inputHandler(input_1.InputEnum.RIGHT); };
            input_1.Input.upSwipeListener = function () { return _this.inputHandler(input_1.InputEnum.UP); };
            input_1.Input.downSwipeListener = function () { return _this.inputHandler(input_1.InputEnum.DOWN); };
            input_1.Input.tapListener = function () {
                if (_this.inventory.isOpen) {
                    if (_this.inventory.pointInside(input_1.Input.mouseX, input_1.Input.mouseY)) {
                        _this.inputHandler(input_1.InputEnum.SPACE);
                    }
                    else {
                        _this.inputHandler(input_1.InputEnum.I);
                    }
                }
                else
                    _this.inputHandler(input_1.InputEnum.I);
            };
        }
        _this.mapToggled = true;
        _this.health = 2;
        _this.maxHealth = 2;
        _this.healthBar = new healthbar_1.HealthBar();
        _this.dead = false;
        _this.flashing = false;
        _this.flashingFrame = 0;
        _this.lastTickHealth = _this.health;
        _this.guiHeartFrame = 0;
        _this.inventory = new inventory_1.Inventory(game, _this);
        _this.missProb = 0.1;
        _this.defaultSightRadius = 6;
        _this.sightRadius = _this.defaultSightRadius;
        _this.map = new map_1.Map(_this.game);
        _this.actionTab = new actionTab_1.ActionTab(_this.inventory, _this.game);
        _this.turnCount = 0;
        return _this;
    }
    return Player;
}(drawable_1.Drawable));
exports.Player = Player;


/***/ }),

/***/ "./src/projectile/enemySpawnAnimation.ts":
/*!***********************************************!*\
  !*** ./src/projectile/enemySpawnAnimation.ts ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EnemySpawnAnimation = void 0;
var projectile_1 = __webpack_require__(/*! ./projectile */ "./src/projectile/projectile.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var EnemySpawnAnimation = /** @class */ (function (_super) {
    __extends(EnemySpawnAnimation, _super);
    function EnemySpawnAnimation(level, enemy, x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.ANIM_COUNT = 3;
        _this.tick = function () {
            if (_this.level === _this.level.game.level)
                sound_1.Sound.enemySpawn();
            var hitPlayer = false;
            for (var i in _this.level.game.players) {
                if (_this.level.game.players[i].x === _this.x && _this.level.game.players[i].y === _this.y) {
                    _this.level.game.players[i].hurt(0.5, "reaper");
                    hitPlayer = true;
                }
            }
            if (!hitPlayer) {
                _this.dead = true;
                _this.enemy.skipNextTurns = 1;
                _this.level.enemies.push(_this.enemy);
                genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#ffffff");
                genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#ffffff");
            }
            else {
                _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.level.game, _this.x, _this.y));
            }
        };
        _this.drawTopLayer = function (delta) {
            if (_this.dead)
                return;
            _this.frame += 0.25 * delta;
            if (_this.frame >= 8)
                _this.frame = 0;
            for (var i = 0; i < _this.ANIM_COUNT; i++) {
                var offsetX = 0;
                game_1.Game.drawFX(Math.floor(_this.frame), 26, 1, 2, _this.x + Math.round(offsetX) / 16.0, _this.y - 1.5, 1, 2);
            }
            if (Math.floor(_this.frame * 4) % 2 == 0)
                _this.level.particles.push(new genericParticle_1.GenericParticle(_this.level, _this.x + 0.5 + Math.random() * 0.05 - 0.025, _this.y + Math.random() * 0.05 - 0.025, 0.25, Math.random() * 0.5, 0.025 * (Math.random() * 1 - 0.5), 0.025 * (Math.random() * 1 - 0.5), 0.2 * (Math.random() - 1), "#ffffff", 0));
        };
        _this.level = level;
        _this.enemy = enemy;
        _this.frame = 0;
        return _this;
    }
    return EnemySpawnAnimation;
}(projectile_1.Projectile));
exports.EnemySpawnAnimation = EnemySpawnAnimation;


/***/ }),

/***/ "./src/projectile/playerFireball.ts":
/*!******************************************!*\
  !*** ./src/projectile/playerFireball.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerFireball = void 0;
var projectile_1 = __webpack_require__(/*! ./projectile */ "./src/projectile/projectile.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var PlayerFireball = /** @class */ (function (_super) {
    __extends(PlayerFireball, _super);
    function PlayerFireball(x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.drawTopLayer = function (delta) {
            if (_this.dead)
                return;
            _this.frame += 0.25 * delta;
            if (_this.frame > 17)
                _this.dead = true;
            game_1.Game.drawFX(Math.floor(_this.frame), 6, 1, 2, _this.x, _this.y - 1, 1, 2);
        };
        _this.state = 0;
        _this.frame = 6;
        return _this;
    }
    return PlayerFireball;
}(projectile_1.Projectile));
exports.PlayerFireball = PlayerFireball;


/***/ }),

/***/ "./src/projectile/projectile.ts":
/*!**************************************!*\
  !*** ./src/projectile/projectile.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Projectile = void 0;
var drawable_1 = __webpack_require__(/*! ../drawable */ "./src/drawable.ts");
var Projectile = /** @class */ (function (_super) {
    __extends(Projectile, _super);
    function Projectile(x, y) {
        var _this = _super.call(this) || this;
        _this.hitPlayer = function (player) { };
        _this.hitEnemy = function (enemy) { };
        _this.tick = function () { };
        _this.draw = function (delta) { };
        _this.drawTopLayer = function (delta) { };
        _this.x = x;
        _this.y = y;
        _this.dead = false;
        _this.drawableY = y;
        return _this;
    }
    return Projectile;
}(drawable_1.Drawable));
exports.Projectile = Projectile;


/***/ }),

/***/ "./src/projectile/wizardFireball.ts":
/*!******************************************!*\
  !*** ./src/projectile/wizardFireball.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WizardFireball = void 0;
var projectile_1 = __webpack_require__(/*! ./projectile */ "./src/projectile/projectile.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var WizardFireball = /** @class */ (function (_super) {
    __extends(WizardFireball, _super);
    function WizardFireball(parent, x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.tick = function () {
            if (_this.parent.dead)
                _this.dead = true;
            _this.state++;
            if (_this.state === 1) {
                _this.parent.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.parent.game, _this.x, _this.y));
            }
            if (_this.state === 2) {
                _this.frame = 0;
                _this.delay = game_1.Game.rand(0, 10, Math.random);
            }
        };
        _this.hitPlayer = function (player) {
            if (_this.state === 2 && !_this.dead) {
                player.hurt(1, "wizard");
            }
        };
        _this.draw = function (delta) {
            if (_this.dead)
                return;
            if (_this.state === 0) {
                _this.frame += 0.25 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                game_1.Game.drawFX(22 + Math.floor(_this.frame), 7, 1, 1, _this.x, _this.y, 1, 1);
            }
            else if (_this.state === 1) {
                _this.frame += 0.25 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                game_1.Game.drawFX(18 + Math.floor(_this.frame), 7, 1, 1, _this.x, _this.y, 1, 1);
            }
            else {
                if (_this.delay > 0) {
                    _this.delay--;
                    return;
                }
                _this.frame += 0.3 * delta;
                if (_this.frame > 17)
                    _this.dead = true;
                game_1.Game.drawFX(Math.floor(_this.frame), 6, 1, 2, _this.x, _this.y - 1, 1, 2);
            }
        };
        _this.parent = parent;
        _this.state = 0;
        _this.frame = 0;
        return _this;
    }
    return WizardFireball;
}(projectile_1.Projectile));
exports.WizardFireball = WizardFireball;


/***/ }),

/***/ "./src/random.ts":
/*!***********************!*\
  !*** ./src/random.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Random = void 0;
var Random = /** @class */ (function () {
    function Random() {
    }
    Random.setState = function (state) {
        Random.state = state;
    };
    Random.rand = function () {
        Random.state ^= (Random.state << 21);
        Random.state ^= (Random.state >>> 35);
        Random.state ^= (Random.state << 4);
        return (Random.state >>> 0) / 4294967296;
    };
    return Random;
}());
exports.Random = Random;
// copy and paste into browser console
// let state;
// let rand = () => { state ^= (state << 21); state ^= (state >>> 35); state ^= (state << 4); return (state >>> 0) / 4294967296; }


/***/ }),

/***/ "./src/room.ts":
/*!*********************!*\
  !*** ./src/room.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Room = exports.TurnState = exports.RoomType = void 0;
var wall_1 = __webpack_require__(/*! ./tile/wall */ "./src/tile/wall.ts");
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var floor_1 = __webpack_require__(/*! ./tile/floor */ "./src/tile/floor.ts");
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var door_1 = __webpack_require__(/*! ./tile/door */ "./src/tile/door.ts");
var tile_1 = __webpack_require__(/*! ./tile/tile */ "./src/tile/tile.ts");
var knightEnemy_1 = __webpack_require__(/*! ./enemy/knightEnemy */ "./src/enemy/knightEnemy.ts");
var enemy_1 = __webpack_require__(/*! ./enemy/enemy */ "./src/enemy/enemy.ts");
var chest_1 = __webpack_require__(/*! ./enemy/chest */ "./src/enemy/chest.ts");
var goldenKey_1 = __webpack_require__(/*! ./item/goldenKey */ "./src/item/goldenKey.ts");
var spawnfloor_1 = __webpack_require__(/*! ./tile/spawnfloor */ "./src/tile/spawnfloor.ts");
//import { GoldenDoor } from "./tile/goldenDoor";
var spike_1 = __webpack_require__(/*! ./tile/spike */ "./src/tile/spike.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var wizardEnemy_1 = __webpack_require__(/*! ./enemy/wizardEnemy */ "./src/enemy/wizardEnemy.ts");
var skullEnemy_1 = __webpack_require__(/*! ./enemy/skullEnemy */ "./src/enemy/skullEnemy.ts");
var barrel_1 = __webpack_require__(/*! ./enemy/barrel */ "./src/enemy/barrel.ts");
var crate_1 = __webpack_require__(/*! ./enemy/crate */ "./src/enemy/crate.ts");
var armor_1 = __webpack_require__(/*! ./item/armor */ "./src/item/armor.ts");
var spiketrap_1 = __webpack_require__(/*! ./tile/spiketrap */ "./src/tile/spiketrap.ts");
var fountainTile_1 = __webpack_require__(/*! ./tile/fountainTile */ "./src/tile/fountainTile.ts");
var coffinTile_1 = __webpack_require__(/*! ./tile/coffinTile */ "./src/tile/coffinTile.ts");
var pottedPlant_1 = __webpack_require__(/*! ./enemy/pottedPlant */ "./src/enemy/pottedPlant.ts");
var insideLevelDoor_1 = __webpack_require__(/*! ./tile/insideLevelDoor */ "./src/tile/insideLevelDoor.ts");
var button_1 = __webpack_require__(/*! ./tile/button */ "./src/tile/button.ts");
var hitWarning_1 = __webpack_require__(/*! ./hitWarning */ "./src/hitWarning.ts");
var upLadder_1 = __webpack_require__(/*! ./tile/upLadder */ "./src/tile/upLadder.ts");
var downLadder_1 = __webpack_require__(/*! ./tile/downLadder */ "./src/tile/downLadder.ts");
var coalResource_1 = __webpack_require__(/*! ./enemy/coalResource */ "./src/enemy/coalResource.ts");
var goldResource_1 = __webpack_require__(/*! ./enemy/goldResource */ "./src/enemy/goldResource.ts");
var emeraldResource_1 = __webpack_require__(/*! ./enemy/emeraldResource */ "./src/enemy/emeraldResource.ts");
var chasm_1 = __webpack_require__(/*! ./tile/chasm */ "./src/tile/chasm.ts");
var spawner_1 = __webpack_require__(/*! ./enemy/spawner */ "./src/enemy/spawner.ts");
var vendingMachine_1 = __webpack_require__(/*! ./enemy/vendingMachine */ "./src/enemy/vendingMachine.ts");
var wallTorch_1 = __webpack_require__(/*! ./tile/wallTorch */ "./src/tile/wallTorch.ts");
var chargeEnemy_1 = __webpack_require__(/*! ./enemy/chargeEnemy */ "./src/enemy/chargeEnemy.ts");
var shotgun_1 = __webpack_require__(/*! ./weapon/shotgun */ "./src/weapon/shotgun.ts");
var heart_1 = __webpack_require__(/*! ./item/heart */ "./src/item/heart.ts");
var spear_1 = __webpack_require__(/*! ./weapon/spear */ "./src/weapon/spear.ts");
var player_1 = __webpack_require__(/*! ./player */ "./src/player.ts");
var slimeEnemy_1 = __webpack_require__(/*! ./enemy/slimeEnemy */ "./src/enemy/slimeEnemy.ts");
var zombieEnemy_1 = __webpack_require__(/*! ./enemy/zombieEnemy */ "./src/enemy/zombieEnemy.ts");
var bigSkullEnemy_1 = __webpack_require__(/*! ./enemy/bigSkullEnemy */ "./src/enemy/bigSkullEnemy.ts");
var random_1 = __webpack_require__(/*! ./random */ "./src/random.ts");
var lantern_1 = __webpack_require__(/*! ./item/lantern */ "./src/item/lantern.ts");
var dualdagger_1 = __webpack_require__(/*! ./weapon/dualdagger */ "./src/weapon/dualdagger.ts");
var pot_1 = __webpack_require__(/*! ./enemy/pot */ "./src/enemy/pot.ts");
var bishopEnemy_1 = __webpack_require__(/*! ./enemy/bishopEnemy */ "./src/enemy/bishopEnemy.ts");
var rockResource_1 = __webpack_require__(/*! ./enemy/rockResource */ "./src/enemy/rockResource.ts");
var mushrooms_1 = __webpack_require__(/*! ./enemy/mushrooms */ "./src/enemy/mushrooms.ts");
var armoredzombieEnemy_1 = __webpack_require__(/*! ./enemy/armoredzombieEnemy */ "./src/enemy/armoredzombieEnemy.ts");
var door_2 = __webpack_require__(/*! ./tile/door */ "./src/tile/door.ts");
var actionTab_1 = __webpack_require__(/*! ./actionTab */ "./src/actionTab.ts");
var tombStone_1 = __webpack_require__(/*! ./enemy/tombStone */ "./src/enemy/tombStone.ts");
var RoomType;
(function (RoomType) {
    RoomType[RoomType["START"] = 0] = "START";
    RoomType[RoomType["DUNGEON"] = 1] = "DUNGEON";
    RoomType[RoomType["BOSS"] = 2] = "BOSS";
    RoomType[RoomType["BIGDUNGEON"] = 3] = "BIGDUNGEON";
    RoomType[RoomType["TREASURE"] = 4] = "TREASURE";
    RoomType[RoomType["FOUNTAIN"] = 5] = "FOUNTAIN";
    RoomType[RoomType["COFFIN"] = 6] = "COFFIN";
    RoomType[RoomType["GRASS"] = 7] = "GRASS";
    RoomType[RoomType["PUZZLE"] = 8] = "PUZZLE";
    RoomType[RoomType["KEYROOM"] = 9] = "KEYROOM";
    RoomType[RoomType["CHESSBOARD"] = 10] = "CHESSBOARD";
    RoomType[RoomType["MAZE"] = 11] = "MAZE";
    RoomType[RoomType["CORRIDOR"] = 12] = "CORRIDOR";
    RoomType[RoomType["SPIKECORRIDOR"] = 13] = "SPIKECORRIDOR";
    RoomType[RoomType["UPLADDER"] = 14] = "UPLADDER";
    RoomType[RoomType["DOWNLADDER"] = 15] = "DOWNLADDER";
    RoomType[RoomType["SHOP"] = 16] = "SHOP";
    RoomType[RoomType["BIGCAVE"] = 17] = "BIGCAVE";
    RoomType[RoomType["CAVE"] = 18] = "CAVE";
    RoomType[RoomType["SPAWNER"] = 19] = "SPAWNER";
    RoomType[RoomType["ROPEHOLE"] = 20] = "ROPEHOLE";
    RoomType[RoomType["ROPECAVE"] = 21] = "ROPECAVE";
})(RoomType = exports.RoomType || (exports.RoomType = {}));
var TurnState;
(function (TurnState) {
    TurnState[TurnState["playerTurn"] = 0] = "playerTurn";
    TurnState[TurnState["computerTurn"] = 1] = "computerTurn";
})(TurnState = exports.TurnState || (exports.TurnState = {}));
var Room = /** @class */ (function () {
    function Room(game, x, y, w, h, type, depth, mapGroup, rand) {
        if (rand === void 0) { rand = random_1.Random.rand; }
        var _this = this;
        this.shadeColor = "black";
        this.tileInside = function (tileX, tileY) {
            return _this.pointInside(tileX, tileY, _this.roomX, _this.roomY, _this.width, _this.height);
        };
        this.populateEmpty = function (rand) {
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
        };
        this.populateDungeon = function (rand) {
            var factor = game_1.Game.rand(1, 36, rand);
            if (factor < 30)
                _this.addWallBlocks(rand);
            if (factor < 26)
                _this.addFingers(rand);
            if (factor % 4 === 0)
                _this.addChasms(rand);
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
            if (factor > 15)
                _this.addSpikeTraps(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
            var numEmptyTiles = _this.getEmptyTiles().length;
            var numTotalObstacles = Math.floor(numEmptyTiles * 0.35 * rand());
            var numPlants = Math.ceil(numTotalObstacles * rand());
            var numObstacles = numTotalObstacles - numPlants;
            _this.addPlants(numPlants, rand);
            _this.addObstacles(numObstacles, rand);
            var numEnemies = Math.ceil((numEmptyTiles - numTotalObstacles) *
                Math.min(_this.depth * 0.1 + 0.1, 0.35) //this.depth * 0.01 is starting value
            );
            _this.addEnemies(numEnemies, rand);
            if (factor <= 6)
                _this.addVendingMachine(rand);
        };
        this.populateBoss = function (rand) {
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
            _this.addSpikeTraps(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
            var numEmptyTiles = _this.getEmptyTiles().length;
            var numTotalObstacles = Math.floor(numEmptyTiles * 0.2);
            var numPlants = Math.floor(numTotalObstacles * rand());
            var numObstacles = numTotalObstacles - numPlants;
            _this.addPlants(numPlants, rand);
            _this.addObstacles(numObstacles, rand);
            var numEnemies = Math.ceil((numEmptyTiles - numTotalObstacles) *
                Math.min(_this.depth * 0.05 + 0.2, 0.5));
            _this.addEnemies(numEnemies, rand);
        };
        this.populateBigDungeon = function (rand) {
            if (game_1.Game.rand(1, 4, rand) === 1)
                _this.addChasms(rand);
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
            if (game_1.Game.rand(1, 4, rand) === 1)
                _this.addPlants(game_1.Game.randTable([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
            if (game_1.Game.rand(1, 3, rand) === 1)
                _this.addSpikeTraps(game_1.Game.randTable([3, 5, 7, 8], rand), rand);
            var numEmptyTiles = _this.getEmptyTiles().length;
            var numEnemies = Math.ceil(numEmptyTiles *
                (_this.depth * 0.5 + 0.5) *
                game_1.Game.randTable([0.05, 0.05, 0.06, 0.07, 0.1], rand));
            _this.addEnemies(numEnemies, rand);
            if (numEnemies > 0)
                _this.addObstacles(numEnemies / game_1.Game.rand(1, 2, rand), rand);
            else
                _this.addObstacles(game_1.Game.randTable([0, 0, 1, 1, 2, 3, 5], rand), rand);
        };
        this.populateSpawner = function (rand) {
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
            _this.enemies.push(new spawner_1.Spawner(_this, _this.game, Math.floor(_this.roomX + _this.width / 2), Math.floor(_this.roomY + _this.height / 2), rand));
        };
        this.populateKeyRoom = function (rand) {
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
            _this.items.push(new goldenKey_1.GoldenKey(_this, Math.floor(_this.roomX + _this.width / 2), Math.floor(_this.roomY + _this.height / 2)));
        };
        this.populateFountain = function (rand) {
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
            var centerX = Math.floor(_this.roomX + _this.width / 2);
            var centerY = Math.floor(_this.roomY + _this.height / 2);
            for (var x = centerX - 1; x <= centerX + 1; x++) {
                for (var y = centerY - 1; y <= centerY + 1; y++) {
                    _this.roomArray[x][y] = new fountainTile_1.FountainTile(_this, x, y, x - (centerX - 1), y - (centerY - 1));
                }
            }
            _this.addPlants(game_1.Game.randTable([0, 0, 1, 2], rand), rand);
        };
        this.placeCoffin = function (x, y) {
            _this.roomArray[x][y] = new coffinTile_1.CoffinTile(_this, x, y, 0);
            _this.roomArray[x][y + 1] = new coffinTile_1.CoffinTile(_this, x, y + 1, 1);
        };
        this.populateCoffin = function (rand) {
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
            _this.placeCoffin(Math.floor(_this.roomX + _this.width / 2 - 2), Math.floor(_this.roomY + _this.height / 2));
            _this.placeCoffin(Math.floor(_this.roomX + _this.width / 2), Math.floor(_this.roomY + _this.height / 2));
            _this.placeCoffin(Math.floor(_this.roomX + _this.width / 2) + 2, Math.floor(_this.roomY + _this.height / 2));
        };
        this.populatePuzzle = function (rand) {
            var d;
            for (var x_1 = _this.roomX; x_1 < _this.roomX + _this.width; x_1++) {
                var y_1 = _this.roomY + Math.floor(_this.height / 2);
                if (x_1 === _this.roomX + Math.floor(_this.width / 2)) {
                    d = new insideLevelDoor_1.InsideLevelDoor(_this, _this.game, x_1, y_1 + 1);
                    _this.roomArray[x_1][y_1 + 1] = d;
                }
                else {
                    _this.roomArray[x_1][y_1] = new wall_1.Wall(_this, x_1, y_1);
                }
            }
            var x = game_1.Game.rand(_this.roomX, _this.roomX + _this.width - 1, rand);
            var y = game_1.Game.rand(_this.roomY + Math.floor(_this.height / 2) + 3, _this.roomY + _this.height - 2, rand);
            _this.roomArray[x][y] = new button_1.Button(_this, x, y, d);
            var crateTiles = _this.getEmptyTiles().filter(function (t) {
                return t.x >= _this.roomX + 1 &&
                    t.x <= _this.roomX + _this.width - 2 &&
                    t.y >= _this.roomY + Math.floor(_this.height / 2) + 3 &&
                    t.y <= _this.roomY + _this.height - 2;
            });
            var numCrates = game_1.Game.randTable([1, 2, 2, 3, 4], rand);
            for (var i = 0; i < numCrates; i++) {
                var t = crateTiles.splice(game_1.Game.rand(0, crateTiles.length - 1, rand), 1)[0];
                _this.enemies.push(new crate_1.Crate(_this, _this.game, t.x, t.y));
            }
            _this.addPlants(game_1.Game.randTable([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
        };
        this.populateSpikeCorridor = function (rand) {
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY + 1; y < _this.roomY + _this.height - 1; y++) {
                    _this.roomArray[x][y] = new spiketrap_1.SpikeTrap(_this, x, y, game_1.Game.rand(0, 3, rand));
                }
            }
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
        };
        this.populateTreasure = function (rand) {
            _this.addTorches(game_1.Game.randTable([0, 1, 1, 2, 2, 3, 4], rand), rand);
            _this.addChests(game_1.Game.randTable([4, 4, 5, 5, 5, 6, 8], rand), rand);
            _this.addPlants(game_1.Game.randTable([0, 1, 2, 4, 5, 6], rand), rand);
        };
        this.populateChessboard = function (rand) { };
        this.populateCave = function (rand) {
            var factor = game_1.Game.rand(1, 36, rand);
            _this.addWallBlocks(rand);
            if (factor > 15)
                _this.addSpikeTraps(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
            var numEmptyTiles = _this.getEmptyTiles().length;
            var numEnemies = Math.ceil(numEmptyTiles * game_1.Game.randTable([0.25, 0.3, 0.35], rand));
            _this.addEnemies(numEnemies, rand);
            _this.addResources((numEmptyTiles - numEnemies) * game_1.Game.randTable([0.5, 0.6, 0.7, 0.8], rand), rand);
        };
        this.populateUpLadder = function (rand) {
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2], rand), rand);
            var cX = Math.floor(_this.roomX + _this.width / 2);
            var cY = Math.floor(_this.roomY + _this.height / 2);
        };
        this.populateDownLadder = function (rand) {
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2], rand), rand);
            var cX = Math.floor(_this.roomX + _this.width / 2);
            var cY = Math.floor(_this.roomY + _this.height / 2);
            _this.roomArray[cX][cY] = new downLadder_1.DownLadder(_this, _this.game, cX, cY);
        };
        this.populateRopeHole = function (rand) {
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2], rand), rand);
            var cX = Math.floor(_this.roomX + _this.width / 2);
            var cY = Math.floor(_this.roomY + _this.height / 2);
            var d = new downLadder_1.DownLadder(_this, _this.game, cX, cY);
            d.isRope = true;
            _this.roomArray[cX][cY] = d;
        };
        this.populateRopeCave = function (rand) {
            var cX = Math.floor(_this.roomX + _this.width / 2);
            var cY = Math.floor(_this.roomY + _this.height / 2);
            var upLadder = new upLadder_1.UpLadder(_this, _this.game, cX, cY);
            upLadder.isRope = true;
            _this.roomArray[cX][cY] = upLadder;
        };
        this.populateShop = function (rand) {
            _this.addTorches(2, rand);
            var cX = Math.floor(_this.roomX + _this.width / 2);
            var cY = Math.floor(_this.roomY + _this.height / 2);
            _this.enemies.push(new vendingMachine_1.VendingMachine(_this, _this.game, cX - 2, cY - 1, new shotgun_1.Shotgun(_this, 0, 0), rand));
            _this.enemies.push(new vendingMachine_1.VendingMachine(_this, _this.game, cX + 2, cY - 1, new heart_1.Heart(_this, 0, 0), rand));
            _this.enemies.push(new vendingMachine_1.VendingMachine(_this, _this.game, cX - 2, cY + 2, new armor_1.Armor(_this, 0, 0), rand));
            _this.enemies.push(new vendingMachine_1.VendingMachine(_this, _this.game, cX + 2, cY + 2, new spear_1.Spear(_this, 0, 0), rand));
        };
        this.populate = function (rand) {
            _this.name = "";
            switch (_this.type) {
                case RoomType.START:
                    _this.populateEmpty(rand);
                    _this.name = "FLOOR " + -_this.depth;
                    break;
                case RoomType.BOSS:
                    _this.populateBoss(rand);
                    _this.name = "BOSS";
                    break;
                case RoomType.DUNGEON:
                    _this.populateDungeon(rand);
                    break;
                case RoomType.BIGDUNGEON:
                    _this.populateBigDungeon(rand);
                    break;
                case RoomType.FOUNTAIN:
                    _this.populateFountain(rand);
                    break;
                case RoomType.COFFIN:
                    _this.populateCoffin(rand);
                    break;
                case RoomType.PUZZLE:
                    _this.populatePuzzle(rand);
                    break;
                case RoomType.SPIKECORRIDOR:
                    _this.populateSpikeCorridor(rand);
                    break;
                case RoomType.TREASURE:
                    _this.populateTreasure(rand);
                    break;
                case RoomType.CHESSBOARD: // TODO
                    _this.populateChessboard(rand);
                    break;
                case RoomType.KEYROOM:
                    _this.populateKeyRoom(rand);
                    break;
                case RoomType.GRASS:
                    _this.populateDungeon(rand);
                    break;
                case RoomType.BIGCAVE:
                    _this.populateCave(rand);
                case RoomType.CAVE:
                    _this.populateCave(rand);
                    break;
                case RoomType.UPLADDER:
                    _this.populateUpLadder(rand);
                    _this.name = "FLOOR " + -_this.depth;
                    break;
                case RoomType.DOWNLADDER:
                    _this.populateDownLadder(rand);
                    _this.name = "FLOOR " + -_this.depth;
                    break;
                case RoomType.ROPEHOLE:
                    _this.populateRopeHole(rand);
                    break;
                case RoomType.ROPECAVE:
                    _this.populateRopeCave(rand);
                    break;
                case RoomType.SHOP:
                    /* shop rates:
                     * 10 coal for an gold coin
                     * 1 gold for 10 coins
                     * 1 emerald for 100 coins
                     *
                     * shop items:
                     * 1 empty heart   4 ^ (maxHealth + maxHealth ^ 1.05 ^ maxHealth - 2.05) coins
                     * fill all hearts  1 coin
                     * better torch    5 ^ (torchLevel + 1.05 ^ torchLevel - 2.05) coins
                     * weapons
                     */
                    _this.populateShop(rand);
                    break;
                case RoomType.SPAWNER:
                    _this.populateSpawner(rand);
                    break;
            }
            _this.message = _this.name;
        };
        this.addDoor = function (x, y) {
            var d;
            var t = door_1.DoorType.DOOR;
            if (_this.type === RoomType.BOSS)
                t = door_1.DoorType.GUARDEDDOOR;
            if (_this.type === RoomType.KEYROOM)
                t = door_1.DoorType.LOCKEDDOOR;
            if (x === _this.roomX) {
                d = new door_1.Door(_this, _this.game, x, y, 1, t); //last argument, enum 0 is for locked
                _this.roomArray[x + 1][y] = new spawnfloor_1.SpawnFloor(_this, x + 1, y);
            }
            else if (x === _this.roomX + _this.width - 1) {
                d = new door_1.Door(_this, _this.game, x, y, 3, t);
                _this.roomArray[x - 1][y] = new spawnfloor_1.SpawnFloor(_this, x - 1, y);
            }
            else if (y === _this.roomY) {
                d = new door_1.Door(_this, _this.game, x, y, 0, t);
                _this.roomArray[x][y + 1] = new spawnfloor_1.SpawnFloor(_this, x, y + 1);
            }
            else if (y === _this.roomY + _this.height - 1) {
                d = new door_1.Door(_this, _this.game, x, y, 2, t);
                _this.roomArray[x][y - 1] = new spawnfloor_1.SpawnFloor(_this, x, y - 1);
            }
            _this.doors.push(d);
            if (_this.roomArray[d.x] == undefined) {
                console.log("UNDEFINED at " +
                    d.x +
                    " levelArray.length was " +
                    _this.roomArray.length);
                console.log("location " + location);
                console.log(_this.roomX, _this.roomY);
                console.log(_this.width, _this.height);
            }
            _this.roomArray[d.x][d.y] = d;
            return d;
        };
        this.exitLevel = function () {
            _this.particles.splice(0, _this.particles.length);
        };
        this.enterLevel = function (player) {
            player.moveSnap(_this.roomX + Math.floor(_this.width / 2), _this.roomY + Math.floor(_this.height / 2));
            _this.clearDeadStuff();
            _this.updateLighting();
            _this.entered = true;
            _this.message = _this.name;
        };
        this.enterLevelThroughDoor = function (player, door, side) {
            if (door instanceof door_1.Door && door.doorDir === door_2.DoorDir.North) {
                //if top door
                door.opened = true;
                player.moveNoSmooth(door.x, door.y + 1);
            }
            else if (door instanceof door_1.Door && door.doorDir === door_2.DoorDir.South) {
                //if bottom door
                player.moveNoSmooth(door.x, door.y - 1);
            }
            else if (door instanceof door_1.Door &&
                [door_2.DoorDir.East, door_2.DoorDir.West].includes(door.doorDir)) {
                // if side door
                player.moveNoSmooth(door.x + side, door.y);
            }
            _this.clearDeadStuff();
            _this.updateLighting();
            _this.entered = true;
            _this.message = _this.name;
        };
        this.enterLevelThroughLadder = function (player, ladder) {
            player.moveSnap(ladder.x, ladder.y + 1);
            _this.clearDeadStuff();
            _this.updateLighting();
            _this.entered = true;
            _this.message = _this.name;
        };
        this.getEmptyTiles = function () {
            var returnVal = [];
            for (var x = _this.roomX + 1; x < _this.roomX + _this.width - 1; x++) {
                for (var y = _this.roomY + 1; y < _this.roomY + _this.height - 1; y++) {
                    if (!_this.roomArray[x][y].isSolid() &&
                        !(_this.roomArray[x][y] instanceof spiketrap_1.SpikeTrap) &&
                        !(_this.roomArray[x][y] instanceof spawnfloor_1.SpawnFloor)) {
                        returnVal.push(_this.roomArray[x][y]);
                    }
                }
            }
            var _loop_1 = function (e) {
                returnVal = returnVal.filter(function (t) { return !e.pointIn(t.x, t.y); });
            };
            for (var _i = 0, _a = _this.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                _loop_1(e);
            }
            return returnVal;
        };
        this.getTile = function (x, y) {
            if (_this.roomArray[x])
                return _this.roomArray[x][y];
            else
                return undefined;
        };
        this.fadeLighting = function () {
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    if (Math.abs(_this.softVis[x][y] - _this.vis[x][y]) >= 0.02) {
                        if (_this.softVis[x][y] < _this.vis[x][y])
                            _this.softVis[x][y] += 0.02;
                        else if (_this.softVis[x][y] > _this.vis[x][y])
                            _this.softVis[x][y] -= 0.02;
                    }
                    //if (this.softVis[x][y] < 0.05) this.softVis[x][y] = 0;
                }
            }
        };
        this.updateLighting = function () {
            var oldVis = [];
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                oldVis[x] = [];
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    oldVis[x][y] = _this.vis[x][y];
                    _this.vis[x][y] = 1;
                    //if (this.visibilityArray[x][y] > LevelConstants.MIN_VISIBILITY)
                    //  this.visibilityArray[x][y] = 0;
                }
            }
            for (var p in _this.game.players) {
                if (_this === _this.game.rooms[_this.game.players[p].levelID]) {
                    for (var i = 0; i < 360; i += levelConstants_1.LevelConstants.LIGHTING_ANGLE_STEP) {
                        _this.castShadowsAtAngle(i, _this.game.players[p].x + 0.5, _this.game.players[p].y + 0.5, _this.game.players[p].sightRadius - _this.depth);
                    }
                }
            }
            for (var _i = 0, _a = _this.lightSources; _i < _a.length; _i++) {
                var l = _a[_i];
                for (var i = 0; i < 360; i += levelConstants_1.LevelConstants.LIGHTING_ANGLE_STEP) {
                    _this.castShadowsAtAngle(i, l.x, l.y, l.r);
                }
            }
            if (levelConstants_1.LevelConstants.SMOOTH_LIGHTING)
                _this.vis = _this.blur3x3(_this.vis, [
                    [1, 2, 1],
                    [2, 8, 2],
                    [1, 2, 1],
                ]);
            /*for (let x = 0; x < this.visibilityArray.length; x++) {
              for (let y = 0; y < this.visibilityArray[0].length; y++) {
                if (this.visibilityArray[x][y] < oldVisibilityArray[x][y]) {
                  this.visibilityArray[x][y] = Math.min(
                    oldVisibilityArray[x][y],
                    LevelConstants.MIN_VISIBILITY
                  );
                }
              }
            }*/
        };
        this.castShadowsAtAngle = function (angle, px, py, radius) {
            var dx = Math.cos((angle * Math.PI) / 180);
            var dy = Math.sin((angle * Math.PI) / 180);
            var onOpaqueSection = false;
            for (var i = 0; i < radius; i++) {
                if (Math.floor(px) < _this.roomX ||
                    Math.floor(px) >= _this.roomX + _this.width ||
                    Math.floor(py) < _this.roomY ||
                    Math.floor(py) >= _this.roomY + _this.height)
                    return; // we're outside the level
                var tile = _this.roomArray[Math.floor(px)][Math.floor(py)];
                if (tile.isOpaque()) {
                    if (i > 0)
                        onOpaqueSection = true;
                }
                else if (onOpaqueSection) {
                    return;
                }
                _this.vis[Math.floor(px)][Math.floor(py)] = Math.min(_this.vis[Math.floor(px)][Math.floor(py)], Math.min(i / radius, 1));
                px += dx;
                py += dy;
            }
        };
        this.blur3x3 = function (array, weights) {
            var blurredArray = [];
            for (var x = 0; x < array.length; x++) {
                blurredArray[x] = [];
                for (var y = 0; y < array[0].length; y++) {
                    if (array[x][y] === 0) {
                        blurredArray[x][y] = 0;
                        continue;
                    }
                    var total = 0;
                    var totalWeights = 0;
                    for (var xx = -1; xx <= 1; xx++) {
                        for (var yy = -1; yy <= 1; yy++) {
                            if (x + xx >= 0 &&
                                x + xx < array.length &&
                                y + yy >= 0 &&
                                y + yy < array[0].length) {
                                total += array[x + xx][y + yy] * weights[xx + 1][yy + 1];
                                totalWeights += weights[xx + 1][yy + 1];
                            }
                        }
                    }
                    blurredArray[x][y] = total / totalWeights;
                }
            }
            return blurredArray;
        };
        this.catchUp = function () {
            if (_this.turn === TurnState.computerTurn)
                _this.computerTurn(); // player skipped computer's turn, catch up
        };
        this.tick = function (player) {
            _this.enemies = _this.enemies.filter(function (e) { return !e.dead; });
            _this.updateLighting();
            for (var _i = 0, _a = _this.hitwarnings; _i < _a.length; _i++) {
                var h = _a[_i];
                h.tick();
            }
            for (var _b = 0, _c = _this.projectiles; _b < _c.length; _b++) {
                var p = _c[_b];
                p.tick();
            }
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    _this.roomArray[x][y].tick();
                }
            }
            _this.turn = TurnState.computerTurn;
            player.actionTab.setState(actionTab_1.ActionState.WAIT);
            //sets the action tab state to Ready
            _this.playerTurnTime = Date.now();
            _this.playerTicked = player;
        };
        this.update = function () {
            if (_this.turn == TurnState.computerTurn) {
                if (Date.now() - _this.playerTurnTime >=
                    levelConstants_1.LevelConstants.COMPUTER_TURN_DELAY) {
                    _this.computerTurn();
                }
            }
        };
        this.clearDeadStuff = function () {
            _this.enemies = _this.enemies.filter(function (e) { return !e.dead; });
            _this.projectiles = _this.projectiles.filter(function (p) { return !p.dead; });
            _this.hitwarnings = _this.hitwarnings.filter(function (h) { return !h.dead; });
            _this.particles = _this.particles.filter(function (p) { return !p.dead; });
        };
        this.computerTurn = function () {
            // take computer turn
            for (var _i = 0, _a = _this.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                e.tick();
            }
            _this.enemies = _this.enemies.filter(function (e) { return !e.dead; });
            for (var _b = 0, _c = _this.items; _b < _c.length; _b++) {
                var i = _c[_b];
                i.tick();
            }
            for (var _d = 0, _e = _this.hitwarnings; _d < _e.length; _d++) {
                var h = _e[_d];
                if (!_this.roomArray[h.x] ||
                    !_this.roomArray[h.x][h.y] ||
                    _this.roomArray[h.x][h.y].isSolid())
                    h.dead = true;
            }
            for (var _f = 0, _g = _this.projectiles; _f < _g.length; _f++) {
                var p = _g[_f];
                if (_this.roomArray[p.x][p.y].isSolid())
                    p.dead = true;
                for (var i in _this.game.players) {
                    if (_this.game.rooms[_this.game.players[i].levelID] === _this &&
                        p.x === _this.game.players[i].x &&
                        p.y === _this.game.players[i].y) {
                        p.hitPlayer(_this.game.players[i]);
                    }
                }
                for (var _h = 0, _j = _this.enemies; _h < _j.length; _h++) {
                    var e = _j[_h];
                    if (p.x === e.x && p.y === e.y) {
                        p.hitEnemy(e);
                    }
                }
            }
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    _this.roomArray[x][y].tickEnd();
                }
            }
            _this.enemies = _this.enemies.filter(function (e) { return !e.dead; }); // enemies may be killed by spiketrap
            _this.clearDeadStuff();
            _this.playerTicked.finishTick();
            _this.turn = TurnState.playerTurn;
        };
        this.draw = function (delta) {
            hitWarning_1.HitWarning.updateFrame(delta);
            _this.fadeLighting();
        };
        this.drawEntities = function (delta, skipLocalPlayer) {
            var tiles = [];
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    if (_this.softVis[x][y] < 1)
                        _this.roomArray[x][y].drawUnderPlayer(delta);
                    tiles.push(_this.roomArray[x][y]);
                }
            }
            var drawables = new Array();
            drawables = drawables.concat(tiles, _this.enemies, _this.hitwarnings, _this.projectiles, _this.particles, _this.items);
            for (var i in _this.game.players) {
                if (_this.game.rooms[_this.game.players[i].levelID] === _this) {
                    if (!(skipLocalPlayer &&
                        _this.game.players[i] === _this.game.players[_this.game.localPlayerID]))
                        drawables.push(_this.game.players[i]);
                }
            }
            drawables.sort(function (a, b) {
                if (a instanceof floor_1.Floor) {
                    return -1;
                }
                else if (b instanceof floor_1.Floor) {
                    return 1;
                }
                if (Math.abs(a.drawableY - b.drawableY) < 0.1) {
                    if (a instanceof player_1.Player) {
                        return 1;
                    }
                    else if (b instanceof player_1.Player) {
                        return -1;
                    }
                    else if (a instanceof enemy_1.Enemy) {
                        return 1;
                    }
                    else if (b instanceof enemy_1.Enemy) {
                        return -1;
                    }
                    else
                        return 0;
                }
                else {
                    return a.drawableY - b.drawableY;
                }
            });
            for (var _i = 0, drawables_1 = drawables; _i < drawables_1.length; _i++) {
                var d = drawables_1[_i];
                d.draw(delta);
            }
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    if (_this.softVis[x][y] < 1)
                        _this.roomArray[x][y].drawAbovePlayer(delta);
                }
            }
            for (var _a = 0, _b = _this.items; _a < _b.length; _a++) {
                var i = _b[_a];
                i.drawTopLayer(delta);
            }
        };
        this.drawShade = function (delta) {
            var bestSightRadius = 0;
            for (var p in _this.game.players) {
                if (_this.game.rooms[_this.game.players[p].levelID] === _this &&
                    _this.game.players[p].sightRadius > bestSightRadius) {
                    bestSightRadius = _this.game.players[p].sightRadius;
                }
            }
            var shadingAlpha = Math.max(0, Math.min(0.8, (2 * _this.depth) / bestSightRadius));
            if (gameConstants_1.GameConstants.ALPHA_ENABLED) {
                game_1.Game.ctx.globalAlpha = shadingAlpha;
                //Game.ctx.globalCompositeOperation = "lighten"
                //Game.ctx.globalCompositeOperation = "overlay"
                //Game.ctx.fillStyle = "#400a0e";
                game_1.Game.ctx.fillStyle = _this.shadeColor;
                game_1.Game.ctx.fillRect((_this.roomX - levelConstants_1.LevelConstants.SCREEN_W) * gameConstants_1.GameConstants.TILESIZE, (_this.roomY - levelConstants_1.LevelConstants.SCREEN_H) * gameConstants_1.GameConstants.TILESIZE, (_this.width + 2 * levelConstants_1.LevelConstants.SCREEN_W) * gameConstants_1.GameConstants.TILESIZE, (_this.height + 2 * levelConstants_1.LevelConstants.SCREEN_H) * gameConstants_1.GameConstants.TILESIZE);
                game_1.Game.ctx.globalAlpha = 1.0;
                game_1.Game.ctx.globalCompositeOperation = "source-over";
            }
        };
        this.drawOverShade = function (delta) {
            for (var _i = 0, _a = _this.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                e.drawTopLayer(delta); // health bars
            }
            for (var _b = 0, _c = _this.projectiles; _b < _c.length; _b++) {
                var p = _c[_b];
                p.drawTopLayer(delta);
            }
            for (var _d = 0, _e = _this.hitwarnings; _d < _e.length; _d++) {
                var h = _e[_d];
                h.drawTopLayer(delta);
            }
            // draw over dithered shading
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    _this.roomArray[x][y].drawAboveShading(delta);
                }
            }
        };
        // for stuff rendered on top of the player
        this.drawTopLayer = function (delta) {
            // gui stuff
            // room name
            var old = game_1.Game.ctx.font;
            game_1.Game.ctx.font = gameConstants_1.GameConstants.SCRIPT_FONT_SIZE + "px Script";
            game_1.Game.ctx.fillStyle = levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR;
            game_1.Game.fillText(_this.message, gameConstants_1.GameConstants.WIDTH / 2 - game_1.Game.measureText(_this.name).width / 2, 5);
            game_1.Game.ctx.font = old;
        };
        this.game = game;
        this.roomX = x; //Math.floor(- this.width / 2);
        this.roomY = y; //Math.floor(- this.height / 2);
        this.width = w;
        this.height = h;
        this.type = type;
        this.depth = depth;
        this.mapGroup = mapGroup;
        this.entered = false;
        this.turn = TurnState.playerTurn;
        this.playerTurnTime = Date.now();
        this.items = Array();
        this.projectiles = Array();
        this.hitwarnings = Array();
        this.particles = Array();
        this.doors = Array();
        this.enemies = Array();
        this.lightSources = Array();
        this.walls = Array();
        this.roomArray = [];
        for (var x_2 = this.roomX; x_2 < this.roomX + this.width; x_2++) {
            this.roomArray[x_2] = [];
        }
        this.vis = [];
        this.softVis = [];
        for (var x_3 = this.roomX; x_3 < this.roomX + this.width; x_3++) {
            this.vis[x_3] = [];
            this.softVis[x_3] = [];
            for (var y_2 = this.roomY; y_2 < this.roomY + this.height; y_2++) {
                this.vis[x_3][y_2] = 1;
                this.softVis[x_3][y_2] = 1;
            }
        }
        this.skin = tile_1.SkinType.DUNGEON;
        if (this.type === RoomType.ROPECAVE || this.type === RoomType.CAVE)
            this.skin = tile_1.SkinType.CAVE;
        this.buildEmptyRoom();
    }
    Room.prototype.pointInside = function (x, y, rX, rY, rW, rH) {
        if (x < rX || x >= rX + rW)
            return false;
        if (y < rY || y >= rY + rH)
            return false;
        return true;
    };
    Room.prototype.buildEmptyRoom = function () {
        // fill in wall and floor
        for (var x = this.roomX; x < this.roomX + this.width; x++) {
            for (var y = this.roomY; y < this.roomY + this.height; y++) {
                if (this.pointInside(x, y, this.roomX + 1, this.roomY + 1, this.width - 2, this.height - 2)) {
                    this.roomArray[x][y] = new floor_1.Floor(this, x, y);
                }
                else {
                    this.roomArray[x][y] = new wall_1.Wall(this, x, y);
                    this.walls.push;
                }
            }
        }
    };
    Room.prototype.addWallBlocks = function (rand) {
        var numBlocks = game_1.Game.randTable([0, 0, 1, 1, 2, 2, 2, 2, 3], rand);
        if (this.width > 8 && rand() > 0.5)
            numBlocks *= 4;
        for (var i = 0; i < numBlocks; i++) {
            var blockW = Math.min(game_1.Game.randTable([2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 5], rand), this.width - 4);
            var blockH = Math.min(blockW + game_1.Game.rand(-2, 2, rand), this.height - 4);
            var x = game_1.Game.rand(this.roomX + 2, this.roomX + this.width - blockW - 2, rand);
            var y = game_1.Game.rand(this.roomY + 2, this.roomY + this.height - blockH - 2, rand);
            for (var xx = x; xx < x + blockW; xx++) {
                for (var yy = y; yy < y + blockH; yy++) {
                    var w = new wall_1.Wall(this, xx, yy);
                    this.roomArray[xx][yy] = w;
                    this.walls.push(w);
                }
            }
        }
    };
    Room.prototype.addFingers = function (rand) { };
    Room.prototype.addTorches = function (numTorches, rand) {
        var walls = [];
        for (var xx = this.roomX + 1; xx < this.roomX + this.width - 2; xx++) {
            for (var yy = this.roomY; yy < this.roomY + this.height - 1; yy++) {
                if (this.roomArray[xx][yy] instanceof wall_1.Wall &&
                    !(this.roomArray[xx][yy + 1] instanceof wall_1.Wall)) {
                    walls.push(this.roomArray[xx][yy]);
                }
            }
        }
        for (var i = 0; i < numTorches; i++) {
            var t = void 0, x = void 0, y = void 0;
            if (walls.length == 0)
                return;
            t = walls.splice(game_1.Game.rand(0, walls.length - 1, rand), 1)[0];
            x = t.x;
            y = t.y;
            this.roomArray[x][y] = new wallTorch_1.WallTorch(this, x, y);
        }
    };
    Room.prototype.addChasms = function (rand) {
        // add chasms
        var w = game_1.Game.rand(2, 4, rand);
        var h = game_1.Game.rand(2, 4, rand);
        var xmin = this.roomX + 2;
        var xmax = this.roomX + this.width - w - 2;
        var ymin = this.roomY + 2;
        var ymax = this.roomY + this.height - h - 2;
        if (xmax < xmin || ymax < ymin)
            return;
        var x = game_1.Game.rand(xmin, xmax, rand);
        var y = game_1.Game.rand(ymin, ymax, rand);
        for (var xx = x - 1; xx < x + w + 1; xx++) {
            for (var yy = y - 1; yy < y + h + 1; yy++) {
                // add a floor border
                if (xx === x - 1 || xx === x + w || yy === y - 1 || yy === y + h) {
                    if (!(this.roomArray[xx][yy] instanceof spawnfloor_1.SpawnFloor))
                        this.roomArray[xx][yy] = new floor_1.Floor(this, xx, yy);
                }
                else
                    this.roomArray[xx][yy] = new chasm_1.Chasm(this, xx, yy, xx === x, xx === x + w - 1, yy === y, yy === y + h - 1);
            }
        }
    };
    Room.prototype.addChests = function (numChests, rand) {
        // add chests
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numChests; i++) {
            var t = void 0, x = void 0, y = void 0;
            if (tiles.length == 0)
                return;
            t = tiles.splice(game_1.Game.rand(0, tiles.length - 1, rand), 1)[0];
            x = t.x;
            y = t.y;
            this.enemies.push(new chest_1.Chest(this, this.game, x, y, rand));
        }
    };
    Room.prototype.addSpikeTraps = function (numSpikes, rand) {
        // add spikes
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numSpikes; i++) {
            var t = tiles.splice(game_1.Game.rand(0, tiles.length - 1, rand), 1)[0];
            if (tiles.length == 0)
                return;
            var x = t.x;
            var y = t.y;
            this.roomArray[x][y] = new spiketrap_1.SpikeTrap(this, x, y);
        }
    };
    Room.prototype.addSpikes = function (numSpikes, rand) {
        // add spikes
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numSpikes; i++) {
            var t = tiles.splice(game_1.Game.rand(0, tiles.length - 1, rand), 1)[0];
            if (tiles.length == 0)
                return;
            var x = t.x;
            var y = t.y;
            this.roomArray[x][y] = new spike_1.Spike(this, x, y);
        }
    };
    Room.prototype.addEnemies = function (numEnemies, rand) {
        var _this = this;
        var tiles = this.getEmptyTiles();
        var _loop_2 = function (i) {
            var t = tiles.splice(game_1.Game.rand(0, tiles.length - 1, rand), 1)[0];
            if (tiles.length == 0)
                return { value: void 0 };
            var x = t.x;
            var y = t.y;
            var tables = {
                0: [1, 2, 3, 3, 4],
                1: [1, 1, 3, 3, 3, 2, 2],
                2: [1, 1, 2, 2, 3, 3, 4],
                3: [1, 1, 1, 2, 3, 3, 3, 4, 4, 5],
                4: [1, 2, 3, 4, 5, 6, 7],
                5: [1, 2, 3, 4, 5, 6, 7, 8],
                6: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                7: [1, 2, 3, 4, 5, 6, 7],
            };
            var max_depth_table = 7;
            var d = Math.min(this_1.depth, max_depth_table);
            if (tables[d] && tables[d].length > 0) {
                var addEnemy = function (enemy) {
                    var _loop_3 = function (xx) {
                        var _loop_4 = function (yy) {
                            if (!_this.getEmptyTiles().some(function (tt) { return tt.x === x + xx && tt.y === y + yy; })) {
                                numEnemies++; // extra loop iteration since we're throwing out this point
                                return { value: false };
                            }
                        };
                        for (var yy = 0; yy < enemy.h; yy++) {
                            var state_3 = _loop_4(yy);
                            if (typeof state_3 === "object")
                                return state_3;
                        }
                    };
                    // adds an enemy if it doesn't overlap any other enemies
                    for (var xx = 0; xx < enemy.w; xx++) {
                        var state_2 = _loop_3(xx);
                        if (typeof state_2 === "object")
                            return state_2.value;
                    }
                    _this.enemies.push(enemy);
                    return true;
                };
                var type = game_1.Game.randTable(tables[d], rand);
                switch (type) {
                    case 1:
                        addEnemy(new slimeEnemy_1.SlimeEnemy(this_1, this_1.game, x, y, rand));
                        break;
                    case 2:
                        addEnemy(new knightEnemy_1.KnightEnemy(this_1, this_1.game, x, y, rand));
                        break;
                    case 3:
                        addEnemy(new zombieEnemy_1.ZombieEnemy(this_1, this_1.game, x, y, rand));
                        break;
                    case 4:
                        addEnemy(new skullEnemy_1.SkullEnemy(this_1, this_1.game, x, y, rand));
                        break;
                    case 5:
                        addEnemy(new wizardEnemy_1.WizardEnemy(this_1, this_1.game, x, y, rand));
                        break;
                    case 6:
                        addEnemy(new chargeEnemy_1.ChargeEnemy(this_1, this_1.game, x, y));
                        break;
                    case 7:
                        addEnemy(new spawner_1.Spawner(this_1, this_1.game, x, y, rand));
                        break;
                    case 8:
                        addEnemy(new bishopEnemy_1.BishopEnemy(this_1, this_1.game, x, y, rand));
                        break;
                    case 9:
                        addEnemy(new armoredzombieEnemy_1.ArmoredzombieEnemy(this_1, this_1.game, x, y, rand));
                        break;
                    case 10:
                        if (addEnemy(new bigSkullEnemy_1.BigSkullEnemy(this_1, this_1.game, x, y, rand))) {
                            // clear out some space
                            for (var xx = 0; xx < 2; xx++) {
                                for (var yy = 0; yy < 2; yy++) {
                                    this_1.roomArray[x + xx][y + yy] = new floor_1.Floor(this_1, x + xx, y + yy); // remove any walls
                                }
                            }
                        }
                        break;
                }
            }
        };
        var this_1 = this;
        for (var i = 0; i < numEnemies; i++) {
            var state_1 = _loop_2(i);
            if (typeof state_1 === "object")
                return state_1.value;
        }
    };
    Room.prototype.addObstacles = function (numObstacles, rand) {
        // add crates/barrels
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numObstacles; i++) {
            var t = tiles.splice(game_1.Game.rand(0, tiles.length - 1, rand), 1)[0];
            if (tiles.length == 0)
                return;
            var x = t.x;
            var y = t.y;
            switch (game_1.Game.randTable([1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 4], rand)) {
                case 1:
                    this.enemies.push(new crate_1.Crate(this, this.game, x, y));
                    break;
                case 2:
                    this.enemies.push(new barrel_1.Barrel(this, this.game, x, y));
                    break;
                case 3:
                    this.enemies.push(new tombStone_1.TombStone(this, this.game, x, y, 1, rand));
                    break;
                case 4:
                    this.enemies.push(new tombStone_1.TombStone(this, this.game, x, y, 0, rand));
                    break;
                //case 5:
                //this.enemies.push(new TombStone(this, this.game, x, y));
                //break;
            }
        }
    };
    Room.prototype.addPlants = function (numPlants, rand) {
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numPlants; i++) {
            var t = tiles.splice(game_1.Game.rand(0, tiles.length - 1, rand), 1)[0];
            if (tiles.length == 0)
                return;
            var x = t.x;
            var y = t.y;
            var r = rand();
            if (r <= 0.45)
                this.enemies.push(new pottedPlant_1.PottedPlant(this, this.game, x, y, random_1.Random.rand));
            else if (r <= 0.65)
                this.enemies.push(new pot_1.Pot(this, this.game, x, y));
            else if (r <= 0.75)
                this.enemies.push(new rockResource_1.Rock(this, this.game, x, y));
            else if (r <= 0.97)
                this.enemies.push(new mushrooms_1.Mushrooms(this, this.game, x, y));
            else
                this.enemies.push(new chest_1.Chest(this, this.game, x, y, rand));
        }
    };
    Room.prototype.addResources = function (numResources, rand) {
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numResources; i++) {
            var t = tiles.splice(game_1.Game.rand(0, tiles.length - 1, rand), 1)[0];
            if (tiles.length == 0)
                return;
            var x = t.x;
            var y = t.y;
            var r = rand();
            if (r <= (10 - Math.pow(this.depth, 3)) / 10)
                this.enemies.push(new coalResource_1.CoalResource(this, this.game, x, y));
            else if (r <= (10 - Math.pow((this.depth - 2), 3)) / 10)
                this.enemies.push(new goldResource_1.GoldResource(this, this.game, x, y));
            else
                this.enemies.push(new emeraldResource_1.EmeraldResource(this, this.game, x, y));
        }
    };
    Room.prototype.addVendingMachine = function (rand) {
        var t = this.getEmptyTiles().sort(function () { return 0.5 - random_1.Random.rand(); })[0];
        var x = t.x;
        var y = t.y;
        var type = game_1.Game.randTable([1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6], rand);
        switch (type) {
            case 1:
                this.enemies.push(new vendingMachine_1.VendingMachine(this, this.game, x, y, new heart_1.Heart(this, 0, 0), rand));
                break;
            case 2:
                this.enemies.push(new vendingMachine_1.VendingMachine(this, this.game, x, y, new lantern_1.Lantern(this, 0, 0), rand));
                break;
            case 3:
                this.enemies.push(new vendingMachine_1.VendingMachine(this, this.game, x, y, new armor_1.Armor(this, 0, 0), rand));
                break;
            case 4:
                this.enemies.push(new vendingMachine_1.VendingMachine(this, this.game, x, y, new dualdagger_1.DualDagger(this, 0, 0), rand));
                break;
            case 5:
                this.enemies.push(new vendingMachine_1.VendingMachine(this, this.game, x, y, new spear_1.Spear(this, 0, 0), rand));
                break;
            case 6:
                this.enemies.push(new vendingMachine_1.VendingMachine(this, this.game, x, y, new shotgun_1.Shotgun(this, 0, 0), rand));
                break;
        }
    };
    return Room;
}());
exports.Room = Room;


/***/ }),

/***/ "./src/serverAddress.ts":
/*!******************************!*\
  !*** ./src/serverAddress.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ServerAddress = void 0;
exports.ServerAddress = {
    address: "witch-roguelike-server.azurewebsites.net"
    //address: "ws://localhost:9000"
};


/***/ }),

/***/ "./src/sound.ts":
/*!**********************!*\
  !*** ./src/sound.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Sound = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var Sound = /** @class */ (function () {
    function Sound() {
    }
    Sound.loadSounds = function () {
        Sound.playerStoneFootsteps = new Array();
        [1, 2, 3].forEach(function (i) {
            return Sound.playerStoneFootsteps.push(new Audio("res/SFX/footsteps/stone/footstep" + i + ".wav"));
        });
        for (var _i = 0, _a = Sound.playerStoneFootsteps; _i < _a.length; _i++) {
            var f = _a[_i];
            f.volume = 1.0;
        }
        Sound.enemyFootsteps = new Array();
        [1, 2, 3, 4, 5].forEach(function (i) {
            return Sound.enemyFootsteps.push(new Audio("res/SFX/footsteps/enemy/enemyfootstep" + i + ".wav"));
        });
        for (var _b = 0, _c = Sound.enemyFootsteps; _b < _c.length; _b++) {
            var f = _c[_b];
            f.volume = 1.0;
        }
        Sound.hitSounds = new Array();
        [1, 2, 3, 4].forEach(function (i) {
            return Sound.hitSounds.push(new Audio("res/SFX/attacks/swing" + i + ".wav"));
        });
        for (var _d = 0, _e = Sound.hitSounds; _d < _e.length; _d++) {
            var f = _e[_d];
            (f.volume = 0), f.load;
            //f.play();
        }
        Sound.enemySpawnSound = new Audio("res/SFX/attacks/enemyspawn.wav");
        Sound.enemySpawnSound.volume = 0.7;
        Sound.chestSounds = new Array();
        [1, 2, 3].forEach(function (i) {
            return Sound.chestSounds.push(new Audio("res/SFX/chest/chest" + i + ".wav"));
        });
        for (var _f = 0, _g = Sound.chestSounds; _f < _g.length; _f++) {
            var f = _g[_f];
            f.volume = 0.7;
        }
        Sound.coinPickupSounds = new Array();
        [1, 2, 3, 4].forEach(function (i) {
            return Sound.coinPickupSounds.push(new Audio("res/SFX/items/coins" + i + ".wav"));
        });
        for (var _h = 0, _j = Sound.coinPickupSounds; _h < _j.length; _h++) {
            var f = _j[_h];
            f.volume = 1.0;
        }
        Sound.miningSounds = new Array();
        [1, 2, 3, 4].forEach(function (i) {
            return Sound.miningSounds.push(new Audio("res/SFX/resources/Pickaxe" + i + ".wav"));
        });
        for (var _k = 0, _l = Sound.miningSounds; _k < _l.length; _k++) {
            var f = _l[_k];
            f.volume = 0.7;
        }
        Sound.hurtSounds = new Array();
        [1].forEach(function (i) {
            return Sound.hurtSounds.push(new Audio("res/SFX/attacks/hit.wav"));
        });
        for (var _m = 0, _o = Sound.hurtSounds; _m < _o.length; _m++) {
            var f = _o[_m];
            f.volume = 0.7;
        }
        Sound.genericPickupSound = new Audio("res/SFX/items/pickup.wav");
        Sound.genericPickupSound.volume = 1.0;
        Sound.breakRockSound = new Audio("res/SFX/resources/rockbreak.wav");
        Sound.breakRockSound.volume = 1.0;
        Sound.pushSounds = new Array();
        [1, 2].forEach(function (i) {
            return Sound.pushSounds.push(new Audio("res/SFX/pushing/push" + i + ".wav"));
        });
        for (var _p = 0, _q = Sound.pushSounds; _p < _q.length; _p++) {
            var f = _q[_p];
            f.volume = 1.0;
        }
        Sound.healSound = new Audio("res/SFX/items/powerup1.wav");
        Sound.healSound.volume = 0.5;
        Sound.music = new Audio("res/bewitched.mp3");
    };
    Sound.playerStoneFootstep = function () {
        var f = game_1.Game.randTable(Sound.playerStoneFootsteps, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.enemyFootstep = function () {
        var f = game_1.Game.randTable(Sound.enemyFootsteps, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.hit = function () {
        var f = game_1.Game.randTable(Sound.hitSounds, Math.random);
        f.play();
        f.currentTime = 0;
        f = game_1.Game.randTable(Sound.hurtSounds, Math.random);
        f.volume = 0.5;
        f.play();
        f.currentTime = 0;
        f.volume = 1.0;
    };
    Sound.hurt = function () {
        var f = game_1.Game.randTable(Sound.hurtSounds, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.enemySpawn = function () {
        Sound.enemySpawnSound.play();
        Sound.enemySpawnSound.currentTime = 0;
    };
    Sound.chest = function () {
        var f = game_1.Game.randTable(Sound.chestSounds, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.pickupCoin = function () {
        var f = game_1.Game.randTable(Sound.coinPickupSounds, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.mine = function () {
        var f = game_1.Game.randTable(Sound.miningSounds, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.breakRock = function () {
        Sound.breakRockSound.play();
        Sound.breakRockSound.currentTime = 0;
    };
    Sound.heal = function () {
        Sound.healSound.play();
        Sound.healSound.currentTime = 0;
    };
    Sound.genericPickup = function () {
        Sound.genericPickupSound.play();
        Sound.genericPickupSound.currentTime = 0;
    };
    Sound.push = function () {
        var f = game_1.Game.randTable(Sound.pushSounds, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.playMusic = function () {
        Sound.music.addEventListener("ended", function () {
            Sound.music.currentTime = 0;
            Sound.music.play();
        }, false);
        //Sound.music.play();
    };
    return Sound;
}());
exports.Sound = Sound;


/***/ }),

/***/ "./src/textbox.ts":
/*!************************!*\
  !*** ./src/textbox.ts ***!
  \************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TextBox = void 0;
var TextBox = /** @class */ (function () {
    function TextBox() {
        var _this = this;
        this.allowedCharacters = "all";
        this.setEnterCallback = function (callback) {
            _this.enterCallback = callback;
        };
        this.setEscapeCallback = function (callback) {
            _this.escapeCallback = callback;
        };
        this.clear = function () {
            _this.text = "";
            _this.cursor = 0;
        };
        this.handleKeyPress = function (key) {
            var fontHas = "abcdefghijklmnopqrstuvwxyz1234567890,.!?:'()[]%-/".split("");
            if (key.length === 1) {
                key = key.toLowerCase();
                if (fontHas.includes(key)) {
                    if (_this.allowedCharacters === "all" ||
                        _this.allowedCharacters.includes(key)) {
                        _this.text =
                            _this.text.substring(0, _this.cursor) +
                                key +
                                _this.text.substring(_this.cursor, _this.text.length);
                        _this.cursor += 1;
                    }
                }
                return;
            }
            else {
                switch (key) {
                    case "Backspace":
                        _this.text =
                            _this.text.substring(0, _this.cursor - 1) +
                                _this.text.substring(_this.cursor, _this.text.length);
                        _this.cursor = Math.max(0, _this.cursor - 1);
                        break;
                    case "Delete":
                        _this.text =
                            _this.text.substring(0, _this.cursor) +
                                _this.text.substring(_this.cursor + 1, _this.text.length);
                        break;
                    case "ArrowLeft":
                        _this.cursor = Math.max(0, _this.cursor - 1);
                        break;
                    case "ArrowRight":
                        _this.cursor = Math.min(_this.text.length, _this.cursor + 1);
                        break;
                    case "Enter":
                        _this.enterCallback();
                        break;
                    case "Escape":
                        _this.escapeCallback();
                        break;
                }
            }
        };
        this.text = "";
        this.cursor = 0;
        this.enterCallback = function () { };
        this.escapeCallback = function () { };
    }
    return TextBox;
}());
exports.TextBox = TextBox;


/***/ }),

/***/ "./src/tile/bones.ts":
/*!***************************!*\
  !*** ./src/tile/bones.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Bones = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var floor_1 = __webpack_require__(/*! ./floor */ "./src/tile/floor.ts");
var Bones = /** @class */ (function (_super) {
    __extends(Bones, _super);
    function Bones() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.draw = function (delta) {
            game_1.Game.drawTile(7, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        return _this;
    }
    return Bones;
}(floor_1.Floor));
exports.Bones = Bones;


/***/ }),

/***/ "./src/tile/button.ts":
/*!****************************!*\
  !*** ./src/tile/button.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Button = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var Button = /** @class */ (function (_super) {
    __extends(Button, _super);
    function Button(level, x, y, linkedDoor) {
        var _this = _super.call(this, level, x, y) || this;
        _this.press = function () {
            _this.pressed = true;
            _this.linkedDoor.opened = true;
        };
        _this.unpress = function () {
            _this.pressed = false;
            _this.linkedDoor.opened = false;
        };
        /*onCollide = (player: Player) => {
          this.press();
        };
      
        onCollideEnemy = (enemy: Enemy) => {
          this.press();
        };*/
        _this.tickEnd = function () {
            _this.unpress();
            for (var i in _this.level.game.players) {
                if (_this.level.game.players[i].x === _this.x && _this.level.game.players[i].y === _this.y)
                    _this.press();
            }
            for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e.x === _this.x && e.y === _this.y)
                    _this.press();
            }
        };
        _this.draw = function (delta) {
            game_1.Game.drawTile(1, 0, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            if (_this.pressed)
                game_1.Game.drawTile(18, 0, 1, 1, _this.x, _this.y, _this.w, _this.h, _this.level.shadeColor, _this.shadeAmount());
            else
                game_1.Game.drawTile(17, 0, 1, 1, _this.x, _this.y, _this.w, _this.h, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.w = 1;
        _this.h = 1;
        _this.pressed = false;
        _this.turnsSincePressed = 1;
        _this.linkedDoor = linkedDoor;
        return _this;
    }
    return Button;
}(tile_1.Tile));
exports.Button = Button;


/***/ }),

/***/ "./src/tile/chasm.ts":
/*!***************************!*\
  !*** ./src/tile/chasm.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Chasm = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var Chasm = /** @class */ (function (_super) {
    __extends(Chasm, _super);
    function Chasm(level, x, y, leftEdge, rightEdge, topEdge, bottomEdge) {
        var _this = _super.call(this, level, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.draw = function (delta) {
            if (_this.topEdge)
                game_1.Game.drawTile(22, 0, 1, 2, _this.x, _this.y, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            game_1.Game.drawTile(_this.tileX, _this.tileY, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.tileX = _this.skin === 1 ? 24 : 20;
        _this.tileY = 1;
        if (leftEdge)
            _this.tileX--;
        else if (rightEdge)
            _this.tileX++;
        if (topEdge)
            _this.tileY--;
        else if (bottomEdge)
            _this.tileY++;
        _this.topEdge = topEdge;
        return _this;
    }
    return Chasm;
}(tile_1.Tile));
exports.Chasm = Chasm;


/***/ }),

/***/ "./src/tile/coffinTile.ts":
/*!********************************!*\
  !*** ./src/tile/coffinTile.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CoffinTile = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var CoffinTile = /** @class */ (function (_super) {
    __extends(CoffinTile, _super);
    function CoffinTile(level, x, y, subTileY) {
        var _this = _super.call(this, level, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.draw = function (delta) {
            if (_this.subTileY === 0) {
                game_1.Game.drawTile(0, 5, 1, 1, _this.x - 1, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(1, 5, 1, 1, _this.x, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(2, 5, 1, 1, _this.x + 1, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(0, 6, 1, 1, _this.x - 1, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(1, 6, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(2, 6, 1, 1, _this.x + 1, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            }
            else {
                game_1.Game.drawTile(0, 7, 1, 1, _this.x - 1, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(1, 7, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(2, 7, 1, 1, _this.x + 1, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.subTileY = subTileY;
        return _this;
    }
    return CoffinTile;
}(tile_1.Tile));
exports.CoffinTile = CoffinTile;


/***/ }),

/***/ "./src/tile/door.ts":
/*!**************************!*\
  !*** ./src/tile/door.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Door = exports.DoorType = exports.DoorDir = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var enemy_1 = __webpack_require__(/*! ../enemy/enemy */ "./src/enemy/enemy.ts");
var key_1 = __webpack_require__(/*! ../item/key */ "./src/item/key.ts");
var DoorDir;
(function (DoorDir) {
    DoorDir[DoorDir["North"] = 0] = "North";
    DoorDir[DoorDir["East"] = 1] = "East";
    DoorDir[DoorDir["South"] = 2] = "South";
    DoorDir[DoorDir["West"] = 3] = "West";
})(DoorDir = exports.DoorDir || (exports.DoorDir = {}));
var DoorType;
(function (DoorType) {
    DoorType[DoorType["DOOR"] = 0] = "DOOR";
    DoorType[DoorType["LOCKEDDOOR"] = 1] = "LOCKEDDOOR";
    DoorType[DoorType["GUARDEDDOOR"] = 2] = "GUARDEDDOOR";
})(DoorType = exports.DoorType || (exports.DoorType = {}));
var Door = /** @class */ (function (_super) {
    __extends(Door, _super);
    function Door(level, game, x, y, dir, doorType) {
        var _this = _super.call(this, level, x, y) || this;
        _this.canUnlock = function (player) {
            if (_this.DoorType === DoorType.LOCKEDDOOR) {
                var k = player.inventory.hasItem(key_1.Key);
                if (k !== null) {
                    _this.game.pushMessage("You use the key to unlock the door.");
                    return true;
                }
                else
                    _this.game.pushMessage("The door is locked tightly and won't budge.");
                return false;
            }
            if (_this.DoorType === DoorType.GUARDEDDOOR) {
                var inRoom = _this.game.level.enemies.filter(function (enemy) { return enemy.entityType === enemy_1.EntityType.Enemy; });
                if (inRoom.length === 0) {
                    _this.game.pushMessage("The foes have been slain and the door allows you passage.");
                    return true;
                }
                else
                    _this.game.pushMessage("There are still remaining foes guarding this door...");
                return false;
            }
        };
        _this.unlock = function (player) {
            if (_this.DoorType === DoorType.LOCKEDDOOR) {
                var k = player.inventory.hasItem(key_1.Key);
                if (k !== null) {
                    // remove key
                    player.inventory.removeItem(k);
                    _this.locked = false;
                    _this.DoorType = DoorType.DOOR;
                }
            }
            if (_this.DoorType === DoorType.GUARDEDDOOR) {
                _this.locked = false;
                _this.level.doors.forEach(function (door) {
                    door.DoorType = DoorType.DOOR;
                    door.locked = false;
                });
            }
            else {
            }
        };
        _this.link = function (other) {
            _this.linkedDoor = other;
        };
        _this.isSolid = function () {
            console.log(_this.DoorType);
            if (_this.locked) {
                return true;
            }
            else
                false;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.onCollide = function (player) {
            _this.opened = true;
            _this.linkedDoor.opened = true;
            if (_this.doorDir === DoorDir.North || _this.doorDir === DoorDir.South) {
                _this.game.changeLevelThroughDoor(player, _this.linkedDoor);
            }
            else
                _this.game.changeLevelThroughDoor(player, _this.linkedDoor, _this.linkedDoor.level.roomX - _this.level.roomX > 0 ? 1 : -1);
            _this.linkedDoor.locked = false;
            _this.linkedDoor.DoorType = DoorType.DOOR;
        };
        _this.draw = function (delta) {
            if (_this.doorDir === DoorDir.North) {
                //if top door
                if (_this.opened)
                    game_1.Game.drawTile(6, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                else
                    game_1.Game.drawTile(3, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            }
            if (_this.doorDir !== DoorDir.North)
                //if not top door
                game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.drawAbovePlayer = function (delta) {
            if (_this.doorDir === DoorDir.North) {
                //if top door
                if (!_this.opened)
                    game_1.Game.drawTile(13, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                else
                    game_1.Game.drawTile(14, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            }
            if (_this.doorDir !== DoorDir.North) {
            }
        };
        _this.drawAboveShading = function (delta) {
            var icon = 2;
            var xOffset = 0;
            if (_this.DoorType === DoorType.GUARDEDDOOR)
                (icon = 9), (xOffset = 1 / 32);
            if (_this.DoorType === DoorType.LOCKEDDOOR)
                (icon = 10), (xOffset = 1 / 32);
            if (_this.doorDir === DoorDir.North) {
                //if top door
                game_1.Game.drawFX(icon, 2, 1, 1, _this.x + xOffset, _this.y - 1.25 + 0.125 * Math.sin(0.006 * Date.now()), 1, 1);
            }
            else {
                game_1.Game.drawFX(icon, 2, 1, 1, _this.x + xOffset, _this.y - 1.25 + 0.125 * Math.sin(0.006 * Date.now()), 1, 1); //if not top door
            }
        };
        _this.game = game;
        _this.opened = false;
        _this.doorDir = dir;
        _this.DoorType = doorType;
        _this.locked = false;
        if (_this.DoorType === DoorType.GUARDEDDOOR) {
            _this.locked = true;
        }
        if (_this.DoorType === DoorType.LOCKEDDOOR) {
            _this.locked = true;
        }
        return _this;
    }
    return Door;
}(tile_1.Tile));
exports.Door = Door;


/***/ }),

/***/ "./src/tile/downLadder.ts":
/*!********************************!*\
  !*** ./src/tile/downLadder.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DownLadder = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var upLadder_1 = __webpack_require__(/*! ./upLadder */ "./src/tile/upLadder.ts");
var DownLadder = /** @class */ (function (_super) {
    __extends(DownLadder, _super);
    function DownLadder(level, game, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.isRope = false;
        _this.generate = function () {
            // called by Game during transition
            if (!_this.linkedLevel) {
                _this.linkedLevel = _this.game.levelgen.generate(_this.game, _this.level.depth + (_this.isRope ? 0 : 1), _this.isRope);
                for (var x = _this.linkedLevel.roomX; x < _this.linkedLevel.roomX + _this.linkedLevel.width; x++) {
                    for (var y = _this.linkedLevel.roomY; y < _this.linkedLevel.roomY + _this.linkedLevel.height; y++) {
                        var tile = _this.linkedLevel.roomArray[x][y];
                        if (tile instanceof upLadder_1.UpLadder && tile.isRope)
                            tile.linkedLevel = _this.level;
                    }
                }
            }
        };
        _this.onCollide = function (player) {
            if (_this.isRope)
                _this.game.changeLevelThroughLadder(player, _this);
            else {
                var allPlayersHere = true;
                for (var i in _this.game.players) {
                    if (_this.game.rooms[_this.game.players[i].levelID] !== _this.level || _this.game.players[i].x !== _this.x || _this.game.players[i].y !== _this.y) {
                        allPlayersHere = false;
                    }
                }
                if (allPlayersHere) {
                    _this.generate();
                    for (var i in _this.game.players) {
                        _this.game.changeLevelThroughLadder(_this.game.players[i], _this);
                    }
                }
                else {
                    if (player === _this.game.players[_this.game.localPlayerID])
                        _this.game.chat.push(new game_1.ChatMessage('all players must be present'));
                }
            }
        };
        _this.draw = function (delta) {
            var xx = 4;
            if (_this.isRope)
                xx = 16;
            game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            game_1.Game.drawTile(xx, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.drawAbovePlayer = function (delta) { };
        _this.game = game;
        _this.linkedLevel = null;
        return _this;
    }
    return DownLadder;
}(tile_1.Tile));
exports.DownLadder = DownLadder;


/***/ }),

/***/ "./src/tile/floor.ts":
/*!***************************!*\
  !*** ./src/tile/floor.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Floor = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var Floor = /** @class */ (function (_super) {
    __extends(Floor, _super);
    function Floor(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.draw = function (delta) {
            game_1.Game.drawTile(_this.variation, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.variation = 1;
        if (_this.skin == tile_1.SkinType.DUNGEON)
            _this.variation = game_1.Game.randTable([1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12], Math.random);
        if (_this.skin == tile_1.SkinType.CAVE)
            //this.variation = Game.randTable([1, 1, 1, 1, 8, 9, 10, 12], Math.random);
            _this.variation = game_1.Game.randTable([1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12], Math.random);
        return _this;
    }
    return Floor;
}(tile_1.Tile));
exports.Floor = Floor;


/***/ }),

/***/ "./src/tile/fountainTile.ts":
/*!**********************************!*\
  !*** ./src/tile/fountainTile.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FountainTile = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var FountainTile = /** @class */ (function (_super) {
    __extends(FountainTile, _super);
    function FountainTile(level, x, y, subTileX, subTileY) {
        var _this = _super.call(this, level, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.draw = function (delta) {
            game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            game_1.Game.drawTile(_this.subTileX, 2 + _this.subTileY, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.subTileX = subTileX;
        _this.subTileY = subTileY;
        return _this;
    }
    return FountainTile;
}(tile_1.Tile));
exports.FountainTile = FountainTile;


/***/ }),

/***/ "./src/tile/insideLevelDoor.ts":
/*!*************************************!*\
  !*** ./src/tile/insideLevelDoor.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InsideLevelDoor = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var InsideLevelDoor = /** @class */ (function (_super) {
    __extends(InsideLevelDoor, _super);
    function InsideLevelDoor(level, game, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.isSolid = function () {
            return !_this.opened;
        };
        _this.canCrushEnemy = function () {
            return !_this.opened;
        };
        _this.isOpaque = function () {
            return !_this.opened;
        };
        _this.draw = function (delta) {
            game_1.Game.drawTile(1, 0, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            if (_this.opened)
                game_1.Game.drawTile(15, 1, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            else
                game_1.Game.drawTile(3, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.drawAbovePlayer = function (delta) {
            if (!_this.opened)
                game_1.Game.drawTile(13, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            else
                game_1.Game.drawTile(14, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.game = game;
        _this.opened = false;
        return _this;
    }
    return InsideLevelDoor;
}(tile_1.Tile));
exports.InsideLevelDoor = InsideLevelDoor;


/***/ }),

/***/ "./src/tile/spawnfloor.ts":
/*!********************************!*\
  !*** ./src/tile/spawnfloor.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SpawnFloor = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var SpawnFloor = /** @class */ (function (_super) {
    __extends(SpawnFloor, _super);
    function SpawnFloor(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.draw = function (delta) {
            game_1.Game.drawTile(_this.variation, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.variation = 1;
        if (_this.skin == tile_1.SkinType.DUNGEON)
            _this.variation = game_1.Game.randTable([1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12], Math.random);
        if (_this.skin == tile_1.SkinType.CAVE)
            //this.variation = Game.randTable([1, 1, 1, 1, 8, 9, 10, 12], Math.random);
            _this.variation = game_1.Game.randTable([1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12], Math.random);
        return _this;
    }
    return SpawnFloor;
}(tile_1.Tile));
exports.SpawnFloor = SpawnFloor;


/***/ }),

/***/ "./src/tile/spike.ts":
/*!***************************!*\
  !*** ./src/tile/spike.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Spike = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var Spike = /** @class */ (function (_super) {
    __extends(Spike, _super);
    function Spike() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.onCollide = function (player) {
            player.hurt(1, "spike");
        };
        _this.draw = function (delta) {
            game_1.Game.drawTile(11, 0, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        return _this;
    }
    return Spike;
}(tile_1.Tile));
exports.Spike = Spike;


/***/ }),

/***/ "./src/tile/spiketrap.ts":
/*!*******************************!*\
  !*** ./src/tile/spiketrap.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SpikeTrap = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var crate_1 = __webpack_require__(/*! ../enemy/crate */ "./src/enemy/crate.ts");
var barrel_1 = __webpack_require__(/*! ../enemy/barrel */ "./src/enemy/barrel.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var SpikeTrap = /** @class */ (function (_super) {
    __extends(SpikeTrap, _super);
    function SpikeTrap(level, x, y, tickCount) {
        var _this = _super.call(this, level, x, y) || this;
        _this.tick = function () {
            _this.tickCount++;
            if (_this.tickCount >= 4)
                _this.tickCount = 0;
            _this.on = _this.tickCount === 0;
            if (_this.on) {
                for (var i in _this.level.game.players) {
                    if (_this.level === _this.level.game.rooms[_this.level.game.players[i].levelID] && _this.level.game.players[i].x === _this.x && _this.level.game.players[i].y === _this.y)
                        _this.level.game.players[i].hurt(1, "spike trap");
                }
            }
            if (_this.tickCount === 3)
                _this.level.hitwarnings.push(new hitWarning_1.HitWarning(_this.level.game, _this.x, _this.y));
        };
        _this.tickEnd = function () {
            if (_this.on) {
                for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                    var e = _a[_i];
                    if (e.x === _this.x && e.y === _this.y) {
                        e.hurt(null, 1);
                    }
                }
            }
        };
        _this.onCollideEnemy = function (enemy) {
            if (_this.on && !(enemy instanceof crate_1.Crate || enemy instanceof barrel_1.Barrel))
                enemy.hurt(null, 1);
        };
        _this.draw = function (delta) {
            game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            var rumbleOffsetX = 0;
            _this.t++;
            if (!_this.on && _this.tickCount === 3) {
                if (_this.t % 4 === 1)
                    rumbleOffsetX = 0.0325;
                if (_this.t % 4 === 3)
                    rumbleOffsetX = -0.0325;
            }
            var frames = [0, 1, 2, 3, 3, 4, 2, 0];
            var f = 6 + frames[Math.floor(_this.frame)];
            if (_this.tickCount === 1 || (_this.tickCount === 0 && frames[Math.floor(_this.frame)] === 0)) {
                f = 5;
            }
            game_1.Game.drawObj(f, 0, 1, 2, _this.x + rumbleOffsetX, _this.y - 1, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            if (_this.on && _this.frame < frames.length - 1) {
                if (frames[Math.floor(_this.frame)] < 3)
                    _this.frame += 0.4 * delta;
                else
                    _this.frame += 0.2 * delta;
            }
            if (!_this.on)
                _this.frame = 0;
        };
        if (tickCount)
            _this.tickCount = tickCount;
        else
            _this.tickCount = 0;
        _this.on = false;
        _this.frame = 0;
        _this.t = 0;
        return _this;
    }
    return SpikeTrap;
}(tile_1.Tile));
exports.SpikeTrap = SpikeTrap;


/***/ }),

/***/ "./src/tile/tile.ts":
/*!**************************!*\
  !*** ./src/tile/tile.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Tile = exports.SkinType = void 0;
var drawable_1 = __webpack_require__(/*! ../drawable */ "./src/drawable.ts");
var SkinType;
(function (SkinType) {
    SkinType[SkinType["DUNGEON"] = 0] = "DUNGEON";
    SkinType[SkinType["CAVE"] = 1] = "CAVE";
})(SkinType = exports.SkinType || (exports.SkinType = {}));
var Tile = /** @class */ (function (_super) {
    __extends(Tile, _super);
    function Tile(level, x, y) {
        var _this = _super.call(this) || this;
        _this.hasPlayer = function (player) {
            if (player.x === _this.x && player.y === _this.y)
                return true;
            else
                return false;
        };
        _this.shadeAmount = function () {
            return _this.level.softVis[_this.x][_this.y];
        };
        _this.isSolid = function () {
            return false;
        };
        _this.canCrushEnemy = function () {
            return false;
        };
        _this.isOpaque = function () {
            return false;
        };
        _this.onCollide = function (player) { };
        _this.onCollideEnemy = function (enemy) { };
        _this.tick = function () { };
        _this.tickEnd = function () { };
        _this.draw = function (delta) { };
        _this.drawUnderPlayer = function (delta) { };
        _this.drawAbovePlayer = function (delta) { };
        _this.drawAboveShading = function (delta) { };
        _this.skin = level.skin;
        _this.level = level;
        _this.x = x;
        _this.y = y;
        _this.drawableY = y;
        _this.isDoor = false;
        return _this;
    }
    return Tile;
}(drawable_1.Drawable));
exports.Tile = Tile;


/***/ }),

/***/ "./src/tile/trapdoor.ts":
/*!******************************!*\
  !*** ./src/tile/trapdoor.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Trapdoor = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var Trapdoor = /** @class */ (function (_super) {
    __extends(Trapdoor, _super);
    function Trapdoor(level, game, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.draw = function (delta) {
            game_1.Game.drawTile(13, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.onCollide = function (player) {
            // TODO
        };
        _this.game = game;
        return _this;
    }
    return Trapdoor;
}(tile_1.Tile));
exports.Trapdoor = Trapdoor;


/***/ }),

/***/ "./src/tile/upLadder.ts":
/*!******************************!*\
  !*** ./src/tile/upLadder.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpLadder = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var UpLadder = /** @class */ (function (_super) {
    __extends(UpLadder, _super);
    function UpLadder(level, game, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.isRope = false;
        _this.onCollide = function (player) {
            _this.game.changeLevelThroughLadder(player, _this);
        };
        _this.draw = function (delta) {
            var xx = 29;
            var yy = 0;
            if (_this.isRope) {
                xx = 16;
                yy = 1;
            }
            game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            if (!_this.isRope)
                game_1.Game.drawTile(xx, yy, 1, 1, _this.x, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            game_1.Game.drawTile(xx, yy + 1, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.drawAbovePlayer = function (delta) {
            if (_this.isRope)
                game_1.Game.drawTile(16, 1, 1, 1, _this.x, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.game = game;
        return _this;
    }
    return UpLadder;
}(tile_1.Tile));
exports.UpLadder = UpLadder;


/***/ }),

/***/ "./src/tile/wall.ts":
/*!**************************!*\
  !*** ./src/tile/wall.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Wall = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var Wall = /** @class */ (function (_super) {
    __extends(Wall, _super);
    function Wall() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.isOpaque = function () {
            return true;
        };
        _this.draw = function (delta) {
            if (_this.y < _this.level.roomY + _this.level.height - 1)
                game_1.Game.drawTile(0, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.level.softVis[_this.x][_this.y + 1]);
            game_1.Game.drawTile(2, _this.skin, 1, 1, _this.x, _this.y - 0.5, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        return _this;
    }
    return Wall;
}(tile_1.Tile));
exports.Wall = Wall;


/***/ }),

/***/ "./src/tile/wallTorch.ts":
/*!*******************************!*\
  !*** ./src/tile/wallTorch.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WallTorch = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var lightSource_1 = __webpack_require__(/*! ../lightSource */ "./src/lightSource.ts");
var WallTorch = /** @class */ (function (_super) {
    __extends(WallTorch, _super);
    function WallTorch(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.isOpaque = function () {
            return true;
        };
        _this.draw = function (delta) {
            _this.frame += 0.3 * delta;
            if (_this.frame >= 12)
                _this.frame = 0;
            game_1.Game.drawTile(0, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            game_1.Game.drawTile(2, _this.skin, 1, 1, _this.x, _this.y - 0.5, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            game_1.Game.drawFX(Math.floor(_this.frame), 32, 1, 2, _this.x, _this.y - 1, 1, 2);
        };
        _this.level.lightSources.push(new lightSource_1.LightSource(_this.x + 0.5, _this.y + 0.5, 3));
        _this.frame = Math.random() * 12;
        return _this;
    }
    return WallTorch;
}(tile_1.Tile));
exports.WallTorch = WallTorch;


/***/ }),

/***/ "./src/weapon/dagger.ts":
/*!******************************!*\
  !*** ./src/weapon/dagger.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Dagger = void 0;
var weapon_1 = __webpack_require__(/*! ./weapon */ "./src/weapon/weapon.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var slashParticle_1 = __webpack_require__(/*! ../particle/slashParticle */ "./src/particle/slashParticle.ts");
var Dagger = /** @class */ (function (_super) {
    __extends(Dagger, _super);
    function Dagger(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.weaponMove = function (newX, newY) {
            var flag = false;
            for (var _i = 0, _a = _this.game.rooms[_this.wielder.levelID].enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e.destroyable &&
                    !e.pushable &&
                    e.pointIn(newX, newY)) {
                    e.hurt(_this.wielder, 1);
                    flag = true;
                }
            }
            if (flag) {
                if (_this.wielder.game.rooms[_this.wielder.levelID] === _this.wielder.game.level)
                    sound_1.Sound.hit();
                _this.wielder.drawX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.drawY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.drawX, 10 * _this.wielder.drawY);
            }
            return !flag;
        };
        _this.getDescription = function () {
            return "DAGGER\nDamage 1";
        };
        _this.tileX = 22;
        _this.tileY = 0;
        return _this;
    }
    return Dagger;
}(weapon_1.Weapon));
exports.Dagger = Dagger;


/***/ }),

/***/ "./src/weapon/dualdagger.ts":
/*!**********************************!*\
  !*** ./src/weapon/dualdagger.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DualDagger = void 0;
var weapon_1 = __webpack_require__(/*! ./weapon */ "./src/weapon/weapon.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var slashParticle_1 = __webpack_require__(/*! ../particle/slashParticle */ "./src/particle/slashParticle.ts");
var DualDagger = /** @class */ (function (_super) {
    __extends(DualDagger, _super);
    function DualDagger(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.tickInInventory = function () {
            _this.firstAttack = true;
        };
        _this.weaponMove = function (newX, newY) {
            var flag = false;
            for (var _i = 0, _a = _this.game.rooms[_this.wielder.levelID].enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e.destroyable &&
                    !e.pushable &&
                    e.pointIn(newX, newY)) {
                    e.hurt(_this.wielder, 1);
                    flag = true;
                }
            }
            if (flag) {
                if (_this.wielder.game.rooms[_this.wielder.levelID] === _this.wielder.game.level)
                    sound_1.Sound.hit();
                _this.wielder.drawX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.drawY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX, newY));
                if (_this.firstAttack)
                    _this.game.rooms[_this.wielder.levelID].enemies = _this.game.rooms[_this.wielder.levelID].enemies.filter(function (e) { return !e.dead; });
                else
                    _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.drawX, 10 * _this.wielder.drawY);
                if (_this.firstAttack)
                    _this.firstAttack = false;
            }
            return !flag;
        };
        _this.getDescription = function () {
            return "DUAL DAGGERS\nOne extra attack per turn";
        };
        _this.tileX = 23;
        _this.tileY = 0;
        _this.firstAttack = true;
        return _this;
    }
    return DualDagger;
}(weapon_1.Weapon));
exports.DualDagger = DualDagger;


/***/ }),

/***/ "./src/weapon/pickaxe.ts":
/*!*******************************!*\
  !*** ./src/weapon/pickaxe.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Pickaxe = void 0;
var weapon_1 = __webpack_require__(/*! ./weapon */ "./src/weapon/weapon.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var slashParticle_1 = __webpack_require__(/*! ../particle/slashParticle */ "./src/particle/slashParticle.ts");
var Pickaxe = /** @class */ (function (_super) {
    __extends(Pickaxe, _super);
    function Pickaxe(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.weaponMove = function (newX, newY) {
            var flag = false;
            for (var _i = 0, _a = _this.game.rooms[_this.wielder.levelID].enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e.destroyable &&
                    !e.pushable &&
                    e.pointIn(newX, newY)) {
                    e.hurt(_this.wielder, 1);
                    flag = true;
                }
            }
            if (flag) {
                if (_this.wielder.game.rooms[_this.wielder.levelID] === _this.wielder.game.level)
                    sound_1.Sound.hit();
                _this.wielder.drawX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.drawY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.drawX, 10 * _this.wielder.drawY);
            }
            return !flag;
        };
        _this.getDescription = function () {
            return "PICKAXE\nDamage 1, used for mining";
        };
        _this.tileX = 30;
        _this.tileY = 0;
        _this.canMine = true;
        return _this;
    }
    return Pickaxe;
}(weapon_1.Weapon));
exports.Pickaxe = Pickaxe;


/***/ }),

/***/ "./src/weapon/shotgun.ts":
/*!*******************************!*\
  !*** ./src/weapon/shotgun.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Shotgun = void 0;
var weapon_1 = __webpack_require__(/*! ./weapon */ "./src/weapon/weapon.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var Shotgun = /** @class */ (function (_super) {
    __extends(Shotgun, _super);
    function Shotgun(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.weaponMove = function (newX, newY) {
            var newX2 = 2 * newX - _this.wielder.x;
            var newY2 = 2 * newY - _this.wielder.y;
            var newX3 = 3 * newX - 2 * _this.wielder.x;
            var newY3 = 3 * newY - 2 * _this.wielder.y;
            var range = 3;
            if (!_this.game.rooms[_this.wielder.levelID].tileInside(newX, newY) ||
                _this.game.rooms[_this.wielder.levelID].roomArray[newX][newY].isSolid())
                //if current position is inside new position OR is solid
                return true;
            else if (!_this.game.rooms[_this.wielder.levelID].tileInside(newX2, newY2) ||
                _this.game.rooms[_this.wielder.levelID].roomArray[newX2][newY2].isSolid())
                //if current position is inside new position 2 OR is solid
                //set range as one
                range = 1;
            else if (!_this.game.rooms[_this.wielder.levelID].tileInside(newX3, newY3) ||
                _this.game.rooms[_this.wielder.levelID].roomArray[newX3][newY3].isSolid())
                //if current position is inside new position 3 OR is solid
                //set range as two
                range = 2;
            var enemyHitCandidates = [];
            var firstPushable = 4;
            var firstNonPushable = 5;
            var firstNonDestroyable = 5;
            for (var _i = 0, _a = _this.game.rooms[_this.wielder.levelID].enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                //loop through enemies in this weapons wielders level
                if (e.pushable) {
                    //case for pushables
                    if (e.pointIn(newX, newY))
                        return true;
                    //if pushable is in new position return true
                    if (e.pointIn(newX2, newY2) && range >= 2) {
                        enemyHitCandidates.push({ enemy: e, dist: 2 });
                        firstPushable = 2;
                        //if pushable is in position 2 set firstPushable var
                    }
                    if (e.pointIn(newX3, newY3) && range >= 3) {
                        enemyHitCandidates.push({ enemy: e, dist: 3 });
                        firstPushable = Math.min(firstPushable, 3);
                        //if pushable is in position 3 set firstPushable to min of firstPushable and 3
                    }
                }
                else if (e.destroyable) {
                    //case for destroyables
                    if (e.pointIn(newX, newY) && range >= 1) {
                        firstNonPushable = 1;
                        enemyHitCandidates.push({ enemy: e, dist: 1 });
                    }
                    //if enemy is in new position and range is enough push enemy to hit candidate array
                    if (e.pointIn(newX2, newY2) && range >= 2) {
                        firstNonPushable = Math.min(firstNonPushable, 2);
                        enemyHitCandidates.push({ enemy: e, dist: 2 });
                    }
                    //if enemy is in new position 2 and range is enough push enemy to hit candidate array
                    if (e.pointIn(newX3, newY3) && range >= 3) {
                        firstNonPushable = Math.min(firstNonPushable, 3);
                        enemyHitCandidates.push({ enemy: e, dist: 3 });
                    }
                    //if enemy is in new position 3 and range is enough push enemy to hit candidate array
                }
                else {
                    if (e.pointIn(newX, newY) && range >= 1) {
                        firstNonDestroyable = 1;
                    }
                    //if enemy is in new position and range is enough set first non destroyable to 1
                    if (e.pointIn(newX2, newY2) && range >= 2) {
                        firstNonDestroyable = Math.min(firstNonDestroyable, 2);
                    }
                    //if enemy is in new position and range is enough set first non destroyable to 2
                    if (e.pointIn(newX3, newY3) && range >= 3) {
                        firstNonDestroyable = Math.min(firstNonDestroyable, 3);
                    }
                    //if enemy is in new position and range is enough set first non destroyable to 3
                }
            }
            var targetX = newX3;
            var targetY = newY3;
            if (firstNonDestroyable < firstNonPushable &&
                firstNonDestroyable < firstPushable
            //if a non destroyable comes before the first non pushable and before the first pushable
            ) {
                return true;
                //return true and exit the function
            }
            if (firstNonPushable <= firstPushable) {
                for (var _b = 0, enemyHitCandidates_1 = enemyHitCandidates; _b < enemyHitCandidates_1.length; _b++) {
                    var c = enemyHitCandidates_1[_b];
                    var e = c.enemy;
                    var d = c.dist;
                    if (d === 3)
                        e.hurt(_this.wielder, 0.5);
                    else
                        e.hurt(_this.wielder, 1);
                }
                //finally bro
                //for the array c of enemyHitCandidates if the enemy distance is 3 only do .5 damage
                //if they're closer do the usual damage
                //hits all candidates in enemyHitCandidates
                if (_this.wielder.game.rooms[_this.wielder.levelID] ===
                    _this.wielder.game.level)
                    sound_1.Sound.hit();
                _this.wielder.drawX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.drawY = 0.5 * (_this.wielder.y - newY);
                genericParticle_1.GenericParticle.shotgun(_this.game.rooms[_this.wielder.levelID], _this.wielder.x + 0.5, _this.wielder.y, targetX + 0.5, targetY, "black");
                genericParticle_1.GenericParticle.shotgun(_this.game.rooms[_this.wielder.levelID], _this.wielder.x + 0.5, _this.wielder.y, targetX + 0.5, targetY, "#ffddff");
                var gp = new genericParticle_1.GenericParticle(_this.game.rooms[_this.wielder.levelID], 0.5 * (newX + _this.wielder.x) + 0.5, 0.5 * (newY + _this.wielder.y), 0, 1, 0, 0, 0, "white", 0);
                gp.expirationTimer = 10;
                _this.game.rooms[_this.wielder.levelID].particles.push(gp);
                //this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX, newY));
                //this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX2, newY2));
                //this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX3, newY3));
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.drawX, 10 * _this.wielder.drawY);
                return false;
            }
            return true;
        };
        _this.getDescription = function () {
            return "SHOTGUN\nRange 3, penetration";
        };
        _this.tileX = 26;
        _this.tileY = 0;
        return _this;
    }
    return Shotgun;
}(weapon_1.Weapon));
exports.Shotgun = Shotgun;


/***/ }),

/***/ "./src/weapon/spear.ts":
/*!*****************************!*\
  !*** ./src/weapon/spear.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Spear = void 0;
var weapon_1 = __webpack_require__(/*! ./weapon */ "./src/weapon/weapon.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var slashParticle_1 = __webpack_require__(/*! ../particle/slashParticle */ "./src/particle/slashParticle.ts");
var Spear = /** @class */ (function (_super) {
    __extends(Spear, _super);
    function Spear(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.weaponMove = function (newX, newY) {
            var newX2 = 2 * newX - _this.wielder.x;
            var newY2 = 2 * newY - _this.wielder.y;
            var flag = false;
            var enemyHitCandidates = [];
            for (var _i = 0, _a = _this.game.rooms[_this.wielder.levelID].enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e.destroyable) {
                    if (e.pointIn(newX, newY)) {
                        if (e.pushable)
                            return true;
                        else {
                            e.hurt(_this.wielder, 1);
                            flag = true;
                        }
                    }
                    if (e.pointIn(newX2, newY2) && !_this.game.rooms[_this.wielder.levelID].roomArray[newX][newY].isSolid()) {
                        if (!e.pushable)
                            enemyHitCandidates.push(e);
                    }
                }
            }
            if (!flag && enemyHitCandidates.length > 0) {
                for (var _b = 0, enemyHitCandidates_1 = enemyHitCandidates; _b < enemyHitCandidates_1.length; _b++) {
                    var e = enemyHitCandidates_1[_b];
                    e.hurt(_this.wielder, 1);
                }
                if (_this.wielder.game.level === _this.wielder.game.rooms[_this.wielder.levelID])
                    sound_1.Sound.hit();
                _this.wielder.drawX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.drawY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX2, newY2));
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.drawX, 10 * _this.wielder.drawY);
                return false;
            }
            if (flag) {
                if (_this.wielder.game.level === _this.wielder.game.rooms[_this.wielder.levelID])
                    sound_1.Sound.hit();
                _this.wielder.drawX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.drawY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.drawX, 10 * _this.wielder.drawY);
            }
            return !flag;
        };
        _this.getDescription = function () {
            return "SPEAR\nRange 2";
        };
        _this.tileX = 24;
        _this.tileY = 0;
        return _this;
    }
    return Spear;
}(weapon_1.Weapon));
exports.Spear = Spear;


/***/ }),

/***/ "./src/weapon/spellbook.ts":
/*!*********************************!*\
  !*** ./src/weapon/spellbook.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Spellbook = void 0;
var weapon_1 = __webpack_require__(/*! ./weapon */ "./src/weapon/weapon.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var playerFireball_1 = __webpack_require__(/*! ../projectile/playerFireball */ "./src/projectile/playerFireball.ts");
var Spellbook = /** @class */ (function (_super) {
    __extends(Spellbook, _super);
    function Spellbook(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.weaponMove = function (newX, newY) {
            var flag = false;
            var difX = newX - _this.x;
            var difY = newY - _this.y;
            for (var _i = 0, _a = _this.game.rooms[_this.wielder.levelID].enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if ((e.destroyable || e.pushable) &&
                    e.pointIn(newX, newY) &&
                    !_this.game.rooms[_this.wielder.levelID].roomArray[e.x][e.y].isSolid()) {
                    e.hurt(_this.wielder, 1);
                    _this.game.rooms[_this.wielder.levelID].particles.push(new playerFireball_1.PlayerFireball(e.x, e.y));
                    flag = true;
                }
            }
            if (flag) {
                if (_this.wielder.game.rooms[_this.wielder.levelID] ===
                    _this.wielder.game.level)
                    sound_1.Sound.hit();
                _this.wielder.drawX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.drawY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.drawX, 10 * _this.wielder.drawY);
            }
            return !flag;
        };
        _this.getDescription = function () {
            return "SPELLBOOK\nc̵͈̮͍̫̄a̴̲͛͂̌ŗ̴̩͈̞̠͉̤̗̎̓͐͗̐̃̈́̏̊͝ê̴̥̙̰̱̮̙̩͇̝͎̋̏͐̉̑f̴̧͎͚̟͈̻̰̫̫͎̑̔̂͛̓͂̅ú̶̢͖̣͙͔̺̋̉̾̀̿̑̍̕l̵̮͚̊́͐̌̎͘";
        };
        _this.tileX = 25;
        _this.tileY = 0;
        _this.canMine = true;
        return _this;
    }
    return Spellbook;
}(weapon_1.Weapon));
exports.Spellbook = Spellbook;


/***/ }),

/***/ "./src/weapon/weapon.ts":
/*!******************************!*\
  !*** ./src/weapon/weapon.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Weapon = void 0;
var equippable_1 = __webpack_require__(/*! ../item/equippable */ "./src/item/equippable.ts");
var Weapon = /** @class */ (function (_super) {
    __extends(Weapon, _super);
    function Weapon(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.coEquippable = function (other) {
            if (other instanceof Weapon)
                return false;
            return true;
        };
        _this.tick = function () { };
        // returns true if nothing was hit, false if the player should move
        _this.weaponMove = function (newX, newY) {
            return true;
        };
        if (level)
            _this.game = level.game;
        _this.canMine = false;
        return _this;
    }
    return Weapon;
}(equippable_1.Equippable));
exports.Weapon = Weapon;


/***/ }),

/***/ "./node_modules/yeast/index.js":
/*!*************************************!*\
  !*** ./node_modules/yeast/index.js ***!
  \*************************************/
/***/ ((module) => {

"use strict";


var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
  , length = 64
  , map = {}
  , seed = 0
  , i = 0
  , prev;

/**
 * Return a string representing the specified number.
 *
 * @param {Number} num The number to convert.
 * @returns {String} The string representation of the number.
 * @api public
 */
function encode(num) {
  var encoded = '';

  do {
    encoded = alphabet[num % length] + encoded;
    num = Math.floor(num / length);
  } while (num > 0);

  return encoded;
}

/**
 * Return the integer value specified by the given string.
 *
 * @param {String} str The string to convert.
 * @returns {Number} The integer value represented by the string.
 * @api public
 */
function decode(str) {
  var decoded = 0;

  for (i = 0; i < str.length; i++) {
    decoded = decoded * length + map[str.charAt(i)];
  }

  return decoded;
}

/**
 * Yeast: A tiny growing id generator.
 *
 * @returns {String} A unique id.
 * @api public
 */
function yeast() {
  var now = encode(+new Date());

  if (now !== prev) return seed = 0, prev = now;
  return now +'.'+ encode(seed++);
}

//
// Map each character to its index.
//
for (; i < length; i++) map[alphabet[i]] = i;

//
// Expose the `yeast`, `encode` and `decode` functions.
//
yeast.encode = encode;
yeast.decode = decode;
module.exports = yeast;


/***/ }),

/***/ "./node_modules/socket.io-client/build/index.js":
/*!******************************************************!*\
  !*** ./node_modules/socket.io-client/build/index.js ***!
  \******************************************************/
/***/ ((module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Socket = exports.io = exports.Manager = exports.protocol = void 0;
const url_1 = __webpack_require__(/*! ./url */ "./node_modules/socket.io-client/build/url.js");
const manager_1 = __webpack_require__(/*! ./manager */ "./node_modules/socket.io-client/build/manager.js");
const socket_1 = __webpack_require__(/*! ./socket */ "./node_modules/socket.io-client/build/socket.js");
Object.defineProperty(exports, "Socket", ({ enumerable: true, get: function () { return socket_1.Socket; } }));
const debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("socket.io-client");
/**
 * Module exports.
 */
module.exports = exports = lookup;
/**
 * Managers cache.
 */
const cache = (exports.managers = {});
function lookup(uri, opts) {
    if (typeof uri === "object") {
        opts = uri;
        uri = undefined;
    }
    opts = opts || {};
    const parsed = url_1.url(uri, opts.path);
    const source = parsed.source;
    const id = parsed.id;
    const path = parsed.path;
    const sameNamespace = cache[id] && path in cache[id]["nsps"];
    const newConnection = opts.forceNew ||
        opts["force new connection"] ||
        false === opts.multiplex ||
        sameNamespace;
    let io;
    if (newConnection) {
        debug("ignoring socket cache for %s", source);
        io = new manager_1.Manager(source, opts);
    }
    else {
        if (!cache[id]) {
            debug("new io instance for %s", source);
            cache[id] = new manager_1.Manager(source, opts);
        }
        io = cache[id];
    }
    if (parsed.query && !opts.query) {
        opts.query = parsed.queryKey;
    }
    return io.socket(parsed.path, opts);
}
exports.io = lookup;
/**
 * Protocol version.
 *
 * @public
 */
var socket_io_parser_1 = __webpack_require__(/*! socket.io-parser */ "./node_modules/socket.io-parser/dist/index.js");
Object.defineProperty(exports, "protocol", ({ enumerable: true, get: function () { return socket_io_parser_1.protocol; } }));
/**
 * `connect`.
 *
 * @param {String} uri
 * @public
 */
exports.connect = lookup;
/**
 * Expose constructors for standalone build.
 *
 * @public
 */
var manager_2 = __webpack_require__(/*! ./manager */ "./node_modules/socket.io-client/build/manager.js");
Object.defineProperty(exports, "Manager", ({ enumerable: true, get: function () { return manager_2.Manager; } }));


/***/ }),

/***/ "./node_modules/socket.io-client/build/manager.js":
/*!********************************************************!*\
  !*** ./node_modules/socket.io-client/build/manager.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Manager = void 0;
const eio = __webpack_require__(/*! engine.io-client */ "./node_modules/engine.io-client/lib/index.js");
const socket_1 = __webpack_require__(/*! ./socket */ "./node_modules/socket.io-client/build/socket.js");
const Emitter = __webpack_require__(/*! component-emitter */ "./node_modules/component-emitter/index.js");
const parser = __webpack_require__(/*! socket.io-parser */ "./node_modules/socket.io-parser/dist/index.js");
const on_1 = __webpack_require__(/*! ./on */ "./node_modules/socket.io-client/build/on.js");
const Backoff = __webpack_require__(/*! backo2 */ "./node_modules/backo2/index.js");
const debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("socket.io-client:manager");
class Manager extends Emitter {
    constructor(uri, opts) {
        super();
        this.nsps = {};
        this.subs = [];
        if (uri && "object" === typeof uri) {
            opts = uri;
            uri = undefined;
        }
        opts = opts || {};
        opts.path = opts.path || "/socket.io";
        this.opts = opts;
        this.reconnection(opts.reconnection !== false);
        this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
        this.reconnectionDelay(opts.reconnectionDelay || 1000);
        this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
        this.randomizationFactor(opts.randomizationFactor || 0.5);
        this.backoff = new Backoff({
            min: this.reconnectionDelay(),
            max: this.reconnectionDelayMax(),
            jitter: this.randomizationFactor(),
        });
        this.timeout(null == opts.timeout ? 20000 : opts.timeout);
        this._readyState = "closed";
        this.uri = uri;
        const _parser = opts.parser || parser;
        this.encoder = new _parser.Encoder();
        this.decoder = new _parser.Decoder();
        this._autoConnect = opts.autoConnect !== false;
        if (this._autoConnect)
            this.open();
    }
    reconnection(v) {
        if (!arguments.length)
            return this._reconnection;
        this._reconnection = !!v;
        return this;
    }
    reconnectionAttempts(v) {
        if (v === undefined)
            return this._reconnectionAttempts;
        this._reconnectionAttempts = v;
        return this;
    }
    reconnectionDelay(v) {
        var _a;
        if (v === undefined)
            return this._reconnectionDelay;
        this._reconnectionDelay = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
        return this;
    }
    randomizationFactor(v) {
        var _a;
        if (v === undefined)
            return this._randomizationFactor;
        this._randomizationFactor = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
        return this;
    }
    reconnectionDelayMax(v) {
        var _a;
        if (v === undefined)
            return this._reconnectionDelayMax;
        this._reconnectionDelayMax = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
        return this;
    }
    timeout(v) {
        if (!arguments.length)
            return this._timeout;
        this._timeout = v;
        return this;
    }
    /**
     * Starts trying to reconnect if reconnection is enabled and we have not
     * started reconnecting yet
     *
     * @private
     */
    maybeReconnectOnOpen() {
        // Only try to reconnect if it's the first time we're connecting
        if (!this._reconnecting &&
            this._reconnection &&
            this.backoff.attempts === 0) {
            // keeps reconnection from firing twice for the same reconnection loop
            this.reconnect();
        }
    }
    /**
     * Sets the current transport `socket`.
     *
     * @param {Function} fn - optional, callback
     * @return self
     * @public
     */
    open(fn) {
        debug("readyState %s", this._readyState);
        if (~this._readyState.indexOf("open"))
            return this;
        debug("opening %s", this.uri);
        this.engine = eio(this.uri, this.opts);
        const socket = this.engine;
        const self = this;
        this._readyState = "opening";
        this.skipReconnect = false;
        // emit `open`
        const openSubDestroy = on_1.on(socket, "open", function () {
            self.onopen();
            fn && fn();
        });
        // emit `error`
        const errorSub = on_1.on(socket, "error", (err) => {
            debug("error");
            self.cleanup();
            self._readyState = "closed";
            super.emit("error", err);
            if (fn) {
                fn(err);
            }
            else {
                // Only do this if there is no fn to handle the error
                self.maybeReconnectOnOpen();
            }
        });
        if (false !== this._timeout) {
            const timeout = this._timeout;
            debug("connect attempt will timeout after %d", timeout);
            if (timeout === 0) {
                openSubDestroy(); // prevents a race condition with the 'open' event
            }
            // set timer
            const timer = setTimeout(() => {
                debug("connect attempt timed out after %d", timeout);
                openSubDestroy();
                socket.close();
                socket.emit("error", new Error("timeout"));
            }, timeout);
            this.subs.push(function subDestroy() {
                clearTimeout(timer);
            });
        }
        this.subs.push(openSubDestroy);
        this.subs.push(errorSub);
        return this;
    }
    /**
     * Alias for open()
     *
     * @return self
     * @public
     */
    connect(fn) {
        return this.open(fn);
    }
    /**
     * Called upon transport open.
     *
     * @private
     */
    onopen() {
        debug("open");
        // clear old subs
        this.cleanup();
        // mark as open
        this._readyState = "open";
        super.emit("open");
        // add new subs
        const socket = this.engine;
        this.subs.push(on_1.on(socket, "ping", this.onping.bind(this)), on_1.on(socket, "data", this.ondata.bind(this)), on_1.on(socket, "error", this.onerror.bind(this)), on_1.on(socket, "close", this.onclose.bind(this)), on_1.on(this.decoder, "decoded", this.ondecoded.bind(this)));
    }
    /**
     * Called upon a ping.
     *
     * @private
     */
    onping() {
        super.emit("ping");
    }
    /**
     * Called with data.
     *
     * @private
     */
    ondata(data) {
        this.decoder.add(data);
    }
    /**
     * Called when parser fully decodes a packet.
     *
     * @private
     */
    ondecoded(packet) {
        super.emit("packet", packet);
    }
    /**
     * Called upon socket error.
     *
     * @private
     */
    onerror(err) {
        debug("error", err);
        super.emit("error", err);
    }
    /**
     * Creates a new socket for the given `nsp`.
     *
     * @return {Socket}
     * @public
     */
    socket(nsp, opts) {
        let socket = this.nsps[nsp];
        if (!socket) {
            socket = new socket_1.Socket(this, nsp, opts);
            this.nsps[nsp] = socket;
        }
        return socket;
    }
    /**
     * Called upon a socket close.
     *
     * @param socket
     * @private
     */
    _destroy(socket) {
        const nsps = Object.keys(this.nsps);
        for (const nsp of nsps) {
            const socket = this.nsps[nsp];
            if (socket.active) {
                debug("socket %s is still active, skipping close", nsp);
                return;
            }
        }
        this._close();
    }
    /**
     * Writes a packet.
     *
     * @param packet
     * @private
     */
    _packet(packet) {
        debug("writing packet %j", packet);
        const encodedPackets = this.encoder.encode(packet);
        for (let i = 0; i < encodedPackets.length; i++) {
            this.engine.write(encodedPackets[i], packet.options);
        }
    }
    /**
     * Clean up transport subscriptions and packet buffer.
     *
     * @private
     */
    cleanup() {
        debug("cleanup");
        this.subs.forEach((subDestroy) => subDestroy());
        this.subs.length = 0;
        this.decoder.destroy();
    }
    /**
     * Close the current socket.
     *
     * @private
     */
    _close() {
        debug("disconnect");
        this.skipReconnect = true;
        this._reconnecting = false;
        if ("opening" === this._readyState) {
            // `onclose` will not fire because
            // an open event never happened
            this.cleanup();
        }
        this.backoff.reset();
        this._readyState = "closed";
        if (this.engine)
            this.engine.close();
    }
    /**
     * Alias for close()
     *
     * @private
     */
    disconnect() {
        return this._close();
    }
    /**
     * Called upon engine close.
     *
     * @private
     */
    onclose(reason) {
        debug("onclose");
        this.cleanup();
        this.backoff.reset();
        this._readyState = "closed";
        super.emit("close", reason);
        if (this._reconnection && !this.skipReconnect) {
            this.reconnect();
        }
    }
    /**
     * Attempt a reconnection.
     *
     * @private
     */
    reconnect() {
        if (this._reconnecting || this.skipReconnect)
            return this;
        const self = this;
        if (this.backoff.attempts >= this._reconnectionAttempts) {
            debug("reconnect failed");
            this.backoff.reset();
            super.emit("reconnect_failed");
            this._reconnecting = false;
        }
        else {
            const delay = this.backoff.duration();
            debug("will wait %dms before reconnect attempt", delay);
            this._reconnecting = true;
            const timer = setTimeout(() => {
                if (self.skipReconnect)
                    return;
                debug("attempting reconnect");
                super.emit("reconnect_attempt", self.backoff.attempts);
                // check again for the case socket closed in above events
                if (self.skipReconnect)
                    return;
                self.open((err) => {
                    if (err) {
                        debug("reconnect attempt error");
                        self._reconnecting = false;
                        self.reconnect();
                        super.emit("reconnect_error", err);
                    }
                    else {
                        debug("reconnect success");
                        self.onreconnect();
                    }
                });
            }, delay);
            this.subs.push(function subDestroy() {
                clearTimeout(timer);
            });
        }
    }
    /**
     * Called upon successful reconnect.
     *
     * @private
     */
    onreconnect() {
        const attempt = this.backoff.attempts;
        this._reconnecting = false;
        this.backoff.reset();
        super.emit("reconnect", attempt);
    }
}
exports.Manager = Manager;


/***/ }),

/***/ "./node_modules/socket.io-client/build/on.js":
/*!***************************************************!*\
  !*** ./node_modules/socket.io-client/build/on.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.on = void 0;
function on(obj, ev, fn) {
    obj.on(ev, fn);
    return function subDestroy() {
        obj.off(ev, fn);
    };
}
exports.on = on;


/***/ }),

/***/ "./node_modules/socket.io-client/build/socket.js":
/*!*******************************************************!*\
  !*** ./node_modules/socket.io-client/build/socket.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Socket = void 0;
const socket_io_parser_1 = __webpack_require__(/*! socket.io-parser */ "./node_modules/socket.io-parser/dist/index.js");
const Emitter = __webpack_require__(/*! component-emitter */ "./node_modules/component-emitter/index.js");
const on_1 = __webpack_require__(/*! ./on */ "./node_modules/socket.io-client/build/on.js");
const debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("socket.io-client:socket");
/**
 * Internal events.
 * These events can't be emitted by the user.
 */
const RESERVED_EVENTS = Object.freeze({
    connect: 1,
    connect_error: 1,
    disconnect: 1,
    disconnecting: 1,
    // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
    newListener: 1,
    removeListener: 1,
});
class Socket extends Emitter {
    /**
     * `Socket` constructor.
     *
     * @public
     */
    constructor(io, nsp, opts) {
        super();
        this.receiveBuffer = [];
        this.sendBuffer = [];
        this.ids = 0;
        this.acks = {};
        this.flags = {};
        this.io = io;
        this.nsp = nsp;
        this.ids = 0;
        this.acks = {};
        this.receiveBuffer = [];
        this.sendBuffer = [];
        this.connected = false;
        this.disconnected = true;
        this.flags = {};
        if (opts && opts.auth) {
            this.auth = opts.auth;
        }
        if (this.io._autoConnect)
            this.open();
    }
    /**
     * Subscribe to open, close and packet events
     *
     * @private
     */
    subEvents() {
        if (this.subs)
            return;
        const io = this.io;
        this.subs = [
            on_1.on(io, "open", this.onopen.bind(this)),
            on_1.on(io, "packet", this.onpacket.bind(this)),
            on_1.on(io, "error", this.onerror.bind(this)),
            on_1.on(io, "close", this.onclose.bind(this)),
        ];
    }
    /**
     * Whether the Socket will try to reconnect when its Manager connects or reconnects
     */
    get active() {
        return !!this.subs;
    }
    /**
     * "Opens" the socket.
     *
     * @public
     */
    connect() {
        if (this.connected)
            return this;
        this.subEvents();
        if (!this.io["_reconnecting"])
            this.io.open(); // ensure open
        if ("open" === this.io._readyState)
            this.onopen();
        return this;
    }
    /**
     * Alias for connect()
     */
    open() {
        return this.connect();
    }
    /**
     * Sends a `message` event.
     *
     * @return self
     * @public
     */
    send(...args) {
        args.unshift("message");
        this.emit.apply(this, args);
        return this;
    }
    /**
     * Override `emit`.
     * If the event is in `events`, it's emitted normally.
     *
     * @param ev - event name
     * @return self
     * @public
     */
    emit(ev, ...args) {
        if (RESERVED_EVENTS.hasOwnProperty(ev)) {
            throw new Error('"' + ev + '" is a reserved event name');
        }
        args.unshift(ev);
        const packet = {
            type: socket_io_parser_1.PacketType.EVENT,
            data: args,
        };
        packet.options = {};
        packet.options.compress = this.flags.compress !== false;
        // event ack callback
        if ("function" === typeof args[args.length - 1]) {
            debug("emitting packet with ack id %d", this.ids);
            this.acks[this.ids] = args.pop();
            packet.id = this.ids++;
        }
        const isTransportWritable = this.io.engine &&
            this.io.engine.transport &&
            this.io.engine.transport.writable;
        const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
        if (discardPacket) {
            debug("discard packet as the transport is not currently writable");
        }
        else if (this.connected) {
            this.packet(packet);
        }
        else {
            this.sendBuffer.push(packet);
        }
        this.flags = {};
        return this;
    }
    /**
     * Sends a packet.
     *
     * @param packet
     * @private
     */
    packet(packet) {
        packet.nsp = this.nsp;
        this.io._packet(packet);
    }
    /**
     * Called upon engine `open`.
     *
     * @private
     */
    onopen() {
        debug("transport is open - connecting");
        if (typeof this.auth == "function") {
            this.auth((data) => {
                this.packet({ type: socket_io_parser_1.PacketType.CONNECT, data });
            });
        }
        else {
            this.packet({ type: socket_io_parser_1.PacketType.CONNECT, data: this.auth });
        }
    }
    /**
     * Called upon engine or manager `error`.
     *
     * @param err
     * @private
     */
    onerror(err) {
        if (!this.connected) {
            super.emit("connect_error", err);
        }
    }
    /**
     * Called upon engine `close`.
     *
     * @param reason
     * @private
     */
    onclose(reason) {
        debug("close (%s)", reason);
        this.connected = false;
        this.disconnected = true;
        delete this.id;
        super.emit("disconnect", reason);
    }
    /**
     * Called with socket packet.
     *
     * @param packet
     * @private
     */
    onpacket(packet) {
        const sameNamespace = packet.nsp === this.nsp;
        if (!sameNamespace)
            return;
        switch (packet.type) {
            case socket_io_parser_1.PacketType.CONNECT:
                if (packet.data && packet.data.sid) {
                    const id = packet.data.sid;
                    this.onconnect(id);
                }
                else {
                    super.emit("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
                }
                break;
            case socket_io_parser_1.PacketType.EVENT:
                this.onevent(packet);
                break;
            case socket_io_parser_1.PacketType.BINARY_EVENT:
                this.onevent(packet);
                break;
            case socket_io_parser_1.PacketType.ACK:
                this.onack(packet);
                break;
            case socket_io_parser_1.PacketType.BINARY_ACK:
                this.onack(packet);
                break;
            case socket_io_parser_1.PacketType.DISCONNECT:
                this.ondisconnect();
                break;
            case socket_io_parser_1.PacketType.CONNECT_ERROR:
                const err = new Error(packet.data.message);
                // @ts-ignore
                err.data = packet.data.data;
                super.emit("connect_error", err);
                break;
        }
    }
    /**
     * Called upon a server event.
     *
     * @param packet
     * @private
     */
    onevent(packet) {
        const args = packet.data || [];
        debug("emitting event %j", args);
        if (null != packet.id) {
            debug("attaching ack callback to event");
            args.push(this.ack(packet.id));
        }
        if (this.connected) {
            this.emitEvent(args);
        }
        else {
            this.receiveBuffer.push(Object.freeze(args));
        }
    }
    emitEvent(args) {
        if (this._anyListeners && this._anyListeners.length) {
            const listeners = this._anyListeners.slice();
            for (const listener of listeners) {
                listener.apply(this, args);
            }
        }
        super.emit.apply(this, args);
    }
    /**
     * Produces an ack callback to emit with an event.
     *
     * @private
     */
    ack(id) {
        const self = this;
        let sent = false;
        return function (...args) {
            // prevent double callbacks
            if (sent)
                return;
            sent = true;
            debug("sending ack %j", args);
            self.packet({
                type: socket_io_parser_1.PacketType.ACK,
                id: id,
                data: args,
            });
        };
    }
    /**
     * Called upon a server acknowlegement.
     *
     * @param packet
     * @private
     */
    onack(packet) {
        const ack = this.acks[packet.id];
        if ("function" === typeof ack) {
            debug("calling ack %s with %j", packet.id, packet.data);
            ack.apply(this, packet.data);
            delete this.acks[packet.id];
        }
        else {
            debug("bad ack %s", packet.id);
        }
    }
    /**
     * Called upon server connect.
     *
     * @private
     */
    onconnect(id) {
        debug("socket connected with id %s", id);
        this.id = id;
        this.connected = true;
        this.disconnected = false;
        super.emit("connect");
        this.emitBuffered();
    }
    /**
     * Emit buffered events (received and emitted).
     *
     * @private
     */
    emitBuffered() {
        this.receiveBuffer.forEach((args) => this.emitEvent(args));
        this.receiveBuffer = [];
        this.sendBuffer.forEach((packet) => this.packet(packet));
        this.sendBuffer = [];
    }
    /**
     * Called upon server disconnect.
     *
     * @private
     */
    ondisconnect() {
        debug("server disconnect (%s)", this.nsp);
        this.destroy();
        this.onclose("io server disconnect");
    }
    /**
     * Called upon forced client/server side disconnections,
     * this method ensures the manager stops tracking us and
     * that reconnections don't get triggered for this.
     *
     * @private
     */
    destroy() {
        if (this.subs) {
            // clean subscriptions to avoid reconnections
            this.subs.forEach((subDestroy) => subDestroy());
            this.subs = undefined;
        }
        this.io["_destroy"](this);
    }
    /**
     * Disconnects the socket manually.
     *
     * @return self
     * @public
     */
    disconnect() {
        if (this.connected) {
            debug("performing disconnect (%s)", this.nsp);
            this.packet({ type: socket_io_parser_1.PacketType.DISCONNECT });
        }
        // remove socket from pool
        this.destroy();
        if (this.connected) {
            // fire events
            this.onclose("io client disconnect");
        }
        return this;
    }
    /**
     * Alias for disconnect()
     *
     * @return self
     * @public
     */
    close() {
        return this.disconnect();
    }
    /**
     * Sets the compress flag.
     *
     * @param compress - if `true`, compresses the sending data
     * @return self
     * @public
     */
    compress(compress) {
        this.flags.compress = compress;
        return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
     * ready to send messages.
     *
     * @returns self
     * @public
     */
    get volatile() {
        this.flags.volatile = true;
        return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * @param listener
     * @public
     */
    onAny(listener) {
        this._anyListeners = this._anyListeners || [];
        this._anyListeners.push(listener);
        return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * @param listener
     * @public
     */
    prependAny(listener) {
        this._anyListeners = this._anyListeners || [];
        this._anyListeners.unshift(listener);
        return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @param listener
     * @public
     */
    offAny(listener) {
        if (!this._anyListeners) {
            return this;
        }
        if (listener) {
            const listeners = this._anyListeners;
            for (let i = 0; i < listeners.length; i++) {
                if (listener === listeners[i]) {
                    listeners.splice(i, 1);
                    return this;
                }
            }
        }
        else {
            this._anyListeners = [];
        }
        return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     *
     * @public
     */
    listenersAny() {
        return this._anyListeners || [];
    }
}
exports.Socket = Socket;


/***/ }),

/***/ "./node_modules/socket.io-client/build/url.js":
/*!****************************************************!*\
  !*** ./node_modules/socket.io-client/build/url.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.url = void 0;
const parseuri = __webpack_require__(/*! parseuri */ "./node_modules/parseuri/index.js");
const debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("socket.io-client:url");
/**
 * URL parser.
 *
 * @param uri - url
 * @param path - the request path of the connection
 * @param loc - An object meant to mimic window.location.
 *        Defaults to window.location.
 * @public
 */
function url(uri, path = "", loc) {
    let obj = uri;
    // default to window.location
    loc = loc || (typeof location !== "undefined" && location);
    if (null == uri)
        uri = loc.protocol + "//" + loc.host;
    // relative path support
    if (typeof uri === "string") {
        if ("/" === uri.charAt(0)) {
            if ("/" === uri.charAt(1)) {
                uri = loc.protocol + uri;
            }
            else {
                uri = loc.host + uri;
            }
        }
        if (!/^(https?|wss?):\/\//.test(uri)) {
            debug("protocol-less url %s", uri);
            if ("undefined" !== typeof loc) {
                uri = loc.protocol + "//" + uri;
            }
            else {
                uri = "https://" + uri;
            }
        }
        // parse
        debug("parse %s", uri);
        obj = parseuri(uri);
    }
    // make sure we treat `localhost:80` and `localhost` equally
    if (!obj.port) {
        if (/^(http|ws)$/.test(obj.protocol)) {
            obj.port = "80";
        }
        else if (/^(http|ws)s$/.test(obj.protocol)) {
            obj.port = "443";
        }
    }
    obj.path = obj.path || "/";
    const ipv6 = obj.host.indexOf(":") !== -1;
    const host = ipv6 ? "[" + obj.host + "]" : obj.host;
    // define unique id
    obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
    // define href
    obj.href =
        obj.protocol +
            "://" +
            host +
            (loc && loc.port === obj.port ? "" : ":" + obj.port);
    return obj;
}
exports.url = url;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/game.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=bundle.js.map