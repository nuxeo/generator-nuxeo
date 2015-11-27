'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-generator').test;
var maven = require('../maven.js');
var memFs = require('mem-fs');
var editor = require('mem-fs-editor');
var path = require('path');

describe('maven', function() {
  before(function(done) {
    var store = memFs.create();
    this.fs = editor.create(store);

    done();
  });

  it('add dependency', function() {
    var pomPath = path.join(__dirname, "templates", "pom.xml"),
      mvn = maven.open(pomPath);

    mvn.addDependency('org.nuxeo.addon', 'mynewadon');
    mvn.save(this.fs);

    var content = this.fs.read(pomPath);
    console.log(content);
    assert.notEqual(null, content.match(
      "mynewadon"));
    assert.notEqual(null, content.match(
      "<dependency>"));
  });
});
