const Connect = require('../generators/studio/connect');
const Studio = require('../generators/studio/studio');
const assert = require('yeoman-assert');

const ENV = 'https://connect.nuxeo.com/nuxeo';

const USERNAME = 'zpsfktef@eelmail.com';
const PASSWD = process.env.CPWD || 'FIXME';
const PROJECT = 'tests-studio4';

let connect = Object.assign({}, Connect);
connect = Object.assign(connect, Studio);

// Add a Custom Config Manager with NOS-TEST as default connect
connect = Object.assign(connect, {
  config: (function () {
    let values = {
      'connect:url': ENV,
    };

    return {
      get: function (key) {
        return values[key] || undefined;
      },
      set: function (key, value) {
        values[key] = value;
      },
    };
  })()
});

describe('Release Studio Project', function () {
  this.timeout(30 * 1000);

  describe('It', function () {
    before(function () {
      if (PASSWD === 'FIXME') {
        this.skip('Connect password not configured');
      }
    });

    it('is correctly plugged to connect', function () {
      assert.equal(connect._getConnectUrl(), ENV);
    });

    it(`can release the studio project ${PROJECT}`, function () {
      connect._generateToken(USERNAME, PASSWD);
      const params = {
        json: {
          revision: 'master',
          versionName: 'MAJOR',
        },
      };
      connect._setSymbolicName(PROJECT);
      const res = connect._releaseStudioProject(params);
      assert.equal(res.statusCode, 200);
      const response = JSON.parse(res.getBody('utf8'));
      assert.ok(response.version.endsWith('.0.0'));
    });
  });
});
