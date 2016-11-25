const assert = require('yeoman-assert');
const configure = require('../generators/hotreload/configure.js');
const fs = require('fs');
const os = require('os');
const path = require('path');

function file(name) {
  return path.join(__dirname, 'nuxeoconf', name);
}

function read(name) {
  return fs.readFileSync(file(name), {
    encoding: 'UTF-8'
  });
}

describe('Hot Reload Configuration', function() {
  describe('distribution folder', function() {
    it('is correctly detected', function() {
      assert.ok(!configure._isDistributionPath('das')); //not absolute path
      assert.ok(!configure._isDistributionPath(os.hostname())); //existing absolute path
    });
  });

  describe('nuxeo.conf should', function() {
    it('enable dev mode', function() {
      let content = read('nuxeo1.conf');

      assert(!content.match(/^org\.nuxeo\.dev/m));
      content = configure._enableDevMode(content);
      assert(content.match(/^org\.nuxeo\.dev=true/m));

      // Ensure calling the method on an already enable conf file is working
      content = configure._enableDevMode(content);
      assert(content.match(/^org\.nuxeo\.dev=true/m));
    });

    it('add sdk templates', function() {
      let content = read('nuxeo2.conf');

      assert(!content.match(/^nuxeo\.templates/m));
      content = configure._addSDKTemplate(content);
      assert(content.match(/^nuxeo\.templates=sdk/m));
    });

    it('add sdk templates to other templates', function() {
      let content = read('nuxeo3.conf');

      assert(!content.match(/^nuxeo\.templates\s*=\s*.*sdk/m));
      content = configure._addSDKTemplate(content);
      assert(content.match(/^nuxeo\.templates\s*=\s*.*sdk/m));
    });
  });
});
