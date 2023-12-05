/*eslint strict:0*/
'use strict';

const _ = require('lodash');
const DelegateGenerator = require('../../lib/delegated-generator.js');

let App = {
  _beforeConstructor() {
    this._registerDelegate('configure', require('./configure-delegate'));
    this._registerDelegate('synchronize', require('./synchronize-delegate'));

    this.defaultDelegate = 'synchronize';
  }
};

_.extend(App, require('./configure.js'));
_.extend(App, require('../app/nuxeo-helper'));

_.extend(DelegateGenerator.prototype, App);

module.exports = DelegateGenerator;
