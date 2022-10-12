'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/NaN.js')

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe entregar una imagen', t => {
  t.context.room.user.say('user', 'hubot NaN')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot NaN'],
      ['hubot', 'NaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaN Batman! ~ :huemul:']
    ])
    t.end()
  }, 500)
})
