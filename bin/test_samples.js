#!/usr/bin/env node

var helpers = require('yeoman-test');
var assert = require('yeoman-assert');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var childProcess = require('child_process');
var log = require('yeoman-environment/lib/util/log')();

helpers.run(path.join(__dirname, '../generators/sample'))
  .withPrompts({
    repository: {
      user: 'nuxeo',
      repo: 'nuxeo-sample-project'
    },
    branch: 'master'
  })
  .toPromise()
  .then((dir) => {
    log.info('Assert file:' + path.join(dir, 'nuxeo-sample-project-master', 'pom.xml'));
    assert.file(path.join(dir, 'nuxeo-sample-project-master', 'pom.xml'));
  }).catch((err) => {
    log.error(err);
    process.exit(1);
  });
