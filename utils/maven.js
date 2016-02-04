'use strict';
var cheerio = require('cheerio');
var fse = require('fs-extra');
var beautify = require('js-beautify').html;

/**
Usage:
     var mvn = maven('pom.xml');
     mvn.addDependency(gav)
     mvn.addDependency(groupId, artifactId, version, type, scope)
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
    convertToXml: function(dep) {
      var $dep = $('<dependency />');
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
    addDependency: function() {
      var args = Array.prototype.slice.call(arguments, 0);
      if (args.length === 1) {
        args = args[0].split(':');
      }
      if (args.length < 2) {
        return;
      }

      var dep = {
        groupId: args[0],
        artifactId: args[1],
        version: args[2],
        extension: args[3],
        classifier: args[4]
      };

      // Format: <groupId>:<artifactId>[:<version>[:<extension>[:<classifier>]]]
      if (this.containsDependency(dep.groupId, dep.artifactId)) {
        return dep;
      }

      $('dependencies').append(this.convertToXml(dep));
      return dep;
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
      fs.write(file, beautify($.xml(), {
        indent_size: 2
      }));
    }
  };
}

module.exports = {
  open: maven
};
