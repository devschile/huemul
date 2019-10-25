'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/calendario.js')

const futureYear = new Date().getFullYear() + 101

function mockDate (year = 2018, month = 10, day = 19) {
  const defaultDate = new Date(year, month, day)
  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month, 0)
  return function (year, month, day) {
    switch (day) {
      case 0:
        return daysInMonth
      case 1:
        return firstDayOfMonth
      default:
        return defaultDate
    }
  }
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
  Date = mockDate()
})
test.afterEach(t => {
  t.context.room.destroy()
})

test.cb('Debe mostrar el calendario del mes actual si no tiene parametros', t => {
  t.context.room.user.say('user', 'hubot calendario')
  setTimeout(() => {
    const calendario =
      '\nCalendario para: Noviembre 2018\n\r```\nDo Lu Ma Mi Ju Vi Sa\n            01 02 03\n04 05 06 07 08 09 10\n11 12 13 14 15 16 17\n18 () 20 21 22 23 24\n25 26 27 28 29 30 31\n```'
    t.deepEqual(t.context.room.messages, [['user', 'hubot calendario'], ['hubot', calendario]])
    t.end()
  }, 500)
})

test.cb('Debe mostrar calendario del mes en el mismo año si no se especifica el año', t => {
  t.context.room.user.say('user', 'hubot calendario junio')
  setTimeout(() => {
    const calendario =
      '\nCalendario para: Junio 2018\n\r```\nDo Lu Ma Mi Ju Vi Sa\n            01 02 03\n04 05 06 07 08 09 10\n11 12 13 14 15 16 17\n18 19 20 21 22 23 24\n25 26 27 28 29 30 31\n```'
    t.deepEqual(t.context.room.messages, [['user', 'hubot calendario junio'], ['hubot', calendario]])
    t.end()
  }, 500)
})

test.cb('Debe mostrar calendario del mes y año cuando se especifica mes y año', t => {
  t.context.room.user.say('user', 'hubot calendario mayo 1989')
  setTimeout(() => {
    const calendario =
      '\nCalendario para: Mayo 1989\n\r```\nDo Lu Ma Mi Ju Vi Sa\n            01 02 03\n04 05 06 07 08 09 10\n11 12 13 14 15 16 17\n18 19 20 21 22 23 24\n25 26 27 28 29 30 31\n```'
    t.deepEqual(t.context.room.messages, [['user', 'hubot calendario mayo 1989'], ['hubot', calendario]])
    t.end()
  }, 500)
})

test.cb('Debe mostrar mensaje de error si el año solicitado es menor a 1582', t => {
  t.context.room.user.say('user', 'hubot calendario octubre 1492')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot calendario octubre 1492'],
      ['hubot', 'El mes o el año no son válidos']
    ])
    t.end()
  }, 500)
})

test.cb('Debe mostrar mensaje de error si el año solicitado es mayor a 100 años', t => {
  t.context.room.user.say('user', `hubot calendario noviembre ${futureYear}`)
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', `hubot calendario noviembre ${futureYear}`],
      ['hubot', 'El mes o el año no son válidos']
    ])
    t.end()
  }, 500)
})
