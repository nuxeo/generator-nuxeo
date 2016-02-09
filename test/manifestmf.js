'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var memFs = require('mem-fs');
var editor = require('mem-fs-editor');
var manifest = require('../utils/manifestmf.js');

describe('MANIFEST.MF parser can', function() {

  beforeEach(function() {
    this.fs = editor.create(memFs.create());
    this.manifestPath = path.join(__dirname, 'templates', 'MANIFEST.MF');
    this.manifest = manifest.open(this.manifestPath, this.fs);
  });

  it('read components', function() {
    assert.equal(0, this.manifest.components().length);
  });

  it('add components', function() {
    assert.equal(0, this.manifest.components().length);
    this.manifest.addComponent('OSGI-INF/bla-contrib.xml');
    this.manifest.addComponent('OSGI-INF/bla-coolos.xml');
    assert.equal(2, this.manifest.components().length);
    this.manifest.addComponent('OSGI-INF/bla-dsads.xml');
    assert.equal(3, this.manifest.components().length);
  });

  it('follow Manifest syntax rules', function() {
    this.manifest.addComponent('OSGI-INF/first.xml');
    assert.ok(this.manifest._content().match('Nuxeo-Component: OSGI-INF/first.xml\n'));

    this.manifest.addComponent('OSGI-INF/second.xml');
    assert.ok(this.manifest._content().match('Nuxeo-Component: OSGI-INF/first.xml,\n'));
    assert.ok(this.manifest._content().match(' OSGI-INF/second.xml\n'));

    this.manifest.addComponent('OSGI-INF/third.xml');
    assert.ok(this.manifest._content().match(' OSGI-INF/third.xml,\n'));
    assert.ok(this.manifest._content().match(' OSGI-INF/second.xml\n'));
  });
});
