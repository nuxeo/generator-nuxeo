#!/usr/bin/env node

const helpers = require('yeoman-test');
const assert = require('yeoman-assert');
const path = require('path');
const log = require('yeoman-environment/lib/util/log')();

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
