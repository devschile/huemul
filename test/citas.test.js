'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/citas.js')

class NewMockResponse extends Helper.Response {
  random (items) {
    return { quote: 'Lo bien hecho es mejor que lo bien dicho.', author: 'Benjamin Franklin' }
  }
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false, response: NewMockResponse })
  t.context.room.robot.adapter.client = {
    web: {
      chat: {
        postMessage: (channel, text, options) => {
          t.context.postMessage = {
            channel: channel,
            text: text,
            options: options
          }
          t.end()
        }
      }
    }
  }
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe entregar una cita', t => {
  t.context.room.user.say('user', 'hubot una cita')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'hubot una cita']])
    t.deepEqual(t.context.postMessage.options.username, 'Benjamin Franklin')
    t.deepEqual(t.context.postMessage.options.attachments, [
      {
        fallback: 'Lo bien hecho es mejor que lo bien dicho.',
        text: 'Lo bien hecho es mejor que lo bien dicho.',
        color: 'info'
      }
    ])
    t.end()
  }, 500)
})
