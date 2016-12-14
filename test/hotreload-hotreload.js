const assert = require('yeoman-assert');
const hotreload = require('../generators/hotreload/hotreload.js');

describe('Hot Reload Maven Module should', function() {
  before(function() {
    hotreload.options = {
      classesFolder: 'target/classes'
    };

    hotreload.destinationRoot = function() {
      return process.cwd();
    };
  });

  it('build default bundles list', function() {
    const modules = ['myapp-core', 'myapp-web'];
    const str = hotreload._buildBundlesList(modules);

    assert.ok(str.match(/^bundle:/m));
    assert.ok(str.match(/\/myapp-(?:core|web)\/target\/classes$/m));
  });

  it('build typed bundles list', function() {
    const modules = ['myapp-core', 'myapp-web'];
    const str = hotreload._buildBundlesList('web', modules);

    assert.ok(str.match(/^web:/m));
    assert.ok(str.match(/\/myapp-(?:core|web)\/target\/classes$/m));
  });

  it('render dev.bundles content', function() {
    const modules = ['myapp-core', 'myapp-web'];
    const str = hotreload._renderDevBundlesContent(modules);

    assert.ok(str.match(/^## GENERATOR-NUXEO STUFF - DO NOT EDIT/i));
    assert.ok(str.match(/^#|\/myapp-[\w]+\/target\/classes$/im));
    assert.ok(str.match(/## GENERATOR-NUXEO STUFF - END\n$/i));
  });

  it('correctly build dev.bundles path', function() {
    const p = '/tmp/bla';
    assert.ok('/tmp/bla/nxserver/dev.bundles', hotreload._buildDevBundlesPath(p));
  });

  it('clean generated dev.bundles content', function() {
    let content = '## GENERATOR-NUXEO STUFF - DO NOT EDIT\nbundle:dummy\nanother:content\n## GENERATOR-NUXEO STUFF - END';
    assert.equal('', hotreload._cleanDevBundlesFileContent(content));

    content = 'before## GENERATOR-NUXEO STUFF - DO NOT EDIT\nbundle:dummy\nanother:content\n## GENERATOR-NUXEO STUFF - ENDafter';
    assert.equal('beforeafter', hotreload._cleanDevBundlesFileContent(content));
  });

  it('clean/generate multiple times generated dev.bundles', function() {
    const modules = ['dummy'];
    let content = hotreload._renderDevBundlesContent(modules);
    content = hotreload._cleanDevBundlesFileContent(content);
    assert.equal('', content);

    content = 'before';
    content += hotreload._renderDevBundlesContent(modules);
    content = hotreload._cleanDevBundlesFileContent(content);
    assert.equal('before', content);

    content = 'before\n\n';
    content += hotreload._renderDevBundlesContent(modules);
    content = hotreload._cleanDevBundlesFileContent(content);
    content += hotreload._renderDevBundlesContent(modules);
    content = hotreload._cleanDevBundlesFileContent(content);
    content += hotreload._renderDevBundlesContent(modules);
    content = hotreload._cleanDevBundlesFileContent(content);
    assert.equal('before\n\n', content);
  });
});
