/*eslint strict:0*/
'use strict';

const _ = require('lodash');
const DelegateGenerator = require('../../lib/delegated-generator.js');

let App = {
  _beforeConstructor() {
    this._registerDelegate('configure', require('./configure-delegate'));
    this._registerDelegate('hotreload', require('./hotreload-delegate'));

    this.defaultDelegate = 'hotreload';
  },

  _afterConstructor() {
    this.option('classesFolder', {
      desc: 'Define where is the classes folder under the module\'s one',
      type: String,
      default: 'target/classes'
    });
  }
};

_.extend(App, require('./configure.js'));
_.extend(App, require('./hotreload.js'));

_.extend(DelegateGenerator.prototype, App);

module.exports = DelegateGenerator;
