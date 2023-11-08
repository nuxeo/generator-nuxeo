const promptSuggestion = require('yeoman-generator/lib/util/prompt-suggestion');
const chalk = require('chalk');
const async = require('async');
const path = require('path');
const dargs = require('dargs');
const _ = require('lodash');
const fs = require('fs');
const mkdirp = require('mkdirp');
const nuxeo = require('./nuxeo-base.js');
const s = require('../../utils/nuxeo.string.js');
const maven = require('../../utils/maven.js');
const manifestmf = require('../../utils/manifestmf.js');
const propHolder = require('../../utils/property-holder.js');
const Conflicter = require('../../utils/conflicter.js');
const isBinaryFile = require('isbinaryfile').isBinaryFileSync;
const debug = require('debug')('nuxeo:app');

global.NUXEO_VERSIONS = require('../../utils/nuxeo-version-available');
global.VERSION_HELPER = require('../../utils/version-helper.js');
global.MODULES_HELPER = require('../../utils/modules-helper.js');

let obj = {
  _getGlobalStorage: function () {
    // Override Yeoman global storage; use only the local one
    return this._getStorage();
  },

  prompt: function (questions, callback) {
    if (!questions || !_.isArray(questions)) {
      return this;
    }

    const computedDefaultIndices = [];
    _.each(questions, function (question, index) {
      // Yeoman prompt do not store value if it's the same as the default one
      // As a workaround, if the default value is a function; we undefine it to make the store ok
      if (_.isFunction(question.default)) {
        computedDefaultIndices.push(index);
      }
    });
    questions = promptSuggestion.prefillQuestions(this._globalConfig, questions);
    this.env.adapter.prompt(questions, function (answers) {
      if (!this.options['skip-cache']) {
        // Reset computed default value to ensure the user input is stored
        _.each(computedDefaultIndices, function (index) {
          questions[index].default = undefined;
        });
        promptSuggestion.storeAnswers(this._globalConfig, questions, answers);
      }

      if (_.isFunction(callback)) {
        callback(answers);
      }
    }.bind(this));

    return this;
  },


  initializing: function () {
    const done = this.async();
    const init = this._init(this.options);

    this.conflicter = new Conflicter(this.env.adapter, (filename) => {
      return this.options.force || filename.match(/pom\.xml$/) || filename.match(/MANIFEST\.MF$/);
    });

    if (!(this.options.nologo || debug.enabled)) {
      this._showHello();
    }

    // Expose options in the global scope for accessing them in generator's decriptors.
    global._options = this.options;
    global._config = this.config;
    debug('%O', this.options);

    const seq = async.seq(init.fetch, init.saveRemote, init.readDescriptor, init.resolveModule, init.filterModulesPerType, init.saveModules).bind(this);
    seq(function (err) {
      if (err) {
        this.log.error(`Unable to get generators: ${err.message}`);
        debug('%O', err);
        process.exit(2);
      }
      done();
    });
  },

  prompting: function () {
    const done = this.async();
    const that = this;
    const types = this._moduleSortedKeys();

    this._showWelcome();
    that.props = {};

    if (this._createMultiModuleIsNeeded(types)) {
      // Disable log for this.
      const t = this.log.info;
      this.log.info = () => { };
      const module = this._init()._filterModules.call(this, ['multi-module']);
      this.log.info = t;

      if (!_.isEmpty(module)) {
        // Splice the root type if it's not there already
        if (types.findIndex((e) => e === 'root') === -1) {
          types.splice(0, 0, 'root');
        }
        this.nuxeo.selectedModules.root = module;
      }
    }

    async.eachSeries(types, (type, parentCb) => {
      const items = this.nuxeo.selectedModules[type];
      // Add type to a global value to be referenced in the metamodel
      global._scope = {
        type
      };

      if (type !== 'root') {
        this.log('');
        this.log.create(chalk.yellow('Generate Module: ' + this._resolveTypeFolderName(type)));
      }

      async.eachSeries(items, (item, callback) => {
        let params = that.nuxeo.modules[item].params || [];

        // Showing what will be prompted
        if (!_.isEmpty(params)) {
          params = propHolder.filter(params);

          that.log('');
          let txt = chalk.green('Generating ' + s.humanize(item));
          if (typeof that.nuxeo.modules[item].description === 'string') {
            txt += ' (' + that.nuxeo.modules[item].description + ')';
          }
          that.log.create(txt);
          // Show asked parameters
          const trimParams = [];
          _.forEach(params, function (p) {
            trimParams.push(s.humanize(s.trim(p.message.replace(/\(.+\)/, ''), '?\\s+:_-')));
          });
          that.log.info('  ' + chalk.blue('Parameters: ') + trimParams.join(', '));
        }

        // Prompting for tue
        that.prompt(params, function (props) {
          propHolder.store(params, props);
          that._findNuxeoVersion(props); // Resolve and Save Nuxeo Version
          that.props[type + item] = _.assign(propHolder.stored(), props);
          callback();
        });
      }, () => {
        parentCb();
      });
    }, () => {
      done();
    });

  },

  writing: function () {
    this._eachGenerator({
      title: 'Writing',
      func: (type, name, generator, cb) => {
        this._doWrite(type, name, generator, cb);
      },
    });
  },

  _doWrite: function (generatorType, item, generator, callback) {
    const that = this;
    const props = that.currentProps = that.props[generatorType + item] || {};

    debug(`Generating: ${item}`);

    that.currentGenerator = generator;

    // XXX Should be handled differently
    props.s = s; // String utils
    props.v = global.VERSION_HELPER.fromVersion(this._getNuxeoVersion()); // Version utils
    props.multi = that._isMultiModule();
    props.global = global;

    // handling configuration
    _.forEach(generator.config, function (value, key) {
      if (typeof value === 'function') {
        value = value.call(that);
      } else if (typeof value === 'string' && value.match(/{{.+}}/)) {
        value = that._tplPath(value, props);
      }
      that.config.set(key, value);
      that.log.create('Configuration: ' + key);
    });

    // XXX Might be handle a different way
    const manifestPath = path.join(that._getBaseFolderName(generatorType), 'src', 'main', 'resources', 'META-INF', 'MANIFEST.MF');
    let mf = manifestmf.open(manifestPath, that.fs);
    if (mf) {
      props.symbolicName = mf.symbolicName();
    }

    debug('Template Properties: %O', props);

    // handling templates
    const templateFolderName = typeof generator.getTemplatesFolder !== 'undefined' ? generator.getTemplatesFolder(props) : 'templates';
    const tmplPath = path.resolve(that.nuxeo.cachePath, 'generators', item, templateFolderName);
    const destPath = that._getBaseFolderName(generatorType);
    const ignorePatterns = generator['templates-ignore'] || [];
    if (fs.existsSync(tmplPath)) {
      _.forEach(that._recursivePath(tmplPath), function (template) {
        const dest = that._tplPath(template, props).replace(tmplPath, destPath);
        if (s.startsWith(path.basename(dest), '.empty')) {
          mkdirp(path.dirname(dest));
        } else if (isBinaryFile(template) || _(ignorePatterns).find(r => template.match(r))) {
          that.fs.copy(template, dest);
        } else {
          that.fs.copyTpl(template, dest, props, undefined, {
            globOptions: {
              // Documentation https://github.com/micromatch/micromatch#options
              // These options are needed to make it work correctly.
              // avoid braces transformation to group matching. ( ex: {{...}} => (?:{...}) )
              nobrace: true,
              // avoid parentheses transformation to group matching. ( ex: (...) => (?:...) )
              noext: true
            }
          });
        }
      });
    }

    _(generator['main-java']).filter(function (source) {
      return typeof source.when !== 'function' || source.when(props);
    }).forEach(function (source) {
      // XXX To be refactored
      const args = [that._getBaseFolderName(generatorType), 'src/main/java'];
      args.push(props.package.split('.'));
      args.push(that._tplPath(source.dest, props));
      const dest = path.join.apply(that, _.flatten(args));
      const src = path.join(that.nuxeo.cachePath, 'generators', item, 'classes', source.src);
      that.fs.copyTpl(src, dest, props);
    });

    _(generator['test-java']).filter(function (source) {
      return typeof source.when !== 'function' || source.when(props);
    }).forEach(function (source) {
      // XXX To be refactored
      const args = [that._getBaseFolderName(generatorType), 'src/test/java'];
      args.push(props.package.split('.'));
      args.push(that._tplPath(source.dest, props));
      const dest = path.join.apply(that, _.flatten(args));
      const src = path.join(that.nuxeo.cachePath, 'generators', item, 'classes', source.src);
      that.fs.copyTpl(src, dest, props);
    });

    // handling dependencies
    if (!_.isEmpty(generator.dependencies)) {
      const pomPath = path.join(that._getBaseFolderName(generatorType), 'pom.xml');
      const pom = maven.open(that.fs.read(pomPath));

      if (generator.dependencies === 'inherited') {
        that._addModulesDependencies(pom);
      } else {
        _.forEach(generator.dependencies, function (dependency) {
          that.log.info('Maven dependency: ' + dependency);
          pom.addDependency(dependency);
        });
      }

      pom.save(that.fs, pomPath);
    }

    const pomParentPath = path.join('.', 'pom.xml');
    const pomParent = maven.open(that.fs.read(pomParentPath));

    // handling parent properties
    if (!_.isEmpty(generator.properties)) {
      _.forEach(generator.properties, function (value, key) {
        if (_.isFunction(value)) {
          value = value.apply(this, [props]);
        }

        that.log.info('Pom property: ' + key + ': ' + value);
        pomParent.addProperty(value, key);
      });

      pomParent.save(that.fs, pomParentPath);
    }

    // handling parent plugins
    if (!_.isEmpty(generator.plugins)) {
      _.forEach(generator.plugins, function (plugin) {
        that.log.info('Maven plugin: ' + plugin.artifactId);
        pomParent.addPlugin(plugin);
      });

      pomParent.save(that.fs, pomParentPath);
    }

    // handling contributions
    _(generator.contributions).forEach(function (contribution) {
      if (!mf) {
        mf = manifestmf.open(manifestPath, that.fs);
        if (!mf) {
          throw 'MANIFEST.MF file is missing.';
        }
      }

      let src = typeof contribution.src === 'function' ? contribution.src.call(that, props) : contribution.src;
      src = path.resolve(that.nuxeo.cachePath, 'generators', item, 'contributions', that._tplPath(src, props));
      const contribName = typeof contribution.dest === 'function' ? contribution.dest.call(that, props) : contribution.dest;
      const dest = path.join(that._getBaseFolderName(generatorType), 'src', 'main', 'resources', 'OSGI-INF', that._tplPath(contribName, props));

      that.fs.copyTpl(src, dest, props);

      // Add contribution to the Manifest file
      const contribPath = 'OSGI-INF/' + that._tplPath(contribName, props);
      mf.addComponent(contribPath);
      mf.save();
    });

    if (typeof callback !== 'undefined') {
      callback();
    }
  },

  end: function () {
    this.log.create(chalk.green('Your project is ready!'));
    this.log.info(`You can start editing code or you can continue with calling another generator (${this.usage.prototype.resolvebinary(this.options)})`);
    this._eachGenerator({
      title: 'Messages from',
      ignore: (generator) => {
        // Filter generator without an install to do
        return !_.isFunction(generator.end);
      },
      func: (type, name, generator, cb) => {
        generator.end.apply(this, [cb]);
      },
    });
  },

  install: function () {
    const skip = this.options.skipInstall;
    this._eachGenerator({
      title: 'Installing',
      ignore: (generator) => {
        // Filter generator without an install to do
        return generator.install === undefined;
      },
      func: (type, name, generator, cb) => {
        if (skip) {
          this.log.info('Post install commands are disabled; you have to run them manually:');
        }

        let installs = generator.install;
        if (!_.isArray(installs)) {
          installs = [installs];
        }

        const cwd = process.cwd();
        _(installs).each(install => {
          process.chdir(cwd);

          let args = install.args || [];
          const opts = install.opts || {};

          args = args.concat(dargs(opts));
          const cmd = install.cmd + ' ' + args.join(' ');
          if (skip) {
            this.log.info('- ' + cmd);
          } else {
            this.log.info(install.cmd + ' ' + args.join(' '));
            process.chdir(path.join(cwd, this._getBaseFolderName(type)));
            this.spawnCommand(install.cmd, args);
          }
        });

        return cb();
      }
    });
  }
};

nuxeo.prototype = _.extend(nuxeo.prototype, obj);
module.exports = nuxeo;
