'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var maven = require('../utils/maven.js');
var memFs = require('mem-fs');
var editor = require('mem-fs-editor');

describe('maven', function() {
  before(function() {
    this.pomPath = path.join(__dirname, 'templates', 'pom.xml');
  });

  beforeEach(function() {
    this.fs = editor.create(memFs.create());
    this.mvn = maven.open(this.pomPath);
  });

  it('add dependency', function() {
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon');
    this.mvn.save(this.fs);

    var content = this.fs.read(this.pomPath);
    assert.notEqual(null, content.match('mynewadon'));
    assert.notEqual(null, content.match('<dependency>'));
  });

  it('find existing dependency', function() {
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon-core');
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon-api');
    assert.equal(false, this.mvn.containsDependency('org.nuxeo.addon', 'mynewadon'));
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon');
    assert.equal(true, this.mvn.containsDependency('org.nuxeo.addon', 'mynewadon'));
  });

  it('do not add a dependency twice', function() {
    assert.equal(0, this.mvn.dependencies().length);
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon-core');
    assert.equal(1, this.mvn.dependencies().length);
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon-api');
    assert.equal(2, this.mvn.dependencies().length);
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon-api');
    assert.equal(2, this.mvn.dependencies().length);
  });
});
