'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/kendrick.js')

class NewMockResponse extends Helper.Response {
  random (items) {
    return 'http://i.giphy.com/bZkQ55qlfrwgE.gif'
  }
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false, response: NewMockResponse })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Obtener un imagen random', t => {
  t.context.room.user.say('user', 'hubot anna')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'hubot anna'], ['hubot', 'http://i.giphy.com/bZkQ55qlfrwgE.gif']])
    t.end()
  }, 500)
})
