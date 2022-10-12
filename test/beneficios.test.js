'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/beneficios.js')

class NewMockResponse extends Helper.Response {
  random (items) {
    return 'Tómate la tarde libre, proletario.'
  }
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false, response: NewMockResponse })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe entregar una imagen', t => {
  t.context.room.user.say('user', 'hubot un beneficio')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot un beneficio'],
      ['hubot', 'Tómate la tarde libre, proletario.']
    ])
    t.end()
  }, 500)
})
