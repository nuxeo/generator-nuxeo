let _ = require('lodash');
let exists = require('path-exists').sync;
let fs = require('fs');
var maven = require('../../utils/maven.js');
let path = require('path');
let process = require('process');

const TXT_START = '## GENERATOR-NUXEO STUFF - DO NOT EDIT';
const TXT_END = '## GENERATOR-NUXEO STUFF - END';

function buildMavenTargetPath(module) {
  return path.join(process.cwd(), module, 'target', 'classes');
}

function readFile(filePath) {
  // Volontarly Silent not existing file
  return exists(filePath) ? fs.readFileSync(filePath, {
    encoding: 'UTF-8'
  }) : '';
}

module.exports = {
  _cleanDevBundlesFileContent: function(content) {
    return content.replace(new RegExp(`${TXT_START}(?:\n|.)*${TXT_END}`), '').trim();
  },

  _isFullyGeneratedFile: function() {
    const file = this._buildDevBundlesPath(this._getDistributionPath());
    return this._cleanDevBundlesFileContent(readFile(file)).length === 0;
  },

  _buildDevBundlesPath: function(root) {
    if (!root) {
      throw new Error(`Cannot resolve distribution path: ${root}.`);
    }

    return path.join(root, 'nxserver', 'dev.bundles');
  },

  _listModules: function(parentFolder) {
    let pomPath = path.join(parentFolder, 'pom.xml');
    if (!exists(pomPath)) {
      this.log.error(`No pom.xml file found in ${parentFolder}.`);
      process.exit(1);
    }

    let pom = maven.open(this.fs.read(pomPath));
    // XXX Todo ensure module is a bundle; <type>undefined|jar</type>
    return pom.isBom() ? pom.modules() : ['.'];
  },

  _buildBundlesList: function(type, modules) {
    if (_.isArray(type)) {
      return this._buildBundlesList('bundle', type);
    }

    return _(modules).map((m) => {
      return `${type}:${buildMavenTargetPath(m)}`;
    }).join('\n');
  },

  _renderDevBundlesContent: function(pModules) {
    let modules = pModules || this._listModules(process.cwd());
    // XXX Resolve module type: bundle,library,seam,resourceBundleFragment
    return `${TXT_START}\n${this._buildBundlesList(modules)}\n${TXT_END}\n`;
  },

  _generateDevBundle: function() {
    let devBundlesFile = this._buildDevBundlesPath(this._getDistributionPath());
    let content = readFile(devBundlesFile);
    content = this._cleanDevBundlesFileContent(content);
    content += this._renderDevBundlesContent();
    this.fs.write(devBundlesFile, content);
  }
};
