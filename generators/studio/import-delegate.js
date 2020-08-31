const spinner = require('../../utils/spinner');
const chalk = require('chalk');
const _ = require('lodash');
const s = require('../../utils/nuxeo.string.js');
const path = require('path');

const delegate = {
  initializing: function () {
    this.targetFolder = this._getBaseFolderName('core');
    if (!this._containsPom(this.targetFolder)) {
      this.log.error(`Folder ${chalk.blue(this.targetFolder)} has to be initialized as a Maven project`);
      process.exit(2);
    }

    this._ensureStudioIsLinked();
  },

  welcome: function () {
    this.log.info('You are going to create a new Constant Class with Studio\'s related models.');
  },

  prompting: function () {
    const that = this;
    const done = that.async();

    return this.prompt([{
      type: 'input',
      name: 'studio:package',
      message: 'Constant package:',
      validate: (value) => {
        return value.split('.').length > 1 && !value.match(/\.{2,}/) && !value.match(/^\./) && !value.match(/\.$/) && !value.match(/[^\w.]/) ? true : 'Value must contain at least one "." char and no special chars.';
      },
      default: () => {
        const [group] = this._getMavenGav().split(':');
        // Suggest a correct package name for the default group id
        if (group === 'nuxeo-studio') {
          return 'com.nuxeo.studio';
        }
        return group.replace(/[\s-]+/g, '.').replace(/[^\w.]+/g, '_');
      },
      store: true
    }, {
      type: 'input',
      name: 'studio:constant',
      message: 'Constant class name:',
      default: 'StudioConstant',
      store: true,
      validate: (value) => {
        return value.length > 1 && value.match(/^[A-Z]/) !== null && !value.match(/[^\w]/) ? true : 'Class name must be in mixed case with the first letter of each internal word capitalized.';
      }
    }])
      .then(function (answers) {
        this.answers = answers;

        done();
      }.bind(this));
  },

  writing: function () {
    const res = spinner(() => {
      return this._getWorkspaceRegistries(undefined, this.options.exclude);
    });
    const name = this.answers['studio:constant'];
    const pkg = this.answers['studio:package'];
    const template = this.templatePath('StudioConstants.java.ejs');
    const symbolicName = this._getSymbolicName();

    // Compute Destination
    const args = [this.targetFolder, 'src', 'main', 'java'];
    Array.prototype.push.apply(args, pkg.split('.'));
    args.push(`${s.classify(name)}.java`);
    const dest = path.join.apply(path, args);

    this.fs.copyTpl(template, dest, {
      res,
      _,
      s,
      name,
      pkg,
      symbolicName
    });
  },

  end: function () {
    if (this.answers.unlink) {
      this.log.info('Your NOS account has been unlink.');
    }
  }
};

module.exports = delegate;
