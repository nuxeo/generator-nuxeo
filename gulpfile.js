/*eslint strict:0*/
'use strict';

const path = require('path');
const gulp = require('gulp');
const {
  series
} = gulp;
const fs = require('fs');
const rimraf = require('rimraf');
const watch = require('gulp-watch');
const debug = require('gulp-debug');
const batch = require('gulp-batch');
const eslint = require('gulp-eslint');
const excludeGitignore = require('gulp-exclude-gitignore');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const plumber = require('gulp-plumber');

const taskWatchTest = function () {
  watch(['generators/**/*.js', 'utils/*.js', 'test/**/*.js'], batch(function (events, done) {
    gulp.start('test', done);
  }));
};

const taskCheckstyle = function () {
  const targetFolder = 'target';
  if (fs.existsSync(targetFolder)) {
    rimraf.sync(targetFolder);
  }
  fs.mkdirSync('target');

  return gulp.src(['generators/**/*.js', 'utils/*.js', 'test/**/*.js'])
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format('checkstyle', fs.createWriteStream(path.join(targetFolder, '/checkstyle-result.xml'))));
};

//requires checkstyle
const taskLint = function () {
  return gulp.src(['generators/**/*.js', 'utils/*.js', 'test/**/*.js'])
    .pipe(excludeGitignore())
    .pipe(eslint({
        fix: true
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
};

const taskPreTest = function () {
  return gulp.src(['generators/**/*.js', 'utils/*.js'])
    .pipe(debug())
    .pipe(istanbul({
      includeUntested: false
    }))
    .pipe(istanbul.hookRequire());
};

// requires pre-test
const taskTest = function () {
  return gulp.src('test/**/*.js')
    .pipe(debug())
    .pipe(plumber())
    .pipe(mocha({
      // grep: 'clone the repository',
      reporter: 'spec',
      exit: true
    }))
    .once('error', () => {
      process.exit(1);
    })
    .pipe(istanbul.writeReports({
      reporters: ['lcov', 'json', 'text', 'text-summary', 'cobertura']
    }));
};

module.exports = {
  'watch-test': taskWatchTest,
  checkstyle: taskCheckstyle,
  lint: series(taskCheckstyle, taskLint),
  'pre-test': taskPreTest,
  test: series(taskPreTest, taskTest),
  prepublish: series(taskCheckstyle, taskLint, taskPreTest, taskTest),
  default: series(taskCheckstyle, taskLint, taskPreTest, taskTest),
};
