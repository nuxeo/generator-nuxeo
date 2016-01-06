'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var mkdirp = require('mkdirp');
var async = require('async');
var fs = require('fs');
var path = require('path');

module.exports = yeoman.generators.Base.extend({
  _moduleExists: function() {
    return fs.readdirSync(this.nuxeo.remote.cachePath).indexOf(this.module) >= 0;
  },
  _moduleList: function() {
    return fs.readdirSync(this.nuxeo.remote.cachePath);
  },
  _moduleReadDescriptor: function() {
    var descPath = path.join(this.nuxeo.remote.cachePath, this.module, 'descriptor.js');
    if (!fs.existsSync(descPath)) {
      this.log("Descriptor file is missing...");
      process.exit(2);
    }

    this.nuxeo.descriptor = require(descPath);
    this.log(this.nuxeo.descriptor);
  },
  initializing: function() {
    var done = this.async();
    this.log('Initializing');

    async.waterfall([function(callback) {
      this.remote('akervern', 'nuxeo-generator-meta', 'master', function(err, remote) {
        callback(err, remote);
      }.bind(this), true);
    }.bind(this), function(remote, callback) {
      this.nuxeo = {
        remote: remote
      };
      callback();
    }.bind(this), function(callback) {
      try {
        this.argument('module', {
          type: String,
          required: true
        });
      } catch (ex) {
        this.log("No module defined; use: 'default'.")
        this.module = 'default'
      }
      if (!this._moduleExists()) {
        this.log('Unknown module: ' + this.module);
        this.log('Available modules:')
        this._moduleList().forEach(function(file) {
          if (fs.statSync(path.join(this.nuxeo.remote.cachePath, file)).isDirectory()) {
            this.log("\t- " + file);
          }
        }.bind(this));
        process.exit(1);
      }

      // check if module exists
      this.log('Module: ' + this.module);
      callback();
    }.bind(this), function(callback) {
      this.log('initializing selected module.');
      this._moduleReadDescriptor();
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
    // handling templates
    // handling contributions
    // handling devDependencies
    // handling contributions
    this.log("writing called.");
  },
  end: function() {
    this.log("Thanks you very.");
  }
});
