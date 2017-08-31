const ora = require('ora');

const oo = ora({
  text: ' Waiting...',
});

module.exports = function (func) {

  const s = oo.start();
  try {
    return func();
  } finally {
    s.stop();
  }
};

module.exports.async = oo;
