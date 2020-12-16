const chai = require('chai');
const dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
const expect = chai.expect;
const PathResolver = require('../generators/synchronize/synchronize/path_resolver');
const containsChild = require('../generators/synchronize/synchronize/path_child_finder').containsChild;
const tmp = require('tmp');
const path = require('path');
const fs = require('fs-extra');

describe('Synchronization Lib Modules', function () {
  before(function () {
    this.realCwd = process.cwd();
  });

  afterEach(function () {
    process.chdir(this.realCwd);
  });

  describe('PathResolved class', function () {
    beforeEach(function () {
      this.cwdObj = tmp.dirSync();
      this.cwd = this.cwdObj.name;
      process.chdir(this.cwd);
    });

    afterEach(function () {
      fs.emptyDirSync(this.cwd);
      this.cwdObj.removeCallback();
    });

    describe('src getter', function () {
      it('returns a default value', function () {
        expect(PathResolver.src().describe).to.be.eq('Source Folder');
        expect(PathResolver.src().default).to.contains('/watcher/src');
        expect(PathResolver.computeSource()).to.be.eq('/tmp/watcher/src');
      });

      describe('can find a Studio gitlab clone', function () {
        beforeEach(function () {
          this.baseProject = path.join(process.cwd(), 'project');
          fs.mkdirpSync(this.baseProject);
          fs.writeFileSync(path.join(this.baseProject, 'application.xml'), 'dummy-content');

          this.warFolder = path.join(this.baseProject, 'studio', 'resources', 'nuxeo.war');
        });

        it('ensures that a application.xml and studio folder are present', function () {
          const cwd = path.join(this.warFolder, 'ui', 'document');
          fs.mkdirpSync(cwd);
          process.chdir(cwd);

          expect(PathResolver.computeSource()).to.eq(this.warFolder);
        });

        it('ensures that a studio folder exists at the same level, containing a nuxeo.war', function () {
          // with a missing studio folder
          expect(PathResolver.computeSource()).to.eq('/tmp/watcher/src');

          // After creating a studio folder AND a nuxeo.war
          fs.mkdirpSync(this.warFolder);
          process.chdir(this.warFolder);
          expect(PathResolver.computeSource()).to.eq(this.warFolder);

          // After unlinking nuxeo.war folder
          process.chdir(path.dirname(this.warFolder));
          fs.rmdirSync(this.warFolder);
          expect(PathResolver.computeSource()).to.eq('/tmp/watcher/src');
        });
      });
    });

    describe('dest getter', function () {
      it('returns a default value', function () {
        expect(PathResolver.dest().describe).to.be.eq('Destination Folder');
        expect(PathResolver.dest().default).to.contains('/watcher/dest');
        expect(PathResolver.computeDestination()).to.be.eq('/tmp/watcher/dest');
      });

      describe('can find ".yo-rc.json"', function () {
        beforeEach(function () {
          this.initYoRc = (obj) => {
            fs.writeJSONSync(path.join(this.cwd, '.yo-rc.json'), {
              foo: {
                bar: 0
              },
              'generator-nuxeo': obj
            });
          };
        });

        it('and read configured distribution path', function () {
          expect(PathResolver.computeDestination()).to.be.eq('/tmp/watcher/dest');
          this.initYoRc({
            'distribution:path': '/foo/bar/nxserver'
          });
          expect(PathResolver.computeDestination()).to.match(/^\/foo\/bar\/nxserver\/.+/);
        });

        it('even from a deeper child', function () {
          const darkness = path.join(this.cwd, 'deep', 'deep', 'sooo', 'deep');
          fs.mkdirpSync(darkness);
          process.chdir(darkness);

          expect(PathResolver.computeDestination()).to.be.eq('/tmp/watcher/dest');
          this.initYoRc({
            'distribution:path': '/foo/bar/distribution'
          });
          expect(PathResolver.computeDestination()).to.eq('/foo/bar/distribution/nxserver/nuxeo.war');
        });

        it('and return default value if distribution not configured', function () {
          expect(PathResolver.computeDestination()).to.be.eq('/tmp/watcher/dest');
          this.initYoRc({
            'wrong:key': '/foo/bar/nxserver'
          });
          expect(PathResolver.computeDestination()).to.be.eq('/tmp/watcher/dest');
        });
      });
    });

    describe('findBaseDistribution', function () {
      it('returns undefined when nothing is found', function () {
        const target = path.join(this.cwd, 'foo', 'bar');
        fs.mkdirpSync(target);

        expect(new PathResolver().findBaseDistributionPath(target)).to.undefined();
      });

      it('find the distribution root', function () {
        // Target Folder
        const target = path.join(this.cwd, 'foo', 'bar', 'dymme', 'nuxeo.war', 'ui');
        fs.mkdirpSync(target);

        // Create nuxeo.conf file somewhere beside the target folder
        const binTarget = path.join(this.cwd, 'foo', 'bar', 'bin');
        fs.mkdirpSync(binTarget);
        fs.writeJsonSync(path.join(binTarget, 'nuxeo.conf'), {});

        expect(new PathResolver().findBaseDistributionPath(target)).to.eq(path.resolve(binTarget, '..'));
      });
    });
  });

  describe('Child Path Finder class', function () {
    it('should detect child paths', function () {
      expect(containsChild(['/a/b'])).to.be.false();
      expect(containsChild(['/a/b', '/c', '/b'])).to.be.false();
      expect(containsChild(['/a/boby', '/a/bob', '/b'])).to.be.false();

      expect(containsChild(['/a/b', '/a', '/b', '/c'])).to.be.true();
      expect(containsChild(['/a/boby', '/a/../a/boby'])).to.be.true();
      expect(containsChild([process.cwd(), '.'])).to.be.true();

      expect(containsChild(['/var/folders/0r/z5sgbmt124zcfq_0g2g4sg9w0000gn/T/tmp-30031F3wqiBN4Zx3Q/a/b', '/var/folders/0r/z5sgbmt124zcfq_0g2g4sg9w0000gn/T/tmp-30031F3wqiBN4Zx3Q/b', '/var/folders/0r/z5sgbmt124zcfq_0g2g4sg9w0000gn/T/tmp-30031F3wqiBN4Zx3Q/a'])).to.be.true();
    });
  });
});
