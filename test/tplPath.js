'use strict';
var assert = require('yeoman-assert');
var tplPath = require('../generators/app/nuxeo-base.js').prototype._tplPath;

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
});
