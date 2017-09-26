/*eslint camelcase:0*/
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const beautify = require('js-beautify').html;
const xml = require('xml');

/**
Usage:
     var settings = require('utils/maven-settings.js')
     var f = settings.open();
     f.servers()
     f.addServer(id:username:password, force)
     f.containsServer(id)
*/

function locateSetting() {
  // Try to find `settings.xml` file
  let filename = path.join(require('os').homedir(), '.m2', 'settings.xml');
  if (!fs.existsSync(filename) && process.env.M2_HOME) {
    filename = path.join(process.env.M2_HOME, 'conf', 'settings.xml');
  }
  return filename;
}

function settings(filename) {
  if (!filename) {
    filename = locateSetting();
  }

  if (!fs.existsSync(filename)) {
    throw 'Unable to find settings.xml: ' + filename;
  }

  const content = fs.readFileSync(filename, {
    encoding: 'UTF-8'
  });

  const $ = cheerio.load(content, {
    xmlMode: true,
    lowerCaseTags: false
  });

  return {
    containsServer: function (id) {
      const node = this._findServerNode(id);
      if (node.is('server')) {
        return node.find('username').text();
      }
      return false;
    },

    addServer: function (server, force = false) {
      const [id, username, ...rest] = server.split(':');
      const password = rest.join(':');

      if (this.containsServer(id)) {
        // Do not override credentials on an existing server, except with force
        if (!force) {
          return false;
        }

        // Clean existing server node before adding new values
        this._findServerNode(id).remove();
      }

      this._ensureServersNode();
      $('servers').append($(xml({
        server: [{
          id
        }, {
          username
        },
        {
          password
        }
        ]
      })));

      return true;
    },

    _findServerNode: function (id) {
      return $('servers>server').filter((i, elt) => $(elt).find('id').text() === id).first();
    },

    _ensureServersNode: function () {
      if ($('settings>servers').length === 0) {
        $('settings').append($('<servers />'));
      }
    },

    _xml: function () {
      return beautify($.xml(), {
        indent_size: 2,
        preserve_newlines: 1
      });
    },

    save: function (_fs, file) {
      _fs.write(file || filename, this._xml());
    }
  };
}

module.exports = {
  open: settings,
  locateFile: locateSetting
};
