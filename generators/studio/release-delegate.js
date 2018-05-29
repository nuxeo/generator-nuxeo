const spinner = require('../../utils/spinner');
const chalk = require('chalk');

const delegate = {

  initializing() {
    if (!(this._getSymbolicName() && this._getToken())) {
      this.log.error('No Studio Project linked.');
      this.log.error(`Run: ${this.usage.prototype.resolvebinary(this.options)} first.`);
      process.exit(1);
    }
  },

  welcome() {
    this.log.info('You are going to release a Studio project attached to this project.');
  },

  prompting() {
    const that = this;
    const done = that.async();

    return this.prompt([{
      type: 'input',
      name: 'branch',
      message: 'Branch to release:',
      store: true,
      default: 'master',
      validate: function (input) {
        return input && input.length > 0 || 'Branch is empty';
      },
    }, {
      type: 'list',
      name: 'version',
      message: 'Version to release:',
      store: true,
      choices: ['MAJOR', 'MINOR', 'PATCH'],
    }]).then((answers) => {
      this.answers = answers;
      done();
    });
  },

  writing() {
    const params = {
      json: {
        revision: `${this.answers.branch}`,
        versionName: `${this.answers.version}`,
      },
    };
    const res = this._releaseStudioProject(params);
    if (res.statusCode === 409) {
      this.log.error(chalk.red('FAILURE'));
      this.log.error('The version already exists: you should update the MAJOR version this time.');
      this.error = true;
      return;
    }
    if (!res.statusCode === 200) {
      throw new Error(res);
    }
    const response = JSON.parse(res.getBody('utf8'));
    const version = response.version;

    // Get full GAV from Studio API
    const gav = spinner(() => {
      return this._getProjectMavenCoordonates();
    });

    // Update Studio version in pom parent
    this._updateVersion(gav, version);
    this.version = version;
  },

  end() {
    if(!this.error) {
      this.log.info(chalk.green('SUCCESS'));
      this.log.info(`We released a new version ${this.version} of your Studio project and updated your mvn deps accordingly.`);
    }
  },
};

module.exports = delegate;
