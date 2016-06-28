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

    filterModulesPerType: function(types, callback) {
      var filtered = {};
      // this.log.invoke('Requirements: ' + chalk.blue(modules.join(', ')));
      _.keys(types).forEach((type) => {
        let modules = types[type];
        filtered[type] = this._init._filterModules.call(this, modules, type);
      });


      if (callback) {
        callback(null, filtered);
      } else {
        return filtered;
      }
    },

    _filterModules: function(modules, type) {
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
    },

    saveModules(modules, callback) {
      this.nuxeo.selectedModules = _.omitBy(modules, _.isEmpty);
      callback();
    }
  }
};
