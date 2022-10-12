'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')

const helper = new Helper('../scripts/temblor.js')

test.beforeEach(t => {
  nock('https://earthquake.usgs.gov')
    .get('/fdsnws/event/1/query')
    .query({ format: 'geojson', minmagnitude: 6 })
    .reply(200, { features: [] })
  t.context.room = helper.createRoom({ httpd: false })
})
test.afterEach(t => {
  t.context.room.destroy()
})

test.cb.serial('Es imposible que no hayan temblores sobre 6 en el mundo durante un mes.', t => {
  t.context.room.user.say('user', 'hubot temblores')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot temblores'],
      ['hubot', 'Por suerte, ningún temblor mayor a 6 grados en todo el mundo.']
    ])
    t.end()
  }, 500)
})
test.cb.serial('Lugar donde no hayan temblores. Nunca.', t => {
  t.context.room.user.say('user', 'hubot temblores enunlugardondenuncatiembla')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot temblores enunlugardondenuncatiembla'],
      ['hubot', 'Por suerte, ningún temblor mayor a 6 grados en ENUNLUGARDONDENUNCATIEMBLA.']
    ])
    t.end()
  }, 500)
})
