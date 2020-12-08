module.exports = {
  configured: function () {
    if (!this._isDistributionConfigured()) {
      if (!this._getDistributionPath()) {
        this.log.error('No Nuxeo Server configured.');
      } else {
        this.log.error('Your nuxeo.conf file is not properly configured.');
      }

      return false;
    }
    return true;
  },

  trigger: function (modules) {
    let content = this._generateDevBundleContent(modules);

    this.log.writeln();
    this.log.info('Writing changes on `dev.bundles` file:');
    this.fs.write(this._getDevBuildsPath(), content);
  }
};
