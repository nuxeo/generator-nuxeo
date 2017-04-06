const ora = require('ora');

module.exports = function (func) {

  const s = ora({
    text: ' Waiting...',
    spinner: {
      frames: ['\u2026']
    }
  }).start();
  try {
    return func();
  } finally {
    s.stop();
  }
};
