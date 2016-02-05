'use strict';
var fse = require('fs-extra');
var _ = require('lodash');

function manifest(filep, fsp) {
  var fs = fsp || fse;
  var file = filep || 'src/main/resources/META-INF/MANIFEST.MF';
  var content = fs.read(file).split('\n');

  function insertLine(index, line) {
    content.splice(index, 0, line);
  }

  return {
    _content: function() {
      return content.join('\n');
    },
    addComponent: function(componentPath) {
      var index = _.findIndex(content, function(line) {
        return line.match(/^Nuxeo-Component:/);
      });

      // No Nuxeo-Component defined yet
      if (index < 0) {
        // XXX Assuming the mandatory empty line is present.
        insertLine(content.length - 1, 'Nuxeo-Component: ' + componentPath);
        return;
      }

      var suffix = ',';
      if (!content[index].match(/,$/)) {
        // add the comma and append the line
        content[index] = content[index] + ',';
        suffix = '';
      }
      insertLine(index + 1, ' ' + componentPath + suffix);
    },
    components: function() {
      var res = [];
      var index = _.findIndex(content, function(line) {
        return line.match(/^Nuxeo-Component:/);
      });
      if (index < 0) {
        return res;
      }

      res.push(content[index].match(/^Nuxeo-Component:\s*([\w\.\-/]+),?/)[1]);
      while (content[index + 1].match('^ ')) {
        index += 1;
        res.push(content[index].match(/^\s+([\w\.\-/]+),?/)[1]);
      }

      return res;
    },
    save: function() {
      fs.write(file, this._content());
    }
  }
}

module.exports = {
  open: manifest
};
