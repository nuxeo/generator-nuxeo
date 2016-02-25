'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var s = require('../../utils/nuxeo.string.js');
var maven = require('../../utils/maven.js');
var recursiveSync = require('../../utils/recursive-readdirSync.js');

module.exports = yeoman.generators.Base.extend({
  _moduleExists: function(module) {
    return typeof this.nuxeo.modules[module] !== 'undefined';
  },
  _moduleList: function() {
    return _.keys(this.nuxeo.modules);
  },
  _moduleFindParents: function(args) {
    var res = _.isEmpty(args) ? ['single-module'] : args;
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

    // Add new module to dependency management
    // Following the template rules in case of a multi-module
    var p = this.currentProps;
    if (p.parent_package) {
      pom.addDependency(p.parent_package + ':' + p.artifact + ':' + p.parent_version);
    }

    pom.save(this.fs, 'pom.xml');
    return dir;
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
    this.log(yosay(
      'Welcome to the ' + chalk.red('Nuxeo') + ' generator!'
    ));
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
  },
  _moduleSkipped: function(module) {
    var skipFunc = this.nuxeo.modules[module].skip;
    return typeof skipFunc === 'function' ? skipFunc.apply(this) : false;
  },
  _parentSkipped: function(module) {
    var parent = this.nuxeo.modules[module].depends || 'default';
    return this._moduleSkipped(parent);
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
    fetchLocal: function(callback) {
      this.log.error('Using a local path: ' + this.options.localPath);
      callback(undefined, {
        cachePath: this.options.localPath
      });
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

      this.log.invoke('Requirements: ' + chalk.blue(modules.join(', ')));
      _.forEachRight(modules, function(module) {
        if (skip || this._moduleSkipped(module)) {
          this.log.info('Installation of ' + chalk.yellow(module) + ' is skipped.');
          skip = true;
          return;
        } else {
          var ensureFunc = this.nuxeo.modules[module].ensure;
          if (typeof ensureFunc === 'function' && !ensureFunc.apply(this) && this._parentSkipped(module)) {
            this.log.info('Can\'t install module ' + module + '.');
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
