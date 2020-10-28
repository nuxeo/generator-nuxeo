/*eslint no-undef:0*/
const debug = require('debug')('nuxeo:generator:maven');
const maven = require('../../utils/maven');
const nxPkg = require('../../utils/nuxeo-package');
const settings = require('../../utils/maven-settings');
const path = require('path');
const fs = require('fs-extra');

const STUDIO_SERVER = 'nuxeo-studio';
const HF_RELEASES = 'hotfix-releases';
const HF_SNAPSHOTS = 'hotfix-snapshots';
const MAVEN_GAV = 'maven:gav';
const MVN_PROP = 'studio.project.version';
const ANT_PROP = 'STUDIO_PROJECT_VERSION';

module.exports = {
  _saveSettingsAnswers: function (updateSettings = false, force = true) {
    this._mvnSettings = {
      updateSettings,
      force
    };
  },

  _getMavenGav: function () {
    return this.config.get(MAVEN_GAV);
  },
  _setMavenGav: function (value) {
    this.config.set(MAVEN_GAV, value);
  },

  _addDependency: function (gav) {
    const [groupId, artifactId, version, type, scope] = gav.split(':');

    // add GAV to the root pom.xml
    const targetPom = path.join(this.destinationRoot(), 'pom.xml');
    const pom = maven.open(this.fs.read(targetPom));
    pom.addProperty(version, MVN_PROP);
    // Override version to rely on property instead
    pom.addDependency([groupId, artifactId, `\${${MVN_PROP}}`, type, scope].join(':'));
    pom.save(this.fs, targetPom);

    // Add the dependecy to each jar modules; and without the version as
    // it is hanlded by the dependency management
    const cgav = `${groupId}:${artifactId}:::${scope}`;
    this._setMavenGav(cgav);

    // add dependency for each jar modules - only if it's a bom
    pom.modules().map((elt) => {
      const fp = path.join(this.destinationRoot(), elt, 'pom.xml');
      return {
        root: path.join(this.destinationRoot(), elt),
        fp,
        pom: maven.open(this.fs.read(fp))
      };
    }).forEach((m) => {
      switch (m.pom.packaging()) {
        case 'zip':
          this._addNuxeoPackageDependency(m.root);
          break;
        case 'jar':
        m.pom.addDependency(cgav);
        m.pom.save(this.fs, m.fp);
          break;
        default:
        // Nothing to do
      }
    });
  },

  _addNuxeoPackageDependency: function (moduleRoot) {
    const pkgPath = path.join(moduleRoot, 'src', 'main', 'resources', 'package.xml');
    if (!fs.existsSync(pkgPath)) {
      return;
    }
    const pkg = nxPkg.open(pkgPath);

    const dep = `${this._getSymbolicName()}:@${ANT_PROP}@:@${ANT_PROP}@`;
    pkg.addDependency(dep);
    pkg.save(this.fs, pkgPath);
  },

  /**
   * Update Studio dependency version in pom parent.
   * @param version
   */
  _updateVersion: function(gav, version) {
    const targetPom = path.join(this.destinationRoot(), 'pom.xml');
    const pom = maven.open(this.fs.read(targetPom));
    pom.updateDependencyVersion(gav, version);
    pom.save(this.fs, targetPom);
  },

  _removeDependency: function (g) {
    const gav = g || this._getMavenGav();
    if (!gav) {
      return;
    }

    const targetPom = path.join(this.destinationRoot(), 'pom.xml');
    const pom = maven.open(this.fs.read(targetPom));
    pom.removeDependency(gav);
    this.log.info(`Removing: ${gav}`);
    pom.save(this.fs, targetPom);

    // remove dependency for each modules - only if it's a bom
    pom.modules().map((elt) => {
      const fp = path.join(this.destinationRoot(), elt, 'pom.xml');
      return {
        fp,
        pom: maven.open(this.fs.read(fp))
      };
    }).forEach((m) => {
      m.pom.removeDependency(gav);
      m.pom.save(this.fs, m.fp);
    });
  },

  _hasCredentials: function () {
    return settings.open().containsServer(STUDIO_SERVER);
  },

  _canAddCredentials: function () {
    return !!this._mvnSettings.updateSettings;
  },

  _addConnectCredentials: function (username, password) {
    const ms = settings.open();

    let save = ms.addServer(HF_SNAPSHOTS, username, password);
    save |= ms.addServer(HF_RELEASES, username, password);
    save |= ms.addServer(STUDIO_SERVER, username, password, this._mvnSettings.force);

    if (save) {
      ms.save(this.fs);
    }
  },

  _containsPom: function (folder) {
    const f = folder || this.destinationRoot();
    const p = path.join(f, 'pom.xml');

    return fs.existsSync(p);
  },

  _getSettingsPath: function () {
    return path.normalize(settings.locateFile());
  },

  _spawnMaven: function () {
    let args = Array.prototype.slice.call(arguments);
    if (args.length === 1) {
      args = args[0].split(' ');
    }

    const bin = process.platform === 'win32' ? 'mvn.cmd' : 'mvn';
    debug('Spawn: %o', `${bin} ${args.join(' ')}`);

    const mvn = require('child_process').spawn(bin, args, {
      cwd: this.destinationRoot(),
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe']
    });

    return new Promise((resolve, reject) => {
      const ora = require('../../utils/spinner').async;
      if (!debug.enabled) {
        ora.text = 'Working... It can take some time, please be patient.';
        ora.start();
      }

      mvn.stdout.on('data', (data) => {
        const line = String(data).trim();
        if (line.startsWith('[ERROR]')) {
          this.log(line);
        } else {
          debug(line);
        }
      });

      mvn.stderr.on('data', (data) => {
        if (!debug.enabled) {
          return;
        }

        debug(`${String(data).trim()}`);
      });

      mvn.on('close', (code) => {
        debug(`Process exited with code ${code}`);
        ora.stop();

        if (code !== 0) {
          reject(code);
        } else {
          resolve();
        }
      });
    });
  }
};
