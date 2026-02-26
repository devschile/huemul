require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')

const helper = new Helper('../scripts/yodev.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => t.context.room.destroy())

test('yodev debe retornar resultados con una query válida', async t => {
  nock('https://yodev.dev')
    .get('/api/jobs')
    .query({ query: 'javascript', country: 'chile' })
    .reply(200, {
      jobs: [
        {
          title: 'Desarrollador JavaScript',
          company: 'Tech Company',
          location: 'Santiago, Chile',
          url: 'https://example.com/job1',
          posted: '2025-12-14',
          salary: '$2.000.000 - $3.000.000',
          type: 'Full-time',
          source: 'LinkedIn'
        },
        {
          title: 'Frontend Developer',
          company: 'Another Company',
          location: 'Valparaíso, Chile',
          url: 'https://example.com/job2',
          posted: '2025-12-13'
        }
      ],
      total_jobs: 2,
      view_more_url: 'https://yodev.dev/search?q=javascript'
    })

  t.context.room.user.say('user', 'hubot yodev javascript')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  t.deepEqual(user, ['user', 'hubot yodev javascript'])
  t.deepEqual(hubotMessage1, ['hubot', '🔎 Buscando *javascript*... explorando oportunidades en yodev.dev 🚀 💼'])
  t.true(hubotMessage2[1].includes('✅ Encontré 2 resultado(s) en yodev.dev:'))
  t.true(hubotMessage2[1].includes('Desarrollador JavaScript'))
  t.true(hubotMessage2[1].includes('Frontend Developer'))
  t.true(hubotMessage2[1].includes('🔍 ¿Quieres ver más ofertas?'))
})

test('yodev debe retornar mensaje cuando no hay resultados', async t => {
  nock('https://yodev.dev')
    .get('/api/jobs')
    .query({ query: 'cobol', country: 'chile' })
    .reply(200, {
      jobs: [],
      total_jobs: 0
    })

  t.context.room.user.say('user', 'hubot yodev cobol')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  t.deepEqual(user, ['user', 'hubot yodev cobol'])
  t.deepEqual(hubotMessage1, ['hubot', '🔎 Buscando *cobol*... explorando oportunidades en yodev.dev 🚀 💼'])
  t.true(hubotMessage2[1].includes('404') || hubotMessage2[1].includes('Cero resultados') || hubotMessage2[1].includes('Nada por aquí') || hubotMessage2[1].includes('Encontré exactamente 0'))
})

test('yodev debe manejar errores de la API', async t => {
  nock('https://yodev.dev')
    .get('/api/jobs')
    .query({ query: 'python', country: 'chile' })
    .reply(500, 'Internal Server Error')

  t.context.room.user.say('user', 'hubot yodev python')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  t.deepEqual(user, ['user', 'hubot yodev python'])
  t.deepEqual(hubotMessage1, ['hubot', '🔎 Buscando *python*... explorando oportunidades en yodev.dev 🚀 💼'])
  t.deepEqual(hubotMessage2, ['hubot', 'Ups! Ocurrió un error al procesar las ofertas de trabajo de yodev.dev. 😱'])
})
