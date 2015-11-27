'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var mkdirp = require('mkdirp');

module.exports = yeoman.generators.Base.extend({
  prompting: function() {
    var done = this.async();
    this.log(yosay(
      'Welcome to the ' + chalk.red('Nuxeo Bundle') + ' generator!'
    ));

    var prompts = [{
      type: 'input',
      name: 'name',
      message: 'Bundle name:',
      store: true,
      validate: function(value) {
        return value.length > 0;
      }
    }, {
      type: 'input',
      name: 'package',
      message: 'Bundle package:',
      default: 'org.nuxeo.addon',
      store: true,
      validate: function(value) {
        return value.split('.').length > 0;
      }
    }, {
      type: 'input',
      name: 'version',
      message: 'Bundle version:',
      default: '1.0-SNAPSHOT'
    }, {
      type: 'input',
      name: 'artifact',
      message: 'Artifact id:',
      validate: function(value) {
        return value.length > 0;
      }
    }, {
      type: 'input',
      name: 'description',
      message: 'Description :'
    }, {
      type: 'input',
      name: 'nuxeo_version',
      message: 'Nuxeo Version:',
      default: '8.1-SNAPSHOT'
    }];

    this.prompt(prompts, function(props) {
      this.props = props;
      // To access props later use this.props.someOption;

      done();
    }.bind(this));
  },

  writing: function() {
    this.log('   ' + chalk.green('create') + ' Maven directory layout');
    mkdirp.sync('src/main/java/' + this.props.package.replace(/\./g, '/'));
    mkdirp.sync('src/main/resources/META-INF');
    mkdirp.sync('src/main/resources/OSGI-INF');

    mkdirp.sync('src/test/java/' + this.props.package.replace(/\./g, '/'));
    mkdirp.sync('src/test/resources/OSGI-INF');

    this.fs.copyTpl(
      this.templatePath('MANIFEST.MF'),
      this.destinationPath('src/main/resources/META-INF/MANIFEST.MF'),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath('pom.xml'),
      this.destinationPath('pom.xml'),
      this.props
    );
  }
});
