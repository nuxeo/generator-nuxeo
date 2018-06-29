const path = require('path');
const maven = require('../../utils/maven');

module.exports = {
  _getRootPom() {
    const targetPom = path.join(this.destinationRoot(), 'pom.xml');
    return maven.open(this.fs.read(targetPom));
  },

  _getModulePom(modulePath) {
    const targetPom = path.join(this.destinationRoot(), modulePath, 'pom.xml');
    return maven.open(this.fs.read(targetPom));
  },


};
