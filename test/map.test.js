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
const WATERMARK = path.join(__dirname, 'fixtures', 'watermark.png')
const NOMINATIM = 'https://nominatim.openstreetmap.org'
const PHOTON = 'https://photon.komoot.io'
const TILES_FR = 'https://a.tile.openstreetmap.fr'
const TILES_OSM = 'https://tile.openstreetmap.org'
const TILES_DE = 'https://tile.openstreetmap.de'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const nominatimReply = body => nock(NOMINATIM).get('/search').query(true).reply(200, body)
const photonReply = body =>
  nock(PHOTON)
    .get('/api/')
    .query(query => !('lang' in query))
    .reply(200, body)

const tilesReply = (times, style = 'osmfr') =>
  nock(TILES_FR)
    .get(new RegExp(`^/${style}/\\d+/\\d+/\\d+\\.png$`))
    .times(times)
    .reply(200, TILE, { 'Content-Type': 'image/png' })

const addressResult = {
  lat: '-33.4220724',
  lon: '-70.6114271',
  display_name: 'La Resistencia Café, 2124, Avenida Providencia, Providencia, Chile',
  boundingbox: ['-33.4221224', '-33.4220224', '-70.6114771', '-70.6113771'],
  type: 'cafe'
}

const cityResult = {
  lat: '-33.4377',
  lon: '-70.6510',
  display_name: 'Santiago, Provincia de Santiago, Región Metropolitana, Chile',
  boundingbox: ['-33.5976995', '-33.2776995', '-70.8110671', '-70.4910671'],
  type: 'city'
}

const photonResult = {
  features: [
    {
      geometry: { coordinates: [-70.6114271, -33.4220724] },
      properties: {
        name: 'La Resistencia Café',
        city: 'Providencia',
        country: 'Chile',
        type: 'house',
        extent: [-70.6117, -33.4219, -70.6111, -33.4222]
      }
    }
  ]
}

const run = async (t, command) => {
  t.context.room.user.say('user', command)
  await sleep(600)
  const messages = t.context.room.messages
  return messages[messages.length - 1]
}

test.before(() => {
  nock.disableNetConnect()
  process.env.HUBOT_MAP_PUBLIC_URL = 'https://huemul.devschile.cl'
  process.env.HUBOT_MAP_TIMEOUT_MS = '3000'
  delete process.env.HUBOT_MAP_PROVIDER
})

test.beforeEach(t => {
  map.resetCaches()
  process.env.HUBOT_MAP_WATERMARK = WATERMARK
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => {
  t.context.room.destroy()
  nock.cleanAll()
  delete process.env.HUBOT_MAP_STADIA_KEY
  delete process.env.HUBOT_MAP_STADIA_STYLE
  delete process.env.HUBOT_MAP_GEOAPIFY_KEY
  delete process.env.HUBOT_MAP_GEOAPIFY_STYLE
  delete process.env.HUBOT_MAP_CITY_PROVIDER
  delete process.env.HUBOT_MAP_CITY_STYLE
  delete process.env.HUBOT_MAP_CITY_MAX_ZOOM
  delete process.env.HUBOT_MAP_WATERMARK
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
  t.true(attachment.title_link.includes('#map=17/-33.42207/-70.61143'))

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

test.serial('map - si fallan todos los tiles igual entrega el link', async t => {
  nominatimReply([addressResult])
  const failing = times => nock(TILES_FR).get(/\.png$/).times(times).reply(500, 'boom')
  failing(18)
  nock(TILES_OSM).get(/\.png$/).times(9).reply(500, 'boom')
  nock(TILES_DE).get(/\.png$/).times(9).reply(500, 'boom')

  const message = (await run(t, 'hubot map Av. Providencia 2124, Santiago'))[1]
  const [attachment] = message.attachments

  t.is(attachment.image_url, undefined)
  t.true(attachment.text.includes('No pude generar la imagen, pero el link funciona.'))
  t.true(attachment.title_link.includes('openstreetmap.org'))
})

test.serial('map - si osmfr falla usa el estilo HOT', async t => {
  nominatimReply([addressResult])
  nock(TILES_FR).get(/^\/osmfr\/\d+\/\d+\/\d+\.png$/).times(9).reply(500, 'boom')
  tilesReply(9, 'hot')

  const message = (await run(t, 'hubot map Av. Providencia 2124, Santiago'))[1]
  const [attachment] = message.attachments

  t.truthy(attachment.image_url)
  t.true(attachment.footer.includes('Humanitarian OSM Team'))
})

test.serial('map - ciudades usan menos zoom que direcciones', async t => {
  nominatimReply([cityResult])
  tilesReply(9)

  const message = (await run(t, 'hubot map Santiago, Chile'))[1]

  t.true(message.attachments[0].title_link.includes('#map=10/-33.43770/-70.65100'))
})

test.serial('map - acota el zoom cuando el bbox viene gigante', async t => {
  nominatimReply([
    {
      lat: '-33.0458',
      lon: '-71.6197',
      display_name: 'Valparaíso, Provincia de Valparaíso, Región de Valparaíso, Chile',
      boundingbox: ['-33.2129142', '-26.2733307', '-80.1215134', '-71.3830930'],
      type: 'administrative',
      addresstype: 'city'
    }
  ])
  tilesReply(9)

  const message = (await run(t, 'hubot map Valparaíso, Chile'))[1]

  t.true(message.attachments[0].title_link.includes('#map=10/-33.04580/-71.61970'))
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

test.serial('map - usa Stadia si hay key y no filtra la key', async t => {
  process.env.HUBOT_MAP_STADIA_KEY = 'clave-de-prueba'
  nominatimReply([addressResult])
  nock('https://tiles.stadiamaps.com')
    .get('/static/outdoors.png')
    .query(query => query.zoom === '17' && query.size === '600x400@2x')
    .reply(200, TILE, { 'Content-Type': 'image/png' })

  const message = (await run(t, 'hubot map Av. Providencia 2124, Santiago, Chile'))[1]
  const [attachment] = message.attachments

  t.is(attachment.footer, '© Stadia Maps · © OpenStreetMap contributors')
  t.true(Buffer.isBuffer(map.readImage(attachment.image_url.match(/map\/([a-f0-9]{16})\.png/)[1])))
  t.false(JSON.stringify(message).includes('clave-de-prueba'))
  t.true(nock.isDone())
})

test.serial('map - si Stadia falla entrega el link igual', async t => {
  process.env.HUBOT_MAP_STADIA_KEY = 'clave-de-prueba'
  nominatimReply([addressResult])
  nock('https://tiles.stadiamaps.com')
    .get('/static/outdoors.png')
    .query(true)
    .reply(401, { error: 'invalid key' }, { 'Content-Type': 'application/json' })

  const message = (await run(t, 'hubot map Av. Providencia 2124, Santiago, Chile'))[1]
  const [attachment] = message.attachments

  t.falsy(attachment.image_url)
  t.true(attachment.text.includes('No pude generar la imagen'))
  t.true(attachment.title_link.includes('openstreetmap.org'))
})

test.serial('map - usa Geoapify si hay key', async t => {
  process.env.HUBOT_MAP_GEOAPIFY_KEY = 'geo-clave'
  nominatimReply([cityResult])
  nock('https://api.geoapify.com')
    .get('/v1/staticmap')
    .query(query => query.style === 'osm-bright' && query.center === 'lonlat:-70.651,-33.4377')
    .reply(200, TILE, { 'Content-Type': 'image/png' })

  const message = (await run(t, 'hubot map Santiago, Chile'))[1]
  const [attachment] = message.attachments

  t.true(attachment.footer.startsWith('© Geoapify'))
  t.truthy(attachment.image_url)
  t.false(JSON.stringify(message).includes('geo-clave'))
})

test.serial('map - combina Stadia en direcciones y Geoapify en ciudad', async t => {
  process.env.HUBOT_MAP_STADIA_KEY = 'stadia-test'
  process.env.HUBOT_MAP_GEOAPIFY_KEY = 'geo-test'
  process.env.HUBOT_MAP_CITY_PROVIDER = 'geoapify'
  process.env.HUBOT_MAP_CITY_STYLE = 'klokantech-basic'

  nominatimReply([cityResult])
  nock('https://api.geoapify.com')
    .get('/v1/staticmap')
    .query(query => query.style === 'klokantech-basic')
    .reply(200, TILE, { 'Content-Type': 'image/png' })

  const city = (await run(t, 'hubot map Santiago, Chile'))[1]
  t.true(city.attachments[0].footer.startsWith('© Geoapify'))

  nominatimReply([addressResult])
  nock('https://tiles.stadiamaps.com')
    .get('/static/outdoors.png')
    .query(true)
    .reply(200, TILE, { 'Content-Type': 'image/png' })

  const dir = (await run(t, 'hubot map Av. Providencia 2124, Santiago'))[1]
  t.true(dir.attachments[0].footer.startsWith('© Stadia Maps'))
})

test.serial('map - sin key del proveedor de ciudad usa el default', async t => {
  process.env.HUBOT_MAP_STADIA_KEY = 'stadia-test'
  delete process.env.HUBOT_MAP_GEOAPIFY_KEY
  process.env.HUBOT_MAP_CITY_PROVIDER = 'geoapify'
  process.env.HUBOT_MAP_CITY_STYLE = 'klokantech-basic'

  nominatimReply([cityResult])
  nock('https://tiles.stadiamaps.com')
    .get('/static/outdoors.png')
    .query(true)
    .reply(200, TILE, { 'Content-Type': 'image/png' })

  const city = (await run(t, 'hubot map Santiago, Chile'))[1]
  t.true(city.attachments[0].footer.startsWith('© Stadia Maps'))
})

test.serial('map - pinta la marca de agua del huemul', async t => {
  process.env.HUBOT_MAP_STADIA_KEY = 'stadia-test'
  nominatimReply([addressResult])
  nock('https://tiles.stadiamaps.com')
    .get('/static/outdoors.png')
    .query(true)
    .reply(200, TILE, { 'Content-Type': 'image/png' })

  const message = (await run(t, 'hubot map Av. Providencia 2124, Santiago'))[1]
  const id = message.attachments[0].image_url.match(/map\/([a-f0-9]{16})\.png/)[1]
  const img = UPNG.decode(map.readImage(id))
  const rgba = new Uint8Array(UPNG.toRGBA8(img)[0])

  let reddish = 0
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i] > 150 && rgba[i + 1] < 110 && rgba[i + 2] < 110) reddish++
  }

  t.true(reddish > 100, `píxeles de la marca: ${reddish}`)
})

test.serial('map - HUBOT_MAP_WATERMARK=off no pinta nada', async t => {
  process.env.HUBOT_MAP_WATERMARK = 'off'
  process.env.HUBOT_MAP_STADIA_KEY = 'stadia-test'
  nominatimReply([addressResult])
  nock('https://tiles.stadiamaps.com')
    .get('/static/outdoors.png')
    .query(true)
    .reply(200, TILE, { 'Content-Type': 'image/png' })

  const message = (await run(t, 'hubot map Av. Providencia 2124, Santiago'))[1]
  const id = message.attachments[0].image_url.match(/map\/([a-f0-9]{16})\.png/)[1]

  t.deepEqual(map.readImage(id), TILE)
})

test('map - zoom según bounding box', t => {
  t.is(map.zoomToFit(['-33.4221224', '-33.4220224', '-70.6114771', '-70.6113771']), 17)
  t.is(map.zoomToFit(['-33.5976995', '-33.2776995', '-70.8110671', '-70.4910671']), 10)
  t.is(map.zoomToFit(['-17.5', '-17.4', '-70.3', '-70.2']) > 10, true)
  t.is(map.zoomToFit(['-56.0', '-17.0', '-110.0', '-66.0']) < 7, true)
  t.is(map.zoomToFit(null), null)
  t.is(map.zoomToFit(['0', '0', '0', '0']), null)
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
