'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/lmgtfy.js')

class NewMockResponse extends Helper.Response {
  random (items) {
    return '¿Era muy difícil? :wntard:'
  }
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false, response: NewMockResponse })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot google como testear')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot google como testear'],
      ['hubot', 'http://lmgtfy.com/?q=como%20testear\n¿Era muy difícil? :wntard:']
    ])
    t.end()
  }, 500)
})
test.cb('Debe entregar una sugerencia', t => {
  t.context.room.user.say('user', 'hubot lmgtfy @user como testear')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot lmgtfy @user como testear'],
      ['hubot', 'user: http://lmgtfy.com/?q=como%20testear\n¿Era muy difícil? :wntard:']
    ])
    t.end()
  }, 500)
})
