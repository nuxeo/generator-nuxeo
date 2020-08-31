const open = require('open');
const util = require('util');

const STUDIO_URL = '%s/site/studio/ide?project=%s';

const delegate = {
  initializing() {
    this._ensureStudioIsLinked();
  },

  end() {
    open(util.format(STUDIO_URL, this._getConnectUrl(), this._getSymbolicName()));
    this.log.info('Your Studio project is opening...');
  },
};

module.exports = delegate;
