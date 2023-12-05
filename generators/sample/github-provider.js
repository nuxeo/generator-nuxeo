/*eslint camelcase:0*/
const { Octokit } = require('@octokit/rest');
const clone = require('yeoman-remote');
const _ = require('lodash');

const gh = new Octokit();

module.exports._git = {
  fetchReleases: function(repository) {
    return gh.repos.listTags({
      owner: repository.user,
      repo: repository.repo,
      per_page: 100
    }).then((response) => {
      // Add master to be able to fetch latest dev version
      return _.concat(response.data, 'master');
    });
  },

  clone: function(answers, callback) {
    clone(answers.repository.user, answers.repository.repo, answers.branch, (err, remote) => {
      callback(err, remote);
    }, true);
  }
};
