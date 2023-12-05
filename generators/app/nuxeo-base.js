const _ = require('lodash');

let base = {};
_.extend(base, require('./nuxeo-module.js'));
_.extend(base, require('./nuxeo-folder.js'));
_.extend(base, require('./nuxeo-helper.js'));
_.extend(base, require('./nuxeo-init-meta.js'));
_.extend(base, require('./nuxeo-version.js'));

module.exports = base;