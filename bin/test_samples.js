#!/usr/bin/env node
var helpers = require('yeoman-test');
var assert = require('yeoman-assert');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var child_process = require('child_process');
var log = require('yeoman-environment/lib/util/log')();

// Prepare a ./tmp folder to generate everything
var tmp = path.join(path.dirname(__filename), '..', '/tmp-sample');
if (fs.existsSync(tmp)) {
  log.info('Cleaning an existing folder.');
  child_process.execSync('rm -rf ' + tmp);
}
mkdirp.sync(tmp);
process.chdir(tmp);
log.info('Working directory is: ' + tmp);

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
    assert.file(path.join(dir, 'nuxeo-sample-project-master', 'pom.xml'));
    assert.file(path.join(dir, 'nuxeo-sample-project-maewester', 'pom.xmlsew'));
  }).catch((err) => {
    console.log(err);
    process.exit(1);
  });
