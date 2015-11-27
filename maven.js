'use strict';
var cheerio = require('cheerio'),
  fse = require('fs-extra');

/**
Usage:
     var mvn = maven('pom.xml');
     mvn.addDependency(artifact, group, version, type, scope, optional)

     mvn.save(this.fs);
*/

function maven(file) {
  if (typeof file === 'undefined') {
    file = 'pom.xml';
  }
  var $ = cheerio.load(fse.readFileSync(file, {
    encoding: "UTF-8"
  }));

  return {
    // XXX: Slice arguments instead of fixed list, to allowing passing a simple GAV
    addDependency: function(groupId, artifactId, version) {
      // XXX: Check if dependency is not already present
      var dep = $('<dependency />')
      dep.append('<groupId>' + groupId + "</groupId>");
      dep.append('<artifactId>' + artifactId + '</artifactId');
      if (typeof version !== 'undefined') {
        dep.append('<version>' + version + '</version>');
      }

      $('dependencies').append(dep);
    },
    dependencyExists(groupId, artifactId, version) {
      return $('dependencies').has(artifactId).length > 0;
    },
    save: function(fs) {
      fs.write(file, $.html());
    }
  };
}

module.exports = {
  open: maven
};
