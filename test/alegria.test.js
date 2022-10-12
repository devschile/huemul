'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/alegria.js')

class NewMockResponse extends Helper.Response {
  random (items) {
    return 'http://i.imgur.com/1CVUXQE.jpg'
  }
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false, response: NewMockResponse })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe entregar una imagen', t => {
  t.context.room.user.say('user', 'hubot alegria')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'hubot alegria'], ['hubot', 'http://i.imgur.com/1CVUXQE.jpg']])
    t.end()
  }, 500)
})
test.cb('Debe entregar una imagen', t => {
  t.context.room.user.say('user', 'hubot alegría')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'hubot alegría'], ['hubot', 'http://i.imgur.com/1CVUXQE.jpg']])
    t.end()
  }, 500)
})
test.cb('Debe entregar una imagen', t => {
  t.context.room.user.say('user', 'hubot alegrame')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'hubot alegrame'], ['hubot', 'http://i.imgur.com/1CVUXQE.jpg']])
    t.end()
  }, 500)
})
test.cb('Debe entregar una imagen', t => {
  t.context.room.user.say('user', 'hubot alégrame')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'hubot alégrame'], ['hubot', 'http://i.imgur.com/1CVUXQE.jpg']])
    t.end()
  }, 500)
})
test.cb('Debe entregar una imagen', t => {
  t.context.room.user.say('user', 'hubot felicidad')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'hubot felicidad'], ['hubot', 'http://i.imgur.com/1CVUXQE.jpg']])
    t.end()
  }, 500)
})
test.cb('Debe entregar una imagen', t => {
  t.context.room.user.say('user', 'hubot feliz')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'hubot feliz'], ['hubot', 'http://i.imgur.com/1CVUXQE.jpg']])
    t.end()
  }, 500)
})
test.cb('Debe entregar una imagen', t => {
  t.context.room.user.say('user', 'hubot yay')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'hubot yay'], ['hubot', 'http://i.imgur.com/1CVUXQE.jpg']])
    t.end()
  }, 500)
})
