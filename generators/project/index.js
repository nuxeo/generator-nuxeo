/*eslint strict:0*/
'use strict';

const _ = require('lodash');
const yeoman = require('yeoman-generator');

var App = {};

App = _.extend(App, require('../../lib/delegated-generator.js').withDefault('status'));

App._registerDelegate('status', require('./status-delegate'));
App._registerDelegate('release', require('./release-delegate'));

App = Object.assign(App, require('../studio/maven.js'));
App = Object.assign(App, require('./maven.js'));

module.exports = yeoman.extend(App);
