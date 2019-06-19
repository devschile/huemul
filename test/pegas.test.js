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
  t.deepEqual(hubotMessage2, ['hubot', 'Se ha encontrado 1 resultado para *fullstack*:\n1: </empleos/programacion/programador-fullstack-wivo-analytics| - >\n'])
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
