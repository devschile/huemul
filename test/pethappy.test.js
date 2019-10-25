import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'
import path from 'path'
import nock from 'nock'

const helper = new Helper('../scripts/pethappy.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => t.context.room.destroy())

test('Scooby Doo 200', async t => {
  nock('https://www.pethappy.cl')
    .get('/search/indoor')
    .replyWithFile(200, path.join(__dirname, 'html', 'pethappy-200.html'))
  t.context.room.user.say('user', 'hubot pethappy indoor')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot pethappy indoor'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', ':perro: buscando...'])
  t.deepEqual(hubotMessage2, [
    'hubot',
    ' - indoor 1: _Desde $18.490_\n' +
    '  https://www.pethappy.cl/indoor-1\n' +
    ' - indoor 2: _Desde $18.490_\n' +
    '  https://www.pethappy.cl/indoor-2'
  ])
})

test('Scooby Doo 500', async t => {
  nock('https://www.pethappy.cl')
    .get('/search/indoor')
    .reply(500)
  t.context.room.user.say('user', 'hubot pethappy indoor')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot pethappy indoor'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', ':perro: buscando...'])
  t.deepEqual(hubotMessage2, [
    'hubot',
    '@user :happyto: mato el server, preguntar por INBOX a :pinceleart:'
  ])
})

test('Scooby Doo 301', async t => {
  nock('https://www.pethappy.cl')
    .get('/search/indoor')
    .reply(301)
  t.context.room.user.say('user', 'hubot pethappy indoor')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot pethappy indoor'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', ':perro: buscando...'])
  t.deepEqual(hubotMessage2, [
    'hubot',
    '@user :happyto: mato el server, preguntar por INBOX a :pinceleart:'
  ])
})
