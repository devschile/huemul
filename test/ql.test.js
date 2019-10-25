'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/ql.js')

class NewMockResponse extends Helper.Response {
  random (items) {
    return "\n (҂._.)\n <,╤╦╤─ ҉ - - - - :huemul:\n /--'\n"
  }
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false, response: NewMockResponse })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe entregar un ascii art', t => {
  t.context.room.user.say('user', 'hubot ql')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot ql'],
      ['hubot', "\n (҂._.)\n <,╤╦╤─ ҉ - - - - :huemul:\n /--'\n"]
    ])
    t.end()
  }, 500)
})
test.cb('Debe entregar un ascii art', t => {
  t.context.room.user.say('user', 'hubot rql')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot rql'],
      ['hubot', "\n (҂._.)\n <,╤╦╤─ ҉ - - - - :huemul:\n /--'\n"]
    ])
    t.end()
  }, 500)
})
test.cb('Debe entregar un ascii art', t => {
  t.context.room.user.say('user', 'hubot ctm')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot ctm'],
      ['hubot', "\n (҂._.)\n <,╤╦╤─ ҉ - - - - :huemul:\n /--'\n"]
    ])
    t.end()
  }, 500)
})
test.cb('Debe entregar un ascii art', t => {
  t.context.room.user.say('user', 'hubot mátate')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot mátate'],
      ['hubot', "\n (҂._.)\n <,╤╦╤─ ҉ - - - - :huemul:\n /--'\n"]
    ])
    t.end()
  }, 500)
})
test.cb('Debe entregar un ascii art', t => {
  t.context.room.user.say('user', 'hubot matate')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot matate'],
      ['hubot', "\n (҂._.)\n <,╤╦╤─ ҉ - - - - :huemul:\n /--'\n"]
    ])
    t.end()
  }, 500)
})
test.cb('Debe entregar un ascii art', t => {
  t.context.room.user.say('user', 'hubot culiao')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot culiao'],
      ['hubot', "\n (҂._.)\n <,╤╦╤─ ҉ - - - - :huemul:\n /--'\n"]
    ])
    t.end()
  }, 500)
})
test.cb('Debe entregar un ascii art', t => {
  t.context.room.user.say('user', 'hubot reculiao')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot reculiao'],
      ['hubot', "\n (҂._.)\n <,╤╦╤─ ҉ - - - - :huemul:\n /--'\n"]
    ])
    t.end()
  }, 500)
})
test.cb('Debe entregar un ascii art', t => {
  t.context.room.user.say('user', 'hubot remilculiao')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot remilculiao'],
      ['hubot', "\n (҂._.)\n <,╤╦╤─ ҉ - - - - :huemul:\n /--'\n"]
    ])
    t.end()
  }, 500)
})
