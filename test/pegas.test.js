import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'

const helper = new Helper('../scripts/pegas.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({httpd: false})
})

test.afterEach(t => t.context.room.destroy())

test('Buscando pega fullstack', async t => {
  t.context.room.user.say('user', 'hubot pega fullstack')
  await sleep(5000)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot pega fullstack'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', 'Buscando en GetOnBrd... :dev:'])
  t.is(hubotMessage2[0], 'hubot')
  t.true(/fullstack|Full-Stack/ig.test(hubotMessage2[1]))
})

test('Buscando pega de mecanico', async t => {
  t.context.room.user.say('user', 'hubot pega mecanico')
  await sleep(5000)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot pega mecanico'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', 'Buscando en GetOnBrd... :dev:'])
  t.deepEqual(hubotMessage2, ['hubot', 'No se han encontrado resultados sobre mecanico'])
})
