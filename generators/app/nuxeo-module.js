const _ = require('lodash');
const fs = require('fs');
const maven = require('../../utils/maven.js');
const path = require('path');
const async = require('async');
const v = require('../../utils/version-helper.js');
const s = require('../../utils/nuxeo.string.js');
const chalk = require('chalk');

module.exports = {
  _moduleExists: function (module) {
    return typeof this.nuxeo.modules[module] !== 'undefined';
  },

  _moduleList: function () {
    return _.keys(this.nuxeo.modules);
  },

  _moduleFindParents: function (args) {
    let res = [];
    let autonomous = false;

    _.each(args, (arg) => {
      res.push(this._moduleResolveParent(arg));
    });

    // Filter default empty generator
    let modules = _.reject(_.uniq(_.flatten(_.union(args, res))), (o) => {
      return o === 'default' || o === 'multi-module';
    });

    // Check if an autonomous package is needed
    _.each(modules, (arg) => {
      autonomous = this.nuxeo.modules[arg].autonomous || autonomous;
    });

    // Filter single module if any module present is autonomous
    if (autonomous) {
      modules = _.reject(modules, (o) => {
        return o === 'single-module';
      });
    }

    modules = _.sortBy(modules, (m) => {
      return this.nuxeo.modules[m].order || 0;
    });

    return modules;
  },

  _moduleResolveParent: function (module, depends) {
    const ret = depends || [];
    const d = this.nuxeo.modules[module] && this.nuxeo.modules[module].depends || 'default';

    ret.push(d);
    if (d === 'single-module') {
      return ret;
    }
    return this._moduleResolveParent(d, ret);
  },

  _moduleReadDescriptor: function (remote) {
    this.nuxeo.modules = this.nuxeo.modules || {};

    const generatorsPath = path.join(remote.cachePath, 'generators');
    fs.readdirSync(generatorsPath).forEach((file) => {
      const descPath = path.join(generatorsPath, file, 'descriptor.js');
      if (fs.existsSync(descPath)) {
        this.nuxeo.modules[file] = require(descPath);
      }
    });
    // this.log(this.nuxeo.modules);
  },

  _addModulesDependencies: function (pomParent) {
    const that = this;
    const dirs = _.filter(fs.readdirSync('.'), function (file) {
      return fs.lstatSync(file).isDirectory() && file.match(/-\w+$/) && !file.match('-' + that.currentGenerator.type + '$');
    });
    _.forEach(dirs, function (dir) {
      const pomPath = path.join(dir, 'pom.xml');
      if (that.fs.exists(pomPath)) {
        const pom = maven.open(that.fs.read(pomPath));
        pomParent.addDependency(pom.groupId() + ':' + pom.artifactId());
      }
    });
  },

  _moduleSkipped: function (module, modules) {
    const skipFunc = this.nuxeo.modules[module].skip;
    return typeof skipFunc === 'function' ? skipFunc.apply(this, [modules]) : false;
  },

  _parentSkipped: function (module) {
    const parent = this.nuxeo.modules[module].depends || 'default';
    return this._moduleSkipped(parent);
  },

  _createMultiModuleIsNeeded: function (types) {
    return !this._isMultiModule() && types && types.length > 1 || _.findIndex(this.args, (o) => {
      return o === 'multi-module';
    }) >= 0 || this.args.length === 0;
  },

  _moduleResolveType: function (module) {
    return this.nuxeo.modules[module].type || this.options.type;
  },

  _modulesPerTypes: function (modules) {
    const types = {};
    _(modules).forEach((module) => {
      const type = this._moduleResolveType(module);
      // root is multi-module base, skip it.
      if (type === 'root') {
        return;
      }

      const array = types[type] || [];
      array.push(module);
      types[type] = array;
    });
    return types;
  },

  _moduleSortedKeys: function () {
    return _.sortBy(_.keys(this.nuxeo.selectedModules), (key) => {
      const modules = this.nuxeo.selectedModules[key];
      return _(modules).map((module) => {
        return this.nuxeo.modules[module].order || 0;
      }).min();
    });
  },

  _readModuleVersionRequirements: function (module) {
    const target = this.nuxeo.modules[module];
    if (target.version !== undefined) {
      return target.version;
    }

    let parent = {
      depends: target.depends
    };
    do {
      parent = this.nuxeo.modules[parent.depends || 'default'];
      if (parent.version !== undefined) {
        return parent.version;
      }
    } while (parent.depends !== undefined);

    return undefined;
  },

  _isModuleAvailableForVersion: function (module) {
    const nv = this._getNuxeoVersion();
    const mvr = this._readModuleVersionRequirements(module);

    if (mvr === undefined) {
      return true;
    }

    // Assuming a module is not available if generator is executed on a non-readable Nuxeo version.
    if (nv === undefined) {
      return false;
    }

    return v.fromStr(`${nv} ${mvr}`);
  },

  _eachGenerator: function (params) {
    const { ignore, func, title } = params;
    const done = this.async();
    const types = this._moduleSortedKeys();

    async.eachSeries(types, (type, parentCb) => {
      const items = this.nuxeo.selectedModules[type];

      async.eachSeries(items, (item, callback) => {
        const generator = this.nuxeo.modules[item];

        if (ignore && ignore(generator)) {
          callback();

          return;
        }

        if (title) {
          this.log.create(chalk.green(`${title} ${s.humanize(item)}`));
        }

        if (!this._isModuleAvailableForVersion(item)) {
          this.log.info(`${chalk.yellow('Skipped')} it requires version ${this._readModuleVersionRequirements(item)} (found ${this._getNuxeoVersion()}).`);
          callback();

          return;
        }

        func(type, item, generator, callback);
      }, () => {
        parentCb();
      });
    }, () => {
      done();
    });
  }
};
