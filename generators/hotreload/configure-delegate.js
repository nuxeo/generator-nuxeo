const chalk = require('chalk');
const isDocker = require('is-docker');
const welcome = require('../../utils/welcome.js');

const delegate = {
  initializing: function() {
    if (!this.options.nologo) {
      this.log(welcome);
    }

    this.log.info(chalk.green('You\'ll be prompted for setting a target Nuxeo Server to trigger hot reload.'));
  },

  prompting: function() {
    let done = this.async();
    return this.prompt([{
      type: 'input',
      name: 'distributionPath',
      message: 'Nuxeo Server path:',
      when: () => {
        return !isDocker();
      },
      validate: (input) => {
        return input && this._isDistributionPath(input) || 'Server path must be absolute, and contain a Nuxeo Server Distribution';
      },
      default: this._getDistributionPath()
    }]).then((answers) => {
      this._saveDistributionPath(answers.distributionPath);
      // If Nuxeo Server is not configured; ask user to configure it automatically
      if (!this._isDistributionConfigured()) {
        return this.prompt([{
          type: 'confirm',
          name: 'configure',
          message: 'Do you want to configure your nuxeo.conf?'
        }]).then((answersConfigure) => {
          this.addSdk = answersConfigure.configure;
          done();
        });
      } else {
        done();
      }
    });
  },

  writing: function() {
    if (this.addSdk) {
      this.log.info(`Configuring Nuxeo Server: ${this._getDistributionPath()}...`);
      this._configureDistribution();
    }

    if (this._isDistributionConfigured() || this.addSdk) {
      this.log.ok(`Nuxeo Server (${this._getDistributionPath()}) is already configured for hot reload.`);
    } else {
      this.log.error(`Nuxeo Server (${this._getDistributionPath()}) needs the sdk template.`);
    }
  }
};

module.exports = {
  _configureDelegate: delegate
};
