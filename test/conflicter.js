const assert = require('yeoman-assert');
const Conflicter = require('../utils/conflicter.js');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const adapter = {
  log: {
    create: function() {},
    conflict: function() {},
    error: function() {},
    force: function() {},
    identical: function() {}
  },
  prompt: function(i, cb) {
    cb({
      action: 'conflict'
    });
  }
};

function createFile(filePath, content) {
  fs.writeJsonSync(filePath, content);
}

describe('Conflicter override should', function() {
  beforeEach(function() {
    this.folder = path.join(os.tmpdir(), 'conflicter-tmp-' + Math.random());
    fs.mkdirSync(this.folder);
  });

  it('still be able to force a diff', function(done) {
    let file = path.join(this.folder, 'test.json');
    const content = {
      test: 'ok'
    };
    createFile(file, content);

    const c = new Conflicter(adapter, true);
    c.collision({
      path: file,
      contents: JSON.stringify(content)
    }, (res) => {
      assert.equal('force', res);
      done();
    });
  });

  it('be able to prompt a conflict', function(done) {
    let file = path.join(this.folder, 'test.json');
    const content = {
      test: 'ok'
    };
    createFile(file, content);

    const c = new Conflicter(adapter, false);
    c.collision({
      path: file,
      contents: JSON.stringify(content)
    }, (res) => {
      assert.equal('conflict', res);
      done();
    });
  });

  it('be able to change force mode with a handler - conflict', function(done) {
    let file = path.join(this.folder, 'test.json');
    const content = {
      test: 'ok'
    };
    createFile(file, content);

    const c = new Conflicter(adapter, (filename) => {
      return filename.match(/pom\.xml$/);
    });

    c.collision({
      path: file,
      contents: JSON.stringify(content)
    }, (res) => {
      assert.equal('conflict', res);
      done();
    });
  });

  it('be able to change force mode with a handler - force', function(done) {
    let file = path.join(this.folder, 'pom.xml');
    const content = {
      test: 'ok'
    };
    createFile(file, content);

    const c = new Conflicter(adapter, (filename) => {
      return filename.match(/pom\.xml$/);
    });

    c.collision({
      path: file,
      contents: JSON.stringify(content)
    }, (res) => {
      assert.equal('force', res);
      done();
    });
  });
});
