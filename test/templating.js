const assert = require('yeoman-assert');
const recursiveSync = require('../utils/recursive-readdirSync.js');
const path = require('path');
const tplPath = require('../generators/app/nuxeo-base.js').prototype._tplPath;
const s = require('../utils/nuxeo.string.js');
const _ = require('lodash');

describe('Templating', function() {
  before(function() {
    this.props = {
      name: 'mybundle',
      package: 'org.nuxeo.addon.something'
    };
  });

  it('can render variable', function() {
    assert.equal('/blabla/', tplPath('/blabla/', this.props));
    assert.equal('/mybundle/', tplPath('/{{name}}/', this.props));
  });

  it('can apply transformation', function() {
    assert.equal('/Mybundle/', tplPath('/{{s.capitalize(name)}}/', this.props));
    assert.equal('org/nuxeo/addon/something', tplPath('{{s.replaceAll(package, "\\\\.", "/")}}', this.props));
  });

  it('can render Java file path', function() {
    assert.equal('src/test/java/org/nuxeo/addon/something/TestMybundle.java',
      tplPath('src/test/java/{{s.replaceAll(package, \'\\\\.\', \'/\')}}/Test{{s.capitalize(name)}}.java', this.props));
  });

  it('can unpackagize string', function() {
    assert.equal(path.join('org', 'nuxeo', 'something'), tplPath('{{s.unpackagize(\'org.nuxeo.something\')}}'));
  });

  it('can resolve a templates path path', function() {
    const expect = path.join('src', 'org', 'nuxeo', 'dummy', 'test', 'test-my-name.txt');
    const ctx = {
      package: 'org.nuxeo.dummy',
      name: 'TestMyName'
    };

    const files = recursiveSync(path.join(__dirname, './paths'), ['.DS_Store']);

    _.forEach(files, function(file) {
      const dest = tplPath(file, ctx);

      const filename = path.basename(dest);
      if (!s.startsWith(filename, '.')) {

        assert.ok(s.endsWith(dest, expect));
      }
    });
  });
});
