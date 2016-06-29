var _ = require('lodash');

/**
  Simple module to ease to filter already answered parameters
  It gets a simple API to:
   - store new answers from parameters
   - filter another parameters list depending of the already answered parameters
   - get all answered values
   - clean the cache
**/
module.exports = (function() {
  var stored = {};

  return {
    store: function(params, answers) {
      _.forEach(params, function(param) {
        if (param.store) {
          stored[param.name] = answers[param.name];
        }
      });
    },
    filter: function(params) {
      return _.filter(params, function(param) {
        return !stored[param.name];
      });
    },
    stored: function() {
      return _.assign({}, stored);
    },
    clean: function() {
      stored = {};
    }
  };
})();
