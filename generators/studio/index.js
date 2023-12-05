const chalk = require('chalk');
const _ = require('lodash');
const DelegateGenerator = require('../../lib/delegated-generator.js');

let App = {
  _beforeConstructor() {
    this._registerDelegate('link', require('./link-delegate'));
    this._registerDelegate('unlink', require('./unlink-delegate'));
    this._registerDelegate('import', require('./import-delegate'));
    this._registerDelegate('export', require('./export-delegate'));
    this._registerDelegate('release', require('./release-delegate'));

    this.defaultDelegate = 'link';

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
  },

  _beforeInitializing() {
    const url = this.options.connectUrl;
    if (this._isNewConnectUrl(url)) {
      this.log.info('New Connect URL saved: ' + chalk.blue(url));
      this._setConnectUrl(url);
    }
  }

};

_.extend(App, require('./connect.js'));
_.extend(App, require('./maven.js'));
_.extend(App, require('./studio.js'));

_.extend(App, require('../app/nuxeo-folder'));
_.extend(App, require('../app/nuxeo-helper'));

_.extend(DelegateGenerator.prototype, App);

module.exports = DelegateGenerator;
