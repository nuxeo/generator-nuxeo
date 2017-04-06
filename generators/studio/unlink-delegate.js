const spinner = require('../../utils/spinner');

const delegate = {
  prompting: function () {
    const that = this;
    const done = that.async();

    return this.prompt([{
      type: 'confirm',
      name: 'unlink',
      message: 'Are you sure to unlink?'
    }])
    .then(function(answers) {
      this.answers = answers;

      done();
    }.bind(this));
  },

  configuring: function() {
    if (this.answers.unlink) {
      spinner(() => {
        this._revokeToken();
      });
    }
  },

  end: function() {
    if (this.answers.unlink) {
      this.log.info('Your NOS account has been unlink.');
    }
  }
};

module.exports = {
  _unlinkDelegate: delegate
};
