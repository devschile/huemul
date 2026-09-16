'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')

// Token de mentira antes de cargar el script: el WebClient por defecto se
// construye al importar el módulo (en cada test se inyecta un cliente falso).
process.env.HUBOT_SLACK_TOKEN = process.env.HUBOT_SLACK_TOKEN || 'test-token'

const pegasScript = require('../scripts/pegas.js')
const { _test } = pegasScript
const net = require('net')

// No cargamos el script vía Helper: se importa a mano para inyectarle el
// cliente Slack falso (segundo argumento del módulo).
const helper = new Helper([])

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const fakeWeb = () => {
  const sent = []
  const deleted = []
  return {
    sent,
    deleted,
    chat: {
      postMessage: async (payload) => {
        sent.push(payload)
        const ts = String(sent.length)
        return { ok: true, channel: payload.channel, ts, message: { ts } }
      },
      delete: async ({ ts }) => {
        deleted.push(ts)
        return { ok: true }
      }
    }
  }
}

// Stub encadenable de robot.http (header/query/timeout/get) que despacha por
// host. Expone las URLs pedidas (.calls) y los timeouts aplicados (.timeouts).
const httpStub = (handlers) => {
  const calls = []
  const timeouts = []
  const factory = (url) => {
    calls.push(url)
    const host = Object.keys(handlers).find((h) => url.startsWith(h))
    const handler = handlers[host] || ((cb) => cb(new Error(`URL no mockeada: ${url}`)))
    const client = {
      header: () => client,
      query: () => client,
      timeout: (ms) => {
        timeouts.push(ms)
        return client
      },
      get: () => (cb) => handler(cb)
    }
    return client
  }
  factory.calls = calls
  factory.timeouts = timeouts
  return factory
}

const reply = (statusCode, body) => (cb) => cb(null, { statusCode }, JSON.stringify(body))
const networkError = (message) => (cb) => cb(new Error(message))

const gobJob = (title, url, extra = {}) => ({
  type: 'job',
  attributes: {
    applications_count: 3,
    company: { data: { attributes: { name: extra.company || 'ACME', logo: 'https://static.devschile.cl/logo.png' } } },
    min_salary: extra.minSalary === undefined ? 1000 : extra.minSalary,
    max_salary: extra.maxSalary === undefined ? 2000 : extra.maxSalary,
    perks: extra.perks || ['remote_work'],
    remote_modality: extra.remoteModality || 'fully_remote',
    remote_zone: null,
    title
  },
  links: { public_url: url }
})

const gobPayload = (jobs) => ({ data: jobs })

const sitePega = (overrides = {}) => Object.assign({
  id: 1,
  url: 'https://pegas.devschile.cl/pega/1',
  titulo: 'Backend Engineer',
  empleador: 'Fintech SpA',
  descripcion: 'pega de prueba',
  categoria: 'Backend',
  ubicacion: 'Santiago',
  sueldo: null,
  tags: null,
  fecha_publicacion: '2026-09-15',
  fuente: 'linkedin',
  fecha_creacion: '2026-09-15T12:00:00.000Z',
  likes: 0,
  dislikes: 0,
  guardados: 0
}, overrides)

const sitePayload = (pegas, total) => ({
  total: total === undefined ? pegas.length : total,
  pagina: 1,
  porPagina: 50,
  pegas
})

// Textos de todos los blocks de un payload (section.text, context.elements y header)
const textsOf = (payload) => {
  const out = []
  for (const b of payload.blocks || []) {
    if (b.text && typeof b.text === 'object' && typeof b.text.text === 'string') out.push(b.text.text)
    else if (typeof b.text === 'string') out.push(b.text)
    if (Array.isArray(b.elements)) {
      for (const el of b.elements) {
        if (el && typeof el.text === 'string') out.push(el.text)
        else if (el && el.text && typeof el.text.text === 'string') out.push(el.text.text)
      }
    }
  }
  return out
}

const lastPayload = (t) => t.context.web.sent[t.context.web.sent.length - 1]

const GOB_HAPPY = 'https://www.getonbrd.com'
const SITE_HAPPY = 'https://pegas.devschile.cl'

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
  t.context.web = fakeWeb()
  pegasScript(t.context.room.robot, t.context.web)
})

test.afterEach(t => {
  t.context.room.destroy()
})

test.serial('pegas <término>: flujo GetOnBrd de siempre con contador --gold al final', async t => {
  const jobs = [
    gobJob('Dev React', 'https://www.getonbrd.com/jobs/dev-react-acme'),
    gobJob('Dev Frontend', 'https://www.getonbrd.com/jobs/dev-frontend-acme'),
    gobJob('Dev JS', 'https://www.getonbrd.com/jobs/dev-js-acme')
  ]
  const stub = httpStub({
    [GOB_HAPPY]: reply(200, gobPayload(jobs)),
    // total 4: una fila repetida (con www y slash final, a propósito) y 3 nuevas
    [SITE_HAPPY]: reply(200, sitePayload([
      sitePega({ id: 10, url: 'https://www.GetOnBrd.com/jobs/dev-react-acme/', fuente: 'getonbrd' }),
      sitePega({ id: 11, url: 'https://www.linkedin.com/jobs/view/111' }),
      sitePega({ id: 12, url: 'https://himalayas.app/jobs/222' })
    ], 4))
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot pegas fintech')
  await sleep(500)

  const web = t.context.web
  t.is(web.sent.length, 2)
  t.is(web.sent[0].text, 'Buscando en GetOnBrd... :dev:')

  const payload = lastPayload(t)
  const texts = textsOf(payload)
  t.true(texts.some(s => s.includes("*Mostrando 3 trabajos para 'fintech' en <https://www.getonbrd.com/jobs-fintech|getonbrd>*")))
  t.true(texts.some(s => s === 'Hay 3 pegas más usando el flag --gold'))
  t.is(payload.unfurl_links, undefined)
  t.is(payload.text, '*GetOnBrd*')

  t.is(stub.calls.length, 2)
  t.true(stub.calls[0].startsWith('https://www.getonbrd.com/api/v0/search/jobs?query=fintech'))
  t.is(stub.calls[1], 'https://pegas.devschile.cl/api/pegas?q=fintech&porPagina=50')
  t.deepEqual(web.deleted, ['1'])
})

test.serial('pegas <término> tldr: 10 resultados condensados y contador', async t => {
  const jobs = []
  for (let i = 1; i <= 10; i++) jobs.push(gobJob(`Dev ${i}`, `https://www.getonbrd.com/jobs/dev-${i}`))
  const stub = httpStub({
    [GOB_HAPPY]: reply(200, gobPayload(jobs)),
    [SITE_HAPPY]: reply(200, sitePayload([], 0))
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot pegas tldr fintech')
  await sleep(500)

  const payload = lastPayload(t)
  t.true(stub.calls[0].includes('per_page=10'))
  t.is(payload.blocks.length, 12) // apertura + 10 condensados + pie
  // El link del pie se arma con el término tal cual se escribió (tldr incluido):
  // comportamiento heredado del flujo original, no se toca.
  t.true(textsOf(payload).some(s => s.includes('Para ver más resultados, visita <https://www.getonbrd.com/jobs-tldr%20fintech|GetOnBrd - fintech>')))
})

test.serial('pegas <término>: sin pegas extra en el sitio mantiene el pie de GetOnBrd', async t => {
  const stub = httpStub({
    [GOB_HAPPY]: reply(200, gobPayload([gobJob('Dev React', 'https://www.getonbrd.com/jobs/dev-react')])),
    [SITE_HAPPY]: reply(200, sitePayload([], 0))
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot pegas fintech')
  await sleep(400)

  t.true(textsOf(lastPayload(t)).some(s => s.includes('Para ver más resultados, visita <https://www.getonbrd.com/jobs-fintech|GetOnBrd - fintech>')))
})

test.serial('pegas <término>: si el sitio falla, mantiene el pie de GetOnBrd', async t => {
  const stub = httpStub({
    [GOB_HAPPY]: reply(200, gobPayload([gobJob('Dev React', 'https://www.getonbrd.com/jobs/dev-react')])),
    [SITE_HAPPY]: networkError('sitio caído')
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot pegas fintech')
  await sleep(400)

  const web = t.context.web
  t.is(web.sent.length, 2)
  t.true(textsOf(lastPayload(t)).some(s => s.includes('Para ver más resultados, visita <https://www.getonbrd.com/jobs-fintech|GetOnBrd - fintech>')))
  t.deepEqual(web.deleted, ['1'])
})

test.serial('pegas <término>: sin resultados en GetOnBrd pero con pegas en el sitio, ofrece --gold', async t => {
  const stub = httpStub({
    [GOB_HAPPY]: reply(200, { data: [] }),
    [SITE_HAPPY]: reply(200, sitePayload([
      sitePega({ id: 21, titulo: 'Backend Fintech', url: 'https://www.linkedin.com/jobs/view/21' }),
      sitePega({ id: 22, titulo: 'Data Engineer', url: 'https://himalayas.app/jobs/22' })
    ], 2))
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot pegas fintech')
  await sleep(400)

  const texts = textsOf(lastPayload(t))
  t.true(texts.some(s => s.includes("No hay trabajos encontrados en <https://www.getonbrd.com|GetOnBrd> para 'fintech'")))
  t.true(texts.some(s => s.includes('Hay 2 pegas más en <https://pegas.devschile.cl/?q=fintech|pegas.devschile.cl> usando el flag --gold')))
})

test.serial('pegas --gold <término>: top 3 de pegas.devschile.cl con link a ver todos', async t => {
  const pegas = [
    sitePega({ id: 1, titulo: 'Backend Fintech', url: 'https://www.linkedin.com/jobs/view/1', sueldo: 'CLP 3.000.000', fuente: 'linkedin' }),
    sitePega({ id: 2, titulo: 'Data Engineer', url: 'https://himalayas.app/jobs/2', empleador: 'DataCo', ubicacion: 'Remoto', fuente: 'himalayas' }),
    sitePega({ id: 3, titulo: 'SRE', url: 'https://jobicy.com/jobs/3', empleador: 'CloudCo', ubicacion: 'Chile', categoria: 'DevOps', fuente: 'jobicy' })
  ]
  const stub = httpStub({
    [SITE_HAPPY]: reply(200, sitePayload(pegas, 42))
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot pegas --gold fintech')
  await sleep(500)

  const web = t.context.web
  t.is(web.sent.length, 2)
  t.is(web.sent[0].text, 'Buscando en pegas.devschile.cl... :dev:')

  const payload = lastPayload(t)
  const texts = textsOf(payload)
  t.true(texts.some(s => s.includes("*Mostrando 3 trabajos para 'fintech' en <https://pegas.devschile.cl/?q=fintech|pegas.devschile.cl>*")))
  t.true(texts.some(s => s.includes('<https://www.linkedin.com/jobs/view/1|Backend Fintech>') && s.includes('Fintech SpA') && s.includes('CLP 3.000.000') && s.includes('linkedin')))
  t.true(texts.some(s => s.includes('DataCo') && s.includes('himalayas')))
  t.true(texts.some(s => s.includes('Para ver todos en <https://pegas.devschile.cl/?q=fintech|pegas.devschile.cl/?q=fintech>')))
  t.is(payload.unfurl_links, false)
  t.is(payload.unfurl_media, false)
  t.is(payload.text, '*pegas.devschile.cl*')

  t.deepEqual(stub.calls, ['https://pegas.devschile.cl/api/pegas?q=fintech&porPagina=3'])
  t.deepEqual(web.deleted, ['1'])
})

test.serial('pegas <término> --gold (flag al final) también responde con la vitrina', async t => {
  const stub = httpStub({
    [SITE_HAPPY]: reply(200, sitePayload([sitePega({ id: 1, titulo: 'Backend Fintech', url: 'https://www.linkedin.com/jobs/view/1' })], 1))
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot pegas fintech --gold')
  await sleep(400)

  t.true(stub.calls[0].startsWith('https://pegas.devschile.cl/api/pegas?q=fintech'))
  t.true(textsOf(lastPayload(t)).some(s => s.includes('en <https://pegas.devschile.cl/?q=fintech|pegas.devschile.cl>*')))
})

test.serial('pegas --gold sin término pide un término (sin mensaje de carga)', async t => {
  const stub = httpStub({})
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot pegas --gold')
  await sleep(300)

  t.is(t.context.web.sent.length, 1)
  t.true(textsOf(t.context.web.sent[0]).some(s => s.includes('¿Qué buscas?')))
  t.is(stub.calls.length, 0)
})

test.serial('pegas --gold sin resultados avisa que no hay pegas', async t => {
  const stub = httpStub({
    [SITE_HAPPY]: reply(200, sitePayload([], 0))
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot pegas --gold fintech')
  await sleep(400)

  const texts = textsOf(lastPayload(t))
  t.true(texts.some(s => s.includes("No hay trabajos encontrados en <https://pegas.devschile.cl|pegas.devschile.cl> para 'fintech'")))
})

test.serial('pegas --gold con error del sitio avisa al usuario', async t => {
  const stub = httpStub({
    [SITE_HAPPY]: networkError('sitio caído')
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot pegas --gold fintech')
  await sleep(400)

  const web = t.context.web
  t.is(web.sent.length, 2)
  t.true(textsOf(lastPayload(t)).some(s => s.includes("Ups! No se pudo consultar pegas.devschile.cl para 'fintech'")))
  t.deepEqual(web.deleted, ['1'])
})

test.serial('pegas ayuda incluye el flag --gold', async t => {
  t.context.room.user.say('user', 'hubot pegas ayuda')
  await sleep(300)

  t.is(t.context.web.sent.length, 1)
  t.true(textsOf(t.context.web.sent[0]).some(s => s.includes('--gold')))
})

test.serial('pegas: error de GetOnBrd se emite como error de robot y no responde', async t => {
  t.context.room.robot.on('error', (err, ctx) => {
    t.context.robotError = { err, ctx }
  })
  const stub = httpStub({
    [GOB_HAPPY]: networkError('se cayó getonbrd')
  })
  t.context.room.robot.http = stub

  t.context.room.user.say('user', 'hubot pegas fintech')
  await sleep(400)

  t.truthy(t.context.robotError)
  t.is(t.context.robotError.ctx, 'pegas')
  t.is(t.context.web.sent.length, 1)
  t.deepEqual(t.context.web.deleted, ['1'])
})

test.serial('HUBOT_PEGAS_TIMEOUT_MS configura el timeout de las requests', async t => {
  process.env.HUBOT_PEGAS_TIMEOUT_MS = '1234'
  try {
    const stub = httpStub({
      [GOB_HAPPY]: reply(200, gobPayload([gobJob('Dev React', 'https://www.getonbrd.com/jobs/dev-react')])),
      [SITE_HAPPY]: reply(200, sitePayload([], 0))
    })
    t.context.room.robot.http = stub

    t.context.room.user.say('user', 'hubot pegas fintech')
    await sleep(400)

    t.deepEqual(stub.timeouts, [1234, 1234])
  } finally {
    delete process.env.HUBOT_PEGAS_TIMEOUT_MS
  }
})

test('sube el presupuesto de Happy Eyeballs de Node (lección clima.js)', t => {
  t.true(net.getDefaultAutoSelectFamilyAttemptTimeout() >= 2000)
})

test('extractSearchFlags: detecta --gold en cualquier posición sin tocar el término', t => {
  t.deepEqual(_test.extractSearchFlags('fintech'), { term: 'fintech', gold: false })
  t.deepEqual(_test.extractSearchFlags('fintech --gold'), { term: 'fintech', gold: true })
  t.deepEqual(_test.extractSearchFlags('--gold fintech'), { term: 'fintech', gold: true })
  t.deepEqual(_test.extractSearchFlags('--gold'), { term: '', gold: true })
  t.deepEqual(_test.extractSearchFlags('fintech tldr --gold'), { term: 'fintech tldr', gold: true })
  t.deepEqual(_test.extractSearchFlags('trabajo --golden'), { term: 'trabajo --golden', gold: false })
  t.deepEqual(_test.extractSearchFlags('--gold frontend senior'), { term: 'frontend senior', gold: true })
})

test('normalizeUrl: compara URLs entre fuentes', t => {
  t.is(_test.normalizeUrl('https://WWW.GetOnBrd.com/jobs/x/'), _test.normalizeUrl('http://getonbrd.com/jobs/x'))
  t.is(_test.normalizeUrl(undefined), '')
})

test('countSiteExtras: total del sitio menos las ya mostradas', t => {
  const payload = sitePayload([
    sitePega({ url: 'https://www.getonbrd.com/jobs/dev-react/' }),
    sitePega({ url: 'https://linkedin.com/jobs/1' }),
    sitePega({ url: 'https://linkedin.com/jobs/2' })
  ], 10)
  t.is(_test.countSiteExtras(payload, ['https://www.getonbrd.com/jobs/dev-react']), 9)
  t.is(_test.countSiteExtras(payload, []), 10)
  t.is(_test.countSiteExtras({ total: 0, pegas: [] }, []), 0)
  t.is(_test.countSiteExtras(null, []), 0)
})

test('parseSitePayload: tolera payloads sin pegas', t => {
  t.deepEqual(_test.parseSitePayload('{"total":2,"pegas":[{"url":"x"}]}'), { total: 2, pegas: [{ url: 'x' }] })
  t.deepEqual(_test.parseSitePayload('{"foo":1}'), { total: 0, pegas: [] })
})

test('buildGoldBlocks: encabezado, pegas y link a ver todos', t => {
  const blocks = _test.buildGoldBlocks([
    sitePega({ sueldo: null }),
    sitePega({ id: 2, url: 'https://jobicy.com/jobs/2', sueldo: 'USD 3.6K' }),
    sitePega({ id: 3, url: 'https://jobicy.com/jobs/3' })
  ], 'fintech')
  t.is(blocks.length, 5)
  const texts = blocks.map(b => (b.text ? b.text.text : b.elements[0].text))
  t.true(texts[0].includes("Mostrando 3 trabajos para 'fintech'"))
  t.false(texts[1].includes(' ·  · '))
  t.true(texts[2].includes('USD 3.6K'))
  t.true(texts[4].includes('Para ver todos en'))
})

test('buildGoldBlocks: sin resultados devuelve un solo bloque', t => {
  const blocks = _test.buildGoldBlocks([], 'fintech')
  t.is(blocks.length, 1)
  t.true(blocks[0].text.text.includes('No hay trabajos encontrados'))
})
