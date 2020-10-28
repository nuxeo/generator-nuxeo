/*eslint camelcase:0*/
const cheerio = require('cheerio');
const fse = require('fs-extra');
const beautify = require('js-beautify').html;

/**
 * Helper to manipulate packages.xml file from a Nuxeo Package
 *
 * WARN Implementation is really basic and only manipulate package's dependency.
 */

const open = function (content, fsl) {
  let filename;
  content = content || 'packages.xml';

  // Not an XML; assuming it's a path
  if (!content.match(/^\s*</)) {
    const fs = fsl || fse;
    const readFile = fs.readFileSync || fs.read;

    filename = content;
    // content = readFile(content, {
    //   encoding: 'UTF-8'
    // });
    content = readFile(content);
  }

  const $ = cheerio.load(content, {
    xmlMode: true,
    lowerCaseTags: false
  });

  return {
    package: function () {
      return this._findOrCreateNode('package');
    },

    _findOrCreateNode: function (parent = $, tag) {
      if (typeof parent === 'string') {
        tag = parent;
        parent = $.root();
      }

      let $res = parent.children(tag);
      if ($res.length === 0) {
        $res = parent.append(`<${tag}/>`).children().first();
      }
      return $res;
    },

    dependencies: function () {
      return this._findOrCreateNode(this.package(), 'dependencies');
    },

    findDependency: function (dep) {
      const [name] = dep.split(':');

      let foundDep;
      this.dependencies().children('dependency').each(function (i, elt) {
        const [depName] = $(elt).text().split(':');

        if (depName === name) {
          foundDep = $(elt);
          return false;
        }
      });

      return foundDep;
    },

    addDependency: function (dep) {
      // Do not override
      if (this.findDependency(dep)) {
        return false;
      }

      return this.dependencies().append($(`<dependency>${dep}</dependency>`));
    },

    _xml: function () {
      return beautify($.xml(), {
        indent_size: 2,
        preserve_newlines: 1
      });
    },
    save: function (fs, file) {
      fs.write(file || filename, this._xml());
    }
  };
};


module.exports = {
  open: open
};
