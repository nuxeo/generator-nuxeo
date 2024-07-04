/*eslint strict:0*/
'use strict';

const _ = require('lodash');
const Generator = require('yeoman-generator');
const welcome = require('./welcome.js')('Generator');

module.exports = class extends Generator {

    delegates = [];

    defaultDelegate;

    currentDelegate;

    constructor(args, options) {
      super(args, options);
      this.usage = require('../utils/usage');

      this._callFunc(this, '_beforeConstructor');

      this.argument('command', {
        desc: 'Available commands: ' + this.delegates.join(', '),
        type: String,
        default: this.defaultDelegate
      });

      this.option('nologo', {
        type: Boolean,
        alias: 'n',
        default: false,
        desc: 'Disable welcome logo'
      });

      this._callFunc(this, '_afterConstructor');
    }

    _getGlobalStorage() {
      // Override Yeoman global storage; use only the local one
      return this._getStorage();
    }

    _registerDelegate(delegateName, module) {
      this.delegates.push(delegateName);

      const newDelegate = {};
      newDelegate['_' + delegateName + 'Delegate'] = module;
      return Object.assign(this, newDelegate);
    }

    initializing() {
      if (this.usage.prototype.isYeoman(this.options)) {
        this.log(welcome);
      }

      // Setting delegate following the pattern _${delegateName}Delegate
      this.currentDelegate = this[`_${this.options.command.toLowerCase()}Delegate`];
      if (!this.currentDelegate) {
        this.log.error(`Unknown command: ${this.options.command}`);
        this.log(`Available commands: ${this.delegates.join(', ')}`);
        process.exit(2);
      }

      this._delegate(this, 'initializing');
      this._delegate(this, 'welcome');
    }

    prompting() {
      this._delegate(this, 'prompting');
    }

    configuring() {
      this._delegate(this, 'configuring');
    }

    writing() {
      this._delegate(this, 'writing');
    }

    end() {
      this._delegate(this, 'end', () => {
        this.log.info('Thank you.');
      });
    }

    /**
     * Try to execute `methodName` method on the `currentDelegate` field.
     * And call the fallback method in case the delegate is not handling the expected method.
     */
    _delegate(that, methodName, fallback) {
      this._callFunc(that, `_before${_.capitalize(methodName)}`);

      if (that.currentDelegate && that.currentDelegate[methodName] && typeof that.currentDelegate[methodName] === 'function') {
        that.currentDelegate[methodName].apply(that);
      } else {
        if (fallback) {
          fallback.apply(that);
        }
      }

      this._callFunc(that, `_after${_.capitalize(methodName)}`);
    }

    /**
     * Call a method if exists, and do nothing otherwise
     * @param {*} that
     * @param {*} methodName
     */
    _callFunc(that, methodName) {
      if (typeof that[methodName] === 'function') {
        that[methodName].apply(that);
      }
    }
};
