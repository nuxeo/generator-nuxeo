/*eslint strict:0*/
'use strict';

var yeoman = require('yeoman-generator');
// var _ = require('lodash');

var watch = {
  prompting: function() {
    this.log.info('watch');
  }
};

var App = {
  _getGlobalStorage: function() {
    // Override Yeoman global storage; use only the local one
    return this._getStorage();
  },

  initializing: function() {
    watch.prompting();
    // this.composeWith('my-generator:turbo');
  },

  end: function() {
    this.log.info(`This is the end ${true}.`);
  }
};

// var configure = {
//   prompting: function() {
//     this.log.info('configure');
//   }
// };

module.exports = yeoman.Base.extend(App);
