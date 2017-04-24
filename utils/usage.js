function formatArg(argItem) {
  var arg = '<' + argItem.name + '>';

  if (!argItem.required) {
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

usage.prototype.isYeoman = function (opts) {
  return opts ? !opts._ncli : true;
};

usage.prototype.resolvebinary = function (opts) {
  let name = opts.namespace.replace(/^yeoman:/, '');
  if (usage.prototype.isYeoman(opts)) {
    return 'yo ' + name;
  } else {
    let [, cmd, ext = ''] = name.match(/(?:nuxeo:)?([\w]+)(\s*\[.*\])?/);
    if (cmd === 'nuxeo') {
      cmd = 'bootstrap';
    }
    return opts.$0 + ' ' + cmd + ext;
  }
};
