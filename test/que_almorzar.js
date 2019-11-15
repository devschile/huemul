'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/que_almorzar.js')

class NewMockResponse extends Helper.Response {
  random (items) {
    return 'cerveza'
  }
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false, response: NewMockResponse })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot qué desayunar')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot qué desayunar'])
    t.deepEqual(t.context.room.messages[1].slice(-1)[0].attachments[0].fallback, 'user te sugiero: cerveza')
    t.end()
  }, 500)
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot que desayunar')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot que desayunar'])
    t.deepEqual(t.context.room.messages[1].slice(-1)[0].attachments[0].fallback, 'user te sugiero: cerveza')
    t.end()
  }, 500)
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot qué almorzar')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot qué almorzar'])
    t.deepEqual(t.context.room.messages[1].slice(-1)[0].attachments[0].fallback, 'user te sugiero: cerveza')
    t.end()
  }, 500)
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot que almorzar')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot que almorzar'])
    t.deepEqual(t.context.room.messages[1].slice(-1)[0].attachments[0].fallback, 'user te sugiero: cerveza')
    t.end()
  }, 500)
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot qué cenar')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot qué cenar'])
    t.deepEqual(t.context.room.messages[1].slice(-1)[0].attachments[0].fallback, 'user para el *anvre*: cerveza')
    t.end()
  }, 500)
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot que cenar')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot que cenar'])
    t.deepEqual(t.context.room.messages[1].slice(-1)[0].attachments[0].fallback, 'user para el *anvre*: cerveza')
    t.end()
  }, 500)
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot qué tomar')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot qué tomar'])
    t.deepEqual(t.context.room.messages[1].slice(-1)[0].attachments[0].fallback, 'user si tienes sed: cerveza')
    t.end()
  }, 500)
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot que tomar')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot que tomar'])
    t.deepEqual(t.context.room.messages[1].slice(-1)[0].attachments[0].fallback, 'user si tienes sed: cerveza')
    t.end()
  }, 500)
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot qué cerveza tomar')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot qué cerveza tomar'])
    t.deepEqual(t.context.room.messages[1].slice(-1)[0].attachments[0].fallback, 'user si tienes sed: cerveza')
    t.end()
  }, 500)
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot que cerveza tomar')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot que cerveza tomar'])
    t.deepEqual(t.context.room.messages[1].slice(-1)[0].attachments[0].fallback, 'user si tienes sed: cerveza')
    t.end()
  }, 500)
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot qué comer')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot qué comer'],
      ['hubot', 'Depende de la comida para: *desayunar*, *almorzar* ó *cenar*. Pregúntame de nuevo.']
    ])
    t.end()
  }, 500)
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot que comer')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot que comer'],
      ['hubot', 'Depende de la comida para: *desayunar*, *almorzar* ó *cenar*. Pregúntame de nuevo.']
    ])
    t.end()
  }, 500)
})
