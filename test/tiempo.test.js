require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const path = require('path')
const nock = require('nock')

const helper = new Helper('../scripts/tiempo.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => t.context.room.destroy())

test('Tiempo Santiago, Chile', async t => {
  nock('https://wttr.in')
    .get('/Santiago%2C%20Chile')
    .query({ m: '', T: '' })
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
  nock('https://wttr.in')
    .get('/paris')
    .query({ m: '', T: '' })
    .replyWithFile(200, path.join(__dirname, 'html', 'tiempo-200-2.html'))
  t.context.room.user.say('user', 'hubot tiempo paris')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  t.deepEqual(user, ['user', 'hubot tiempo paris'])
  t.is(hubot[0], 'hubot')
  t.true(/Weather report: Paris, France/ig.test(hubot[1]))
})

test('Tiempo corta antes del forecast', async t => {
  nock('https://wttr.in')
    .get('/Santiago%2C%20Chile')
    .query({ m: '', T: '' })
    .replyWithFile(200, path.join(__dirname, 'html', 'tiempo-200-forecast.html'))
  t.context.room.user.say('user', 'hubot tiempo')
  await sleep(500)

  const hubot = t.context.room.messages[1]

  t.is(hubot[0], 'hubot')
  t.true(/Weather report: Santiago, Chile/ig.test(hubot[1]))
  t.false(hubot[1].includes('┌─────────────┐'))
})

test('Tiempo Error 500', async t => {
  nock('https://wttr.in')
    .get('/Santiago%2C%20Chile')
    .query({ m: '', T: '' })
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
  nock('https://wttr.in')
    .get('/Santiago%2C%20Chile')
    .query({ m: '', T: '' })
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
  nock('https://wttr.in')
    .get('/Santiago%2C%20Chile')
    .query({ m: '', T: '' })
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

test('Tiempo respuesta vacía', async t => {
  nock('https://wttr.in')
    .get('/Santiago%2C%20Chile')
    .query({ m: '', T: '' })
    .reply(200, '')
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
