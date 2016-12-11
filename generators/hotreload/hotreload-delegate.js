const _ = require('lodash');
const chalk = require('chalk');
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
    const parentFolder = this.destinationRoot();
    this.log.info(`Looking for Nuxeo bundles in ${parentFolder}/pom.xml file.`);
    const modules = this._listModules(this.destinationRoot());
    const ignored = this._getIgnoredModules();
    const filtered = [];

    _(modules).each((module) => {
      if (ignored.indexOf(module) >= 0) {
        this.log.error(`${chalk.yellow(module)} is ignored.`);
        return;
      }

      if (!this._isModuleBuilt(module)) {
        this.log.error(`${chalk.red(module)} has never been built.`);
        return;
      }

      this.log.ok(`${chalk.green(module)} is ready.`);
      filtered.push(module);
    });
    let content = this._generateDevBundleContent(filtered);

    this.log.writeln();
    this.log.info('Writing changes on `dev.bundles` file:');
    this.fs.write(this._getDevBuildsPath(), content);
  },

  end: function() {
    this.log.writeln();
    this.log.info(`Hot reload triggered on: ${this._getDistributionPath()}`);
  }
};

module.exports = {
  _hotreloadDelegate: delegate
};
