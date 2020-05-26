'use strict'

require('coffee-script/register')
const moment = require('moment')
const test = require('ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')

const helper = new Helper('../scripts/portadas.js')
const now = moment('20200521').subtract(4, 'hours')
const img = `http://impresa.soy-chile.cl/HoyxHoy/${now.format('DDMMYY')}/hoyxhoy/${now.format('DD_MM_YY')}_pag_03-550-afba7c.jpg`
const imgTercera = 'https://storage-gcp-production.publica.la:443/test-copesa-1/issues/2020/05/1iaErYbu5ZpNCsME/1590368653_cover.jpg'

const buildHoyxHoyResponse = (newspaper) => [
  ['user', `hubot portada ${newspaper}`],
  ['hubot', `Esta portada es del ${now.format('DD/MM/YYYY')}`],
  ['hubot', img]
]

const buildLaTerceraResponse = () => [
  ['user', 'hubot portada tercera'],
  ['hubot', `Esta portada es Today at ${moment().format('LT')}`],
  ['hubot', imgTercera]
]

test.beforeEach(t => {
  nock('http://www.hoyxhoy.cl')
    .get('/endpoints/for-soy.php')
    .query({ action: 'get-latest', size: 550 })
    .reply(200, [{ img: img }])

  nock('https://kiosco.latercera.com')
    .get('/latest-issue-cover-image')
    .query({ collection: 'lt_diario_la_tercera_6_30' })
    .reply(302, null, { location: imgTercera })

  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => t.context.room.destroy())

test.cb('Debe entregar la portada de la hoyxhoy', t => {
  t.context.room.user.say('user', 'hubot portada hoyxhoy')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, buildHoyxHoyResponse('hoyxhoy'))
    t.end()
  }, 500)
})

test.cb('Debe entregar la portada de la hoyxhoy incluso cuando se escribe en mayusculas', t => {
  t.context.room.user.say('user', 'hubot portada HoyxHoy')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, buildHoyxHoyResponse('HoyxHoy'))
    t.end()
  }, 500)
})

test.cb('Debe manejar cuando el endpoint returne redirección/302', t => {
  t.context.room.user.say('user', 'hubot portada tercera')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, buildLaTerceraResponse())
    t.end()
  }, 500)
})
