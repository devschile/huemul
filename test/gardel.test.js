'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')
const sinon = require('sinon')

const helper = new Helper('../scripts/gardel.js')
const clock = sinon.useFakeTimers({ now: new Date(2023, 0, 17).getTime(), shouldAdvanceTime: true })

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})
test.afterEach(t => {
  t.context.room.destroy()
  clock.restore()
})

test.cb('Debe mostrar el ultimo dia del mes si no tiene parametros', t => {
  t.context.room.user.say('user', 'hubot gardel')
  setTimeout(() => {
    const gardel = 'Faltan 14 días para que paguen. Este mes pagan el 31, que cae martes :tired_face:'
    t.deepEqual(t.context.room.messages, [['user', 'hubot gardel'], ['hubot', gardel]])
    t.end()
  }, 500)
})

test.cb('Debe mostrar los dias faltantes cuando se eliga un dia en particular', t => {
  t.context.room.user.say('user', 'hubot gardel 18')
  setTimeout(() => {
    const gardel = 'Falta un día para que paguen. Este mes pagan el 18, que cae miércoles :tired_face:'
    t.deepEqual(t.context.room.messages, [['user', 'hubot gardel 18'], ['hubot', gardel]])
    t.end()
  }, 500)
})
