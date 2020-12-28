const path = require('path');
const chalk = require('chalk');

const {DEPLOYMENTS} = require('../../utils/deployment-helper');

const delegate = {
  initializing: function () {
    this.log.info(chalk.green('You\'ll be prompted for setting a target Nuxeo Server to trigger hot reload.'));
  },

  prompting: function () {
    let done = this.async();

    return this.prompt([{
      type: 'list',
      name: 'deployment',
      message: 'Nuxeo server deployment:',
      store: true,
      choices: [{
        name: DEPLOYMENTS.LOCAL
      }, {
        name: DEPLOYMENTS.COMPOSE
      }]
    }, {
      type: 'input', name: 'distributionPath', message: 'Nuxeo Server path:', validate: (input) => {
        return input && this._isDistributionPath(input) || 'Server path must be absolute, and contain a Nuxeo Server Distribution';
      }, default: this._getDistributionPath(),
      when: (answers) => {
        return answers.deployment === DEPLOYMENTS.LOCAL;
      }
    }, {
      type: 'input',
      name: 'serviceName', message: 'Name of the Docker compose service for the Nuxeo server:',
      default: `${path.basename(this.destinationRoot())}_nuxeo_1`,
      store: true,
      when: (answers) => {
        return answers.deployment === DEPLOYMENTS.COMPOSE;
      }
    }, {
      type: 'checkbox',
      name: 'ignoredModules',
      message: 'Ignore selected modules:',
      choices: this._modulesToChoices(this._listModules()),
      store: true
    }]).then((answers) => {
      this._saveIgnoredModules(answers.ignoredModules);
      this._saveDeployment(answers.deployment, {
        serviceName: answers.serviceName
      });

      // If not local, nothing to do.
      // XXX Move this writing to a local dedicated writer.
      if (this._getDeployment() !== DEPLOYMENTS.LOCAL) {
        done();
        return;
      }

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

  writing: function () {
    if (this._getDeployment() !== DEPLOYMENTS.LOCAL) {
      return;
    }

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

module.exports = delegate;
