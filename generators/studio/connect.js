const _ = require('lodash');
const request = require('sync-request');
const debug = require('debug')('nuxeo:connect');

const CONNECT_URL = 'connect:url';
const CONNECT_TOKEN_LEGACY = 'connect:token';
const CONNECT_TOKEN = 'connect:restricted:token';
const CONNECT_CREDENTIALS = 'connect:restricted:credentials';

const DEFAULT = 'https://connect.nuxeo.com/nuxeo';

module.exports = {
  _getUnikId: function () {
    return 1;
  },
  _getApplicationName: function () {
    return 'nuxeo-cli';
  },

  _getConnectUrl: function () {
    return this.config.get(CONNECT_URL) || DEFAULT;
  },
  _setConnectUrl: function (value) {
    this.config.set(CONNECT_URL, value);
  },
  _isNewConnectUrl: function (value) {
    return value !== this._getConnectUrl();
  },
  _getToken: function () {
    const tk = this.config.get(CONNECT_TOKEN) || this.config.get(CONNECT_TOKEN_LEGACY);
    debug('Current Token: %O', tk);
    return tk;
  },
  _hasToken: function () {
    return !!this.config.get(CONNECT_TOKEN) || !!this.config.get(CONNECT_TOKEN_LEGACY);
  },
  _hasConnectCredentials: function () {
    return !!this.config.get(CONNECT_CREDENTIALS);
  },
  _getConnectCredentials: function () {
    return this.config.get(CONNECT_CREDENTIALS);
  },
  _getConnectCredentialsBasicAuth: function () {
    const { username, token } = this._getConnectCredentials();
    return 'Basic ' + Buffer.from(username + ':' + token, 'ascii').toString('base64');
  },
  _generateToken: function (username, token) {
    if (this._hasToken()) {
      debug('Token already exists');
      this._revokeToken();
    }

    const res = request('GET', this._getConnectUrl() + '/authentication/token', {
      qs: {
        applicationName: this._getApplicationName(),
        deviceId: this._getUnikId(),
        permission: 'AMIREAD'
      },
      headers: {
        authorization: 'Basic ' + Buffer.from(username + ':' + token, 'ascii').toString('base64')
      }
    });

    debug(res);
    if (res.statusCode === 201) {
      const tok = _.trim(res.getBody('UTF-8'));
      this.config.set(CONNECT_TOKEN, tok);
      this.config.set(CONNECT_CREDENTIALS, { username, token });
      return tok;
    } else {
      return undefined;
    }
  },
  _revokeToken: function () {
    const res = this._request('GET', this._getConnectUrl() + '/authentication/token', {
      qs: {
        applicationName: this._getApplicationName(),
        deviceId: this._getUnikId(),
        revoke: true
      }
    });

    debug(res);
    if (res.statusCode === 202) {
      this.config.set(CONNECT_TOKEN, undefined);
      this._setSymbolicName(undefined);
      return true;
    }
    return false;
  },
  _request: function (method, url, opts) {
    const _opts = opts || {};
    if (this._hasConnectCredentials()) {
      _opts.headers = Object.assign(_opts.headers || {}, {
        authorization: this._getConnectCredentialsBasicAuth()
      });
    } else {
      // Compatibility mode with previous token auth
      _opts.headers = Object.assign(_opts.headers || {}, {
        'X-Authentication-Token': this._getToken()
      });
    }


    debug('%o %o %O', method, url, _opts);
    return request(method, url, _opts);
  }
};
