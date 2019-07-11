/*eslint strict:0*/
'use strict';

const _compareVersions = require('compare-versions');

// 8.3-SNAPSHOT is not a valid semver
// Transform x.y-MODIFIER to x.y.0-MODIFIER to valid it
const SEMVER_FIX = /^(\d+\.\d+)-([A-Z10-9-]+)$/i;

function semverFix(version) {
  const i = version.match(SEMVER_FIX);
  return i ? `${i[1]}.0-${i[2]}` : version;
}

// hack to handl x.y-MODIFIER
function compareVersions(v1, v2, operator) {
  return _compareVersions.compare(semverFix(v1), semverFix(v2), operator);
}

module.exports = {
  compare: compareVersions,
  fromStr: function (str) {
    const [v1, operator, v2] = str.split(/\s+/);
    return compareVersions(v1, v2, operator);
  },
  isAfter: function (v1, v2) {
    return compareVersions(v1, v2, '>');
  },
  isAfterOrEquals: function (v1, v2) {
    return compareVersions(v1, v2, '>=');
  },
  isBefore: function (v1, v2) {
    return compareVersions(v1, v2, '<');
  },
  isBeforeOrEquals: function (v1, v2) {
    return compareVersions(v1, v2, '<=');
  },
  isEquals: function (v1, v2) {
    return compareVersions(v1, v2, '=');
  },
  fromVersion: function (v1) {
    v1 = v1 || '0.0.0-SNAPSHOT';
    return {
      isAfter: function (v2) {
        return compareVersions(v1, v2, '>');
      },
      isAfterOrEquals: function (v2) {
        return compareVersions(v1, v2, '>=');
      },
      isBefore: function (v2) {
        return compareVersions(v1, v2, '<');
      },
      isBeforeOrEquals: function (v2) {
        return compareVersions(v1, v2, '<=');
      },
      isEquals: function (v2) {
        return compareVersions(v1, v2, '=');
      }
    };
  }
};
