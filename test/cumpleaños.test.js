'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')

const helper = new Helper('../scripts/cumpleaños.js')

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
  nock('https://slack.com')
    .post('/api/conversations.list')
    .optionally()
    .reply(200, { ok: true, channels: [] })
})

test.afterEach(t => {
  t.context.room.destroy()
  nock.cleanAll()
})

test.cb('cumple set - registra cumpleaños válido', t => {
  t.context.room.user.say('user', 'huemul cumple set 21/05')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'huemul cumple set 21/05'],
      ['hubot', 'Listo, registré tu cumpleaños el 21/5 🎂']
    ])
    t.end()
  }, 500)
})

test.cb('cumple set - rechaza fecha inválida', t => {
  t.context.room.user.say('user', 'huemul cumple set 32/01')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'huemul cumple set 32/01'],
      ['hubot', 'La fecha 32/1 no es válida.']
    ])
    t.end()
  }, 500)
})

test.cb('cumple set - rechaza mes inválido', t => {
  t.context.room.user.say('user', 'huemul cumple set 01/13')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'huemul cumple set 01/13'],
      ['hubot', 'La fecha 1/13 no es válida.']
    ])
    t.end()
  }, 500)
})

test.cb('cumple delete - elimina cumpleaños registrado', t => {
  const brain = t.context.room.robot.brain
  brain.set('birthdays', JSON.stringify({ user: { user: 'user', day: 21, month: 5 } }))

  t.context.room.user.say('user', 'huemul cumple delete')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'huemul cumple delete'],
      ['hubot', 'Tu cumpleaños fue eliminado del calendario.']
    ])
    const birthdays = JSON.parse(brain.get('birthdays') || '{}')
    t.false('user' in birthdays)
    t.end()
  }, 500)
})

test.cb('cumple hoy - sin cumpleaños hoy', t => {
  t.context.room.robot.brain.set('birthdays', JSON.stringify({}))

  t.context.room.user.say('user', 'huemul cumple hoy')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'huemul cumple hoy'],
      ['hubot', 'Nadie cumple años hoy.']
    ])
    t.end()
  }, 500)
})

test.cb('cumple hoy - con cumpleaños hoy', t => {
  const now = new Date()
  const day = now.getDate()
  const month = now.getMonth() + 1
  t.context.room.robot.brain.set('birthdays', JSON.stringify({
    pepe: { user: 'pepe', day, month }
  }))

  t.context.room.user.say('user', 'huemul cumple hoy')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'huemul cumple hoy'],
      ['hubot', 'Hoy cumplen años: pepe']
    ])
    t.end()
  }, 500)
})

test.cb('cumple mes - sin cumpleaños este mes', t => {
  t.context.room.robot.brain.set('birthdays', JSON.stringify({}))

  t.context.room.user.say('user', 'huemul cumple mes')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'huemul cumple mes'],
      ['hubot', 'Nadie cumple años este mes.']
    ])
    t.end()
  }, 500)
})

test.cb('cumple mes - muestra cumpleaños del mes actual ordenados por día', t => {
  const month = new Date().getMonth() + 1
  t.context.room.robot.brain.set('birthdays', JSON.stringify({
    ana: { user: 'ana', day: 20, month },
    beto: { user: 'beto', day: 5, month },
    otro: { user: 'otro', day: 1, month: month === 1 ? 2 : 1 }
  }))

  t.context.room.user.say('user', 'huemul cumple mes')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'huemul cumple mes'],
      ['hubot', `Cumpleaños de este mes:\nbeto (5/${month})\nana (20/${month})`]
    ])
    t.end()
  }, 500)
})

test.cb('cumple lista - lista vacía', t => {
  t.context.room.robot.brain.set('birthdays', JSON.stringify({}))

  t.context.room.user.say('user', 'huemul cumple lista')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'huemul cumple lista'],
      ['hubot', 'No hay cumpleaños registrados.']
    ])
    t.end()
  }, 500)
})

test.cb('cumple lista - ordenada por mes y día', t => {
  t.context.room.robot.brain.set('birthdays', JSON.stringify({
    carlos: { user: 'carlos', day: 15, month: 6 },
    ana: { user: 'ana', day: 3, month: 2 },
    beto: { user: 'beto', day: 1, month: 6 }
  }))

  t.context.room.user.say('user', 'huemul cumple lista')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'huemul cumple lista'],
      ['hubot', 'Calendario de cumpleaños:\nana: 3/2\nbeto: 1/6\ncarlos: 15/6']
    ])
    t.end()
  }, 500)
})
