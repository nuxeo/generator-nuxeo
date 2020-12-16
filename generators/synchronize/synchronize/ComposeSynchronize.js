const debug = require('debug')('nuxeo:synchronize:docker');
const chalk = require('chalk');
const tar = require('tar');
const path = require('path');
const os = require('os');
const Docker = require('dockerode');
const ActionTrigger = require('./ActionTrigger').ActionTrigger;
const fs = require('fs-extra');
const docker = new Docker();

/**
 * Check if the given directory exists in the given container.
 * @param {*} container 
 * @param {*} dir 
 */
const checkIfDirectoryExists = (container, dir) => {
  const cmd = ['bash', '-c', `test -d ${dir} &&  echo '{"exists": true}' || echo '{"exists": false}'`];
  debug(cmd);
  return container.exec({
    cmd,
    user: 'root',
    attachStdout: true,
    attachStderr: true,
    tty: true
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

const execCommandOnContainer = (container, cmdLine) => {
  // Run the command on the container
  const cmd = ['bash', '-c', cmdLine];
  debug(cmd);
  return container.exec({
    cmd,
    user: 'root',
    attachStdout: true,
    attachStderr: true,
    tty: true
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

class DockerMkdirTrigger extends ActionTrigger {
  constructor(destination, config) {
    super();
    this.destination = destination;
    this.config = config;
    this.debug();
  }

  trigger() {
    this.logSync('Mkdir', 'magenta', this.displayDest);
    debug('Missing Destination Dir, trigger MkdirTrigger');

    // Run a docker command to create the missing folder
    const container = docker.getContainer(this.config.deployment.config.containerId);

    // Run the mkdir command on the container
    execCommandOnContainer(container, `install -d -m 0755 -o nuxeo -g nuxeo ${this.destination}`);
  }
}

class DockerCopyTrigger extends ActionTrigger {
  constructor(source, destination, config) {
    super();
    this.source = source;
    this.destination = destination;
    this.config = config;
    this.debug();
  }

  trigger() {
    this.logSync('Copy', 'green', `${this.displaySrc} ${chalk.grey('->')} ${this.displayDest}`);

    // Archive that will contain the file to put into the container
    const archive = path.join(os.tmpdir(), `nuxeo-sync-${Math.random()}.tgz`);

    // Check first if the directory parent exists in the Container
    const container = docker.getContainer(this.config.deployment.config.containerId);
    debug(container);

    // Check if the directory exists on the container before put the archive
    execCommandOnContainer(container, `test -d ${this._getDestinationFolder()} &&  echo '{"exists": true}' || echo '{"exists": false}'`).then((res) => {
      if (res[0].exists === false) {
        // Create the directory first
        return execCommandOnContainer(container, `install -d -m 0755 -o nuxeo -g nuxeo ${this._getDestinationFolder()}`);
      } else {
        // The directory exists, continue the action trigger
        Promise.resolve();
      }
    }).then(() => {
      debug( `Creating TAR file with file: ${this.source}`);
      return tar.c({
        gzip: true,
        portable: true,
        file: archive,
        cwd: this.config.src
      }, [this._getRelativeSourceFilePath()])
    }).then(() => {
      this.logSync('info', 'grey', `Putting archive into ${container.id}...`);
      // put tar archive in destination container's folder
      return container.putArchive(archive, {
        path: this.config.dest
      })
    }).then(() => {
      // Remove the tar file in the tmp folder
      fs.removeSync(archive);
    });
  }

  _getDestinationFolder() {
    return path.dirname(this.destination);
  }

  _getRelativeSourceFilePath() {
    // Extract the source folder from the path to have only a relative path to the file to put in the tar
    return path.relative(this.config.src, this.source);
  }
}

class DockerUnlinkTrigger extends ActionTrigger {
  constructor(destination, config) {
    super();
    this.destination = destination;
    this.config = config;
    this.debug();
  }

  trigger() {
    this.logSync('Delete', 'yellow', this.displayDest);
    const container = docker.getContainer(this.config.deployment.config.containerId);
    const cmd = ['bash', '-c', `rm -fr ${this.destination}`];
    debug(cmd);
    container.exec({
      cmd,
      user: 'root',
      attachStdout: true,
      attachStderr: true,
      tty: true
    }).then((exec) => {
      // Start exec command
      return exec.start({
        tty: true
      });
    }).then((stream) => {
      return new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
      });
    });
  }
}

module.exports = {
  configured: function (deployment) {
    return docker.listContainers({
      filters: {
        name: [`${deployment.config.serviceName}`]
      }
    }).then((containers) => {
      debug(containers);

      if (containers.length > 0) {
        return true;
      } else {
        this.log.error(`Unable to find container with name: "${deployment.config.serviceName}".`);
        return false;
      }
    }).catch((err) => {
      debug(err);
      return false;
    });
  },
  getContainerId: function(serviceName) {
    return docker.listContainers({
      filters: {
        name: [`${serviceName}`]
      }
    }).then((containers) => {
      debug(containers);
      if (containers.length <= 0) {
        this.log.error(`Unable to find container with name: "${serviceName}".`);
        throw new Error(`Unable to find container with name: "${serviceName}".`);
      }
      return containers[0].Id;
    });
  },
  Triggers : {
    Copy: DockerCopyTrigger,
    Unlink: DockerUnlinkTrigger,
    Mkdirp: DockerMkdirTrigger
  }
};