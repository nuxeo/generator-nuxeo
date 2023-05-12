const Connect = require('../generators/studio/connect');
const Studio = require('../generators/studio/studio');
const assert = require('yeoman-assert');

const TEST_ENV = process.env.CLI_CONNECT_URL || 'https://nos-preprod-connect.nuxeocloud.com/nuxeo';
const USERNAME = process.env.CLI_CONNECT_USR || 'zpsfktef@eelmail.com';
const TOKEN = process.env.CLI_CONNECT_TKN || 'FIXME';
const PROJECT = process.env.CLI_CONNECT_PRJ || 'tests-studio4';

let connect = Object.assign({}, Connect);
connect = Object.assign(connect, Studio);

// Add a Custom Config Manager with nos-preprod as default connect
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
    before(function() {
      if (TOKEN === 'FIXME') {
        this.skip('Connect password not configured');
      }
    });

    it('is correctly plugged to nos-preprod', function () {
      assert.equal(connect._getConnectUrl(), TEST_ENV);
    });

    it('cannot generate a token without a given token', function () {
      // undefined if no token found
      return connect._generateToken(USERNAME, '').then( token => assert(token === undefined));
    });

    it('can require a token', function () {
      assert.ok(!connect._hasToken());
      // ok if token is returned and stored in config
      return connect._generateToken(USERNAME, TOKEN).then( token => {
        assert.ok(token);
        assert.ok(connect._hasToken());
       });
    });

    it('can check project unavailability', function () {
      connect._isProjectAccessible('XxX-nuxeo-DsdsdS-XxxxD-uxeo').then( access => assert.ok(!access));
    });

    it('can check project availability', function () {
      connect._isProjectAccessible(PROJECT).then( access => assert.ok(access));
    });

    it('can fetch an authorized project and store it in cache', function () {
      connect._getProject(PROJECT).then( proj => {
        assert.ok(proj);
        return connect._getProject(PROJECT).then( projFromCache => {
          assert.deepEqual(proj, projFromCache);
        });
      });
    });

    it('can get project\'s Maven GAV', function () {
      connect._getProjectMavenCoordonates(PROJECT).then( maven => assert.equal('nuxeo-studio:'+PROJECT+':0.0.0-SNAPSHOT', maven));
    });

    it('generates same Studio registries twice', function () {
      // Sort is covered in constant_template#'gets ordered Registries' test
      // But this test is important as well in case a new registry is exposed, as each one has to be manually ordered
      // in studio#_sortRegistries
      connect._getWorkspaceRegistries(PROJECT).then(res1 => {
        connect._getWorkspaceRegistries(PROJECT).then( res2 => {
          assert.deepEqual(res1, res2);
        });
      });
    });

    it('can revoke a token', function () {
      assert.ok(connect._hasToken());
      // Revoke Token
      return connect._revokeToken().then( revoked => {
        assert.ok(revoked);
        assert.ok(!connect._hasToken());
       });
    });

    it('cannot revoke unexisting token', function () {
      assert.ok(!connect._hasToken());
      // Revoke Token
      return connect._revokeToken().then( revoked => {
        assert.ok(!revoked);
        assert.ok(!connect._hasToken());
       });
    });
  });

  describe('Release Studio Project', function () {
    before(function() {
      if (TOKEN === 'FIXME') {
        this.skip('Connect password not configured');
      }
    });

    it('is correctly plugged to connect', function () {
      assert.equal(connect._getConnectUrl(), TEST_ENV);
    });

    it(`can release the studio project ${PROJECT}`, function () {
      return connect._generateToken(USERNAME, TOKEN).then(() => {
        assert.ok(connect._hasToken());
        const params = {
          json: {
            revision: 'master',
            versionName: 'MAJOR',
          },
        };
        connect._setSymbolicName(PROJECT);
        return connect._releaseStudioProject(params).then(res => {
          assert.equal(res.statusCode, 200);
          const response = JSON.parse(res.getBody('utf8'));
          assert.ok(response.version.endsWith('.0.0'));
        });
      });
    });
  });
});
