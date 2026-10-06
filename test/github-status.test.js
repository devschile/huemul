'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')

const githubStatus = require('../scripts/github-status.js')
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
  githubStatus(t.context.room.robot)
})

test.afterEach(t => {
  t.context.room.destroy()
})

test.serial('github status usa incidentes v2 y entrega la última actualización activa', async t => {
  const endpoint = 'https://www.githubstatus.com/api/v2/incidents.json'
  const stub = httpStub({
    [endpoint]: reply({
      incidents: [{
        name: 'Incident with Actions',
        status: 'investigating',
        incident_updates: [{
          status: 'investigating',
          body: 'Estamos mitigando demoras en los runners.',
          created_at: '2026-10-05T21:00:00.000Z'
        }]
      }]
    })
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot github status')
  await sleep(30)

  t.deepEqual(stub.calls, [endpoint])
  t.true(t.context.room.messages[1][1].includes('Incident with Actions'))
  t.true(t.context.room.messages[1][1].includes('Estamos mitigando demoras en los runners.'))
})

test.serial('github status muestra la actualización más reciente aunque el incidente esté resuelto', async t => {
  const endpoint = 'https://www.githubstatus.com/api/v2/incidents.json'
  t.context.room.robot.http = httpStub({
    [endpoint]: reply({
      incidents: [
        {
          name: 'Incidente antiguo',
          status: 'monitoring',
          incident_updates: [{ status: 'monitoring', body: 'Actualización antigua', created_at: '2026-10-05T20:00:00.000Z' }]
        },
        {
          name: 'Incidente resuelto',
          status: 'resolved',
          incident_updates: [{ status: 'resolved', body: 'Actualización final', created_at: '2026-10-05T22:00:00.000Z' }]
        }
      ]
    })
  })

  t.context.room.user.say('user', 'hubot github status')
  await sleep(30)

  const message = t.context.room.messages[1][1]
  t.true(message.includes('Incidente resuelto'))
  t.true(message.includes('Actualización final'))
  t.false(message.includes('Actualización antigua'))
})

test.serial('github status resume usa estado v2 y su descripción', async t => {
  const endpoint = 'https://www.githubstatus.com/api/v2/status.json'
  const stub = httpStub({
    [endpoint]: reply({
      page: { updated_at: '2026-10-05T21:00:00.000Z' },
      status: { indicator: 'minor', description: 'Partial System Degradation' }
    })
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot github status resume')
  await sleep(30)

  t.deepEqual(stub.calls, [endpoint])
  t.true(t.context.room.messages[1][1].includes('Partial System Degradation'))
  t.true(t.context.room.messages[1][1].includes('minor'))
})

test.serial('github status all usa historial v2 y lista actualizaciones recientes', async t => {
  const endpoint = 'https://www.githubstatus.com/api/v2/incidents.json'
  const stub = httpStub({
    [endpoint]: reply({
      incidents: [{
        name: 'Incident one',
        status: 'monitoring',
        incident_updates: [
          { status: 'monitoring', body: 'Primer update', created_at: '2026-10-05T21:00:00.000Z' },
          { status: 'investigating', body: 'Segundo update', created_at: '2026-10-05T20:00:00.000Z' }
        ]
      }]
    })
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot github status all')
  await sleep(30)

  t.deepEqual(stub.calls, [endpoint])
  t.true(t.context.room.messages[1][1].includes('Primer update'))
  t.true(t.context.room.messages[1][1].includes('Segundo update'))
})

test.serial('github status conserva porcentajes literales en actualizaciones v2', async t => {
  const endpoint = 'https://www.githubstatus.com/api/v2/incidents.json'
  const stub = httpStub({
    [endpoint]: reply({
      incidents: [{
        name: 'Incident with Actions',
        status: 'monitoring',
        incident_updates: [{
          status: 'monitoring',
          body: 'Capacidad recuperada al 50%',
          created_at: '2026-10-05T21:00:00.000Z'
        }]
      }]
    })
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot github status')
  await sleep(30)

  t.true(t.context.room.messages[1][1].includes('Capacidad recuperada al 50%'))
})

test.serial('github status escapa markup remoto y limita mensajes extensos', async t => {
  const endpoint = 'https://www.githubstatus.com/api/v2/incidents.json'
  t.context.room.robot.http = httpStub({
    [endpoint]: reply({
      incidents: [{
        name: '<https://evil.example|Incidente falso>',
        status: '<@U123>',
        incident_updates: [{
          status: 'investigating',
          body: `<@U456> visita https://evil.example/path ${'x'.repeat(5000)}`,
          created_at: '2026-10-05T21:00:00.000Z'
        }]
      }]
    })
  })

  t.context.room.user.say('user', 'hubot github status')
  await sleep(30)

  const message = t.context.room.messages[1][1]
  t.true(message.includes('&lt;https:\u200b//evil.example|Incidente falso&gt;'))
  t.true(message.includes('&lt;@U456&gt;'))
  t.false(message.includes('<@U456>'))
  t.true(message.includes('https:\u200b//evil.example/path'))
  t.false(message.includes('https://evil.example'))
  t.true(message.length <= 3500)
})

test.serial('github status no reporta operativo ante incidentes v2 malformados', async t => {
  const endpoint = 'https://www.githubstatus.com/api/v2/incidents.json'
  t.context.room.robot.http = httpStub({ [endpoint]: reply({ incidents: {} }) })

  t.context.room.user.say('user', 'hubot github status')
  await sleep(30)

  const message = t.context.room.messages[1][1]
  t.true(message.includes('No pude interpretar el estado de GitHub.'))
  t.false(message.includes('Sin incidentes activos'))
})

test.serial('github status all contiene incident_updates malformados sin lanzar', async t => {
  const endpoint = 'https://www.githubstatus.com/api/v2/incidents.json'
  t.context.room.robot.http = httpStub({
    [endpoint]: reply({ incidents: [{ name: 'Actions', incident_updates: {} }] })
  })

  t.context.room.user.say('user', 'hubot github status all')
  await sleep(30)

  t.true(t.context.room.messages[1][1].includes('No pude interpretar el estado de GitHub.'))
})

test.serial('github status rechaza entradas no-objeto en incidentes', async t => {
  const unresolved = 'https://www.githubstatus.com/api/v2/incidents.json'
  t.context.room.robot.http = httpStub({ [unresolved]: reply({ incidents: [null] }) })
  t.context.room.user.say('user', 'hubot github status')
  await sleep(30)
  t.true(t.context.room.messages[1][1].includes('No pude interpretar el estado de GitHub.'))
})

test.serial('github status rechaza campos de incidente o actualización incompletos', async t => {
  const unresolved = 'https://www.githubstatus.com/api/v2/incidents.json'
  t.context.room.robot.http = httpStub({
    [unresolved]: reply({
      incidents: [{
        name: 'Actions',
        status: 'investigating',
        incident_updates: [{
          body: 'Investigando',
          created_at: 'fecha-inválida'
        }]
      }]
    })
  })
  t.context.room.user.say('user', 'hubot github status')
  await sleep(30)
  t.true(t.context.room.messages[1][1].includes('No pude interpretar el estado de GitHub.'))
})

test.serial('github status all rechaza actualizaciones no-objeto', async t => {
  const history = 'https://www.githubstatus.com/api/v2/incidents.json'
  t.context.room.robot.http = httpStub({
    [history]: reply({ incidents: [{ name: 'Actions', incident_updates: [null] }] })
  })
  t.context.room.user.say('user', 'hubot github status all')
  await sleep(30)
  t.true(t.context.room.messages[1][1].includes('No pude interpretar el estado de GitHub.'))
})

test.serial('github status resume responde ante un payload v2 incompleto', async t => {
  const endpoint = 'https://www.githubstatus.com/api/v2/status.json'
  t.context.room.robot.http = httpStub({ [endpoint]: reply({}) })

  t.context.room.user.say('user', 'hubot github status resume')
  await sleep(30)

  t.true(t.context.room.messages[1][1].includes('No pude interpretar el estado de GitHub.'))
})
