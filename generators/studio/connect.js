const _ = require('lodash');
const request = require('then-request');
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
      debug('Token already exists');
      return this._revokeToken().then(revoked => {
        if (revoked) {
          return this._generateToken(username, password);
        }
      });
    }

    return request('GET', this._getConnectUrl() + '/authentication/token', {
      qs: {
        applicationName: this._getApplicationName(),
        deviceId: this._getUnikId(),
        permission: 'AMIREAD'
      },
      headers: {
        authorization: 'Basic ' + Buffer.from(username + ':' + password, 'ascii').toString('base64')
      }
    }).then(res => {
      debug(res);
      if (res.statusCode === 201) {
        const tok = _.trim(res.getBody('UTF-8'));
        this.config.set(CONNECT_TOKEN, tok);
        return tok;
      } else {
        debug(res);
        return undefined;
      }
    }).catch(() => undefined);
  },
  _revokeToken: function () {
    if(!this._hasToken()){
      debug('No Token to revoke');
      return new Promise(resolve => resolve(false));
    } 
    return this._request('GET', this._getConnectUrl() + '/authentication/token', {
      qs: {
        applicationName: this._getApplicationName(),
        deviceId: this._getUnikId(),
        revoke: true
      }
    }).then(res => {
      if (res.statusCode === 202) {
        this.config.set(CONNECT_TOKEN, undefined);
        this._setSymbolicName(undefined);
        return true;
      }
  
      debug(res);
      return false;
    });
  },
  _request: function (method, url, opts) {
    const _opts = opts || {};
    _opts.headers = Object.assign(_opts.headers || {}, {
      'X-Authentication-Token': this._getToken()
    });

    debug('%o %o %O', method, url, _opts);
    return request(method, url, _opts);
  }
};
