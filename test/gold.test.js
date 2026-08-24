'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')
const fetch = require('node-fetch')

const helper = new Helper('../scripts/gold.js')

process.env.PORT = '0'
process.env.GOLD_API_URL = 'http://gold.test'
process.env.GOLD_API_TOKEN = 'token-test'
process.env.GOLD_SYNC_SECRET = 'sync-secret'
process.env.GOLD_CHANNEL = 'gold'

const DAY = 24 * 60 * 60 * 1000

const iso = msFromNow => new Date(Date.now() + msFromNow).toISOString()

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const waitUntil = (fn, timeout = 2000) => new Promise((resolve, reject) => {
  const started = Date.now()
  const tick = () => {
    let ready
    try {
      ready = fn()
    } catch (err) {
      return reject(err)
    }
    if (ready) return resolve()
    if (Date.now() - started > timeout) return reject(new Error('timeout esperando condición'))
    setTimeout(tick, 20)
  }
  tick()
})

const projectionOf = members => ({
  version: 1,
  generatedAt: new Date().toISOString(),
  members
})

const mockProjection = members =>
  nock('http://gold.test')
    .matchHeader('authorization', 'Bearer token-test')
    .get('/api/huemul/projection')
    .reply(200, projectionOf(members))

const mockSlack = () =>
  nock('https://slack.com')
    .post('/api/conversations.list')
    .times(6)
    .reply(200, { ok: true, channels: [{ id: 'CGOLD', name: 'gold' }, { id: 'C123', name: 'random' }] })

const hubotMessages = room => room.messages.filter(message => message[0] === 'hubot').map(message => message[1])

test.beforeEach(t => {
  process.env.PORT = '0'
  process.env.GOLD_API_URL = 'http://gold.test'
  process.env.GOLD_API_TOKEN = 'token-test'
  process.env.GOLD_SYNC_SECRET = 'sync-secret'
  process.env.GOLD_CHANNEL = 'gold'
  nock.cleanAll()
  nock.enableNetConnect(/^(localhost|127\.0\.0\.1)(:\d+)?$/)
  t.context.rooms = []
})

test.afterEach(t => {
  t.context.rooms.forEach(room => room.destroy())
  nock.cleanAll()
  nock.enableNetConnect()
})

const createRoom = (t, options) => {
  const room = helper.createRoom(Object.assign({ httpd: false }, options))
  t.context.rooms.push(room)
  return room
}

const absorbAutoRefresh = () => {
  nock('http://gold.test')
    .matchHeader('authorization', 'Bearer token-test')
    .get('/api/huemul/projection')
    .times(3)
    .reply(200, projectionOf([]))
}

const blockAutoRefresh = () => {
  nock('http://gold.test')
    .matchHeader('authorization', 'Bearer token-test')
    .get('/api/huemul/projection')
    .times(3)
    .reply(500)
}

test.serial('carga con el maestro inaccesible y isGold responde false sin lanzar error', async t => {
  process.env.GOLD_API_URL = 'http://127.0.0.1:9'
  const room = createRoom(t)
  t.is(typeof room.robot.golden.isGold, 'function')
  await delay(100)
  t.false(room.robot.golden.isGold('someone'))
})

test.serial('hidrata la proyección persistida en el brain', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.brain.set('gold_projection', projectionOf([
    { handle: 'alice', paidThrough: iso(10 * DAY) },
    { handle: 'bob', paidThrough: iso(-10 * DAY) }
  ]))
  t.true(room.robot.golden.isGold('alice'))
  t.false(room.robot.golden.isGold('bob'))
  t.false(room.robot.golden.isGold('carol'))

  const roomB = createRoom(t)
  roomB.robot.brain.set('gold_projection', JSON.stringify(projectionOf([
    { handle: 'alice', paidThrough: iso(10 * DAY) }
  ])))
  t.true(roomB.robot.golden.isGold('alice'))
})

test.serial('refresh exitoso reemplaza la proyección y el fallo conserva la última buena', async t => {
  mockProjection([{ handle: 'carol', paidThrough: iso(30 * DAY) }])
  const room = createRoom(t)
  await waitUntil(() => room.robot.golden.isGold('carol'))
  const stored = room.robot.brain.get('gold_projection')
  t.is(stored.members[0].handle, 'carol')

  nock('http://gold.test')
    .matchHeader('authorization', 'Bearer token-test')
    .get('/api/huemul/projection')
    .reply(500)
  room.robot.brain.emit('loaded')
  await delay(150)
  t.true(room.robot.golden.isGold('carol'))
})

test.serial('POST /gold/sync exige el secreto y dispara refresh con el correcto', async t => {
  absorbAutoRefresh()
  const room = createRoom(t, { httpd: true })
  await waitUntil(() => room.robot.server && room.robot.server.listening)
  const port = room.robot.server.address().port
  const base = `http://127.0.0.1:${port}`

  const scope = mockProjection([{ handle: 'dave', paidThrough: iso(5 * DAY) }])

  let response = await fetch(`${base}/gold/sync`, { method: 'POST' })
  t.is(response.status, 401)

  response = await fetch(`${base}/gold/sync`, {
    method: 'POST',
    headers: { authorization: 'Bearer wrong-secret' }
  })
  t.is(response.status, 401)
  await delay(150)
  t.false(scope.isDone())

  response = await fetch(`${base}/gold/sync`, {
    method: 'POST',
    headers: { authorization: 'Bearer sync-secret' }
  })
  t.is(response.status, 204)
  await waitUntil(() => scope.isDone())
  await waitUntil(() => room.robot.golden.isGold('dave'))
})

test.serial('gold insert canjea una clave válida y anuncia', async t => {
  absorbAutoRefresh()
  const room = createRoom(t)
  const validScope = nock('http://gold.test')
    .matchHeader('authorization', 'Bearer token-test')
    .post('/api/keys/redeem', body =>
      body.key === 'k1' &&
      body.slack &&
      body.slack.handle === 'user' &&
      Boolean(body.slack.id))
    .reply(200, { paidThrough: iso(30 * DAY) })
  const reusedScope = nock('http://gold.test')
    .post('/api/keys/redeem', body => body.key === 'k2')
    .reply(409, { error: 'already_redeemed' })
  const invalidScope = nock('http://gold.test')
    .post('/api/keys/redeem', body => body.key === 'k3')
    .reply(400, { error: 'invalid_key' })

  room.user.say('user', 'hubot gold insert k1')
  await waitUntil(() => hubotMessages(room).some(text => text.includes(':clap2: eres miembro gold :monea:')))
  t.true(hubotMessages(room).some(text => text.includes('hasta el')))
  t.true(validScope.isDone())

  room.user.say('user', 'hubot gold insert k2')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('Lo siento, la key ya fue utilizada.')))
  t.true(reusedScope.isDone())

  room.user.say('user', 'hubot gold insert k3')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('No es una clave válida')))
  t.true(invalidScope.isDone())
})

test.serial('gold add acepta username plano y mención <@U123>', async t => {
  absorbAutoRefresh()
  mockSlack()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }
  const bareScope = nock('http://gold.test')
    .matchHeader('authorization', 'Bearer token-test')
    .post('/api/grants', body =>
      body.slack &&
      body.slack.handle === 'bob' &&
      !body.slack.id &&
      body.days === 15 &&
      body.grantedBy === 'user' &&
      body.note === 'bot gold add')
    .reply(200, { paidThrough: iso(15 * DAY) })

  room.user.say('user', 'hubot gold add bob 15')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('*bob* se suscribió a :huemul:')))
  t.true(bareScope.isDone())

  nock('https://slack.com')
    .post('/api/users.info')
    .reply(200, { ok: true, user: { id: 'U123', name: 'carol' } })
  const mentionScope = nock('http://gold.test')
    .post('/api/grants', body =>
      body.slack &&
      body.slack.id === 'U123' &&
      body.slack.handle === 'carol' &&
      body.days === 7)
    .reply(200, { paidThrough: iso(7 * DAY) })

  const before = hubotMessages(room).length
  room.user.say('user', 'hubot gold add <@U123> 7')
  await waitUntil(() => hubotMessages(room).length > before && hubotMessages(room).some(text => text.includes('*carol* se suscribió a :huemul:')))
  t.true(mentionScope.isDone())
})

test.serial('gold add ignora a quien no tiene permisos', async t => {
  absorbAutoRefresh()
  mockSlack()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => false, hasRole: () => false }

  const before = hubotMessages(room).length
  room.user.say('user', 'hubot gold add bob 15')
  await delay(150)
  t.is(hubotMessages(room).length, before)
})

test.serial('gold remove acepta username plano y mención <@U123>', async t => {
  absorbAutoRefresh()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }

  const bareScope = nock('http://gold.test')
    .matchHeader('authorization', 'Bearer token-test')
    .post('/api/grants/revoke', body => body.slack && body.slack.handle === 'alice' && !body.slack.id)
    .reply(200, {})

  room.user.say('user', 'hubot gold remove alice')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('alice ya no es miembro gold :monea:')))
  t.true(bareScope.isDone())

  nock('https://slack.com')
    .post('/api/users.info')
    .reply(200, { ok: true, user: { id: 'U123', name: 'carol' } })
  const mentionScope = nock('http://gold.test')
    .post('/api/grants/revoke', body => body.slack && body.slack.id === 'U123' && body.slack.handle === 'carol')
    .reply(200, {})

  room.user.say('user', 'hubot gold remove <@U123>')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('carol ya no es miembro gold :monea:')))
  t.true(mentionScope.isDone())

  const failingScope = nock('http://gold.test')
    .post('/api/grants/revoke', body => body.slack && body.slack.handle === 'nobody')
    .reply(404, { error: 'not_found' })

  room.user.say('user', 'hubot gold remove nobody')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('No pude quitar la membresía gold a nobody')))
  t.true(failingScope.isDone())
})

test.serial('gold link vincula la cuenta', async t => {
  absorbAutoRefresh()
  const room = createRoom(t)
  const scope = nock('http://gold.test')
    .matchHeader('authorization', 'Bearer token-test')
    .post('/api/link/slack', body =>
      body.code === 'ABCDEF' &&
      body.slackId === 'user' &&
      body.handle === 'user')
    .reply(200, {})
  const failingScope = nock('http://gold.test')
    .post('/api/link/slack', body => body.code === 'EXPIRED')
    .reply(410, { error: 'code_expired' })

  room.user.say('user', 'hubot gold link ABCDEF')
  await waitUntil(() => hubotMessages(room).some(text => text.includes(':clap2: cuenta vinculada :monea:')))
  t.true(scope.isDone())

  room.user.say('user', 'hubot gold link EXPIRED')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('El código no es válido o expiró')))
  t.true(failingScope.isDone())
})

test.serial('gold status y gold list son lecturas puras de la proyección local', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.brain.set('gold_projection', projectionOf([
    { handle: 'alice', paidThrough: '2027-03-15T12:00:00.000Z' },
    { handle: 'bob', paidThrough: '2020-01-01T03:00:00.000Z' }
  ]))
  const snapshot = JSON.stringify(room.robot.brain.get('gold_projection'))

  room.user.say('user', 'hubot gold status alice')
  room.user.say('user', 'hubot gold status bob')
  room.user.say('user', 'hubot gold status nobody')
  room.user.say('user', 'hubot gold list')
  await waitUntil(() => hubotMessages(room).length >= 4)

  const messages = hubotMessages(room)
  t.deepEqual(messages[0], 'alice es gold :monea: hasta el 2027-03-15')
  t.deepEqual(messages[1], 'bob ya no es gold :monea:, expiró el 2020-01-01')
  t.deepEqual(messages[2], 'nobody no es gold :monea:')
  t.deepEqual(messages[3], 'alice')

  t.deepEqual(JSON.stringify(room.robot.brain.get('gold_projection')), snapshot)

  blockAutoRefresh()
  const emptyRoom = createRoom(t)
  emptyRoom.user.say('user', 'hubot gold list')
  await waitUntil(() => hubotMessages(emptyRoom).length >= 1)
  t.deepEqual(hubotMessages(emptyRoom)[0], 'No hay usuarios gold :monea:')
})

test.serial('/gold/webhook legado responde 410', async t => {
  absorbAutoRefresh()
  const room = createRoom(t, { httpd: true })
  await waitUntil(() => room.robot.server && room.robot.server.listening)
  const port = room.robot.server.address().port

  const response = await fetch(`http://127.0.0.1:${port}/gold/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}'
  })
  t.is(response.status, 410)
  t.deepEqual(await response.json(), {
    error: 'moved',
    to: 'https://soy.devschile.cl/api/webhooks/reveniu'
  })
})
