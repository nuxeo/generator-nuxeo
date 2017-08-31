const delegate = {
  initializing: function () {
    if (!(this._getSymbolicName() && this._getToken())) {
      this.log.error('No Studio Project linked.');
      this.log(`Run: \`${this.usage.prototype.resolvebinary(this.options)}\` first.`);

      process.exit(1);
    }
  },

  writing: function () {
    this.log.info(`Building and exporting your contributions to '${this._getSymbolicName()}' Studio project.`);

    // Add `package` to be sure the project is built... if we are not using a standalone POM
    const args = this._containsPom() ? ['package'] : [];
    args.push('-DskipTests=true');
    args.push('-DskipITs=true');
    args.push('-ff');
    args.push('-e');
    args.push('-B');
    args.push('org.nuxeo.tools:nuxeo-studio-maven-plugin:extract');
    args.push(`-Dnsmp.symbolicName=${this._getSymbolicName()}`);
    args.push(`-Dnsmp.token=${this._getToken()}`);
    args.push(`-Dnsmp.connectUrl=${this._getConnectUrl()}`);

    this._spawnMaven.apply(this, args);
  },

  end: function () {
    this.log.writeln();
    this.log.info(`Contributions sucessfully exported to '${this._getSymbolicName()}' Studio project.`);
  }
};

module.exports = delegate;
