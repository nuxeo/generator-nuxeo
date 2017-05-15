const ejs = require('ejs');
const fs = require('fs');
const _ = require('lodash');
const assert = require('assert');
const s = require('../utils/nuxeo.string.js');

describe('Constant Template', function () {
  before(function () {
    const content = fs.readFileSync('generators/studio/templates/StudioConstants.java.ejs', 'UTF-8');
    this.template = ejs.compile(content, {});
    this.opts = (file) => {
      const obj = file ? fs.readFileSync(`test/registries/${file}`, 'UTF-8') : '{}';

      return _.extend({}, {
        pkg: 'org.nuxeo.sample',
        name: 'my-constant test',
        s,
        _,
        symbolicName: 'sample-SANDBOX',
        res: JSON.parse(obj)
      });
    };
  });

  it('render empty response', function () {
    const res = this.template(this.opts());
    assert.ok(res.match(/^package org\.nuxeo\.sample;/m));
    assert.ok(res.match(/^public class MyConstantTest {/m));
    assert.ok(res.match(/^ {4}public static final String BUNDLE_NAME = "studio.extensions.sample-SANDBOX";/m));
  });

  it('render Document Type constants', function () {
    const res = this.template(this.opts('doctypes.json'));

    assert.ok(res.match(/^ {4}public static final String ROOT_DOC_TYPE = "Root";$/m));
    assert.ok(res.match(/^ {4}public static final String DOCUMENT_DOC_TYPE = "Document";$/m));
    assert.ok(res.match(/^ {4}public static final String FILE_CUSTOM_DOC_TYPE = "FileCustom";$/m));
  });

  it('render Schema and Fields constants', function () {
    const res = this.template(this.opts('schemas.json'));

    assert.ok(res.match(/^ {4}public static final String DUBLINCORE_SCHEMA = "dublincore";$/m));
    assert.ok(res.match(/^ {4}public static final String DUBLINCORE_DESCRIPTION_PROPERY = "dc:description";$/m));
    assert.ok(res.match(/^ {4}public static final String DUBLINCORE_LAST_CONTRIBUTOR_PROPERY = "dc:lastContributor";$/m));
  });

  it('render Facets constants', function () {
    const res = this.template(this.opts('facets.json'));

    assert.ok(res.match(/^ {4}public static final String FOLDERISH_FACET = "Folderish";$/m));
    assert.ok(res.match(/^ {4}public static final String ORDERABLE_FACET = "Orderable";$/m));
    assert.ok(!res.match(/FACET = "MultiviewPicture"/m));
  });

  it('render Automation Chain constants', function() {
    const res = this.template(this.opts('automationchains.json'));

    assert.ok(res.match(/^ {4}public static final String COMPUTE_CONTRAT_TITLE_CHAIN = "ComputeContratTitle";$/m));
    assert.ok(!res.match(/CHAIN = "validateDocument"/m));
    assert.ok(res.match(/^ {4}public static final String FETCHI_DOCUMENT_CHAIN = "FetchiDocument";$/m));
    assert.ok(res.match(/^ {4}public static final String FETCHI_DOCUMENT_PATH_PARAMETER = "path";$/m));
  });

  it('render Automation Scripting constants', function() {
    const res = this.template(this.opts('automationscripting.json'));

    assert.ok(res.match(/^ {4}public static final String DEMO_OPERATION = "javascript.demo";$/m));
    assert.ok(res.match(/^ {4}public static final String DEMO_AMOUNT_PARAMETER = "amount";$/m));
    assert.ok(res.match(/^ {4}public static final String DEMO_TOTAL_PARAMETER = "total";$/m));
  });

});
