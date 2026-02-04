'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')
const moment = require('moment')

const helper = new Helper('../scripts/proximo-feriado.js')
const { _test } = require('../scripts/proximo-feriado.js')
const sleep = m => new Promise(resolve => setTimeout(resolve, m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
  t.context.realNow = moment.now
  moment.now = () => new Date(2026, 1, 1, 12, 0, 0, 0).valueOf()
})

test.afterEach(t => {
  moment.now = t.context.realNow
  t.context.room.destroy()
})

test('buildNextHolidayMessage agrega sarcasmo de fin de semana', t => {
  const feriadosData = {
    year: 2026,
    feriados: {
      '02': [
        { mes: 2, dia: 7, descripcion: 'Día de prueba' }
      ]
    }
  }
  const today = moment('2026-02-01')
  const message = _test.buildNextHolidayMessage(feriadosData, today)

  t.true(message.includes('Sábado 7 de Febrero'))
  t.true(message.includes('Día de prueba'))
  t.true(message.includes('¡Qué suerte! El próximo feriado es sábado.'))
})

test('buildNextHolidayMessage agrega mensaje nerd determinístico', t => {
  const feriadosData = {
    year: 2026,
    feriados: {
      '03': [
        { mes: 3, dia: 10, descripcion: 'Día de pruebas largas' }
      ]
    }
  }
  const today = moment('2026-02-01')
  const message = _test.buildNextHolidayMessage(feriadosData, today, () => 0)

  t.true(message.includes(_test.nerdMessages[0]))
  t.true(message.includes('Día de pruebas largas'))
})

test('responde con el próximo feriado desde la API', async t => {
  const feriadosData = {
    year: 2026,
    feriados: {
      '02': [
        { mes: 2, dia: 7, descripcion: 'Día de prueba' }
      ]
    }
  }

  t.context.room.robot.http = () => ({
    get: () => (cb) => cb(null, { statusCode: 200 }, JSON.stringify(feriadosData))
  })

  t.context.room.user.say('user', 'hubot proximo feriado')
  await sleep(300)

  const expected = _test.buildNextHolidayMessage(feriadosData, moment())

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot proximo feriado'],
    ['hubot', expected]
  ])
})
