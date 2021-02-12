const debug = require('debug')('nuxeo:synchronize:delegate');
const Watcher = require('./synchronize/Watcher').Watcher;

const delegate = {
  initializing: function() {
    if (!this.options.nologo) {
      this._showHello();
    }

    const syncConfig = this._getSynchronizeConfig();
    if (syncConfig === undefined) {
      this.log.error(`Run \`${this.usage.prototype.resolvebinary(this.options)} configure\` first.`);
      process.exit(1);
    }

    // Add the deployment config
    syncConfig.deployment = {
      type: this._getDeployment(),
      config: this._getDeploymentConfig()
    };
    this.watcher = new Watcher(syncConfig);
    // Initialize the watcher based on configuration
    const done = this.async();
    this.watcher.initializeHandler().then(() => {
      done();
    }).catch((err) => {
      this.log.error(err);
      this.log.error(`Run \`${this.usage.prototype.resolvebinary(this.options)} configure\` first.`);
      process.exit(1);
    });
  },

  configuring: function() {
    const done = this.async();
    let configured = this.watcher.configured;

    // Wrap response into a Promise if response isn't already one.
    if (typeof configured.then !== 'function') {
      configured = Promise.resolve(configured);
    }

    configured.then((res) => {
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
    require('../../lib/analytics').event('nuxeo:synchronize', this.options._.slice(1).join(' '));
    debug('Options: %O', this.options);

    this.log.info(`Start watching from ${this._getDeployment()}`);

    const done = this.async();
    new Promise((accept) => {
      this.watcher.run();
      process.on('SIGINT', () => {
        // Close the watchers
        this.watcher.closeMainWatcher();
        accept();
      });
    }).then(() => {
      this.log.info('Stop watching');
      done();
    }).catch((err) => {
      this.log.error(err);
      process.exit(0);
    });
  },

  end: function() {
    this.log.info('Synchronization is ended');
  }
};

module.exports = delegate;
