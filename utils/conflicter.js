/**
 * Custom Conflicter based on the default one from yeoman
 *
 * The changes is only on the way to how collision is handled
 * instead of using a "force" flag; a callback is used
 *
 * In the case of the nuxeo-generator; it is usefull to skip collision in `pom.xml` as it is updated ofter.
 */
var Conflicter = require('yeoman-generator/lib/util/conflicter');
var pathExists = require('path-exists');
var detectConflict = require('detect-conflict');
var path = require('path');

/**
 * Check if a file conflict with the current version on the user disk.
 *
 * A basic check is done to see if the file exists, if it does:
 *
 *   1. Read its content from  `fs`
 *   2. Compare it with the provided content
 *   3. If identical, mark it as is and skip the check
 *   4. If diverged, prepare and show up the file collision menu
 *
 * @param  {Object}   file File object respecting this interface: { path, contents }
 * @param  {Function} cb Callback receiving a status string ('identical', 'create',
 *                       'skip', 'force')
 * @return {null} nothing
 */
Conflicter.prototype.collision = function(file, cb) {
  var rfilepath = path.relative(process.cwd(), file.path);

  if (!pathExists.sync(file.path)) {
    this.adapter.log.create(rfilepath);
    cb('create');
    return;
  }

  if (this.force || this.isForce && this.isForce(rfilepath)) {
    this.adapter.log.force(rfilepath);
    cb('force');
    return;
  }

  if (detectConflict(file.path, file.contents)) {
    this.adapter.log.conflict(rfilepath);
    this._ask(file, cb);
  } else {
    this.adapter.log.identical(rfilepath);
    cb('identical');
  }
};

module.exports = function(adapter, force) {
  var pForce = typeof force === 'boolean' ? force : false;
  var fForce = typeof force === 'function' ? force : undefined;

  var that = new Conflicter(adapter, pForce);
  that.isForce = fForce;
  return that;
};
