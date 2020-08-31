const _ = require('lodash');
const debug = require('debug')('nuxeo:generator:studio:docker');
const rl = require('readline');

class DockerRunner {
  constructor(yo, opts) {
    this.yo = yo;
    this.bin = 'docker'; // Handle win32 bin?

    const { envs, image, ports, extraOpts, volumes, mounts, cmd, onData, onError } = Object.assign({
      envs: [],
      image: '',
      ports: [],
      extraOpts: '',
      mounts: [],
      volumes: [],
      cmd: '',
      onData: () => { },
      onError: () => { },
    }, opts);

    this.extraOpts = extraOpts;
    this.image = image;
    this.envs = envs;
    this.ports = ports;
    this.volumes = volumes;
    this.mounts = mounts;
    this.cmd = cmd;

    this.onData = onData;
    this.onError = onError;
  }

  _buildVolumes() {
    return _(this.volumes).map((volume) => {
      return volume.indexOf(':') >= 0 ? volume.split(':') : [volume, volume];
    }).map((volume) => {
      return `-v${volume[0]}:${volume[1]}`;
    }).value();
  }

  _buildPorts() {
    return _(this.ports).map((port) => {
      return port.toString();
    }).map((port) => {
      return '-p' + (port.indexOf(':') >= 0 ? port : `${port}:${port}`);
    }).value();
  }

  _buildEnvs() {
    return _(this.envs).map((env) => {
      const { key, value } = env;
      return `-e${key}=${value}`;
    }).value();
  }

  _buildMounts() {
    return _(this.mounts).map((mount) => {
      return `--mount=${mount}`;
    }).value();
  }

  _buildArgs() {
    return _(['run', '--rm']).concat(this._buildEnvs(), this._buildVolumes(), this._buildMounts(), this._buildPorts(), [this.extraOpts, this.image, this.cmd]).filter((elt) => {
      return !_.isEmpty(elt);
    }).value();
  }

  _buildCmd() {
    return this.bin;
  }

  run() {
    debug('%O', this._buildArgs());
    debug('%s', this._buildCmd() + ' ' + _.join(this._buildArgs(), ' '));
    const docker = require('child_process').spawn(this._buildCmd(), this._buildArgs(), {
      cwd: this.yo.destinationRoot(),
      encoding: 'utf-8',
      stdio: [undefined, 'pipe', 'pipe'],
    });

    return new Promise((resolve, reject) => {
      rl.createInterface(docker.stdout).on('line', (data) => {
        const line = String(data).trim();
        debug(line);
        this.onData(line);
      });

      rl.createInterface(docker.stderr).on('line', (data) => {
        const line = String(data).trim();
        debug(line);
        this.onError(line);
      });

      docker.on('close', (code) => {
        debug(`Process exited with code ${code}`);

        if (code !== 0) {
          reject(code);
        } else {
          resolve();
        }
      });
    });
  }
}

/**
 * run({
 *  envs: [
 * {key: TOKEN}]
 * });
 */
module.exports = {
  run: (yo, opts = {}) => {
    const docker = new DockerRunner(yo, opts);
    return docker.run();
  },

  _class: DockerRunner,
};
