'use strict';
var assert = require('yeoman-assert');
var _ = require('lodash');
var helpers = require('yeoman-generator').test;


describe('nuxeo-base', function() {
  this.timeout(5000);

  before(function() {
    var deps = ['./generators/app/'];
    this.gene = helpers.createGenerator('nuxeo', deps);
  });

  describe(':init should', function() {
    before(function(done) {
      this.init = this.gene._init;
      this.init.fetchRemote.call(this.gene, function(err, remote) {
        this.remote = remote;
        done(err);
      }.bind(this));
    });

    it('clone the repository', function() {
      assert.ok(this.remote);
    });

    it('read the descriptor', function(done) {
      assert.ok(!this.gene.nuxeo);
      this.init.readDescriptor.call(this.gene, this.remote, done);
      assert.ok(this.gene.nuxeo);
      assert.ok(_.keys(this.gene.nuxeo.modules).length > 0);
      assert.ok(this.gene.nuxeo.modules['single-module']);
    });

    it('resolve module heritance', function() {
      // Single module
      var deps = this.gene._moduleFindParents(['single-module']);
      assert.deepEqual(['single-module', 'default'], deps);

      // Operation
      deps = this.gene._moduleFindParents(['operation']);
      assert.deepEqual(['single-module', 'default', 'operation'], deps);

      // Nuxeo Package
      deps = this.gene._moduleFindParents(['package']);
      assert.deepEqual(['multi-module', 'single-module', 'package'], deps);

      // Operation and Nuxeo Package
      deps = this.gene._moduleFindParents(['package', 'operation']);
      assert.deepEqual(['multi-module', 'single-module', 'default', 'package', 'operation'], deps);
    });
  });
});
