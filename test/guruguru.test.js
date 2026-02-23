'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/guruguru.js')

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe traducir el texto', t => {
  t.context.room.user.say('user', 'hubot guru hola mundo')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot guru hola mundo'],
      ['hubot', 'hoga ñugngo']
    ])
    t.end()
  }, 500)
})
