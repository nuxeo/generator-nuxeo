/**
 * Custom Conflicter based on the default one from yeoman
 *
 * The changes is only on the way to how collision is handled
 * instead of using a "force" flag; a callback is used
 *
 * In the case of the nuxeo-generator; it is usefull to skip collision in `pom.xml` as it is updated ofter.
 */
const Conflicter = require('yeoman-generator/lib/util/conflicter');
const pathExists = require('path-exists');
const detectConflict = require('detect-conflict');
const path = require('path');

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
  const rfilepath = path.relative(process.cwd(), file.path);

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
  const pForce = typeof force === 'boolean' ? force : false;
  const fForce = typeof force === 'function' ? force : undefined;

  const that = new Conflicter(adapter, pForce);
  that.isForce = fForce;
  return that;
};
