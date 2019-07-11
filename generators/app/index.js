var yeoman = require('yeoman-generator');
var promptSuggestion = require('yeoman-generator/lib/util/prompt-suggestion');
var chalk = require('chalk');
var async = require('async');
var path = require('path');
var dargs = require('dargs');
var _ = require('lodash');
var fs = require('fs');
var mkdirp = require('mkdirp');
var nuxeo = require('./nuxeo-base.js');
var s = require('../../utils/nuxeo.string.js');
var v = require('../../utils/version-helper.js');
var maven = require('../../utils/maven.js');
var manifestmf = require('../../utils/manifestmf.js');
var propHolder = require('../../utils/property-holder.js');
var Conflicter = require('../../utils/conflicter.js');
var isBinaryFile = require('isbinaryfile').isBinaryFileSync;
var pkg = require(path.join(path.dirname(__filename), '..', '..', 'package.json'));
const debug = require('debug')('nuxeo:app');

global.NUXEO_VERSIONS = require('../../utils/nuxeo-version-available');

module.exports = nuxeo.extend({
  _getGlobalStorage: function () {
    // Override Yeoman global storage; use only the local one
    return this._getStorage();
  },

  prompt: function (questions, callback) {
    if (!questions || !_.isArray(questions)) {
      return this;
    }

    var computedDefaultIndices = [];
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

  constructor: function () {
    this.usage = require('../../utils/usage');
    yeoman.apply(this, arguments);

    this.options.namespace = 'nuxeo [<generator>..]';
    this.option('meta', {
      type: String,
      alias: 'm',
      defaults: pkg.nuxeo.branch,
      desc: 'Branch of `nuxeo/generator-nuxeo-meta`'
    });
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
    this.option('type', {
      type: String,
      alias: 't',
      defaults: 'core',
      desc: 'Set module target\'s type'
    });
    this.option('skipInstall', {
      type: Boolean,
      alias: 's',
      defaults: false,
      desc: 'Skip external commands installation'
    });
    this.option('force', {
      type: Boolean,
      alias: 'f',
      defaults: false,
      desc: 'Force conflict when generate an existing file'
    });
    this.option('dirname', {
      type: String,
      alias: 'd',
      defaults: path.basename(this.destinationRoot()),
      desc: 'Set parent folder prefix name'
    });
  },

  initializing: function () {
    var done = this.async();
    var init = this._init(this.options);

    this.conflicter = new Conflicter(this.env.adapter, (filename) => {
      return this.options.force || filename.match(/pom\.xml$/) || filename.match(/MANIFEST\.MF$/);
    });

    if (!(this.options.nologo || debug.enabled)) {
      this._showHello();
    }

    // Expose options in the global scope for accessing them in generator's decriptors.
    global._options = this.options;
    debug('%O', this.options);

    var seq = async.seq(init.fetch, init.saveRemote, init.readDescriptor, init.resolveModule, init.filterModulesPerType, init.saveModules).bind(this);
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
    var done = this.async();
    var that = this;
    var types = this._moduleSortedKeys();

    this._showWelcome();
    that.props = {};

    if (this._createMultiModuleIsNeeded(types)) {
      // Disable log for this.
      var t = this.log.info;
      this.log.info = () => { };
      var module = this._init()._filterModules.call(this, ['multi-module']);
      this.log.info = t;

      if (!_.isEmpty(module)) {
        types.splice(0, 0, 'root');
        this.nuxeo.selectedModules.root = module;
      }
    }

    async.eachSeries(types, (type, parentCb) => {
      var items = this.nuxeo.selectedModules[type];
      // Add type to a global value to be referenced in the metamodele
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
          var txt = chalk.green('Generating ' + s.humanize(item));
          if (typeof that.nuxeo.modules[item].description === 'string') {
            txt += ' (' + that.nuxeo.modules[item].description + ')';
          }
          that.log.create(txt);
          // Show asked parameters
          var trimParams = [];
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
    debug('%O', props);

    that.currentGenerator = generator;

    // XXX Should be handled differently
    props.s = s; // String utils
    props.v = v.fromVersion(this._getNuxeoVersion()); // Version utils
    props.multi = that._isMultiModule();

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
    var manifestPath = path.join(that._getBaseFolderName(generatorType), 'src', 'main', 'resources', 'META-INF', 'MANIFEST.MF');
    var mf = manifestmf.open(manifestPath, that.fs);
    if (mf) {
      props.symbolicName = mf.symbolicName();
    }

    // handling templates
    var tmplPath = path.resolve(that.nuxeo.cachePath, 'generators', item, 'templates');
    var destPath = that._getBaseFolderName(generatorType);
    var ignorePatterns = generator['templates-ignore'] || [];
    if (fs.existsSync(tmplPath)) {
      _.forEach(that._recursivePath(tmplPath), function (template) {
        var dest = that._tplPath(template, props).replace(tmplPath, destPath);
        if (s.startsWith(path.basename(dest), '.empty')) {
          mkdirp(path.dirname(dest));
        } else if (isBinaryFile(template) || _(ignorePatterns).find(r => template.match(r))) {
          that.fs.copy(template, dest);
        } else {
          that.fs.copyTpl(template, dest, props);
        }
      });
    }

    _(generator['main-java']).filter(function (source) {
      return typeof source.when !== 'function' || source.when(props);
    }).forEach(function (source) {
      // XXX To be refactored
      var args = [that._getBaseFolderName(generatorType), 'src/main/java'];
      args.push(props.package.split('.'));
      args.push(that._tplPath(source.dest, props));
      var dest = path.join.apply(that, _.flatten(args));
      var src = path.join(that.nuxeo.cachePath, 'generators', item, 'classes', source.src);
      that.fs.copyTpl(src, dest, props);
    });

    _(generator['test-java']).filter(function (source) {
      return typeof source.when !== 'function' || source.when(props);
    }).forEach(function (source) {
      // XXX To be refactored
      var args = [that._getBaseFolderName(generatorType), 'src/test/java'];
      args.push(props.package.split('.'));
      args.push(that._tplPath(source.dest, props));
      var dest = path.join.apply(that, _.flatten(args));
      var src = path.join(that.nuxeo.cachePath, 'generators', item, 'classes', source.src);
      that.fs.copyTpl(src, dest, props);
    });

    // handling dependencies
    if (!_.isEmpty(generator.dependencies)) {
      var pomPath = path.join(that._getBaseFolderName(generatorType), 'pom.xml');
      var pom = maven.open(that.fs.read(pomPath));

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

    var pomParentPath = path.join('.', 'pom.xml');
    var pomParent = maven.open(that.fs.read(pomParentPath));

    // handling parent properties
    if (!_.isEmpty(generator.properties)) {
      _.forEach(generator.properties, function (value, key) {
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

      var src = typeof contribution.src === 'function' ? contribution.src.call(that, props) : contribution.src;
      src = path.resolve(that.nuxeo.cachePath, 'generators', item, 'contributions', that._tplPath(src, props));
      var contribName = typeof contribution.dest === 'function' ? contribution.dest.call(that, props) : contribution.dest;
      var dest = path.join(that._getBaseFolderName(generatorType), 'src', 'main', 'resources', 'OSGI-INF', that._tplPath(contribName, props));

      that.fs.copyTpl(src, dest, props);

      // Add contribution to the Manifest file
      var contribPath = 'OSGI-INF/' + that._tplPath(contribName, props);
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
  },

  install: function () {
    var skip = this.options.skipInstall;
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

        var installs = generator.install;
        if (!_.isArray(installs)) {
          installs = [installs];
        }

        var cwd = process.cwd();
        _(installs).each(install => {
          process.chdir(cwd);

          var args = install.args || [];
          var opts = install.opts || {};

          args = args.concat(dargs(opts));
          var cmd = install.cmd + ' ' + args.join(' ');
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
});
