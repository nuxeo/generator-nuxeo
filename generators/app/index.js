'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var mkdirp = require('mkdirp');
var async = require('async');
var fs = require('fs');
var path = require('path');

module.exports = yeoman.generators.Base.extend({
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);

    async.waterfall([function(callback) {
      this.remote('akervern', 'nuxeo-generator-meta', 'master', function(err, remote) {
        callback(err, remote);
      }.bind(this));
    }.bind(this), function(remote, callback) {
      this.nuxeo = {
        remote: remote
      }
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
        this._listModules().forEach(function(file) {
          if (fs.statSync(path.join(this.nuxeo.remote.cachePath, file)).isDirectory()) {
            this.log("\t" + file);
          }
        }.bind(this));
        process.exit(1);
      }

      // check if module exists
      this.log('Module: ' + this.module);
      process.exit(1);
      callback();
    }.bind(this)]);
  },
  _moduleExists: function() {
    return fs.readdirSync(this.nuxeo.remote.cachePath).indexOf(this.module) >= 0;
  },
  _listModules: function() {
    return fs.readdirSync(this.nuxeo.remote.cachePath);
  },
  initializing: function() {
    var done = this.async();
    this.log('initializing called.');

    setTimeout(function() {
      this.log("asdasdasd");
      done();
    }.bind(this), 2000);
  },
  prompting: function() {
    var done = this.async();
    this.log(yosay(
      'Welcome to the ' + chalk.red('Nuxeo') + ' generator!'
    ));

    var prompts = [];

    this.prompt(prompts, function(props) {
      this.props = props;
      // To access props later use this.props.someOption;

      done();
    }.bind(this));
  },
  configuring: function() {
    this.log('configuring called.');
  },
  writing: function() {
    this.log("writing called.");
  },
  end: function() {
    this.log("Thanks you very.");
  }
});
