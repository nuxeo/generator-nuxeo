'use strict';
var cheerio = require('cheerio');
var fse = require('fs-extra');

/**
Usage:
     var mvn = maven('pom.xml');
     mvn.addDependency(groupId, artifactId, version, type, scope, optional)
     mvn.containsDependency(groupId, artifactId)

     mvn.save(this.fs);
*/

function maven(file) {
  if (typeof file === 'undefined') {
    file = 'pom.xml';
  }
  var $ = cheerio.load(fse.readFileSync(file, {
    encoding: 'UTF-8'
  }));

  return {
    // XXX: Slice arguments instead of fixed list, to allowing passing a simple GAV
    addDependency: function(groupId, artifactId, version) {
      if (this.containsDependency(groupId, artifactId)) {
        return;
      }

      var dep = $('<dependency />');
      dep.append('<groupId>' + groupId + '</groupId>');
      dep.append('<artifactId>' + artifactId + '</artifactId');
      if (typeof version !== 'undefined') {
        dep.append('<version>' + version + '</version>');
      }

      $('dependencies').append(dep);
    },
    containsDependency: function(groupId, artifactId) {
      // XXX: Do not only test artifact id :)
      return $('dependencies artifactid').filter(function(i, elt) {
        return $(elt).text() === artifactId;
      }).length > 0;
    },
    dependencies: function() {
      var dependencies = [];
      $('dependencies dependency').each(function(i, elt) {
        var el = $(elt);
        dependencies.push({
          artifactId: el.first('artifactid').text(),
          groupId: el.first('groupid').text()
        });
      });
      return dependencies;
    },
    save: function(fs) {
      fs.write(file, $.html());
    }
  };
}

module.exports = {
  open: maven
};
