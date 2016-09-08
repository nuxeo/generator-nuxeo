var async = require('async');
var yeoman = require('yeoman-generator');
var fs = require('fs');
var _ = require('lodash');

var App = {
  constructor: function() {
    yeoman.Base.apply(this, arguments);

    this.option('localPath', {
      type: String,
      alias: 'l',
      desc: 'Path to a local clone of `nuxeo/generator-nuxeo-meta`'
    });
    this.option('nologo', {
      type: Boolean,
      alias: 'n',
      defaults: false,
      desc: 'Disable welcome logo'
    });
  },

  initializing: function() {
    if (fs.existsSync('pom.xml')) {
      this.log.error('Can\'t clone a sample on an existing project folder.');
      throw new Error('Existing pom.xml file.');
    }

    require('dns').resolve('www.github.com', (errco) => {
      if (errco) {
        this.log.error('Connection offline; unable to clone a sample project.');
        throw new Error('Github not reachable.');
      }
    });

    if (!this.options.nologo) {
      this._showHello();
    }

    var init = this._init(this.options);
    var done = this.async();
    var seq = async.seq(init.fetch, init.saveRemote, init.readSamples, init.saveSamples).bind(this);
    seq(function() {
      done();
    });
  },

  prompting: function() {
    // Prompting for Sample to clone, and passing answers to prompt wich branch to clone
    let repository;
    return this.prompt([{
      type: 'list',
      name: 'repository',
      message: 'Which sample do you want?',
      choices: this.nuxeo.samples,
      filter: function(value) {
        var [user, repo] = value.split(/\//);
        return {user, repo};
      }
    }]).then((answers) => {
      repository = answers.repository;
      return this.prompt([{
        type: 'list',
        name: 'branch',
        defalut: 'master',
        message: 'Which branch do you want?',
        choices: function() {
          return this._git.fetchBranches(answers.repository);
        }.bind(this)
      }]);
    }).then((answers) => {
      this.answers = _.extend(answers, {repository});
    });
  },

  writing: function() {
    var done = this.async();
    this._git.clone(this.answers, (err, cachePath) => {
      if (err) {
        throw err;
      }

      this.fs.copy(
        cachePath,
        this._computeDestinationPath()
      );
      done();
    });
  },

  _computeDestinationPath: function() {
    return `${this.answers.repository.repo}-${this.answers.branch}`;
  },

  end: function() {
    this.log.info(`You can start running the sample in ${this._computeDestinationPath()}`);
  }
};

App = _.extend(App, require('./github-provider.js'));
App = _.extend(App, require('../app/nuxeo-init-meta.js'));
App = _.extend(App, require('../app/nuxeo-helper.js'));
module.exports = yeoman.Base.extend(App);
