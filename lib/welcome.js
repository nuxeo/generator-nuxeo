const chalk = require('chalk');
const sprintf = require('sprintf-js').sprintf;

module.exports = (text, color = '0066FF') => {
  const h = chalk.hex(color);
  text = `${h('Nuxeo')} ${text}`;

  return h('                                             \n') +
    h('                                             \n') +
    h('           XXXXXX           XXXXXX           \n') +
    h('           XXXXXXXX       XXXXXXXX           \n') +
    h('           XXXXXXXXXX   XXXXXXXXXX           \n') +
    h('            XXXXXXXXXXXXXXXXXXXXXX           \n') +
    h('              XXXXXXXXXXXXXXXXXX             ') + 'Welcome to' + '\n' +
    h('                XXXXXXXXXXXXX                ') + sprintf('%40s', text) + '\n' +
    h('                XXXXXXXXXXXXX                \n') +
    h('              XXXXXXXXXXXXXXXXXX             \n') +
    h('            XXXXXXXXXXXXXXXXXXXXXX           \n') +
    h('           XXXXXXXXXX   XXXXXXXXXX           \n') +
    h('           XXXXXXXX       XXXXXXXX           \n') +
    h('           XXXXXX           XXXXXX           \n') +
    h('                                             \n') +
    h('                                             \n');
};
