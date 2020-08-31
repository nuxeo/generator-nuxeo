const assert = require('yeoman-assert');

describe('Docker spawn', () => {
  const _class = require('../../utils/docker-spawner')._class;
  const _yo = {
    log: () => { },
    destinationRoot: () => {
      return 'destRoot';
    },
  };

  it('can build params', () => {
    const opts = {
      image: 'img',
      envs: [
        {
          key: 'ENV',
          value: 'VAL'
        }, {
          key: 'ENV2',
          value: 'VAL2'
        },
      ],
      ports: [8080, '8081:8383'],
      extraOpts: 'extraOpts',
      cmd: 'bash -e',
    };

    const d = new _class(_yo, opts);
    console.log(d)

    assert.deepEqual(d._buildPorts(), ['-p8080:8080', '-p8081:8383']);
    assert.deepEqual(d._buildEnvs(), ['-eENV=\'VAL\'', '-eENV2=\'VAL2\'']);
    assert.deepEqual(d._buildCmd(), 'docker');
    assert.deepEqual(d._buildArgs(), ['run', '--rm', '-eENV=\'VAL\'', '-eENV2=\'VAL2\'', '-p8080:8080', '-p8081:8383', 'extraOpts', 'img', 'bash -e']);
  });

  it('can handle missing params', () => {
    const d = new _class(_yo, {
      image: 'img'
    });
    console.log(d)
    assert.deepEqual(d._buildArgs(), ['run', '--rm', 'img']);
  });
});
