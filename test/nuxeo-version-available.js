var assert = require('yeoman-assert');
var versions = require('../utils/nuxeo-version-available');

describe('nuxeo-version', function() {
  it('find nuxeo_version param', function() {
    assert(typeof versions.choices !== 'undefined');
    assert(versions.choices.length !== 0);

    assert(versions.default.length !== 0);
  });
});
