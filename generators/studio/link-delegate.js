const spinner = require('../../utils/spinner');

const delegate = {
  prompting: function () {
    const that = this;
    const done = that.async();

    return this.prompt([{
      type: 'input',
      name: 'username',
      message: 'NOS Username:',
      when: function () {
        return !that._hasToken();
      },
      validate: (input) => {
        return input && input.length > 0 || 'Username is empty';
      }
    }, {
      type: 'password',
      name: 'password',
      message: 'NOS Password:',
      when: function () {
        return !that._hasToken();
      },
      validate: (input, answers) => {
        if (!(input && input.length > 0)) {
          return 'Password is empty';
        }
        return spinner(() => {
          return !!that._generateToken(answers.username, input);
        }) || 'Unable to authenticate to NOS Services';
      }
    }, {
      type: 'input',
      name: 'project',
      message: 'Studio Project:',
      default: that._getSymbolicName(),
      validate: (input) => {
        if (!(input && input.length > 0)) {
          return 'Username is empty';
        }

        return spinner(() => {
          return that._isProjectAccessible(input);
        }) || 'Unknow project';
      }
    }])
    .then((answers) => {
      that._setSymbolicName(answers.project);
      done();
    })
    .catch((e) => {
      that.log.error(e.message);
      done();
    });
  }
};

module.exports = {
  _linkDelegate: delegate
};
