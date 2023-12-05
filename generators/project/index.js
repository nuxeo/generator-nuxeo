/*eslint strict:0*/
'use strict';

const _ = require('lodash');
const DelegateGenerator = require('../../lib/delegated-generator.js');

let App = {
  _beforeConstructor() {
    this._registerDelegate('status', require('./status-delegate'));
    this._registerDelegate('release', require('./release-delegate'));

    this.defaultDelegate = 'status';
  }
};

_.extend(App, require('../studio/maven.js'));
_.extend(App, require('./maven.js'));

_.extend(DelegateGenerator.prototype, App);

module.exports = DelegateGenerator;
