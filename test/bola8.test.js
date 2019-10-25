'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/bola8.js')

class NewMockResponse extends Helper.Response {
  random (items) {
    return 'Sin duda'
  }
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false, response: NewMockResponse })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe entregar una respuesta', t => {
  t.context.room.user.say('user', 'hubot pregunta sere el mejor bot')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot pregunta sere el mejor bot'],
      ['hubot', ':huemul: ~ Sin duda']
    ])
    t.end()
  }, 500)
})
test.cb('Debe entregar un consejo', t => {
  t.context.room.user.say('user', 'hubot consejo como puedo ser mejor')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot consejo como puedo ser mejor'],
      ['hubot', ':huemul: ~ Sin duda']
    ])
    t.end()
  }, 500)
})
