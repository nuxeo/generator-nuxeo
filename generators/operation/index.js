'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var mkdirp = require('mkdirp');
var maven = require('../../maven.js');

module.exports = yeoman.generators.Base.extend({
  prompting: function() {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the ' + chalk.red('Nuxeo Operation') + ' generator!'
    ));

    var prompts = [{
      type: 'input',
      name: 'name',
      message: 'Operation name:',
      validate: function(value) {
        return value.length > 1 && value.match(/^[A-Z]/) !== null;
      }
    }, {
      type: 'input',
      name: 'package',
      message: 'Operation package:',
      validate: function(value) {
        return value.split('.').length > 1;
      }
    }, {
      type: 'input',
      name: 'label',
      message: 'Operation label:'
    }, {
      type: 'input',
      name: 'description',
      message: 'Operation description:'
    }];

    this.prompt(prompts, function(props) {
      this.props = props;
      // To access props later use this.props.someOption;

      done();
    }.bind(this));
  },

  writing: function() {
    var dir = 'src/main/java/' + this.props.package.replace(/\./g, '/');
    mkdirp.sync(dir);

    this.fs.copyTpl(
      this.templatePath('operation.java'),
      this.destinationPath(dir + '/' + this.props.name + '.java'),
      this.props
    );

    var mvn = maven.open();
    mvn.addDependency('org.nuxeo.ecm.automation', 'nuxeo-automation-core');
    mvn.save(this.fs);
  }
});
