/*eslint strict:0*/
'use strict';

const _ = require('lodash');
const yeoman = require('yeoman-generator');
const welcome = require('./welcome.js')('Generator');
const path = require('path');
const Storage = require('yeoman-generator/lib/util/storage');

const RESTRICTED_PATTERN = ':restricted:';

const App = (defaultDelegate) => {
  const delegates = [];

  return {
    _getGlobalStorage: function () {
      // Override Yeoman global storage; use only the local one
      return this._getStorage();
    },

    /**
     * Create a proxy in order to route "restricted" properties to a different file for being able to split sensible properties from regular ones.
     *
     * Idea is to add .yo-rc.restricted.json file to git ignore
     */
    _getStorage: function () {
      const that = this;
      const storePath = path.join(this.destinationRoot(), '.yo-rc.json');
      return new Proxy(new Storage(this.rootGeneratorName(), this.fs, storePath), {
        get: (target, prop) => {
          if (prop === 'set') {
            return (key, val) => {
              if (key.indexOf(RESTRICTED_PATTERN) > -1) {
                return that._getRestrictedStorage().set(key, val);
              } else {
                return target.set(key, val);
              }
            };
          }

          if (prop === 'get') {
            return (key) => {
              if (key.indexOf(RESTRICTED_PATTERN) > -1) {
                return that._getRestrictedStorage().get(key);
              } else {
                return target.get(key);
              }
            };
          }

          return target[prop];
        }
      });
    },

    _getRestrictedStorage: function () {
      var storePath = path.join(this.destinationRoot(), '.yo-rc.restricted.json');
      return new Storage(this.rootGeneratorName(), this.fs, storePath);
    },

    _registerDelegate: function (delegateName, module) {
      delegates.push(delegateName);

      const newDelegate = {};
      newDelegate['_' + delegateName + 'Delegate'] = module;
      return Object.assign(this, newDelegate);
    },

    _cleanDelegate: function () {
      while (delegate.pop() !== undefined) {
        // continue...
      }
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
