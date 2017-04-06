const STUDIO_SYMNAME = 'studio:symbolicname';
let projectCache = {};

module.exports = {
  _getProject: function (symName) {
    const symbolicName = symName || this._getSymbolicName();
    if (!symbolicName) {
      throw new Error('Symbolic name is empty');
    }

    if (!projectCache[symbolicName]) {
      const res = this._request('GET', this._getConnectUrl() + '/site/studio/v2/project/' + symbolicName + '/workspace/ws.registries');

      if (res.statusCode === 200) {
        projectCache[symbolicName] = JSON.parse(res.getBody('utf8'));
      }
    }

    return projectCache[symbolicName];
  },
  _isProjectAccessible: function (symbolicName) {
    const url = `${this._getConnectUrl()}/site/studio/v2/project/${symbolicName}/administrativeInformation`;
    return this._request('GET', url).statusCode === 200;
  },

  _getSymbolicName: function () {
    return this.config.get(STUDIO_SYMNAME) || undefined;
  },
  _setSymbolicName: function (value) {
    return this.config.set(STUDIO_SYMNAME, value);
  }
};
