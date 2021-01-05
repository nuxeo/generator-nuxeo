const tar = require('tar');
const Docker = require('dockerode');
const debug = require('debug')('nuxeo:hotreload:compose');
const path = require('path');
const os = require('os');

const docker = new Docker();

module.exports = {
  configured: function () {
    const config = this._getDeploymentConfig();

    return docker.listContainers({
      filters: {
        name: [`${config.serviceName}`]
      }
    }).then((containers) => {
      debug(containers);

      if (containers.length > 0) {
        return true;
      } else {
        this.log.error(`Unable to find container with name: "${config.serviceName}".`);
        return false;
      }
    }).catch((err) => {
      debug(err);
      return false;
    });
  },

  trigger: function (modules) {
    const config = this._getDeploymentConfig();
    const archive = path.join(os.tmpdir(), `nuxeo-hotreload-${Math.random()}.tgz`);
    debug(`Archive name: ${archive}`);
    const jars = this._computeModulesJarsPath(modules);

    // Create archive
    this.log.info(`Creating TAR file from modules: ${modules.join(', ')}`);
    return tar.c({
      gzip: true,
      portable: true,
      file: archive,
      cwd: this.destinationRoot()
    }, jars)
      .then(() => {
        // Lookup configured container
        return docker.listContainers({
          filters: {
            name: [`${config.serviceName}`]
          }
        });
      }).then((containers) => {
        // Ensure only one match
        if (containers.length > 0) {
          return containers[0];
        }

        throw new Error('Too many containers matching names.');
      }).then((container) => {
        // map to Container obj
        return docker.getContainer(container.Id);
      }).then((container) => {
        debug(container);
        this.log.info(`Putting archive into ${container.id}...`);
        // put tar archive in /tmp container's folder
        return container.putArchive(archive, {
          path: '/tmp'
        }).then(() => {
          return container;
        });
      }).then((container) => {
        // create exec cmd to hot reload
        const content = this._buildBundlesFileList('bundle', jars, '/tmp');
        // TODO chmod is required because of `tar` library not able to change archived files mode; and sticks to local system umask.
        const cmd = ['bash', '-c', `chmod a+r /tmp/${modules.join(',')}/target/*jar && curl -X POST -d '${content}' http://localhost:8080/nuxeo/sdk/reload`];
        debug(cmd);
        debug(cmd.join(' '));
        debug(content);
        return container.exec({
          cmd,
          user: 'root',
          attachStdout: true,
          attachStderr: true,
          tty: true
        });
      }).then((exec) => {
        // Start exec command
        return exec.start({
          tty: true
        });
      }).then((stream)=> {
        return new Promise((resolve, reject) => {
          docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
        });
      });
  }
};
