const path = require('path');
const helpers = require('yeoman-test');

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
