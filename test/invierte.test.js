'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/invierte.js')

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe entregar el texto invertido', t => {
  t.context.room.user.say('user', 'hubot invierte hola mundo')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot invierte hola mundo'])
    t.regex(t.context.room.messages[1][1], /\u006F\u0070\u0075\u0075\u026F \u0250\u0283\u006F\u0265/)
    t.end()
  }, 500)
})
