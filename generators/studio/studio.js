const qs = require('querystring');
const _ = require('lodash');
const objectPath = require('object-path');
const STUDIO_SYMNAME = 'studio:symbolicname';
const spinner = require('../../utils/spinner');
let projectCache = {};

module.exports = {
  _getProject: function (symName) {
    const symbolicName = symName || this._getSymbolicName();
    if (!symbolicName) {
      throw new Error('Symbolic name is empty');
    }

    if (!projectCache[symbolicName]) {
      return this._request('GET', this._getConnectUrl() + '/site/studio/v2/project/' + symbolicName + '/workspace/ws.registries').then(res => {
        if (res.statusCode === 200) {
          projectCache[symbolicName] = JSON.parse(res.getBody('utf8'));
          return projectCache[symbolicName];
        }
      });
    }
    return new Promise((resolve) => resolve(projectCache[symbolicName]));
  },

  _getProjectMavenCoordonates: function (symName) {
    const symbolicName = symName || this._getSymbolicName();
    if (!symbolicName) {
      throw new Error('Symbolic name is empty');
    }

    return this._request('GET', this._getConnectUrl() + '/site/studio/v2/project/' + symbolicName + '/workspace/ws.maven').then(res => {
      if (res.statusCode !== 200) {
        throw new Error('Unable to read Maven Coordonates for ' + symbolicName);
      }
  
      const mc = JSON.parse(res.getBody('UTF-8'));
      return `${mc.groupId}:${mc.artifactId}:${mc.version}`;
    });
  },

  _getWorkspaceRegistries: function (symName, exclude = 'tp', baseUrl) {
    const symbolicName = symName || this._getSymbolicName();
    const _baseUrl = baseUrl || this._getConnectUrl();
    if (!symbolicName) {
      throw new Error('Symbolic name is empty');
    }

    return this._request('GET', `${_baseUrl}/site/studio/v2/project/${symbolicName}/workspace/ws.registries?exclude=${qs.escape(exclude)}`).then(res => {
      if (res.statusCode !== 200) {
        throw new Error('Unable to read Maven Coordonates for ' + symbolicName);
      }
  
      return this._sortRegistries(JSON.parse(res.getBody('UTF-8')));
    });
  },

  /**
   * Sort Registries Object
   */
  _sortRegistries: function (registries) {
    const sorters = [{
      type: 'operationChains',
      key: '@id',
      parameterField: 'chain.inputParams',
      parameterKey: '@name'
    }, {
      type: 'operationScriptings',
      key: '@id',
      parameterField: 'params',
      parameterKey: '@name'
    }, {
      type: 'documentTypes',
      key: 'id'
    }, {
      type: 'facets',
      key: 'id'
    }, {
      type: 'pageProviders',
      key: 'id',
      parameterField: 'queryParameters',
      parameterKey: undefined
    }, {
      type: 'schemas',
      key: 'id'
    }, {
      type: 'lifeCycles',
      key: 'id',
      parameterField: 'states',
      parameterKey: undefined
    }, {
      type: 'lifeCycles',
      key: 'id',
      parameterField: 'transitions',
      parameterKey: undefined
    }];

    _(sorters).forEach((sorter) => {
      const registry = objectPath.get(registries, sorter.type);
      if (!registry) {
        return;
      }

      if (sorter.parameterField) {
        // Sort Registry Entry's Parameters if exist
        _(registry).filter((entry) => {
          return objectPath.has(entry, sorter.parameterField);
        }).forEach((entry) => {
          objectPath.set(entry, sorter.parameterField, _(objectPath.get(entry, sorter.parameterField)).sortBy(sorter.parameterKey).uniq().value());
        });
      }

      objectPath.set(registries, sorter.type, _.sortBy(registry, sorter.key));
    });

    return registries;
  },

  _isProjectAccessible: function (symbolicName) {
    const url = `${this._getConnectUrl()}/site/studio/v2/project/${symbolicName}/administrativeInformation`;
    return this._request('GET', url).then(res => res.statusCode === 200);
  },

  _getSymbolicName: function () {
    return this.config.get(STUDIO_SYMNAME) || undefined;
  },
  _setSymbolicName: function (value) {
    return this.config.set(STUDIO_SYMNAME, value);
  },
  _releaseStudioProject: function (params) {
    return spinner(function () {
      return this._request('POST', `${this._getConnectUrl()}/site/studio/v2/project/${this._getSymbolicName()}/releases`, params);
    }.bind(this));
  },
};
