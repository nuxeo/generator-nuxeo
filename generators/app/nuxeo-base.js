var yeoman = require('yeoman-generator');
var _ = require('lodash');

var app = {};
app = _.extend(app, require('./nuxeo-module.js'));
app = _.extend(app, require('./nuxeo-folder.js'));
app = _.extend(app, require('./nuxeo-helper.js'));
app = _.extend(app, require('./nuxeo-init-meta.js'));
app = _.extend(app, require('./nuxeo-version.js'));

module.exports = yeoman.extend(app);
