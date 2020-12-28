const maven = require('./maven.js');
const _ = require('lodash');
const path = require('path');
const exists = require('path-exists').sync;
const fs = require('fs');

function listModules(rootFolder) {
  const pomPath = path.join(rootFolder, 'pom.xml');
  if (!exists(pomPath)) {
    throw new Error(`No pom.xml file found in ${rootFolder}.`);
  }

  let pom = maven.open(pomPath);
  // If parent pom is not a BOM; there is no child module.
  if (!pom.isBom()) {
    return ['.'];
  }
  return _(pom.modules()).filter((module) => {
    return maven.open(path.join(rootFolder, module, 'pom.xml')).packaging() === 'jar';
  }).value();
}

function modulesToChoices(modules) {
  return _(modules).map((module) => {
    return {
      name: module
    };
  }).value();
}

module.exports = {
  listModules: listModules,
  modulesToChoices: modulesToChoices
};
