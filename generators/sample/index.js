/*eslint strict:0*/
'use strict';

const async = require('async');
const yeoman = require('yeoman-generator');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const pkg = require(path.join(path.dirname(__filename), '..', '..', 'package.json'));

let App = {
  constructor: function() {
    this.usage = require('../../utils/usage');
    yeoman.apply(this, arguments);

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
    this.option('meta', {
      type: String,
      alias: 'm',
      defaults: pkg.nuxeo.branch,
      desc: 'Branch of `nuxeo/generator-nuxeo-meta`'
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

    const init = this._init(this.options);
    const done = this.async();
    const seq = async.seq(init.fetch, init.saveRemote, init.readSamples, init.saveSamples).bind(this);
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
        const repo = value.split(/\//);
        return {
          user: repo[0],
          repo: repo[1]
        };
      }
    }]).then((answers) => {
      repository = answers.repository;
      return this.prompt([{
        type: 'list',
        name: 'branch',
        defalut: 'master',
        message: 'Which release do you want?',
        choices: function() {
          return this._git.fetchReleases(answers.repository);
        }.bind(this)
      }]);
    }).then((answers) => {
      this.answers = _.extend(answers, {
        repository
      });
    });
  },

  writing: function() {
    const done = this.async();
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
module.exports = yeoman.extend(App);
