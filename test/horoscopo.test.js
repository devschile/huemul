'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/horoscopo.js')
const { _test } = require('../scripts/horoscopo.js')
const sleep = m => new Promise(resolve => setTimeout(resolve, m))

const respuestaValida = {
  titulo: 'jueves, 13 de agosto de 2026',
  fecha: '2026-08-13',
  zona_horaria: 'America/Santiago',
  vigente: true,
  horoscopo: {
    geminis: {
      nombre: 'Géminis',
      amor: 'Un vínculo pendiente pide una conversación honesta.',
      salud: 'El cuerpo pide un ritmo más lento hoy.',
      dinero: 'Una decisión de gasto conviene postergarla un día.',
      color: 'turquesa',
      numero: 7,
      elemento: 'aire',
      rango: '21 de mayo al 20 de junio',
      animo: 4
    }
  }
}

// Stub encadenable: .header().timeout().get()(cb) — misma forma que usa el
// script contra scoped-http-client.
const httpStub = (statusCode, body) => () => {
  const client = {
    header: () => client,
    timeout: () => client,
    get: () => cb => cb(null, { statusCode }, JSON.stringify(body))
  }
  return client
}

const httpErrorStub = err => () => {
  const client = {
    header: () => client,
    timeout: () => client,
    get: () => cb => cb(err, null, null)
  }
  return client
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
  t.context.realApiKey = process.env.HOROSCOPO_API_KEY
  process.env.HOROSCOPO_API_KEY = 'test-key'

  // El adaptador falso de hubot-test-helper se llama "Room", que es
  // exactamente uno de los nombres que el script usa para decidir si debe
  // mandar por la API de attachments de Slack (`robot.adapter.client.web.
  // chat.postMessage`). Sin este stub, cualquier `send()` revienta porque
  // el Room de prueba no tiene `.client`. Se empuja al mismo array
  // `messages` que usa `res.send()`, para no tener que duplicar las
  // aserciones.
  t.context.room.robot.adapter.client = {
    web: {
      chat: {
        postMessage: (room, text, options) => {
          t.context.room.messages.push(['hubot', options.attachments[0].fallback])
        }
      }
    }
  }
})

test.afterEach(t => {
  process.env.HOROSCOPO_API_KEY = t.context.realApiKey
  t.context.room.destroy()
})

test('sin signo, responde con el mensaje de ayuda', async t => {
  t.context.room.user.say('user', 'hubot horoscopo')
  await sleep(300)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot horoscopo'],
    ['hubot', _test.buildHelpMessage()]
  ])
})

test('con signo válido, responde con el horóscopo', async t => {
  t.context.room.robot.http = httpStub(200, respuestaValida)

  t.context.room.user.say('user', 'hubot horoscopo geminis')
  await sleep(300)

  const expected = _test.buildHoroscopeText(respuestaValida)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot horoscopo geminis'],
    ['hubot', expected]
  ])
})

test('acepta el signo escrito con tilde y con "horóscopo" con tilde', async t => {
  t.context.room.robot.http = httpStub(200, respuestaValida)

  t.context.room.user.say('user', 'hubot horóscopo géminis')
  await sleep(300)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot horóscopo géminis'],
    ['hubot', _test.buildHoroscopeText(respuestaValida)]
  ])
})

test('avisa cuando el horóscopo de hoy no está listo y muestra el de ayer', async t => {
  const respuestaVieja = { ...respuestaValida, vigente: false }
  t.context.room.robot.http = httpStub(200, respuestaVieja)

  t.context.room.user.say('user', 'hubot horoscopo geminis')
  await sleep(300)

  const mensaje = t.context.room.messages[1][1]
  t.true(mensaje.includes('todavía no está listo el de hoy'))
})

test('signo desconocido (400), responde con la lista de signos válidos', async t => {
  t.context.room.robot.http = httpStub(400, {
    error: 'Signo desconocido',
    signos_validos: ['aries', 'tauro']
  })

  t.context.room.user.say('user', 'hubot horoscopo ofiuco')
  await sleep(300)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot horoscopo ofiuco'],
    ['hubot', _test.buildUnknownSignMessage(['aries', 'tauro'])]
  ])
})

test('error de red, responde con el mensaje de error genérico', async t => {
  t.context.room.robot.http = httpErrorStub(new Error('boom'))

  t.context.room.user.say('user', 'hubot horoscopo geminis')
  await sleep(300)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot horoscopo geminis'],
    ['hubot', _test.buildErrorMessage()]
  ])
})

test('respuesta 500, responde con el mensaje de error genérico', async t => {
  t.context.room.robot.http = httpStub(500, { error: 'falla interna' })

  t.context.room.user.say('user', 'hubot horoscopo geminis')
  await sleep(300)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot horoscopo geminis'],
    ['hubot', _test.buildErrorMessage()]
  ])
})

test('body no-JSON, responde con el mensaje de error genérico en vez de reventar', async t => {
  t.context.room.robot.http = () => {
    const client = {
      header: () => client,
      timeout: () => client,
      get: () => cb => cb(null, { statusCode: 200 }, 'esto no es json')
    }
    return client
  }

  t.context.room.user.say('user', 'hubot horoscopo geminis')
  await sleep(300)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot horoscopo geminis'],
    ['hubot', _test.buildErrorMessage()]
  ])
})

// Serial: muta process.env.HOROSCOPO_API_KEY, que es estado global
// compartido con el resto de los tests de este archivo (AVA los corre en
// paralelo por defecto). En paralelo, el beforeEach de otro test puede
// volver a poner la key justo cuando este test la borra.
test.serial('sin HOROSCOPO_API_KEY configurada, responde con error sin llamar a la API', async t => {
  delete process.env.HOROSCOPO_API_KEY
  let seLlamoLaApi = false
  t.context.room.robot.http = () => {
    seLlamoLaApi = true
    return httpStub(200, respuestaValida)()
  }

  t.context.room.user.say('user', 'hubot horoscopo geminis')
  await sleep(300)

  t.false(seLlamoLaApi)
  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot horoscopo geminis'],
    ['hubot', _test.buildErrorMessage()]
  ])
})

test('getSinglePrediction devuelve null si la respuesta no trae horoscopo', t => {
  t.is(_test.getSinglePrediction({}), null)
  t.is(_test.getSinglePrediction({ horoscopo: {} }), null)
})

test('getSinglePrediction devuelve el signo y la predicción de la única entrada', t => {
  const entry = _test.getSinglePrediction(respuestaValida)
  t.is(entry.signo, 'geminis')
  t.is(entry.prediccion.nombre, 'Géminis')
})
