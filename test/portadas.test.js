'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')

const helper = new Helper('../scripts/portadas.js')
const now = new Date()
now.setHours(now.getHours() - 4) // UTC to -04:00
const date = now.toISOString().replace(/(\d{2})(\d{2})-(\d+)-(\d+)T\d+:\d+:\d+.\d+Z/, '$4_$3_$2')
const img = `http://impresa.soy-chile.cl/HoyxHoy/210617/hoyxhoy/${date}_pag_03-550-afba7c.jpg`

test.beforeEach(t => {
  nock('http://www.hoyxhoy.cl')
    .get('/endpoints/for-soy.php')
    .query({ action: 'get-latest', size: 550 })
    .reply(200, [{ img: img }])
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => t.context.room.destroy())

test.cb('Debe entregar la portada de la hoyxhoy', t => {
  t.context.room.user.say('user', 'hubot portada hoyxhoy')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot portada hoyxhoy'],
      ['hubot', 'Esta portada es del 21/06/2017'],
      ['hubot', img]
    ])
    t.end()
  }, 500)
})

test.cb('Debe entregar la portada de la hoyxhoy incluso cuando se escribe en mayusculas', t => {
  t.context.room.user.say('user', 'hubot portada HoyxHoy')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot portada HoyxHoy'],
      ['hubot', 'Esta portada es del 21/06/2017'],
      ['hubot', img]
    ])
    t.end()
  }, 500)
})
