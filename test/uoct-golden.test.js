import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'
import nock from 'nock'

const helper = new Helper('../scripts/uoct-golden.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))
nock.disableNetConnect()

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => {
  t.context.room.destroy()
  nock.cleanAll()
})

test('UOCT - restringido para usuarios gold', async t => {
  t.context.room.robot.golden = {
    isGold: () => false
  }
  t.context.room.user.say('user', 'hubot uoct')
  await sleep(500)

  var msglength = t.context.room.messages.length

  t.true(msglength >= 2, 'hubot no respondió')
  var responseMsg = t.context.room.messages[1][1]
  t.true(
    responseMsg ===
      'Esta funcionalidad es exclusiva para socios golden :monea: de devsChile. Dona en www.devschile.cl para participar de este selecto grupo :huemul-patitas: .'
  )
  return true
})

test('UOCT - cuando no retorna eventos, se responde todo normal', async t => {
  t.context.room.robot.golden = {
    isGold: () => true
  }

  var payload =
    '{"eventos":[ {"id": 63195,"fecha": "2018-10-10 15:26:10", "interseccion": { "coordenadas": {"lat": "-33.3888202889464","long": "-70.5779708839475"      },      "calle_uno": "Luis Pasteur",      "calle_dos": "Lo Arcaya"    },    "tipo": "Sem\u00e1foros",    "comuna": "Vitacura",    "url": "http://www.uoct.cl/eventos/semforo-apagado-en-luis-pasteur-lo-arcaya/", "informacion": "Sem\u0026aacute;foro apagado en Luis Pasteur / Lo Arcaya"}]}'

  nock('http://www.uoct.cl')
    .get('/historial/ultimos-eventos/json/')
    .reply(200, payload, { 'content-type': 'text/html; charset=UTF-8' })

  t.context.room.user.say('user', 'hubot uoct')
  await sleep(500)

  var msglength = t.context.room.messages.length

  t.true(msglength >= 3, 'hubot no respondió')
  var responseMsg = t.context.room.messages[2][1]
  t.is(
    responseMsg,
    'Encontrado 1 resultado :bomb::fire:\n03:26: (Vitacura) Semáforo apagado en Luis Pasteur / Lo Arcaya'
  )
})

test('UOCT - cuando más de 5, solo muestra 5 ', async t => {
  t.context.room.robot.golden = {
    isGold: () => true
  }

  var payload =
    '{"eventos":[' +
    ' {"fecha": "2018-10-10 15:26:10", "comuna": "Vitacura", "url": "http://www.test.com", "informacion": "t&eacute;st1"},' +
    ' {"fecha": "2018-10-10 15:26:10", "comuna": "Vitacura", "url": "http://www.test.com", "informacion": "t&eacute;st2"},' +
    ' {"fecha": "2018-10-10 15:26:10", "comuna": "Vitacura", "url": "http://www.test.com", "informacion": "t&eacute;st3"},' +
    ' {"fecha": "2018-10-10 15:26:10", "comuna": "Vitacura", "url": "http://www.test.com", "informacion": "test4"},' +
    ' {"fecha": "2018-10-10 15:26:10", "comuna": "Vitacura", "url": "http://www.test.com", "informacion": "test5"},' +
    ' {"fecha": "2018-10-10 15:26:10", "comuna": "Vitacura", "url": "http://www.test.com", "informacion": "test6"},' +
    ' {"fecha": "2018-10-10 15:26:10", "comuna": "Vitacura", "url": "http://www.test.com", "informacion": "test7"},' +
    ' {"fecha": "2018-10-10 15:26:10", "comuna": "Vitacura", "url": "http://www.test.com", "informacion": "test8"},' +
    ' {"fecha": "2018-10-10 15:26:10", "comuna": "Vitacura", "url": "http://www.test.com", "informacion": "test9"}' +
    ']}'

  nock('http://www.uoct.cl')
    .get('/historial/ultimos-eventos/json/')
    .reply(200, payload, { 'content-type': 'text/html; charset=UTF-8' })

  t.context.room.user.say('user', 'hubot uoct')
  await sleep(500)

  var msglength = t.context.room.messages.length

  t.true(msglength >= 3, 'hubot no respondió')
  var responseMsg = t.context.room.messages[2][1]
  var expectedMessage =
    'Encontrados 9 resultados :bomb::fire:\n' +
    '03:26: (Vitacura) tést1\n' +
    '03:26: (Vitacura) tést2\n' +
    '03:26: (Vitacura) tést3\n' +
    '03:26: (Vitacura) test4\n' +
    '03:26: (Vitacura) test5\n' +
    '<http://www.uoct.cl/historial/ultimos-eventos/|Ver más resultados>'
  t.is(responseMsg, expectedMessage)
})
test('UOCT - cuando hay un evento imprime correctamente', async t => {
  t.context.room.robot.golden = {
    isGold: () => true
  }

  var payload = '{"eventos":[]}'

  nock('http://www.uoct.cl')
    .get('/historial/ultimos-eventos/json/')
    .reply(200, payload, { 'content-type': 'text/html; charset=UTF-8' })

  t.context.room.user.say('user', 'hubot uoct')
  await sleep(500)

  var msglength = t.context.room.messages.length

  t.true(msglength >= 3, 'hubot no respondió')
  var responseMsg = t.context.room.messages[2][1]
  t.true(responseMsg === 'Qué raro, parece que está todo normal :thinking_bachelet: . Intenta más tarde.')
  return true
})
test('UOCT - cuando 404 entrega mensaje de error', async t => {
  t.context.room.robot.golden = {
    isGold: () => true
  }

  nock('http://www.uoct.cl')
    .get('/historial/ultimos-eventos/json/')
    .reply(404)

  t.context.room.user.say('user', 'hubot uoct')
  await sleep(500)

  var msglength = t.context.room.messages.length

  t.true(msglength >= 3, 'hubot no respondió')
  var responseMsg = t.context.room.messages[2][1]
  t.true(responseMsg === 'Error consultando UOCT: no se pudo obtener eventos')
})
test('UOCT - cuando 500 entrega mensaje de error', async t => {
  t.context.room.robot.golden = {
    isGold: () => true
  }

  nock('http://www.uoct.cl')
    .get('/historial/ultimos-eventos/json/')
    .reply(500)

  t.context.room.user.say('user', 'hubot uoct')
  await sleep(500)

  var msglength = t.context.room.messages.length

  t.true(msglength >= 3, 'hubot no respondió')
  var responseMsg = t.context.room.messages[2][1]
  t.true(responseMsg === 'Error consultando UOCT: no se pudo obtener eventos')
})
