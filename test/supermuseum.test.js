'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')

const script = require('../scripts/supermuseum.js')
const helper = new Helper('../scripts/supermuseum.js')

const BASE = 'https://supermuseum.netlify.app'

const snesGames = [
  { title: 'The Legend of Zelda: A Link to the Past', platform: 'snes', developer: 'Nintendo', year: 1992, serial: 'SNS-ZL-USA' },
  { title: 'Super Mario World', platform: 'snes', developer: 'Nintendo', year: 1990, serial: 'SNS-MW-USA' }
]
const arcadeGames = [
  { title: 'The Legend of Zelda', platform: 'arcade', developer: 'Nintendo', year: 1987, serial: 'zelda_arc' }
]

function stubLibraries () {
  script.PLATFORMS.forEach(platform => {
    let body = []
    if (platform === 'snes') body = snesGames
    if (platform === 'arcade') body = arcadeGames
    nock(BASE).persist().get(`/json/${platform}.json`).reply(200, body)
  })
}

test.beforeEach(t => {
  script._resetCache()
  nock.cleanAll()
  stubLibraries()
  t.context.room = helper.createRoom({ httpd: false })
})
test.afterEach(t => {
  t.context.room.destroy()
})

test.cb.serial('Comando vacío retorna un juego al azar', t => {
  t.context.room.user.say('user', 'hubot supermuseum')
  setTimeout(() => {
    t.is(t.context.room.messages.length, 2)
    t.is(t.context.room.messages[1][0], 'hubot')
    t.true(/Super Nintendo|Arcade/.test(t.context.room.messages[1][1]))
    t.true(/supermuseum\.netlify\.app\/\?play=/.test(t.context.room.messages[1][1]))
    t.end()
  }, 800)
})

test.cb.serial('Plataforma retorna un juego de esa plataforma', t => {
  t.context.room.user.say('user', 'hubot supermuseum snes')
  setTimeout(() => {
    const reply = t.context.room.messages[1][1]
    t.true(/Super Nintendo/.test(reply))
    t.false(/\.\.\.y \d+ más/.test(reply))
    t.end()
  }, 800)
})

test.cb.serial('La plataforma no distingue mayúsculas', t => {
  t.context.room.user.say('user', 'hubot supermuseum SNES')
  setTimeout(() => {
    t.true(/Super Nintendo/.test(t.context.room.messages[1][1]))
    t.end()
  }, 800)
})

test.cb.serial('Texto lista todos los juegos coincidentes', t => {
  t.context.room.user.say('user', 'hubot supermuseum zelda')
  setTimeout(() => {
    const reply = t.context.room.messages[1][1]
    t.true(/A Link to the Past/.test(reply))
    t.true(/arcade/.test(reply))
    t.end()
  }, 800)
})

test.cb.serial('Texto desconocido retorna mensaje de no encontrado', t => {
  t.context.room.user.say('user', 'hubot supermuseum xyzzy')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot supermuseum xyzzy'],
      ['hubot', '@user no encontré juegos para "xyzzy" en el SuperMuseum']
    ])
    t.end()
  }, 800)
})

test.cb.serial('Lista larga se corta en 10 con coletilla', t => {
  nock.cleanAll()
  const many = []
  for (let i = 1; i <= 12; i++) {
    many.push({ title: `Zelda Test ${i}`, platform: 'snes', developer: 'Nintendo', year: 1992, serial: `SNS-ZT-${i}` })
  }
  script.PLATFORMS.forEach(platform => {
    nock(BASE).persist().get(`/json/${platform}.json`).reply(200, platform === 'snes' ? many : [])
  })
  t.context.room.user.say('user', 'hubot supermuseum zelda test')
  setTimeout(() => {
    const reply = t.context.room.messages[1][1]
    t.true(/Zelda Test 1/.test(reply))
    t.true(/Zelda Test 10/.test(reply))
    t.false(/Zelda Test 11/.test(reply))
    t.true(/…y 2 más/.test(reply))
    t.end()
  }, 800)
})

test.cb.serial('Error del servidor retorna mensaje de error', t => {
  nock.cleanAll()
  script.PLATFORMS.forEach(platform => {
    nock(BASE).get(`/json/${platform}.json`).reply(500)
  })
  t.context.room.user.say('user', 'hubot supermuseum')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[1], [
      'hubot',
      '@user ocurrió un error buscando en el SuperMuseum, intenta de nuevo más tarde'
    ])
    t.end()
  }, 800)
})
