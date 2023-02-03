const chai = require('chai');
const dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
const expect = chai.expect;
const Watcher = require('../generators/synchronize/synchronize/Watcher').Watcher;
const LocalSync = require('../generators/synchronize/synchronize/LocalSynchronize');
const tmp = require('tmp');
tmp.setGracefulCleanup();
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const debug = require('debug')('nuxeo:test');
const isArray = require('isarray');
const LOCAL = require('../utils/deployment-helper').DEPLOYMENTS.LOCAL;

describe('Synchronization Command', function () {
  beforeEach(function () {
    this.cwdObj = tmp.dirSync();
    this.cwd = this.cwdObj.name;
  });

  afterEach(function () {
    fs.emptyDirSync(this.cwd);
    this.cwdObj.removeCallback();
  });

  describe('coerce arguments', function () {
    beforeEach(function () {
      this.coerce = (opt) => {
        if (isArray(opt)) {
          opt = _.map(opt, (o) => {
            return path.join(this.cwd, o);
          });
        } else {
          opt = path.join(this.cwd, opt);
        }

        debug('Opt: %O', opt);
        const res = Watcher.coerce(opt);
        debug('Res: %O', res);
        if (isArray(res)) {
          return _.map(res, (o) => {
            return path.relative(this.cwd, o);
          });
        }
        return path.relative(this.cwd, res);
      };
    });

    it('throw error on wrong parameters', function () {
      expect(() => {
        this.coerce(['/a/b', '/b', '/a']);
      }).to.throw();
    });

    it('resolves path', function () {
      expect(this.coerce([path.join('toto', '..', 'asd')])).to.be.eq('asd');
    });

    it('can handle string and array', function () {
      expect(this.coerce('a')).to.be.eq('a');
      expect(this.coerce(['a'])).to.be.eq('a');
      expect(this.coerce(['a', 'b'])).to.have.lengthOf(2);
    });
  });

  describe('contains valid triggers.', function () {
    function createFile(dest, content = {}) {
      expect(fs.existsSync(dest)).to.be.false();
      fs.writeFileSync(dest, JSON.stringify(content));

      const destSize = fs.lstatSync(dest).size;
      expect(fs.lstatSync(dest).size).to.be.greaterThan(0);

      return destSize;
    }

    describe('Mkdirp Trigger', function () {
      it('can create a simple folder', function () {
        const dest = path.join(this.cwd, 'simple');

        expect(fs.existsSync(dest)).to.be.false();
        new LocalSync.Triggers.Mkdirp(dest).trigger();
        expect(fs.existsSync(dest)).to.be.true();
      });

      it('can create a folders deeply', function () {
        const dest = path.join(this.cwd, 'deep', 'folder', 'creation', 'deeply');

        expect(fs.existsSync(dest)).to.be.false();
        new LocalSync.Triggers.Mkdirp(dest).trigger();
        expect(fs.existsSync(dest)).to.be.true();
      });

      it('do not fail when folder already exists', function () {
        const dest = path.join(this.cwd, 'twicce');

        expect(fs.existsSync(dest)).to.be.false();
        new LocalSync.Triggers.Mkdirp(dest).trigger();
        new LocalSync.Triggers.Mkdirp(dest).trigger();
        new LocalSync.Triggers.Mkdirp(dest).trigger();
        new LocalSync.Triggers.Mkdirp(dest).trigger();
        expect(fs.existsSync(dest)).to.be.true();
      });
    });

    describe('Copy Trigger', function () {
      it('can copy a file', function () {
        const src = path.join(this.cwd, 'myObject.js');
        const srcSize = createFile(src, {
          foo: 'baaaar'
        });

        const dest = path.join(this.cwd, 'destination.json');
        expect(fs.existsSync(dest)).to.be.false();
        new LocalSync.Triggers.Copy(src, dest).trigger();

        expect(fs.existsSync(dest)).to.be.true();
        expect(fs.lstatSync(dest).size).to.be.eq(srcSize);
      });

      it('can copy a file to a missing folder', function () {
        const src = path.join(this.cwd, 'myObject.js');
        const srcSize = createFile(src, {
          foo: 'baaaar'
        });

        const dest = path.join(this.cwd, 'folder', 'folder', 'folder', 'destination.json');
        expect(fs.existsSync(dest)).to.be.false();
        new LocalSync.Triggers.Copy(src, dest).trigger();

        expect(fs.existsSync(dest)).to.be.true();
        expect(fs.lstatSync(dest).size).to.be.eq(srcSize);
      });
    });

    describe('Unlink Trigger', function () {
      it('can delete file', function () {
        const dest = path.join(this.cwd, 'toBeDeleted.js');
        createFile(dest);

        expect(fs.existsSync(dest)).to.be.true();
        new LocalSync.Triggers.Unlink(dest).trigger();
        expect(fs.existsSync(dest)).to.be.false();
      });

      it('can delete folder', function () {
        const dest = path.join(this.cwd, 'folderish');
        new LocalSync.Triggers.Mkdirp(dest).trigger();
        expect(fs.existsSync(dest)).to.be.true();

        new LocalSync.Triggers.Unlink(dest).trigger();
        expect(fs.existsSync(dest)).to.be.false();
      });

      it('can delete a non empty folder', function () {
        const folder = path.join(this.cwd, 'folderish');
        new LocalSync.Triggers.Mkdirp(folder).trigger();
        expect(fs.existsSync(folder)).to.be.true();

        createFile(path.join(folder, 'file1'));
        createFile(path.join(folder, 'file2'));
        createFile(path.join(folder, 'file3'));

        new LocalSync.Triggers.Unlink(folder).trigger();
        expect(fs.existsSync(folder)).to.be.false();
      });

      it('do not fail if the destination doesn\'t exist', function () {
        const dest = path.join(this.cwd, 'unknown');

        expect(fs.existsSync(dest)).to.be.false();
        new LocalSync.Triggers.Unlink(dest).trigger();
        expect(fs.existsSync(dest)).to.be.false();
      });
    });
  });

  describe('minimatch default rule', function () {
    const match = ['toto.js', 'blabla.html', 'toto.svg', 'bla.jpg', 'img.png', 'toto.JS', 'json.json'];
    const nonmatch = ['blasd.tr', '.git', 'toto.js.swp', '.toto.js', 'dqewq.js~'];
    const watcher = new Watcher();

    match.forEach((f) => {
      it(`match ${f}`, function () {
        expect(watcher.handledFile('fake', f)).to.be.true();
      });

      it(`match deeper ${f}`, function () {
        expect(watcher.handledFile('fake', path.join('dir', 'deep', f))).to.be.true();
      });
    });

    nonmatch.forEach((f) => {
      it(`do not match ${f}`, function () {
        expect(watcher.handledFile('fake', f)).to.be.false();
      });

      it(`do not match deeper ${f}`, function () {
        expect(watcher.handledFile('fake', path.join('dir', 'deep', f))).to.be.false();
      });
    });
  });

  describe('resolve ActionTrigger', function () {
    const tests = [{
      event: 'add',
      trigger: LocalSync.Triggers.Copy
    }, {
      event: 'unlink',
      trigger: LocalSync.Triggers.Unlink
    }, {
      event: 'unlinkDir',
      trigger: LocalSync.Triggers.Unlink
    }, {
      event: 'change',
      trigger: LocalSync.Triggers.Copy
    }, {
      event: 'addDir',
      trigger: LocalSync.Triggers.Mkdirp
    }];

    const watcher = new Watcher({
      deployment: {
        type: LOCAL
      }
    });
    watcher.initializeHandler();

    tests.forEach((test) => {
      it(`with "${test.event}" event as ${test.trigger.name}.`, function () {
        const trigger = watcher.resolveAction(test.event, '');
        expect(trigger instanceof test.trigger).to.be.true();
      });
    });

    it('with "dummy" event', function() {
      const trigger = watcher.resolveAction('dummy', '');
      expect(trigger).to.be.undefined();
    });
  });

  describe('compute destination path', function () {
    it('can compute from single src', function () {
      const w = new Watcher({dest: '/tmp/dest', src: '/tmp/src'});
      expect(w.computeDestination('/tmp/src/toto/tata/a')).to.be.eq(path.normalize('/tmp/dest/toto/tata/a'));
    });

    it('can compute from multiple src', function () {
      const w = new Watcher({dest: '/tmp/dest', src: ['/tmp/src1', '/tmp/src2', '/tmp/src3']});

      expect(w.computeDestination('/tmp/src1/toto/tata/a')).to.be.eq(path.normalize('/tmp/dest/toto/tata/a'));
      expect(w.computeDestination('/tmp/src2/foo/a')).to.be.eq(path.normalize('/tmp/dest/foo/a'));
      expect(w.computeDestination('/tmp/src3/toto/a')).to.be.eq(path.normalize('/tmp/dest/toto/a'));
    });

    it('can compute on tricky paths', function() {
      /**
       * This one is tricky, to be sure that /src/ will not collide with /src./
       */
      const w = new Watcher({dest: '/tmp/dest', src: ['/tmp/src', '/tmp/src2', '/tmp/src3']});

      expect(w.computeDestination('/tmp/src')).to.be.eq(path.normalize('/tmp/dest'));
      expect(w.computeDestination('/tmp/src/toto/tata/a')).to.be.eq(path.normalize('/tmp/dest/toto/tata/a'));
      expect(w.computeDestination('/tmp/src2/foo/a')).to.be.eq(path.normalize('/tmp/dest/foo/a'));
      expect(w.computeDestination('/tmp/src3/toto/a')).to.be.eq(path.normalize('/tmp/dest/toto/a'));
    });
  });
});
