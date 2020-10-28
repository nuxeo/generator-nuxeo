const path = require('path');
const assert = require('yeoman-assert');
const maven = require('../utils/maven.js');
const memFs = require('mem-fs');
const editor = require('mem-fs-editor');

describe('Maven module can', function () {
  function openPomFile(fs, filename) {
    const pomPath = path.join(__dirname, 'templates', filename);
    return maven.open(fs.read(pomPath));
  }

  before(function () {
    this.pomPath = path.join(__dirname, 'templates', 'pom.xml');
  });

  beforeEach(function () {
    this.fs = editor.create(memFs.create());
    this.pom = maven.open(this.fs.read(this.pomPath));
  });

  it('add dependency', function () {
    assert.equal(0, this.pom.dependencies().length);
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon-core');
    assert.equal(1, this.pom.dependencies().length);
  });

  it('add property', function () {
    assert.equal(0, this.pom.properties().length);
    this.pom.addProperty('myPropertyValue', 'myProperty');
    assert.equal(1, this.pom.properties().length);
    assert.equal('myPropertyValue', this.pom.properties()[0].myProperty);
  });

  it('add plugin', function () {
    assert.equal(0, this.pom.plugins().length);
    this.pom.addPlugin({
      groupId: 'com.funny.plugin',
      artifactId: 'my-funny-plugin',
      configuration: {
        prop: 'funny'
      }
    });
    assert.equal(1, this.pom.plugins().length);
    assert.equal('my-funny-plugin', this.pom.plugins()[0].artifactId);
  });

  it('can read name and group id', function () {
    assert.equal('myartifact', this.pom.artifactId());
    // Inherited groupId
    assert.equal('org.nuxeo.sandbox', this.pom.groupId());

    const bom = openPomFile(this.fs, 'bom.xml');
    assert.equal('myartifact-parent', bom.artifactId());
    assert.equal('org.nuxeo.sandbox', bom.groupId());
  });

  it('write beautified file content', function () {
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon');
    this.pom.save(this.fs, this.pomPath);

    const content = this.fs.read(this.pomPath);
    assert.notEqual(null, content.match('mynewadon'));
    assert.notEqual(null, content.match('<dependency>'));
    assert.notEqual(null, content.match('<artifactId>'));
    assert.notEqual(null, content.match('<groupId>'));
  });

  it('not add wrong dependency', function () {
    assert.equal(null, this.pom.addDependency('org.nuxeo.addon'));
    assert.notEqual(null, this.pom.addDependency('org.nuxeo.addon', 'something'));
  });

  it('find existing dependency', function () {
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon-core');
    this.pom.addDependency('org.nuxeo.addon', 'mynewadon-api');
    const dep = {
      artifactId: 'mynewaddon',
      groupId: 'org.nuxeo.addon'
    };
    assert.equal(false, this.pom.containsDependency(dep));
    this.pom.addDependency('org.nuxeo.addon', 'mynewaddon');
    assert.equal(true, this.pom.containsDependency(dep));
    dep.extension = 'test-jar';
    assert.equal(false, this.pom.containsDependency(dep));
    this.pom.addDependency('org.nuxeo.addon:mynewaddon::test-jar:');
    assert.equal(true, this.pom.containsDependency(dep));
  });

  it('add dependency independantly of the GAV', function () {
    let dep = this.pom.addDependency('org.nuxeo.addon:mynewadon-core');
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

  it('not add a dependency twice', function () {
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

  it('not add a property twice', function () {
    assert.strictEqual(0, this.pom.properties().length);
    this.pom.addProperty('myPropertyValue', 'myProperty');
    assert.strictEqual(1, this.pom.properties().length);
    this.pom.addProperty('myOtherPropertyValue', 'myOtherProperty');
    assert.strictEqual(2, this.pom.properties().length);
    this.pom.addProperty('myPropertyValue', 'myProperty'); // same key, same value
    assert.strictEqual(2, this.pom.properties().length);
    this.pom.addProperty('dummyValue', 'myProperty'); // same key, different value
    assert.strictEqual(2, this.pom.properties().length);

    this.pom.addProperty('value', 'my.property.dotted');
    assert.strictEqual(3, this.pom.properties().length);
    this.pom.addProperty('other', 'my.property.dotted');
    assert.strictEqual(3, this.pom.properties().length);
  });

  it('not add a plugin twice', function () {
    assert.equal(0, this.pom.plugins().length);
    this.pom.addPlugin({
      groupId: 'com.funny.plugin',
      artifactId: 'my-funny-plugin',
      configuration: {
        prop: 'funny'
      }
    });
    assert.equal(1, this.pom.plugins().length);
    this.pom.addPlugin({
      groupId: 'com.other.plugin',
      artifactId: 'my-other-plugin'
    });
    assert.equal(2, this.pom.plugins().length);
    this.pom.addPlugin({
      groupId: 'com.funny.plugin',
      artifactId: 'my-funny-plugin'
    });
    assert.equal(2, this.pom.plugins().length);
  });

  it('convert dependency to XML node', function () {
    let dep = this.pom.addDependency('org.nuxeo.addon:mynewadon-jar:1.1-SNAPSHOT:jar:test');
    let xml = this.pom.convertDepToXml(dep);
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
    xml = this.pom.convertDepToXml(dep);
    assert.equal(1, xml.find('artifactId').length);
    assert.equal(0, xml.find('version').length);
  });

  it('add child module', function () {
    assert.equal(0, this.pom.modules().length);
    this.pom.addModule('my-module-core');
    assert.equal(1, this.pom.modules().length);
    this.pom.addModule('my-module-core');
    assert.equal(1, this.pom.modules().length);
    this.pom.addModule('my-module-web');
    assert.equal(2, this.pom.modules().length);
  });

  it('add dependency to the dependencyManagement', function () {
    const bom = openPomFile(this.fs, 'bom.xml');
    assert.equal(0, bom.dependencies().length);
    bom.addDependency('org.nuxeo.addon:mynewadon-jar:1.0');
    assert.equal(1, bom.dependencies().length);

    assert.ok(bom._xml().match('<dependencyManagement>'));
  });

  it('handle pom without expected nodes', function () {
    const pom = openPomFile(this.fs, 'pom-without-deps.xml');

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

  it('read pom packaging', function () {
    let pom = openPomFile(this.fs, 'bom.xml');
    assert.equal('pom', pom.packaging());

    pom = openPomFile(this.fs, 'pom-without-deps.xml');
    // Packaging not specified in this one; and fallback on jar
    assert.equal('jar', pom.packaging());
  });

  it('read version node', function () {
    let pom = openPomFile(this.fs, 'bom.xml');
    assert.equal('1.0-SNAPSHOT', pom.version());

    pom = openPomFile(this.fs, 'pom.xml');
    // Read pom version not parent's one
    assert.equal('1.0-SNAPSHOT', pom.version());

    pom = openPomFile(this.fs, 'pom-without-deps.xml');
    // Fallback on parent's one if empty
    assert.equal('0.1-SNAPSHOT', pom.version());
  });

  it('remove dependency based on gav selection', function () {
    const pom = openPomFile(this.fs, 'pom-to-remove-deps.xml');
    const length = pom.dependencies().length;
    assert.equal(8, length);

    // Try to remove not existing deps
    // Existing dep: org.nuxeo.sample:dummy-conflict-{1..4}:1.0-SNAPSHOT:pom:import
    // Existing dep: org.nuxeo.sample:dummy-conflict-5::pom:import
    // Existing dep: org.nuxeo.sample:dummy-conflict-6::pom
    // Existing dep: org.nuxeo.sample:dummy-conflict-7:::import
    // Existing dep: org.nuxeo.sample:dummy-conflict-8::jar
    pom.removeDependency('org.nuxeo.sample:dummy-conflict-0');
    assert.equal(length, pom.dependencies().length);
    pom.removeDependency('org.nuxeo.sample-p:dummy-conflict-1');
    assert.equal(length, pom.dependencies().length);
    pom.removeDependency('org.nuxeo.sample:dummy-conflict-1:1.1-SNAPSHOT');
    assert.equal(length, pom.dependencies().length);
    pom.removeDependency('org.nuxeo.sample:dummy-conflict-1:1.0-SNAPSHOT:jar');
    assert.equal(length, pom.dependencies().length);
    pom.removeDependency('org.nuxeo.sample:dummy-conflict-1:1.0-SNAPSHOT:pom:test');
    assert.equal(length, pom.dependencies().length);

    pom.removeDependency('org.nuxeo.sample:dummy-conflict-1:1.0-SNAPSHOT:pom:import');
    assert.equal(length - 1, pom.dependencies().length, 'Unable to delete fully qualifier dep.');

    pom.removeDependency('org.nuxeo.sample:dummy-conflict-2:1.0-SNAPSHOT:pom');
    assert.equal(length - 2, pom.dependencies().length, 'Unable to delete dep without classifier.');

    pom.removeDependency('org.nuxeo.sample:dummy-conflict-3:1.0-SNAPSHOT');
    assert.equal(length - 3, pom.dependencies().length, 'Unable to delete dep without classifier and scope.');

    pom.removeDependency('org.nuxeo.sample:dummy-conflict-4');
    assert.equal(length - 4, pom.dependencies().length, 'Unable to delete dep without version, classifier and scope.');

    pom.removeDependency(':dummy-conflict-5');
    assert.equal(length - 4, pom.dependencies().length, 'Dependency should not be deleted without a group');

    pom.removeDependency('org.nuxeo.sample:dummy-conflict-8:1.0-SNAPSHOT');
    assert.equal(length - 5, pom.dependencies().length, 'Dependency should not be deleted without any type and using another type that jar');

    pom.removeDependency('org.nuxeo.sample:dummy-conflict-5:1.0-SNAPSHOT:zip');
    assert.equal(length - 5, pom.dependencies().length, 'Dependency without a version and wrong type');

    pom.removeDependency('org.nuxeo.sample:dummy-conflict-6:1.0-SNAPSHOT:pom:test');
    assert.equal(length - 5, pom.dependencies().length, 'Dependecy with a missing scope should not be deleted');

    pom.removeDependency('org.nuxeo.sample:dummy-conflict-6:1.0-SNAPSHOT:pom');
    assert.equal(length - 6, pom.dependencies().length, 'Should not delete dependency with a specific scope');

    pom.removeDependency('org.nuxeo.sample:dummy-conflict-7:1.0-SNAPSHOT:jar:import');
    assert.equal(length - 7, pom.dependencies().length, 'Dependecy with a missing type should not be deleted');
  });

});
