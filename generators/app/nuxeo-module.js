'use strict';

var _ = require('lodash');
var fs = require('fs');
var maven = require('../../utils/maven.js');
var path = require('path');

module.exports = {
  _moduleExists: function(module) {
    return typeof this.nuxeo.modules[module] !== 'undefined';
  },

  _moduleList: function() {
    return _.keys(this.nuxeo.modules);
  },

  _moduleFindParents: function(args) {
    var res = [];
    if (_.isEmpty(args)) {
      args = ['multi-module'];
    }
    _.each(args, function(arg) {
      res.push(this._moduleResolveParent(arg));
    }.bind(this));
    // Filter default empty generator
    var modules = _.reject(_.uniq(_.flatten(_.union(args, res))), function(o) {
      return o === 'default';
    });
    modules = _.sortBy(modules, function(m) {
      return this.nuxeo.modules[m].order || 0;
    }.bind(this));
    return modules;
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
    var generatorsPath = path.join(remote.cachePath, 'generators');
    fs.readdirSync(generatorsPath).forEach(function(file) {
      var descPath = path.join(generatorsPath, file, 'descriptor.js');
      if (fs.existsSync(descPath)) {
        this.nuxeo.modules[file] = require(descPath);
      }
    }.bind(this));
    // this.log(this.nuxeo.modules);
  },

  _isMultiModule: function() {
    return this.config.get('multi') || false;
  },

  _addModulesDependencies: function(pomParent) {
    var that = this;
    var dirs = _.filter(fs.readdirSync('.'), function(file) {
      return fs.lstatSync(file).isDirectory() && file.match(/-\w+$/) && !file.match('-' + that.currentGenerator.type + '$');
    });
    _.forEach(dirs, function(dir) {
      var pomPath = path.join(dir, 'pom.xml');
      if (that.fs.exists(pomPath)) {
        var pom = maven.open(that.fs.read(pomPath));
        pomParent.addDependency(pom.groupId() + ':' + pom.artifactId());
      }
    });
  },

  _moduleSkipped: function(module) {
    var skipFunc = this.nuxeo.modules[module].skip;
    return typeof skipFunc === 'function' ? skipFunc.apply(this) : false;
  },

  _parentSkipped: function(module) {
    var parent = this.nuxeo.modules[module].depends || 'default';
    return this._moduleSkipped(parent);
  }
};
