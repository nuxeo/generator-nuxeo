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
  _moduleFindParents: function(args) {
    var res = [];
    _.each(args, function(arg) {
      res.push(this._moduleResolveParent(arg));
    }.bind(this));

    var modules = _.uniq(_.flatten(_.union(args, res)));
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
  },
  _init: {
    fetchRemote: function(callback) {
      // Silent logs while remote fetching
      var writeOld = process.stderr.write;
      process.stderr.write = function() {};

      // Fetch remote repository containing module metadata
      this.remote('nuxeo', 'generator-nuxeo-meta', this.options.nuxeo, function(err, remote) {
        process.stderr.write = writeOld;
        callback(err, remote);
      }, true);
    },
    readDescriptor: function(remote, callback) {
      // Require modules
      this._moduleReadDescriptor(remote);
      callback();
    },
    resolveModule: function(callback) {
      var args = [];
      var that = this;
      this.args.forEach(function(arg) {
        if (!that._moduleExists(arg)) {
          that.log('Unknown module: ' + arg);
          that.log('Available modules:');
          that._moduleList().forEach(function(module) {
            that.log('\t- ' + module);
          });
          process.exit(1);
        }

        args.push(arg);
      });

      callback(null, this._moduleFindParents(args));
    },
    filterModules: function(modules, callback) {
      var filtered = [];
      var skip = false;
      _.forEachRight(modules, function(module) {
        if (skip) {
          return;
        }

        var skipFunc = this.nuxeo.modules[module].skip;
        if (typeof skipFunc === 'function' && skipFunc.apply(this)) {
          skip = true;
        } else {
          var ensureFunc = this.nuxeo.modules[module].ensure;
          if (typeof ensureFunc === 'function' && !ensureFunc.apply(this)) {
            this.log('Unable to install modules due to: ' + module);
            process.exit(1);
          }

          filtered.splice(0, 0, module);
        }
      }.bind(this));
      this.nuxeo.selectedModules = filtered;
      callback();
    }
  }
});
