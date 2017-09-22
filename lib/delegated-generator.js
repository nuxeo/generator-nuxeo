/*eslint strict:0*/
'use strict';

const _ = require('lodash');
const yeoman = require('yeoman-generator');
const welcome = require('./welcome.js')('Generator');

const App = (defaultDelegate) => {
  const delegates = [];

  return {
    _getGlobalStorage: function () {
      // Override Yeoman global storage; use only the local one
      return this._getStorage();
    },

    _registerDelegate: function (delegateName, module) {
      delegates.push(delegateName);

      const newDelegate = {};
      newDelegate['_' + delegateName + 'Delegate'] = module;
      return Object.assign(this, newDelegate);
    },

    constructor: function () {
      this.usage = require('../utils/usage');
      yeoman.apply(this, arguments);

      callFunc(this, '_beforeConstructor');

      this.argument('command', {
        desc: 'Available commands: ' + delegates.join(', '),
        type: String,
        default: defaultDelegate
      });

      this.option('nologo', {
        type: Boolean,
        alias: 'n',
        default: false,
        desc: 'Disable welcome logo'
      });

      callFunc(this, '_afterConstructor');
    },

    initializing: function () {
      if (this.usage.prototype.isYeoman(this.options)) {
        this.log(welcome);
      }

      // Setting delegate following the pattern _${delegateName}Delegate
      this.delegate = this[`_${this.options.command.toLowerCase()}Delegate`];
      if (!this.delegate) {
        this.log.error(`Unknown command: ${this.options.command}`);
        this.log(`Available commands: ${delegates.join(', ')}`);
        process.exit(2);
      }

      delegate(this, 'initializing');
      delegate(this, 'welcome');
    },

    prompting: function () {
      delegate(this, 'prompting');
    },

    configuring: function () {
      delegate(this, 'configuring');
    },

    writing: function () {
      delegate(this, 'writing');
    },

    end: function () {
      delegate(this, 'end', () => {
        this.log.info('Thank you.');
      });
    }
  };
};

/**
 * Try to execute `methodName` method on the current `delegate` field.
 * And call the fallback method in case the delegate is not handling the expected method.
 */
function delegate(that, methodName, fallback) {
  callFunc(that, `_before${_.capitalize(methodName)}`);

  if (that.delegate && that.delegate[methodName] && typeof that.delegate[methodName] === 'function') {
    that.delegate[methodName].apply(that);
  } else {
    if (fallback) {
      fallback.apply(that);
    }
  }

  callFunc(that, `_after${_.capitalize(methodName)}`);
}

/**
 * Call a method if exists, and do nothing otherwise
 * @param {*} that
 * @param {*} methodName
 */
function callFunc(that, methodName) {
  if (typeof that[methodName] === 'function') {
    that[methodName].apply(that);
  }
}

module.exports = {
  withDefault: App
};
