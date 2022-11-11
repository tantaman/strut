"use strict";

function getProp(prop, obj) {
  return obj[prop];
}

function curry1_1(fn, x) {
  return function (y) {
    return fn(x, y);
  };
}

function makePropTest(prop) {
  return curry1_1(getProp, prop);
}

var self = {
  mapFromString: function (firstSplitter, secondSplitter, str) {
    var map = {};

    str.split(firstSplitter).forEach(function (encodedPair) {
      var parts = encodedPair.split(secondSplitter);
      map[parts[0]] = parts[1];
    });

    return map;
  },

  makeSame(prototype, other) {
    Object.keys(other).forEach((k) => {
      other[k] = prototype[k];
    });
    Object.keys(prototype).forEach((k) => {
      other[k] = prototype[k];
    });
  },

  camelize: function (splitter, str) {
    var parts = str.split(splitter);
    if (parts.length == 1) {
      return parts[0];
    }

    return parts.reduce(function (a, b) {
      return a + self.capFirstChars(1, b);
    });
  },

  renameKeys: function (fn, obj) {
    var keys = Object.getKeys(obj);
    return self.swapKeys(keys, keys.map(fn), obj);
  },

  capFirstChars: function (n, str) {
    return str.substring(0, n).toUpperCase() + str.substring(n);
  },

  swapKeys: function (oldKeys, newKeys, obj) {
    for (var i = 0; i < oldKeys.length; ++i) {
      if (oldKeys[i] === newKeys[i]) continue;

      var value = obj[oldKeys[i]];
      delete obj[oldKeys[i]];
      obj[newKeys[i]] = value;
    }

    return obj;
  },

  map2: function (f, a1, a2) {
    var l = Math.min(a1.length, a2.length);

    var r = [];
    for (var i = 0; i < l; ++i) {
      r.push(f(a1[i], a2[i], i, a1, a2));
    }

    return r;
  },

  invariant: function (condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  },

  allDefined: function () {
    for (var i = 0; i < arguments.length; ++i) {
      if (arguments[i] === undefined) return false;
    }

    return true;
  },

  noneDefined: function () {
    for (var i = 0; i < arguments.length; ++i) {
      if (arguments[i] !== undefined) return false;
    }

    return true;
  },

  curry1_1: curry1_1,

  getProp: getProp,
  makePropTest: makePropTest,
  isSelected: makePropTest("isSelected"),
};

export default self;
