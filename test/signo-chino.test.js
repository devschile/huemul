'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/signo-chino.js')

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})
test.afterEach(t => {
  t.context.room.destroy()
})

test.cb('Debe entregar el signo y la imagen del talisman correcta', t => {
  t.context.room.user.say('user', 'hubot signo chino 1989')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot signo chino 1989'],
      [
        'hubot',
        'El signo :flag-cn: de 1989 es la Serpiente.\n https://vignette.wikia.nocookie.net/jackiechanadventures/images/e/ed/Snake_Talisman.png'
      ]
    ])
    t.end()
  }, 500)
})

test.cb('Mostrar mensaje de intentar de nuevo cuando el año es número negativo', t => {
  t.context.room.user.say('user', 'hubot signo chino -1000')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot signo chino -1000'],
      ['hubot', 'El año no es válido, intenta con otro.']
    ])
    t.end()
  }, 500)
})

test.cb('Mostrar mensaje de intentar de nuevo cuando el año no es un número', t => {
  t.context.room.user.say('user', 'hubot signo chino hello world')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot signo chino hello world'],
      ['hubot', 'El año no es válido, intenta con otro.']
    ])
    t.end()
  }, 500)
})

test.cb('Mostrar mensaje de ingresar un año cuando no se le pasa ninguno', t => {
  t.context.room.user.say('user', 'hubot signo chino      ')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot signo chino      '],
      ['hubot', 'Tienes que decirme de que año :retard:']
    ])
    t.end()
  }, 500)
})
