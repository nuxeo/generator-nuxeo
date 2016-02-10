'use strict';
var s = require('underscore.string');

s.unpackagize = function(str) {
  return s(str).replace(/\./g, '/').value();
};

module.exports = s;
