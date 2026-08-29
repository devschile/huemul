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

const mockUserInfo = (id, name) =>
  nock('https://slack.com')
    .post('/api/users.info')
    .reply(200, { ok: true, user: { id, name } })

const slackAdapterCommand = (room, text, rawText, id = `${Date.now()}.000100`) => {
  const user = new Hubot.User('user', { room: room.name })
  const message = new Hubot.TextMessage(user, text, id)
  message.rawText = rawText
  message.rawMessage = { text: rawText, ts: id }
  return message
}

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
  t.false(room.robot.golden.isGold({ id: 'USOMEONE', name: 'someone' }))
})

test.serial('hidrata la proyección persistida en el brain', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.brain.set('gold_projection', projectionOf([
    { slackId: 'UALICE', handle: 'alice', paidThrough: iso(10 * DAY) },
    { slackId: 'UBOB', handle: 'bob', paidThrough: iso(-10 * DAY) }
  ]))
  t.true(room.robot.golden.isGold({ id: 'UALICE', name: 'alice' }))
  t.false(room.robot.golden.isGold({ id: 'UBOB', name: 'bob' }))
  t.false(room.robot.golden.isGold({ id: 'UCAROL', name: 'carol' }))

  const roomB = createRoom(t)
  roomB.robot.brain.set('gold_projection', JSON.stringify(projectionOf([
    { slackId: 'UALICE', handle: 'alice', paidThrough: iso(10 * DAY) }
  ])))
  t.true(roomB.robot.golden.isGold({ id: 'UALICE', name: 'alice' }))
})

test.serial('isGold autoriza por Slack ID aunque el usuario haya cambiado de handle', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.brain.set('gold_projection', projectionOf([
    { slackId: 'UALICE', handle: 'alice-antigua', paidThrough: iso(10 * DAY) }
  ]))

  t.true(room.robot.golden.isGold({ id: 'UALICE', name: 'alice-actual' }))
  t.false(room.robot.golden.isGold({ id: 'UOTRA', name: 'alice-antigua' }))
  t.false(room.robot.golden.isGold('alice-antigua'))
})

test.serial('refresh exitoso conserva la id de Slack y el fallo conserva la última buena', async t => {
  mockProjection([{ slackId: 'UCAROL', handle: 'carol', paidThrough: iso(30 * DAY) }])
  // httpd + /gold/sync is the only way to force a refresh from a test: the poll
  // is 60s away and brain.emit('loaded') is deliberately inert after boot.
  const room = createRoom(t, { httpd: true })
  await waitUntil(() => room.robot.server && room.robot.server.listening)
  const base = `http://127.0.0.1:${room.robot.server.address().port}`

  await waitUntil(() => room.robot.golden.isGold({ id: 'UCAROL', name: 'carol' }))
  const stored = room.robot.brain.get('gold_projection')
  t.is(stored.members[0].slackId, 'UCAROL')
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
  t.true(room.robot.golden.isGold({ id: 'UCAROL', name: 'carol' }))
  t.is(room.robot.brain.get('gold_projection').members[0].handle, 'carol')
})

test.serial('el handler de brain loaded no se re-entra a sí mismo', async t => {
  // Brain#set re-emite 'loaded'. Sin la guarda, escribir la proyección
  // disparaba otro refresh, que volvía a escribir: un bucle de requests contra
  // el maestro sin fin. Solo el PRIMER interceptor puede consumirse.
  const first = mockProjection([{ slackId: 'UZOE', handle: 'zoe', paidThrough: iso(5 * DAY) }])
  const second = mockProjection([{ slackId: 'UZOE', handle: 'zoe', paidThrough: iso(9 * DAY) }])

  const room = createRoom(t)
  await waitUntil(() => room.robot.golden.isGold({ id: 'UZOE', name: 'zoe' }))
  await delay(200)
  t.true(first.isDone())
  t.false(second.isDone())

  // Una escritura ajena en el brain tampoco puede disparar un refresh.
  room.robot.brain.set('algo_no_relacionado', Date.now())
  await delay(200)
  t.false(second.isDone())
})

test.serial('no reescribe el brain cuando la proyección no cambió', async t => {
  const members = [{ slackId: 'UNORA', handle: 'nora', paidThrough: iso(12 * DAY) }]
  mockProjection(members)
  const room = createRoom(t, { httpd: true })
  await waitUntil(() => room.robot.server && room.robot.server.listening)
  const base = `http://127.0.0.1:${room.robot.server.address().port}`
  await waitUntil(() => room.robot.golden.isGold({ id: 'UNORA', name: 'nora' }))

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
  mockProjection([{ slackId: 'UNORA', handle: 'nora', paidThrough: iso(40 * DAY) }])
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

  const scope = mockProjection([{ slackId: 'UDAVE', handle: 'dave', paidThrough: iso(5 * DAY) }])

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
  await waitUntil(() => room.robot.golden.isGold({ id: 'UDAVE', name: 'dave' }))
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

  const scope = mockProjection([{ slackId: 'UERIN', handle: 'erin', paidThrough: iso(5 * DAY) }])

  const [a, b] = await Promise.all([
    fetch(`${base}/gold/sync`, { method: 'POST', headers: { authorization: 'Bearer sync-secret' } }),
    fetch(`${base}/gold/sync`, { method: 'POST', headers: { authorization: 'Bearer sync-secret' } })
  ])
  t.is(a.status, 204)
  t.is(b.status, 204)
  await waitUntil(() => room.robot.golden.isGold({ id: 'UERIN', name: 'erin' }))
  t.true(scope.isDone())
})

test.serial('gold add usa la id cruda del adaptador y el username normalizado si Slack omite user.name', async t => {
  absorbAutoRefresh()
  mockSlack()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }
  nock('https://slack.com')
    .post('/api/users.info')
    .reply(200, { ok: true, user: { id: 'U999', profile: { display_name_normalized: 'Dave Human' } } })
  const grantScope = nock('http://gold.test')
    .post('/api/grants', body =>
      body.slack &&
      body.slack.id === 'U999' &&
      body.slack.handle === 'dave-current' &&
      body.slack.handleSource === undefined)
    .reply(200, { paidThrough: iso(7 * DAY) })

  room.user.say('user', slackAdapterCommand(
    room,
    'hubot gold add @dave-current',
    '<@UBOT> gold add <@U999>'
  ))
  await waitUntil(() => hubotMessages(room).some(text => text.includes('*dave-current* se suscribió a :huemul:')))
  t.true(grantScope.isDone())
})

test.serial('gold add no crea una identidad sin username', async t => {
  absorbAutoRefresh()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }
  nock('https://slack.com')
    .post('/api/users.info')
    .reply(200, { ok: true, user: { id: 'U404', profile: { display_name_normalized: 'Solo Display' } } })
  const unexpectedGrant = nock('http://gold.test')
    .post('/api/grants')
    .reply(200, {})

  room.user.say('user', slackAdapterCommand(
    room,
    'hubot gold add @U404',
    '<@UBOT> gold add <@U404>'
  ))
  await waitUntil(() => hubotMessages(room).some(text => text.includes('No pude obtener el username actual de Slack')))
  t.false(unexpectedGrant.isDone())
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

  mockUserInfo('U123', 'carol')
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

test.serial('gold add y gold remove responden a quien no tiene permisos', async t => {
  absorbAutoRefresh()
  mockSlack()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => false, hasRole: () => false }

  room.user.say('user', 'hubot gold add bob 15')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('Necesitas ser admin')))
  room.user.say('user', 'hubot gold remove bob')
  await waitUntil(() => hubotMessages(room).filter(text => text.includes('Necesitas ser admin')).length === 2)

  t.is(hubotMessages(room).filter(text => text.includes('Necesitas ser admin')).length, 2)
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

  mockUserInfo('U123', 'carol')
  const mentionScope = nock('http://gold.test')
    .post('/api/grants/revoke', body =>
      body.slack &&
      body.slack.id === 'U123' &&
      body.slack.handle === 'carol' &&
      body.slack.handleSource === undefined)
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

test.serial('gold status y gold list muestran usernames actuales usando las ids de la proyección', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }
  room.robot.brain.set('gold_projection', projectionOf([
    { slackId: 'UALICE', handle: 'alice', paidThrough: '2027-03-15T12:00:00.000Z' },
    { slackId: 'UBOB', handle: 'bob', paidThrough: '2020-01-01T03:00:00.000Z' }
  ]))
  const projectionBefore = JSON.stringify(room.robot.brain.get('gold_projection'))
  mockUserInfo('UALICE', 'alice-actual')
  mockUserInfo('UBOB', 'bob-actual')

  room.user.say('user', 'hubot gold status alice')
  await waitUntil(() => hubotMessages(room).length >= 1)
  room.user.say('user', 'hubot gold status <@UBOB>')
  await waitUntil(() => hubotMessages(room).length >= 2)
  room.user.say('user', 'hubot gold status nobody')
  await waitUntil(() => hubotMessages(room).length >= 3)
  room.user.say('user', 'hubot gold list')
  await waitUntil(() => hubotMessages(room).length >= 4)

  const messages = hubotMessages(room)
  t.deepEqual(messages[0], 'alice-actual es gold :monea: hasta el 2027-03-15')
  t.deepEqual(messages[1], 'bob-actual ya no es gold :monea:, expiró el 2020-01-01')
  t.deepEqual(messages[2], 'nobody no es gold :monea:')
  t.deepEqual(messages[3], 'alice-actual')

  t.is(JSON.stringify(room.robot.brain.get('gold_projection')), projectionBefore)
  t.is(room.robot.brain.get('gold_slack_handles').UALICE.handle, 'alice-actual')
  t.is(room.robot.brain.get('gold_slack_handles').UBOB.handle, 'bob-actual')

  blockAutoRefresh()
  const emptyRoom = createRoom(t)
  emptyRoom.robot.auth = { isAdmin: () => true, hasRole: () => false }
  emptyRoom.user.say('user', 'hubot gold list')
  await waitUntil(() => hubotMessages(emptyRoom).length >= 1)
  t.deepEqual(hubotMessages(emptyRoom)[0], 'No hay usuarios gold :monea:')
})

test.serial('gold status persiste el username resuelto y gold list no repite users.info', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }
  room.robot.brain.set('gold_projection', projectionOf([
    { slackId: 'UALICE', handle: 'alice-antigua', paidThrough: '2027-03-15T12:00:00.000Z' }
  ]))
  const lookup = mockUserInfo('UALICE', 'alice-actual')

  room.user.say('user', 'hubot gold status <@UALICE>')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('alice-actual es gold')))
  room.user.say('user', 'hubot gold list')
  await waitUntil(() => hubotMessages(room).length >= 2)

  t.true(lookup.isDone())
  t.deepEqual(hubotMessages(room).slice(0, 2), [
    'alice-actual es gold :monea: hasta el 2027-03-15',
    'alice-actual'
  ])
  t.is(room.robot.brain.get('gold_slack_handles').UALICE.handle, 'alice-actual')
})

test.serial('gold status y gold list responden si falla la resolución de usernames', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }
  room.robot.brain.set('gold_projection', projectionOf([
    { slackId: 'UALICE', handle: 'alice', paidThrough: '2027-03-15T12:00:00.000Z' }
  ]))
  room.robot.brain.users = () => { throw new Error('brain cache unavailable') }
  room.robot.on('error', () => {})

  room.user.say('user', 'hubot gold status <@UALICE>')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('No pude consultar el estado gold')))
  room.user.say('user', 'hubot gold list')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('No pude listar los usuarios gold')))

  t.true(hubotMessages(room).some(text => text.includes('No pude consultar el estado gold')))
  t.true(hubotMessages(room).some(text => text.includes('No pude listar los usuarios gold')))
})

test.serial('gold status y gold list contienen fallos al leer la proyección', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }
  const realGet = room.robot.brain.get.bind(room.robot.brain)
  room.robot.brain.get = key => {
    if (key === 'gold_projection') throw new Error('projection unavailable')
    return realGet(key)
  }
  room.robot.on('error', () => {})

  room.user.say('user', 'hubot gold status <@UALICE>')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('No pude consultar el estado gold')))
  room.user.say('user', 'hubot gold list')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('No pude listar los usuarios gold')))

  t.true(hubotMessages(room).some(text => text.includes('No pude consultar el estado gold')))
  t.true(hubotMessages(room).some(text => text.includes('No pude listar los usuarios gold')))
})

test.serial('un cache Gold vencido se revalida aunque el cache de Hubot conserve el handle viejo', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }
  room.robot.brain.set('gold_projection', projectionOf([
    { slackId: 'UALICE', handle: 'alice-antigua', paidThrough: '2027-03-15T12:00:00.000Z' }
  ]))
  room.robot.brain.set('gold_slack_handles', {
    UALICE: { handle: 'alice-antigua', resolvedAt: Date.now() - DAY - 1 }
  })
  room.robot.brain.userForId('UALICE').name = 'alice-antigua'
  const lookup = mockUserInfo('UALICE', 'alice-actual')

  room.user.say('user', 'hubot gold status <@UALICE>')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('alice-actual es gold')))
  room.user.say('user', 'hubot gold list')
  await waitUntil(() => hubotMessages(room).length >= 2)

  t.true(lookup.isDone())
  t.deepEqual(hubotMessages(room).slice(0, 2), [
    'alice-actual es gold :monea: hasta el 2027-03-15',
    'alice-actual'
  ])
  t.is(room.robot.brain.get('gold_slack_handles').UALICE.handle, 'alice-actual')
})

test.serial('gold list agrupa el cache de handles y no modifica la proyección', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }
  room.robot.brain.set('gold_projection', projectionOf([
    { slackId: 'UALICE', handle: 'alice-antigua', paidThrough: '2027-03-15T12:00:00.000Z' },
    { slackId: 'UBOB', handle: 'bob-antiguo', paidThrough: '2027-03-15T12:00:00.000Z' }
  ]))
  room.robot.brain.userForId('UALICE').name = 'alice-actual'
  room.robot.brain.userForId('UBOB').name = 'bob-actual'
  const projectionBefore = JSON.stringify(room.robot.brain.get('gold_projection'))
  let cacheWrites = 0
  const realSet = room.robot.brain.set.bind(room.robot.brain)
  room.robot.brain.set = (key, value) => {
    if (key === 'gold_slack_handles') cacheWrites++
    return realSet(key, value)
  }

  room.user.say('user', 'hubot gold list')
  await waitUntil(() => hubotMessages(room).some(text => text === 'alice-actual, bob-actual'))

  t.is(cacheWrites, 1)
  t.is(JSON.stringify(room.robot.brain.get('gold_projection')), projectionBefore)
})

test.serial('gold status usa la id del adaptador, no cae en el handle de otro y respeta permisos', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => false, hasRole: () => false }
  room.robot.brain.set('gold_projection', projectionOf([
    { slackId: 'UALICE', handle: 'username-actual', paidThrough: '2020-01-01T03:00:00.000Z' },
    { slackId: 'user', handle: 'username-antiguo', paidThrough: '2027-03-15T12:00:00.000Z' }
  ]))
  room.robot.brain.userForId('user').name = 'username-actual'

  room.user.say('user', slackAdapterCommand(
    room,
    'hubot gold status @username-actual',
    '<@UBOT> gold status <@user>'
  ))
  await waitUntil(() => hubotMessages(room).some(text => text.includes('username-actual es gold')))

  room.user.say('user', 'hubot gold status alice')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('Necesitas ser admin')))
  room.user.say('user', 'hubot gold list')
  await waitUntil(() => hubotMessages(room).filter(text => text.includes('Necesitas ser admin')).length === 2)

  t.false(hubotMessages(room).some(text => text.includes('alice es gold')))
})

test.serial('gold status conserva el handle guardado si Slack falla y no envía una mención', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }
  room.robot.brain.set('gold_projection', projectionOf([
    { slackId: 'UFAIL', handle: 'nombre-guardado', paidThrough: '2027-03-15T12:00:00.000Z' }
  ]))
  nock('https://slack.com')
    .post('/api/users.info')
    .reply(200, { ok: false, error: 'slack_no_disponible' })

  room.user.say('user', 'hubot gold status <@UFAIL>')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('nombre-guardado es gold')))
  t.false(hubotMessages(room).some(text => text.includes('<@UFAIL>')))
})

test.serial('gold status no confía en el label literal para consultar otra identidad', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => false, hasRole: () => false }
  room.robot.brain.set('gold_projection', projectionOf([
    { slackId: 'UVICTIMA', handle: 'victima', paidThrough: '2027-03-15T12:00:00.000Z' }
  ]))
  mockUserInfo('user', 'usuario-actual')

  room.user.say('user', 'hubot gold status <@user|victima>')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('usuario-actual no es gold')))
  t.false(hubotMessages(room).some(text => text.includes('victima es gold')))
})

test.serial('gold status no falla si el brain no puede materializar el usuario', async t => {
  blockAutoRefresh()
  const room = createRoom(t)
  room.robot.auth = { isAdmin: () => true, hasRole: () => false }
  room.robot.brain.set('gold_projection', projectionOf([
    { slackId: 'UALICE', handle: 'alice', paidThrough: '2027-03-15T12:00:00.000Z' }
  ]))
  mockUserInfo('UALICE', 'alice-actual')
  room.robot.brain.userForId = () => null

  room.user.say('user', 'hubot gold status <@UALICE>')
  await waitUntil(() => hubotMessages(room).some(text => text.includes('alice-actual es gold')))

  t.true(hubotMessages(room).some(text => text.includes('alice-actual es gold')))
})

test.serial('gold sync rechaza una proyección parcial y conserva la última válida', async t => {
  mockProjection([{ slackId: 'UALICE', handle: 'alice', paidThrough: '2027-03-15T12:00:00.000Z' }])
  const room = createRoom(t, { httpd: true })
  await waitUntil(() => room.robot.server && room.robot.server.listening)
  await waitUntil(() => room.robot.golden.isGold({ id: 'UALICE', name: 'alice' }))
  const port = room.robot.server.address().port

  mockProjection([{ handle: 'alice', paidThrough: '2027-03-15T12:00:00.000Z' }])
  const response = await fetch(`http://127.0.0.1:${port}/gold/sync`, {
    method: 'POST',
    headers: { authorization: 'Bearer sync-secret' }
  })

  t.is(response.status, 502)
  t.true(room.robot.golden.isGold({ id: 'UALICE', name: 'alice' }))
  t.is(room.robot.brain.get('gold_projection').members[0].slackId, 'UALICE')
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
