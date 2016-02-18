#!/usr/bin/env node

/*eslint camelcase:0*/
'use strict';

var yo = require('yeoman-environment');
var path = require('path');
var mkdirp = require('mkdirp');
var child_process = require('child_process');
var fs = require('fs');
var log = require('yeoman-environment/lib/util/log')();
var async = require('async');

var tmp = path.join(path.dirname(__filename), '..', '/tmp');
if (fs.existsSync(tmp)) {
  console.log('Cleaning an existing folder.')
  child_process.execSync('rm -rf ' + tmp);
}
mkdirp.sync(tmp);
process.chdir(tmp);
console.log('Working directory is: ' + tmp);

/**ADAPTER*/
var Adapter = function() {};
Adapter.prototype.prompt = function(questions, callback) {
  // Handling diff prompt

  var res = {};
  questions.forEach(function(question) {
    if (!this._responses[question.name] && !question.default) {
      this.log.error('No response found for: ' + question.name);
      res[question.name] = '';
    } else {
      res[question.name] = this._responses[question.name] || question.default;
    }
  }.bind(this));

  callback(res);
};

Adapter.prototype.diff = function() {
  return 'Y';
};

Adapter.prototype.log = log;

Adapter.prototype.responses = function(responses) {
  this._responses = responses;
};
/***************/

var adapter = new Adapter();
var env = yo.createEnv(undefined, undefined, adapter);

env.register(require.resolve(path.join(__dirname, '../generators/app/index.js')), 'nuxeo:test');
async.waterfall([function(callback) {
  // Bootstrap the project and a first Operation
  adapter.responses({
    parent_artifact: 'nuxeo-addons-parent',
    parent_package: 'org.nuxeo',
    parent_version: '8.2-SNAPSHOT',
    artifact: 'my-test-artifact',
    package: 'org.nuxeo.generator.sample',
    version: '1.0-SNAPSHOT',
    name: 'My Test Artifact',
    operation_name: 'GeneratedOperation',
    operation_label: 'My Generated Operation'
  });

  env.run('nuxeo:test operation', callback);
}, function(callback) {
  // Add it an aync Listener
  adapter.responses({
    package: 'org.nuxeo.generator.sample',
    listener_name: 'MyAsyncListener',
    events: ['documentCreated', 'aboutToCreate', 'documentRemoved'],
    custom_events: [],
    async: true
  });

  env.run('nuxeo:test listener', callback);
}, function(callback) {
  // Add it a sync Listener
  adapter.responses({
    package: 'org.nuxeo.generator.sample',
    listener_name: 'MySyncListener',
    events: ['documentCreated', 'aboutToCreate', 'documentRemoved'],
    custom_events: ['myEvent', 'fakeEvent'],
    async: false
  });

  env.run('nuxeo:test listener', callback);
}, function(callback) {
  // Add it a Service
  adapter.responses({
    package: 'org.nuxeo.generator.sample',
    service_name: 'MyTestGeneratedService'
  });

  env.run('nuxeo:test service', callback);
}], function() {
  log.error('Generation done.');
  log.info('Spawning generated code test with Maven:');
  var mvn = child_process.spawn('mvn', ['test']);

  mvn.stdout.on('data', function(data) {
    log(data.toString().trim());
  });

  mvn.stderr.on('data', function(data) {
    log(data.toString().trim());
  });

  mvn.on('exit', function(code) {
    process.exit(code);
  });
});
