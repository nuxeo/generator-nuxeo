const docker = require('../../utils/docker-spawner');
const ora = require('ora');
const path = require('path');
const open = require('open');
const rp = require('child_process');
const chalk = require('chalk');
const mvn = require('../../utils/maven-settings');

const delegate = {
  initializing() {
    this._ensureStudioIsLinked();

    if (!this._hasConnectCredentials()) {
      this.log.error(`You need to re-execute ${chalk.blue(this.usage.prototype.resolvebinary(this.options) + ' link')} for using this feature.`);
      process.exit(1);
    }
  },

  prompting() {
    const that = this;
    const done = that.async();

    return this.prompt([{
      type: 'input',
      name: 'git_username',
      message: 'Git Username:',
      store: true,
      default: rp.execSync('git config user.name').toString().trim(),
      validate: function (input) {
        return input && input.length > 0 || 'Username is empty';
      },
    }, {
      type: 'input',
      name: 'git_email',
      message: 'Git Email:',
      store: true,
      default: rp.execSync('git config user.email').toString().trim(),
      validate: function (input) {
        return input && input.length > 0 || 'Email is empty';
      },
    }]).then((answers) => {
      this.answers = answers;
      done();
    });
  },

  end() {
    const done = this.async();

    const spinner = ora('Starting Code-Server IDE...').start();
    const { username, token } = this._getConnectCredentials();
    const root = this.destinationRoot();
    const folder = path.basename(this.destinationRoot());

    docker.run(this, {
      envs: [
        {
          key: 'PROJECT',
          value: this._getSymbolicName(),
        },
        {
          key: 'USERNAME',
          value: username,
        },
        {
          key: 'TOKEN',
          value: token,
        },
        {
          key: 'CONNECT',
          value: this._getConnectUrl()
        },
        {
          key: 'GIT_USER_NAME',
          value: this.answers.git_username
        },
        {
          key: 'GIT_USER_EMAIL',
          value: this.answers.git_email
        },
        {
          key: 'GIT_SSL_NO_VERIFY',
          value: 1
        }
      ],
      volumes: [`${root}:/home/coder/project/${folder}`, `${mvn.locateLocalRepository()}:/home/coder/.m2/repository`],
      mounts: [`type=volume,source=nuxeocli-studio-${folder},target=/home/coder/.local/share/code-server/User`],
      image: 'akervern/project-code-server:latest',
      ports: [`${this.options.port}:8080`],
      onData: (line) => {
        if (line.match(/HTTP server listening on http:\/\/0.0.0.0:8080/)) {
          spinner.succeed(`Started. Code-Server IDE available at: http://0.0.0.0:${this.options.port}`);
          open(`http://0.0.0.0:${this.options.port}`);
        }
      }
    }).then(() => {
      done();
    }).catch((code) => {
      spinner.fail(`Error: ${code}`);
      this.log.error('Enable debug logs with: `DEBUG=nuxeo:generator:studio:docker` environment variable.')
      process.exit(code);
    });
  },
};

module.exports = delegate;
