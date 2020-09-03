var path = require('path');
var assert = require('yeoman-assert');
var settings = require('../utils/maven-settings.js');

describe('Maven Settings module can', function () {
  function openSettingsFile(filename) {
    var filepath = path.join(__dirname, 'templates', filename);
    return settings.open(filepath);
  }

  beforeEach(function () {
    this.settings = openSettingsFile('settings.xml');
  });

  it('contains server and returns true if any', function () {
    const x = this.settings.containsServer('existing');
    assert.ok(x);
    assert.ok(!this.settings.containsServer('missing'));
  });

  it('can find a server by id', function () {
    const node = this.settings._findServerNode('existing');
    assert.ok(node.is('server'));
    assert.equal('existing', node.find('id').text());

    const missing = this.settings._findServerNode('missing');
    assert.ok(!missing.is('server'));
  });

  it('can add a server to an exising servers node', function () {
    // Adding a simple server
    assert.ok(this.settings.addServer('server1'));
    let node = this.settings._findServerNode('server1');
    assert.ok(node.is('server'), 'New server node has not been added');

    // Adding a server with a username
    assert.ok(this.settings.addServer('server2', 'johnny'));
    node = this.settings._findServerNode('server2');
    assert.ok(node.is('server'));
    assert.equal('johnny', node.find('username').text());

    // Adding a server with a username and a password
    assert.ok(this.settings.addServer('server3', 'bobby', 'secret'));
    node = this.settings._findServerNode('server3');
    assert.ok(node.is('server'));
    assert.equal('bobby', node.find('username').text());
    assert.equal('secret', node.find('password').text());
  });

  it('can override credentials to an exising server', function () {
    assert.ok(this.settings.containsServer('existing'));
    let node = this.settings._findServerNode('existing');
    assert.notEqual('johnny', node.find('username').text());

    // First try without forcing
    assert.ok(!this.settings.addServer('existing', 'johnny', 'secret'));

    assert.ok(this.settings.addServer('existing', 'johnny', 'secret', true));
    node = this.settings._findServerNode('existing');
    assert.equal('johnny', node.find('username').text());
  });

  it('can ensure a servers node exists', function () {
    const empty = openSettingsFile('settings-empty.xml');
    assert.ok(!empty.containsServer('newone'));
    assert.ok(empty.addServer('newone', 'bobby', 'secret'));
    assert.ok(empty.containsServer('newone'));
  });

  it('can create a new file, if totally empty', function() {
    const empty = openSettingsFile('empty-file');
    assert.ok(!empty.containsServer('newone'));
    assert.ok(empty.addServer('newone', 'bobby', 'secret'));
    assert.ok(empty.containsServer('newone'));
  });
});
