/*eslint strict:0*/
'use strict';

const _ = require('lodash');
const yeoman = require('yeoman-generator');

let App = {
  _afterConstructor: function () {
    this.option('classesFolder', {
      desc: 'Define where is the classes folder under the module\'s one',
      type: String,
      default: 'target/classes'
    });
  }
};

App = _.extend(App, require('../../lib/delegated-generator.js').withDefault('hotreload'));

App._registerDelegate('configure', require('./configure-delegate'));
App._registerDelegate('hotreload', require('./hotreload-delegate'));

App = _.extend(App, require('./configure.js'));
App = _.extend(App, require('./hotreload.js'));

module.exports = yeoman.extend(App);
