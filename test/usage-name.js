var assert = require('yeoman-assert');
var r = require('../utils/usage.js').prototype.resolvebinary;

describe('Usage resolvebinary method', function() {
  it('display generator wrapper name', function() {
    const opts = {
      namespace: 'test',
      _: ['wrapped'],
      $0: 'wrapper'
    };

    assert.equal('wrapper wrapped', r(opts));
  });

  it('display generator', function() {
    const opts = {
      namespace: 'test',
    };

    assert.equal('yo test', r(opts));
  });

  it('keep parameter in namespace', function() {
    const opts = {
      namespace: 'test [toto..]',
      _: ['test'],
      $0: 'wrapped'
    };

    assert.equal('wrapped test [toto..]', r(opts));
  });
});
