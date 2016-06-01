'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var maven = require('../utils/maven.js');
var memFs = require('mem-fs');
var editor = require('mem-fs-editor');

describe('Maven module can', function() {
  function openPomFile(fs, filename) {
    var pomPath = path.join(__dirname, 'templates', filename);
    return maven.open(fs.read(pomPath));
  }

  before(function() {
    this.pomPath = path.join(__dirname, 'templates', 'pom.xml');
  });

  beforeEach(function() {
    this.fs = editor.create(memFs.create());
    this.pom = maven.open(this.fs.read(this.pomPath));
  });

  it('add dependency', function() {
    assert.equal(0, this.pom.dependencies().length);
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon-core');
    assert.equal(1, this.pom.dependencies().length);
  });

  it('can read name and group id', function() {
    assert.equal('myartifact', this.pom.artifactId());
    // Inherited groupId
    assert.equal('org.nuxeo.sandbox', this.pom.groupId());

    var bom = openPomFile(this.fs, 'bom.xml');
    assert.equal('myartifact-parent', bom.artifactId());
    assert.equal('org.nuxeo.sandbox', bom.groupId());
  });

  it('write beautified file content', function() {
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon');
    this.pom.save(this.fs, this.pomPath);

    var content = this.fs.read(this.pomPath);
    assert.notEqual(null, content.match('mynewadon'));
    assert.notEqual(null, content.match('<dependency>'));
    assert.notEqual(null, content.match('<artifactId>'));
    assert.notEqual(null, content.match('<groupId>'));
  });

  it('not add wrong dependency', function() {
    assert.equal(null, this.pom.addDependency('org.nuxeo.addon'));
    assert.notEqual(null, this.pom.addDependency('org.nuxeo.addon', 'something'));
  });

  it('find existing dependency', function() {
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon-core');
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon-api');
    var dep = {
      artifactId: 'mynewaddon',
      groupId: 'org.nuxeo.addon'
    };
    assert.equal(false, this.pom.containsDependency(dep));
    dep = this.pom.addDependency('org.nuxeo.addon', 'mynewaddon');
    assert.equal(true, this.pom.containsDependency(dep));
  });

  it('add dependency independantly of the GAV', function() {
    var dep = this.pom.addDependency('org.nuxeo.addon:mynewadon-core');
    assert.equal('org.nuxeo.addon', dep.groupId);
    assert.equal('mynewadon-core', dep.artifactId);

    dep = this.pom.addDependency('org.nuxeo.addon', 'mynewadon-pfiu');
    assert.equal('org.nuxeo.addon', dep.groupId);
    assert.equal('mynewadon-pfiu', dep.artifactId);

    dep = this.pom.addDependency('org.nuxeo.addon:mynewadon-web:1.1-SNAPSHOT');
    assert.equal('org.nuxeo.addon', dep.groupId);
    assert.equal('mynewadon-web', dep.artifactId);
    assert.equal('1.1-SNAPSHOT', dep.version);

    dep = this.pom.addDependency('org.nuxeo.addon:mynewadon-jar:1.1-SNAPSHOT:jar');
    assert.equal('org.nuxeo.addon', dep.groupId);
    assert.equal('mynewadon-jar', dep.artifactId);
    assert.equal('1.1-SNAPSHOT', dep.version);
    assert.equal('jar', dep.extension);

    dep = this.pom.addDependency('org.nuxeo.addon:mynewadon-jar::jar');
    assert.equal('org.nuxeo.addon', dep.groupId);
    assert.equal('mynewadon-jar', dep.artifactId);
    assert.equal('jar', dep.extension);

    dep = this.pom.addDependency('org.nuxeo.addon:mynewadon-test:1.1-SNAPSHOT:pom:test');
    assert.equal('org.nuxeo.addon', dep.groupId);
    assert.equal('mynewadon-test', dep.artifactId);
    assert.equal('1.1-SNAPSHOT', dep.version);
    assert.equal('pom', dep.extension);
    assert.equal('test', dep.classifier);
  });

  it('not add a dependency twice', function() {
    assert.equal(0, this.pom.dependencies().length);
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon-core');
    assert.equal(1, this.pom.dependencies().length);
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon-api');
    assert.equal(2, this.pom.dependencies().length);
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon-api');
    assert.equal(2, this.pom.dependencies().length);
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon-api', undefined, 'test-jar');
    assert.equal(3, this.pom.dependencies().length);
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon-api', '4.5-SNAP');
    assert.equal(4, this.pom.dependencies().length);
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon-api', '4.5-SNAP');
    assert.equal(4, this.pom.dependencies().length);
  });

  it('convert dependency to XML node', function() {
    var dep = this.pom.addDependency('org.nuxeo.addon:mynewadon-jar:1.1-SNAPSHOT:jar:test');
    var xml = this.pom.convertToXml(dep);
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

    dep = this.pom.addDependency('org.nuxeo.addon:mynewadon-jar::jar');
    xml = this.pom.convertToXml(dep);
    assert.equal(1, xml.find('artifactId').length);
    assert.equal(0, xml.find('version').length);
  });

  it('add child module', function() {
    assert.equal(0, this.pom.modules().length);
    this.pom.addModule('my-module-core');
    assert.equal(1, this.pom.modules().length);
    this.pom.addModule('my-module-core');
    assert.equal(1, this.pom.modules().length);
    this.pom.addModule('my-module-web');
    assert.equal(2, this.pom.modules().length);
  });

  it('add dependency to the dependencyManagement', function() {
    var bom = openPomFile(this.fs, 'bom.xml');
    assert.equal(0, bom.dependencies().length);
    bom.addDependency('org.nuxeo.addon:mynewadon-jar:1.0');
    assert.equal(1, bom.dependencies().length);

    assert.ok(bom._xml().match('<dependencyManagement>'));
  });

  it('handle pom without expected nodes', function() {
    var pom = openPomFile(this.fs, 'pom-without-deps.xml');

    // Ensure there is any nodes
    assert.ok(!pom._xml().match('<dependencies'));
    assert.ok(!pom._xml().match('<dependencyManagement'));

    // Add dependency
    assert.equal(0, pom.dependencies().length);
    pom.addDependency('org.nuxeo.addon:mynewadon-jar:1.0');
    assert.equal(1, pom.dependencies().length);

    // Ensure dependency has not been added to the deps management
    assert.ok(pom._xml().match('<dependencies'));
    assert.ok(!pom._xml().match('<dependencyManagement'));

    // add Modules the same way
    assert.ok(!pom._xml().match('<modules'));

    assert.equal(0, pom.modules().length);
    pom.addModule('my-ultra-module');
    assert.equal(1, pom.modules().length);

    assert.ok(pom._xml().match('<modules'));
  });

});
