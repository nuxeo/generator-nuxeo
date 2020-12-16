const chokidar = require('chokidar');
const debug = require('debug')('nuxeo:cli:sync');
const fs = require('fs-extra');
const path = require('path');
const minimatch = require('minimatch');
const pathResolver = require('./path_resolver');
const truncate = pathResolver.truncate;
const containsChild = require('./path_child_finder').containsChild;
const isArray = require('isarray');
const _ = require('lodash');
const padr = require('pad-right');
const chalk = require('chalk');
const log = require('yeoman-environment/lib/util/log')();
const {DEPLOYMENTS} = require('../../../utils/deployment-helper');

class Watcher {

  constructor(config = {}) {
    this.config = {
      dest: Watcher.normalizePath(config.dest || ''),
      src: Watcher.normalizePath(config.src || ''),
      pattern: config.pattern || Watcher.GLOB,
      deployment: config.deployment
    };
    this.watchers = {};
  }

  static normalizePath(opt) {
    if (isArray(opt)) {
      return _.map(opt, (o) => {
        return path.normalize(o);
      });
    } else {
      return path.normalize(opt);
    }
  }

  static get GLOB() {
    return '*.+(js|html|jpg|gif|svg|png|json|jsp)';
  }

  static coerce(opt) {
    let _opt = !isArray(opt) ? [opt] : opt;

    if (containsChild(_opt)) {
      throw new Error('The directories contain a child of one of the parent directories.');
    }

    _opt = _opt.map((o) => {
      fs.ensureDirSync(o);
      return path.resolve(o);
    });

    return _opt.length === 1 ? _opt[0] : _opt;
  }

  logWatcher(verb, color, text) {
    log.info(`${chalk[color](padr(verb.toUpperCase(), 7, ' '))}: ${text}`);
  }

  handledFile(event, filePath) {
    return !!event && (event.match(/Dir$/) || minimatch(path.basename(filePath), this.config.pattern, {
      nocase: true
    }));
  }

  initializeHandler() {
    return new Promise((accept, reject) => {
      if (this.config.deployment && this.config.deployment.type === DEPLOYMENTS.LOCAL) {
        this.synchronizeHandler = require('./LocalSynchronize.js');
        accept();
      } else if (this.config.deployment && this.config.deployment.type === DEPLOYMENTS.COMPOSE) {
        this.synchronizeHandler = require('./ComposeSynchronize.js');
        // Fetch the container id to avoid doing it for each actions
        this.synchronizeHandler.getContainerId(this.config.deployment.config.serviceName).then((containerId) => {
           // Store it in the deployment configuration
           this.config.deployment.config.containerId = containerId;
           accept();
        }).catch((err) => {
          log.error(err);
          reject();
        });
      } else {
        log.error('Deployment not properly configured');
        reject();
      }
    });
  }

  configured() {
    return this.synchronizeHandler.configured(this.config.deployment);
  }

  startMainWatcher() {
    this.watchers.main = chokidar.watch(this.config.src, {
      awaitWriteFinish: true
    });

    this.watchers.main.on('all', function (event, filePath) { //function needed to access arguments.
      debug('%O', arguments);
      if (!this.handledFile(event, filePath)) {
        debug(`Unhandled event "${event}" or file "${filePath}"`);
        return;
      }
      this.triggerAction(event, filePath);
    }.bind(this));
  }

  restartMainWatcher() {
    this.watchers.main.close();
    delete this.watchers.main;

    this.startMainWatcher();
  }

  startServerRestartWatcher(lookupFile = path.join('nxserver', 'nuxeo.war', 'WEB-INF', 'dev')) {
    const dp = pathResolver.findBaseDistributionPath(this.config.dest);
    if (!dp) {
      return;
    }

    const fp = path.join(dp, lookupFile);
    if (!fs.pathExistsSync(fp)) {
      this.logWatcher('Warn', 'yellow', `You should enable the '${chalk.blue('sdk')}' template in order to detect server's restart to start a new synchronization automatically.`);
      return;
    }

    this.logWatcher('Info', 'blue', 'Nuxeo Server restart watcher enabled.');
    this.watchers.server = chokidar.watch(fp, {
      ignored: '**/dev/*',
      ignoreInitial: true
    });
    this.watchers.server.on('all', () => {
      this.logWatcher('Restart', 'red', `Server has been restarted. Reinitialise Synchronization from: ${chalk.blue(this.config.src)}`);
      this.restartMainWatcher();
    });
  }

  resolveAction(event, filePath) {
    // unlink, unlinkDir
    if (event.startsWith('unlink')) {
      return new this.synchronizeHandler.Triggers.Unlink(this.computeDestination(filePath), this.config);
    } else
    if (['change', 'add'].indexOf(event) >= 0) {
      return new this.synchronizeHandler.Triggers.Copy(filePath, this.computeDestination(filePath), this.config);
    } else
    if (event === 'addDir') {
      return new this.synchronizeHandler.Triggers.Mkdirp(this.computeDestination(filePath), this.config);
    } else {
      debug(`Unhandled event: ${event}`);
    }

    return undefined;
  }

  triggerAction(event, filePath) {
    const a = this.resolveAction(event, filePath);
    if (a) {
      a.trigger();
    }
  }

  computeDestination(source) {
    const src = isArray(this.config.src) ? _.find(this.config.src, (f) => {
      return path.join(source, path.sep).startsWith(path.join(f, path.sep));
    }) : this.config.src;

    return path.join(this.config.dest, source.replace(src, ''));
  }

  run() {
    setTimeout(() => {
      // Delayed to 5ms, to free the thread to print the logo before any other log
      log.info(`Waiting changes from "${chalk.blue(truncate(this.config.src))}", to "${chalk.blue(truncate(this.config.dest))}"`);

      this.startMainWatcher();
      // this.startServerRestartWatcher();
    }, 5);
  }
}

module.exports = {
  Watcher: Watcher
};