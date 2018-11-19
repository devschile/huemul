'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/gotico.js')

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe traducir el texto', t => {
  t.context.room.user.say('user', 'hubot gotico Hola mundo')
  setTimeout(() => {
    const user = t.context.room.messages[0]
    const hubot = t.context.room.messages[1]
    t.deepEqual(user, ['user', 'hubot gotico Hola mundo'])
    t.deepEqual(hubot, ['hubot', 'ℌ𝔬𝔩𝔞 𝔪𝔲𝔫𝔡𝔬'])
    t.end()
  }, 500)
})
