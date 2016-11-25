/*eslint strict:0*/
'use strict';

let _ = require('lodash');
let yeoman = require('yeoman-generator');

var App = {
  _getGlobalStorage: function() {
    // Override Yeoman global storage; use only the local one
    return this._getStorage();
  },

  constructor: function() {
    yeoman.Base.apply(this, arguments);
    this.argument('delegateName', {
      desc: 'Define which action you want to do',
      Type: 'String',
      defaults: 'hotreload'
    });
  },

  initializing: function() {
    // Setting delegate following the pattern _${delegateName}Delegate
    this.delegate = this[`_${this.delegateName.toLowerCase()}Delegate`];
    delegate(this, 'initializing');
  },

  prompting: function() {
    delegate(this, 'prompting');
  },

  configuring: function() {
    delegate(this, 'configuring');
  },

  writing: function() {
    delegate(this, 'writing');
  },

  end: function() {
    delegate(this, 'end', () => {
      this.log.info('Thank you for using generator-nuxeo.');
    });
  }
};

function delegate(that, methodName, fallback) {
  if (that.delegate && that.delegate[methodName]) {
    that.delegate[methodName].apply(that);
  } else {
    if (fallback) {
      fallback.apply(that);
    }
  }
}

// Check dev.mode + template sdk
// nxserver/dev.bundles format:
// type:filepath
// type: bundle,library,seam,resourceBundleFragment

App = _.extend(App, require('./configure.js'));
App = _.extend(App, require('./configure-delegate.js'));
App = _.extend(App, require('./module.js'));
module.exports = yeoman.Base.extend(App);
