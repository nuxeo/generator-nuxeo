/*eslint strict:0*/
'use strict';

var _compareVersions = require('compare-versions');

// 8.3-SNAPSHOT is not a valid semver
// Transform x.y-MODIFIER to x.y.0-MODIFIER to valid it
const SEMVER_FIX = /^(\d+\.\d+)-([A-Z10-9-]+)$/i;

function semverFix(version) {
  const i = version.match(SEMVER_FIX);
  return i ? `${i[1]}.0-${i[2]}` : version;
}

// hack to handl x.y-MODIFIER
function compareVersions(v1, v2) {
  return _compareVersions(semverFix(v1), semverFix(v2));
}

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
  },
  fromVersion: function(v1) {
    v1 = v1 || '0.0.0-SNAPSHOT';
    return {
      isAfter: function(v2) {
        return compareVersions(v1, v2) > 0;
      },
      isAfterOrEquals: function(v2) {
        return compareVersions(v1, v2) >= 0;
      },
      isBefore: function(v2) {
        return compareVersions(v1, v2) < 0;
      },
      isBeforeOrEquals: function(v2) {
        return compareVersions(v1, v2) <= 0;
      },
      isEquals: function(v2) {
        return compareVersions(v1, v2) === 0;
      }
    };
  }
};
