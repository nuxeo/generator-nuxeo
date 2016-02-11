'use strict';
var assert = require('yeoman-assert');
var recursiveSync = require('../utils/recursive-readdirSync.js');
var path = require('path');
var tplPath = require('../generators/app/nuxeo-base.js').prototype._tplPath;
var s = require('../utils/nuxeo.string.js');

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
    assert.equal('org/nuxeo/something', tplPath('{{s.unpackagize(\'org.nuxeo.something\')}}'));
  });

  it('can resolve a templates path path', function() {
    var ctx = {
      package: 'org.nuxeo.dummy',
      name: 'TestMyName'
    };

    var files = recursiveSync(path.join(__dirname, './paths'), ['.DS_Store']);
    var dest = tplPath(files[0], ctx);
    assert.ok(s.endsWith(dest, 'src/org/nuxeo/dummy/test/test-my-name.txt'));
  });
});
