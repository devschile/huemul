'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/nosvimoh.js')

class NewMockResponse extends Helper.Response {
  random (items) {
    return 'https://memecrunch.com/meme/B521D/chao-nos-vimo/image.gif'
  }
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false, response: NewMockResponse })
})
test.afterEach(t => {
  t.context.room.destroy()
})
test.cb('Debe entregar una imagen', t => {
  t.context.room.user.say('user', 'hubot nosvimo')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot nosvimo'],
      ['hubot', 'https://memecrunch.com/meme/B521D/chao-nos-vimo/image.gif']
    ])
    t.end()
  }, 500)
})
