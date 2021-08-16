'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/dameunpiolin.js')

class NewMockResponse extends Helper.Response {
  random (items) {
    return 'https://i.imgur.com/RKJwhsn.jpg'
  }
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false, response: NewMockResponse })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe entregar un piolin', t => {
  t.context.room.user.say('user', 'hubot piolin')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'hubot piolin'], ['hubot', 'https://i.imgur.com/RKJwhsn.jpg']])
    t.end()
  }, 500)
})
test.cb('Debe entregar un piolin', t => {
  t.context.room.user.say('user', 'hubot piolín')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'hubot piolín'], ['hubot', 'https://i.imgur.com/RKJwhsn.jpg']])
    t.end()
  }, 500)
})
