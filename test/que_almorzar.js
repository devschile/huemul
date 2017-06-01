'use strict';

require('coffee-script/register');
const test = require('ava');
const Helper = require('hubot-test-helper');

const helper = new Helper('../scripts/que_almorzar.coffee');

class NewMockResponse extends Helper.Response {
  random(items) {
    return 'cerveza';
  };
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({httpd: false, response: NewMockResponse});
});
test.afterEach(t => {
  t.context.room.destroy();
});
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot qué desayunar');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot qué desayunar'],
      ['hubot', 'Te sugiero: cerveza']
    ]);
    t.end();
  }, 500);
});
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot que desayunar');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot que desayunar'],
      ['hubot', 'Te sugiero: cerveza']
    ]);
    t.end();
  }, 500);
});
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot qué almorzar');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot qué almorzar'],
      ['hubot', 'Te sugiero: cerveza']
    ]);
    t.end();
  }, 500);
});
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot que almorzar');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot que almorzar'],
      ['hubot', 'Te sugiero: cerveza']
    ]);
    t.end();
  }, 500);
});
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot qué cenar');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot qué cenar'],
      ['hubot', 'Para el *anvre*: cerveza']
    ]);
    t.end();
  }, 500);
});
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot que cenar');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot que cenar'],
      ['hubot', 'Para el *anvre*: cerveza']
    ]);
    t.end();
  }, 500);
});
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot qué tomar');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot qué tomar'],
      ['hubot', 'Si tienes sed: cerveza']
    ]);
    t.end();
  }, 500);
});
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot que tomar');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot que tomar'],
      ['hubot', 'Si tienes sed: cerveza']
    ]);
    t.end();
  }, 500);
});
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot qué cerveza tomar');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot qué cerveza tomar'],
      ['hubot', 'Si tienes sed: cerveza']
    ]);
    t.end();
  }, 500);
});
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot que cerveza tomar');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot que cerveza tomar'],
      ['hubot', 'Si tienes sed: cerveza']
    ]);
    t.end();
  }, 500);
});
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot qué comer');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot qué comer'],
      ['hubot', 'Depende de la comida para: *desayunar*, *almorzar* ó *cenar*. Pregúntame de nuevo.']
    ]);
    t.end();
  }, 500);
});
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot que comer');
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot que comer'],
      ['hubot', 'Depende de la comida para: *desayunar*, *almorzar* ó *cenar*. Pregúntame de nuevo.']
    ]);
    t.end();
  }, 500);
});
