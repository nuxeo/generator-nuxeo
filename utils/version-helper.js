var compareVersions = require('compare-versions');

module.exports = {
  compare: compareVersions,
  isAfter: function(v1, v2) {
    return compareVersions(v1, v2) > 0;
  },
  isAfterOrEquals: function(v1, v2) {
    return compareVersions(v1, v2) >= 0;
  },
  isBefore: function(v1, v2) {
    return compareVersions(v1, v2) < 0;
  },
  isBeforeOrEquals: function(v1, v2) {
    return compareVersions(v1, v2) <= 0;
  },
  isEquals: function(v1, v2) {
    return compareVersions(v1, v2) === 0;
  }
};
