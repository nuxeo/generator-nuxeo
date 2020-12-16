const ua = require('universal-analytics');
const visitor = ua('UA-81135-29', require('./unik-id'), {
  strictCidFormat: false
});
const debug = require('debug')('nuxeo:cli:analytics');

module.exports = {
  event: function () {
    debug('%O', arguments);
    visitor.event.apply(visitor, arguments).send();
  }
};
