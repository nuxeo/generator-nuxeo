const yeoman = require('yeoman-generator');

let App = {

};
App = Object.assign(App, require('../../../lib/delegated-generator').withDefault('test'));

App._registerDelegate('test', {
  // Nothing to declare, for now.
});

module.exports = yeoman.extend(App);
