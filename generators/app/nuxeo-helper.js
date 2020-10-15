/*eslint strict:0*/
'use strict';

const _ = require('lodash');
const chalk = require('chalk');
const nuxeowelcome = require('../../lib/welcome.js')('Generator');
const recursiveSync = require('../../utils/recursive-readdirSync.js');
const fs = require('fs');
const s = require('../../utils/nuxeo.string.js');
const maven = require('../../utils/maven.js');

module.exports = {
  _tplPath: function(str, ctx) {
    const regex = /{{([\s\S]+?)}}/g;
    return _.template(str, {
      interpolate: regex,
      imports: {
        s: s
      }
    })(ctx);
  },

  _isMultiModule: function() {
    return this.config.get('multi') || this._isUnknownBom() || false;
  },

  _recursivePath: function(basePath) {
    return recursiveSync(basePath, ['.DS_Store']);
  },

  _showHello: function() {
    if (this.usage.prototype.isYeoman(this.options)) {
      this.log(nuxeowelcome);
    }
  },

  _isUnknownBom: function(filename) {
    filename = filename || './pom.xml';
    return fs.existsSync(filename) ? maven.open(this.fs.read(filename)).isBom() : false;
  },

  _showWelcome: function() {
    // XXX CHECK THE TEST
    if (!_.isEmpty(this.nuxeo.selectedModules)) {
      const types = this.nuxeo.selectedModules;
      const vn = this._getNuxeoVersion();
      if (vn !== undefined) {
        this.log.info(`Your target Nuxeo version is: ${chalk.blue(vn)}`);
      }
      this.log.info(chalk.green('You will be prompted for generation of:'));
      _.keys(types).forEach((key) => {
        this.log.info(`  ${chalk.blue(this._resolveTypeFolderName(key))}: ${_(types[key]).join(', ')}`);
      });
    } else {
      this.log.info(chalk.yellow('Nothing to install.'));
    }
  },

  _require: function(m) {
    return require(m);
  }
};
