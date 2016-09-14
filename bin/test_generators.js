#!/usr/bin/env node
/*eslint camelcase:0*/

const NUXEO_VERSION = '8.3';

var branch = process.argv.length > 3 ? process.argv[3] : 'master';
var version = process.argv.length > 2 ? process.argv[2] : NUXEO_VERSION;
if (version === 'latest') {
  version = NUXEO_VERSION;
}

var yo = require('yeoman-environment');
var path = require('path');
var mkdirp = require('mkdirp');
var child_process = require('child_process');
var fs = require('fs');
var log = require('yeoman-environment/lib/util/log')();
var async = require('async');

// Prepare a ./tmp folder to generate everything
var tmp = path.join(path.dirname(__filename), '..', '/tmp');
if (fs.existsSync(tmp)) {
  log.info('Cleaning an existing folder.');
  child_process.execSync('rm -rf ' + tmp);
}
mkdirp.sync(tmp);
process.chdir(tmp);
log.info('Working directory is: ' + tmp);
log.info('Using branch: ' + branch);
log.info('Nuxeo version: ' + version);

/** ADAPTER */
var Adapter = function() {};
Adapter.prototype.prompt = function(questions, callback) {
  // Handling diff prompt

  var res = {};
  questions.forEach(function(question) {
    if (!this._responses[question.name] && !question.default) {
      this.log.error('No response found for: ' + question.name);
      res[question.name] = undefined;
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
  // Bootstrap the parent and the core module
  adapter.responses({
    super_artifact: 'nuxeo-distribution',
    super_package: 'org.nuxeo.ecm.distribution',
    super_version: version,
    parent_artifact: 'my-test-parent',
    parent_package: 'org.nuxeo.generator.sample',
    parent_version: '1.0-SNAPSHOT',
    nuxeo_version: version,
    artifact: 'my-test-core',
    package: 'org.nuxeo.generator.sample',
    version: '1.0-SNAPSHOT',
    operation_name: 'GeneratedOperation',
    operation_label: 'My Generated Operation'
  });

  env.run(`nuxeo:test --meta=${branch} multi-module`, callback);
}, function(callback) {
  // Bootstrap the project and a first Operation
  adapter.responses({
    artifact: 'my-test-artifact',
    package: 'org.nuxeo.generator.sample',
    version: '1.0-SNAPSHOT',
    operation_name: 'MyOperation',
    operation_label: 'My Test Operation'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true operation`, callback);
}, function(callback) {
  // Add it an aync Listener
  adapter.responses({
    package: 'org.nuxeo.generator.sample',
    listener_name: 'MyAsyncListener',
    events: ['documentCreated', 'aboutToCreate', 'documentRemoved'],
    custom_events: [],
    async: true
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true listener`, callback);
}, function(callback) {
  // Add a Polymer app in web module
  adapter.responses({
    artifact: 'my-polymer-app-artifact',
    name: 'Sample-polymer-app',
    route: 'myPolymerApp'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true polymer`, callback);
}, function(callback) {
  // Add a Polymer app in web module
  adapter.responses({
    artifact: 'my-angular-app-artifact',
    name: 'Sample-angular-app',
    route: 'myAngularApp'
  });

  env.run(`nuxeo:test --meta=${branch} --type=angu --nologo=true angular2`, callback);
}, function(callback) {
  // Add it a sync Listener
  adapter.responses({
    artifact: 'my-test-listener-artifact',
    package: 'org.nuxeo.generator.sample',
    listener_name: 'MySyncListener',
    events: ['documentCreated', 'aboutToCreate', 'documentRemoved'],
    custom_events: ['myEvent', 'fakeEvent'],
    async: false
  });

  env.run(`nuxeo:test --type=listener --meta=${branch} --nologo=true listener`, callback);
}, function(callback) {
  // Add it a Service
  adapter.responses({
    package: 'org.nuxeo.generator.sample',
    service_name: 'MyTestGeneratedService'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true service`, callback);
}, function(callback) {
  // Add a DocumentAdapter
  adapter.responses({
    package: 'org.nuxeo.generator.sample',
    doctype: 'File'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true adapter`, callback);
}, function(callback) {
  // Add it a Service in a new artifact
  adapter.responses({
    artifact: 'my-test-web-artifact',
    package: 'org.nuxeo.generator.sample',
    service_name: 'MyTestGeneratedService'
  });

  env.run(`nuxeo:test --type=service --meta=${branch} --nologo=true service`, callback);
}, function(callback) {
  // Add a DocumentModel enricher
  adapter.responses({
    package: 'org.nuxeo.generator.sample.enricher',
    enricher_name: 'SampleDoc',
    entity_type: 'org.nuxeo.ecm.core.api.DocumentModel'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true enricher`, callback);
}, function(callback) {
  // Add a NuxeoPrincipal enricher
  adapter.responses({
    package: 'org.nuxeo.generator.sample.enricher',
    enricher_name: 'SamplePrincipal',
    entity_type: 'org.nuxeo.ecm.core.api.NuxeoPrincipal'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true enricher`, callback);
}, function(callback) {
  // Add it a Package
  adapter.responses({
    artifact: 'my-test-package',
    name: 'My test package',
    company: 'Nuxeo'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true package`, callback);
}]);
