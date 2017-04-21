#!/usr/bin/env node

/*eslint camelcase:0*/
const _ = require('lodash');
const request = require('sync-request');
const rimraf = require('rimraf');

// Fetch Target Plaforms from Connect
const response = request('GET', 'https://connect.nuxeo.com/nuxeo/restAPI/target-platforms').getBody('UTF-8');

// Get the default one.
const NUXEO_VERSION = _(JSON.parse(response)).find((targetPlatform) => {
  return targetPlatform.default && targetPlatform.name !== 'cmf';
}).version;

var branch = process.argv.length > 3 ? process.argv[3] : 'master';
var version = process.argv.length > 2 ? process.argv[2] : NUXEO_VERSION;
if (version === 'latest') {
  version = NUXEO_VERSION;
}

var yo = require('yeoman-environment');
var path = require('path');
var mkdirp = require('mkdirp');
var fs = require('fs');
var log = require('yeoman-environment/lib/util/log')();
var async = require('async');

// Prepare a ./tmp folder to generate everything
var tmp = path.join(path.dirname(__filename), '..', '/tmp');
if (fs.existsSync(tmp)) {
  log.info('Cleaning an existing folder.');
  rimraf.sync(tmp);
}

mkdirp.sync(tmp);
process.chdir(tmp);
log.info('Working directory is: ' + tmp);
log.info('Using branch: ' + branch);
log.info('Nuxeo version: ' + version);

/** ADAPTER */
const Adapter = function () {};
Adapter.prototype.prompt = function (questions, callback) {
  // Handling diff prompt
  var res = {};
  questions.forEach(function (question) {
    if (!this._responses[question.name] && !question.default) {
      this.log.error('No response found for: ' + question.name);
      res[question.name] = undefined;
    } else {
      res[question.name] = this._responses[question.name] || question.default;
    }
  }.bind(this));

  res.action = 'force';
  callback(res);
};

Adapter.prototype.diff = function () {
  return 'Y';
};

Adapter.prototype.log = log;

Adapter.prototype.responses = function (responses) {
  this._responses = responses;
};
/***************/

var adapter = new Adapter();
var env = yo.createEnv(undefined, undefined, adapter);

env.register(require.resolve(path.join(__dirname, '../generators/app/index.js')), 'nuxeo:test');

async.waterfall([function (callback) {
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
}, function (callback) {
  // Bootstrap the project and a first Operation
  adapter.responses({
    artifact: 'my-test-core',
    package: 'org.nuxeo.generator.sample',
    version: '1.0-SNAPSHOT',
    operation_name: 'MyOperation',
    operation_label: 'My Test Operation'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true operation`, callback);
}, function (callback) {
  // Add it an aync Listener
  adapter.responses({
    package: 'org.nuxeo.generator.sample',
    listener_name: 'MyAsyncListener',
    events: ['documentCreated', 'aboutToCreate', 'documentRemoved'],
    custom_events: [],
    async: true
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true listener`, callback);
}, function (callback) {
  // Add a Polymer app in web module
  adapter.responses({
    artifact: 'my-polymer-app-artifact',
    name: 'Sample-polymer-app',
    route: 'myPolymerApp'
  });

  env.run(`nuxeo:test --meta=${branch} --skipInstall=true --nologo=true polymer`, callback);
}, function (callback) {
  // Add a Polymer app
  adapter.responses({
    artifact: 'my-angular-app-artifact',
    name: 'Sample-angular-app',
    route: 'myAngularApp'
  });

  env.run(`nuxeo:test --meta=${branch} --type=angu --skipInstall=true --nologo=true angular2`, callback);
}, function (callback) {
  // Add a ReactJS app
  adapter.responses({
    artifact: 'my-reactjs-app-artifact',
    name: 'Sample-reactjs-app',
    route: 'myReactApp'
  });

  env.run(`nuxeo:test --meta=${branch} --type=reactjs --skipInstall=true --nologo=true reactjs`, callback);
}, function (callback) {
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
}, function (callback) {
  // Add it a Service
  adapter.responses({
    package: 'org.nuxeo.generator.sample',
    service_name: 'MyTestGeneratedService'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true service`, callback);
}, function (callback) {
  // Add a DocumentAdapter
  adapter.responses({
    package: 'org.nuxeo.generator.sample',
    doctype: 'File'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true adapter`, callback);
}, function (callback) {
  // Add it a Service in a new artifact
  adapter.responses({
    artifact: 'my-test-web-artifact',
    package: 'org.nuxeo.generator.sample',
    service_name: 'MyTestGeneratedService'
  });

  env.run(`nuxeo:test --type=service --meta=${branch} --nologo=true service`, callback);
}, function (callback) {
  // Add a DocumentModel enricher
  adapter.responses({
    package: 'org.nuxeo.generator.sample.enricher',
    enricher_name: 'SampleDoc',
    entity_type: 'org.nuxeo.ecm.core.api.DocumentModel'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true enricher`, callback);
}, function (callback) {
  // Add a NuxeoPrincipal enricher
  adapter.responses({
    package: 'org.nuxeo.generator.sample.enricher',
    enricher_name: 'SamplePrincipal',
    entity_type: 'org.nuxeo.ecm.core.api.NuxeoPrincipal'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true enricher`, callback);
}, function (callback) {
  // Add it a Package
  adapter.responses({
    artifact: 'my-test-jsf',
    package: 'org.nuxeo.generator.sample.jsf',
    controller_name: 'MyController',
    action_name: 'PrettyCool'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true seam-controller seam-action`, callback);
}, function (callback) {
  // Add it a Package
  adapter.responses({
    artifact: 'my-test-package',
    name: 'My test package',
    company: 'Nuxeo'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true package`, callback);
}, function (callback) { // Unit Testing - CoreFeature
  adapter.responses({
    package: 'org.nuxeo.generator.tests',
    test_name: 'EmptyCoreTest',
    runner_feature: 'CoreFeature'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true test-empty`, callback);
}, function (callback) { // Unit Testing - PlatformFeature
  adapter.responses({
    package: 'org.nuxeo.generator.tests',
    test_name: 'EmptyPlatformTest',
    runner_feature: 'PlatformFeature'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true test-empty`, callback);
}, function (callback) { // Unit Testing - AutomationFeature
  adapter.responses({
    package: 'org.nuxeo.generator.tests',
    test_name: 'EmptyAutomationTest',
    runner_feature: 'AutomationFeature'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true test-empty`, callback);
}, function (callback) { // Unit Testing - EmbeddedAutomationServerFeature
  adapter.responses({
    package: 'org.nuxeo.generator.tests',
    test_name: 'EmptyEmbeddedAutomationTest',
    runner_feature: 'EmbeddedAutomationServerFeature'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true test-empty`, callback);
}, function (callback) { // Unit Testing - AuditFeature
  adapter.responses({
    package: 'org.nuxeo.generator.tests',
    test_name: 'EmptyAuditTest',
    runner_feature: 'AuditFeature'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true test-empty`, callback);
}, function (callback) { // Unit Testing - AuditFeature
  adapter.responses({
    package: 'org.nuxeo.generator.tests',
    contribution_name: 'MySampleContribution',
    target: 'org.nuxeo.ecm.core.event.EventServiceComponent',
    point: 'listener'
  });

  env.run(`nuxeo:test --meta=${branch} --nologo=true contribution`, callback);
}]);
