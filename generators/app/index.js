'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var async = require('async');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');
var mkdirp = require('mkdirp');

var nuxeo = require('./nuxeo-base.js');
var s = require('../../utils/nuxeo.string.js');
var maven = require('../../utils/maven.js');
var manifestmf = require('../../utils/manifestmf.js');
var propHolder = require('../../utils/property-holder.js');

module.exports = nuxeo.extend({
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);

    this.option('nuxeo', {
      type: String,
      alias: 'n',
      defaults: 'master'
    });
    this.option('localPath', {
      type: String,
      alias: 'l'
    });
  },
  initializing: function() {
    var done = this.async();
    var init = this._init;

    this._showHello();

    var fetchMethod = this.options.localPath ? init.fetchLocal : init.fetchRemote;
    var seq = async.seq(fetchMethod, init.readDescriptor, init.resolveModule, init.filterModules).bind(this);
    seq(function() {
      done();
    });
  },
  prompting: function() {
    var done = this.async();
    var that = this;

    this._showWelcome();
    that.props = {};
    async.eachSeries(this.nuxeo.selectedModules, function(item, callback) {
      var params = that.nuxeo.modules[item].params || [];

      if (!_.isEmpty(params)) {
        params = propHolder.filter(params);

        that.log.info(chalk.red('Generating ' + s.humanize(item)));
        // Show asked parameters
        var trimParams = [];
        _.forEach(params, function(p) {
          trimParams.push(s.humanize(s.trim(p.message.replace(/\(.+\)/, ''), '\\s+:_-')));
        });
        that.log.info('\t' + chalk.blue('Parameters: ') + trimParams.join(', '));
      }
      that.prompt(params, function(props) {
        propHolder.store(params, props);
        that.props[item] = _.assign(propHolder.stored(), props);
        callback();
      });
    }, function() {
      done();
    });
  },
  writing: function() {
    var that = this;
    var done = this.async();
    async.eachSeries(this.nuxeo.selectedModules, function(item, callback) {
      that.log.info('Generating ' + chalk.red(s.capitalize(item) + ' template'));
      var generator = that.nuxeo.modules[item];
      var props = that.props[item];

      // XXX Should be handled differently
      // Add _.s to the props for allowing using the same str format function
      props.s = s;

      // XXX Might be handle a different way
      var manifestPath = path.join(that._getBaseFolderName(generator.type), 'src', 'main', 'resources', 'META-INF', 'MANIFEST.MF');
      var mf = manifestmf.open(manifestPath, that.fs);
      if (mf) {
        props.symbolicName = mf.symbolicName();
      }

      // handling configuration
      _.forEach(generator.config, function(value, key) {
        if (typeof value === 'function') {
          value = value.call(that);
        } else if (typeof value === 'string' && value.match(/^{{.+}}$/)) {
          value = that._tplPath(value, props);
        }
        that.config[key] = value;
      });

      // handling templates
      var tmplPath = path.resolve(that.nuxeo.cachePath, item, 'templates');
      var destPath = that._getBaseFolderName(generator.type);
      if (fs.existsSync(tmplPath)) {
        _.forEach(that._recursivePath(tmplPath), function(template) {
          var dest = that._tplPath(template, props).replace(tmplPath, destPath);
          if (s.startsWith(path.basename(dest), '.')) {
            mkdirp(path.dirname(dest));
          } else {
            that.fs.copyTpl(template, dest, props);
          }
        });
      }

      _.forEach(generator['main-java'], function(source) {
        that.log.info('Copy main java');
        // XXX To be refactored
        var args = [that._getBaseFolderName(generator.type), 'src/main/java'];
        args.push(props.package.split('.'));
        args.push(that._tplPath(source.dest, props));
        var dest = path.join.apply(that, _.flatten(args));
        var src = path.join(that.nuxeo.cachePath, item, 'classes', source.src);
        that.fs.copyTpl(src, dest, props);
      });

      _.forEach(generator['test-java'], function(source) {
        that.log.info('Copy test java');
        // XXX To be refactored
        var args = [that._getBaseFolderName(generator.type), 'src/test/java'];
        args.push(props.package.split('.'));
        args.push(that._tplPath(source.dest, props));
        var dest = path.join.apply(that, _.flatten(args));
        var src = path.join(that.nuxeo.cachePath, item, 'classes', source.src);
        that.fs.copyTpl(src, dest, props);
      });

      // handling dependencies
      if (!_.isEmpty(generator.dependencies)) {
        var pomPath = path.join(that._getBaseFolderName(generator.type), 'pom.xml');
        var pom = maven.open(that.fs.read(pomPath));

        _.forEach(generator.dependencies, function(dependency) {
          that.log.info('Add Maven dependency');
          pom.addDependency(dependency);
        });

        pom.save(that.fs, pomPath);
      }

      // handling contributions
      _.forEach(generator.contributions, function(contribution) {
        if (!mf) {
          throw 'MANIFEST.MF file is missing.';
        }

        that.log.info('Copy Contributions');
        var src = typeof contribution.src === 'function' ? contribution.src.call(that, props) : contribution.src;
        src = path.resolve(that.nuxeo.cachePath, item, 'contributions', that._tplPath(src, props));
        var contribName = typeof contribution.dest === 'function' ? contribution.dest.call(that, props) : contribution.dest;
        var dest = path.join(that._getBaseFolderName(generator.type), 'src', 'main', 'resources', 'OSGI-INF', that._tplPath(contribName, props));

        that.fs.copyTpl(src, dest, props);

        // Add contribution to the Manifest file
        var contribPath = path.join('OSGI-INF', that._tplPath(contribName, props));
        mf.addComponent(contribPath);
        mf.save();
      });

      callback();
    }, function() {
      done();
    });
  },
  end: function() {
    this.log.info('Thanks you very much.');
  }
});
