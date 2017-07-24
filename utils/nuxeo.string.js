const s = require('underscore.string');
const _ = require('lodash');
const path = require('path');

s.unpackagize = function (str) {
  return s(str).replace(/\./g, path.sep).value();
};

s.enumize = function(value, suffix) {
  _.range(1, arguments.length).forEach((i) => {
    if (!new RegExp('.' + arguments[i] + '$', 'i').test(value)) {
      return;
    }
    value = value.replace(new RegExp(arguments[i] + '$', 'i'), '');
  });
  return s(value).underscored().toUpperCase().value() + '_' + s(suffix).underscored().toUpperCase().value();
};

module.exports = s;
