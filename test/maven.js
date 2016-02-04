'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var maven = require('../utils/maven.js');
var memFs = require('mem-fs');
var editor = require('mem-fs-editor');

describe('Test Maven module, that can', function() {
  before(function() {
    this.pomPath = path.join(__dirname, 'templates', 'pom.xml');
  });

  beforeEach(function() {
    this.fs = editor.create(memFs.create());
    this.mvn = maven.open(this.fs.read(this.pomPath));
  });

  it('add dependency', function() {
    assert.equal(0, this.mvn.dependencies().length);
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon-core');
    assert.equal(1, this.mvn.dependencies().length);
  });

  it('write beautified file content', function() {
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon');
    this.mvn.save(this.fs, this.pomPath);

    var content = this.fs.read(this.pomPath);
    assert.notEqual(null, content.match('mynewadon'));
    assert.notEqual(null, content.match('<dependency>'));
    assert.notEqual(null, content.match('<artifactId>'));
    assert.notEqual(null, content.match('<groupId>'));
  });

  it('not add wrong dependency', function() {
    assert.equal(null, this.mvn.addDependency('org.nuxeo.addon'));
    assert.notEqual(null, this.mvn.addDependency('org.nuxeo.addon', 'something'));
  });

  it('find existing dependency', function() {
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon-core');
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon-api');
    assert.equal(false, this.mvn.containsDependency('org.nuxeo.addon', 'mynewadon'));
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon');
    assert.equal(true, this.mvn.containsDependency('org.nuxeo.addon', 'mynewadon'));
  });

  it('add dependency independantly of the GAV', function() {
    var dep = this.mvn.addDependency('org.nuxeo.addon:mynewadon-core');
    assert.equal('org.nuxeo.addon', dep.groupId);
    assert.equal('mynewadon-core', dep.artifactId);

    dep = this.mvn.addDependency('org.nuxeo.addon', 'mynewadon-pfiu');
    assert.equal('org.nuxeo.addon', dep.groupId);
    assert.equal('mynewadon-pfiu', dep.artifactId);

    dep = this.mvn.addDependency('org.nuxeo.addon:mynewadon-web:1.1-SNAPSHOT');
    assert.equal('org.nuxeo.addon', dep.groupId);
    assert.equal('mynewadon-web', dep.artifactId);
    assert.equal('1.1-SNAPSHOT', dep.version);

    dep = this.mvn.addDependency('org.nuxeo.addon:mynewadon-jar:1.1-SNAPSHOT:jar');
    assert.equal('org.nuxeo.addon', dep.groupId);
    assert.equal('mynewadon-jar', dep.artifactId);
    assert.equal('1.1-SNAPSHOT', dep.version);
    assert.equal('jar', dep.extension);

    dep = this.mvn.addDependency('org.nuxeo.addon:mynewadon-jar::jar');
    assert.equal('org.nuxeo.addon', dep.groupId);
    assert.equal('mynewadon-jar', dep.artifactId);
    assert.equal('jar', dep.extension);

    dep = this.mvn.addDependency('org.nuxeo.addon:mynewadon-test:1.1-SNAPSHOT:pom:test');
    assert.equal('org.nuxeo.addon', dep.groupId);
    assert.equal('mynewadon-test', dep.artifactId);
    assert.equal('1.1-SNAPSHOT', dep.version);
    assert.equal('pom', dep.extension);
    assert.equal('test', dep.classifier);
  });

  it('not add a dependency twice', function() {
    assert.equal(0, this.mvn.dependencies().length);
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon-core');
    assert.equal(1, this.mvn.dependencies().length);
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon-api');
    assert.equal(2, this.mvn.dependencies().length);
    this.mvn.addDependency('org.nuxeo.addon', 'mynewadon-api');
    assert.equal(2, this.mvn.dependencies().length);
  });

  it('convert dependency to XML node', function() {
    var dep = this.mvn.addDependency('org.nuxeo.addon:mynewadon-jar:1.1-SNAPSHOT:jar:test');
    var xml = this.mvn.convertToXml(dep);
    assert.equal(1, xml.find('groupId').length);
    assert.equal(1, xml.find('artifactId').length);
    assert.equal(1, xml.find('version').length);
    assert.equal(1, xml.find('type').length);
    assert.equal(1, xml.find('scope').length);
    assert.equal(0, xml.find('missingNode').length);

    assert.equal('org.nuxeo.addon', xml.find('groupId').text());
    assert.equal('mynewadon-jar', xml.find('artifactId').text());
    assert.equal('1.1-SNAPSHOT', xml.find('version').text());
    assert.equal('jar', xml.find('type').text());
    assert.equal('test', xml.find('scope').text());

    dep = this.mvn.addDependency('org.nuxeo.addon:mynewadon-jar::jar');
    xml = this.mvn.convertToXml(dep);
    assert.equal(1, xml.find('artifactId').length);
    assert.equal(0, xml.find('version').length);
  });

  it('add child module', function() {
    assert.equal(0, this.mvn.modules().length)
    this.mvn.addModule('my-module-core');
    assert.equal(1, this.mvn.modules().length)
    this.mvn.addModule('my-module-core');
    assert.equal(1, this.mvn.modules().length)
    this.mvn.addModule('my-module-web');
    assert.equal(2, this.mvn.modules().length)
  });
});
