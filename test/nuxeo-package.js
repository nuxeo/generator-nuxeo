const tmp = require('tmp');
const assert = require('yeoman-assert');
const nxPkg = require('../utils/nuxeo-package.js');
const fs = require('fs');
const memFs = require('mem-fs');
const editor = require('mem-fs-editor');

describe('Nuxeo Package module', function () {
  describe('with an empty inline xml', function () {

    beforeEach(function () {
      this.pkg = nxPkg.open('<package/>');
    });

    it('can add dependency', function () {
      this.pkg.addDependency('mydep:33');

      const xml = this.pkg._xml();
      assert.match(xml, /<dependency>mydep:33<\/dependency>/);
    });

    it('cannot add dependency twice', function () {
      const dependencyRegex = (version) => {
        return new RegExp(`<dependency>mydep:${version}</dependency>`);
      };
      assert.doesNotMatch(this.pkg._xml(), dependencyRegex(33));
      assert.strictEqual(0, this.pkg.dependencies().children('dependency').length);

      this.pkg.addDependency('mydep:33');
      assert.match(this.pkg._xml(), dependencyRegex(33));

      this.pkg.addDependency('mydep:34');
      assert.doesNotMatch(this.pkg._xml(), dependencyRegex(34));

      assert.strictEqual(1, this.pkg.dependencies().children('dependency').length);
    });
  });

  describe('with an xml file', function () {
    beforeEach(function () {
      this.pomPath = tmp.fileSync({
        prefix: 'package-', postfix: '.xml'
      });
      fs.closeSync(fs.openSync(this.pomPath.name, 'w'));

      this.fs = editor.create(memFs.create());
      this.pkg = nxPkg.open(this.pomPath.name);
    });

    it('can flush content', function () {
      this.pkg.addDependency('my-dep:33');
      this.pkg.addDependency('nd-dep:34');
      this.pkg.addDependency('rd-dep:32');
      this.pkg.save(this.fs, this.pomPath.name);

      const content = this.fs.read(this.pomPath.name);
      assert.strictEqual(3, nxPkg.open(content).dependencies().children('dependency').length);
    });
  });
});
