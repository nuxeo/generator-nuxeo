const debug = require('debug')('nuxeo:utils:spawn');
const readline = require('readline');

function spawn(options = {}) {
  let { binary, stderrWriter, stdoutWriter, args } = Object.assign({
    binary: undefined,
    stdoutWriter: () => {},
    stderrWriter: () => {},
    args: []
  }, options);

  if (args.length === 1) {
    args = args[0].split(' ');
  }

  debug('Spawn: %o', `${binary} ${args.join(' ')}`);

  const child = require('child_process').spawn(binary, args, {
    cwd: this.destinationRoot(),
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    const ora = require('./spinner').async;
    if (!debug.enabled) {
      ora.text = 'Working... It can take some time, please be patient.';
      ora.start();
    }

    const rlout = readline.createInterface({
      input: child.stdout
    });
    const rlerr = readline.createInterface({
      input: child.stderr
    });

    rlout.on('line', (line) => {
      stdoutWriter(line);
    });

    rlerr.on('line', (line) => {
      stderrWriter(line);
    });

    child.on('close', (code) => {
      debug(`Process exited with code ${code}`);
      ora.stop();

      if (code !== 0) {
        reject(code);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  spawn
};
