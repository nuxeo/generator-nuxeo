/*eslint strict:0*/
'use strict';

var _ = require('lodash');
var chalk = require('chalk');
const http = require('http');
var clone = require('yeoman-remote');
var isDirectory = require('is-directory').sync;
var path = require('path');
const debug = require('debug')('nuxeo:app:init');

function fetchRemote(callback) {
  // Silent logs while remote fetching
  var writeOld = process.stderr.write;

  /**
   * Try to fallback on local clone when network is not available
   * @param {*} errco
   */
  const handleLocalClone = (errco) => {
    this.log.info('Unable to fetch metamodel remotely... Trying locally.');
    debug('%O', errco);
    let remote = this.config.get('lastRemote');
    if (!(remote && isDirectory(remote))) {
      this.log.error('You must initialize metamodel online once.');
      process.exit(1);
    }

    callback(undefined, remote);
  };

  /**
   * Clone generator-nuxeo-meta repository
   */
  const handleRemoteClone = () => {
    process.stderr.write = function () {};
    // Fetch remote repository containing module metadata
    clone('nuxeo', 'generator-nuxeo-meta', this.options.meta, (err, remote) => {
      process.stderr.write = writeOld;
      callback(err, remote);
    }, true);
  };

  // Ensure connection is up and cat reach github
  // In that case; update the metamodel from the repository
  // Otherwise try to find the latest fetch
  http.request({
    method: 'HEAD',
    host: 'www.github.com'
  }, (res) => {
    if (res.statusCode >= 500) {
      handleLocalClone(res);
    } else {
      handleRemoteClone();
    }
  }).on('error', (err) => {
    handleLocalClone(err);
  }).end();
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
  _init: function (_opts) {
    var opts = _opts || {};
    return {
      fetch: opts.localPath ? fetchLocal : fetchRemote,

      saveRemote: function (remote, callback) {
        this.nuxeo = {
          modules: {},
          samples: {},
          cachePath: remote
        };
        this.config.set('lastRemote', remote);
        debug('%O', this.nuxeo);
        callback(undefined, this.nuxeo);
      },

      readDescriptor: function (remote, callback) {
        // XXX Should be removed from init object
        this._moduleReadDescriptor(remote);
        callback();
      },

      readSamples: function (remote, callback) {
        callback(undefined, require(path.join(remote.cachePath, 'samples', 'samples.js')));
      },

      resolveModule: function (callback) {
        // XXX Should be removed from init object
        const args = [];
        const that = this;
        this.args.forEach((arg) => {
          if (!that._moduleExists(arg)) {
            that.log('Unknown module: ' + arg);
            that.log('Available modules:');
            that._moduleList().forEach(function (module) {
              const versionRequirement = that._readModuleVersionRequirements(module);
              that.log(`\t- ${module} ${versionRequirement ? `- (Nuxeo version ${versionRequirement})` : ''}`.trim());
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

      filterModulesPerType: function (types, callback) {
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
