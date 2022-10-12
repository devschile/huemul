import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'
import path from 'path'
import nock from 'nock'

const helper = new Helper('../scripts/tiempo.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => t.context.room.destroy())

test('Tiempo Santiago, Chile', async t => {
  nock('http://wttr.in')
    .get('/Santiago,%20Chile')
    .query({ m: '' })
    .replyWithFile(200, path.join(__dirname, 'html', 'tiempo-200-1.html'))
  t.context.room.user.say('user', 'hubot tiempo')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  t.deepEqual(user, ['user', 'hubot tiempo'])
  t.is(hubot[0], 'hubot')
  t.true(/Weather report: Santiago, Chile/ig.test(hubot[1]))
})

test('Tiempo Paris, France', async t => {
  nock('http://wttr.in')
    .get('/paris')
    .query({ m: '' })
    .replyWithFile(200, path.join(__dirname, 'html', 'tiempo-200-2.html'))
  t.context.room.user.say('user', 'hubot tiempo paris')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  t.deepEqual(user, ['user', 'hubot tiempo paris'])
  t.is(hubot[0], 'hubot')
  t.true(/Weather report: Paris, France/ig.test(hubot[1]))
})

test('Tiempo Error 500', async t => {
  nock('http://wttr.in')
    .get('/Santiago')
    .query({ m: '' })
    .reply(500)
  t.context.room.user.say('user', 'hubot tiempo')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  t.deepEqual(user, ['user', 'hubot tiempo'])
  t.deepEqual(hubot, [
    'hubot',
    '@user ocurrió un error con la búsqueda'
  ])
})

test('Tiempo 301', async t => {
  nock('http://wttr.in')
    .get('/Santiago')
    .query({ m: '' })
    .reply(301)
  t.context.room.user.say('user', 'hubot tiempo')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  t.deepEqual(user, ['user', 'hubot tiempo'])
  t.deepEqual(hubot, [
    'hubot',
    '@user ocurrió un error con la búsqueda'
  ])
})

test('Tiempo request error', async t => {
  nock('http://wttr.in')
    .get('/Santiago')
    .query({ m: '' })
    .replyWithFile(200, path.join(__dirname, 'html', 'tiempo-500.html'))
  t.context.room.user.say('user', 'hubot tiempo')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  t.deepEqual(user, ['user', 'hubot tiempo'])
  t.deepEqual(hubot, [
    'hubot',
    '@user ocurrió un error con la búsqueda'
  ])
})
