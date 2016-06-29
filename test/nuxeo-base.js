var assert = require('yeoman-assert');
var _ = require('lodash');
var helpers = require('yeoman-test');

describe('nuxeo-base', function() {
  this.timeout(5000);

  before(function(done) {
    var deps = ['./generators/app/'];
    this.gene = helpers.createGenerator('nuxeo', deps);

    this.init = this.gene._init;
    this.init.fetchRemote.call(this.gene, function(err, remote) {
      this.remote = remote;
      this.init.readDescriptor.call(this.gene, this.remote, done);
    }.bind(this));
  });

  describe(':init should', function() {
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
      var deps = this.gene._moduleFindParents(['single-module']);
      assert.deepEqual(['single-module'], deps);

      // Operation
      deps = this.gene._moduleFindParents(['operation']);
      assert.deepEqual(['single-module', 'operation'], deps);

      // Nuxeo Package
      deps = this.gene._moduleFindParents(['package']);
      assert.deepEqual(['single-module', 'package'], deps);

      // Operation and Nuxeo Package
      deps = this.gene._moduleFindParents(['package', 'operation']);
      assert.deepEqual(['single-module', 'package', 'operation'], deps);
    });
  });
});
