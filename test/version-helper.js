/*eslint strict:0*/
'use strict';

var assert = require('yeoman-assert');
var v = require('../utils/version-helper.js');

describe('Version helper should', function() {
  it('still compare version', function() {
    assert.ok(v.isAfter('1.0', '0.2'));
    assert.ok(v.isBefore('0.0.1', '0.2'));
  });

  it('even snapshot version', function() {
    assert.ok(v.isAfter('0.0.1', '0.0.1-SNAPSHOT'));
    assert.ok(v.isBefore('0.0.1-SNAPSHOT', '0.0.1'));
    assert.ok(v.isEquals('0.0.1', '0.0.1'));
    assert.ok(v.isAfter('8.3', '8.1'));
    assert.ok(v.isAfter('8.3', '8.3-SNAPSHOT'));
  });
});
