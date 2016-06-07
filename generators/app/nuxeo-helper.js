'use strict';

var _ = require('lodash');
var chalk = require('chalk');
var nuxeowelcome = require('../../utils/welcome.js');
var recursiveSync = require('../../utils/recursive-readdirSync.js');
var s = require('../../utils/nuxeo.string.js');

module.exports = {
  _tplPath: function(str, ctx) {
    var regex = /{{([\s\S]+?)}}/g;
    return _.template(str, {
      interpolate: regex,
      imports: {
        s: s
      }
    })(ctx);
  },

  _recursivePath: function(basePath) {
    return recursiveSync(basePath, ['.DS_Store']);
  },

  _showHello: function() {
    this.log(nuxeowelcome);
  },

  _showWelcome: function() {
    if (!_.isEmpty(this.nuxeo.selectedModules)) {
      this.log.info('You\'ll be prompted for generation of: ' + chalk.blue(this.nuxeo.selectedModules.join(', ')));
    } else {
      this.log.info(chalk.yellow('Nothing to install.'));
    }
  },

  _require: function(m) {
    return require(m);
  }
};
