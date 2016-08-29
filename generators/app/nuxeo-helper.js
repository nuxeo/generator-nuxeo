/*eslint strict:0*/
'use strict';

var _ = require('lodash');
var chalk = require('chalk');
var nuxeowelcome = require('../../utils/welcome.js');
var recursiveSync = require('../../utils/recursive-readdirSync.js');
var fs = require('fs');
var s = require('../../utils/nuxeo.string.js');
var maven = require('../../utils/maven.js');

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

  _isUnknownBom: function(filename) {
    filename = filename || './pom.xml';
    return fs.existsSync(filename) ? maven.open(this.fs.read(filename)).isBom() : false;
  },

  _showWelcome: function() {
    // XXX CHECK THE TEST
    if (!_.isEmpty(this.nuxeo.selectedModules)) {
      let types = this.nuxeo.selectedModules;
      this.log.info(chalk.green('You\'ll be prompted for generation of:'));
      _.keys(types).forEach((key) => {
        this.log.info('  ' + chalk.blue(this._resolveTypeFolderName(key)) + ': ' + _(types[key]).join(', '));
      });
    } else {
      this.log.info(chalk.yellow('Nothing to install.'));
    }
  },

  _require: function(m) {
    return require(m);
  }
};
