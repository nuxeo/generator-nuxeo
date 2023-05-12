const spinner = require('../../utils/spinner');
const chalk = require('chalk');
const Conflicter = require('../../utils/conflicter.js');

const delegate = {
  initializing: function() {
    this.conflicter = new Conflicter(this.env.adapter, (filename) => {
      return this.options.force || filename.match(/pom\.xml$/);
    });
  },

  welcome: function() {
    this.log.info('You are going to link a Studio project to this project.');
  },

  prompting: function () {
    const that = this;
    const done = that.async();

    return this.prompt([{
      type: 'input',
      name: 'username',
      message: 'NOS Username:',
      store: true,
      validate: (input) => {
        return input && input.length > 0 || 'Username is empty';
      }
    }, {
      type: 'password',
      name: 'password',
      message: 'NOS Token:',
      validate: (input, answers) => {
        if (!(input && input.length > 0)) {
          return 'Token is empty';
        }
        return spinner(() => {
          return that._generateToken(answers.username, input).then((token) => {
            return !!token || 'Unable to authenticate to NOS Server. Please make sure you use a token created at https://connect.nuxeo.com/nuxeo/site/connect/tokens';
          });
        });
      }
    }, {
      type: 'input',
      name: 'project',
      message: 'Studio Project:',
      default: that._getSymbolicName(),
      validate: (input) => {
        if (!(input && input.length > 0)) {
          return 'Studio Project is empty';
        }

        return spinner(() => {
          return that._isProjectAccessible(input).then((access) => {
            return access || 'Unknow project';
          });
        });
      }
    }, {
      type: 'confirm',
      name: 'settings',
      message: 'Do you want to update your Maven settings.xml file accordingly?',
      default: true,
      when: function() {
        return that._containsPom();
      }
    }])
      .then((answers) => {
        that._setSymbolicName(answers.project);
        that._saveSettingsAnswers(answers.settings, answers.settings_override);
        that._answers = answers;
        done();
      })
      .catch((e) => {
        that.log.error(e.message);
        done();
      });
  },

  writing: function () {
    if (!this._containsPom()) {
      return;
    }
    const done = this.async();
    if(!this.options.skipPomUpdate) {
      return spinner(() => {
        // Get full GAV from Studio API
        return this._getProjectMavenCoordonates().then(gav => {
          // Remove previous Studio project
          this._removeDependency();
    
          // Add test dependency to the root module and submodules
          this._addDependency(gav + '::test');
    
          //TODO Ensure package.xml file contains Studio reference
        });
      }).then(() => {
        if (this._canAddCredentials()) {
          this._addConnectCredentials(this._answers.username, this._answers.password);
        }
        done();
      });
    }

    if (this._canAddCredentials()) {
      this._addConnectCredentials(this._answers.username, this._answers.password);
    }
  },

  end: function() {
    if (this._answers.settings) {
      this.log.info(chalk.yellow('WARNING:'));
      this.log.info(`We modified '${chalk.blue(this._getSettingsPath())}' file and wrote your password in plain text inside.`);
      this.log.info(`You must read ${chalk.blue('https://maven.apache.org/guides/mini/guide-encryption.html')} and use an encrypted one.`);
    }
  }
};

module.exports = delegate;
