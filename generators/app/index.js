'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var async = require('async');
var path = require('path');
var _ = require('lodash');
var s = require('../../utils/nuxeo.string.js');
var maven = require('../../utils/maven.js');
var manifestmf = require('../../utils/manifestmf.js');
var nuxeo = require('./nuxeo-base.js');

module.exports = nuxeo.extend({
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);

    this.option('nuxeo', {
      type: String,
      alias: 'n',
      defaults: 'master'
    });
  },
  initializing: function() {
    var done = this.async();
    var init = this._init;

    var seq = async.seq(init.fetchRemote, init.readDescriptor, init.resolveModule, init.filterModules).bind(this);
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

      if (params.length > 0) {
        that.log.info(chalk.red('Generating ' + s.humanize(item)));
        // Show asked parameters
        var trimParams = [];
        _.forEach(params, function(p) {
          trimParams.push(s.humanize(s.trim(p.message, '\\s+:_-')));
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
        that.log.info('Copy Contributions');
        var src = typeof contribution.src === 'function' ? contribution.src.call(that, props) : contribution.src;
        src = path.resolve(that.nuxeo.cachePath, item, 'contributions', that._tplPath(src, props));
        var contribName = typeof contribution.dest === 'function' ? contribution.dest.call(that, props) : contribution.dest;
        var dest = path.join(that._getBaseFolderName(generator.type), 'src', 'main', 'resources', 'OSGI-INF', that._tplPath(contribName, props));

        that.fs.copyTpl(src, dest, props);

        // Add contribution to the Manifest file
        var manifestPath = path.join(that._getBaseFolderName(generator.type), 'src', 'main', 'resources', 'META-INF', 'MANIFEST.MF');
        var contribPath = path.join('OSGI-INF', that._tplPath(contribName, props));
        var mf = manifestmf.open(manifestPath, that.fs);
        mf.addComponent(contribPath);
        mf.save();
      });

      callback();
    }, function() {
      done();
    });
  },
  end: function() {
    this.log('Thanks you very.');
  }
});
