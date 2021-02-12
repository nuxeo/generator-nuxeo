const path = require('path');
const {DEPLOYMENTS} = require('../../utils/deployment-helper');
const Watcher = require('./synchronize/Watcher');

const delegate = {

  prompting: function () {
    let done = this.async();

    return this.prompt([{
      type: 'list',
      name: 'deployment',
      message: 'Nuxeo server deployment:',
      store: true,
      choices: [{
        name: DEPLOYMENTS.LOCAL
      }, {
        name: DEPLOYMENTS.COMPOSE
      }]
    }, {
      type: 'input',
      name: 'pattern',
      message: 'File pattern to synchronize:',
      store: true,
      default: Watcher.Watcher.GLOB
    }, {
      type: 'input',
      name: 'serviceName', message: 'Name of the Docker compose service for the Nuxeo server:',
      default: `${path.basename(this.destinationRoot())}_nuxeo_1`,
      store: true,
      when: (answers) => {
        return answers.deployment === DEPLOYMENTS.COMPOSE;
      }
    }, {
      type: 'input',
      name: 'sources_input',
      message: '> Your source folder content will be synchronized within your container\' `nxserver/nuxeo.war/ui/` folder.',
      when: (answers) => {
        return answers.deployment === DEPLOYMENTS.COMPOSE;
      }
    }, {
      type: 'input',
      name: 'src',
      store: true,
      desc: 'Path to the source folder',
    }, {
      type: 'input',
      name: 'dest',
      store: true,
      desc: 'Path to the destination folder',
      when: (answers) => {
        return answers.deployment === DEPLOYMENTS.LOCAL;
      }
    }]).then((answers) => {
      this._saveDeployment(answers.deployment, {
        serviceName: answers.serviceName
      });

      // In a Docker deployment, the destination is always the same as it's predefined in the Docker image
      const dest = answers.deployment === DEPLOYMENTS.LOCAL ? answers.dest : '/opt/nuxeo/server/nxserver/nuxeo.war/ui/';
      this._saveSynchronizeConfig({
        src: answers.src,
        dest: dest,
        pattern: answers.pattern.trim()
      });
      done();
    });
  },

  end: function () {
    this.log.info('Nuxeo synchronization has been configured.');
  }
};

module.exports = delegate;
