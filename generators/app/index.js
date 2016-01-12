'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var mkdirp = require('mkdirp');
var async = require('async');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

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
    return _.uniq(this._moduleResolveParent(d, ret));
  },
  _moduleReadDescriptor: function(remote) {
    this.nuxeo = {
      modules: {}
    };
    fs.readdirSync(remote.cachePath).forEach(function(file) {
      var descPath = path.join(remote.cachePath, file, 'descriptor.js');
      if (fs.existsSync(descPath)) {
        this.nuxeo.modules[file] = require(descPath);
      }
    }.bind(this));
    this.log(this.nuxeo.modules);
  },

  initializing: function() {
    var done = this.async();
    var that = this;
    this.log('Initializing');

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
      that.log(modules);
      modules = _.sortBy(modules, function(m) {
        return that.nuxeo.modules[m].order || 0;
      });
      that.log(modules);
      process.exit(2);

      callback();
    }

    async.waterfall([fetchRemote, readDescriptor, resolveModule, function(callback) {
      this.log('initializing selected module.');
      callback();
    }.bind(this)], function() {
      done();
    });
  },
  prompting: function() {
    var done = this.async();
    this.log(yosay(
      'Welcome to the ' + chalk.red('Nuxeo') + ' generator!'
    ));

    this.prompt(this.nuxeo.descriptor.params, function(props) {
      this.props = props;
      // To access props later use this.props.someOption;

      done();
    }.bind(this));
  },
  configuring: function() {
    this.log('configuring called.');
  },
  writing: function() {
    // handling beforeTemplate
    if (typeof this.nuxeo.descriptor.beforeTemplate === "function") {
      this.nuxeo.descriptor.beforeTemplate.call(this)
    }
    // handling templates

    // handling contributions
    // handling devDependencies
    // handling contributions
    this.log("writing called.");
  },
  end: function() {
    this.log("Thanks you very.");
  },
  _handlingBeforeTemplate: function() {

  }
});
