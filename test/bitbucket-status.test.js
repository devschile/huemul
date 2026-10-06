'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')

const bitbucketStatus = require('../scripts/bitbucket-status.js')
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

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
  bitbucketStatus(t.context.room.robot)
})

test.afterEach(t => {
  t.context.room.destroy()
})

test.serial('bitbucket status usa summary v2 y publica el estado en bloques', async t => {
  const endpoint = 'https://bqlf8qjztdtr.statuspage.io/api/v2/summary.json'
  const stub = httpStub({
    [endpoint]: reply({
      page: { url: 'https://bitbucket.status.atlassian.com/', updated_at: '2026-10-05T21:00:00.000Z' },
      status: { indicator: 'major', description: 'Partial System Outage' },
      components: [
        { name: 'Pipelines', status: 'major_outage' },
        { name: 'API', status: 'operational' }
      ],
      incidents: [{
        name: 'Pipelines incident',
        incident_updates: [{ body: 'Estamos investigando errores de Pipelines. https://evil.example/path' }]
      }]
    })
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot bitbucket status')
  await sleep(30)

  t.deepEqual(stub.calls, [endpoint])
  t.is(t.context.room.messages.length, 2)
  const payload = t.context.room.messages[1][1]
  const texts = payload.blocks.flatMap(block => {
    const out = []
    if (block.text && block.text.text) out.push(block.text.text)
    for (const element of block.elements || []) if (element.text) out.push(element.text)
    return out
  }).join('\n')
  t.true(payload.text.includes('Partial System Outage'))
  t.true(payload.text.includes('hace '))
  t.true(texts.includes('Bitbucket'))
  t.true(texts.includes('Pipelines'))
  t.true(texts.includes('Estamos investigando errores de Pipelines.'))
  t.true(texts.includes('https:\u200b//evil.example/path'))
  t.false(texts.includes('https://evil.example/path'))
  t.false(texts.includes('API'))
  t.is(payload.unfurl_links, false)
})

test.serial('bitbucket status entrega texto accesible junto a los bloques', async t => {
  const room = helper.createRoom({ httpd: false })
  bitbucketStatus(room.robot)
  const endpoint = 'https://bqlf8qjztdtr.statuspage.io/api/v2/summary.json'
  room.robot.http = httpStub({
    [endpoint]: reply({
      page: { url: 'https://bitbucket.status.atlassian.com/', updated_at: '2026-10-05T21:00:00.000Z' },
      status: { indicator: 'major', description: 'Partial System Outage' },
      components: [],
      incidents: []
    })
  })

  room.user.say('user', 'hubot bitbucket status')
  await sleep(30)

  t.true(room.messages[1][1].text.includes('Partial System Outage'))
  room.destroy()
})

test.serial('bitbucket status limita texto remoto para no generar bloques inválidos', async t => {
  const endpoint = 'https://bqlf8qjztdtr.statuspage.io/api/v2/summary.json'
  const longDescription = `Partial System Outage ${'x'.repeat(4000)}`
  const longUpdate = `Actualización ${'y'.repeat(4000)}`
  t.context.room.robot.http = httpStub({
    [endpoint]: reply({
      page: { url: 'https://bitbucket.status.atlassian.com/', updated_at: '2026-10-05T21:00:00.000Z' },
      status: { indicator: 'major', description: longDescription },
      components: [],
      incidents: [{ name: 'Pipelines incident', incident_updates: [{ body: longUpdate }] }]
    })
  })

  t.context.room.user.say('user', 'hubot bitbucket status')
  await sleep(30)

  const payload = t.context.room.messages[1][1]
  const sectionTexts = payload.blocks.filter(block => block.text && block.text.text).map(block => block.text.text)
  t.true(sectionTexts.every(text => text.length <= 3000))
  t.true(payload.text.includes('Partial System Outage'))
})

test.serial('bitbucket status rechaza schema remoto malformado', async t => {
  const endpoint = 'https://bqlf8qjztdtr.statuspage.io/api/v2/summary.json'
  t.context.room.robot.http = httpStub({
    [endpoint]: reply({
      page: { url: 'https://evil.example/phish' },
      status: { indicator: {}, description: 'Partial <@U123>' },
      components: {},
      incidents: {}
    })
  })

  t.context.room.user.say('user', 'hubot bitbucket status')
  await sleep(30)

  t.is(t.context.room.messages.length, 2)
  t.true(t.context.room.messages[1][1].includes('No pude interpretar el estado de Bitbucket.'))
})

test.serial('bitbucket status siempre usa la URL canónica configurada', t => {
  const canonical = 'https://bitbucket.status.atlassian.com/'
  for (const pageUrl of [canonical, `${canonical}incidents?phish=1`, 'https://evil.example/phish']) {
    const blocks = bitbucketStatus._test.buildBlocks({
      page: { url: pageUrl, updated_at: '2026-10-05T21:00:00.000Z' },
      status: { indicator: 'none', description: 'All Systems Operational' },
      components: [],
      incidents: []
    })
    t.is(blocks.find(block => block.type === 'actions').elements[0].url, canonical)
    t.true(blocks[1].text.text.includes(`<${canonical}|*Bitbucket*>`))
  }
})

test.serial('bitbucket status usa msg.send aunque exista un cliente Slack incompatible', async t => {
  const room = helper.createRoom({ httpd: false })
  const incompatibleWeb = { chat: { postMessage: () => { throw new Error('no debe invocarse') } } }
  bitbucketStatus(room.robot, incompatibleWeb)
  room.robot.http = httpStub({
    'https://bqlf8qjztdtr.statuspage.io/api/v2/summary.json': reply({
      page: { url: 'https://bitbucket.status.atlassian.com/', updated_at: '2026-10-05T21:00:00.000Z' },
      status: { indicator: 'major', description: 'Partial System Outage' },
      components: [],
      incidents: []
    })
  })

  room.user.say('user', 'hubot bitbucket status')
  await sleep(30)

  const payload = room.messages[1][1]
  t.true(payload.text.includes('Partial System Outage'))
  t.true(Array.isArray(payload.blocks))
  room.destroy()
})
