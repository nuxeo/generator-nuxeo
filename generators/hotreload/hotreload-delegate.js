const Conflicter = require('../../utils/conflicter.js');
const process = require('process');
const chalk = require('chalk');
const _ = require('lodash');
const {DEPLOYMENTS} = require('../../utils/deployment-helper');
const { debug } = require('console');

const delegate = {
  initializing: function() {
    // Override Conflicter to do not bother user if dev.bundles containing only generated stuff.
    this.conflicter = new Conflicter(this.env.adapter, () => {
      if (this.options.force) {
        return true;
      }
      return this.options.force || this._isFullyGeneratedFile();
    });

    // Define the hotreload handler based on the configuration
    if (this._getDeployment() === DEPLOYMENTS.LOCAL) {
      this.hotreloadHandler = require('./hotreload/LocalHotReload.js');
    } else if (this._getDeployment() === DEPLOYMENTS.COMPOSE) {
      this.hotreloadHandler = require('./hotreload/ComposeHotReload.js');
    } else {
      this.log.error(`Run \`${this.usage.prototype.resolvebinary(this.options)} configure\` first.`);
      process.exit(1);
    }
  },

  configuring: function() {
    let config = this.hotreloadHandler.configured.apply(this);

    // Wrap response into a Promise if response isn't already one.
    if (typeof config.then !== 'function') {
      config = Promise.resolve(config);
    }

    const done = this.async();
    config.then((res) => {
      if (!res) {
        this.log.error(`Run \`${this.usage.prototype.resolvebinary(this.options)} configure\` first.`);
        process.exit(1);
      }
      done();
    }).catch(() => {
      done();
    });
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

    // Trigger the hotreload
    const res = this.hotreloadHandler.trigger.apply(this, [filtered]);
    // Rely on async#done if res is a Promise, to fully resolve it before moving forward
    if (typeof res.then === 'function') {
      const done = this.async();
      res.then(() => {
        done();
      }).catch((err) => {
        debug(err);
        throw err;
      });
    }
  },

  end: function() {
    this.log.writeln();
    this.log.info('Hot reload triggered.');
  }
};

module.exports = delegate;
