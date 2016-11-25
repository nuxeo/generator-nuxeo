const Conflicter = require('../../utils/conflicter.js');
const process = require('process');

const delegate = {
  initializing: function() {
    // Override Conflicter to do not bother user if dev.bundles containing only generated stuff.
    this.conflicter = new Conflicter(this.env.adapter, () => {
      if (this.options.force) {
        return true;
      }
      return this.options.force || this._isFullyGeneratedFile();
    });
  },

  configuring: function() {
    if (!this._isDistributionConfigured()) {
      if (!this._getDistributionPath()) {
        this.log.error('Any Nuxeo Server configured.');
      } else {
        this.log.error('Your nuxeo.conf file is not properly configured.');
      }

      this.log.error('You must run `yo nuxeo:hotreload configure` first.');

      process.exit(1);
    }
  },

  writing: function() {
    let content = this._generateDevBundle();
    this.log.info('Writing changes on `dev.bundles` file:');
    this.fs.write(this._getDevBuildsPath(), content);
  },

  end: function() {
    this.log.info(`Hot reload triggered on: ${this._getDistributionPath()}`);
  }
};

module.exports = {
  _hotreloadDelegate: delegate
};
