module.exports = (() => {
  const uuidv5 = require('uuid/v5');

  try {
    return uuidv5(require('node-machine-id').machineIdSync(), uuidv5.DNS);
  } catch (err) {
    require('debug')('nuxeo:cli:id')('%O', err);
    return require('uuid/v4')();
  }
})();
