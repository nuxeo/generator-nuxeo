const Generator = require('yeoman-generator');
const _ = require('lodash');
const path = require('path');
const pkg = require(path.join(path.dirname(__filename), '..', '..', 'package.json'));

let app = {};
app = _.extend(app, require('./nuxeo-module.js'));
app = _.extend(app, require('./nuxeo-folder.js'));
app = _.extend(app, require('./nuxeo-helper.js'));
app = _.extend(app, require('./nuxeo-init-meta.js'));
app = _.extend(app, require('./nuxeo-version.js'));
app = _.extend(Generator.prototype, app);

module.exports = class extends Generator {
  constructor(args, options) {
    super(args, options, app);
    this.usage = require('../../utils/usage');

    this.options.namespace = 'nuxeo [<generator>..]';
    this.option('meta', {
      type: String,
      alias: 'm',
      defaults: pkg.nuxeo.branch,
      desc: 'Branch of `nuxeo/generator-nuxeo-meta`'
    });
    this.option('localPath', {
      type: String,
      alias: 'l',
      desc: 'Path to a local clone of `nuxeo/generator-nuxeo-meta`'
    });
    this.option('nologo', {
      type: Boolean,
      alias: 'n',
      defaults: false,
      desc: 'Disable welcome logo'
    });
    this.option('type', {
      type: String,
      alias: 't',
      defaults: 'core',
      desc: 'Set module target\'s type'
    });
    this.option('skipInstall', {
      type: Boolean,
      alias: 's',
      defaults: false,
      desc: 'Skip external commands installation'
    });
    this.option('force', {
      type: Boolean,
      alias: 'f',
      defaults: false,
      desc: 'Force conflict when generate an existing file'
    });
    this.option('dirname', {
      type: String,
      alias: 'd',
      defaults: path.basename(this.destinationRoot()),
      desc: 'Set parent folder prefix name'
    });
  }
};
