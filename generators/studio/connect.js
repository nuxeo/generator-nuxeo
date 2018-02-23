const _ = require('lodash');
const request = require('sync-request');
const debug = require('debug')('nuxeo:connect');

const CONNECT_URL = 'connect:url';
const CONNECT_TOKEN = 'connect:token';

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
  _isNewConnectUrl: function(value) {
    return value !== this._getConnectUrl();
  },
  _getToken: function() {
    const tk = this.config.get(CONNECT_TOKEN);
    debug('Current Token: %O', tk);
    return tk;
  },
  _hasToken: function () {
    return !!this.config.get(CONNECT_TOKEN);
  },
  _generateToken: function (username, password) {
    if (this._hasToken()) {
      this._revokeToken();
    }

    const res = request('GET', this._getConnectUrl() + '/authentication/token', {
      qs: {
        applicationName: this._getApplicationName(),
        deviceId: this._getUnikId(),
        permission: 'AMIREAD'
      },
      headers: {
        authorization: 'Basic ' + new Buffer(username + ':' + password, 'ascii').toString('base64')
      }
    });

    if (res.statusCode === 201) {
      const tok = _.trim(res.getBody('UTF-8'));
      this.config.set(CONNECT_TOKEN, tok);
      return tok;
    } else {
      debug(res);
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

    if (res.statusCode === 202) {
      this.config.set(CONNECT_TOKEN, undefined);
      this._setSymbolicName(undefined);
      return true;
    }

    debug(res);
    return false;
  },
  _request: function (method, url, opts) {
    const _opts = opts || {};
    _opts.headers = Object.assign(_opts.headers || {}, {
      'X-Authentication-Token': this._getToken()
    });

    return request(method, url, _opts);
  }
};
