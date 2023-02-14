const assert = require('yeoman-assert');
const _ = require('lodash');
const helpers = require('yeoman-test');
// const path = require('path');
const nuxeoGenerator = require('../generators/app');

describe('nuxeo-base', function() {
  this.timeout(5000);

  before(function(done) {
    // Hack as Jenkins clone git repo in arbitrary folder names
    // const basePath = path.join(__dirname, '..');
    // const namespace = basePath.lastIndexOf('generator-') >= 0 ? basePath.substr(basePath.lastIndexOf('generator-') + 'generator-'.length) : basePath.substr(1).replace(new RegExp(path.sep, 'g'), ':');
    helpers.run(nuxeoGenerator, { 
      resolved: require.resolve('../generators/app/index.js'),
      namespace: 'nuxeo:app'
    }).then(function(dir) {
      this.remote = dir;
      done();
    });
    
    // this.gene = helpers.createGenerator(namespace + ':app', ['./generators/app']).then(function(err, remote) {
    //   this.remote = remote;
    // });

    // this.gene.run(this, function(err, remote) {
    //   this.remote = remote;
    // });

    // this.init = this.gene._init();
    // this.init.fetch.call(this.gene, function(err, remote) {
    //   this.remote = remote;
    //   this.gene.nuxeo = {
    //     cachePath: this.remote
    //   };
    //   this.init.readDescriptor.call(this.gene, this.gene.nuxeo, done);
    // }.bind(this));
  });

  it('clone the repository', function() {
    assert.ok(this.remote);
  });

  it('read the descriptor', function() {
    assert.ok(this.gene.nuxeo);
    assert.ok(_.keys(this.gene.nuxeo.modules).length > 0);
    assert.ok(this.gene.nuxeo.modules['single-module']);
  });

  it('resolve module heritance', function() {
    // Single module
    let deps = this.gene._moduleFindParents(['single-module']);
    assert.deepEqual(['single-module'], deps);

    // Operation
    deps = this.gene._moduleFindParents(['operation']);
    assert.deepEqual(['single-module', 'operation'], deps);

    // Nuxeo Package
    deps = this.gene._moduleFindParents(['package']);
    assert.deepEqual(['package'], deps);

    // Operation and Nuxeo Package
    deps = this.gene._moduleFindParents(['package', 'operation']);
    assert.deepEqual(['package', 'operation'], deps);
  });

  it('detect if multi module is needed or not', function() {
    this.gene.args = [];
    assert.ok(this.gene._createMultiModuleIsNeeded([]));
    assert.ok(this.gene._createMultiModuleIsNeeded(['core']));
    assert.ok(this.gene._createMultiModuleIsNeeded(['core', 'web']));

    this.gene.args = ['operation'];
    assert.ok(!this.gene._createMultiModuleIsNeeded([]));
    assert.ok(!this.gene._createMultiModuleIsNeeded(['core']));

    this.gene.args = ['single-module', 'polymer'];
    assert.ok(this.gene._createMultiModuleIsNeeded(['core', 'web']));

    this.gene.args = ['single-module', 'multi-module'];
    assert.ok(this.gene._createMultiModuleIsNeeded(['core']));
  });
});
