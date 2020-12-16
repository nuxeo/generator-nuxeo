const pathResolver = require('./path_resolver');
const truncate = pathResolver.truncate;
const debug = require('debug')('nuxeo:synchronize:actiontriggers');
const log = require('yeoman-environment/lib/util/log')();
const padr = require('pad-right');
const chalk = require('chalk');

class ActionTrigger {

  trigger() {
    debug('Not overrided method!');
  }

  debug() {
    debug('New action registered: %O', this);
  }

  get displaySrc() {
    return truncate(this.source);
  }

  get displayDest() {
    return truncate(this.destination);
  }

  get deploymentConfig() {
    return this.deploymentConfig;
  }

  logSync(verb, color, text) {
    log.info(`${chalk[color](padr(verb.toUpperCase(), 7, ' '))}: ${text}`);
  }
}

module.exports = {
  ActionTrigger: ActionTrigger
};
