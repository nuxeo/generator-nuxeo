const Generator = require('yeoman-generator');
const _ = require('lodash');

let app = {};
app = _.extend(app, require('./nuxeo-module.js'));
app = _.extend(app, require('./nuxeo-folder.js'));
app = _.extend(app, require('./nuxeo-helper.js'));
app = _.extend(app, require('./nuxeo-init-meta.js'));
app = _.extend(app, require('./nuxeo-version.js'));

module.exports = Object.assign(class extends Generator {}, app);
