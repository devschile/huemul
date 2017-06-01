'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')

const helper = new Helper('../scripts/portadas.js')
const now = new Date()
now.setHours(now.getHours() - 3) // UTC to -03:00
const date = now.toISOString().replace(/(\d+)-(\d+)-(\d+)T\d+:\d+:\d+.\d+Z/, '$1/$2/$3')

test.beforeEach(t => {
  nock('http://www.portadaschilenas.com')
    .get(`/${date}/Latercera_grande.jpg`)
    .reply(200)
  t.context.room = helper.createRoom({httpd: false})
})

test.afterEach(t => t.context.room.destroy())

test.cb('Debe entregar la portada de la tercera', t => {
  t.context.room.user.say('user', 'hubot portada tercera')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot portada tercera'],
      ['hubot', `http://www.portadaschilenas.com/${date}/Latercera_grande.jpg`]
    ])
    t.end()
  }, 500)
})
