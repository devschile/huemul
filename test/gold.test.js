'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')
const Path = require('path')
const fetch = require('node-fetch')

const helper = new Helper('../scripts/gold.js')

// hubot-test-helper requires `hubot/es2015` (compiled JS) from its own tree —
// the top-level hubot 2.x ships only .coffee that this CoffeeScript can't
// compile. Resolve the SAME copy it uses instead of hardcoding a nested path,
// so hoisting changes don't silently break this.
const Hubot = require(require.resolve('hubot/es2015', {
  paths: [Path.dirname(require.resolve('hubot-test-helper'))]
}))

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

// Exactly ONE boot refresh fires per room: the brain 'loaded' handler is
// guarded so it cannot re-enter itself (Brain#set re-emits 'loaded'). This used
// to need .times(3) to soak up a self-sustaining refresh loop.
const absorbAutoRefresh = () => {
  nock('http://gold.test')
    .matchHeader('authorization', 'Bearer token-test')
    .get('/api/huemul/projection')
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
  // httpd + /gold/sync is the only way to force a refresh from a test: the poll
  // is 60s away and brain.emit('loaded') is deliberately inert after boot.
  const room = createRoom(t, { httpd: true })
  await waitUntil(() => room.robot.server && room.robot.server.listening)
  const base = `http://127.0.0.1:${room.robot.server.address().port}`

  await waitUntil(() => room.robot.golden.isGold('carol'))
  const stored = room.robot.brain.get('gold_projection')
  t.is(stored.members[0].handle, 'carol')

  const failing = nock('http://gold.test')
    .matchHeader('authorization', 'Bearer token-test')
    .get('/api/huemul/projection')
    .reply(500)
  const response = await fetch(`${base}/gold/sync`, {
    method: 'POST',
    headers: { authorization: 'Bearer sync-secret' }
  })
  t.is(response.status, 502)
  t.true(failing.isDone())
  // Un maestro caído nunca revoca a nadie.
  t.true(room.robot.golden.isGold('carol'))
  t.is(room.robot.brain.get('gold_projection').members[0].handle, 'carol')
})

test.serial('el handler de brain loaded no se re-entra a sí mismo', async t => {
  // Brain#set re-emite 'loaded'. Sin la guarda, escribir la proyección
  // disparaba otro refresh, que volvía a escribir: un bucle de requests contra
  // el maestro sin fin. Solo el PRIMER interceptor puede consumirse.
  const first = mockProjection([{ handle: 'zoe', paidThrough: iso(5 * DAY) }])
  const second = mockProjection([{ handle: 'zoe', paidThrough: iso(9 * DAY) }])

  const room = createRoom(t)
  await waitUntil(() => room.robot.golden.isGold('zoe'))
  await delay(200)
  t.true(first.isDone())
  t.false(second.isDone())

  // Una escritura ajena en el brain tampoco puede disparar un refresh.
  room.robot.brain.set('algo_no_relacionado', Date.now())
  await delay(200)
  t.false(second.isDone())
})

test.serial('no reescribe el brain cuando la proyección no cambió', async t => {
  const members = [{ handle: 'nora', paidThrough: iso(12 * DAY) }]
  mockProjection(members)
  const room = createRoom(t, { httpd: true })
  await waitUntil(() => room.robot.server && room.robot.server.listening)
  const base = `http://127.0.0.1:${room.robot.server.address().port}`
  await waitUntil(() => room.robot.golden.isGold('nora'))

  // brain.set ensucia el brain completo y hubot-mongodb-brain persiste TODO,
  // así que un payload idéntico no debe escribir nada.
  let writes = 0
  const realSet = room.robot.brain.set.bind(room.robot.brain)
  room.robot.brain.set = (...args) => {
    if (args[0] === 'gold_projection') writes++
    return realSet(...args)
  }

  mockProjection(members)
  let response = await fetch(`${base}/gold/sync`, {
    method: 'POST',
    headers: { authorization: 'Bearer sync-secret' }
  })
  t.is(response.status, 204)
  t.is(writes, 0)

  // Un payload distinto sí se escribe.
  mockProjection([{ handle: 'nora', paidThrough: iso(40 * DAY) }])
  response = await fetch(`${base}/gold/sync`, {
    method: 'POST',
    headers: { authorization: 'Bearer sync-secret' }
  })
  t.is(response.status, 204)
  t.is(writes, 1)
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

test.serial('el anuncio pagina conversations.list y prefiere el canal configurado a random', async t => {
  absorbAutoRefresh()
  nock('https://slack.com')
    .post('/api/conversations.list')
    .reply(200, {
      ok: true,
      channels: [{ id: 'CRANDOM', name: 'random' }],
      response_metadata: { next_cursor: 'pagina-2' }
    })
    .post('/api/conversations.list')
    .reply(200, { ok: true, channels: [{ id: 'CGOLD', name: 'gold' }] })
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }
  let sentRoom = null
  const originalSend = room.robot.send.bind(room.robot)
  room.robot.send = (envelope, str) => {
    sentRoom = envelope.room
    return originalSend(envelope, str)
  }
  nock('http://gold.test')
    .matchHeader('authorization', 'Bearer token-test')
    .post('/api/grants')
    .reply(200, { paidThrough: iso(10 * DAY) })

  room.user.say('user', 'hubot gold add bob')
  await waitUntil(() => sentRoom !== null)
  t.is(sentRoom, 'CGOLD')
})

test.serial('POST /gold/sync devuelve 502 cuando el maestro falla', async t => {
  blockAutoRefresh()
  const room = createRoom(t, { httpd: true })
  await waitUntil(() => room.robot.server && room.robot.server.listening)
  const port = room.robot.server.address().port

  const response = await fetch(`http://127.0.0.1:${port}/gold/sync`, {
    method: 'POST',
    headers: { authorization: 'Bearer sync-secret' }
  })
  t.is(response.status, 502)
  t.deepEqual(await response.json(), { error: 'sync_failed' })
})

test.serial('POST /gold/sync comparte un refresh en curso entre pushes simultáneos', async t => {
  absorbAutoRefresh()
  const room = createRoom(t, { httpd: true })
  await waitUntil(() => room.robot.server && room.robot.server.listening)
  const port = room.robot.server.address().port
  const base = `http://127.0.0.1:${port}`

  const scope = mockProjection([{ handle: 'erin', paidThrough: iso(5 * DAY) }])

  const [a, b] = await Promise.all([
    fetch(`${base}/gold/sync`, { method: 'POST', headers: { authorization: 'Bearer sync-secret' } }),
    fetch(`${base}/gold/sync`, { method: 'POST', headers: { authorization: 'Bearer sync-secret' } })
  ])
  t.is(a.status, 204)
  t.is(b.status, 204)
  await waitUntil(() => room.robot.golden.isGold('erin'))
  t.true(scope.isDone())
})

test.serial('gold add por mención resuelve el handle desde el perfil si falta el nombre legado', async t => {
  absorbAutoRefresh()
  mockSlack()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }
  nock('https://slack.com')
    .post('/api/users.info')
    .reply(200, { ok: true, user: { id: 'U999', profile: { display_normalized_name: 'dave' } } })
  const grantScope = nock('http://gold.test')
    .post('/api/grants', body => body.slack && body.slack.id === 'U999' && body.slack.handle === 'dave')
    .reply(200, { paidThrough: iso(7 * DAY) })

  room.user.say('user', 'hubot gold add <@U999>')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('*dave* se suscribió a :huemul:')))
  t.true(grantScope.isDone())
})

test.serial('gold add rechaza días inválidos y gold remove argumentos extra', async t => {
  absorbAutoRefresh()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }

  room.user.say('user', 'hubot gold add bob abc')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('Uso: hubot gold add <usuario> [días]')))

  room.user.say('user', 'hubot gold add bob 0')
  await waitUntil(() => hubotMessages(room).filter(text => text.includes('Uso: hubot gold add <usuario> [días]')).length >= 2)

  room.user.say('user', 'hubot gold remove alice extra')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('Uso: hubot gold remove <usuario>')))

  t.true(hubotMessages(room).some(text => text.includes('Uso: hubot gold add <usuario> [días]')))
  t.true(hubotMessages(room).some(text => text.includes('Uso: hubot gold remove <usuario>')))
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
      body.note === 'bot gold add' &&
      // Idempotency key: sin esto un reintento otorga un segundo período.
      typeof body.ref === 'string' && body.ref.startsWith('add:') && body.ref.length > 4)
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

test.serial('gold add keya la idempotencia en el id del mensaje de Slack', async t => {
  // SlackTextMessage pasa rawMessage.ts como el id de TextMessage
  // (hubot-slack/src/message.coffee), así que en producción el ref identifica
  // ESTE comando: un reintento cae sobre el mismo source_ref y el maestro lo
  // deduplica en UNIQUE (source, source_ref).
  absorbAutoRefresh()
  mockSlack()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }

  let sentRef = null
  const scope = nock('http://gold.test')
    .post('/api/grants', body => {
      sentRef = body.ref
      return true
    })
    .reply(200, { paidThrough: iso(30 * DAY) })

  // El tercer argumento de TextMessage es el id — SlackTextMessage le pasa
  // rawMessage.ts (hubot-slack/src/message.coffee).
  const user = new Hubot.User('user', { room: room.name })
  room.user.say('user', new Hubot.TextMessage(user, 'hubot gold add dana', '1712345678.000100'))

  await waitUntil(() => scope.isDone())
  t.is(sentRef, 'add:1712345678.000100')
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
