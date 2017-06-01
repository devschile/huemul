'use strict';

require('coffee-script/register');
const test = require('ava');
const Helper = require('hubot-test-helper');

const helper = new Helper('../scripts/pinera.coffee');

class NewMockResponse extends Helper.Response {
  random(items) {
    return 'https://pbs.twimg.com/media/Cy7cN3QWIAAP7pR.jpg';
  };
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({httpd: false, response: NewMockResponse});
});
test.afterEach(t => {
  t.context.room.destroy();
});
test.cb('Debe entregar una imagen', t => {
  t.context.room.user.say('user', 'piñera');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'piñera'],
      ['hubot', 'https://pbs.twimg.com/media/Cy7cN3QWIAAP7pR.jpg']
    ]);
    t.end();
  }, 500);
});
test.cb('Debe entregar una imagen', t => {
  t.context.room.user.say('user', 'yeta');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'yeta'],
      ['hubot', 'https://pbs.twimg.com/media/Cy7cN3QWIAAP7pR.jpg']
    ]);
    t.end();
  }, 500);
});
