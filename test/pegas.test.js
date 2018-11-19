import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'
import path from 'path'
import nock from 'nock'

const helper = new Helper('../scripts/pegas.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({httpd: false})
})

test.afterEach(t => t.context.room.destroy())

test('Buscando pega fullstack', async t => {
  nock('https://www.getonbrd.cl')
    .get('/empleos-fullstack')
    .replyWithFile(200, path.join(__dirname, 'html', 'pegas-200.html'))
  t.context.room.user.say('user', 'hubot pega fullstack')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot pega fullstack'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', 'Buscando en GetOnBrd... :dev:'])
  t.deepEqual(hubotMessage2, ['hubot', 'Se ha encontrado 1 resultado para *fullstack*:\n1: <https://www.getonbrd.cl/empleos/programacion/programador-fullstack-wivo-analytics|Programador Full-Stack>\n'])
})

test('Buscando pega de mecanico', async t => {
  nock('https://www.getonbrd.cl')
    .get('/empleos-mecanico')
    .reply(200, '')
  t.context.room.user.say('user', 'hubot pega mecanico')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot pega mecanico'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', 'Buscando en GetOnBrd... :dev:'])
  t.deepEqual(hubotMessage2, ['hubot', 'No se han encontrado resultados sobre mecanico'])
})

test('Error en el servidor', async t => {
  nock('https://www.getonbrd.cl')
    .get('/empleos-500')
    .replyWithError('Server error')
  t.context.room.user.say('user', 'hubot pega 500')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot pega 500'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', 'Buscando en GetOnBrd... :dev:'])
  t.deepEqual(hubotMessage2, ['hubot', '@user :gob: tiene problemas en el servidor'])
})

test('Redirect', async t => {
  nock('https://www.getonbrd.cl')
    .get('/empleos-301')
    .reply(301)
  t.context.room.user.say('user', 'hubot pega 301')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot pega 301'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', 'Buscando en GetOnBrd... :dev:'])
  t.deepEqual(hubotMessage2, ['hubot', '@user :gob: tiene problemas en el servidor'])
})
