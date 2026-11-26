'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')
const Path = require('path')

// hubot-test-helper resolves `hubot/es2015` from its own tree; use the same
// copy so the hand-built TextMessage is an instance its Room understands.
const Hubot = require(require.resolve('hubot/es2015', {
  paths: [Path.dirname(require.resolve('hubot-test-helper'))]
}))

process.env.HUBOT_SLACK_TOKEN = process.env.HUBOT_SLACK_TOKEN || 'xoxb-test'

const helper = new Helper('../scripts/karma.js')

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const makeRoom = t => {
  const room = helper.createRoom({ httpd: false })
  t.context.room = room
  return room
}

const setKarma = (room, entries) => room.robot.brain.set('karmaLog', entries)

const send = (room, text, options = {}) => {
  const rawText = options.rawText || text
  const user = new Hubot.User('tester', { room: room.name })
  const message = new Hubot.TextMessage(user, text, `${Date.now()}.000100`)
  message.rawText = rawText
  message.mentions = options.mentions || []
  message.rawMessage = { text: rawText, ts: message.id }
  return room.receive('tester', message)
}

const karmaLog = () => [
  { targetId: 'UANA', targetName: 'ana', karma: 1, date: 1 },
  { targetId: 'UANA', targetName: 'ana', karma: 1, date: 2 },
  { targetId: 'UBETO', targetName: 'beto', karma: 1, date: 3 },
  { targetId: 'UBETO', targetName: 'beto', karma: -1, date: 4 },
  { targetId: 'UCARO', targetName: 'caro', karma: -1, date: 5 }
]

test.afterEach.always(t => {
  if (t.context.room) t.context.room.destroy()
  nock.cleanAll()
})

test.serial('karma top suma por targetId y ordena por score', async t => {
  const room = makeRoom(t)
  setKarma(room, karmaLog())

  await send(room, 'hubot karma top')

  t.deepEqual(room.messages, [
    ['tester', 'hubot karma top'],
    ['hubot', '🏆 *Top 3 de karma*\n1. ana — 2\n2. beto — 0\n3. caro — -1\n\n_3 personas con karma._']
  ])
})

test.serial('karma top comparte puesto en empates', async t => {
  const room = makeRoom(t)
  setKarma(room, [
    { targetId: 'UANA', targetName: 'ana', karma: 1, date: 1 },
    { targetId: 'UANA', targetName: 'ana', karma: 1, date: 2 },
    { targetId: 'UBETO', targetName: 'beto', karma: 1, date: 3 },
    { targetId: 'UBETO', targetName: 'beto', karma: 1, date: 4 },
    { targetId: 'UCARO', targetName: 'caro', karma: 1, date: 5 }
  ])

  await send(room, 'hubot karma top')

  t.is(room.messages[1][1], [
    '🏆 *Top 3 de karma*',
    '1. ana — 2',
    '1. beto — 2',
    '3. caro — 1',
    '',
    '_3 personas con karma._'
  ].join('\n'))
})

test.serial('karma top respeta el límite pedido', async t => {
  const room = makeRoom(t)
  setKarma(room, karmaLog())

  await send(room, 'hubot karma top 2')

  t.is(room.messages[1][1], [
    '🏆 *Top 2 de karma*',
    '1. ana — 2',
    '2. beto — 0',
    '',
    '_3 personas con karma._'
  ].join('\n'))
})

test.serial('karma top avisa cuando no hay votos', async t => {
  const room = makeRoom(t)
  setKarma(room, [])

  await send(room, 'hubot karma top')

  t.deepEqual(room.messages[1], ['hubot', 'Todavía no hay karma registrado. Vota con `@usuario++`.'])
})

test.serial('karma @usuario muestra score y puesto', async t => {
  const room = makeRoom(t)
  setKarma(room, karmaLog())

  await send(room, 'hubot karma @beto', {
    mentions: [{ id: 'UBETO', type: 'user', info: { name: 'beto' } }]
  })

  t.deepEqual(room.messages[1], ['hubot', '*beto* tiene *0* puntos de karma (puesto 2 de 3).'])
})

test.serial('karma usuario también resuelve por nombre sin mención', async t => {
  const room = makeRoom(t)
  setKarma(room, karmaLog())

  await send(room, 'hubot karma ana')

  t.deepEqual(room.messages[1], ['hubot', '*ana* tiene *2* puntos de karma (puesto 1 de 3).'])
})

test.serial('karma @usuario avisa cuando no tiene votos', async t => {
  const room = makeRoom(t)
  setKarma(room, karmaLog())

  await send(room, 'hubot karma @nadie', {
    mentions: [{ id: 'UNADIE', type: 'user', info: { name: 'nadie' } }]
  })

  t.deepEqual(room.messages[1], ['hubot', 'nadie no tiene karma todavía.'])
})

test.serial('karma sin argumentos muestra la ayuda', async t => {
  const room = makeRoom(t)

  await send(room, 'hubot karma')

  t.deepEqual(room.messages[1], [
    'hubot',
    'Uso: `huemul karma top [n]` para el ranking o `huemul karma @usuario` para ver a alguien.'
  ])
})

test.serial('karma top escapa nombres con markup de Slack', async t => {
  const room = makeRoom(t)
  setKarma(room, [
    { targetId: 'UX', targetName: '<@U9> & co', karma: 1, date: 1 }
  ])

  await send(room, 'hubot karma top')

  t.is(room.messages[1][1], [
    '🏆 *Top 1 de karma*',
    '1. &lt;@U9&gt; &amp; co — 1',
    '',
    '_1 persona con karma._'
  ].join('\n'))
})

test.serial('karma sigue registrando ++ sin cambios', async t => {
  const room = makeRoom(t)
  room.robot.golden = { isGold: () => false }
  nock('https://slack.com')
    .post('/api/conversations.info')
    .reply(200, { ok: true, channel: { id: 'C1', is_channel: true } })

  await send(room, '@beto ++', {
    rawText: '<@UBETO> ++',
    mentions: [{ id: 'UBETO', type: 'user', info: { name: 'beto', real_name: 'Beto' } }]
  })
  await delay(200)

  t.is(room.robot.brain.get('karmaLog').length, 1)
  t.deepEqual(room.messages[1], ['hubot', 'Beto ahora tiene 1 puntos de karma.'])
})
