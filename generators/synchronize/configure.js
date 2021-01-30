const DEPLOYMENT_CONF = 'deployment:type';
const DEPLOYMENT_CONFIG = DEPLOYMENT_CONF + ':config';
const SYNCHRONIZE_CONFIG = 'synchronize:config';

module.exports = {

  _saveDeployment(deployment, config = {}) {
    this.config.set(DEPLOYMENT_CONF, deployment);
    this.config.set(DEPLOYMENT_CONFIG, Object.assign({}, config));
  },

  _saveSynchronizeConfig(config = {}) {
    this.config.set(SYNCHRONIZE_CONFIG, Object.assign({}, config));
  },

  _getDeployment() {
    return this.config.get(DEPLOYMENT_CONF);
  },

  _getDeploymentConfig() {
    return this.config.get(DEPLOYMENT_CONFIG);
  },

  _getSynchronizeConfig() {
    return this.config.get(SYNCHRONIZE_CONFIG);
  },
};
