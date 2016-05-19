'use strict';
var s = require('underscore.string');
var path = require('path');

s.unpackagize = function(str) {
  return s(str).replace(/\./g, path.sep).value();
};

module.exports = s;
