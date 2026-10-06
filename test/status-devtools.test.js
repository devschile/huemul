'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')

const statusDevtools = require('../scripts/status-devtools.js')
const helper = new Helper([])

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const httpStub = handlers => {
  const calls = []
  const factory = url => {
    calls.push(url)
    const handler = handlers[url] || (cb => cb(new Error(`URL no mockeada: ${url}`)))
    const client = {
      timeout: () => client,
      get: () => cb => handler(cb)
    }
    return client
  }
  factory.calls = calls
  return factory
}

const reply = body => cb => cb(null, { statusCode: 200 }, JSON.stringify(body))

const blockList = payload => JSON.parse(payload.blocks)

const summary = (description = 'All Systems Operational', indicator = 'none', incidents = []) => ({
  page: { url: 'https://status.example.com/', updated_at: '2026-10-05T21:00:00.000Z' },
  status: { description, indicator },
  components: [],
  incidents
})

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
  statusDevtools(t.context.room.robot)
})

test.afterEach(t => {
  t.context.room.destroy()
})

test.serial('devtools status serializa Block Kit para el cliente Slack legado', async t => {
  const github = 'https://www.githubstatus.com/api/v2/summary.json'
  t.context.room.robot.http = httpStub({ [github]: reply(summary()) })

  t.context.room.user.say('user', 'hubot devtools status github')
  await sleep(30)

  const payload = t.context.room.messages[1][1]
  t.is(typeof payload.blocks, 'string')
  t.is(JSON.parse(payload.blocks)[0].type, 'header')
})

test.serial('devtools muestra ayuda con status, servicios y --resumen', async t => {
  t.context.room.user.say('user', 'hubot devtools')
  await sleep(30)

  const response = t.context.room.messages[1][1]
  t.true(response.includes('hubot devtools status'))
  t.true(response.includes('hubot devtools status --resumen'))
  t.true(response.includes('github, gitlab, bitbucket, cloudflare, claude, openai, vercel, netlify, opencode'))
})

test.serial('devtools status --resumen publica bloques con sólo los servicios degradados', async t => {
  const github = 'https://www.githubstatus.com/api/v2/summary.json'
  const gitlab = 'https://api.status.io/1.0/status/5b36dc6502d06804c08349f7'
  const bitbucket = 'https://bqlf8qjztdtr.statuspage.io/api/v2/summary.json'
  const cloudflare = 'https://www.cloudflarestatus.com/api/v2/summary.json'
  const claude = 'https://status.anthropic.com/api/v2/summary.json'
  const openai = 'https://status.openai.com/api/v2/summary.json'
  const vercel = 'https://www.vercel-status.com/api/v2/summary.json'
  const netlify = 'https://www.netlifystatus.com/api/v2/summary.json'
  const npm = 'https://status.npmjs.org/api/v2/summary.json'
  const stub = httpStub({
    [github]: reply(summary('Partial System Outage', 'major', [{ name: 'Actions incident' }])),
    [gitlab]: reply({ result: { status_overall: { status: 'Operational', status_code: 100, updated: '2026-10-05T21:00:00.000Z' }, incidents: [] } }),
    [bitbucket]: reply(summary()),
    [cloudflare]: reply(summary()),
    [claude]: reply(summary()),
    [openai]: reply(summary()),
    [vercel]: reply(summary()),
    [netlify]: reply(summary()),
    [npm]: reply(summary())
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot devtools status --resumen')
  await sleep(30)

  t.is(t.context.room.messages.length, 2)
  const payload = t.context.room.messages[1][1]
  const texts = blockList(payload).flatMap(block => {
    const out = []
    if (block.text && block.text.text) out.push(block.text.text)
    for (const element of block.elements || []) if (element.text) out.push(element.text)
    return out
  }).join('\n')
  t.true(payload.text.includes('GitHub'))
  t.is(payload.unfurl_links, false)
  t.true(texts.includes('1 con incidencia'))
  t.true(texts.includes('GitHub'))
  t.false(texts.includes('GitLab'))
  t.deepEqual(stub.calls.sort(), [github, gitlab, bitbucket, cloudflare, claude, openai, vercel, netlify, npm].sort())
})

test.serial('devtools status muestra incidencias y servicios operativos en bloques', async t => {
  const github = 'https://www.githubstatus.com/api/v2/summary.json'
  const gitlab = 'https://api.status.io/1.0/status/5b36dc6502d06804c08349f7'
  const bitbucket = 'https://bqlf8qjztdtr.statuspage.io/api/v2/summary.json'
  const cloudflare = 'https://www.cloudflarestatus.com/api/v2/summary.json'
  const claude = 'https://status.anthropic.com/api/v2/summary.json'
  const openai = 'https://status.openai.com/api/v2/summary.json'
  const vercel = 'https://www.vercel-status.com/api/v2/summary.json'
  const netlify = 'https://www.netlifystatus.com/api/v2/summary.json'
  const npm = 'https://status.npmjs.org/api/v2/summary.json'
  const stub = httpStub({
    [github]: reply(summary('Partial System Outage', 'major', [{ name: 'Actions incident' }])),
    [gitlab]: reply({ result: { status_overall: { status: 'Operational', status_code: 100, updated: '2026-10-05T21:00:00.000Z' }, incidents: [] } }),
    [bitbucket]: reply(summary()),
    [cloudflare]: reply(summary()),
    [claude]: reply(summary()),
    [openai]: reply(summary()),
    [vercel]: reply(summary()),
    [netlify]: reply(summary()),
    [npm]: reply(summary())
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot devtools status')
  await sleep(30)

  t.is(t.context.room.messages.length, 2)
  const payload = t.context.room.messages[1][1]
  t.is(typeof payload.blocks, 'string')
  t.false(payload.text.includes('DevTools — uso'))
  const texts = blockList(payload).flatMap(block => {
    const out = []
    if (block.text && block.text.text) out.push(block.text.text)
    for (const element of block.elements || []) if (element.text) out.push(element.text)
    return out
  }).join('\n')
  t.true(texts.includes('GitHub'))
  t.true(texts.includes('GitLab'))
  t.true(texts.includes('Operativos'))
  t.true(blockList(payload).some(block => block.type === 'actions'))
})

test.serial('devtools status github consulta sólo GitHub y muestra detalle acotado', async t => {
  const github = 'https://www.githubstatus.com/api/v2/summary.json'
  const body = summary('Partial System Outage', 'major', [{
    name: 'Actions incident',
    incident_updates: [{ body: 'Estamos mitigando la demora de runners.' }]
  }])
  body.components = [
    { name: 'Actions', status: 'major_outage' },
    { name: 'API Requests', status: 'operational' }
  ]
  const stub = httpStub({ [github]: reply(body) })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot devtools status github')
  await sleep(30)

  t.is(t.context.room.messages.length, 2)
  const payload = t.context.room.messages[1][1]
  const texts = blockList(payload).flatMap(block => {
    const out = []
    if (block.text && block.text.text) out.push(block.text.text)
    for (const element of block.elements || []) if (element.text) out.push(element.text)
    return out
  }).join('\n')
  t.deepEqual(stub.calls, [github])
  t.true(texts.includes('GitHub'))
  t.true(texts.includes('Actions'))
  t.true(texts.includes('Estamos mitigando la demora de runners.'))
  t.false(texts.includes('API Requests'))
})

test.serial('devtools status convierte un schema 200 malformado en estado desconocido', async t => {
  const github = 'https://www.githubstatus.com/api/v2/summary.json'
  const malformed = summary('Partial System Outage', 'major')
  malformed.components = {}
  malformed.incidents = {}
  t.context.room.robot.http = httpStub({ [github]: reply(malformed) })

  t.context.room.user.say('user', 'hubot devtools status github')
  await sleep(30)

  t.is(t.context.room.messages.length, 2)
  const payload = t.context.room.messages[1][1]
  t.true(payload.text.includes('Respuesta inválida'))
})

test.serial('devtools status rechaza campos escalares Statuspage malformados', async t => {
  const github = 'https://www.githubstatus.com/api/v2/summary.json'
  const malformed = summary()
  malformed.status = { indicator: {}, description: [] }
  t.context.room.robot.http = httpStub({ [github]: reply(malformed) })

  t.context.room.user.say('user', 'hubot devtools status github')
  await sleep(30)

  t.true(t.context.room.messages[1][1].text.includes('Respuesta inválida'))
})

test.serial('devtools status neutraliza URLs desnudas del proveedor', async t => {
  const github = 'https://www.githubstatus.com/api/v2/summary.json'
  t.context.room.robot.http = httpStub({ [github]: reply(summary('Consulta https://evil.example/path', 'major')) })

  t.context.room.user.say('user', 'hubot devtools status github')
  await sleep(30)

  const payload = t.context.room.messages[1][1]
  t.true(payload.text.includes('https:\u200b//evil.example/path'))
  t.false(payload.text.includes('https://evil.example/path'))
})

test.serial('devtools status degrada Status.io con incidencias malformadas', async t => {
  const gitlab = 'https://api.status.io/1.0/status/5b36dc6502d06804c08349f7'
  t.context.room.robot.http = httpStub({
    [gitlab]: reply({
      result: {
        status_overall: { status: 'Operational', status_code: 100 },
        incidents: [{ name: 'Incidente', incident_updates: {} }]
      }
    })
  })

  t.context.room.user.say('user', 'hubot devtools status gitlab')
  await sleep(30)

  t.true(t.context.room.messages[1][1].text.includes('Respuesta inválida'))
})

test.serial('devtools status siempre usa la URL canónica configurada', t => {
  const service = { key: 'test', name: 'Test', pageUrl: 'https://status.example.com/' }
  for (const pageUrl of ['https://status.example.com/', 'https://status.example.com/incidents?phish=1', 'https://evil.example/phish']) {
    const status = statusDevtools._test.parseStatuspage(service, {
      page: { url: pageUrl, updated_at: '2026-10-05T21:00:00.000Z' },
      status: { indicator: 'none', description: 'All Systems Operational' },
      components: [],
      incidents: []
    })
    t.is(status.pageUrl, service.pageUrl)
  }
})

test.serial('devtools status opencode reporta la disponibilidad de actualizaciones vía npm', async t => {
  const npm = 'https://status.npmjs.org/api/v2/summary.json'
  const stub = httpStub({ [npm]: reply(summary('All Systems Operational', 'none')) })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot devtools status opencode')
  await sleep(30)

  t.is(t.context.room.messages.length, 2)
  t.deepEqual(stub.calls, [npm])
  const texts = blockList(t.context.room.messages[1][1]).flatMap(block => block.text && block.text.text ? [block.text.text] : []).join('\n')
  t.true(texts.includes('NPM (OpenCode updates)'))
  t.true(texts.includes('All Systems Operational'))
})

test.serial('devtools status --resumen conserva el resto si un proveedor no responde', async t => {
  const github = 'https://www.githubstatus.com/api/v2/summary.json'
  const gitlab = 'https://api.status.io/1.0/status/5b36dc6502d06804c08349f7'
  const bitbucket = 'https://bqlf8qjztdtr.statuspage.io/api/v2/summary.json'
  const cloudflare = 'https://www.cloudflarestatus.com/api/v2/summary.json'
  const claude = 'https://status.anthropic.com/api/v2/summary.json'
  const openai = 'https://status.openai.com/api/v2/summary.json'
  const vercel = 'https://www.vercel-status.com/api/v2/summary.json'
  const netlify = 'https://www.netlifystatus.com/api/v2/summary.json'
  const npm = 'https://status.npmjs.org/api/v2/summary.json'
  const stub = httpStub({
    [github]: cb => cb(new Error('timeout')),
    [gitlab]: reply({ result: { status_overall: { status: 'Operational', status_code: 100, updated: '2026-10-05T21:00:00.000Z' }, incidents: [] } }),
    [bitbucket]: reply(summary()),
    [cloudflare]: reply(summary()),
    [claude]: reply(summary()),
    [openai]: reply(summary()),
    [vercel]: reply(summary()),
    [netlify]: reply(summary()),
    [npm]: reply(summary())
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot devtools status --resumen')
  await sleep(30)

  const payload = t.context.room.messages[1][1]
  const texts = blockList(payload).flatMap(block => {
    const out = []
    if (block.text && block.text.text) out.push(block.text.text)
    for (const element of block.elements || []) if (element.text) out.push(element.text)
    return out
  }).join('\n')
  t.true(texts.includes('GitHub'))
  t.true(texts.includes('Sin respuesta'))
  t.false(texts.includes('undefined'))
})

test.serial('devtools status entrega texto accesible junto a los bloques', async t => {
  const room = helper.createRoom({ httpd: false })
  statusDevtools(room.robot)
  const handlers = {}
  for (const service of statusDevtools._test.SERVICES) {
    handlers[service.url] = service.type === 'statusio'
      ? reply({ result: { status_overall: { status: 'Operational', status_code: 100 }, incidents: [] } })
      : reply(summary())
  }
  handlers['https://www.githubstatus.com/api/v2/summary.json'] = reply(summary('Partial System Outage', 'major'))
  room.robot.http = httpStub(handlers)

  room.user.say('user', 'hubot devtools status --resumen')
  await sleep(30)

  t.true(room.messages[1][1].text.includes('Partial System Outage'))
  room.destroy()
})

test.serial('devtools status github limita detalle remoto para bloques válidos', async t => {
  const github = 'https://www.githubstatus.com/api/v2/summary.json'
  const longDescription = `Partial System Outage ${'x'.repeat(4000)}`
  const longUpdate = `Actualización ${'y'.repeat(4000)}`
  const body = summary(longDescription, 'major', [{
    name: 'Actions incident',
    incident_updates: [{ body: longUpdate }]
  }])
  body.components = [{ name: 'Actions', status: 'major_outage' }]
  t.context.room.robot.http = httpStub({ [github]: reply(body) })

  t.context.room.user.say('user', 'hubot devtools status github')
  await sleep(30)

  const payload = t.context.room.messages[1][1]
  const sectionTexts = blockList(payload).filter(block => block.text && block.text.text).map(block => block.text.text)
  t.true(sectionTexts.every(text => text.length <= 3000))
  t.true(payload.text.includes('Partial System Outage'))
})

test.serial('devtools status usa msg.send aunque exista un cliente Slack incompatible', async t => {
  const room = helper.createRoom({ httpd: false })
  const incompatibleWeb = { chat: { postMessage: () => { throw new Error('no debe invocarse') } } }
  statusDevtools(room.robot, incompatibleWeb)
  const handlers = {}
  for (const service of statusDevtools._test.SERVICES) {
    handlers[service.url] = service.type === 'statusio'
      ? reply({ result: { status_overall: { status: 'Operational', status_code: 100 }, incidents: [] } })
      : reply(summary())
  }
  handlers['https://www.githubstatus.com/api/v2/summary.json'] = reply(summary('Partial System Outage', 'major'))
  room.robot.http = httpStub(handlers)

  room.user.say('user', 'hubot devtools status --resumen')
  await sleep(30)

  const payload = room.messages[1][1]
  t.true(payload.text.includes('Partial System Outage'))
  t.is(typeof payload.blocks, 'string')
  room.destroy()
})
