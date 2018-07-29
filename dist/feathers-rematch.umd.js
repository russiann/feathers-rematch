(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('tty'), require('util'), require('fs'), require('net'), require('crypto')) :
	typeof define === 'function' && define.amd ? define(['exports', 'tty', 'util', 'fs', 'net', 'crypto'], factory) :
	(factory((global.feathersRematch = {}),global.tty,global.util,global.fs,global.net,global.crypto));
}(this, (function (exports,tty,util,fs,net,crypto) { 'use strict';

	tty = tty && tty.hasOwnProperty('default') ? tty['default'] : tty;
	util = util && util.hasOwnProperty('default') ? util['default'] : util;
	fs = fs && fs.hasOwnProperty('default') ? fs['default'] : fs;
	net = net && net.hasOwnProperty('default') ? net['default'] : net;
	crypto = crypto && crypto.hasOwnProperty('default') ? crypto['default'] : crypto;

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var seamlessImmutable = createCommonjsModule(function (module, exports) {
	(function() {

	function immutableInit(config) {

	  // https://github.com/facebook/react/blob/v15.0.1/src/isomorphic/classic/element/ReactElement.js#L21
	  var REACT_ELEMENT_TYPE = typeof Symbol === 'function' && Symbol.for && Symbol.for('react.element');
	  var REACT_ELEMENT_TYPE_FALLBACK = 0xeac7;

	  var globalConfig = {
	    use_static: false
	  };
	  if (isObject(config)) {
	      if (config.use_static !== undefined) {
	          globalConfig.use_static = Boolean(config.use_static);
	      }
	  }

	  function isObject(data) {
	    return (
	      typeof data === 'object' &&
	      !Array.isArray(data) &&
	      data !== null
	    );
	  }

	  function instantiateEmptyObject(obj) {
	      var prototype = Object.getPrototypeOf(obj);
	      if (!prototype) {
	          return {};
	      } else {
	          return Object.create(prototype);
	      }
	  }

	  function addPropertyTo(target, methodName, value) {
	    Object.defineProperty(target, methodName, {
	      enumerable: false,
	      configurable: false,
	      writable: false,
	      value: value
	    });
	  }

	  function banProperty(target, methodName) {
	    addPropertyTo(target, methodName, function() {
	      throw new ImmutableError("The " + methodName +
	        " method cannot be invoked on an Immutable data structure.");
	    });
	  }

	  var immutabilityTag = "__immutable_invariants_hold";

	  function addImmutabilityTag(target) {
	    addPropertyTo(target, immutabilityTag, true);
	  }

	  function isImmutable(target) {
	    if (typeof target === "object") {
	      return target === null || Boolean(
	        Object.getOwnPropertyDescriptor(target, immutabilityTag)
	      );
	    } else {
	      // In JavaScript, only objects are even potentially mutable.
	      // strings, numbers, null, and undefined are all naturally immutable.
	      return true;
	    }
	  }

	  function isEqual(a, b) {
	    // Avoid false positives due to (NaN !== NaN) evaluating to true
	    return (a === b || (a !== a && b !== b));
	  }

	  function isMergableObject(target) {
	    return target !== null && typeof target === "object" && !(Array.isArray(target)) && !(target instanceof Date);
	  }

	  var mutatingObjectMethods = [
	    "setPrototypeOf"
	  ];

	  var nonMutatingObjectMethods = [
	    "keys"
	  ];

	  var mutatingArrayMethods = mutatingObjectMethods.concat([
	    "push", "pop", "sort", "splice", "shift", "unshift", "reverse"
	  ]);

	  var nonMutatingArrayMethods = nonMutatingObjectMethods.concat([
	    "map", "filter", "slice", "concat", "reduce", "reduceRight"
	  ]);

	  var mutatingDateMethods = mutatingObjectMethods.concat([
	    "setDate", "setFullYear", "setHours", "setMilliseconds", "setMinutes", "setMonth", "setSeconds",
	    "setTime", "setUTCDate", "setUTCFullYear", "setUTCHours", "setUTCMilliseconds", "setUTCMinutes",
	    "setUTCMonth", "setUTCSeconds", "setYear"
	  ]);

	  function ImmutableError(message) {
	    this.name = 'MyError';
	    this.message = message;
	    this.stack = (new Error()).stack;
	  }
	  ImmutableError.prototype = new Error();
	  ImmutableError.prototype.constructor = Error;

	  function makeImmutable(obj, bannedMethods) {
	    // Tag it so we can quickly tell it's immutable later.
	    addImmutabilityTag(obj);

	    if (process.env.NODE_ENV !== "production") {
	      // Make all mutating methods throw exceptions.
	      for (var index in bannedMethods) {
	        if (bannedMethods.hasOwnProperty(index)) {
	          banProperty(obj, bannedMethods[index]);
	        }
	      }

	      // Freeze it and return it.
	      Object.freeze(obj);
	    }

	    return obj;
	  }

	  function makeMethodReturnImmutable(obj, methodName) {
	    var currentMethod = obj[methodName];

	    addPropertyTo(obj, methodName, function() {
	      return Immutable(currentMethod.apply(obj, arguments));
	    });
	  }

	  function arraySet(idx, value, config) {
	    var deep          = config && config.deep;

	    if (idx in this) {
	      if (deep && this[idx] !== value && isMergableObject(value) && isMergableObject(this[idx])) {
	        value = Immutable.merge(this[idx], value, {deep: true, mode: 'replace'});
	      }
	      if (isEqual(this[idx], value)) {
	        return this;
	      }
	    }

	    var mutable = asMutableArray.call(this);
	    mutable[idx] = Immutable(value);
	    return makeImmutableArray(mutable);
	  }

	  var immutableEmptyArray = Immutable([]);

	  function arraySetIn(pth, value, config) {
	    var head = pth[0];

	    if (pth.length === 1) {
	      return arraySet.call(this, head, value, config);
	    } else {
	      var tail = pth.slice(1);
	      var thisHead = this[head];
	      var newValue;

	      if (typeof(thisHead) === "object" && thisHead !== null) {
	        // Might (validly) be object or array
	        newValue = Immutable.setIn(thisHead, tail, value);
	      } else {
	        var nextHead = tail[0];
	        // If the next path part is a number, then we are setting into an array, else an object.
	        if (nextHead !== '' && isFinite(nextHead)) {
	          newValue = arraySetIn.call(immutableEmptyArray, tail, value);
	        } else {
	          newValue = objectSetIn.call(immutableEmptyObject, tail, value);
	        }
	      }

	      if (head in this && thisHead === newValue) {
	        return this;
	      }

	      var mutable = asMutableArray.call(this);
	      mutable[head] = newValue;
	      return makeImmutableArray(mutable);
	    }
	  }

	  function makeImmutableArray(array) {
	    // Don't change their implementations, but wrap these functions to make sure
	    // they always return an immutable value.
	    for (var index in nonMutatingArrayMethods) {
	      if (nonMutatingArrayMethods.hasOwnProperty(index)) {
	        var methodName = nonMutatingArrayMethods[index];
	        makeMethodReturnImmutable(array, methodName);
	      }
	    }

	    if (!globalConfig.use_static) {
	      addPropertyTo(array, "flatMap",  flatMap);
	      addPropertyTo(array, "asObject", asObject);
	      addPropertyTo(array, "asMutable", asMutableArray);
	      addPropertyTo(array, "set", arraySet);
	      addPropertyTo(array, "setIn", arraySetIn);
	      addPropertyTo(array, "update", update);
	      addPropertyTo(array, "updateIn", updateIn);
	      addPropertyTo(array, "getIn", getIn);
	    }

	    for(var i = 0, length = array.length; i < length; i++) {
	      array[i] = Immutable(array[i]);
	    }

	    return makeImmutable(array, mutatingArrayMethods);
	  }

	  function makeImmutableDate(date) {
	    if (!globalConfig.use_static) {
	      addPropertyTo(date, "asMutable", asMutableDate);
	    }

	    return makeImmutable(date, mutatingDateMethods);
	  }

	  function asMutableDate() {
	    return new Date(this.getTime());
	  }

	  /**
	   * Effectively performs a map() over the elements in the array, using the
	   * provided iterator, except that whenever the iterator returns an array, that
	   * array's elements are added to the final result instead of the array itself.
	   *
	   * @param {function} iterator - The iterator function that will be invoked on each element in the array. It will receive three arguments: the current value, the current index, and the current object.
	   */
	  function flatMap(iterator) {
	    // Calling .flatMap() with no arguments is a no-op. Don't bother cloning.
	    if (arguments.length === 0) {
	      return this;
	    }

	    var result = [],
	        length = this.length,
	        index;

	    for (index = 0; index < length; index++) {
	      var iteratorResult = iterator(this[index], index, this);

	      if (Array.isArray(iteratorResult)) {
	        // Concatenate Array results into the return value we're building up.
	        result.push.apply(result, iteratorResult);
	      } else {
	        // Handle non-Array results the same way map() does.
	        result.push(iteratorResult);
	      }
	    }

	    return makeImmutableArray(result);
	  }

	  /**
	   * Returns an Immutable copy of the object without the given keys included.
	   *
	   * @param {array} keysToRemove - A list of strings representing the keys to exclude in the return value. Instead of providing a single array, this method can also be called by passing multiple strings as separate arguments.
	   */
	  function without(remove) {
	    // Calling .without() with no arguments is a no-op. Don't bother cloning.
	    if (typeof remove === "undefined" && arguments.length === 0) {
	      return this;
	    }

	    if (typeof remove !== "function") {
	      // If we weren't given an array, use the arguments list.
	      var keysToRemoveArray = (Array.isArray(remove)) ?
	         remove.slice() : Array.prototype.slice.call(arguments);

	      // Convert numeric keys to strings since that's how they'll
	      // come from the enumeration of the object.
	      keysToRemoveArray.forEach(function(el, idx, arr) {
	        if(typeof(el) === "number") {
	          arr[idx] = el.toString();
	        }
	      });

	      remove = function(val, key) {
	        return keysToRemoveArray.indexOf(key) !== -1;
	      };
	    }

	    var result = instantiateEmptyObject(this);

	    for (var key in this) {
	      if (this.hasOwnProperty(key) && remove(this[key], key) === false) {
	        result[key] = this[key];
	      }
	    }

	    return makeImmutableObject(result);
	  }

	  function asMutableArray(opts) {
	    var result = [], i, length;

	    if(opts && opts.deep) {
	      for(i = 0, length = this.length; i < length; i++) {
	        result.push(asDeepMutable(this[i]));
	      }
	    } else {
	      for(i = 0, length = this.length; i < length; i++) {
	        result.push(this[i]);
	      }
	    }

	    return result;
	  }

	  /**
	   * Effectively performs a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) over the elements in the array, expecting that the iterator function
	   * will return an array of two elements - the first representing a key, the other
	   * a value. Then returns an Immutable Object constructed of those keys and values.
	   *
	   * @param {function} iterator - A function which should return an array of two elements - the first representing the desired key, the other the desired value.
	   */
	  function asObject(iterator) {
	    // If no iterator was provided, assume the identity function
	    // (suggesting this array is already a list of key/value pairs.)
	    if (typeof iterator !== "function") {
	      iterator = function(value) { return value; };
	    }

	    var result = {},
	        length = this.length,
	        index;

	    for (index = 0; index < length; index++) {
	      var pair  = iterator(this[index], index, this),
	          key   = pair[0],
	          value = pair[1];

	      result[key] = value;
	    }

	    return makeImmutableObject(result);
	  }

	  function asDeepMutable(obj) {
	    if (
	      (!obj) ||
	      (typeof obj !== 'object') ||
	      (!Object.getOwnPropertyDescriptor(obj, immutabilityTag)) ||
	      (obj instanceof Date)
	    ) { return obj; }
	    return Immutable.asMutable(obj, {deep: true});
	  }

	  function quickCopy(src, dest) {
	    for (var key in src) {
	      if (Object.getOwnPropertyDescriptor(src, key)) {
	        dest[key] = src[key];
	      }
	    }

	    return dest;
	  }

	  /**
	   * Returns an Immutable Object containing the properties and values of both
	   * this object and the provided object, prioritizing the provided object's
	   * values whenever the same key is present in both objects.
	   *
	   * @param {object} other - The other object to merge. Multiple objects can be passed as an array. In such a case, the later an object appears in that list, the higher its priority.
	   * @param {object} config - Optional config object that contains settings. Supported settings are: {deep: true} for deep merge and {merger: mergerFunc} where mergerFunc is a function
	   *                          that takes a property from both objects. If anything is returned it overrides the normal merge behaviour.
	   */
	  function merge(other, config) {
	    // Calling .merge() with no arguments is a no-op. Don't bother cloning.
	    if (arguments.length === 0) {
	      return this;
	    }

	    if (other === null || (typeof other !== "object")) {
	      throw new TypeError("Immutable#merge can only be invoked with objects or arrays, not " + JSON.stringify(other));
	    }

	    var receivedArray = (Array.isArray(other)),
	        deep          = config && config.deep,
	        mode          = config && config.mode || 'merge',
	        merger        = config && config.merger,
	        result;

	    // Use the given key to extract a value from the given object, then place
	    // that value in the result object under the same key. If that resulted
	    // in a change from this object's value at that key, set anyChanges = true.
	    function addToResult(currentObj, otherObj, key) {
	      var immutableValue = Immutable(otherObj[key]);
	      var mergerResult = merger && merger(currentObj[key], immutableValue, config);
	      var currentValue = currentObj[key];

	      if ((result !== undefined) ||
	        (mergerResult !== undefined) ||
	        (!currentObj.hasOwnProperty(key)) ||
	        !isEqual(immutableValue, currentValue)) {

	        var newValue;

	        if (mergerResult) {
	          newValue = mergerResult;
	        } else if (deep && isMergableObject(currentValue) && isMergableObject(immutableValue)) {
	          newValue = Immutable.merge(currentValue, immutableValue, config);
	        } else {
	          newValue = immutableValue;
	        }

	        if (!isEqual(currentValue, newValue) || !currentObj.hasOwnProperty(key)) {
	          if (result === undefined) {
	            // Make a shallow clone of the current object.
	            result = quickCopy(currentObj, instantiateEmptyObject(currentObj));
	          }

	          result[key] = newValue;
	        }
	      }
	    }

	    function clearDroppedKeys(currentObj, otherObj) {
	      for (var key in currentObj) {
	        if (!otherObj.hasOwnProperty(key)) {
	          if (result === undefined) {
	            // Make a shallow clone of the current object.
	            result = quickCopy(currentObj, instantiateEmptyObject(currentObj));
	          }
	          delete result[key];
	        }
	      }
	    }

	    var key;

	    // Achieve prioritization by overriding previous values that get in the way.
	    if (!receivedArray) {
	      // The most common use case: just merge one object into the existing one.
	      for (key in other) {
	        if (Object.getOwnPropertyDescriptor(other, key)) {
	          addToResult(this, other, key);
	        }
	      }
	      if (mode === 'replace') {
	        clearDroppedKeys(this, other);
	      }
	    } else {
	      // We also accept an Array
	      for (var index = 0, length = other.length; index < length; index++) {
	        var otherFromArray = other[index];

	        for (key in otherFromArray) {
	          if (otherFromArray.hasOwnProperty(key)) {
	            addToResult(result !== undefined ? result : this, otherFromArray, key);
	          }
	        }
	      }
	    }

	    if (result === undefined) {
	      return this;
	    } else {
	      return makeImmutableObject(result);
	    }
	  }

	  function objectReplace(value, config) {
	    var deep          = config && config.deep;

	    // Calling .replace() with no arguments is a no-op. Don't bother cloning.
	    if (arguments.length === 0) {
	      return this;
	    }

	    if (value === null || typeof value !== "object") {
	      throw new TypeError("Immutable#replace can only be invoked with objects or arrays, not " + JSON.stringify(value));
	    }

	    return Immutable.merge(this, value, {deep: deep, mode: 'replace'});
	  }

	  var immutableEmptyObject = Immutable({});

	  function objectSetIn(path, value, config) {
	    if (!(Array.isArray(path)) || path.length === 0) {
	      throw new TypeError("The first argument to Immutable#setIn must be an array containing at least one \"key\" string.");
	    }

	    var head = path[0];
	    if (path.length === 1) {
	      return objectSet.call(this, head, value, config);
	    }

	    var tail = path.slice(1);
	    var newValue;
	    var thisHead = this[head];

	    if (this.hasOwnProperty(head) && typeof(thisHead) === "object" && thisHead !== null) {
	      // Might (validly) be object or array
	      newValue = Immutable.setIn(thisHead, tail, value);
	    } else {
	      newValue = objectSetIn.call(immutableEmptyObject, tail, value);
	    }

	    if (this.hasOwnProperty(head) && thisHead === newValue) {
	      return this;
	    }

	    var mutable = quickCopy(this, instantiateEmptyObject(this));
	    mutable[head] = newValue;
	    return makeImmutableObject(mutable);
	  }

	  function objectSet(property, value, config) {
	    var deep          = config && config.deep;

	    if (this.hasOwnProperty(property)) {
	      if (deep && this[property] !== value && isMergableObject(value) && isMergableObject(this[property])) {
	        value = Immutable.merge(this[property], value, {deep: true, mode: 'replace'});
	      }
	      if (isEqual(this[property], value)) {
	        return this;
	      }
	    }

	    var mutable = quickCopy(this, instantiateEmptyObject(this));
	    mutable[property] = Immutable(value);
	    return makeImmutableObject(mutable);
	  }

	  function update(property, updater) {
	    var restArgs = Array.prototype.slice.call(arguments, 2);
	    var initialVal = this[property];
	    return Immutable.set(this, property, updater.apply(initialVal, [initialVal].concat(restArgs)));
	  }

	  function getInPath(obj, path) {
	    /*jshint eqnull:true */
	    for (var i = 0, l = path.length; obj != null && i < l; i++) {
	      obj = obj[path[i]];
	    }

	    return (i && i == l) ? obj : undefined;
	  }

	  function updateIn(path, updater) {
	    var restArgs = Array.prototype.slice.call(arguments, 2);
	    var initialVal = getInPath(this, path);

	    return Immutable.setIn(this, path, updater.apply(initialVal, [initialVal].concat(restArgs)));
	  }

	  function getIn(path, defaultValue) {
	    var value = getInPath(this, path);
	    return value === undefined ? defaultValue : value;
	  }

	  function asMutableObject(opts) {
	    var result = instantiateEmptyObject(this), key;

	    if(opts && opts.deep) {
	      for (key in this) {
	        if (this.hasOwnProperty(key)) {
	          result[key] = asDeepMutable(this[key]);
	        }
	      }
	    } else {
	      for (key in this) {
	        if (this.hasOwnProperty(key)) {
	          result[key] = this[key];
	        }
	      }
	    }

	    return result;
	  }

	  // Creates plain object to be used for cloning
	  function instantiatePlainObject() {
	    return {};
	  }

	  // Finalizes an object with immutable methods, freezes it, and returns it.
	  function makeImmutableObject(obj) {
	    if (!globalConfig.use_static) {
	      addPropertyTo(obj, "merge", merge);
	      addPropertyTo(obj, "replace", objectReplace);
	      addPropertyTo(obj, "without", without);
	      addPropertyTo(obj, "asMutable", asMutableObject);
	      addPropertyTo(obj, "set", objectSet);
	      addPropertyTo(obj, "setIn", objectSetIn);
	      addPropertyTo(obj, "update", update);
	      addPropertyTo(obj, "updateIn", updateIn);
	      addPropertyTo(obj, "getIn", getIn);
	    }

	    return makeImmutable(obj, mutatingObjectMethods);
	  }

	  // Returns true if object is a valid react element
	  // https://github.com/facebook/react/blob/v15.0.1/src/isomorphic/classic/element/ReactElement.js#L326
	  function isReactElement(obj) {
	    return typeof obj === 'object' &&
	           obj !== null &&
	           (obj.$$typeof === REACT_ELEMENT_TYPE_FALLBACK || obj.$$typeof === REACT_ELEMENT_TYPE);
	  }

	  function isFileObject(obj) {
	    return typeof File !== 'undefined' &&
	           obj instanceof File;
	  }

	  function isBlobObject(obj) {
	    return typeof Blob !== 'undefined' &&
	           obj instanceof Blob;
	  }

	  function isPromise(obj) {
	    return typeof obj === 'object' &&
	           typeof obj.then === 'function';
	  }

	  function isError(obj) {
	    return obj instanceof Error;
	  }

	  function Immutable(obj, options, stackRemaining) {
	    if (isImmutable(obj) || isReactElement(obj) || isFileObject(obj) || isBlobObject(obj) || isError(obj)) {
	      return obj;
	    } else if (isPromise(obj)) {
	      return obj.then(Immutable);
	    } else if (Array.isArray(obj)) {
	      return makeImmutableArray(obj.slice());
	    } else if (obj instanceof Date) {
	      return makeImmutableDate(new Date(obj.getTime()));
	    } else {
	      // Don't freeze the object we were given; make a clone and use that.
	      var prototype = options && options.prototype;
	      var instantiateEmptyObject =
	        (!prototype || prototype === Object.prototype) ?
	          instantiatePlainObject : (function() { return Object.create(prototype); });
	      var clone = instantiateEmptyObject();

	      if (process.env.NODE_ENV !== "production") {
	        /*jshint eqnull:true */
	        if (stackRemaining == null) {
	          stackRemaining = 64;
	        }
	        if (stackRemaining <= 0) {
	          throw new ImmutableError("Attempt to construct Immutable from a deeply nested object was detected." +
	            " Have you tried to wrap an object with circular references (e.g. React element)?" +
	            " See https://github.com/rtfeldman/seamless-immutable/wiki/Deeply-nested-object-was-detected for details.");
	        }
	        stackRemaining -= 1;
	      }

	      for (var key in obj) {
	        if (Object.getOwnPropertyDescriptor(obj, key)) {
	          clone[key] = Immutable(obj[key], undefined, stackRemaining);
	        }
	      }

	      return makeImmutableObject(clone);
	    }
	  }

	  // Wrapper to allow the use of object methods as static methods of Immutable.
	  function toStatic(fn) {
	    function staticWrapper() {
	      var args = [].slice.call(arguments);
	      var self = args.shift();
	      return fn.apply(self, args);
	    }

	    return staticWrapper;
	  }

	  // Wrapper to allow the use of object methods as static methods of Immutable.
	  // with the additional condition of choosing which function to call depending
	  // if argument is an array or an object.
	  function toStaticObjectOrArray(fnObject, fnArray) {
	    function staticWrapper() {
	      var args = [].slice.call(arguments);
	      var self = args.shift();
	      if (Array.isArray(self)) {
	          return fnArray.apply(self, args);
	      } else {
	          return fnObject.apply(self, args);
	      }
	    }

	    return staticWrapper;
	  }

	  // Wrapper to allow the use of object methods as static methods of Immutable.
	  // with the additional condition of choosing which function to call depending
	  // if argument is an array or an object or a date.
	  function toStaticObjectOrDateOrArray(fnObject, fnArray, fnDate) {
	    function staticWrapper() {
	      var args = [].slice.call(arguments);
	      var self = args.shift();
	      if (Array.isArray(self)) {
	          return fnArray.apply(self, args);
	      } else if (self instanceof Date) {
	          return fnDate.apply(self, args);
	      } else {
	          return fnObject.apply(self, args);
	      }
	    }

	    return staticWrapper;
	  }

	  // Export the library
	  Immutable.from           = Immutable;
	  Immutable.isImmutable    = isImmutable;
	  Immutable.ImmutableError = ImmutableError;
	  Immutable.merge          = toStatic(merge);
	  Immutable.replace        = toStatic(objectReplace);
	  Immutable.without        = toStatic(without);
	  Immutable.asMutable      = toStaticObjectOrDateOrArray(asMutableObject, asMutableArray, asMutableDate);
	  Immutable.set            = toStaticObjectOrArray(objectSet, arraySet);
	  Immutable.setIn          = toStaticObjectOrArray(objectSetIn, arraySetIn);
	  Immutable.update         = toStatic(update);
	  Immutable.updateIn       = toStatic(updateIn);
	  Immutable.getIn          = toStatic(getIn);
	  Immutable.flatMap        = toStatic(flatMap);
	  Immutable.asObject       = toStatic(asObject);
	  if (!globalConfig.use_static) {
	      Immutable.static = immutableInit({
	          use_static: true
	      });
	  }

	  Object.freeze(Immutable);

	  return Immutable;
	}

	  var Immutable = immutableInit();
	  /* istanbul ignore if */
	  {
	    module.exports = Immutable;
	  }
	})();
	});
	var seamlessImmutable_1 = seamlessImmutable.Immutable;

	const translator = {
	  'pending':  { loading: true,  saving: false, finished: false, error: false },
	  'saving':   { loading: true,  saving: true,  finished: false, error: false },
	  'finished': { loading: false, saving: false, finished: true,  error: false },
	  'error':    { loading: false, saving: false, finished: true,  error: true },
	};

	const createStatusObject = (status) => translator[status];

	const request = (state, { namespace, request, method, status }) => {
	  const response = {
	    [method]: {
	      request,
	      status: createStatusObject(status)
	    }
	  };
	  return namespace
	    ? state.merge({ namespaces: { [namespace]: response } }, { deep: true })
	    : state.merge(response, { deep: true });
	};

	const response = (state, { namespace, result, method }) => {
	  const response = {
	    [method]: {
	      result,
	      status: createStatusObject('finished')
	    }
	  };
	  return namespace
	    ? state.merge({ namespaces: { [namespace]: response } }, { deep: true })
	    : state.merge(response, { deep: true });
	};

	const error = (state, { namespace, error, method }) => {
	  const response = {
	    [method]: {
	      error,
	      status: createStatusObject('error')
	    }
	  };
	  return namespace
	    ? state.merge({ namespaces: { [namespace]: response } }, { deep: true })
	    : state.merge(response, { deep: true });
	};

	const store = (state, { records, connected, last, publications }) => {
	  return state
	    .set('store', records)
	    .set('publications', publications)
	    .setIn(['meta', 'last'], last)
	    .setIn(['meta', 'connected'], connected);
	};

	const isPaginatedResult = (result) => {
	  if (!result) return false;
	  const keys = Object.keys(result);
	  return (
	    keys.includes('limit') &&
	    keys.includes('total')
	  );
	};

	const updateRootFindResult = (state, payload, iteratee) => {
	  const result = state.find.result;
	  if (!result) return state;
	  return isPaginatedResult(result)
	    ? state.setIn(
	      ['find', 'result', 'data'],
	      iteratee(result.data, payload)
	    )
	    : state.setIn(
	      ['find', 'result'],
	      iteratee(result, payload)
	    );
	};

	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;

	var isArray_1 = isArray;

	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

	var _freeGlobal = freeGlobal;

	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

	/** Used as a reference to the global object. */
	var root = _freeGlobal || freeSelf || Function('return this')();

	var _root = root;

	/** Built-in value references. */
	var Symbol$1 = _root.Symbol;

	var _Symbol = Symbol$1;

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = objectProto.toString;

	/** Built-in value references. */
	var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

	/**
	 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the raw `toStringTag`.
	 */
	function getRawTag(value) {
	  var isOwn = hasOwnProperty.call(value, symToStringTag),
	      tag = value[symToStringTag];

	  try {
	    value[symToStringTag] = undefined;
	  } catch (e) {}

	  var result = nativeObjectToString.call(value);
	  {
	    if (isOwn) {
	      value[symToStringTag] = tag;
	    } else {
	      delete value[symToStringTag];
	    }
	  }
	  return result;
	}

	var _getRawTag = getRawTag;

	/** Used for built-in method references. */
	var objectProto$1 = Object.prototype;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString$1 = objectProto$1.toString;

	/**
	 * Converts `value` to a string using `Object.prototype.toString`.
	 *
	 * @private
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 */
	function objectToString(value) {
	  return nativeObjectToString$1.call(value);
	}

	var _objectToString = objectToString;

	/** `Object#toString` result references. */
	var nullTag = '[object Null]',
	    undefinedTag = '[object Undefined]';

	/** Built-in value references. */
	var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

	/**
	 * The base implementation of `getTag` without fallbacks for buggy environments.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	function baseGetTag(value) {
	  if (value == null) {
	    return value === undefined ? undefinedTag : nullTag;
	  }
	  return (symToStringTag$1 && symToStringTag$1 in Object(value))
	    ? _getRawTag(value)
	    : _objectToString(value);
	}

	var _baseGetTag = baseGetTag;

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return value != null && typeof value == 'object';
	}

	var isObjectLike_1 = isObjectLike;

	/** `Object#toString` result references. */
	var symbolTag = '[object Symbol]';

	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */
	function isSymbol(value) {
	  return typeof value == 'symbol' ||
	    (isObjectLike_1(value) && _baseGetTag(value) == symbolTag);
	}

	var isSymbol_1 = isSymbol;

	/** Used to match property names within property paths. */
	var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
	    reIsPlainProp = /^\w*$/;

	/**
	 * Checks if `value` is a property name and not a property path.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	 */
	function isKey(value, object) {
	  if (isArray_1(value)) {
	    return false;
	  }
	  var type = typeof value;
	  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
	      value == null || isSymbol_1(value)) {
	    return true;
	  }
	  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
	    (object != null && value in Object(object));
	}

	var _isKey = isKey;

	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  var type = typeof value;
	  return value != null && (type == 'object' || type == 'function');
	}

	var isObject_1 = isObject;

	/** `Object#toString` result references. */
	var asyncTag = '[object AsyncFunction]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    proxyTag = '[object Proxy]';

	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  if (!isObject_1(value)) {
	    return false;
	  }
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 9 which returns 'object' for typed arrays and other constructors.
	  var tag = _baseGetTag(value);
	  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
	}

	var isFunction_1 = isFunction;

	/** Used to detect overreaching core-js shims. */
	var coreJsData = _root['__core-js_shared__'];

	var _coreJsData = coreJsData;

	/** Used to detect methods masquerading as native. */
	var maskSrcKey = (function() {
	  var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
	  return uid ? ('Symbol(src)_1.' + uid) : '';
	}());

	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked(func) {
	  return !!maskSrcKey && (maskSrcKey in func);
	}

	var _isMasked = isMasked;

	/** Used for built-in method references. */
	var funcProto = Function.prototype;

	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;

	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to convert.
	 * @returns {string} Returns the source code.
	 */
	function toSource(func) {
	  if (func != null) {
	    try {
	      return funcToString.call(func);
	    } catch (e) {}
	    try {
	      return (func + '');
	    } catch (e) {}
	  }
	  return '';
	}

	var _toSource = toSource;

	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;

	/** Used for built-in method references. */
	var funcProto$1 = Function.prototype,
	    objectProto$2 = Object.prototype;

	/** Used to resolve the decompiled source of functions. */
	var funcToString$1 = funcProto$1.toString;

	/** Used to check objects for own properties. */
	var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	  funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);

	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative(value) {
	  if (!isObject_1(value) || _isMasked(value)) {
	    return false;
	  }
	  var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
	  return pattern.test(_toSource(value));
	}

	var _baseIsNative = baseIsNative;

	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function getValue(object, key) {
	  return object == null ? undefined : object[key];
	}

	var _getValue = getValue;

	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	  var value = _getValue(object, key);
	  return _baseIsNative(value) ? value : undefined;
	}

	var _getNative = getNative;

	/* Built-in method references that are verified to be native. */
	var nativeCreate = _getNative(Object, 'create');

	var _nativeCreate = nativeCreate;

	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear() {
	  this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
	  this.size = 0;
	}

	var _hashClear = hashClear;

	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete(key) {
	  var result = this.has(key) && delete this.__data__[key];
	  this.size -= result ? 1 : 0;
	  return result;
	}

	var _hashDelete = hashDelete;

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';

	/** Used for built-in method references. */
	var objectProto$3 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(key) {
	  var data = this.__data__;
	  if (_nativeCreate) {
	    var result = data[key];
	    return result === HASH_UNDEFINED ? undefined : result;
	  }
	  return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
	}

	var _hashGet = hashGet;

	/** Used for built-in method references. */
	var objectProto$4 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(key) {
	  var data = this.__data__;
	  return _nativeCreate ? (data[key] !== undefined) : hasOwnProperty$3.call(data, key);
	}

	var _hashHas = hashHas;

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet(key, value) {
	  var data = this.__data__;
	  this.size += this.has(key) ? 0 : 1;
	  data[key] = (_nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
	  return this;
	}

	var _hashSet = hashSet;

	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `Hash`.
	Hash.prototype.clear = _hashClear;
	Hash.prototype['delete'] = _hashDelete;
	Hash.prototype.get = _hashGet;
	Hash.prototype.has = _hashHas;
	Hash.prototype.set = _hashSet;

	var _Hash = Hash;

	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */
	function listCacheClear() {
	  this.__data__ = [];
	  this.size = 0;
	}

	var _listCacheClear = listCacheClear;

	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq(value, other) {
	  return value === other || (value !== value && other !== other);
	}

	var eq_1 = eq;

	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
	  var length = array.length;
	  while (length--) {
	    if (eq_1(array[length][0], key)) {
	      return length;
	    }
	  }
	  return -1;
	}

	var _assocIndexOf = assocIndexOf;

	/** Used for built-in method references. */
	var arrayProto = Array.prototype;

	/** Built-in value references. */
	var splice = arrayProto.splice;

	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete(key) {
	  var data = this.__data__,
	      index = _assocIndexOf(data, key);

	  if (index < 0) {
	    return false;
	  }
	  var lastIndex = data.length - 1;
	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice.call(data, index, 1);
	  }
	  --this.size;
	  return true;
	}

	var _listCacheDelete = listCacheDelete;

	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet(key) {
	  var data = this.__data__,
	      index = _assocIndexOf(data, key);

	  return index < 0 ? undefined : data[index][1];
	}

	var _listCacheGet = listCacheGet;

	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas(key) {
	  return _assocIndexOf(this.__data__, key) > -1;
	}

	var _listCacheHas = listCacheHas;

	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet(key, value) {
	  var data = this.__data__,
	      index = _assocIndexOf(data, key);

	  if (index < 0) {
	    ++this.size;
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }
	  return this;
	}

	var _listCacheSet = listCacheSet;

	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `ListCache`.
	ListCache.prototype.clear = _listCacheClear;
	ListCache.prototype['delete'] = _listCacheDelete;
	ListCache.prototype.get = _listCacheGet;
	ListCache.prototype.has = _listCacheHas;
	ListCache.prototype.set = _listCacheSet;

	var _ListCache = ListCache;

	/* Built-in method references that are verified to be native. */
	var Map = _getNative(_root, 'Map');

	var _Map = Map;

	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear() {
	  this.size = 0;
	  this.__data__ = {
	    'hash': new _Hash,
	    'map': new (_Map || _ListCache),
	    'string': new _Hash
	  };
	}

	var _mapCacheClear = mapCacheClear;

	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
	  var type = typeof value;
	  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
	    ? (value !== '__proto__')
	    : (value === null);
	}

	var _isKeyable = isKeyable;

	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData(map, key) {
	  var data = map.__data__;
	  return _isKeyable(key)
	    ? data[typeof key == 'string' ? 'string' : 'hash']
	    : data.map;
	}

	var _getMapData = getMapData;

	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete(key) {
	  var result = _getMapData(this, key)['delete'](key);
	  this.size -= result ? 1 : 0;
	  return result;
	}

	var _mapCacheDelete = mapCacheDelete;

	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet(key) {
	  return _getMapData(this, key).get(key);
	}

	var _mapCacheGet = mapCacheGet;

	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas(key) {
	  return _getMapData(this, key).has(key);
	}

	var _mapCacheHas = mapCacheHas;

	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet(key, value) {
	  var data = _getMapData(this, key),
	      size = data.size;

	  data.set(key, value);
	  this.size += data.size == size ? 0 : 1;
	  return this;
	}

	var _mapCacheSet = mapCacheSet;

	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `MapCache`.
	MapCache.prototype.clear = _mapCacheClear;
	MapCache.prototype['delete'] = _mapCacheDelete;
	MapCache.prototype.get = _mapCacheGet;
	MapCache.prototype.has = _mapCacheHas;
	MapCache.prototype.set = _mapCacheSet;

	var _MapCache = MapCache;

	/** Error message constants. */
	var FUNC_ERROR_TEXT = 'Expected a function';

	/**
	 * Creates a function that memoizes the result of `func`. If `resolver` is
	 * provided, it determines the cache key for storing the result based on the
	 * arguments provided to the memoized function. By default, the first argument
	 * provided to the memoized function is used as the map cache key. The `func`
	 * is invoked with the `this` binding of the memoized function.
	 *
	 * **Note:** The cache is exposed as the `cache` property on the memoized
	 * function. Its creation may be customized by replacing the `_.memoize.Cache`
	 * constructor with one whose instances implement the
	 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
	 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to have its output memoized.
	 * @param {Function} [resolver] The function to resolve the cache key.
	 * @returns {Function} Returns the new memoized function.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2 };
	 * var other = { 'c': 3, 'd': 4 };
	 *
	 * var values = _.memoize(_.values);
	 * values(object);
	 * // => [1, 2]
	 *
	 * values(other);
	 * // => [3, 4]
	 *
	 * object.a = 2;
	 * values(object);
	 * // => [1, 2]
	 *
	 * // Modify the result cache.
	 * values.cache.set(object, ['a', 'b']);
	 * values(object);
	 * // => ['a', 'b']
	 *
	 * // Replace `_.memoize.Cache`.
	 * _.memoize.Cache = WeakMap;
	 */
	function memoize(func, resolver) {
	  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
	    throw new TypeError(FUNC_ERROR_TEXT);
	  }
	  var memoized = function() {
	    var args = arguments,
	        key = resolver ? resolver.apply(this, args) : args[0],
	        cache = memoized.cache;

	    if (cache.has(key)) {
	      return cache.get(key);
	    }
	    var result = func.apply(this, args);
	    memoized.cache = cache.set(key, result) || cache;
	    return result;
	  };
	  memoized.cache = new (memoize.Cache || _MapCache);
	  return memoized;
	}

	// Expose `MapCache`.
	memoize.Cache = _MapCache;

	var memoize_1 = memoize;

	/** Used as the maximum memoize cache size. */
	var MAX_MEMOIZE_SIZE = 500;

	/**
	 * A specialized version of `_.memoize` which clears the memoized function's
	 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
	 *
	 * @private
	 * @param {Function} func The function to have its output memoized.
	 * @returns {Function} Returns the new memoized function.
	 */
	function memoizeCapped(func) {
	  var result = memoize_1(func, function(key) {
	    if (cache.size === MAX_MEMOIZE_SIZE) {
	      cache.clear();
	    }
	    return key;
	  });

	  var cache = result.cache;
	  return result;
	}

	var _memoizeCapped = memoizeCapped;

	/** Used to match property names within property paths. */
	var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

	/** Used to match backslashes in property paths. */
	var reEscapeChar = /\\(\\)?/g;

	/**
	 * Converts `string` to a property path array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the property path array.
	 */
	var stringToPath = _memoizeCapped(function(string) {
	  var result = [];
	  if (string.charCodeAt(0) === 46 /* . */) {
	    result.push('');
	  }
	  string.replace(rePropName, function(match, number, quote, subString) {
	    result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
	  });
	  return result;
	});

	var _stringToPath = stringToPath;

	/**
	 * A specialized version of `_.map` for arrays without support for iteratee
	 * shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function arrayMap(array, iteratee) {
	  var index = -1,
	      length = array == null ? 0 : array.length,
	      result = Array(length);

	  while (++index < length) {
	    result[index] = iteratee(array[index], index, array);
	  }
	  return result;
	}

	var _arrayMap = arrayMap;

	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0;

	/** Used to convert symbols to primitives and strings. */
	var symbolProto = _Symbol ? _Symbol.prototype : undefined,
	    symbolToString = symbolProto ? symbolProto.toString : undefined;

	/**
	 * The base implementation of `_.toString` which doesn't convert nullish
	 * values to empty strings.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */
	function baseToString(value) {
	  // Exit early for strings to avoid a performance hit in some environments.
	  if (typeof value == 'string') {
	    return value;
	  }
	  if (isArray_1(value)) {
	    // Recursively convert values (susceptible to call stack limits).
	    return _arrayMap(value, baseToString) + '';
	  }
	  if (isSymbol_1(value)) {
	    return symbolToString ? symbolToString.call(value) : '';
	  }
	  var result = (value + '');
	  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
	}

	var _baseToString = baseToString;

	/**
	 * Converts `value` to a string. An empty string is returned for `null`
	 * and `undefined` values. The sign of `-0` is preserved.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 * @example
	 *
	 * _.toString(null);
	 * // => ''
	 *
	 * _.toString(-0);
	 * // => '-0'
	 *
	 * _.toString([1, 2, 3]);
	 * // => '1,2,3'
	 */
	function toString(value) {
	  return value == null ? '' : _baseToString(value);
	}

	var toString_1 = toString;

	/**
	 * Casts `value` to a path array if it's not one.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {Array} Returns the cast property path array.
	 */
	function castPath(value, object) {
	  if (isArray_1(value)) {
	    return value;
	  }
	  return _isKey(value, object) ? [value] : _stringToPath(toString_1(value));
	}

	var _castPath = castPath;

	/** Used as references for various `Number` constants. */
	var INFINITY$1 = 1 / 0;

	/**
	 * Converts `value` to a string key if it's not a string or symbol.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {string|symbol} Returns the key.
	 */
	function toKey(value) {
	  if (typeof value == 'string' || isSymbol_1(value)) {
	    return value;
	  }
	  var result = (value + '');
	  return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
	}

	var _toKey = toKey;

	/**
	 * The base implementation of `_.get` without support for default values.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @returns {*} Returns the resolved value.
	 */
	function baseGet(object, path) {
	  path = _castPath(path, object);

	  var index = 0,
	      length = path.length;

	  while (object != null && index < length) {
	    object = object[_toKey(path[index++])];
	  }
	  return (index && index == length) ? object : undefined;
	}

	var _baseGet = baseGet;

	/**
	 * Gets the value at `path` of `object`. If the resolved value is
	 * `undefined`, the `defaultValue` is returned in its place.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
	 * @returns {*} Returns the resolved value.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.get(object, 'a[0].b.c');
	 * // => 3
	 *
	 * _.get(object, ['a', '0', 'b', 'c']);
	 * // => 3
	 *
	 * _.get(object, 'a.b.c', 'default');
	 * // => 'default'
	 */
	function get(object, path, defaultValue) {
	  var result = object == null ? undefined : _baseGet(object, path);
	  return result === undefined ? defaultValue : result;
	}

	var get_1 = get;

	const updateNamespacesFindResults = (state, payload, iteratee) => {

	  if (!state.namespaces) {
	    return state;
	  }

	  const namespaces = Object.keys(state.namespaces);
	  
	  return namespaces
	    .reduce((state, namespace) => {
	      const result = get_1(state, `namespaces.${namespace}.find.result`);
	      if (!result) return state;
	      if (isPaginatedResult(result)) {
	        return state.setIn(
	          ['namespaces', namespace, 'find', 'result', 'data'],
	          iteratee(result.data, payload)
	        );
	      } else {
	        return state.setIn(
	          ['namespaces', namespace, 'find', 'result'],
	          iteratee(result, payload)
	        );
	      }
	    }, state);
	};

	const onCreated = (state, payload) => {

	  const updateResult = (list, item) => {
	    const items = Array.isArray(list) ? list : [];
	    return [].concat(items, item);
	  };

	  const tempState = updateRootFindResult(state, payload, updateResult);
	  return updateNamespacesFindResults(tempState, payload, updateResult);
	};

	const onPatched = (state, payload) => {

	  const updateResult = (list, patchedItem) => {
	    const items = Array.isArray(list) ? list : [];
	    return items.map(item =>
	      (item._id === patchedItem._id)
	        ? patchedItem
	        : item
	    );
	  };

	  const tempState = updateRootFindResult(state, payload, updateResult);
	  return updateNamespacesFindResults(tempState, payload, updateResult);
	};

	const onPatched$1 = (state, payload) => {

	  const updateResult = (list, patchedItem) => {
	    const items = Array.isArray(list) ? list : [];
	    return items.map(item =>
	      (item._id === patchedItem._id)
	        ? patchedItem
	        : item
	    );
	  };

	  const tempState = updateRootFindResult(state, payload, updateResult);
	  return updateNamespacesFindResults(tempState, payload, updateResult);
	};

	const onRemoved = (state, payload) => {

	  const updateResult = (list, patchedItem) => {
	    const items = Array.isArray(list) ? list : [];
	    return items.filter(item =>
	      !(item._id === patchedItem._id)
	    );
	  };

	  const tempState = updateRootFindResult(state, payload, updateResult);
	  return updateNamespacesFindResults(tempState, payload, updateResult);
	};

	// core

	const find = (dispatch, modelName, rest) =>
	  async ({ params, namespace } = {}, rootState) => {
	    const request = { params };
	    dispatch[modelName].request({ method: 'find', namespace, request, status: 'pending' });

	    try {
	      const result = await rest.find(params);
	      dispatch[modelName].response({ method: 'find', namespace, result });
	      return result;
	    } catch (error) {
	      dispatch[modelName].error({ method: 'find', namespace, error });
	      return error;
	    }
	  };

	const get$1 = (dispatch, modelName, rest) =>
	  async ({ id, params, namespace } = {}, rootState) => {
	    const request = { id, params };
	    dispatch[modelName].request({ method: 'get', namespace, request, status: 'pending' });

	    try {
	      const result = await rest.get(id, params);
	      dispatch[modelName].response({ method: 'get', namespace, result });
	      return result;
	    } catch (error) {
	      dispatch[modelName].error({ method: 'get', namespace, error });
	      return error;
	    }
	  };

	const create = (dispatch, modelName, rest) =>
	  async ({ data, params, namespace } = {}, rootState) => {
	    const request = { data };
	    dispatch[modelName].request({ method: 'create', namespace, request, status: 'saving' });

	    try {
	      const result = await rest.create(data, params);
	      dispatch[modelName].response({ method: 'create', namespace, result });
	      return result;
	    } catch (error) {
	      dispatch[modelName].error({ method: 'create', namespace, error });
	      return error;
	    }
	  };

	const update = (dispatch, modelName, rest) =>
	  async ({ id, data, params, namespace } = {}, rootState) => {
	    const request = { id, data, params };
	    dispatch[modelName].request({ method: 'update', namespace, request, status: 'saving' });

	    try {
	      const result = await rest.update(id, data, params);
	      dispatch[modelName].response({ method: 'update', namespace, result });
	      return result;
	    } catch (error) {
	      dispatch[modelName].error({ method: 'update', namespace, error });
	      return error;
	    }
	  };

	const patch = (dispatch, modelName, rest) =>
	  async ({ id, data, params, namespace } = {}, rootState) => {
	    const request = { id, data, params };
	    dispatch[modelName].request({ method: 'patch', namespace, request, status: 'saving' });

	    try {
	      const result = await rest.patch(id, data, params);
	      dispatch[modelName].response({ method: 'patch', namespace, result });
	      return result;
	    } catch (error) {
	      dispatch[modelName].error({ method: 'patch', namespace, error });
	      return error;
	    }
	  };

	const remove = (dispatch, modelName, rest) =>
	  async ({ id, params, namespace } = {}, rootState) => {
	    const request = { id, params };
	    dispatch[modelName].request({ method: 'remove', namespace, request, status: 'saving' });

	    try {
	      const result = await rest.remove(id, params);
	      dispatch[modelName].response({ method: 'remove', namespace, result });
	      return result;
	    } catch (error) {
	      dispatch[modelName].error({ method: 'remove', namespace, error });
	      return error;
	    }
	  };

	const defaultState = {
	  find: {},
	  get: {},
	  create: {},
	  update: {},
	  patch: {},
	  remove: {},
	  publications: {},
	  store: [],
	  meta: {
	    connected: false,
	    last: null
	  }
	};

	var createModel = ({ modelName, rest, socket, snapshot, clients, transport }) => {

	  const model = {
	    state: new seamlessImmutable(defaultState),
	    services: { rest, socket },
	    clients,
	    transport,
	    snapshot,
	    reducers: {
	      request,
	      response,
	      error,
	      onCreated,
	      onUpdated: onPatched$1,
	      onPatched,
	      onRemoved,
	      store,
	    },
	    effects: (dispatch) => ({
	      find:   find(dispatch, modelName, model.services[transport]),
	      get:    get$1(dispatch, modelName, model.services[transport]),
	      create: create(dispatch, modelName, model.services[transport]),
	      update: update(dispatch, modelName, model.services[transport]),
	      patch:  patch(dispatch, modelName, model.services[transport]),
	      remove: remove(dispatch, modelName, model.services[transport])
	    })
	  };

	  return model;
	};

	var realtimePlugin = () => {
	  return {
	    onModel(model) {
	      // do something
	      if (!model.services) return;

	      const reducers = {
	        'created': 'onCreated',
	        'patched': 'onPatched',
	        'updated': 'onUpdated',
	        'removed': 'onRemoved'
	      };

	      Object
	        .keys(reducers)
	        .forEach(eventName => {
	          model.services.socket.on(eventName, data => {
	            const reducerName = reducers[eventName];
	            this.dispatch[model.name][reducerName](data);
	          });
	        });

	    }
	  }
	};

	/**
	 * Helpers.
	 */

	var s = 1000;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
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

	var ms = function(val, options) {
	  options = options || {};
	  var type = typeof val;
	  if (type === 'string' && val.length > 0) {
	    return parse(val);
	  } else if (type === 'number' && isNaN(val) === false) {
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
	  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
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
	  if (ms >= d) {
	    return Math.round(ms / d) + 'd';
	  }
	  if (ms >= h) {
	    return Math.round(ms / h) + 'h';
	  }
	  if (ms >= m) {
	    return Math.round(ms / m) + 'm';
	  }
	  if (ms >= s) {
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
	  return plural(ms, d, 'day') ||
	    plural(ms, h, 'hour') ||
	    plural(ms, m, 'minute') ||
	    plural(ms, s, 'second') ||
	    ms + ' ms';
	}

	/**
	 * Pluralization helper.
	 */

	function plural(ms, n, name) {
	  if (ms < n) {
	    return;
	  }
	  if (ms < n * 1.5) {
	    return Math.floor(ms / n) + ' ' + name;
	  }
	  return Math.ceil(ms / n) + ' ' + name + 's';
	}

	var debug = createCommonjsModule(function (module, exports) {
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
	exports.coerce = coerce;
	exports.disable = disable;
	exports.enable = enable;
	exports.enabled = enabled;
	exports.humanize = ms;

	/**
	 * The currently active debug mode names, and names to skip.
	 */

	exports.names = [];
	exports.skips = [];

	/**
	 * Map of special "%n" handling functions, for the debug "format" argument.
	 *
	 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	 */

	exports.formatters = {};

	/**
	 * Previous log timestamp.
	 */

	var prevTime;

	/**
	 * Select a color.
	 * @param {String} namespace
	 * @return {Number}
	 * @api private
	 */

	function selectColor(namespace) {
	  var hash = 0, i;

	  for (i in namespace) {
	    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
	    hash |= 0; // Convert to 32bit integer
	  }

	  return exports.colors[Math.abs(hash) % exports.colors.length];
	}

	/**
	 * Create a debugger with the given `namespace`.
	 *
	 * @param {String} namespace
	 * @return {Function}
	 * @api public
	 */

	function createDebug(namespace) {

	  function debug() {
	    // disabled?
	    if (!debug.enabled) return;

	    var self = debug;

	    // set `diff` timestamp
	    var curr = +new Date();
	    var ms$$1 = curr - (prevTime || curr);
	    self.diff = ms$$1;
	    self.prev = prevTime;
	    self.curr = curr;
	    prevTime = curr;

	    // turn the `arguments` into a proper Array
	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }

	    args[0] = exports.coerce(args[0]);

	    if ('string' !== typeof args[0]) {
	      // anything else let's inspect with %O
	      args.unshift('%O');
	    }

	    // apply any `formatters` transformations
	    var index = 0;
	    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
	      // if we encounter an escaped % then don't increase the array index
	      if (match === '%%') return match;
	      index++;
	      var formatter = exports.formatters[format];
	      if ('function' === typeof formatter) {
	        var val = args[index];
	        match = formatter.call(self, val);

	        // now we need to remove `args[index]` since it's inlined in the `format`
	        args.splice(index, 1);
	        index--;
	      }
	      return match;
	    });

	    // apply env-specific formatting (colors, etc.)
	    exports.formatArgs.call(self, args);

	    var logFn = debug.log || exports.log || console.log.bind(console);
	    logFn.apply(self, args);
	  }

	  debug.namespace = namespace;
	  debug.enabled = exports.enabled(namespace);
	  debug.useColors = exports.useColors();
	  debug.color = selectColor(namespace);

	  // env-specific initialization logic for debug instances
	  if ('function' === typeof exports.init) {
	    exports.init(debug);
	  }

	  return debug;
	}

	/**
	 * Enables a debug mode by namespaces. This can include modes
	 * separated by a colon and wildcards.
	 *
	 * @param {String} namespaces
	 * @api public
	 */

	function enable(namespaces) {
	  exports.save(namespaces);

	  exports.names = [];
	  exports.skips = [];

	  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
	  var len = split.length;

	  for (var i = 0; i < len; i++) {
	    if (!split[i]) continue; // ignore empty strings
	    namespaces = split[i].replace(/\*/g, '.*?');
	    if (namespaces[0] === '-') {
	      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
	    } else {
	      exports.names.push(new RegExp('^' + namespaces + '$'));
	    }
	  }
	}

	/**
	 * Disable debug output.
	 *
	 * @api public
	 */

	function disable() {
	  exports.enable('');
	}

	/**
	 * Returns true if the given mode name is enabled, false otherwise.
	 *
	 * @param {String} name
	 * @return {Boolean}
	 * @api public
	 */

	function enabled(name) {
	  var i, len;
	  for (i = 0, len = exports.skips.length; i < len; i++) {
	    if (exports.skips[i].test(name)) {
	      return false;
	    }
	  }
	  for (i = 0, len = exports.names.length; i < len; i++) {
	    if (exports.names[i].test(name)) {
	      return true;
	    }
	  }
	  return false;
	}

	/**
	 * Coerce `val`.
	 *
	 * @param {Mixed} val
	 * @return {Mixed}
	 * @api private
	 */

	function coerce(val) {
	  if (val instanceof Error) return val.stack || val.message;
	  return val;
	}
	});
	var debug_1 = debug.coerce;
	var debug_2 = debug.disable;
	var debug_3 = debug.enable;
	var debug_4 = debug.enabled;
	var debug_5 = debug.humanize;
	var debug_6 = debug.names;
	var debug_7 = debug.skips;
	var debug_8 = debug.formatters;

	var browser = createCommonjsModule(function (module, exports) {
	/**
	 * This is the web browser implementation of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = debug;
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = 'undefined' != typeof chrome
	               && 'undefined' != typeof chrome.storage
	                  ? chrome.storage.local
	                  : localstorage();

	/**
	 * Colors.
	 */

	exports.colors = [
	  'lightseagreen',
	  'forestgreen',
	  'goldenrod',
	  'dodgerblue',
	  'darkorchid',
	  'crimson'
	];

	/**
	 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
	 * and the Firebug extension (any Firefox version) are known
	 * to support "%c" CSS customizations.
	 *
	 * TODO: add a `localStorage` variable to explicitly enable/disable colors
	 */

	function useColors() {
	  // NB: In an Electron preload script, document will be defined but not fully
	  // initialized. Since we know we're in Chrome, we'll just detect this case
	  // explicitly
	  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
	    return true;
	  }

	  // is webkit? http://stackoverflow.com/a/16459606/376773
	  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
	    // is firebug? http://stackoverflow.com/a/398120/376773
	    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
	    // is firefox >= v31?
	    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
	    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
	    // double check webkit in userAgent just in case we are in a worker
	    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
	}

	/**
	 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	 */

	exports.formatters.j = function(v) {
	  try {
	    return JSON.stringify(v);
	  } catch (err) {
	    return '[UnexpectedJSONParseError]: ' + err.message;
	  }
	};


	/**
	 * Colorize log arguments if enabled.
	 *
	 * @api public
	 */

	function formatArgs(args) {
	  var useColors = this.useColors;

	  args[0] = (useColors ? '%c' : '')
	    + this.namespace
	    + (useColors ? ' %c' : ' ')
	    + args[0]
	    + (useColors ? '%c ' : ' ')
	    + '+' + exports.humanize(this.diff);

	  if (!useColors) return;

	  var c = 'color: ' + this.color;
	  args.splice(1, 0, c, 'color: inherit');

	  // the final "%c" is somewhat tricky, because there could be other
	  // arguments passed either before or after the %c, so we need to
	  // figure out the correct index to insert the CSS into
	  var index = 0;
	  var lastC = 0;
	  args[0].replace(/%[a-zA-Z%]/g, function(match) {
	    if ('%%' === match) return;
	    index++;
	    if ('%c' === match) {
	      // we only are interested in the *last* %c
	      // (the user may have provided their own)
	      lastC = index;
	    }
	  });

	  args.splice(lastC, 0, c);
	}

	/**
	 * Invokes `console.log()` when available.
	 * No-op when `console.log` is not a "function".
	 *
	 * @api public
	 */

	function log() {
	  // this hackery is required for IE8/9, where
	  // the `console.log` function doesn't have 'apply'
	  return 'object' === typeof console
	    && console.log
	    && Function.prototype.apply.call(console.log, console, arguments);
	}

	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */

	function save(namespaces) {
	  try {
	    if (null == namespaces) {
	      exports.storage.removeItem('debug');
	    } else {
	      exports.storage.debug = namespaces;
	    }
	  } catch(e) {}
	}

	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */

	function load() {
	  var r;
	  try {
	    r = exports.storage.debug;
	  } catch(e) {}

	  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	  if (!r && typeof process !== 'undefined' && 'env' in process) {
	    r = process.env.DEBUG;
	  }

	  return r;
	}

	/**
	 * Enable namespaces listed in `localStorage.debug` initially.
	 */

	exports.enable(load());

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
	    return window.localStorage;
	  } catch (e) {}
	}
	});
	var browser_1 = browser.log;
	var browser_2 = browser.formatArgs;
	var browser_3 = browser.save;
	var browser_4 = browser.load;
	var browser_5 = browser.useColors;
	var browser_6 = browser.storage;
	var browser_7 = browser.colors;

	var node = createCommonjsModule(function (module, exports) {
	/**
	 * Module dependencies.
	 */




	/**
	 * This is the Node.js implementation of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = debug;
	exports.init = init;
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;

	/**
	 * Colors.
	 */

	exports.colors = [6, 2, 3, 4, 5, 1];

	/**
	 * Build up the default `inspectOpts` object from the environment variables.
	 *
	 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
	 */

	exports.inspectOpts = Object.keys(process.env).filter(function (key) {
	  return /^debug_/i.test(key);
	}).reduce(function (obj, key) {
	  // camel-case
	  var prop = key
	    .substring(6)
	    .toLowerCase()
	    .replace(/_([a-z])/g, function (_, k) { return k.toUpperCase() });

	  // coerce string value into JS value
	  var val = process.env[key];
	  if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
	  else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
	  else if (val === 'null') val = null;
	  else val = Number(val);

	  obj[prop] = val;
	  return obj;
	}, {});

	/**
	 * The file descriptor to write the `debug()` calls to.
	 * Set the `DEBUG_FD` env variable to override with another value. i.e.:
	 *
	 *   $ DEBUG_FD=3 node script.js 3>debug.log
	 */

	var fd = parseInt(process.env.DEBUG_FD, 10) || 2;

	if (1 !== fd && 2 !== fd) {
	  util.deprecate(function(){}, 'except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)')();
	}

	var stream = 1 === fd ? process.stdout :
	             2 === fd ? process.stderr :
	             createWritableStdioStream(fd);

	/**
	 * Is stdout a TTY? Colored output is enabled when `true`.
	 */

	function useColors() {
	  return 'colors' in exports.inspectOpts
	    ? Boolean(exports.inspectOpts.colors)
	    : tty.isatty(fd);
	}

	/**
	 * Map %o to `util.inspect()`, all on a single line.
	 */

	exports.formatters.o = function(v) {
	  this.inspectOpts.colors = this.useColors;
	  return util.inspect(v, this.inspectOpts)
	    .replace(/\s*\n\s*/g, ' ');
	};

	/**
	 * Map %o to `util.inspect()`, allowing multiple lines if needed.
	 */

	exports.formatters.O = function(v) {
	  this.inspectOpts.colors = this.useColors;
	  return util.inspect(v, this.inspectOpts);
	};

	/**
	 * Adds ANSI color escape codes if enabled.
	 *
	 * @api public
	 */

	function formatArgs(args) {
	  var name = this.namespace;
	  var useColors = this.useColors;

	  if (useColors) {
	    var c = this.color;
	    var prefix = '  \u001b[3' + c + ';1m' + name + ' ' + '\u001b[0m';

	    args[0] = prefix + args[0].split('\n').join('\n' + prefix);
	    args.push('\u001b[3' + c + 'm+' + exports.humanize(this.diff) + '\u001b[0m');
	  } else {
	    args[0] = new Date().toUTCString()
	      + ' ' + name + ' ' + args[0];
	  }
	}

	/**
	 * Invokes `util.format()` with the specified arguments and writes to `stream`.
	 */

	function log() {
	  return stream.write(util.format.apply(util, arguments) + '\n');
	}

	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */

	function save(namespaces) {
	  if (null == namespaces) {
	    // If you set a process.env field to null or undefined, it gets cast to the
	    // string 'null' or 'undefined'. Just delete instead.
	    delete process.env.DEBUG;
	  } else {
	    process.env.DEBUG = namespaces;
	  }
	}

	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */

	function load() {
	  return process.env.DEBUG;
	}

	/**
	 * Copied from `node/src/node.js`.
	 *
	 * XXX: It's lame that node doesn't expose this API out-of-the-box. It also
	 * relies on the undocumented `tty_wrap.guessHandleType()` which is also lame.
	 */

	function createWritableStdioStream (fd) {
	  var stream;
	  var tty_wrap = process.binding('tty_wrap');

	  // Note stream._type is used for test-module-load-list.js

	  switch (tty_wrap.guessHandleType(fd)) {
	    case 'TTY':
	      stream = new tty.WriteStream(fd);
	      stream._type = 'tty';

	      // Hack to have stream not keep the event loop alive.
	      // See https://github.com/joyent/node/issues/1726
	      if (stream._handle && stream._handle.unref) {
	        stream._handle.unref();
	      }
	      break;

	    case 'FILE':
	      var fs$$1 = fs;
	      stream = new fs$$1.SyncWriteStream(fd, { autoClose: false });
	      stream._type = 'fs';
	      break;

	    case 'PIPE':
	    case 'TCP':
	      var net$$1 = net;
	      stream = new net$$1.Socket({
	        fd: fd,
	        readable: false,
	        writable: true
	      });

	      // FIXME Should probably have an option in net.Socket to create a
	      // stream from an existing fd which is writable only. But for now
	      // we'll just add this hack and set the `readable` member to false.
	      // Test: ./node test/fixtures/echo.js < /etc/passwd
	      stream.readable = false;
	      stream.read = null;
	      stream._type = 'pipe';

	      // FIXME Hack to have stream not keep the event loop alive.
	      // See https://github.com/joyent/node/issues/1726
	      if (stream._handle && stream._handle.unref) {
	        stream._handle.unref();
	      }
	      break;

	    default:
	      // Probably an error on in uv_guess_handle()
	      throw new Error('Implement me. Unknown stream file type!');
	  }

	  // For supporting legacy API we put the FD here.
	  stream.fd = fd;

	  stream._isStdio = true;

	  return stream;
	}

	/**
	 * Init logic for `debug` instances.
	 *
	 * Create a new `inspectOpts` object in case `useColors` is set
	 * differently for a particular `debug` instance.
	 */

	function init (debug$$1) {
	  debug$$1.inspectOpts = {};

	  var keys = Object.keys(exports.inspectOpts);
	  for (var i = 0; i < keys.length; i++) {
	    debug$$1.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	  }
	}

	/**
	 * Enable namespaces listed in `process.env.DEBUG` initially.
	 */

	exports.enable(load());
	});
	var node_1 = node.init;
	var node_2 = node.log;
	var node_3 = node.formatArgs;
	var node_4 = node.save;
	var node_5 = node.load;
	var node_6 = node.useColors;
	var node_7 = node.colors;
	var node_8 = node.inspectOpts;

	var src = createCommonjsModule(function (module) {
	/**
	 * Detect Electron renderer process, which is node, but we should
	 * treat as a browser.
	 */

	if (typeof process !== 'undefined' && process.type === 'renderer') {
	  module.exports = browser;
	} else {
	  module.exports = node;
	}
	});

	var lib = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = snapshot;



	var _debug2 = _interopRequireDefault(src);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var debug = (0, _debug2.default)('feathers-offline-snapshot');

	function snapshot(service, baseQuery) {
	  debug('start: ' + JSON.stringify(baseQuery));

	  var query = Object.assign({}, { $skip: 0, $limit: 200 }, baseQuery); // use max recs configured
	  var fileDatas = void 0;

	  return service.find({ query: query }).then(function (result) {
	    debug('read ' + (result.data || result).length + ' records');

	    if (!result.data) {
	      return result;
	    }

	    var total = result.total,
	        limit = result.limit,
	        skip = result.skip,
	        data = result.data;

	    fileDatas = data;

	    return skip + data.length < total ? readRemainingPages(skip + limit) : fileDatas;
	  });

	  function readRemainingPages(skip) {
	    query.$skip = skip;

	    return service.find({ query: query }).then(function (_ref) {
	      var total = _ref.total,
	          limit = _ref.limit,
	          skip = _ref.skip,
	          data = _ref.data;

	      debug('read ' + data.length + ' records');

	      fileDatas = fileDatas.concat(data);

	      return skip + data.length < total ? readRemainingPages(skip + limit) : fileDatas;
	    });
	  }
	}
	module.exports = exports['default'];
	});

	unwrapExports(lib);

	var crypt = createCommonjsModule(function (module) {
	(function() {
	  var base64map
	      = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',

	  crypt = {
	    // Bit-wise rotation left
	    rotl: function(n, b) {
	      return (n << b) | (n >>> (32 - b));
	    },

	    // Bit-wise rotation right
	    rotr: function(n, b) {
	      return (n << (32 - b)) | (n >>> b);
	    },

	    // Swap big-endian to little-endian and vice versa
	    endian: function(n) {
	      // If number given, swap endian
	      if (n.constructor == Number) {
	        return crypt.rotl(n, 8) & 0x00FF00FF | crypt.rotl(n, 24) & 0xFF00FF00;
	      }

	      // Else, assume array and swap all items
	      for (var i = 0; i < n.length; i++)
	        n[i] = crypt.endian(n[i]);
	      return n;
	    },

	    // Generate an array of any length of random bytes
	    randomBytes: function(n) {
	      for (var bytes = []; n > 0; n--)
	        bytes.push(Math.floor(Math.random() * 256));
	      return bytes;
	    },

	    // Convert a byte array to big-endian 32-bit words
	    bytesToWords: function(bytes) {
	      for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
	        words[b >>> 5] |= bytes[i] << (24 - b % 32);
	      return words;
	    },

	    // Convert big-endian 32-bit words to a byte array
	    wordsToBytes: function(words) {
	      for (var bytes = [], b = 0; b < words.length * 32; b += 8)
	        bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
	      return bytes;
	    },

	    // Convert a byte array to a hex string
	    bytesToHex: function(bytes) {
	      for (var hex = [], i = 0; i < bytes.length; i++) {
	        hex.push((bytes[i] >>> 4).toString(16));
	        hex.push((bytes[i] & 0xF).toString(16));
	      }
	      return hex.join('');
	    },

	    // Convert a hex string to a byte array
	    hexToBytes: function(hex) {
	      for (var bytes = [], c = 0; c < hex.length; c += 2)
	        bytes.push(parseInt(hex.substr(c, 2), 16));
	      return bytes;
	    },

	    // Convert a byte array to a base-64 string
	    bytesToBase64: function(bytes) {
	      for (var base64 = [], i = 0; i < bytes.length; i += 3) {
	        var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
	        for (var j = 0; j < 4; j++)
	          if (i * 8 + j * 6 <= bytes.length * 8)
	            base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));
	          else
	            base64.push('=');
	      }
	      return base64.join('');
	    },

	    // Convert a base-64 string to a byte array
	    base64ToBytes: function(base64) {
	      // Remove non-base-64 characters
	      base64 = base64.replace(/[^A-Z0-9+\/]/ig, '');

	      for (var bytes = [], i = 0, imod4 = 0; i < base64.length;
	          imod4 = ++i % 4) {
	        if (imod4 == 0) continue;
	        bytes.push(((base64map.indexOf(base64.charAt(i - 1))
	            & (Math.pow(2, -2 * imod4 + 8) - 1)) << (imod4 * 2))
	            | (base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2)));
	      }
	      return bytes;
	    }
	  };

	  module.exports = crypt;
	})();
	});

	var charenc = {
	  // UTF-8 encoding
	  utf8: {
	    // Convert a string to a byte array
	    stringToBytes: function(str) {
	      return charenc.bin.stringToBytes(unescape(encodeURIComponent(str)));
	    },

	    // Convert a byte array to a string
	    bytesToString: function(bytes) {
	      return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));
	    }
	  },

	  // Binary encoding
	  bin: {
	    // Convert a string to a byte array
	    stringToBytes: function(str) {
	      for (var bytes = [], i = 0; i < str.length; i++)
	        bytes.push(str.charCodeAt(i) & 0xFF);
	      return bytes;
	    },

	    // Convert a byte array to a string
	    bytesToString: function(bytes) {
	      for (var str = [], i = 0; i < bytes.length; i++)
	        str.push(String.fromCharCode(bytes[i]));
	      return str.join('');
	    }
	  }
	};

	var charenc_1 = charenc;

	/*!
	 * Determine if an object is a Buffer
	 *
	 * @author   Feross Aboukhadijeh <https://feross.org>
	 * @license  MIT
	 */

	// The _isBuffer check is for Safari 5-7 support, because it's missing
	// Object.prototype.constructor. Remove this eventually
	var isBuffer_1 = function (obj) {
	  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
	};

	function isBuffer (obj) {
	  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
	}

	// For Node v0.10 support. Remove this eventually.
	function isSlowBuffer (obj) {
	  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
	}

	var md5 = createCommonjsModule(function (module) {
	(function(){
	  var crypt$$1 = crypt,
	      utf8 = charenc_1.utf8,
	      isBuffer = isBuffer_1,
	      bin = charenc_1.bin,

	  // The core
	  md5 = function (message, options) {
	    // Convert to byte array
	    if (message.constructor == String)
	      if (options && options.encoding === 'binary')
	        message = bin.stringToBytes(message);
	      else
	        message = utf8.stringToBytes(message);
	    else if (isBuffer(message))
	      message = Array.prototype.slice.call(message, 0);
	    else if (!Array.isArray(message))
	      message = message.toString();
	    // else, assume byte array already

	    var m = crypt$$1.bytesToWords(message),
	        l = message.length * 8,
	        a =  1732584193,
	        b = -271733879,
	        c = -1732584194,
	        d =  271733878;

	    // Swap endian
	    for (var i = 0; i < m.length; i++) {
	      m[i] = ((m[i] <<  8) | (m[i] >>> 24)) & 0x00FF00FF |
	             ((m[i] << 24) | (m[i] >>>  8)) & 0xFF00FF00;
	    }

	    // Padding
	    m[l >>> 5] |= 0x80 << (l % 32);
	    m[(((l + 64) >>> 9) << 4) + 14] = l;

	    // Method shortcuts
	    var FF = md5._ff,
	        GG = md5._gg,
	        HH = md5._hh,
	        II = md5._ii;

	    for (var i = 0; i < m.length; i += 16) {

	      var aa = a,
	          bb = b,
	          cc = c,
	          dd = d;

	      a = FF(a, b, c, d, m[i+ 0],  7, -680876936);
	      d = FF(d, a, b, c, m[i+ 1], 12, -389564586);
	      c = FF(c, d, a, b, m[i+ 2], 17,  606105819);
	      b = FF(b, c, d, a, m[i+ 3], 22, -1044525330);
	      a = FF(a, b, c, d, m[i+ 4],  7, -176418897);
	      d = FF(d, a, b, c, m[i+ 5], 12,  1200080426);
	      c = FF(c, d, a, b, m[i+ 6], 17, -1473231341);
	      b = FF(b, c, d, a, m[i+ 7], 22, -45705983);
	      a = FF(a, b, c, d, m[i+ 8],  7,  1770035416);
	      d = FF(d, a, b, c, m[i+ 9], 12, -1958414417);
	      c = FF(c, d, a, b, m[i+10], 17, -42063);
	      b = FF(b, c, d, a, m[i+11], 22, -1990404162);
	      a = FF(a, b, c, d, m[i+12],  7,  1804603682);
	      d = FF(d, a, b, c, m[i+13], 12, -40341101);
	      c = FF(c, d, a, b, m[i+14], 17, -1502002290);
	      b = FF(b, c, d, a, m[i+15], 22,  1236535329);

	      a = GG(a, b, c, d, m[i+ 1],  5, -165796510);
	      d = GG(d, a, b, c, m[i+ 6],  9, -1069501632);
	      c = GG(c, d, a, b, m[i+11], 14,  643717713);
	      b = GG(b, c, d, a, m[i+ 0], 20, -373897302);
	      a = GG(a, b, c, d, m[i+ 5],  5, -701558691);
	      d = GG(d, a, b, c, m[i+10],  9,  38016083);
	      c = GG(c, d, a, b, m[i+15], 14, -660478335);
	      b = GG(b, c, d, a, m[i+ 4], 20, -405537848);
	      a = GG(a, b, c, d, m[i+ 9],  5,  568446438);
	      d = GG(d, a, b, c, m[i+14],  9, -1019803690);
	      c = GG(c, d, a, b, m[i+ 3], 14, -187363961);
	      b = GG(b, c, d, a, m[i+ 8], 20,  1163531501);
	      a = GG(a, b, c, d, m[i+13],  5, -1444681467);
	      d = GG(d, a, b, c, m[i+ 2],  9, -51403784);
	      c = GG(c, d, a, b, m[i+ 7], 14,  1735328473);
	      b = GG(b, c, d, a, m[i+12], 20, -1926607734);

	      a = HH(a, b, c, d, m[i+ 5],  4, -378558);
	      d = HH(d, a, b, c, m[i+ 8], 11, -2022574463);
	      c = HH(c, d, a, b, m[i+11], 16,  1839030562);
	      b = HH(b, c, d, a, m[i+14], 23, -35309556);
	      a = HH(a, b, c, d, m[i+ 1],  4, -1530992060);
	      d = HH(d, a, b, c, m[i+ 4], 11,  1272893353);
	      c = HH(c, d, a, b, m[i+ 7], 16, -155497632);
	      b = HH(b, c, d, a, m[i+10], 23, -1094730640);
	      a = HH(a, b, c, d, m[i+13],  4,  681279174);
	      d = HH(d, a, b, c, m[i+ 0], 11, -358537222);
	      c = HH(c, d, a, b, m[i+ 3], 16, -722521979);
	      b = HH(b, c, d, a, m[i+ 6], 23,  76029189);
	      a = HH(a, b, c, d, m[i+ 9],  4, -640364487);
	      d = HH(d, a, b, c, m[i+12], 11, -421815835);
	      c = HH(c, d, a, b, m[i+15], 16,  530742520);
	      b = HH(b, c, d, a, m[i+ 2], 23, -995338651);

	      a = II(a, b, c, d, m[i+ 0],  6, -198630844);
	      d = II(d, a, b, c, m[i+ 7], 10,  1126891415);
	      c = II(c, d, a, b, m[i+14], 15, -1416354905);
	      b = II(b, c, d, a, m[i+ 5], 21, -57434055);
	      a = II(a, b, c, d, m[i+12],  6,  1700485571);
	      d = II(d, a, b, c, m[i+ 3], 10, -1894986606);
	      c = II(c, d, a, b, m[i+10], 15, -1051523);
	      b = II(b, c, d, a, m[i+ 1], 21, -2054922799);
	      a = II(a, b, c, d, m[i+ 8],  6,  1873313359);
	      d = II(d, a, b, c, m[i+15], 10, -30611744);
	      c = II(c, d, a, b, m[i+ 6], 15, -1560198380);
	      b = II(b, c, d, a, m[i+13], 21,  1309151649);
	      a = II(a, b, c, d, m[i+ 4],  6, -145523070);
	      d = II(d, a, b, c, m[i+11], 10, -1120210379);
	      c = II(c, d, a, b, m[i+ 2], 15,  718787259);
	      b = II(b, c, d, a, m[i+ 9], 21, -343485551);

	      a = (a + aa) >>> 0;
	      b = (b + bb) >>> 0;
	      c = (c + cc) >>> 0;
	      d = (d + dd) >>> 0;
	    }

	    return crypt$$1.endian([a, b, c, d]);
	  };

	  // Auxiliary functions
	  md5._ff  = function (a, b, c, d, x, s, t) {
	    var n = a + (b & c | ~b & d) + (x >>> 0) + t;
	    return ((n << s) | (n >>> (32 - s))) + b;
	  };
	  md5._gg  = function (a, b, c, d, x, s, t) {
	    var n = a + (b & d | c & ~d) + (x >>> 0) + t;
	    return ((n << s) | (n >>> (32 - s))) + b;
	  };
	  md5._hh  = function (a, b, c, d, x, s, t) {
	    var n = a + (b ^ c ^ d) + (x >>> 0) + t;
	    return ((n << s) | (n >>> (32 - s))) + b;
	  };
	  md5._ii  = function (a, b, c, d, x, s, t) {
	    var n = a + (c ^ (b | ~d)) + (x >>> 0) + t;
	    return ((n << s) | (n >>> (32 - s))) + b;
	  };

	  // Package private blocksize
	  md5._blocksize = 16;
	  md5._digestsize = 16;

	  module.exports = function (message, options) {
	    if (message === undefined || message === null)
	      throw new Error('Illegal argument ' + message);

	    var digestbytes = crypt$$1.wordsToBytes(md5(message, options));
	    return options && options.asBytes ? digestbytes :
	        options && options.asString ? bin.bytesToString(digestbytes) :
	        crypt$$1.bytesToHex(digestbytes);
	  };

	})();
	});

	// Unique ID creation requires a high quality random # generator.  In node.js
	// this is pretty straight-forward - we use the crypto API.

	var rb = crypto.randomBytes;

	function rng() {
	  return rb(16);
	}

	var rng_1 = rng;

	/**
	 * Convert array of 16 byte values to UUID string format of the form:
	 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
	 */
	var byteToHex = [];
	for (var i = 0; i < 256; ++i) {
	  byteToHex[i] = (i + 0x100).toString(16).substr(1);
	}

	function bytesToUuid(buf, offset) {
	  var i = offset || 0;
	  var bth = byteToHex;
	  return bth[buf[i++]] + bth[buf[i++]] +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] +
	          bth[buf[i++]] + bth[buf[i++]] +
	          bth[buf[i++]] + bth[buf[i++]];
	}

	var bytesToUuid_1 = bytesToUuid;

	function v4(options, buf, offset) {
	  var i = buf && offset || 0;

	  if (typeof(options) == 'string') {
	    buf = options == 'binary' ? new Array(16) : null;
	    options = null;
	  }
	  options = options || {};

	  var rnds = options.random || (options.rng || rng_1)();

	  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
	  rnds[6] = (rnds[6] & 0x0f) | 0x40;
	  rnds[8] = (rnds[8] & 0x3f) | 0x80;

	  // Copy bytes to buffer, if provided
	  if (buf) {
	    for (var ii = 0; ii < 16; ++ii) {
	      buf[i + ii] = rnds[ii];
	    }
	  }

	  return buf || bytesToUuid_1(rnds);
	}

	var v4_1 = v4;

	// Found this seed-based random generator somewhere
	// Based on The Central Randomizer 1.3 (C) 1997 by Paul Houle (houle@msc.cornell.edu)

	var seed = 1;

	/**
	 * return a random number based on a seed
	 * @param seed
	 * @returns {number}
	 */
	function getNextValue() {
	    seed = (seed * 9301 + 49297) % 233280;
	    return seed/(233280.0);
	}

	function setSeed(_seed_) {
	    seed = _seed_;
	}

	var randomFromSeed = {
	    nextValue: getNextValue,
	    seed: setSeed
	};

	var ORIGINAL = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
	var alphabet;
	var previousSeed;

	var shuffled;

	function reset() {
	    shuffled = false;
	}

	function setCharacters(_alphabet_) {
	    if (!_alphabet_) {
	        if (alphabet !== ORIGINAL) {
	            alphabet = ORIGINAL;
	            reset();
	        }
	        return;
	    }

	    if (_alphabet_ === alphabet) {
	        return;
	    }

	    if (_alphabet_.length !== ORIGINAL.length) {
	        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. You submitted ' + _alphabet_.length + ' characters: ' + _alphabet_);
	    }

	    var unique = _alphabet_.split('').filter(function(item, ind, arr){
	       return ind !== arr.lastIndexOf(item);
	    });

	    if (unique.length) {
	        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. These characters were not unique: ' + unique.join(', '));
	    }

	    alphabet = _alphabet_;
	    reset();
	}

	function characters(_alphabet_) {
	    setCharacters(_alphabet_);
	    return alphabet;
	}

	function setSeed$1(seed) {
	    randomFromSeed.seed(seed);
	    if (previousSeed !== seed) {
	        reset();
	        previousSeed = seed;
	    }
	}

	function shuffle() {
	    if (!alphabet) {
	        setCharacters(ORIGINAL);
	    }

	    var sourceArray = alphabet.split('');
	    var targetArray = [];
	    var r = randomFromSeed.nextValue();
	    var characterIndex;

	    while (sourceArray.length > 0) {
	        r = randomFromSeed.nextValue();
	        characterIndex = Math.floor(r * sourceArray.length);
	        targetArray.push(sourceArray.splice(characterIndex, 1)[0]);
	    }
	    return targetArray.join('');
	}

	function getShuffled() {
	    if (shuffled) {
	        return shuffled;
	    }
	    shuffled = shuffle();
	    return shuffled;
	}

	/**
	 * lookup shuffled letter
	 * @param index
	 * @returns {string}
	 */
	function lookup(index) {
	    var alphabetShuffled = getShuffled();
	    return alphabetShuffled[index];
	}

	var alphabet_1 = {
	    characters: characters,
	    seed: setSeed$1,
	    lookup: lookup,
	    shuffled: getShuffled
	};

	var randomBytes = crypto.randomBytes;

	function randomByte() {
	    return randomBytes(1)[0] & 0x30;
	}

	var randomByte_1 = randomByte;

	function encode(lookup, number) {
	    var loopCounter = 0;
	    var done;

	    var str = '';

	    while (!done) {
	        str = str + lookup( ( (number >> (4 * loopCounter)) & 0x0f ) | randomByte_1() );
	        done = number < (Math.pow(16, loopCounter + 1 ) );
	        loopCounter++;
	    }
	    return str;
	}

	var encode_1 = encode;

	/**
	 * Decode the id to get the version and worker
	 * Mainly for debugging and testing.
	 * @param id - the shortid-generated id.
	 */
	function decode(id) {
	    var characters = alphabet_1.shuffled();
	    return {
	        version: characters.indexOf(id.substr(0, 1)) & 0x0f,
	        worker: characters.indexOf(id.substr(1, 1)) & 0x0f
	    };
	}

	var decode_1 = decode;

	// Ignore all milliseconds before a certain time to reduce the size of the date entropy without sacrificing uniqueness.
	// This number should be updated every year or so to keep the generated id short.
	// To regenerate `new Date() - 0` and bump the version. Always bump the version!
	var REDUCE_TIME = 1459707606518;

	// don't change unless we change the algos or REDUCE_TIME
	// must be an integer and less than 16
	var version = 6;

	// Counter is used when shortid is called multiple times in one second.
	var counter;

	// Remember the last time shortid was called in case counter is needed.
	var previousSeconds;

	/**
	 * Generate unique id
	 * Returns string id
	 */
	function build(clusterWorkerId) {

	    var str = '';

	    var seconds = Math.floor((Date.now() - REDUCE_TIME) * 0.001);

	    if (seconds === previousSeconds) {
	        counter++;
	    } else {
	        counter = 0;
	        previousSeconds = seconds;
	    }

	    str = str + encode_1(alphabet_1.lookup, version);
	    str = str + encode_1(alphabet_1.lookup, clusterWorkerId);
	    if (counter > 0) {
	        str = str + encode_1(alphabet_1.lookup, counter);
	    }
	    str = str + encode_1(alphabet_1.lookup, seconds);

	    return str;
	}

	var build_1 = build;

	function isShortId(id) {
	    if (!id || typeof id !== 'string' || id.length < 6 ) {
	        return false;
	    }

	    var characters = alphabet_1.characters();
	    var len = id.length;
	    for(var i = 0; i < len;i++) {
	        if (characters.indexOf(id[i]) === -1) {
	            return false;
	        }
	    }
	    return true;
	}

	var isValid = isShortId;

	var clusterWorkerId = parseInt(process.env.NODE_UNIQUE_ID || 0, 10);

	var lib$1 = createCommonjsModule(function (module) {







	// if you are using cluster or multiple servers use this to make each instance
	// has a unique value for worker
	// Note: I don't know if this is automatically set when using third
	// party cluster solutions such as pm2.
	var clusterWorkerId$$1 = clusterWorkerId || 0;

	/**
	 * Set the seed.
	 * Highly recommended if you don't want people to try to figure out your id schema.
	 * exposed as shortid.seed(int)
	 * @param seed Integer value to seed the random alphabet.  ALWAYS USE THE SAME SEED or you might get overlaps.
	 */
	function seed(seedValue) {
	    alphabet_1.seed(seedValue);
	    return module.exports;
	}

	/**
	 * Set the cluster worker or machine id
	 * exposed as shortid.worker(int)
	 * @param workerId worker must be positive integer.  Number less than 16 is recommended.
	 * returns shortid module so it can be chained.
	 */
	function worker(workerId) {
	    clusterWorkerId$$1 = workerId;
	    return module.exports;
	}

	/**
	 *
	 * sets new characters to use in the alphabet
	 * returns the shuffled alphabet
	 */
	function characters(newCharacters) {
	    if (newCharacters !== undefined) {
	        alphabet_1.characters(newCharacters);
	    }

	    return alphabet_1.shuffled();
	}

	/**
	 * Generate unique id
	 * Returns string id
	 */
	function generate() {
	  return build_1(clusterWorkerId$$1);
	}

	// Export all other functions as properties of the generate function
	module.exports = generate;
	module.exports.generate = generate;
	module.exports.seed = seed;
	module.exports.worker = worker;
	module.exports.characters = characters;
	module.exports.decode = decode_1;
	module.exports.isValid = isValid;
	});
	var lib_1 = lib$1.generate;
	var lib_2 = lib$1.seed;
	var lib_3 = lib$1.worker;
	var lib_4 = lib$1.characters;
	var lib_5 = lib$1.decode;
	var lib_6 = lib$1.isValid;

	var shortid = lib$1;

	var misc = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	exports.isObject = isObject;
	exports.stripProps = stripProps;
	function isObject(value) {
	  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && !Array.isArray(value) && value !== null;
	}

	function stripProps(obj, blacklist) {
	  blacklist = Array.isArray(blacklist) ? blacklist : blacklist || [];
	  var res = {};

	  Object.keys(obj).forEach(function (prop) {
	    if (blacklist.indexOf(prop) === -1) {
	      var value = obj[prop];
	      res[prop] = isObject(value) ? stripProps(value, blacklist) : value;
	    }
	  });

	  return res;
	}
	});

	unwrapExports(misc);
	var misc_1 = misc.isObject;
	var misc_2 = misc.stripProps;

	var cryptographic = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.genUuid = genUuid;
	exports.hash = hash;
	exports.hashOfRecord = hashOfRecord;



	var _md2 = _interopRequireDefault(md5);



	var _v2 = _interopRequireDefault(v4_1);



	var _shortid2 = _interopRequireDefault(shortid);



	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	// Integrity of short unique identifiers: https://github.com/dylang/shortid/issues/81#issuecomment-259812835

	function genUuid(ifShortUuid) {
	  return ifShortUuid ? _shortid2.default.generate() : (0, _v2.default)();
	}

	function hash(value) {
	  value = typeof value === 'string' ? value : JSON.stringify(value);
	  return (0, _md2.default)(value);
	}

	function hashOfRecord(record) {
	  return hash((0, misc.stripProps)(record, ['id', '_id']));
	}
	});

	unwrapExports(cryptographic);
	var cryptographic_1 = cryptographic.genUuid;
	var cryptographic_2 = cryptographic.hash;
	var cryptographic_3 = cryptographic.hashOfRecord;

	var utils = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});



	var cryptographic$$1 = _interopRequireWildcard(cryptographic);



	var misc$$1 = _interopRequireWildcard(misc);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	exports.default = Object.assign({}, cryptographic$$1, misc$$1);
	module.exports = exports['default'];
	});

	unwrapExports(utils);

	var debug$1 = createCommonjsModule(function (module, exports) {
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
	exports.coerce = coerce;
	exports.disable = disable;
	exports.enable = enable;
	exports.enabled = enabled;
	exports.humanize = ms;

	/**
	 * The currently active debug mode names, and names to skip.
	 */

	exports.names = [];
	exports.skips = [];

	/**
	 * Map of special "%n" handling functions, for the debug "format" argument.
	 *
	 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	 */

	exports.formatters = {};

	/**
	 * Previous log timestamp.
	 */

	var prevTime;

	/**
	 * Select a color.
	 * @param {String} namespace
	 * @return {Number}
	 * @api private
	 */

	function selectColor(namespace) {
	  var hash = 0, i;

	  for (i in namespace) {
	    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
	    hash |= 0; // Convert to 32bit integer
	  }

	  return exports.colors[Math.abs(hash) % exports.colors.length];
	}

	/**
	 * Create a debugger with the given `namespace`.
	 *
	 * @param {String} namespace
	 * @return {Function}
	 * @api public
	 */

	function createDebug(namespace) {

	  function debug() {
	    // disabled?
	    if (!debug.enabled) return;

	    var self = debug;

	    // set `diff` timestamp
	    var curr = +new Date();
	    var ms$$1 = curr - (prevTime || curr);
	    self.diff = ms$$1;
	    self.prev = prevTime;
	    self.curr = curr;
	    prevTime = curr;

	    // turn the `arguments` into a proper Array
	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }

	    args[0] = exports.coerce(args[0]);

	    if ('string' !== typeof args[0]) {
	      // anything else let's inspect with %O
	      args.unshift('%O');
	    }

	    // apply any `formatters` transformations
	    var index = 0;
	    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
	      // if we encounter an escaped % then don't increase the array index
	      if (match === '%%') return match;
	      index++;
	      var formatter = exports.formatters[format];
	      if ('function' === typeof formatter) {
	        var val = args[index];
	        match = formatter.call(self, val);

	        // now we need to remove `args[index]` since it's inlined in the `format`
	        args.splice(index, 1);
	        index--;
	      }
	      return match;
	    });

	    // apply env-specific formatting (colors, etc.)
	    exports.formatArgs.call(self, args);

	    var logFn = debug.log || exports.log || console.log.bind(console);
	    logFn.apply(self, args);
	  }

	  debug.namespace = namespace;
	  debug.enabled = exports.enabled(namespace);
	  debug.useColors = exports.useColors();
	  debug.color = selectColor(namespace);

	  // env-specific initialization logic for debug instances
	  if ('function' === typeof exports.init) {
	    exports.init(debug);
	  }

	  return debug;
	}

	/**
	 * Enables a debug mode by namespaces. This can include modes
	 * separated by a colon and wildcards.
	 *
	 * @param {String} namespaces
	 * @api public
	 */

	function enable(namespaces) {
	  exports.save(namespaces);

	  exports.names = [];
	  exports.skips = [];

	  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
	  var len = split.length;

	  for (var i = 0; i < len; i++) {
	    if (!split[i]) continue; // ignore empty strings
	    namespaces = split[i].replace(/\*/g, '.*?');
	    if (namespaces[0] === '-') {
	      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
	    } else {
	      exports.names.push(new RegExp('^' + namespaces + '$'));
	    }
	  }
	}

	/**
	 * Disable debug output.
	 *
	 * @api public
	 */

	function disable() {
	  exports.enable('');
	}

	/**
	 * Returns true if the given mode name is enabled, false otherwise.
	 *
	 * @param {String} name
	 * @return {Boolean}
	 * @api public
	 */

	function enabled(name) {
	  var i, len;
	  for (i = 0, len = exports.skips.length; i < len; i++) {
	    if (exports.skips[i].test(name)) {
	      return false;
	    }
	  }
	  for (i = 0, len = exports.names.length; i < len; i++) {
	    if (exports.names[i].test(name)) {
	      return true;
	    }
	  }
	  return false;
	}

	/**
	 * Coerce `val`.
	 *
	 * @param {Mixed} val
	 * @return {Mixed}
	 * @api private
	 */

	function coerce(val) {
	  if (val instanceof Error) return val.stack || val.message;
	  return val;
	}
	});
	var debug_1$1 = debug$1.coerce;
	var debug_2$1 = debug$1.disable;
	var debug_3$1 = debug$1.enable;
	var debug_4$1 = debug$1.enabled;
	var debug_5$1 = debug$1.humanize;
	var debug_6$1 = debug$1.names;
	var debug_7$1 = debug$1.skips;
	var debug_8$1 = debug$1.formatters;

	var browser$1 = createCommonjsModule(function (module, exports) {
	/**
	 * This is the web browser implementation of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = debug$1;
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = 'undefined' != typeof chrome
	               && 'undefined' != typeof chrome.storage
	                  ? chrome.storage.local
	                  : localstorage();

	/**
	 * Colors.
	 */

	exports.colors = [
	  'lightseagreen',
	  'forestgreen',
	  'goldenrod',
	  'dodgerblue',
	  'darkorchid',
	  'crimson'
	];

	/**
	 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
	 * and the Firebug extension (any Firefox version) are known
	 * to support "%c" CSS customizations.
	 *
	 * TODO: add a `localStorage` variable to explicitly enable/disable colors
	 */

	function useColors() {
	  // NB: In an Electron preload script, document will be defined but not fully
	  // initialized. Since we know we're in Chrome, we'll just detect this case
	  // explicitly
	  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
	    return true;
	  }

	  // is webkit? http://stackoverflow.com/a/16459606/376773
	  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
	    // is firebug? http://stackoverflow.com/a/398120/376773
	    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
	    // is firefox >= v31?
	    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
	    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
	    // double check webkit in userAgent just in case we are in a worker
	    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
	}

	/**
	 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	 */

	exports.formatters.j = function(v) {
	  try {
	    return JSON.stringify(v);
	  } catch (err) {
	    return '[UnexpectedJSONParseError]: ' + err.message;
	  }
	};


	/**
	 * Colorize log arguments if enabled.
	 *
	 * @api public
	 */

	function formatArgs(args) {
	  var useColors = this.useColors;

	  args[0] = (useColors ? '%c' : '')
	    + this.namespace
	    + (useColors ? ' %c' : ' ')
	    + args[0]
	    + (useColors ? '%c ' : ' ')
	    + '+' + exports.humanize(this.diff);

	  if (!useColors) return;

	  var c = 'color: ' + this.color;
	  args.splice(1, 0, c, 'color: inherit');

	  // the final "%c" is somewhat tricky, because there could be other
	  // arguments passed either before or after the %c, so we need to
	  // figure out the correct index to insert the CSS into
	  var index = 0;
	  var lastC = 0;
	  args[0].replace(/%[a-zA-Z%]/g, function(match) {
	    if ('%%' === match) return;
	    index++;
	    if ('%c' === match) {
	      // we only are interested in the *last* %c
	      // (the user may have provided their own)
	      lastC = index;
	    }
	  });

	  args.splice(lastC, 0, c);
	}

	/**
	 * Invokes `console.log()` when available.
	 * No-op when `console.log` is not a "function".
	 *
	 * @api public
	 */

	function log() {
	  // this hackery is required for IE8/9, where
	  // the `console.log` function doesn't have 'apply'
	  return 'object' === typeof console
	    && console.log
	    && Function.prototype.apply.call(console.log, console, arguments);
	}

	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */

	function save(namespaces) {
	  try {
	    if (null == namespaces) {
	      exports.storage.removeItem('debug');
	    } else {
	      exports.storage.debug = namespaces;
	    }
	  } catch(e) {}
	}

	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */

	function load() {
	  var r;
	  try {
	    r = exports.storage.debug;
	  } catch(e) {}

	  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	  if (!r && typeof process !== 'undefined' && 'env' in process) {
	    r = process.env.DEBUG;
	  }

	  return r;
	}

	/**
	 * Enable namespaces listed in `localStorage.debug` initially.
	 */

	exports.enable(load());

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
	    return window.localStorage;
	  } catch (e) {}
	}
	});
	var browser_1$1 = browser$1.log;
	var browser_2$1 = browser$1.formatArgs;
	var browser_3$1 = browser$1.save;
	var browser_4$1 = browser$1.load;
	var browser_5$1 = browser$1.useColors;
	var browser_6$1 = browser$1.storage;
	var browser_7$1 = browser$1.colors;

	var node$1 = createCommonjsModule(function (module, exports) {
	/**
	 * Module dependencies.
	 */




	/**
	 * This is the Node.js implementation of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */

	exports = module.exports = debug$1;
	exports.init = init;
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;

	/**
	 * Colors.
	 */

	exports.colors = [6, 2, 3, 4, 5, 1];

	/**
	 * Build up the default `inspectOpts` object from the environment variables.
	 *
	 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
	 */

	exports.inspectOpts = Object.keys(process.env).filter(function (key) {
	  return /^debug_/i.test(key);
	}).reduce(function (obj, key) {
	  // camel-case
	  var prop = key
	    .substring(6)
	    .toLowerCase()
	    .replace(/_([a-z])/g, function (_, k) { return k.toUpperCase() });

	  // coerce string value into JS value
	  var val = process.env[key];
	  if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
	  else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
	  else if (val === 'null') val = null;
	  else val = Number(val);

	  obj[prop] = val;
	  return obj;
	}, {});

	/**
	 * The file descriptor to write the `debug()` calls to.
	 * Set the `DEBUG_FD` env variable to override with another value. i.e.:
	 *
	 *   $ DEBUG_FD=3 node script.js 3>debug.log
	 */

	var fd = parseInt(process.env.DEBUG_FD, 10) || 2;

	if (1 !== fd && 2 !== fd) {
	  util.deprecate(function(){}, 'except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)')();
	}

	var stream = 1 === fd ? process.stdout :
	             2 === fd ? process.stderr :
	             createWritableStdioStream(fd);

	/**
	 * Is stdout a TTY? Colored output is enabled when `true`.
	 */

	function useColors() {
	  return 'colors' in exports.inspectOpts
	    ? Boolean(exports.inspectOpts.colors)
	    : tty.isatty(fd);
	}

	/**
	 * Map %o to `util.inspect()`, all on a single line.
	 */

	exports.formatters.o = function(v) {
	  this.inspectOpts.colors = this.useColors;
	  return util.inspect(v, this.inspectOpts)
	    .split('\n').map(function(str) {
	      return str.trim()
	    }).join(' ');
	};

	/**
	 * Map %o to `util.inspect()`, allowing multiple lines if needed.
	 */

	exports.formatters.O = function(v) {
	  this.inspectOpts.colors = this.useColors;
	  return util.inspect(v, this.inspectOpts);
	};

	/**
	 * Adds ANSI color escape codes if enabled.
	 *
	 * @api public
	 */

	function formatArgs(args) {
	  var name = this.namespace;
	  var useColors = this.useColors;

	  if (useColors) {
	    var c = this.color;
	    var prefix = '  \u001b[3' + c + ';1m' + name + ' ' + '\u001b[0m';

	    args[0] = prefix + args[0].split('\n').join('\n' + prefix);
	    args.push('\u001b[3' + c + 'm+' + exports.humanize(this.diff) + '\u001b[0m');
	  } else {
	    args[0] = new Date().toUTCString()
	      + ' ' + name + ' ' + args[0];
	  }
	}

	/**
	 * Invokes `util.format()` with the specified arguments and writes to `stream`.
	 */

	function log() {
	  return stream.write(util.format.apply(util, arguments) + '\n');
	}

	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */

	function save(namespaces) {
	  if (null == namespaces) {
	    // If you set a process.env field to null or undefined, it gets cast to the
	    // string 'null' or 'undefined'. Just delete instead.
	    delete process.env.DEBUG;
	  } else {
	    process.env.DEBUG = namespaces;
	  }
	}

	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */

	function load() {
	  return process.env.DEBUG;
	}

	/**
	 * Copied from `node/src/node.js`.
	 *
	 * XXX: It's lame that node doesn't expose this API out-of-the-box. It also
	 * relies on the undocumented `tty_wrap.guessHandleType()` which is also lame.
	 */

	function createWritableStdioStream (fd) {
	  var stream;
	  var tty_wrap = process.binding('tty_wrap');

	  // Note stream._type is used for test-module-load-list.js

	  switch (tty_wrap.guessHandleType(fd)) {
	    case 'TTY':
	      stream = new tty.WriteStream(fd);
	      stream._type = 'tty';

	      // Hack to have stream not keep the event loop alive.
	      // See https://github.com/joyent/node/issues/1726
	      if (stream._handle && stream._handle.unref) {
	        stream._handle.unref();
	      }
	      break;

	    case 'FILE':
	      var fs$$1 = fs;
	      stream = new fs$$1.SyncWriteStream(fd, { autoClose: false });
	      stream._type = 'fs';
	      break;

	    case 'PIPE':
	    case 'TCP':
	      var net$$1 = net;
	      stream = new net$$1.Socket({
	        fd: fd,
	        readable: false,
	        writable: true
	      });

	      // FIXME Should probably have an option in net.Socket to create a
	      // stream from an existing fd which is writable only. But for now
	      // we'll just add this hack and set the `readable` member to false.
	      // Test: ./node test/fixtures/echo.js < /etc/passwd
	      stream.readable = false;
	      stream.read = null;
	      stream._type = 'pipe';

	      // FIXME Hack to have stream not keep the event loop alive.
	      // See https://github.com/joyent/node/issues/1726
	      if (stream._handle && stream._handle.unref) {
	        stream._handle.unref();
	      }
	      break;

	    default:
	      // Probably an error on in uv_guess_handle()
	      throw new Error('Implement me. Unknown stream file type!');
	  }

	  // For supporting legacy API we put the FD here.
	  stream.fd = fd;

	  stream._isStdio = true;

	  return stream;
	}

	/**
	 * Init logic for `debug` instances.
	 *
	 * Create a new `inspectOpts` object in case `useColors` is set
	 * differently for a particular `debug` instance.
	 */

	function init (debug) {
	  debug.inspectOpts = {};

	  var keys = Object.keys(exports.inspectOpts);
	  for (var i = 0; i < keys.length; i++) {
	    debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	  }
	}

	/**
	 * Enable namespaces listed in `process.env.DEBUG` initially.
	 */

	exports.enable(load());
	});
	var node_1$1 = node$1.init;
	var node_2$1 = node$1.log;
	var node_3$1 = node$1.formatArgs;
	var node_4$1 = node$1.save;
	var node_5$1 = node$1.load;
	var node_6$1 = node$1.useColors;
	var node_7$1 = node$1.colors;
	var node_8$1 = node$1.inspectOpts;

	var src$1 = createCommonjsModule(function (module) {
	/**
	 * Detect Electron renderer process, which is node, but we should
	 * treat as a browser.
	 */

	if (typeof process !== 'undefined' && process.type === 'renderer') {
	  module.exports = browser$1;
	} else {
	  module.exports = node$1;
	}
	});

	var baseReplicator = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();



	var _feathersOfflineSnapshot2 = _interopRequireDefault(lib);





	var _debug2 = _interopRequireDefault(src$1);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var debug = (0, _debug2.default)('base-replicator');

	var BaseReplicator = function () {
	  function BaseReplicator(service) {
	    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	    _classCallCheck(this, BaseReplicator);

	    debug('constructor entered');

	    // Higher order class defines: this.engine, this.store, this.changeSort, this.on

	    this._service = service;
	    this._query = options.query || {};
	    this._publication = options.publication;

	    this.genShortUuid = true;
	  }

	  _createClass(BaseReplicator, [{
	    key: 'connect',
	    value: function connect() {
	      var _this = this;

	      this.engine.removeListeners();

	      return (0, _feathersOfflineSnapshot2.default)(this._service, this._query).then(function (records) {
	        records = _this._publication ? records.filter(_this._publication) : records;
	        records = _this.engine.sorter ? records.sort(_this.engine.sorter) : records;

	        _this.engine.snapshot(records);
	        _this.engine.addListeners();
	      });
	    }
	  }, {
	    key: 'disconnect',
	    value: function disconnect() {
	      this.engine.removeListeners();
	    }
	  }, {
	    key: 'useShortUuid',
	    value: function useShortUuid(ifShortUuid) {
	      this.genShortUuid = !!ifShortUuid;
	    }
	  }, {
	    key: 'getUuid',
	    value: function getUuid() {
	      return (0, utils.genUuid)(this.genShortUuid);
	    }

	    // array.sort(Realtime.sort('fieldName'));

	  }, {
	    key: 'connected',
	    get: function get() {
	      return this.engine.listening;
	    }
	  }], [{
	    key: 'sort',
	    value: function sort(prop) {
	      return function (a, b) {
	        return a[prop] > b[prop] ? 1 : a[prop] < b[prop] ? -1 : 0;
	      };
	    }

	    // array.sort(Realtime.multiSort({ field1: 1, field2: -1 }))

	  }, {
	    key: 'multiSort',
	    value: function multiSort(order) {
	      var props = Object.keys(order);
	      var len = props.length;

	      return function (a, b) {
	        var result = 0;
	        var i = 0;

	        while (result === 0 && i < len) {
	          var prop = props[i];
	          var sense = order[prop];

	          result = a[prop] > b[prop] ? 1 * sense : a[prop] < b[prop] ? -1 * sense : 0;
	          i++;
	        }

	        return result;
	      };
	    }
	  }]);

	  return BaseReplicator;
	}();

	exports.default = BaseReplicator;
	module.exports = exports['default'];
	});

	unwrapExports(baseReplicator);

	var componentEmitter = createCommonjsModule(function (module) {
	/**
	 * Expose `Emitter`.
	 */

	{
	  module.exports = Emitter;
	}

	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */

	function Emitter(obj) {
	  if (obj) return mixin(obj);
	}
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
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks['$' + event];

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
	});

	var baseEngine = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();



	var _componentEmitter2 = _interopRequireDefault(componentEmitter);



	var _debug2 = _interopRequireDefault(src$1);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var debug = (0, _debug2.default)('base-engine');

	var BaseEngine = function () {
	  function BaseEngine(service) {
	    var _this = this;

	    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	    _classCallCheck(this, BaseEngine);

	    debug('constructor entered');

	    this._service = service;
	    this._publication = options.publication;
	    this._subscriber = options.subscriber || function () {};
	    this._sorter = options.sort;
	    this._eventEmitter = new _componentEmitter2.default();

	    this._listener = function (eventName) {
	      return function (remoteRecord) {
	        return _this._mutateStore(eventName, remoteRecord, 0);
	      };
	    };

	    this._eventListeners = {
	      created: this._listener('created'),
	      updated: this._listener('updated'),
	      patched: this._listener('patched'),
	      removed: this._listener('removed')
	    };

	    this.useUuid = options.uuid;
	    this.emit = this._eventEmitter.emit;
	    this.on = this._eventEmitter.on;
	    this.listening = false;

	    this.store = {
	      last: { eventName: '', action: '', record: {} },
	      records: []
	    };
	  }

	  _createClass(BaseEngine, [{
	    key: 'snapshot',
	    value: function snapshot(records) {
	      debug('snapshot entered');

	      this.store.last = { action: 'snapshot' };
	      this.store.records = records;

	      if (this._sorter) {
	        records.sort(this._sorter);
	      }

	      this.emit('events', this.store.records, this.store.last);
	      this._subscriber(this.store.records, this.store.last);
	    }
	  }, {
	    key: 'addListeners',
	    value: function addListeners() {
	      debug('addListeners entered');
	      var service = this._service;
	      var eventListeners = this._eventListeners;

	      service.on('created', eventListeners.created);
	      service.on('updated', eventListeners.updated);
	      service.on('patched', eventListeners.patched);
	      service.on('removed', eventListeners.removed);

	      this.listening = true;
	      this.emit('events', this.store.records, { action: 'add-listeners' });
	      this._subscriber(this.store.records, { action: 'add-listeners' });
	    }
	  }, {
	    key: 'removeListeners',
	    value: function removeListeners() {
	      debug('removeListeners entered');

	      if (this.listening) {
	        var service = this._service;
	        var eventListeners = this._eventListeners;

	        service.removeListener('created', eventListeners.created);
	        service.removeListener('updated', eventListeners.updated);
	        service.removeListener('patched', eventListeners.patched);
	        service.removeListener('removed', eventListeners.removed);

	        this.listening = false;
	        this.emit('events', this.store.records, { action: 'remove-listeners' });
	        this._subscriber(this.store.records, { action: 'remove-listeners' });
	      }
	    }
	  }, {
	    key: '_mutateStore',
	    value: function _mutateStore(eventName, remoteRecord, source) {
	      debug('_mutateStore started: ' + eventName);
	      var that = this;

	      var idName = this._useUuid ? 'uuid' : 'id' in remoteRecord ? 'id' : '_id';
	      var store = this.store;
	      var records = store.records;

	      var index = this._findIndex(records, function (record) {
	        return record[idName] === remoteRecord[idName];
	      });

	      if (index >= 0) {
	        records.splice(index, 1);
	      }

	      if (eventName === 'removed') {
	        if (index >= 0) {
	          broadcast('remove');
	        } else if (source === 0 && (!this._publication || this._publication(remoteRecord))) {
	          // Emit service event if it corresponds to a previous optimistic remove
	          broadcast('remove');
	        }

	        return; // index >= 0 ? broadcast('remove') : undefined;
	      }

	      if (this._publication && !this._publication(remoteRecord)) {
	        return index >= 0 ? broadcast('left-pub') : undefined;
	      }

	      records[records.length] = remoteRecord;

	      if (this._sorter) {
	        records.sort(this._sorter);
	      }

	      return broadcast('mutated');

	      function broadcast(action) {
	        debug('emitted ' + index + ' ' + eventName + ' ' + action);
	        store.last = { source: source, action: action, eventName: eventName, record: remoteRecord };

	        that.emit('events', records, store.last);
	        that._subscriber(records, store.last);
	      }
	    }
	  }, {
	    key: 'changeSort',
	    value: function changeSort(sort) {
	      this._sorter = sort;

	      if (this._sorter) {
	        this.store.records.sort(this._sorter);
	      }

	      this.emit('events', this.store.records, { action: 'change-sort' });
	      this._subscriber(this.store.records, { action: 'change-sort' });
	    }
	  }, {
	    key: '_findIndex',
	    value: function _findIndex(array) {
	      var predicate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {
	        return true;
	      };
	      var fromIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

	      for (var i = fromIndex, len = array.length; i < len; i++) {
	        if (predicate(array[i])) {
	          return i;
	        }
	      }

	      return -1;
	    }
	  }]);

	  return BaseEngine;
	}();

	exports.default = BaseEngine;
	module.exports = exports['default'];
	});

	unwrapExports(baseEngine);

	var realtimeEngine = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});



	var _baseEngine2 = _interopRequireDefault(baseEngine);



	var _debug2 = _interopRequireDefault(src$1);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var debug = (0, _debug2.default)('realtime-engine');

	var RealtimeEngine = function (_BaseEngine) {
	  _inherits(RealtimeEngine, _BaseEngine);

	  function RealtimeEngine(service) {
	    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	    _classCallCheck(this, RealtimeEngine);

	    debug('constructor started');

	    var _this = _possibleConstructorReturn(this, (RealtimeEngine.__proto__ || Object.getPrototypeOf(RealtimeEngine)).call(this, service, options));

	    debug('constructor ended');
	    return _this;
	  }

	  return RealtimeEngine;
	}(_baseEngine2.default);

	exports.default = RealtimeEngine;
	module.exports = exports['default'];
	});

	unwrapExports(realtimeEngine);

	var lib$2 = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});



	var _baseReplicator2 = _interopRequireDefault(baseReplicator);



	var _realtimeEngine2 = _interopRequireDefault(realtimeEngine);



	var _debug2 = _interopRequireDefault(src$1);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var debug = (0, _debug2.default)('realtime-replicator');

	var RealtimeReplicator = function (_BaseReplicator) {
	  _inherits(RealtimeReplicator, _BaseReplicator);

	  function RealtimeReplicator(service) {
	    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	    _classCallCheck(this, RealtimeReplicator);

	    debug('constructor started');

	    var _this = _possibleConstructorReturn(this, (RealtimeReplicator.__proto__ || Object.getPrototypeOf(RealtimeReplicator)).call(this, service, options));

	    var engine = _this.engine = new _realtimeEngine2.default(service, options);
	    _this.changeSort = function () {
	      return engine.changeSort.apply(engine, arguments);
	    };
	    _this.on = function () {
	      return engine.on.apply(engine, arguments);
	    };
	    _this.store = engine.store;

	    debug('constructor ended');
	    return _this;
	  }

	  return RealtimeReplicator;
	}(_baseReplicator2.default);

	exports.default = RealtimeReplicator;
	module.exports = exports['default'];
	});

	var Realtime = unwrapExports(lib$2);

	var snapshotPlugin = () => {
	  return {
	    onModel(model) {

	      if (!model.snapshot) return;
	      if (!model.services.socket && !model.clients.socket) {
	        throw new Error('Snapshot Plugin: A socket client must be provided on initialization!')
	      }

	      const serviceRealtime = new Realtime(model.services.socket, model.snapshot);

	      serviceRealtime.on('events', (records, last) => {
	        let publications = {};

	        if (model.snapshot.publications) {
	          publications = Object
	            .keys(model.snapshot.publications)
	            .reduce((state, publicationName) => Object.assign(state, {
	              [publicationName]: records.filter(model.snapshot.publications[publicationName])
	            }), {});
	        }

	        this.dispatch[model.name].store({
	          connected: serviceRealtime.connected,
	          last, 
	          records,
	          publications
	        });
	      });

	      const sync = (authData) => {
	        const { verifier } = model.snapshot;
	        if (verifier && !verifier(authData)) return false;
	        
	        serviceRealtime
	          .connect()
	          .then(() => {
	            console.debug('%c' + `[${model.name}] snapshot syncronized.`.toUpperCase(), 'color: #2196F3');
	          })
	          .catch(err => {
	            console.debug('%c' + `[${model.name}] snapshot failed.`.toUpperCase(), 'color: #ff0000');
	            console.error(err);
	          });
	      };

	      if (model.snapshot.authenticated) {
	        // if transport is socket
	        if (model.transport === 'socket') {
	          return model.clients.socket.on('authenticated', sync);
	        }
	        // if transport is rest
	        model.clients.rest.on('authenticated', ({ accessToken }) => {
	          model.clients.socket.authenticate({ strategy: 'jwt', accessToken }).then(sync);
	        });
	      } else {
	        sync();
	      }

	    }
	  }
	};

	var authPlugin = ({ socket }) => {
	  return {
	    onStoreCreated(store) {
	      
	      const accessToken = localStorage["feathers-jwt"];
	      if (!accessToken) return;

	      const auth = { strategy: 'jwt', accessToken };

	      const initAuthentication = () =>
	        store.dispatch.authentication.authenticate(auth)
	          .then(authData => console.debug('authOnInit: authenticated', authData))
	          .catch(err => console.error('authOnInit: authentication failed', err));

	      socket
	        ? socket.io.engine.on('upgrade', initAuthentication)
	        : initAuthentication();

	    }
	  }
	};

	const defaultState$1 = {
	  error: null,
	  loading: null,
	  signedIn: false,
	  user: null,
	  token: null
	};

	var createAuthModel = ({ rest, socket, transport = 'socket' }) => {

	  const model = {
	    state: new seamlessImmutable(defaultState$1),
	    clients: { rest, socket },
	    reducers: {
	      finished(state, { accessToken, user}) {
	        return state.merge({
	          loading: false,
	          signedIn: true,
	          token: accessToken,
	          user
	        });
	      },
	      loading(state) {
	        return state.merge({loading: true});
	      },
	      error(state, payload) {
	        return state.merge({
	          loading: false,
	          error: payload
	        });
	      },
	    },
	    effects: (dispatch) => ({
	      async authenticate(payload) {
	        const client = model.clients[transport];

	        dispatch.authentication.loading();
	        try {
	          const authData = await client.authenticate(payload);  
	          dispatch.authentication.finished(authData);
	          return authData;
	        } catch (error) {
	          dispatch.authentication.error(error);
	        }
	      },
	      async logout(payload, rootState) {
	        return await socket.logout(payload);
	      },
	    })
	  };

	  return model;
	};

	const init = ({ restClient, socketClient, transport, socket, services, authentication }) => {

	  const models = services.reduce((obj, service) => {
	    
	    const config = {
	      modelName: service.name,
	      rest: restClient.service(service.path),
	      socket: socketClient.service(service.path),
	      snapshot: service.snapshot,
	      clients: { socket: socketClient, rest: restClient },
	      transport
	    };

	    const model = createModel(config);

	    return Object.assign(obj, {
	      [service.name]: model
	    })
	  }, {});

	  /**
	  |--------------------------------------------------
	  | Authentication
	  |--------------------------------------------------
	  */

	  if (authentication) {
	    models['authentication'] = createAuthModel({
	      socket: socketClient,
	      rest: restClient,
	      transport: authentication.transport
	    });
	  }
	  return { models };
	};

	exports.init = init;
	exports.realtime = realtimePlugin;
	exports.snapshot = snapshotPlugin;
	exports.auth = authPlugin;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
