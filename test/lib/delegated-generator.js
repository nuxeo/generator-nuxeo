const assert = require('yeoman-assert');
const helpers = require('yeoman-test');
const path = require('path');

describe('delegated-generator', () => {
  before(() => {
    const basePath = path.join(__dirname);
    const namespace = (basePath.lastIndexOf('generator-') >= 0 ? basePath.substr(basePath.lastIndexOf('generator-') + 'generator-'.length) : basePath.substr(1)).replace(new RegExp(path.sep, 'g'), ':');
    this.gene = helpers.createGenerator(namespace + ':test-delegated', [path.join(basePath, 'test-delegated')]);
  });

  it('can save restricted properties to dedicated file', () => {
    this.gene.config.set('my:restricted:key', 'hello');
    this.gene.config.set('my:restricted', 'hello');
    assert.equal(this.gene.config.get('my:restricted:key'), 'hello');
    assert.equal(this.gene.config.get('my:restricted'), 'hello');

    this.gene.config.set('my:notrestricted:key', 'unsecured');
    assert.equal(this.gene.config.get('my:notrestricted:key'), 'unsecured');

    const unresKeys = this.gene._getStorage().getAll();
    assert.ok(unresKeys['my:notrestricted:key'] !== undefined);
    assert.ok(unresKeys['my:restricted:key'] === undefined);

    const resKeys = this.gene._getRestrictedStorage().getAll();
    assert.ok(resKeys['my:notrestricted:key'] === undefined);
    assert.ok(resKeys['my:restricted:key'] !== undefined);
  });
});
