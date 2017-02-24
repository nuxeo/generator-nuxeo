function formatArg(argItem) {
  var arg = '<' + argItem.name + '>';

  if (!argItem.config.required) {
    arg = '[' + arg + ']';
  }

  return arg;
}

/**
 * Code Originally from yeoman-generator/lib/actions/help mixin
 * But overriden to allow to change cmd line name
 */
var usage = module.exports = function () {
  var options = Object.keys(this._options).length ? '[options]' : '';
  var args = this._arguments.length ? this._arguments.map(formatArg).join(' ') : '';
  var binary = usage.prototype.resolvebinary(this.options);
  var out = binary + ' ' + options + ' ' + args;

  if (this.description) {
    out += '\n\n' + this.description;
  }

  return out;
};

usage.prototype.resolvebinary = function(opts) {
  var name = ' ' + opts.namespace.replace(/^yeoman:/, '');
  if (!opts._) {
    return 'yo' + name;
  } else {
    const ext = name.match(/(\[.*\])/);
    return opts.$0 + ' ' + opts._[0] + (ext ? ' ' + ext[0] : '');
  }
};
