'use strict';
var path = require('path');
var gulp = require('gulp');
var fs = require('fs');
var watch = require('gulp-watch');
var batch = require('gulp-batch');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var childProcess = require('child_process');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');

gulp.task('static', function() {
  return gulp.src('**/*.js')
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('nsp', function(cb) {
  nsp({
    package: path.resolve('package.json')
  }, cb);
});

gulp.task('pre-test', function() {
  return gulp.src(['generators/**/*.js', 'utils/*.js'])
    .pipe(istanbul({
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
});

gulp.task('watch-test', function() {
  watch(['**/*.js'], batch(function(events, done) {
    gulp.start('test', done);
  }));
});

gulp.task('checkstyle', function() {
  var targetFolder = 'target';
  if (fs.existsSync(targetFolder)) {
    childProcess.execSync('rm -rf ' + targetFolder);
  }
  fs.mkdirSync('target');

  return gulp.src(['generators/**/*.js', 'utils/*.js', 'test/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format('checkstyle', fs.createWriteStream(path.join(targetFolder, '/checkstyle.xml'))));
});

gulp.task('lint', ['checkstyle'], function() {
  return gulp.src(['generators/**/*.js', 'utils/*.js', 'test/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('test', ['lint', 'pre-test'], function(cb) {
  var mochaErr;

  gulp.src('test/**/*.js')
    .pipe(plumber())
    .pipe(mocha({
      reporter: 'spec'
    }))
    .on('error', function(err) {
      mochaErr = err;
    })
    .pipe(istanbul.writeReports())
    .on('end', function() {
      cb(mochaErr);
    });
});

gulp.task('prepublish', ['nsp']);
gulp.task('default', ['static', 'test']);
