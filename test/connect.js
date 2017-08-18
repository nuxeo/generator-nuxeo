const Connect = require('../generators/studio/connect');
const Studio = require('../generators/studio/studio');
const assert = require('yeoman-assert');

const TEST_ENV = 'https://nos-test-connect.nos.nuxeo.com/nuxeo';

const USERNAME = 'zpsfktef@eelmail.com';
const PASSWD = process.env.CPWD || 'FIXME';
const PROJECT = 'tests-studio4';

let connect = Object.assign({}, Connect);
connect = Object.assign(connect, Studio);

// Add a Custom Config Manager with NOS-TEST as default connect
connect = Object.assign(connect, {
  config: (function () {
    let values = {
      'connect:url': TEST_ENV
    };

    return {
      get: function (key) {
        return values[key] || undefined;
      },
      set: function (key, value) {
        values[key] = value;
      }
    };
  })()
});

describe('Against a live Connect', function () {
  this.timeout(30 * 1000);

  describe('It', function () {
    it('is correctly plugged to nos-test', function () {
      assert.equal(connect._getConnectUrl(), TEST_ENV);
    });

    it('can require a token', function () {
      // undefined if no token found
      assert.equal(connect._generateToken(USERNAME, ''), undefined);

      // ok if token is returned
      assert.ok(connect._generateToken(USERNAME, PASSWD));
      assert.ok(connect._hasToken());
    });

    it('can do requests authenticated now', function () {
      const res = connect._request('GET', connect._getConnectUrl() + '/api/v1/path/default-domain');
      assert.equal(res.statusCode, 200);
    });

    it('can check project availability', function () {
      assert.ok(!connect._isProjectAccessible('XxX-nuxeo-DsdsdS-XxxxD-uxeo'));
      assert.ok(connect._isProjectAccessible(PROJECT));
    });

    it('can fetch an authorized project', function () {
      assert.ok(connect._getProject(PROJECT));
    });

    it('can get project\'s Maven GAV', function () {
      const maven = connect._getProjectMavenCoordonates(PROJECT);
      assert.equal('nuxeo-studio:tests-studio4:0.0.0-SNAPSHOT', maven);
    });

    it('generates same Studio registries twice', function () {
      // Sort is covered in constant_template#'gets ordered Registries' test
      // But this test is important as well in case a new registry is exposed, as each one has to be manually ordered
      // in studio#_sortRegistries
      const res1 = connect._getWorkspaceRegistries(PROJECT);
      const res2 = connect._getWorkspaceRegistries(PROJECT);

      assert.deepEqual(res1, res2);
    });

    it('can revoke a token', function () {
      // Revoke Token
      assert.ok(connect._revokeToken());
      assert.ok(!connect._hasToken());

      // Return false if any token exists
      assert.ok(!connect._revokeToken());
    });
  });
});
