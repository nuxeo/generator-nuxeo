const path = require('path');
const exists = require('path-exists').sync;
const fs = require('fs');
const modulesHelper = require('../../utils/modules-helper.js');

const DISTRIBUTION_PATH = 'distribution:path';
const MODULE_IGNORED = 'module:ignored';
const DEPLOYMENT_CONF = 'deployment:type';
const DEPLOYMENT_CONFIG = DEPLOYMENT_CONF + ':config';

// Notes:
//
// Check dev.mode + template sdk
// nxserver/dev.bundles format:
// type:filepath
// type: bundle,library,seam,resourceBundleFragment

function getNuxeoConfPath(distributionPath) {
  // XXX Handle it a saver way; using ENV variable + options
  return path.join(distributionPath, 'bin', 'nuxeo.conf');
}

module.exports = {
  _isDistributionPath: function(distPath) {
    return path.isAbsolute(distPath) && exists(distPath) && exists(path.join(distPath, 'bin', 'nuxeoctl'));
  },

  _isDistributionConfigured: function() {
    return this._getDistributionPath() && this._isDistributionContainsSDK();
  },

  _isDistributionContainsSDK: function() {
    let distributionPath = this._getDistributionPath();
    if (!distributionPath) {
      return false;
    }
    const confPath = getNuxeoConfPath(distributionPath);

    return exists(confPath) && fs.readFileSync(confPath, {
      encoding: 'UTF-8'
    }).match(/^nuxeo\.templates\s*=\s*.*sdk/m);
  },

  _getDistributionPath: function() {
    return this.config.get(DISTRIBUTION_PATH);
  },

  _saveDistributionPath: function(distributionPath) {
    if (!(exists(distributionPath) && fs.statSync(distributionPath).isDirectory())) {
      this.log.error(`Directory ${distributionPath} do not exists.`);
      process.exit(1);
    }

    let nuxeoConf = getNuxeoConfPath(distributionPath);
    if (!exists(nuxeoConf)) {
      this.log.error(`Unable to reach nuxeo.conf file from "${nuxeoConf}".`);
      process.exit(1);
    }

    // Do not override any value if .yo-rc file has been intiated outside a container.
    this.config.set(DISTRIBUTION_PATH, distributionPath);
  },

  _saveIgnoredModules(modules) {
    this.config.set(MODULE_IGNORED, modules || []);
  },

  _getIgnoredModules() {
    return this.config.get(MODULE_IGNORED) || [];
  },

  _saveDeployment(deployment, config = {}) {
    this.config.set(DEPLOYMENT_CONF, deployment);
    this.config.set(DEPLOYMENT_CONFIG, Object.assign({}, config));
  },

  _getDeployment() {
    return this.config.get(DEPLOYMENT_CONF);
  },

  _getDeploymentConfig() {
    return this.config.get(DEPLOYMENT_CONFIG);
  },

  _configureDistribution: function() {
    let nuxeoConfPath = getNuxeoConfPath(this._getDistributionPath());

    let content = fs.readFileSync(nuxeoConfPath, {
      encoding: 'UTF-8'
    });

    // Add SDK / Hot relad needed stuff
    content = this._addSDKTemplate(content);
    content = this._enableDevMode(content);

    this.fs.write(nuxeoConfPath, content);
  },

  /**
   * List available Maven modules inside the `parentFolder`
   * Process exit with error in case the `parentFolder` do
   * not contain any `pom.xml` file.
   */
  _listModules: function(parentFolder) {
    const _rootFolder = parentFolder || this.destinationRoot();
    try {
      return modulesHelper.listModules(_rootFolder);
    } catch (err) {
      this.log.error(err);
      process.exit(0);
    }
  },

  /**
   * Transform a list of modules into a list of choices for the prompting step
   */
  _modulesToChoices: function(modules) {
    return modulesHelper.modulesToChoices(modules);
  },

  /**
   * Nuxeo.conf modification Mmethods
   */
  _addSDKTemplate: function(content) {
    let match = content.match(/^nuxeo\.templates\s*=\s*(.+)/m);
    if (match) {
      let templates = match[1];
      if (!templates.match(/,sdk,?/)) {
        templates += ',sdk';
      }
      return content.replace(/^nuxeo\.templates\s*=\s*.+/m, `nuxeo.templates=${templates}`);
    } else {
      return content + '\nnuxeo.templates=sdk';
    }
  },

  _enableDevMode: function(content) {
    return content.replace(/^#org.nuxeo.dev\s*=\s*.*/m, 'org.nuxeo.dev=true');
  }
};
