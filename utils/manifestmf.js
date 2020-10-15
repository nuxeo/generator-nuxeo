const fse = require('fs-extra');
const _ = require('lodash');

function manifest(filep, fsp) {
  const fs = fsp || fse;
  const file = filep || 'src/main/resources/META-INF/MANIFEST.MF';
  let content;
  try {
    content = [];
    _(fs.read(file).split('\n')).forEach(l => {
      if (l.match(/^\s+\w/)) {
        // Append splitted line to the previous one
        content[content.length - 1] = content[content.length - 1] + l.trim();
      } else {
        content.push(l);
      }
    });
  } catch (e) {
    return undefined;
  }

  function insertLine(index, line) {
    content.splice(index, 0, line);
  }

  return {
    _content: function() {
      const index = _.findIndex(content, function(line) {
        return line.match(/^Nuxeo-Component:/);
      });

      const res = _.union([], content);
      const contribs = content[index].replace(/,/g, ',\n ').split('\n');
      Array.prototype.splice.apply(res, _.union([index, 1], contribs));
      return res.join('\n');
    },
    symbolicName: function() {
      const index = _.findIndex(content, function(line) {
        return line.match(/^Bundle-SymbolicName:/i);
      });

      if (index > 0) {
        return content[index].match(/^Bundle-SymbolicName:\s*([\w.-]+)/i)[1];
      } else {
        throw 'Bundle SymbolicName is missing.';
      }
    },
    addComponent: function(componentPath) {
      const index = _.findIndex(content, function(line) {
        return line.match(/^Nuxeo-Component:/);
      });

      // No Nuxeo-Component defined yet
      if (index < 0) {
        // XXX Assuming the mandatory empty line is present.
        insertLine(content.length - 1, 'Nuxeo-Component: ' + componentPath);
        return;
      }

      content[index] = content[index] + ',' + componentPath;
    },
    components: function() {
      let index = _.findIndex(content, function(line) {
        return line.match(/^Nuxeo-Component:/);
      });
      if (index < 0) {
        return [];
      }

      let comps = content[index].match(/^Nuxeo-Component:\s*([\w.\-/,]+)/)[1];
      while (content[index + 1].match('^ ')) {
        index += 1;
        comps += content[index].match(/^\s+([\w.\-/,]+)/)[1];
      }

      return comps.split(',');
    },
    save: function() {
      fs.write(file, this._content());
    }
  };
}

module.exports = {
  open: manifest
};
