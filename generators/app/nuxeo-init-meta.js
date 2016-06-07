'use strict';

var _ = require('lodash');
var chalk = require('chalk');

module.exports = {
  _init: {
    fetchRemote: function(callback) {
      // Silent logs while remote fetching
      var writeOld = process.stderr.write;
      process.stderr.write = function() {};

      // Fetch remote repository containing module metadata
      this.remote('nuxeo', 'generator-nuxeo-meta', this.options.meta, function(err, remote) {
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
};
