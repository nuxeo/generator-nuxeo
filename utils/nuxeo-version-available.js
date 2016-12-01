const _ = require('lodash');
const request = require('sync-request');
const version = require('./version-helper');
const log = require('yeoman-environment/lib/util/log')();

const CONNECT_TP = 'https://connect.nuxeo.com/nuxeo/restAPI/target-platforms';

let res;
try {
  res = JSON.parse(request('GET', CONNECT_TP).getBody('UTF-8'));
} catch (err) {
  log.error('Unable to fetch current Nuxeo Versions; fallback on LTS only mode.');
  // In case of error on Connect
  // do not break anything, restreint to LTS Versions
  res = [{
    label: 'Nuxeo Platform LTS 2015',
    version: '7.10'
  }, {
    label: 'Nuxeo Platform LTS 2016',
    default: true,
    version: '8.10'
  }];
}

// Filter CMF and version before 7.10 (even if it should be handle Target Platform side)
const targetPlatforms = _(res).filter((tp) => {
  return !(tp.deprecated || tp.name === 'cmf' || version.isBefore(tp.version, '7.10'));
});

const choices = _(targetPlatforms).map((tp) => {
  return tp.label ? `${tp.version} (${tp.label})` : tp.version;
}).sortBy().value();

// Handle Current -SNAPSHOT version
// XXX Hacky: this code cannot handle x.4-SNAPSHOT -> x.10-SNAPSHOT.
const lastVersion = _(choices).findLast();
let [, major, minor] = lastVersion.match(/^(\d+)\.(\d+)\s+/);
if (minor === '10') {
  major = parseInt(major) + 1;
  minor = 1;
} else {
  minor = parseInt(minor) + 1;
}
choices.push(`${major}.${minor}-SNAPSHOT`);

let dtp = _(targetPlatforms).find((tp) => {
  return tp.default;
});

if (dtp === undefined) {
  dtp = {
    label: 'Nuxeo Platform LTS 2016',
    default: true,
    version: '8.10'
  };
}

module.exports = {
  choices: choices,
  default: `${dtp.version} (${dtp.label})`
};
