/*eslint strict:0*/
'use strict';

const _ = require('lodash');
const yeoman = require('yeoman-generator');

let App = {};

App = _.extend(App, require('../../lib/delegated-generator.js').withDefault('synchronize'));

App._registerDelegate('configure', require('./configure-delegate'));
App._registerDelegate('synchronize', require('./synchronize-delegate'));

App = _.extend(App, require('./configure.js'));
App = _.extend(App, require('../app/nuxeo-helper'));

module.exports = yeoman.extend(App);
