/*eslint camelcase:0*/
const cheerio = require('cheerio');
const fse = require('fs-extra');
const _ = require('lodash');
const beautify = require('js-beautify').html;

/**
Usage:
     const  maven = require('utils/maven.js')
     const  pom = maven.open('pom.xml');
     pom.addDependency(gav)
     pom.addDependency(groupId, artifactId, version, type, scope)
     pom.addProperty(value, key)
     pom.addPlugin(groupId, artifactId, configuration)
     pom.containsDependency(dependency)
     pom.containsProperty(value, key)
     pom.containsPlugin(plugin)

     pom.save(this.fs, filename);
*/

function maven(content, fsl) {
  let filename;
  content = content || 'pom.xml';

  // Not an XML; assuming it's a path
  if (!content.match(/^\s*</)) {
    const fs = fsl || fse;
    const readFile = fs.readFileSync || fs.read;

    filename = content;
    // content = readFile(content, {
    //   encoding: 'UTF-8'
    // });
    content = readFile(content);
  }

  const $ = cheerio.load(content, {
    xmlMode: true,
    lowerCaseTags: false
  });

  return {
    convertDepToXml: function (dep) {
      const $dep = $('<dependency />');
      $dep.append('<groupId>' + dep.groupId + '</groupId>');
      $dep.append('<artifactId>' + dep.artifactId + '</artifactId');
      if (dep.version) {
        $dep.append('<version>' + dep.version + '</version>');
      }
      if (dep.extension) {
        $dep.append('<type>' + dep.extension + '</type>');
      }
      if (dep.classifier) {
        $dep.append('<scope>' + dep.classifier + '</scope>');
      }
      return $dep;
    },

    convertPluginToXml: function (plugin) {
      const $plugin = $('<plugin />');
      $plugin.append('<groupId>' + plugin.groupId + '</groupId>');
      $plugin.append('<artifactId>' + plugin.artifactId + '</artifactId>');
      if (plugin.version) {
        $plugin.append('<version>' + plugin.version + '</version>');
      }
      if (plugin.configuration) {
        const $pluginConfig = $('<configuration />');
        _.forEach(plugin.configuration, function (value, key) {
          $pluginConfig.append('<' + key + '>' + value + '</' + key + '>');
        });
        $plugin.append($pluginConfig);
      }
      return $plugin;
    },

    convertDepToObject: function (elt) {
      const n = $(elt);
      return {
        groupId: n.find('groupId').text() || undefined,
        artifactId: n.find('artifactId').text() || undefined,
        version: n.find('version').text() || undefined,
        extension: n.find('type').text() || undefined,
        classifier: n.find('scope').text() || undefined
      };
    },

    convertPluginToObject: function (elt) {
      const n = $(elt);
      return {
        groupId: n.find('groupId').text() || undefined,
        artifactId: n.find('artifactId').text() || undefined
      };
    },

    addDependency: function () {
      let args = Array.prototype.slice.call(arguments, 0);
      if (args.length === 1) {
        args = args[0].split(':');
      }
      if (args.length < 2) {
        return;
      }

      const [groupId, artifactId, version, extension, classifier] = args;
      const dep = {
        groupId,
        artifactId,
        version,
        extension,
        classifier
      };

      // Format: <groupId>:<artifactId>[:<version>[:<extension>[:<classifier>]]]
      if (this.containsDependency(dep)) {
        return dep;
      }
      this._dependenciesNode().append(this.convertDepToXml(dep));
      return dep;
    },

    addProperty: function (value, key) {
      if (!key) {
        return;
      }

      const property = {};
      property[key] = value;

      // Format: <key>:<value>
      if (this.containsProperty(value, key)) {
        return property;
      }
      this._propertiesNode().append(`<${key}>${value}</${key}>`);
      return property;
    },

    addPlugin: function () {
      let args = Array.prototype.slice.call(arguments, 0);
      if (args.length === 1) {
        args = args[0];
      }
      if (args.length < 2) {
        return;
      }

      const plugin = {
        groupId: args.groupId,
        artifactId: args.artifactId,
        version: args.version,
        configuration: args.configuration,
      };

      // Format: <groupId>:<artifactId>:<configuration>
      if (this.containsPlugin(plugin)) {
        return plugin;
      }
      this._pluginManagementNode().append(this.convertPluginToXml(plugin));
      return plugin;
    },

    containsDependency: function (dep) {
      // XXX Should handle the case of adding a "compile" dependency after a "test" dependency.
      // Test dependency should be removed to be cleaner.
      const that = this;
      return this._dependenciesNode().find('artifactId').filter(function (i, elt) {
        return $(elt).text() === dep.artifactId;
      }).parent().filter(function (i, elt) {
        // Ensure each string keyed properties are setted to something
        const od = _.defaults(that.convertDepToObject(elt), {
          groupId: '',
          artifactId: '',
          version: '',
          extension: '',
          classifier: ''
        });
        const dd = _.defaults(dep, {
          groupId: '',
          artifactId: '',
          version: '',
          extension: '',
          classifier: ''
        });

        return _.isEqual(od, dd);
      }).length > 0;
    },

    containsProperty: function (value, key) {
      // Properties usually contains dots; and selector parsing interpret them as css children
      return this._propertiesNode().children(key.split('.').join('\\.')).length > 0;
    },

    containsPlugin: function (plugin) {
      const that = this;
      return this._pluginManagementNode().find('artifactId').filter(function (i, elt) {
        return $(elt).text() === plugin.artifactId;
      }).parent().filter(function (i, elt) {
        // Ensure each string keyed properties are setted to something
        const od = _.defaults(that.convertPluginToObject(elt), {
          groupId: '',
          artifactId: ''
        });
        const dd = {
          groupId: plugin.groupId,
          artifactId: plugin.artifactId
        };
        return _.isEqual(od, dd);
      }).length > 0;
    },

    updateDependencyVersion: function(gav, version) {
      const [groupId] = gav.split(':');
      const node = this._dependenciesNode().find('groupId').filter((i, elt) => {
        return $(elt).text() === groupId;
      }).parent();
      if(this._isProperty(node.find('version'))) {
        this._updateProperty(node.find('version'), version);
      } else {
        if (node.length !== 1) {
          throw new Error(`Cleanup first your Studio dep (duplicated or not existing) - version released is ${version}`);
        }
        node.find('version').text(version);
      }
    },

    _isProperty: function (node) {
      return node.text().startsWith('${');
    },

    _updateProperty: function (node, value) {
      const property = node.text().substring(2, node.text().length - 1).split('.').join('\\.');
      $('properties').find(property).text(value);
    },

    removeDependency: function (dep) {
      const [groupId, artifactId, version, extension = 'jar', classifier] = dep.split(':');
      this._dependenciesNode().find('artifactId').filter((i, elt) => {
        return $(elt).text() === artifactId;
      }).parent().filter((i, elt) => {
        const gm = $(elt).find('groupId').text() === groupId;
        const vm = !version || !$(elt).find('version').text() || $(elt).find('version').text() === version;
        const em = !$(elt).find('type').text() && extension === 'jar' || $(elt).find('type').text() === extension;
        const sm = !classifier || $(elt).find('scope').text() === classifier;
        // console.log('R: ' + dep)
        // console.log('F: ' + this._toGav(elt));
        // console.log(`${gm}:${vm}:${em}:${sm} => ${gm && vm && em && sm}`);
        // console.log('--');
        return gm && vm && em && sm;
      }).remove();
    },

    dependencies: function () {
      const dependencies = [];
      this._dependenciesNode().find('dependency').each(function (i, elt) {
        const el = $(elt);
        dependencies.push({
          artifactId: el.first('artifactId').text(),
          groupId: el.first('groupId').text()
        });
      });
      return dependencies;
    },

    properties: function () {
      const properties = [];
      this._propertiesNode().children().each(function(i, child) {
        const property = {};
        property[child.name] = $(child).text();
        properties.push(property);
      });
      return properties;
    },

    plugins: function () {
      const that = this;
      const plugins = [];
      this._pluginManagementNode().find('plugin').each(function (i, elt) {
        plugins.push(that.convertPluginToObject(elt));
      });
      return plugins;
    },

    addModule: function (module) {
      if (!this.containsModule(module)) {
        if ($('modules').length === 0) {
          $('project').append($('<modules />'));
        }

        const $mod = $('<module>' + module + '</module>');
        $('modules').append($mod);
      }
      return module;
    },

    isBom: function () {
      return $('packaging').text() === 'pom';
    },

    containsModule: function (module) {
      return $('modules module').filter(function (i, elt) {
        return $(elt).text() === module;
      }).length > 0;
    },

    modules: function () {
      const modules = [];
      $('modules module').each(function (i, elt) {
        modules.push($(elt).text());
      });
      return modules;
    },

    artifactId: function () {
      return $('project>artifactId').text().trim();
    },

    groupId: function () {
      let $groupId = $('project>groupId');
      if ($groupId.length === 0) {
        $groupId = $('parent>groupId');
      }
      return $groupId.text().trim();
    },

    version: function () {
      return $('project>version').text().trim() || $('project>parent>version').text().trim();
    },

    packaging: function () {
      return $('project>packaging').text().trim() || 'jar';
    },

    _dependenciesNode: function () {
      const isBom = this.isBom();
      if (isBom && $('dependencyManagement').length === 0) {
        $('project').append($('<dependencyManagement />'));
      }

      const $root = isBom ? $('dependencyManagement') : $('project');
      if ($root.children('dependencies').length === 0) {
        $root.append($('<dependencies />'));
      }
      return $root.children('dependencies');
    },

    _propertiesNode: function () {
      if (!$('properties')) {
        $('project').append($('<properties>'));
      }
      if ($('project').children('properties').length === 0) {
        $('project').append($('<properties />'));
      }
      return $('project').children('properties');
    },

    _pluginManagementNode: function () {
      if (!$('build')) {
        $('project').append($('<build>'));
      }
      if (!$('build>pluginManagement')) {
        $('build').append($('<pluginManagement>'));
      }
      if (!$('build>pluginManagement>plugins')) {
        $('build>pluginManagement').append($('<plugins>'));
      }
      if ($('build').length === 0) {
        $('project').append($('<build />'));
      }
      if ($('build>pluginManagement').length === 0) {
        $('build').append($('<pluginManagement />'));
      }
      if ($('build>pluginManagement').children('plugins').length === 0) {
        $('build>pluginManagement').append($('<plugins />'));
      }
      return $('build>pluginManagement').children('plugins');
    },

    _xml: function () {
      return beautify($.xml(), {
        indent_size: 2,
        preserve_newlines: 1
      });
    },
    _toGav: function (elt) {
      const $elt = $(elt);
      return `${$elt.find('groupId').text()}:${$elt.find('artifactId').text()}:${$elt.find('version').text()}:${$elt.find('type').text()}:${$elt.find('scope').text()}`;
    },
    save: function (fs, file) {
      fs.write(file || filename, this._xml());
    }
  };
}

module.exports = {
  open: maven
};
