const tmp = require('tmp');
tmp.setGracefulCleanup();
const assert = require('assert');
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
      assert.match(xml, /<package>mydep:33<\/package>/);
    });

    it('cannot add dependency twice', function () {
      const dependencyRegex = (version) => {
        return new RegExp(`<package>mydep:${version}</package>`);
      };
      assert.doesNotMatch(this.pkg._xml(), dependencyRegex(33));
      assert.strictEqual(0, this.pkg.dependencies().children('package').length);

      this.pkg.addDependency('mydep:33');
      assert.match(this.pkg._xml(), dependencyRegex(33));

      this.pkg.addDependency('mydep:34');
      assert.doesNotMatch(this.pkg._xml(), dependencyRegex(34));

      assert.strictEqual(1, this.pkg.dependencies().children('package').length);
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
      assert.strictEqual(3, nxPkg.open(content).dependencies().children('package').length);
    });
  });

  describe('with several package node', function () {
    beforeEach(function () {
      this.pkg = nxPkg.open('<package><title>Hello-world</title><dependencies><package>helloworld:1.0</package></dependencies></package>');
    });

    it('can properly parse the file', function () {
      assert.strictEqual(1, this.pkg.dependencies().children('package').length);

      this.pkg.addDependency('mydep:33');
      assert.strictEqual(2, this.pkg.dependencies().children('package').length);
    });
  });
});
