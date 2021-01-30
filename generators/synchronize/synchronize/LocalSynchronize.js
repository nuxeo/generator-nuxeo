const chalk = require('chalk');
const debug = require('debug')('nuxeo:synchronize:local');
const fs = require('fs-extra');
const path = require('path');
const ActionTrigger = require('./ActionTrigger').ActionTrigger;

class LocalMkdirTrigger extends ActionTrigger {
  constructor(destination) {
    super();
    this.destination = destination;
    this.debug();
  }

  trigger() {
    this.logSync('Mkdir', 'magenta', this.displayDest);
    fs.mkdirpSync(this.destination);
  }
}

class LocalCopyTrigger extends ActionTrigger {
  constructor(source, destination) {
    super();
    this.source = source;
    this.destination = destination;
    this.debug();
  }

  trigger() {
    this.logSync('Copy', 'green', `${this.displaySrc} ${chalk.grey('->')} ${this.displayDest}`);

    const destinationDir = path.dirname(this.destination);
    if (!fs.pathExistsSync(destinationDir)) {
      debug('Missing Destination Dir, trigger MkdirTrigger');
      new LocalMkdirTrigger(destinationDir).trigger();
    }

    fs.copySync(this.source, this.destination);
  }
}

class LocalUnlinkTrigger extends ActionTrigger {
  constructor(destination) {
    super();
    this.destination = destination;
    this.debug();
  }

  trigger() {
    this.logSync('Delete', 'yellow', this.displayDest);
    fs.removeSync(this.destination);
  }
}

module.exports = {
  configured: function () {
    // Always returns true
    return true;
  },
  Triggers: {
    Copy: LocalCopyTrigger,
    Unlink: LocalUnlinkTrigger,
    Mkdirp: LocalMkdirTrigger
  }
};
