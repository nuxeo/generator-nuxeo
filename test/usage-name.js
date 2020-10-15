const assert = require('yeoman-assert');
const r = require('../utils/usage.js').prototype.resolvebinary;

describe('Usage resolvebinary method', function() {
  it('display generator wrapper name', function() {
    const opts = {
      namespace: 'nuxeo:wrapped',
      _ncli: true,
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
      _ncli: true,
      $0: 'wrapped'
    };

    assert.equal('wrapped test [toto..]', r(opts));
  });
});
