/*eslint strict:0*/
'use strict';

var _ = require('lodash');
var chalk = require('chalk');
var clone = require('yeoman-remote');
var isDirectory = require('is-directory').sync;
var path = require('path');

function fetchRemote(callback) {
  // Silent logs while remote fetching
  var writeOld = process.stderr.write;

  // Ensure connection is up and cat reach github
  // In that case; update the metamodel from the repository
  // Otherwise try to find the latest fetch
  require('dns').resolve('www.github.com', (errco) => {
    if (errco) {
      this.log.info('Unable to fetch metamodel remotely... Trying locally.');
      let remote = this.config.get('lastRemote');
      if (!(remote && isDirectory(remote))) {
        this.log.error('You must initialize metamodel online once.');
        process.exit(1);
      }

      callback(undefined, remote);
    } else {
      process.stderr.write = function() {};
      // Fetch remote repository containing module metadata
      clone('nuxeo', 'generator-nuxeo-meta', this.options.meta, (err, remote) => {
        process.stderr.write = writeOld;
        callback(err, remote);
      }, true);
    }
  });
}

function fetchLocal(callback) {
  this.log.error('Using a local path: ' + this.options.localPath);
  callback(undefined, this.options.localPath);
}

function filterModules(modules, type) {
  let skip = false;
  let filtered = [];
  _.forEachRight(modules, (module) => {
    if (skip || this._moduleSkipped(module, type)) {
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
  });
  return filtered;
}

module.exports = {
  _init: function(_opts) {
    var opts = _opts || {};
    return {
      fetch: opts.localPath ? fetchLocal : fetchRemote,

      saveRemote: function(remote, callback) {
        this.nuxeo = {
          modules: {},
          samples: {},
          cachePath: remote
        };
        this.config.set('lastRemote', remote);
        callback(undefined, this.nuxeo);
      },

      readDescriptor: function(remote, callback) {
        // XXX Should be removed from init object
        this._moduleReadDescriptor(remote);
        callback();
      },

      readSamples: function(remote, callback) {
        callback(undefined, require(path.join(remote.cachePath, 'samples', 'samples.js')));
      },

      resolveModule: function(callback) {
        // XXX Should be removed from init object
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

        // Default module is single-module
        if (_.isEmpty(args)) {
          args.push('multi-module');
          args.push('single-module');
        }

        var types = this._modulesPerTypes(args);
        _.keys(types).forEach((type) => {
          types[type] = this._moduleFindParents(types[type]);
        });

        callback(null, types);
      },

      _filterModules: filterModules,

      filterModulesPerType: function(types, callback) {
        // XXX Should be removed from init object
        var filtered = {};
        // this.log.invoke('Requirements: ' + chalk.blue(modules.join(', ')));
        _.keys(types).forEach((type) => {
          let modules = types[type];
          filtered[type] = filterModules.call(this, modules, type);
        });


        if (callback) {
          callback(null, filtered);
        } else {
          return filtered;
        }
      },

      saveModules(modules, callback) {
        this.nuxeo.selectedModules = _.omitBy(modules, _.isEmpty);
        callback();
      },

      saveSamples(samples, callback) {
        this.nuxeo.samples = samples;
        callback();
      }
    };
  }
};
