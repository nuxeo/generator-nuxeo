'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var mkdirp = require('mkdirp');
var async = require('async');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var s = require('underscore.string');

module.exports = yeoman.generators.Base.extend({
  _moduleExists: function(module) {
    return typeof this.nuxeo.modules[module] !== 'undefined';
  },
  _moduleList: function() {
    return _.keys(this.nuxeo.modules);
  },
  _moduleResolveParent: function(module, depends) {
    var ret = depends || [];
    var d = (this.nuxeo.modules[module] && this.nuxeo.modules[module].depends) || 'default';
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
      return '.'
    }
  },
  _getTypeFolderName: function(type) {
    var dir = _.find(fs.readdirSync('.'), function(file) {
      return fs.lstatSync(file).isDirectory() && file.match('-' + type + '$');
    });
    if (!dir) {
      dir = path.basename(path.resolve('.')) + "-" + type;
      fs.mkdirSync(dir);
    }
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
  initializing: function() {
    var done = this.async();
    var that = this;

    function fetchRemote(callback) {
      // Silent logs while remote fetching
      var writeOld = process.stderr.write;
      process.stderr.write = function() {};

      // Fetch remote repository containing module metadata
      that.remote('akervern', 'nuxeo-generator-meta', 'master', function(err, remote) {
        process.stderr.write = writeOld;
        callback(err, remote);
      }, true);
    }

    function readDescriptor(remote, callback) {
      // Require modules
      that._moduleReadDescriptor(remote);
      callback();
    }

    function resolveModule(callback) {
      var args = [];
      that.args.forEach(function(arg) {
        if (!that._moduleExists(arg)) {
          that.log('Unknown module: ' + arg);
          that.log('Available modules:')
          that._moduleList().forEach(function(module) {
            that.log("\t- " + module);
          });
          process.exit(1);
        }

        args.push(arg);
      });

      var modules = _.uniq(_.union(args, that._moduleResolveParent(args)));
      modules = _.sortBy(modules, function(m) {
        return that.nuxeo.modules[m].order || 0;
      });
      callback(null, modules);
    }

    function filterModules(modules, callback) {
      var filtered = [];
      var skip = false;
      _.forEachRight(modules, function(module) {
        if (skip) {
          return;
        }

        var skipFunc = that.nuxeo.modules[module].skip;
        if (typeof skipFunc === 'function' && skipFunc.apply(that)) {
          skip = true;
        } else {
          var ensureFunc = that.nuxeo.modules[module].ensure;
          if (typeof ensureFunc === 'function' && !ensureFunc.apply(that)) {
            that.log('Unable to install modules due to: ' + module);
            process.exit(1);
          }

          filtered.splice(0, 0, module);
        }
      });
      that.nuxeo.selectedModules = filtered;
      callback();
    }

    async.waterfall([fetchRemote, readDescriptor, resolveModule, filterModules], function() {
      done();
    });
  },
  _showWelcome: function() {
    this.log(yosay(
      'Welcome to the ' + chalk.red('Nuxeo') + ' generator!'
    ));
    this.log.info('You\'ll be prompted to install: ' + this.nuxeo.selectedModules.join(', '));

  },
  prompting: function() {
    var done = this.async();
    var that = this;

    this._showWelcome();

    that.props = {};
    async.eachSeries(this.nuxeo.selectedModules, function(item, callback) {
      var params = that.nuxeo.modules[item].params || [];

      if (params.length > 0) {
        that.log.info(chalk.red('Generating ' + s.humanize(item)));
        // Show asked parameters
        var trimParams = [];
        _.forEach(params, function(p) {
          trimParams.push(s.humanize(s.trim(p.message, '\\s+:_-')))
        });
        that.log.info('\t' + chalk.blue('Parameters: ') + trimParams.join(', '));
      }
      that.prompt(params, function(props) {
        that.props[item] = props;
        // To access props later use this.props.someOption;

        callback();
      });
    }, function() {
      that.log.info(chalk.red('Prompting done.'));
      done();
    });
  },
  _require: function(m) {
    return require(m);
  },
  writing: function() {
    var that = this;
    var done = this.async();
    async.eachSeries(this.nuxeo.selectedModules, function(item, callback) {
      that.log.info('Generating ' + chalk.red(s.capitalize(item) + ' template'));
      var generator = that.nuxeo.modules[item];
      var props = that.props[item];

      // handling before
      if (typeof generator.before == 'function') {
        that.log.info('Before called on ' + item);
        generator.before.call(that, props);
      }

      // handling beforeTemplate
      if (typeof generator.beforeGeneration == 'function') {
        that.log.info('BeforeGeneration called on ' + item);
        generator.beforeGeneration.call(that, props);
      }

      // handling templates
      _.forEach(generator.templates, function(template) {
        var dest = typeof template.dest === 'function' ? template.dest.call(that, props) : template.dest;
        var src = typeof template.src === 'function' ? template.src.call(that, props) : template.src;

        src = path.resolve(that.nuxeo.cachePath, item, 'templates', that._tplPath(src, props));
        dest = path.join(that._getBaseFolderName(generator.type), that._tplPath(dest, props));

        that.fs.copyTpl(src, dest, props);
      });

      _.forEach(generator['main-java'], function(source) {
        that.log.info('Copy main java');
        // XXX To be refactored
        var args = [that._getBaseFolderName(generator.type), 'src/main/java'];
        args.push(props.package.split('.'));
        args.push(that._tplPath(source.dest, props));
        var dest = path.join.apply(that, _.flatten(args));
        var src = path.join(that.nuxeo.cachePath, item, 'templates', source.src);
        that.fs.copyTpl(src, dest, props);
      });

      _.forEach(generator['test-java'], function(source) {
        that.log.info('Copy test java');
        // XXX To be refactored
        var args = [that._getBaseFolderName(generator.type), 'src/test/java'];
        args.push(props.package.split('.'));
        args.push(that._tplPath(source.dest, props));
        var dest = path.join.apply(that, _.flatten(args));
        var src = path.join(that.nuxeo.cachePath, item, 'templates', source.src);
        that.fs.copyTpl(src, dest, props);
      });

      // handling dependencies
      _.forEach(generator.dependencies, function(dependency) {
        // XXX Call maven util
      });

      // handling contributions
      _.forEach(generator.contributions, function(contribution) {
        that.log.info('Copy Contributions');
        var src = typeof contribution.src === 'function' ? contribution.src.call(that, props) : contribution.src;
        src = path.resolve(that.nuxeo.cachePath, item, 'contributions', that._tplPath(src, props));
        var dest = typeof contribution.dest === 'function' ? contribution.dest.call(that, props) : contribution.dest;
        dest = path.join(that._getBaseFolderName(generator.type), "src", "main", "resources", "OSGI-INF", that._tplPath(dest, props));

        that.fs.copyTpl(src, dest, props);
        // XXX Add contribution to MANIFEST FILE
      });

      callback();
    }, function() {
      done();
    });
  },
  end: function() {
    this.log("Thanks you very.");
  }
});
