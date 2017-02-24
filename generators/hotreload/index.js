/*eslint strict:0*/
'use strict';

const _ = require('lodash');
const yeoman = require('yeoman-generator');

var App = {
  _getGlobalStorage: function() {
    // Override Yeoman global storage; use only the local one
    return this._getStorage();
  },

  constructor: function() {
    this.usage = require('../../utils/usage');
    yeoman.Base.apply(this, arguments);
    this.argument('delegateName', {
      desc: 'Define which action you want to do',
      Type: 'String',
      defaults: 'hotreload'
    });

    this.option('classesFolder', {
      desc: 'Define where is the classes folder under the module\'s one',
      Type: 'String',
      defaults: 'target/classes'
    });

    this.option('nologo', {
      type: Boolean,
      alias: 'n',
      defaults: false,
      desc: 'Disable welcome logo'
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
      this.log.info('Thank you.');
    });
  }
};

/**
 * Try to execute `methodName` method on the current `delegate` field.
 * And call the fallback method in case the delegate is not handling the expected method.
 */
function delegate(that, methodName, fallback) {
  if (that.delegate && that.delegate[methodName] && typeof that.delegate[methodName] === 'function') {
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
App = _.extend(App, require('./hotreload.js'));
App = _.extend(App, require('./hotreload-delegate.js'));
module.exports = yeoman.Base.extend(App);
