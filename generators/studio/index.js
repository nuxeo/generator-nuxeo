const chalk = require('chalk');
const yeoman = require('yeoman-generator');

var App = {
  _beforeConstructor: function () {
    this.option('connectUrl', {
      desc: 'Use and save as default base Connect URL',
      type: String,
      default: this._getConnectUrl()
    });

    this.option('exclude', {
      desc: 'Exclude synchronization registries kind',
      type: String,
      default: 'tp'
    });
  },

  _beforeInitializing: function () {
    const url = this.options.connectUrl;
    if (this._isNewConnectUrl(url)) {
      this.log.info('New Connect URL saved: ' + chalk.blue(url));
      this._setConnectUrl(url);
    }
  }
};
App = Object.assign(App, require('../../lib/delegated-generator.js').withDefault('link'));

App = Object.assign(App, require('./link-delegate.js'));
App = Object.assign(App, require('./unlink-delegate.js'));
App = Object.assign(App, require('./sync-delegate.js'));

App = Object.assign(App, require('./connect.js'));
App = Object.assign(App, require('./maven.js'));
App = Object.assign(App, require('./studio.js'));
module.exports = yeoman.extend(App);
