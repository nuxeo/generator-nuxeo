var _ = require('lodash');
var fs = require('fs');
var maven = require('../../utils/maven.js');
var path = require('path');

module.exports = {
  _getBaseFolderName: function(type) {
    if (this._isMultiModule() && type !== 'root') {
      return this._getTypeFolderName(type || this.options.type);
    } else {
      return '.';
    }
  },

  _resolveTypeFolderName: function(type, create) {
    var dir = _.find(fs.readdirSync('.'), function(file) {
      return fs.lstatSync(file).isDirectory() && file.match('-' + type + '$');
    });
    if (!dir) {
      dir = path.basename(path.resolve('.')) + '-' + type;
      if (create) {
        fs.mkdirSync(dir);
      }
    }
    return dir;
  },

  _getTypeFolderName: function(type) {
    var dir = this._resolveTypeFolderName(type, true);

    // Add Maven module to parent
    var pom = maven.open(this.fs.read('pom.xml'));
    if (!pom.containsModule(dir) && this.currentProps) {
      // If not module, assuming we are handling a template that contains
      // parent_package and parent_version properties.

      pom.addModule(dir);

      // Add new module to dependency management
      // Following the template rules in case of a multi-module
      var p = this.currentProps;
      pom.addDependency(`${p.parent_package}:${p.artifact}:\${project.version}`);
      pom.save(this.fs, 'pom.xml');
    }

    return dir;
  }
};
