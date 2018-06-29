const mvn = require('../../utils/maven');

const delegate = {
  initializing: function() {
    if (!this._containsPom()) {
      this.log.error('This is not a Maven Project');
      process.exit(1);
    }
  },

  welcome: function() {
    const values = {};
    // project-parent artifact name + version
    const rootPom = this.getRootPom();
    values.project = {
      artifactId: rootPom.artifactId(),
      groupId: rootPom.groupId(),
      version: rootPom.version(),
    };

    // associated Studio Project + version
    values.StudioGav = 'sdad';//

    // modules + version
    // Associated Nuxeo Version
  },

  end: function () {
    // Skip Finish message
  }
};

module.exports = delegate;
