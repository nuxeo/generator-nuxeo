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
    assert.ok(v.isBefore('8.1', '8.3'));
    assert.ok(v.isAfter('8.3', '8.3-SNAPSHOT'));
    assert.ok(v.isAfter('9.10-HF01-SNAPSHOT', '8.3-SNAPSHOT'));
  });

  describe('embedded a value', function() {
    it('from 8.3-SNAPSHOT', () => {
      const s = v.fromVersion('8.3-SNAPSHOT');
      assert.ok(s.isBefore('8.10'));
      assert.ok(s.isBeforeOrEquals('8.10'));
      assert.ok(s.isAfter('7.10'));
      assert.ok(s.isAfterOrEquals('7.10'));
      assert.ok(s.isEquals('8.3-SNAPSHOT'));
    });

    it('from 9.10-HF01-SNAPSHOT', () => {
      const s = v.fromVersion('9.10-HF01-SNAPSHOT');
      assert.ok(s.isAfterOrEquals('8.10-SNAPSHOT'));
    });

    it('from undefined version', () => {
      // handled like 0.0.0-SNAPSHOT
      var s = v.fromVersion(undefined);
      assert.ok(s.isBefore('8.10'));
      assert.ok(s.isBefore('7.10'));
      assert.ok(s.isBefore('0.0.0'));
    });
  });
});
