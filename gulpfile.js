/*eslint strict:0*/
'use strict';

var path = require('path');
var gulp = require('gulp');
var fs = require('fs');
var rimraf = require('rimraf');
var watch = require('gulp-watch');
const debug = require('gulp-debug');
var batch = require('gulp-batch');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');

gulp.task('nsp', function(cb) {
  nsp({
    shrinkwrap: __dirname + '/npm-shrinkwrap.json',
    package: path.resolve('package.json')
  }, cb);
});

gulp.task('watch-test', function() {
  watch(['generators/**/*.js', 'utils/*.js', 'test/**/*.js'], batch(function(events, done) {
    gulp.start('test', done);
  }));
});

gulp.task('checkstyle', function() {
  var targetFolder = 'target';
  if (fs.existsSync(targetFolder)) {
    rimraf.sync(targetFolder);
  }
  fs.mkdirSync('target');

  return gulp.src(['generators/**/*.js', 'utils/*.js', 'test/**/*.js'])
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format('checkstyle', fs.createWriteStream(path.join(targetFolder, '/checkstyle-result.xml'))));
});

gulp.task('lint', ['checkstyle'], function() {
  return gulp.src(['generators/**/*.js', 'utils/*.js', 'test/**/*.js'])
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('pre-test', function() {
  return gulp.src(['generators/**/*.js', 'utils/*.js'])
    .pipe(debug())
    .pipe(istanbul({
      includeUntested: false
    }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function() {
  return gulp.src('test/**/*.js')
    .pipe(debug())
    .pipe(plumber())
    .pipe(mocha({
      reporter: 'spec'
    }))
    .once('error', () => {
      process.exit(1);
    })
    .pipe(istanbul.writeReports({
      reporters: ['lcov', 'json', 'text', 'text-summary', 'cobertura']
    }));
});

gulp.task('prepublish', ['lint', 'test', 'nsp']);
gulp.task('default', ['lint', 'test']);
