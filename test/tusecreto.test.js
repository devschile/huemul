'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')

const helper = new Helper('../scripts/tusecreto.js')

const randomChannel = { id: 'C123', name: 'random', is_member: true }

const mockConversations = channels => {
  nock.cleanAll()
  nock('https://slack.com')
    .post('/api/conversations.list')
    .reply(200, { ok: true, channels })
}

test.beforeEach(t => {
  delete process.env.HUBOT_MYSECRET_ALLOWED_CHANNELS
  t.context.room = helper.createRoom({ httpd: false })
  t.context.room.robot.golden = { isGold: () => false }
  nock('https://slack.com')
    .post('/api/conversations.list')
    .optionally()
    .reply(200, { ok: true, channels: [randomChannel] })
})

test.afterEach(t => {
  delete process.env.HUBOT_MYSECRET_ALLOWED_CHANNELS
  t.context.room.destroy()
  nock.cleanAll()
})

test.cb.serial('mi secreto - publica en #random por defecto', t => {
  t.context.room.user.say('user', 'hubot mi secreto este es mi secreto')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'hubot mi secreto este es mi secreto']])
    t.deepEqual(t.context.room.robot.messagesTo.C123, [
      ['hubot', ':speak_no_evil: *Un secreto:* este es mi secreto']
    ])
    t.end()
  }, 500)
})

test.cb.serial('mi secreto - publica en canal permitido explícito', t => {
  process.env.HUBOT_MYSECRET_ALLOWED_CHANNELS = '#random,#pegas'
  mockConversations([{ id: 'C2', name: 'pegas', is_member: true }])
  t.context.room.user.say('user', 'hubot mi secreto pegas contenido secreto')
  setTimeout(() => {
    t.deepEqual(t.context.room.robot.messagesTo.C2, [
      ['hubot', ':speak_no_evil: *Un secreto:* contenido secreto']
    ])
    t.end()
  }, 500)
})

test.cb.serial('mi secreto - gold puede usar un canal fuera del allowlist', t => {
  t.context.room.robot.golden = { isGold: () => true }
  mockConversations([{ id: 'C2', name: 'pegas', is_member: true }])
  t.context.room.user.say('user', 'hubot mi secreto pegas contenido secreto')
  setTimeout(() => {
    t.deepEqual(t.context.room.robot.messagesTo.C2, [
      ['hubot', ':speak_no_evil: *Un secreto:* contenido secreto']
    ])
    t.end()
  }, 500)
})

test.cb.serial('mi secreto - canal desconocido', t => {
  process.env.HUBOT_MYSECRET_ALLOWED_CHANNELS = '#random,#nope'
  mockConversations([randomChannel])
  t.context.room.user.say('user', 'hubot mi secreto nope contenido')
  setTimeout(() => {
    t.deepEqual(t.context.room.robot.messagesTo.user, [
      ['hubot', 'No sé qué canal es ese.']
    ])
    t.end()
  }, 500)
})

test.cb.serial('mi secreto - huemul no es miembro del canal', t => {
  process.env.HUBOT_MYSECRET_ALLOWED_CHANNELS = '#random,#notmember'
  mockConversations([{ id: 'C3', name: 'notmember', is_member: false }])
  t.context.room.user.say('user', 'hubot mi secreto notmember contenido')
  setTimeout(() => {
    t.deepEqual(t.context.room.robot.messagesTo.user, [
      ['hubot', 'No estoy en #notmember. :sadhuemul:']
    ])
    t.end()
  }, 500)
})

test.cb.serial('mi secreto - sin contenido', t => {
  t.context.room.user.say('user', 'hubot mi secreto random')
  setTimeout(() => {
    t.deepEqual(t.context.room.robot.messagesTo.user, [
      ['hubot', '¿Y el secreto?']
    ])
    t.end()
  }, 500)
})

test.cb.serial('mi secreto - bloquea mención a todos', t => {
  t.context.room.user.say('user', 'hubot mi secreto random @here contenido')
  setTimeout(() => {
    t.deepEqual(t.context.room.robot.messagesTo.user, [
      ['hubot', 'El tonto de user trató de usar @']
    ])
    t.end()
  }, 500)
})
