/*eslint strict:0,camelcase:0*/
'use strict';

const assert = require('yeoman-assert');
const NuxeoVersion = require('../generators/app/nuxeo-version');

// Mock some mehtods
NuxeoVersion.log = {
  info: function() {
    const c = console;
    c.log(`I: ${Array.prototype.join.apply(arguments, [' '])}`);
  },
  error: function() {
    const c = console;
    c.log(`E: ${Array.prototype.join.apply(arguments, [' '])}`);
  }
};

let storedVersion;
NuxeoVersion._setNuxeoVersion = function(version) {
  storedVersion = version;
};
NuxeoVersion._getNuxeoVersion = function() {
  return storedVersion;
};

describe('nuxeo-version', function() {
  beforeEach(function() {
    storedVersion = undefined;
  });

  it('find nuxeo_version param', function() {
    let answers = {
      blafl: 'fdfsdf',
      nuxeo_version: '8.3-SNAPSHOT'
    };

    assert.ok(NuxeoVersion._findNuxeoVersion(answers));
    assert.equal('8.3-SNAPSHOT', NuxeoVersion._getNuxeoVersion());
  });

  it('find super_version param', function() {
    let answers = {
      blafl: 'fdfsdf',
      super_version: '8.3-SNAPSHOT'
    };
    assert.ok(!NuxeoVersion._findNuxeoVersion(answers));

    answers = {
      blafl: 'fdfsdf',
      super_package: 'org.nn.dsadsa',
      super_version: '8.3-SNAPSHOT'
    };
    assert.ok(!NuxeoVersion._findNuxeoVersion(answers));

    answers = {
      blafl: 'fdfsdf',
      super_package: 'org.nuxeo.blabla',
      super_version: '8.3-SNAPSHOT'
    };
    assert.ok(NuxeoVersion._findNuxeoVersion(answers));
    assert.equal('8.3-SNAPSHOT', NuxeoVersion._getNuxeoVersion());
  });

  it('find parent_version param', function() {
    let answers = {
      blafl: 'fdfsdf',
      parent_version: '8.3-SNAPSHOT'
    };
    assert.ok(!NuxeoVersion._findNuxeoVersion(answers));

    answers = {
      blafl: 'fdfsdf',
      parent_package: 'org.nn.dsadsa',
      parent_version: '8.3-SNAPSHOT'
    };
    assert.ok(!NuxeoVersion._findNuxeoVersion(answers));

    answers = {
      blafl: 'fdfsdf',
      parent_package: 'org.nuxeo.blabla',
      parent_version: '8.3-SNAPSHOT'
    };
    assert.ok(NuxeoVersion._findNuxeoVersion(answers));
    assert.equal('8.3-SNAPSHOT', NuxeoVersion._getNuxeoVersion());
  });

  it('not override existing versnion', function() {
    let answers = {
      nuxeo_version: '8.10-SNAPSHOT'
    };
    assert.ok(NuxeoVersion._findNuxeoVersion(answers));
    assert.equal('8.10-SNAPSHOT', NuxeoVersion._getNuxeoVersion());

    answers.nuxeo_version = '8.3';
    assert.ok(!NuxeoVersion._findNuxeoVersion(answers));
    assert.equal('8.10-SNAPSHOT', NuxeoVersion._getNuxeoVersion());
  });
});
