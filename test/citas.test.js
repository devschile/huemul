'use strict';

require('coffee-script/register');
const test = require('ava');
const Helper = require('hubot-test-helper');

const helper = new Helper('../scripts/citas.js');

class NewMockResponse extends Helper.Response {
  random(items) {
    return '> Lo bien hecho es mejor que lo bien dicho. *-Benjamin Franklin*';
  };
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({httpd: false, response: NewMockResponse});
});
test.afterEach(t => {
  t.context.room.destroy();
});
test.cb('Debe entregar una cita', t => {
  t.context.room.user.say('user', 'hubot una cita');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot una cita'],
      ['hubot', '> Lo bien hecho es mejor que lo bien dicho. *-Benjamin Franklin*']
    ]);
    t.end();
  }, 500);
});
