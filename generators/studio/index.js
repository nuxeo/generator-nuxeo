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

    this.option('studioMavenPluginVersion', {
      alias: ['m'],
      desc: 'Force specific Studio Maven Plugin Version',
      type: String,
      default: ''
    });

    this.option('skipPomUpdate', {
      type: Boolean,
      defaults: false,
      desc: 'Skip the pom(s) updates',
    });


    this.option('port', {
      alias: ['p'],
      desc: 'IDE Expose port',
      type: Number,
      default: 8080
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

App._registerDelegate('link', require('./link-delegate'));
App._registerDelegate('unlink', require('./unlink-delegate'));
App._registerDelegate('import', require('./import-delegate'));
App._registerDelegate('export', require('./export-delegate'));
App._registerDelegate('release', require('./release-delegate'));
App._registerDelegate('open', require('./open-delegate'));
App._registerDelegate('codeserver', require('./codeserver-delegate'));
App._registerDelegate('theia', require('./theia-delegate'));

App = Object.assign(App, require('./connect.js'));
App = Object.assign(App, require('./maven.js'));
App = Object.assign(App, require('./studio.js'));

App = Object.assign(App, require('../app/nuxeo-folder'));
App = Object.assign(App, require('../app/nuxeo-helper'));

module.exports = yeoman.extend(App);
