'use strict';
var assert = require('yeoman-assert');
var _ = require('lodash');
var helpers = require('yeoman-generator').test;
var s = require('../utils/nuxeo.string.js');
var path = require('path');

describe('propery-holder', function() {

  beforeEach(function() {
    this.ph = require('../utils/property-holder.js');
    this.ph.clean();
    assert.equal(0, _.size(this.ph.stored()));

    this.props = [{
      name: 'name',
      store: true
    }, {
      name: 'package'
    }, {
      name: 'version',
      store: true
    }];

    this.propsNd = [{
      name: 'name',
      store: true
    }, {
      name: 'version',
      store: true
    }];

    this.propsRd = [{
      name: 'else',
      store: true
    }, {
      name: 'something',
      store: true
    }];

    this.propsTh = [{
      name: 'else',
      store: true
    }, {
      name: 'something',
      store: true
    }, {
      name: 'test'
    }];
  });

  it('can save only stored params', function() {
    var params = {
      name: 'mytest',
      package: 'org.nuxeo.test',
      version: '1.0-SNAPSHOT'
    };

    this.ph.store(this.props, params);
    assert.equal(2, _.size(this.ph.stored()));
  });

  it('can filter already stored params', function() {
    // Ensure nothing is filtered the first time
    var props = this.ph.filter(this.propsNd);
    assert.equal(2, _.size(props));

    // Then add some answers which 'propsNd' is expecting the sames
    var params = {
      name: 'mytest',
      package: 'org.nuxeo.test',
      version: '1.0-SNAPSHOT'
    };
    this.ph.store(this.props, params);

    // Filter a second time the propsNd
    props = this.ph.filter(this.propsNd);
    assert.ok(_.isEmpty(props));

    props = this.ph.filter(this.propsRd);
    assert.equal(2, _.size(props));
  });

  it('can restore previously saved values', function() {
    var params = {
      name: 'mytest',
      package: 'org.nuxeo.test',
      version: '1.0-SNAPSHOT'
    };

    this.ph.store(this.props, params);
    params = {
      somethingElse: 'yoyo'
    };
    params = _.assign(this.ph.stored(), params);
    assert.equal('1.0-SNAPSHOT', params.version);
    assert.equal('yoyo', params.somethingElse);
    assert.equal('mytest', params.name);
  });

  it('can be called several times', function() {
    var params = {
      name: 'mytest',
      package: 'org.nuxeo.test',
      version: '1.0-SNAPSHOT'
    };
    this.ph.store(this.props, params);
    params = {
      else: 'else',
      something: 'something',
      test: 'test'
    }
    this.ph.store(this.propsTh, params);

    assert.equal(4, _.size(this.ph.stored()));
  });
});
