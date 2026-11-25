require('coffeescript/register')
const fs = require('fs')
const path = require('path')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')
const UPNG = require('upng-js')

const map = require('../scripts/map.js')
const helper = new Helper('../scripts/map.js')

const TILE = fs.readFileSync(path.join(__dirname, 'fixtures', 'tile-blank.png'))
const NOMINATIM = 'https://nominatim.openstreetmap.org'
const PHOTON = 'https://photon.komoot.io'
const TILES = 'https://tile.openstreetmap.org'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const nominatimReply = body => nock(NOMINATIM).get('/search').query(true).reply(200, body)
const photonReply = body =>
  nock(PHOTON)
    .get('/api/')
    .query(query => !('lang' in query))
    .reply(200, body)
const tilesReply = times =>
  nock(TILES).get(/^\/\d+\/\d+\/\d+\.png$/).times(times).reply(200, TILE, {
    'Content-Type': 'image/png'
  })

const addressResult = {
  lat: '-33.4220724',
  lon: '-70.6114271',
  display_name: 'La Resistencia Café, 2124, Avenida Providencia, Providencia, Chile',
  type: 'cafe'
}

const photonResult = {
  features: [
    {
      geometry: { coordinates: [-70.6114271, -33.4220724] },
      properties: { name: 'La Resistencia Café', city: 'Providencia', country: 'Chile', type: 'house' }
    }
  ]
}

const run = async (t, command) => {
  t.context.room.user.say('user', command)
  await sleep(500)
  return t.context.room.messages[1]
}

test.before(() => {
  nock.disableNetConnect()
  process.env.HUBOT_MAP_PUBLIC_URL = 'https://huemul.devschile.cl'
  process.env.HUBOT_MAP_TIMEOUT_MS = '3000'
})

test.beforeEach(t => {
  map.resetCaches()
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => {
  t.context.room.destroy()
  nock.cleanAll()
})

test.after(() => nock.enableNetConnect())

test.serial('map - geocodifica y devuelve mapa con pin', async t => {
  nominatimReply([addressResult])
  tilesReply(9)

  const reply = await run(t, 'hubot map Av. Providencia 2124, Santiago, Chile')

  t.is(reply[0], 'hubot')
  const message = reply[1]
  const [attachment] = message.attachments

  t.true(message.text.includes('openstreetmap.org'))
  t.false(message.unfurl_links)
  t.false(message.unfurl_media)
  t.true(attachment.title.startsWith('La Resistencia Café'))
  t.is(attachment.footer, '© OpenStreetMap contributors')
  t.true(attachment.title_link.includes('mlat=-33.42207'))
  t.true(attachment.title_link.includes('#map=16/-33.42207/-70.61143'))

  const match = attachment.image_url.match(
    /^https:\/\/huemul\.devschile\.cl\/map\/([a-f0-9]{16})\.png$/
  )
  t.truthy(match, `image_url inesperada: ${attachment.image_url}`)

  const png = map.readImage(match[1])
  t.true(Buffer.isBuffer(png))
  t.is(png.slice(0, 8).toString('hex'), '89504e470d0a1a0a')

  const image = UPNG.decode(png)
  t.is(image.width, 600)
  t.is(image.height, 400)

  const rgba = new Uint8Array(UPNG.toRGBA8(image)[0])
  const center = (200 * 600 + 300) * 4
  t.deepEqual(
    [rgba[center], rgba[center + 1], rgba[center + 2], rgba[center + 3]],
    [217, 48, 37, 255]
  )

  t.true(nock.isDone())
})

test.serial('map - usa Photon cuando Nominatim no encuentra nada', async t => {
  nominatimReply([])
  photonReply(photonResult)
  tilesReply(9)

  const message = (await run(t, 'hubot map Providencia 2124'))[1]
  const [attachment] = message.attachments

  t.is(attachment.title, 'La Resistencia Café, Providencia, Chile')
  t.true(attachment.image_url.startsWith('https://huemul.devschile.cl/map/'))
  t.true(nock.isDone())
})

test.serial('map - sin resultados en ningún geocodificador', async t => {
  nominatimReply([])
  photonReply({ features: [] })

  const reply = await run(t, 'hubot map xyzzy inexistente')

  t.is(reply[1], '@user No encontré *xyzzy inexistente*. Prueba con "lugar, ciudad, país".')
})

test.serial('map - Nominatim 429 se informa como límite de uso', async t => {
  nock(NOMINATIM).get('/search').query(true).reply(429, 'Too Many Requests')
  photonReply({ features: [] })

  const reply = await run(t, 'hubot map Santiago, Chile')

  t.true(reply[1].includes('limitando por uso (HTTP 429)'))
})

test.serial('map - error HTTP del geocodificador', async t => {
  nock(NOMINATIM).get('/search').query(true).reply(500, 'boom')
  nock(PHOTON).get('/api/').query(true).reply(503, 'boom')

  const reply = await run(t, 'hubot map Santiago, Chile')

  t.true(reply[1].includes('respondió HTTP 500'))
})

test.serial('map - JSON inválido no rompe el handler', async t => {
  nock(NOMINATIM).get('/search').query(true).reply(200, '<html>error</html>')
  nock(PHOTON).get('/api/').query(true).reply(200, '<html>error</html>')

  const reply = await run(t, 'hubot map Santiago, Chile')

  t.true(reply[1].includes('respuesta inválida'))
})

test.serial('map - timeout del geocodificador', async t => {
  process.env.HUBOT_MAP_TIMEOUT_MS = '150'
  nock(NOMINATIM).get('/search').query(true).delayConnection(1000).reply(200, [])
  nock(PHOTON).get('/api/').query(true).delayConnection(1000).reply(200, { features: [] })

  const reply = await run(t, 'hubot map Santiago, Chile')

  t.true(reply[1].includes('no respondió a tiempo'))
  process.env.HUBOT_MAP_TIMEOUT_MS = '3000'
})

test.serial('map - error de red del geocodificador', async t => {
  nock(NOMINATIM).get('/search').query(true).replyWithError('ECONNREFUSED')
  nock(PHOTON).get('/api/').query(true).replyWithError('ECONNREFUSED')

  const reply = await run(t, 'hubot map Santiago, Chile')

  t.true(reply[1].includes('No pude conectar con el buscador de mapas'))
})

test.serial('map - si fallan los tiles igual entrega el link', async t => {
  nominatimReply([addressResult])
  nock(TILES).get(/^\/\d+\/\d+\/\d+\.png$/).times(9).reply(500, 'boom')

  const message = (await run(t, 'hubot map Av. Providencia 2124, Santiago'))[1]
  const [attachment] = message.attachments

  t.is(attachment.image_url, undefined)
  t.true(attachment.text.includes('No pude generar la imagen, pero el link funciona.'))
  t.true(attachment.title_link.includes('openstreetmap.org'))
})

test.serial('map - ciudades usan menos zoom que direcciones', async t => {
  nominatimReply([
    {
      lat: '-33.4489',
      lon: '-70.6693',
      display_name: 'Santiago, Región Metropolitana, Chile',
      type: 'city'
    }
  ])
  tilesReply(9)

  const message = (await run(t, 'hubot map Santiago, Chile'))[1]

  t.true(message.attachments[0].title_link.includes('#map=12/-33.44890/-70.66930'))
})

test.serial('map - cachea geocoding y tiles entre consultas iguales', async t => {
  nominatimReply([addressResult])
  tilesReply(9)

  const first = (await run(t, 'hubot map Av. Providencia 2124, Santiago'))[1]
  const second = (await run(t, 'hubot map Av. Providencia 2124, Santiago'))[1]

  t.truthy(first.attachments[0].image_url)
  t.truthy(second.attachments[0].image_url)
  t.true(nock.isDone())
})

test('map - limpia el texto del comando', t => {
  t.is(
    map.cleanAddress('  Av.  Providencia 2124  *Sent using* <@U09ALB0M5MZ|NotPudu> '),
    'Av. Providencia 2124'
  )
  t.is(map.cleanAddress('<@U123> Plaza Italia'), 'Plaza Italia')
})

test('map - no usa APIs de Google', t => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'map.js'), 'utf8')
  t.false(/googleapis|google\.com\/maps/i.test(source))
})
