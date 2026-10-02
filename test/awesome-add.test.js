'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')

const helper = new Helper([])
const sourceUrl = 'https://devschile.slack.com/archives/C09P0V7LCQK/p1790966711522809'
const sourceTs = '1790966711.522809'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const waitUntil = (predicate, timeout = 1000) => new Promise((resolve, reject) => {
  const started = Date.now()
  const check = () => {
    if (predicate()) return resolve()
    if (Date.now() - started >= timeout) return reject(new Error('timeout esperando la respuesta de Huemul'))
    setTimeout(check, 10)
  }
  check()
})

const createSlack = () => {
  const calls = []
  return {
    calls,
    conversations: {
      info: async ({ channel }) => {
        calls.push({ method: 'conversations.info', channel })
        return { ok: true, channel: { id: channel, name: 'frontend', is_channel: true } }
      },
      replies: async ({ channel, ts }) => {
        calls.push({ method: 'conversations.replies', channel, ts })
        return {
          ok: true,
          messages: [
            {
              ts: sourceTs,
              user: 'UAUTOR',
              text: 'Miren este recurso para aprender pruebas.',
              attachments: [{
                title: 'Example Dev',
                title_link: 'https://example.dev/testing',
                text: 'Guía práctica de pruebas para equipos de desarrollo.'
              }],
              reactions: [{ name: 'thumbs-ups', users: ['UADMIN'] }]
            },
            {
              ts: '1790966720.000100',
              thread_ts: sourceTs,
              user: 'UAPOYA',
              text: 'Sí, incluyámoslo en el awesome; es un aporte excelente.'
            }
          ]
        }
      }
    },
    users: {
      info: async ({ user }) => {
        calls.push({ method: 'users.info', user })
        return { ok: true, user: { id: user, name: 'admin', is_admin: user === 'UADMIN' } }
      }
    }
  }
}

const createGithub = () => {
  const calls = []
  return {
    calls,
    getReadme: async () => ({
      content: '# Awesome devsChile\n\n## #frontend\n\n- [Existente](https://old.example): recurso previo\n\n## #general\n',
      sha: 'README_SHA'
    }),
    getBranch: async () => ({ sha: 'MASTER_SHA' }),
    createBranch: async (payload) => { calls.push({ method: 'createBranch', payload }) },
    updateReadme: async (payload) => { calls.push({ method: 'updateReadme', payload }) },
    createPullRequest: async (payload) => {
      calls.push({ method: 'createPullRequest', payload })
      return { html_url: 'https://github.com/devschile/awesome-devschile/pull/123' }
    }
  }
}

test.serial('awesome add crea un PR manual con el recurso aprobado desde un hilo de Slack', async t => {
  const awesomeAdd = require('../scripts/awesome-add.js')
  const room = helper.createRoom({ httpd: false })
  const slack = createSlack()
  const github = createGithub()
  awesomeAdd(room.robot, slack, github)

  room.user.say('user', `hubot awesome add ${sourceUrl}`)
  await waitUntil(() => room.messages.some(message => message[0] === 'hubot'))

  const reply = room.messages.find(message => message[0] === 'hubot')[1]
  t.true(reply.includes('https://github.com/devschile/awesome-devschile/pull/123'))
  t.deepEqual(slack.calls, [
    { method: 'conversations.info', channel: room.name },
    { method: 'conversations.replies', channel: 'C09P0V7LCQK', ts: sourceTs },
    { method: 'users.info', user: 'UADMIN' }
  ])

  const branch = github.calls.find(call => call.method === 'createBranch').payload
  t.deepEqual(branch, {
    branch: 'huemul/awesome/frontend-cfc6c0a6df196302',
    sha: 'MASTER_SHA'
  })

  const update = github.calls.find(call => call.method === 'updateReadme').payload
  t.is(update.branch, 'huemul/awesome/frontend-cfc6c0a6df196302')
  t.is(update.sha, 'README_SHA')
  t.is(update.message, 'feat(awesome): agrega Example Dev a #frontend')
  t.true(update.content.includes('- [Example Dev](https://example.dev/testing): Guía práctica de pruebas para equipos de desarrollo.'))
  t.true(update.content.indexOf('Example Dev') < update.content.indexOf('## #general'))

  const pr = github.calls.find(call => call.method === 'createPullRequest').payload
  t.deepEqual(pr, {
    title: 'feat(awesome): agrega Example Dev a #frontend',
    head: 'huemul/awesome/frontend-cfc6c0a6df196302',
    base: 'master',
    body: `Incluye [Example Dev](https://example.dev/testing) en #frontend.\n\nOrigen: ${sourceUrl}\nRespaldo en el hilo: 1 usuario.\n\nRevisión y merge manual.`
  })

  room.destroy()
  await sleep(10)
})

test.serial('awesome add no deja que el listado antiguo interprete add como un canal', async t => {
  const awesomeList = require('../scripts/awesome.js')
  const awesomeAdd = require('../scripts/awesome-add.js')
  const room = helper.createRoom({ httpd: false })
  const slack = createSlack()
  const github = createGithub()
  let legacyRequests = 0
  room.robot.http = () => {
    legacyRequests++
    return { get: () => callback => callback(null, { statusCode: 500 }, '') }
  }
  awesomeList(room.robot)
  awesomeAdd(room.robot, slack, github)

  room.user.say('user', `hubot awesome add ${sourceUrl}`)
  await waitUntil(() => room.messages.some(message => message[0] === 'hubot'))

  t.is(legacyRequests, 0)
  room.destroy()
})

test.serial('awesome add toma el recurso del mensaje enlazado aunque sea una respuesta del hilo', async t => {
  const awesomeAdd = require('../scripts/awesome-add.js')
  const room = helper.createRoom({ httpd: false })
  const replyTs = '1790966720.000100'
  const replyUrl = 'https://devschile.slack.com/archives/C09P0V7LCQK/p1790966720000100'
  const root = {
    ts: sourceTs,
    user: 'UINICIA',
    text: '¿Qué recursos deberían entrar al awesome?',
    reactions: [{ name: 'thumbs-ups', users: ['UADMIN'] }]
  }
  const linkedReply = {
    ts: replyTs,
    thread_ts: sourceTs,
    user: 'UCOMPARTE',
    text: 'Comparto este recurso.',
    attachments: [{
      title: 'Testing Reply',
      title_link: 'https://example.dev/reply',
      text: 'Material de pruebas compartido dentro del hilo.'
    }]
  }
  const support = {
    ts: '1790966730.000100',
    thread_ts: sourceTs,
    user: 'UAPOYA',
    text: 'Apoyo incluirlo en el awesome; nos sirve mucho.'
  }
  const slack = {
    conversations: {
      info: async ({ channel }) => ({ ok: true, channel: { id: channel, name: 'frontend', is_channel: true } }),
      replies: async ({ ts }) => ({ ok: true, messages: ts === replyTs ? [root, linkedReply, support] : [root, linkedReply, support] })
    },
    users: { info: async ({ user }) => ({ ok: true, user: { id: user, is_admin: user === 'UADMIN' } }) }
  }
  const github = createGithub()
  awesomeAdd(room.robot, slack, github)

  room.user.say('user', `hubot awesome add ${replyUrl}`)
  await waitUntil(() => room.messages.some(message => message[0] === 'hubot'))

  t.true(room.messages.some(message => message[1].includes('/pull/123')))
  const update = github.calls.find(call => call.method === 'updateReadme').payload
  t.true(update.content.includes('- [Testing Reply](https://example.dev/reply): Material de pruebas compartido dentro del hilo.'))
  room.destroy()
})

test.serial('awesome add no abre PR si :thumbs-ups: no pertenece a un admin', async t => {
  const awesomeAdd = require('../scripts/awesome-add.js')
  const room = helper.createRoom({ httpd: false })
  const slack = createSlack()
  const github = createGithub()
  slack.users.info = async ({ user }) => ({ ok: true, user: { id: user, is_admin: false, is_owner: false } })
  awesomeAdd(room.robot, slack, github)

  room.user.say('user', `hubot awesome add ${sourceUrl}`)
  await waitUntil(() => room.messages.some(message => message[0] === 'hubot'))

  const reply = room.messages.find(message => message[0] === 'hubot')[1]
  t.true(reply.includes('falta un :thumbs-ups: de un admin'))
  t.is(github.calls.length, 0)
  room.destroy()
})

test.serial('awesome add es idempotente si ya existe un PR abierto para el permalink', async t => {
  const awesomeAdd = require('../scripts/awesome-add.js')
  const room = helper.createRoom({ httpd: false })
  const slack = createSlack()
  const github = createGithub()
  github.findPullRequest = async branch => {
    t.is(branch, 'huemul/awesome/frontend-cfc6c0a6df196302')
    return {
      html_url: 'https://github.com/devschile/awesome-devschile/pull/456',
      head: { ref: branch }
    }
  }
  awesomeAdd(room.robot, slack, github)

  room.user.say('user', `hubot awesome add ${sourceUrl}`)
  await waitUntil(() => room.messages.some(message => message[0] === 'hubot'))

  const reply = room.messages.find(message => message[0] === 'hubot')[1]
  t.true(reply.includes('/pull/456'))
  t.false(github.calls.some(call => call.method === 'createBranch'))
  room.destroy()
})

test.serial('awesome add deduplica la misma URL aunque llegue desde otro permalink', async t => {
  const awesomeAdd = require('../scripts/awesome-add.js')
  const room = helper.createRoom({ httpd: false })
  const slack = createSlack()
  const github = createGithub()
  const anotherPermalink = 'https://devschile.slack.com/archives/C09P0V7LCQK/p1790966740999999'
  github.findPullRequest = async branch => {
    t.is(branch, 'huemul/awesome/frontend-cfc6c0a6df196302')
    return { html_url: 'https://github.com/devschile/awesome-devschile/pull/789' }
  }
  awesomeAdd(room.robot, slack, github)

  room.user.say('user', `hubot awesome add ${anotherPermalink}`)
  await waitUntil(() => room.messages.some(message => message[0] === 'hubot'))

  const reply = room.messages.find(message => message[0] === 'hubot')[1]
  t.true(reply.includes('/pull/789'))
  t.false(github.calls.some(call => call.method === 'createBranch'))
  room.destroy()
})

test.serial('awesome add no abre PR sin respaldo explícito de otro usuario en el hilo', async t => {
  const awesomeAdd = require('../scripts/awesome-add.js')
  const room = helper.createRoom({ httpd: false })
  const slack = createSlack()
  const github = createGithub()
  slack.conversations.replies = async () => ({
    ok: true,
    messages: [{
      ts: sourceTs,
      user: 'UAUTOR',
      text: 'Miren este recurso para aprender pruebas.',
      attachments: [{
        title: 'Example Dev',
        title_link: 'https://example.dev/testing',
        text: 'Guía práctica de pruebas para equipos de desarrollo.'
      }],
      reactions: [{ name: 'thumbs-ups', users: ['UADMIN'] }]
    }]
  })
  awesomeAdd(room.robot, slack, github)

  room.user.say('user', `hubot awesome add ${sourceUrl}`)
  await waitUntil(() => room.messages.some(message => message[0] === 'hubot'))

  const reply = room.messages.find(message => message[0] === 'hubot')[1]
  t.true(reply.includes('falta el respaldo explícito de otro usuario'))
  t.is(github.calls.length, 0)
  room.destroy()
})

test.serial('awesome add reutiliza una rama existente después de que falló crear el PR', async t => {
  const awesomeAdd = require('../scripts/awesome-add.js')
  const room = helper.createRoom({ httpd: false })
  const slack = createSlack()
  const github = createGithub()
  const branch = 'huemul/awesome/frontend-cfc6c0a6df196302'
  const masterReadme = '# Awesome devsChile\n\n## #frontend\n\n- [Existente](https://old.example): recurso previo\n\n## #general\n'
  const branchReadme = '# Awesome devsChile\n\n## #frontend\n\n- [Existente](https://old.example): recurso previo\n\n- [Example Dev](https://example.dev/testing): Guía práctica de pruebas para equipos de desarrollo.\n\n## #general\n'
  github.getReadme = async ref => ({
    content: ref === branch ? branchReadme : masterReadme,
    sha: ref === branch ? 'BRANCH_README_SHA' : 'MASTER_README_SHA'
  })
  github.ensureBranch = async payload => {
    github.calls.push({ method: 'ensureBranch', payload })
    return { created: false }
  }
  awesomeAdd(room.robot, slack, github)

  room.user.say('user', `hubot awesome add ${sourceUrl}`)
  await waitUntil(() => room.messages.some(message => message[0] === 'hubot'))

  t.true(room.messages.some(message => message[1].includes('/pull/123')))
  t.true(github.calls.some(call => call.method === 'ensureBranch'))
  t.false(github.calls.some(call => call.method === 'createBranch'))
  t.false(github.calls.some(call => call.method === 'updateReadme'))
  room.destroy()
})
