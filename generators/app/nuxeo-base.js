'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var s = require('underscore.string');
var maven = require('../../utils/maven.js');

module.exports = yeoman.generators.Base.extend({
  _moduleExists: function(module) {
    return typeof this.nuxeo.modules[module] !== 'undefined';
  },
  _moduleList: function() {
    return _.keys(this.nuxeo.modules);
  },
  _moduleResolveParent: function(module, depends) {
    var ret = depends || [];
    var d = this.nuxeo.modules[module] && this.nuxeo.modules[module].depends || 'default';
    ret.push(d);
    if (d === 'single-module') {
      return ret;
    }
    return this._moduleResolveParent(d, ret);
  },
  _moduleReadDescriptor: function(remote) {
    this.nuxeo = {
      modules: {},
      cachePath: remote.cachePath
    };
    fs.readdirSync(remote.cachePath).forEach(function(file) {
      var descPath = path.join(remote.cachePath, file, 'descriptor.js');
      if (fs.existsSync(descPath)) {
        this.nuxeo.modules[file] = require(descPath);
      }
    }.bind(this));
    // this.log(this.nuxeo.modules);
  },
  _isMultiModule: function() {
    return this.config.get('multi') || false;
  },
  _getBaseFolderName: function(type) {
    if (this._isMultiModule() && type !== 'root') {
      return this._getTypeFolderName(type || 'core');
    } else {
      return '.';
    }
  },
  _getTypeFolderName: function(type) {
    var dir = _.find(fs.readdirSync('.'), function(file) {
      return fs.lstatSync(file).isDirectory() && file.match('-' + type + '$');
    });
    if (!dir) {
      dir = path.basename(path.resolve('.')) + '-' + type;
      fs.mkdirSync(dir);
    }

    // Add Maven module to parent
    var pom = maven.open(this.fs.read('pom.xml'));
    pom.addModule(dir);
    pom.save(this.fs, 'pom.xml');
    return dir;
  },
  _tplPath: function(str, ctx) {
    var regex = /{{([\s\S]+?)}}/g;
    return _.template(str, {
      interpolate: regex,
      imports: {
        s: s
      }
    })(ctx);
  },
  _showWelcome: function() {
    this.log(yosay(
      'Welcome to the ' + chalk.red('Nuxeo') + ' generator!'
    ));
    this.log.info('You\'ll be prompted to install: ' + this.nuxeo.selectedModules.join(', '));

  },
  _require: function(m) {
    return require(m);
  }
});
