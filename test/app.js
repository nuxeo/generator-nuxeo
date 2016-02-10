'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;

describe('generator-nuxeo', function() {
  before(function(done) {
    helpers.run(path.join(__dirname, '../generators/app'))
      .withOptions({
        someOption: true
      })
      .withPrompts({
        someAnswer: true
      })
      .on('end', done);
  });
});
