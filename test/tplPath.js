'use strict';
var assert = require('yeoman-assert');
var _ = require('lodash');
var s = require('underscore.string');

// XXX Use the real generator method
function tplPath(str, ctx) {
  var regex = /{{([\s\S]+?)}}/g;
  return _.template(str, {
    interpolate: regex,
    imports: {
      s: s
    }
  })(ctx);
}

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
});
