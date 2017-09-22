const chalk = require('chalk');
const pad = require('pad-left');

module.exports = (text, lightColor = '0066FF', darkColor = '1F28BF') => {
  const d = chalk.hex(darkColor);
  const l = chalk.hex(lightColor);
  text = `${d('Nuxeo')} ${text}`;

  return '\n' + //
    l('dxxxxxxxxxxc   ') + l(' oxxo       lxxx') + d(' lkkl       ;kkk') + '\n' +
    l('dxxxxxxxxxxxd; ') + l(' oxxo       lxxx') + d(' lkkkx:.  ,dkkkx') + '\n' +
    l('dxxc       lxxo') + l(' oxxo       lxxx') + d('  "okkkkokkkkd, ') + '\n' +
    l('dxxc       lxxo') + l(' oxxo       lxxx') + d('    .dkkkkkk.   ') + pad('Welcome to', 25, ' ') + '\n' +
    l('dxxc       lxxo') + l(' oxxo       lxxx') + d('   ,dkkkkkkkk,  ') + pad(text, 50, ' ') + '\n' +
    l('dxxc       lxxo') + l(' "oxxcccccccdxxx') + d(' ,kkkkx" "okkkk,') + '\n' +
    l('loo;       :ooc') + l('   "cooooooooool') + d(' xkko       ckko') + '\n' +
    '\n' +
    l(':cc,       ;cc;') + d('                ') + l(' oxxxxxxxxxxxxxo') + '\n' +
    l('dxxc       lxxo') + d('                ') + l(' oxxxxxxxxxxxxxo') + '\n' +
    l('dxxc       lxxo') + d('                ') + l(' oxxo           ') + '\n' +
    l('dxxc       lxxo') + d('                ') + l(' oxxxxxxxxxxxxxo') + '\n' +
    l('dxxc       lxxo') + d('                ') + l(' oxxo           ') + '\n' +
    l('"cxxoooooooxxxo') + d('                ') + l(' oxxxxxxxxxxxxxo') + '\n' +
    l('   xoooooooxxxo') + d('                ') + l(' oxxxxxxxxxxxxxo') + '\n' +
    '\n' +
    d('lkkl       ;kkk') + l(' oxxxxxxxxxxxxxo') + l(' xooooooooooo,  ') + '\n' +
    d('lkkkx:.  ,dkkkx') + l(' oxxxxxxxxxxxxxo') + l(' lxxxxxxxxxxxxb;') + '\n' +
    d(' "okkkkokkkkd, ') + l(' oxxo           ') + l(' lxxd       :xxx') + '\n' +
    d('   .dkkkkkk.   ') + l(' oxxxxxxxxxxxxxo') + l(' lxxd       :xxx') + '\n' +
    d('  ,dkkkkkkkk,  ') + l(' oxxo           ') + l(' cxxd       :xxx') + '\n' +
    d(',kkkkx" "okkkk,') + l(' oxxxxxxxxxxxxxo') + l('  "oxxxxxxxxxxxx') + '\n' +
    d('xkko       ckko') + l(' oxxxxxxxxxxxxxo') + l('    :xxxxxxxxxxx') + '\n' +
    '\n';
};
