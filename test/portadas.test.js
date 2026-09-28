'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')

const helper = new Helper('../scripts/portadas.js')
const now = new Date()
now.setHours(now.getHours() - 4) // UTC to -04:00
const date = now.toISOString().replace(/(\d{2})(\d{2})-(\d+)-(\d+)T\d+:\d+:\d+.\d+Z/, '$4_$3_$2')
const img = `http://impresa.soy-chile.cl/HoyxHoy/210617/hoyxhoy/${date}_pag_03-550-afba7c.jpg`

// Portada de kiosko (mercurio) para los casos de redirect / status inesperado
const pad = numero => String(numero).padStart(2, '0')
const hoy = new Date()
const fechaKiosko = `${hoy.getFullYear()}/${pad(hoy.getMonth() + 1)}/${pad(hoy.getDate())}`
const mercurioPath = `/${fechaKiosko}/cl/cl_mercurio.750.jpg`
const mercurioRegex = /^\/\d{4}\/\d{2}\/\d{2}\/cl\/cl_mercurio\.750\.jpg$/
const respuestaError = 'No pude obtener la portada (error consultando el diario)'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

// Ningún test debe pegarle a la red real: todo pasa por nock
nock.disableNetConnect()

test.beforeEach(t => {
  nock('https://www.hoyxhoy.cl')
    .get('/endpoints/for-soy.php')
    .query({ action: 'get-latest', size: 550 })
    .reply(200, [{ img: img }])
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => {
  nock.cleanAll()
  return t.context.room.destroy()
})

test.cb.serial('Debe entregar la portada de la hoyxhoy', t => {
  t.context.room.user.say('user', 'hubot portada hoyxhoy')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot portada hoyxhoy'],
      ['hubot', 'Esta portada es del 21/06/2017'],
      ['hubot', img]
    ])
    t.end()
  }, 500)
})

test.cb.serial('Debe entregar la portada de la hoyxhoy incluso cuando se escribe en mayusculas', t => {
  t.context.room.user.say('user', 'hubot portada HoyxHoy')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot portada HoyxHoy'],
      ['hubot', 'Esta portada es del 21/06/2017'],
      ['hubot', img]
    ])
    t.end()
  }, 500)
})

// Regresión del loop infinito: un status distinto de 200/404 no debe martillar la misma url
test.serial('Un redirect 302 se sigue y se entrega la url final', async t => {
  nock('http://img.kiosko.net').get(mercurioPath).reply(302, '', { Location: `http://img7.kiosko.net${mercurioPath}` })
  nock('http://img7.kiosko.net').get(mercurioPath).reply(200, 'jpg', { 'Content-Type': 'image/jpeg' })

  t.context.room.user.say('user', 'hubot portada mercurio')
  await sleep(600)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada mercurio'],
    ['hubot', `http://img7.kiosko.net${mercurioPath}`]
  ])
})

test.serial('Con puros 500 recorre los días y avisa (6 intentos máximo, sin loop)', async t => {
  const scope = nock('http://img.kiosko.net').get(mercurioRegex).times(6).reply(500, 'boom')

  t.context.room.user.say('user', 'hubot portada mercurio')
  await sleep(800)

  t.true(scope.isDone(), 'debe intentar exactamente 6 urls: hoy + 5 días hacia atrás')
  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada mercurio'],
    ['hubot', 'No hay portada disponible']
  ])
})

test.serial('Un error de red responde al usuario y no cae el bot', async t => {
  nock('http://img.kiosko.net').persist().get(mercurioRegex).replyWithError('ECONNREFUSED')

  t.context.room.user.say('user', 'hubot portada mercurio')
  await sleep(400)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada mercurio'],
    ['hubot', respuestaError]
  ])
})

test.serial('Un timeout (HUBOT_PORTADAS_TIMEOUT_MS) responde al usuario', async t => {
  process.env.HUBOT_PORTADAS_TIMEOUT_MS = '200'
  nock('http://img.kiosko.net').persist().get(mercurioRegex).delayConnection(1500).reply(200, 'jpg')

  try {
    t.context.room.user.say('user', 'hubot portada mercurio')
    await sleep(700)

    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot portada mercurio'],
      ['hubot', respuestaError]
    ])
  } finally {
    delete process.env.HUBOT_PORTADAS_TIMEOUT_MS
  }
})

test.serial('Body no-JSON del endpoint de hoyxhoy responde error sin reventar', async t => {
  nock.cleanAll()
  nock('https://www.hoyxhoy.cl')
    .get('/endpoints/for-soy.php')
    .query({ action: 'get-latest', size: 550 })
    .reply(200, 'esto no es json')

  t.context.room.user.say('user', 'hubot portada hoyxhoy')
  await sleep(400)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada hoyxhoy'],
    ['hubot', respuestaError]
  ])
})

test.serial('Un diario desconocido responde sin consultar nada', async t => {
  t.context.room.user.say('user', 'hubot portada diarioinventado')
  await sleep(200)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada diarioinventado'],
    ['hubot', 'No conozco ese diario o revista :retard:']
  ])
})

// Un redirect que termina en una página web no es una portada: no se muestra
test.serial('Un redirect que termina en html hace probar el día anterior', async t => {
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)
  const ayerKiosko = `${ayer.getFullYear()}/${pad(ayer.getMonth() + 1)}/${pad(ayer.getDate())}`
  const ayerPath = `/${ayerKiosko}/cl/cl_mercurio.750.jpg`

  nock('http://img.kiosko.net').get(mercurioPath).reply(302, '', { Location: 'https://example.com/portada' })
  nock('https://example.com').get('/portada').reply(200, '<html>no soy una portada</html>', { 'Content-Type': 'text/html' })
  nock('http://img.kiosko.net').get(ayerPath).reply(200, 'jpg', { 'Content-Type': 'image/jpeg' })

  t.context.room.user.say('user', 'hubot portada mercurio')
  await sleep(600)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada mercurio'],
    ['hubot', 'Esta portada es de ayer'],
    ['hubot', `http://img.kiosko.net${ayerPath}`]
  ])
})

// Le Monde: la url vieja del journal électronique quedó muerta; la API Twipe
// del kiosque entrega el último número y su portada (Preview-MEDIUM)
test.serial('Le Monde consulta la API de Twipe y devuelve la portada del último número', async t => {
  nock('https://lmo-lmo-production-api.twipecloud.net')
    .get('/Data/DataService.svc/getcontentpackagelist/TWPLMOLMO/0/30')
    .reply(200, [
      { ContentPackageId: 5821, ContentPackageName: 'Le Monde - 29-09-2026', ThumbnailId: 402169, Status: 'OK' },
      { ContentPackageId: 5819, ContentPackageName: 'Le Monde - 28-09-2026', ThumbnailId: 402109, Status: 'OK' }
    ])

  t.context.room.user.say('user', 'hubot portada monde')
  await sleep(400)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada monde'],
    ['hubot', 'https://lmo-lmo-webreader-production.twipemobile.com/data/5821/covers/Preview-MEDIUM-402169.jpg']
  ])
})

// El País de Uruguay dejó de servir printed-home/portada_impresa.jpg (404);
// su portada vuelve vía kiosko
test.serial('El País de Uruguay se sirve desde kiosko', async t => {
  const uyPath = `/${fechaKiosko}/uy/uy_elpais.750.jpg`

  nock('http://img.kiosko.net').get(uyPath).reply(200, 'jpg', { 'Content-Type': 'image/jpeg' })

  t.context.room.user.say('user', 'hubot portada pais uruguay')
  await sleep(400)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada pais uruguay'],
    ['hubot', `http://img.kiosko.net${uyPath}`]
  ])
})

// El WSJ cambió de código en kiosko: eur/wsj ya no existe, us/wsj sí
test.serial('El WSJ se sirve desde us/wsj (código nuevo de kiosko)', async t => {
  const wsjPath = `/${fechaKiosko}/us/wsj.750.jpg`

  nock('http://img.kiosko.net').get(wsjPath).reply(200, 'jpg', { 'Content-Type': 'image/jpeg' })

  t.context.room.user.say('user', 'hubot portada wsj')
  await sleep(400)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada wsj'],
    ['hubot', `http://img.kiosko.net${wsjPath}`]
  ])
})

// La Segunda ya no está en kiosko: su portada se lee del reader digital de
// Emol (imagen pública en segreader.emol.cl)
test.serial('La Segunda: entrega la portada de la edición digital del día', async t => {
  const hoyISO = fechaKiosko.replace(/\//g, '-')
  const paginaId = 'A1B2C3D4'

  nock('https://digital.lasegunda.com')
    .get(`/${fechaKiosko}/A`)
    .reply(200, `<title>${hoyISO} | Homepage | Diario La Segunda</title><a href="/${fechaKiosko}/A/${paginaId}">Portada</a>`, { 'Content-Type': 'text/html' })

  t.context.room.user.say('user', 'hubot portada la segunda')
  await sleep(400)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada la segunda'],
    ['hubot', `https://segreader.emol.cl/${fechaKiosko}/content/pages/img/mid/${paginaId}.webp`]
  ])
})

test.serial('La Segunda: si el reader muestra una edición anterior, avisa y la entrega', async t => {
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)
  const ayerKiosko = `${ayer.getFullYear()}/${pad(ayer.getMonth() + 1)}/${pad(ayer.getDate())}`
  const ayerISO = ayerKiosko.replace(/\//g, '-')

  // día 0: el reader responde con la edición de ayer (hoy no hay edición)
  nock('https://digital.lasegunda.com').get(`/${fechaKiosko}/A`).reply(200, `<title>${ayerISO} | Homepage | Diario La Segunda</title>`)
  // día 1: el reader responde esa misma edición, que calza con la fecha pedida
  nock('https://digital.lasegunda.com').get(`/${ayerKiosko}/A`).reply(200, `<title>${ayerISO} | Homepage | Diario La Segunda</title><a href="/${ayerKiosko}/A/ZZ99999">x</a>`)

  t.context.room.user.say('user', 'hubot portada segunda')
  await sleep(600)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada segunda'],
    ['hubot', 'Esta portada es de ayer'],
    ['hubot', `https://segreader.emol.cl/${ayerKiosko}/content/pages/img/mid/ZZ99999.webp`]
  ])
})

// The Times: el código de kiosko murió; el ePaper PageSuite expone la lista
// pública de ediciones y la portada diaria vía get_image.aspx
test.serial('The Times: consulta PageSuite y entrega la portada del día', async t => {
  const [anio, mes, dia] = fechaKiosko.split('/')
  const hoyDDMM = `${dia}/${mes}/${anio}`

  nock('https://api.replica.pagesuite.com')
    .get('/publication/111e127c-8cff-40e5-a905-86951d4b0ea0/editions/list?maxnumber=30&month=')
    .reply(200, [
      { date: hoyDDMM, editionguid: 'eid-de-hoy', name: 'Monday' },
      { date: '01/01/2000', editionguid: 'eid-vieja', name: 'Old' }
    ], { 'Content-Type': 'application/json' })

  t.context.room.user.say('user', 'hubot portada times')
  await sleep(400)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada times'],
    ['hubot', 'https://edition.pagesuite-professional.co.uk/get_image.aspx?w=600&eid=eid-de-hoy']
  ])
})

// Diarios deprecados (sin edición impresa o fuera de kiosko): aviso explícito
test.serial('Un diario descontinuado responde con aviso (no "no conozco")', async t => {
  t.context.room.user.say('user', 'hubot portada globo')
  await sleep(200)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada globo'],
    ['hubot', 'Ese diario ya no está disponible: su edición impresa fue descontinuada o ya no se publica.']
  ])
})

// LUN: su impreso vive en images.lun.com (ruta con fecha en dos formatos; pag1 = portada)
test.serial('LUN: entrega la portada del impreso desde images.lun.com', async t => {
  const [anio, mes, dia] = fechaKiosko.split('/')
  const mesAbr = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][Number(mes) - 1]
  const lunPath = `/luncontents/NewsPaperPages/${anio}/${mesAbr}/${dia}/p_${anio}-${mes}-${dia}_pag1_550.jpg`

  nock('https://images.lun.com').get(lunPath).reply(200, 'jpg', { 'Content-Type': 'image/jpeg' })

  t.context.room.user.say('user', 'hubot portada lun')
  await sleep(400)

  t.deepEqual(t.context.room.messages, [
    ['user', 'hubot portada lun'],
    ['hubot', `https://images.lun.com${lunPath}`]
  ])
})
