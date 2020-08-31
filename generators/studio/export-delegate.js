const delegate = {
  initializing: function () {
    this._ensureStudioIsLinked();
  },

  writing: function () {
    this.log.info(`Building and exporting your contributions to '${this._getSymbolicName()}' Studio project.`);

    const pluginGAV = `org.nuxeo.tools:nuxeo-studio-maven-plugin:${this.options.studioMavenPluginVersion}`;

    const plugAvailableArgs = [];
    plugAvailableArgs.push('-ff');
    plugAvailableArgs.push('-e');
    plugAvailableArgs.push('-B');
    plugAvailableArgs.push('-nsu');
    plugAvailableArgs.push(`-Dplugin=${pluginGAV}`);
    plugAvailableArgs.push('help:describe');

    // Add `compile` to be sure the project is built... if we are not using a standalone POM
    const extractArgs = this._containsPom() ? ['compile'] : [];
    extractArgs.push('-DskipTests=true');
    extractArgs.push('-DskipITs=true');
    extractArgs.push('-ff');
    extractArgs.push('-e');
    extractArgs.push('-B');
    extractArgs.push('-ntp');
    extractArgs.push(`${pluginGAV}:extract`);
    extractArgs.push('-Dnsmp.failOnEmpty=true');
    extractArgs.push(`-Dnsmp.symbolicName=${this._getSymbolicName()}`);
    extractArgs.push(`-Dnsmp.token=${this._getToken()}`);
    extractArgs.push(`-Dnsmp.connectUrl=${this._getConnectUrl()}`);

    const done = this.async();

    // Ensure Maven Plugin is reachable
    this._spawnMaven.apply(this, plugAvailableArgs).then(() => {
      // Spawn extract
      this._spawnMaven.apply(this, extractArgs).then(() => {
        done();
      }).catch((error) => {
        process.exit(error);
      });
    }).catch((error) => {
      this.log.error(`Unable to use '${pluginGAV}' Maven Plugin. Ensure you have the correct plugins repository sets following:`);
      this.log.error('https://github.com/nuxeo/nuxeo-studio-maven-plugin#setting-nuxeo-plugins-repository');
      process.exit(error);
    });
  },

  end: function () {
    this.log.writeln();
    this.log.info(`Contributions sucessfully exported to '${this._getSymbolicName()}' Studio project.`);
  }
};

module.exports = delegate;
