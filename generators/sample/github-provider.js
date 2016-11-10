/*eslint camelcase:0*/
var GitHubApi = require('github');
var clone = require('yeoman-remote');

var gh = new GitHubApi();

module.exports._git = {
  fetchBranches: function(repository) {
    return gh.repos.getBranches({
      owner: repository.user,
      repo: repository.repo,
      per_page: 100
    });
  },

  clone: function(answers, callback) {
    clone(answers.repository.user, answers.repository.repo, answers.branch, (err, remote) => {
      callback(err, remote);
    }, true);
  }
};
