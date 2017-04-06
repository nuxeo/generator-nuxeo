const _ = require('lodash');
const request = require('sync-request');

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

  _hasToken: function () {
    return !!this.config.get(CONNECT_TOKEN);
  },
  _generateToken: function (username, password) {
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
      const tok = _.trim(res.getBody());
      this.config.set(CONNECT_TOKEN, tok);
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

    if (res.statusCode === 202) {
      this.config.set(CONNECT_TOKEN, undefined);
      this._setSymbolicName(undefined);
      return true;
    }

    return false;
  },
  _request: function (method, url, opts) {
    const _opts = opts || {};
    _opts.headers = Object.assign(_opts.headers || {}, {
      'X-Authentication-Token': this.config.get(CONNECT_TOKEN)
    });

    return request(method, url, _opts);
  }
};
