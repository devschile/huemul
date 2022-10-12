import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'
import nock from 'nock'

const helper = new Helper('../scripts/orionx.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => t.context.room.destroy())

test('orionx valid', async t => {
  process.env.ORIONX_ENDPOINT = 'http://api.orionx.io/graphql'
  process.env.ORIONX_APIKEY = '5WGDN4rD3Eqpz9tnMQuqyRCfqZUP4ccJsb'
  process.env.ORIONX_SECRET_KEY = 'B7EWrck6QaJ8mPa5jYCqKNaagKiHDtq9LT'
  nock('http://api.orionx.io', {
    reqheaders: {
      'Content-Type': 'application/json',
      'X-ORIONX-TIMESTAMP': timestamp => /^\d{10}\.\d+$/.test(timestamp),
      'X-ORIONX-APIKEY': '5WGDN4rD3Eqpz9tnMQuqyRCfqZUP4ccJsb',
      'X-ORIONX-SIGNATURE': signature => /^\w{128}$/.test(signature)
    }
  })
    .post('/graphql', {
      query: '{\n      market(code: "CHACLP") {\n        lastTrade {\n          price\n        }\n      }\n    }'
    })
    .reply(200, {
      data: {
        market: {
          lastTrade: {
            price: '9000000'
          }
        }
      }
    })
  t.context.room.user.say('user', 'hubot orionx cha')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot orionx cha'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', 'Consultando último valor con orionx... :clock5:'])
  t.deepEqual(hubotMessage2, ['hubot', '1 cha está a CLP $9.000.000 en orionx'])
})

test('orionx not price', async t => {
  process.env.ORIONX_ENDPOINT = 'http://api.orionx.io/graphql'
  process.env.ORIONX_APIKEY = '5WGDN4rD3Eqpz9tnMQuqyRCfqZUP4ccJsb'
  process.env.ORIONX_SECRET_KEY = 'B7EWrck6QaJ8mPa5jYCqKNaagKiHDtq9LT'
  nock('http://api.orionx.io', {
    reqheaders: {
      'Content-Type': 'application/json',
      'X-ORIONX-TIMESTAMP': timestamp => /^\d{10}\.\d+$/.test(timestamp),
      'X-ORIONX-APIKEY': '5WGDN4rD3Eqpz9tnMQuqyRCfqZUP4ccJsb',
      'X-ORIONX-SIGNATURE': signature => /^\w{128}$/.test(signature)
    }
  })
    .post('/graphql', {
      query: '{\n      market(code: "CHACLP") {\n        lastTrade {\n          price\n        }\n      }\n    }'
    })
    .reply(200, { data: null })
  t.context.room.user.say('user', 'hubot orionx cha')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot orionx cha'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', 'Consultando último valor con orionx... :clock5:'])
  t.deepEqual(hubotMessage2, ['hubot', 'Precio no encontrado'])
})

test('orionx json error', async t => {
  process.env.ORIONX_ENDPOINT = 'http://api.orionx.io/graphql'
  process.env.ORIONX_APIKEY = '5WGDN4rD3Eqpz9tnMQuqyRCfqZUP4ccJsb'
  process.env.ORIONX_SECRET_KEY = 'B7EWrck6QaJ8mPa5jYCqKNaagKiHDtq9LT'
  nock('http://api.orionx.io', {
    reqheaders: {
      'Content-Type': 'application/json',
      'X-ORIONX-TIMESTAMP': timestamp => /^\d{10}\.\d+$/.test(timestamp),
      'X-ORIONX-APIKEY': '5WGDN4rD3Eqpz9tnMQuqyRCfqZUP4ccJsb',
      'X-ORIONX-SIGNATURE': signature => /^\w{128}$/.test(signature)
    }
  })
    .post('/graphql', {
      query: '{\n      market(code: "CHACLP") {\n        lastTrade {\n          price\n        }\n      }\n    }'
    })
    .reply(200)
  t.context.room.user.say('user', 'hubot orionx cha')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot orionx cha'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', 'Consultando último valor con orionx... :clock5:'])
  t.deepEqual(hubotMessage2, ['hubot', 'Error al realizar la búsqueda.'])
})

test('orionx server error', async t => {
  process.env.ORIONX_ENDPOINT = 'http://api.orionx.io/graphql'
  process.env.ORIONX_APIKEY = '5WGDN4rD3Eqpz9tnMQuqyRCfqZUP4ccJsb'
  process.env.ORIONX_SECRET_KEY = 'B7EWrck6QaJ8mPa5jYCqKNaagKiHDtq9LT'
  nock('http://api.orionx.io', {
    reqheaders: {
      'Content-Type': 'application/json',
      'X-ORIONX-TIMESTAMP': timestamp => /^\d{10}\.\d+$/.test(timestamp),
      'X-ORIONX-APIKEY': '5WGDN4rD3Eqpz9tnMQuqyRCfqZUP4ccJsb',
      'X-ORIONX-SIGNATURE': signature => /^\w{128}$/.test(signature)
    }
  })
    .post('/graphql', {
      query: '{\n      market(code: "CHACLP") {\n        lastTrade {\n          price\n        }\n      }\n    }'
    })
    .reply(504)
  t.context.room.user.say('user', 'hubot orionx cha')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot orionx cha'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', 'Consultando último valor con orionx... :clock5:'])
  t.deepEqual(hubotMessage2, ['hubot', 'Error al realizar la búsqueda.'])
})

test('orionx invalid coin', async t => {
  process.env.ORIONX_ENDPOINT = 'http://api.orionx.io/graphql'
  process.env.ORIONX_APIKEY = '5WGDN4rD3Eqpz9tnMQuqyRCfqZUP4ccJsb'
  process.env.ORIONX_SECRET_KEY = 'B7EWrck6QaJ8mPa5jYCqKNaagKiHDtq9LT'
  t.context.room.user.say('user', 'hubot orionx huemul')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]

  // test message of user
  t.deepEqual(user, ['user', 'hubot orionx huemul'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', 'Moneda inválida o no disponible'])
})
