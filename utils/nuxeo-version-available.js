const _ = require('lodash');
const http = require('https');
const version = require('./version-helper');
const deasync = require('deasync');
const debug = require('debug')('nuxeo:utils:versions');

const CONNECT_TP = 'https://connect.nuxeo.com/nuxeo/api/v1/target-platforms/public';

const requestConnect = new Promise((resolve, reject) => {
  let res = '';
  http.request(CONNECT_TP, (resp) => {
    resp.setEncoding('UTF-8');
    resp.on('data', (chunk) => {
      res += chunk;
    });
    resp.on('end', () => {
      resolve(res);
    });
  }).on('error', (e) => {
    debug(e);
    reject(e);
  }).end();
});

let done = false;
let res;
requestConnect.then((data) => {
  res = JSON.parse(data);
}).then(() => {
  done = true;
}).catch(() => {
  done = true;
});

deasync.loopWhile(() => {
  return !done;
});

// wait
if (!res) {
  debug('Fallback with default available versions...');
  res = [{
    label: 'Nuxeo Platform LTS 2019',
    default: true,
    version: '10.10',
    enabled: true
  }, {
    label: 'Nuxeo Platform LTS 2017',
    default: true,
    version: '9.10',
    enabled: true
  }];
}

// Filter CMF and version before 7.10 (even if it should be handle Target Platform side)
const targetPlatforms = _(res).filter((tp) => {
  return tp.enabled && !(tp.name === 'cmf' || version.isBefore(tp.version, '7.10'));
});

const choices = _(targetPlatforms).sortBy((o) => {
  return o.releaseDate;
}).map((tp) => {
  return tp.label ? `${tp.version} (${tp.label})` : tp.version;
}).value();

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
    label: 'Nuxeo Platform LTS 2019',
    default: true,
    version: '10.10'
  };
}

module.exports = {
  choices: choices,
  default: `${dtp.version} (${dtp.label})`,
  latest: dtp.version
};
