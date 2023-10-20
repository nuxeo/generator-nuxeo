const Generator = require('yeoman-generator');
const _ = require('lodash');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    // Extend the generator prototype with the methods from other modules
    _.extend(this, require('./nuxeo-module.js'));
    _.extend(this, require('./nuxeo-folder.js'));
    _.extend(this, require('./nuxeo-helper.js'));
    _.extend(this, require('./nuxeo-init-meta.js'));
    _.extend(this, require('./nuxeo-version.js'));
  }

  // Your generator code goes here
};