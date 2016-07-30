var _ = require('lodash');
var fs = require('fs');
var maven = require('../../utils/maven.js');
var path = require('path');

module.exports = {
  _moduleExists: function(module) {
    return typeof this.nuxeo.modules[module] !== 'undefined';
  },

  _moduleList: function() {
    return _.keys(this.nuxeo.modules);
  },

  _moduleFindParents: function(args) {
    var res = [];
    var autonomous = false;

    _.each(args, (arg) => {
      res.push(this._moduleResolveParent(arg));
    });

    // Filter default empty generator
    var modules = _.reject(_.uniq(_.flatten(_.union(args, res))), (o) => {
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

  _moduleResolveParent: function(module, depends) {
    var ret = depends || [];
    var d = this.nuxeo.modules[module] && this.nuxeo.modules[module].depends || 'default';

    ret.push(d);
    if (d === 'single-module') {
      return ret;
    }
    return this._moduleResolveParent(d, ret);
  },

  _moduleReadDescriptor: function(remote) {
    this.nuxeo = {
      modules: {},
      cachePath: remote.cachePath
    };
    var generatorsPath = path.join(remote.cachePath, 'generators');
    fs.readdirSync(generatorsPath).forEach((file) => {
      var descPath = path.join(generatorsPath, file, 'descriptor.js');
      if (fs.existsSync(descPath)) {
        this.nuxeo.modules[file] = require(descPath);
      }
    });
    // this.log(this.nuxeo.modules);
  },

  _isMultiModule: function() {
    return this.config.get('multi') || false;
  },

  _addModulesDependencies: function(pomParent) {
    var that = this;
    var dirs = _.filter(fs.readdirSync('.'), function(file) {
      return fs.lstatSync(file).isDirectory() && file.match(/-\w+$/) && !file.match('-' + that.currentGenerator.type + '$');
    });
    _.forEach(dirs, function(dir) {
      var pomPath = path.join(dir, 'pom.xml');
      if (that.fs.exists(pomPath)) {
        var pom = maven.open(that.fs.read(pomPath));
        pomParent.addDependency(pom.groupId() + ':' + pom.artifactId());
      }
    });
  },

  _moduleSkipped: function(module, modules) {
    var skipFunc = this.nuxeo.modules[module].skip;
    return typeof skipFunc === 'function' ? skipFunc.apply(this, [modules]) : false;
  },

  _parentSkipped: function(module) {
    var parent = this.nuxeo.modules[module].depends || 'default';
    return this._moduleSkipped(parent);
  },

  _createMultiModuleIsNeeded: function(types) {
    return !this._isMultiModule() && types && types.length > 1 || _.findIndex(this.args, (o) => {
      return o === 'multi-module';
    }) >= 0;
  },

  _moduleResolveType: function(module) {
    return this.nuxeo.modules[module].type || this.options.type;
  },

  _modulesPerTypes: function(modules) {
    var types = {};
    _(modules).forEach((module) => {
      var type = this._moduleResolveType(module);
      // root is multi-module base, skip it.
      if (type === 'root') {
        return;
      }

      var array = types[type] || [];
      array.push(module);
      types[type] = array;
    });
    return types;
  },

  _moduleSortedKeys: function() {
    return _.sortBy(_.keys(this.nuxeo.selectedModules), (key) => {
      var modules = this.nuxeo.selectedModules[key];
      return _(modules).map((module) => {
        return this.nuxeo.modules[module].order || 0;
      }).min();
    });
  }
};
