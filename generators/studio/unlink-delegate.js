const spinner = require('../../utils/spinner');
const Conflicter = require('../../utils/conflicter.js');

const delegate = {
  initializing: function () {
    this.conflicter = new Conflicter(this.env.adapter, (filename) => {
      return this.options.force || filename.match(/pom\.xml$/);
    });
  },

  prompting: function () {
    const that = this;
    const done = that.async();

    return this.prompt([{
      type: 'confirm',
      name: 'unlink',
      message: 'Are you sure to unlink?'
    }])
      .then(function (answers) {
        this.answers = answers;

        done();
      }.bind(this));
  },

  writing: function () {
    if (this.answers.unlink) {
      const done = this.async();
      return spinner(() => {
        return this._revokeToken().then(() => {
          if (this._containsPom()) {
            this._removeDependency();
            this._setMavenGav(undefined);
          }
          done();
        });
      });
    }
  },

  end: function () {
    if (this.answers.unlink) {
      this.log.info('Your NOS account has been unlink.');
    }
  }
};

module.exports = delegate;
