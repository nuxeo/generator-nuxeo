const yeoman = require('yeoman-generator');

var App = {
  _beforeConstructor: function () {
    this.option('connectUrl', {
      desc: 'Set and save base Connect URL',
      type: String
    });
  },

  _beforeInitializing: function () {
    const url = this.options.connectUrl;
    if (url) {
      this.log.info('New Connect URL saved: ' + url);
      this._setConnectUrl(url);
    }
  }
};
App = Object.assign(App, require('../../lib/delegated-generator.js').withDefault('link'));

App = Object.assign(App, require('./link-delegate.js'));
App = Object.assign(App, require('./unlink-delegate.js'));

App = Object.assign(App, require('./connect.js'));
App = Object.assign(App, require('./maven.js'));
App = Object.assign(App, require('./studio.js'));
module.exports = yeoman.extend(App);
