'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/rut.js')
const pattern = /.+: (\d+.\d+.\d+-[\dkK])/

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe entregar un rut de persona', t => {
  t.context.room.user.say('user', 'hubot dame un rut persona')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot dame un rut persona'])
    const match = pattern.exec(t.context.room.messages[1])
    const result = parseInt(match[1].replace(/\./g, ''), 10)
    t.true(result < 25000000)
    t.true(result > 5000000)
    t.end()
  }, 500)
})
test.cb('Debe entregar un rut de empresa', t => {
  t.context.room.user.say('user', 'hubot dame un rut empresa')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot dame un rut empresa'])
    const match = pattern.exec(t.context.room.messages[1])
    const result = parseInt(match[1].replace(/\./g, ''), 10)
    t.true(result < 90000000)
    t.true(result > 50000000)
    t.end()
  }, 500)
})
test.cb('Debe entregar un rut de persona', t => {
  t.context.room.user.say('user', 'hubot dame un rut')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'hubot dame un rut'])
    const match = pattern.exec(t.context.room.messages[1])
    const result = parseInt(match[1].replace(/\./g, ''), 10)
    t.true(result < 25000000)
    t.true(result > 5000000)
    t.end()
  }, 500)
})
