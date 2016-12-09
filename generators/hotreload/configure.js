const path = require('path');
const exists = require('path-exists').sync;
const isDocker = require('is-docker');
const fs = require('fs');

const DISTRIBUTION_PATH = 'distribution:path';

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
    return fs.readFileSync(getNuxeoConfPath(distributionPath), {
      encoding: 'UTF-8'
    }).match(/^nuxeo\.templates\s*=\s*.*sdk/m);
  },

  _getDistributionPath: function() {
    return isDocker() ? '/distribution' : this.config.get(DISTRIBUTION_PATH);
  },

  _saveDistributionPath: function(distributionPath) {
    if (isDocker()) {
      // this#_getDistributionPath method return the distribution path inside the container.
      distributionPath = this._getDistributionPath();
      this.log.ok(`Using container's volume ${distributionPath} as base distribution path.`);
    }

    if (!(exists(distributionPath) && fs.statSync(distributionPath).isDirectory())) {
      this.log.error(`Directory ${distributionPath} do not exists.`);
      process.exit(1);
    }

    let nuxeoConf = getNuxeoConfPath(distributionPath);
    if (!exists(nuxeoConf)) {
      this.log.error(`Unable to reach nuxeo.conf file from: ${nuxeoConf}`);
      process.exit(1);
    }

    if (!isDocker()) {
      // Do not override any value if .yo-rc file has been intiated outside a container.
      this.config.set(DISTRIBUTION_PATH, distributionPath);
    }
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
