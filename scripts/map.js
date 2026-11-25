// Description:
//   Huemul devuelve un mapa de un lugar usando OpenStreetMap (sin API keys)
//
// Dependencies:
//   node-fetch
//   upng-js
//
// Configuration:
//   HUBOT_MAP_PUBLIC_URL - URL pública con que se sirve la imagen (default: https://huemul.devschile.cl)
//   HUBOT_MAP_TIMEOUT_MS - Timeout de cada request en ms (default: 8000)
//
// Commands:
//   hubot map <lugar> - Devuelve un mapa según lugar entregado
//
// Notes:
//   Geocoding: Nominatim, con Photon como respaldo. Tiles: OpenStreetMap.
//   Atribución obligatoria: © OpenStreetMap contributors
//
// Author:
//   @jorgeepunan

const crypto = require('crypto')
const fetch = require('node-fetch')
const querystring = require('querystring')
const UPNG = require('upng-js')

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const PHOTON_URL = 'https://photon.komoot.io/api/'
const TILE_URL = 'https://tile.openstreetmap.org'
const USER_AGENT = 'HuemulBot/2.0 (+https://devschile.cl; huemul@devschile.cl)'
const ATTRIBUTION = '© OpenStreetMap contributors'
const DEFAULT_PUBLIC_URL = 'https://huemul.devschile.cl'

const TILE_SIZE = 256
const TILES_PER_SIDE = 3
const MAP_WIDTH = 600
const MAP_HEIGHT = 400
const MARKER_RADIUS = 7
const MAX_ADDRESS_LENGTH = 200

const TILE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const TILE_CACHE_MAX = 600
const GEO_TTL_MS = 10 * 60 * 1000
const GEO_CACHE_MAX = 100
const IMAGE_TTL_MS = 30 * 60 * 1000
const IMAGE_CACHE_MAX = 100

const CITY_TYPES = new Set([
  'city',
  'town',
  'village',
  'hamlet',
  'municipality',
  'county',
  'state',
  'region',
  'country',
  'administrative'
])

const tileCache = new Map()
const geoCache = new Map()
const images = new Map()

const timeoutMs = () => Number(process.env.HUBOT_MAP_TIMEOUT_MS) || 8000

const publicUrl = () =>
  (process.env.HUBOT_MAP_PUBLIC_URL || DEFAULT_PUBLIC_URL).replace(/\/+$/, '')

const readCache = (cache, key, ttl) => {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > ttl) {
    cache.delete(key)
    return null
  }
  return hit.value
}

const writeCache = (cache, key, value, max) => {
  cache.set(key, { value, at: Date.now() })
  while (cache.size > max) cache.delete(cache.keys().next().value)
}

class MapLookupError extends Error {
  constructor (kind, detail) {
    super(`${kind}: ${detail}`)
    this.kind = kind
    this.detail = detail
  }
}

const getJson = async url => {
  let response
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      timeout: timeoutMs()
    })
  } catch (err) {
    if (err.type === 'request-timeout') throw new MapLookupError('timeout', err.type)
    throw new MapLookupError('network', err.message)
  }

  if (response.status === 429) throw new MapLookupError('rate-limit', 'HTTP 429')
  if (!response.ok) throw new MapLookupError('status', `HTTP ${response.status}`)

  try {
    return await response.json()
  } catch (err) {
    throw new MapLookupError('parse', err.message)
  }
}

const getTile = async (zoom, x, y) => {
  const key = `${zoom}/${x}/${y}`
  const cached = readCache(tileCache, key, TILE_TTL_MS)
  if (cached) return cached

  const response = await fetch(`${TILE_URL}/${zoom}/${x}/${y}.png`, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: timeoutMs()
  })

  if (!response.ok) throw new MapLookupError('status', `HTTP ${response.status}`)

  const png = await response.buffer()
  writeCache(tileCache, key, png, TILE_CACHE_MAX)
  return png
}

const lonToTile = (lon, zoom) => ((lon + 180) / 360) * Math.pow(2, zoom)

const latToTile = (lat, zoom) => {
  const rad = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom)
}

const osmLink = (lat, lon, zoom) =>
  `https://www.openstreetmap.org/?${querystring.stringify({
    mlat: lat.toFixed(5),
    mlon: lon.toFixed(5)
  })}#map=${zoom}/${lat.toFixed(5)}/${lon.toFixed(5)}`

const drawMarker = (rgba, width, height, cx, cy) => {
  for (let dy = -MARKER_RADIUS - 2; dy <= MARKER_RADIUS + 2; dy++) {
    for (let dx = -MARKER_RADIUS - 2; dx <= MARKER_RADIUS + 2; dx++) {
      const x = cx + dx
      const y = cy + dy
      if (x < 0 || y < 0 || x >= width || y >= height) continue

      const distance = Math.sqrt(dx * dx + dy * dy)
      const offset = (y * width + x) * 4
      if (distance <= MARKER_RADIUS) {
        rgba[offset] = 217
        rgba[offset + 1] = 48
        rgba[offset + 2] = 37
        rgba[offset + 3] = 255
      } else if (distance <= MARKER_RADIUS + 2) {
        rgba[offset] = 255
        rgba[offset + 1] = 255
        rgba[offset + 2] = 255
        rgba[offset + 3] = 255
      }
    }
  }
}

const buildMapImage = async (lat, lon, zoom) => {
  const worldX = lonToTile(lon, zoom)
  const worldY = latToTile(lat, zoom)
  const centerX = Math.floor(worldX)
  const centerY = Math.floor(worldY)
  const maxTile = Math.pow(2, zoom) - 1

  const side = TILES_PER_SIDE * TILE_SIZE
  const canvas = new Uint8Array(side * side * 4)
  const offsets = Array.from({ length: TILES_PER_SIDE }, (_, i) => i - 1)

  const tiles = await Promise.all(
    offsets.map(async dy => {
      return Promise.all(
        offsets.map(async dx => {
          const tileX = ((centerX + dx) % (maxTile + 1) + maxTile + 1) % (maxTile + 1)
          const tileY = Math.min(Math.max(centerY + dy, 0), maxTile)
          try {
            const png = await getTile(zoom, tileX, tileY)
            return { dx, dy, rgba: new Uint8Array(UPNG.toRGBA8(UPNG.decode(png))[0]) }
          } catch (err) {
            if (dx === 0 && dy === 0) throw err
            return { dx, dy, rgba: null }
          }
        })
      )
    })
  )

  tiles.flat().forEach(({ dx, dy, rgba }) => {
    if (!rgba) return
    const originX = (dx + 1) * TILE_SIZE
    const originY = (dy + 1) * TILE_SIZE
    for (let y = 0; y < TILE_SIZE; y++) {
      const from = y * TILE_SIZE * 4
      const to = ((originY + y) * side + originX) * 4
      canvas.set(rgba.subarray(from, from + TILE_SIZE * 4), to)
    }
  })

  const pixelX = TILE_SIZE + Math.floor((worldX - centerX) * TILE_SIZE)
  const pixelY = TILE_SIZE + Math.floor((worldY - centerY) * TILE_SIZE)
  const cropX = Math.min(Math.max(pixelX - Math.floor(MAP_WIDTH / 2), 0), side - MAP_WIDTH)
  const cropY = Math.min(Math.max(pixelY - Math.floor(MAP_HEIGHT / 2), 0), side - MAP_HEIGHT)

  const output = new Uint8Array(MAP_WIDTH * MAP_HEIGHT * 4)
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const from = ((cropY + y) * side + cropX) * 4
    output.set(canvas.subarray(from, from + MAP_WIDTH * 4), y * MAP_WIDTH * 4)
  }

  drawMarker(output, MAP_WIDTH, MAP_HEIGHT, pixelX - cropX, pixelY - cropY)

  return Buffer.from(UPNG.encode([output.buffer], MAP_WIDTH, MAP_HEIGHT, 0))
}

const storeImage = png => {
  const id = crypto.randomBytes(8).toString('hex')
  writeCache(images, id, png, IMAGE_CACHE_MAX)
  return id
}

const readImage = id => readCache(images, id, IMAGE_TTL_MS)

const resetCaches = () => {
  tileCache.clear()
  geoCache.clear()
  images.clear()
}

const zoomForType = type => (CITY_TYPES.has(type) ? 12 : 16)

const fromNominatim = async address => {
  const query = querystring.stringify({
    q: address,
    format: 'jsonv2',
    limit: 1,
    addressdetails: 1,
    'accept-language': 'es'
  })
  const results = await getJson(`${NOMINATIM_URL}?${query}`)
  if (!Array.isArray(results) || results.length === 0) return null

  const [result] = results
  const lat = Number(result.lat)
  const lon = Number(result.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  return {
    lat,
    lon,
    label: result.display_name || address,
    zoom: zoomForType(result.type)
  }
}

const fromPhoton = async address => {
  const query = querystring.stringify({ q: address, limit: 1 })
  const body = await getJson(`${PHOTON_URL}?${query}`)
  const features = body && Array.isArray(body.features) ? body.features : []
  if (features.length === 0) return null

  const [feature] = features
  const coordinates = feature.geometry && feature.geometry.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null

  const lon = Number(coordinates[0])
  const lat = Number(coordinates[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  const properties = feature.properties || {}
  const label =
    [properties.name, properties.city, properties.country].filter(Boolean).join(', ') || address

  return {
    lat,
    lon,
    label,
    zoom: zoomForType(properties.type)
  }
}

const geocode = async address => {
  const cached = readCache(geoCache, address.toLowerCase(), GEO_TTL_MS)
  if (cached) return cached

  let failure = null
  for (const resolver of [fromNominatim, fromPhoton]) {
    try {
      const result = await resolver(address)
      if (result) {
        writeCache(geoCache, address.toLowerCase(), result, GEO_CACHE_MAX)
        return result
      }
    } catch (err) {
      failure = failure || err
    }
  }

  if (failure) throw failure
  return null
}

const errorText = error => {
  switch (error.kind) {
    case 'timeout':
      return 'El buscador de mapas no respondió a tiempo. Intenta de nuevo.'
    case 'rate-limit':
      return 'El buscador de mapas (Nominatim) me está limitando por uso (HTTP 429). Prueba en un minuto.'
    case 'status':
      return `El buscador de mapas respondió ${error.detail}. Intenta de nuevo.`
    case 'parse':
      return 'El buscador de mapas devolvió una respuesta inválida.'
    case 'network':
      return 'No pude conectar con el buscador de mapas.'
    default:
      return 'No pude obtener el mapa.'
  }
}

const cleanAddress = text =>
  text
    .replace(/\*Sent using\*.*$/i, '')
    .replace(/<@[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ADDRESS_LENGTH)

const truncate = (text, max = 90) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

module.exports = robot => {
  if (robot.router && typeof robot.router.get === 'function') {
    robot.router.get('/map/:id.png', (req, res) => {
      const png = readImage(req.params.id)
      if (!png) return res.status(404).type('text/plain').send('not found')

      res.set('Content-Type', 'image/png')
      res.set('Cache-Control', 'public, max-age=1800')
      res.send(png)
    })
  }

  robot.respond(/map (.+)/i, async msg => {
    const address = cleanAddress(msg.match[1])

    if (!address) {
      return msg.reply('dime un lugar: `map <lugar>`')
    }

    let place
    try {
      place = await geocode(address)
    } catch (err) {
      robot.logger.error(`map: geocode ${err.kind || 'unknown'} ${err.detail || err.message}`)
      return msg.reply(errorText(err))
    }

    if (!place) {
      return msg.reply(`No encontré *${address}*. Prueba con "lugar, ciudad, país".`)
    }

    const link = osmLink(place.lat, place.lon, place.zoom)
    const label = truncate(place.label)
    const attachment = {
      fallback: `Mapa de ${label}: ${link}`,
      color: 'good',
      title: label,
      title_link: link,
      text: `:world_map: <${link}|Ver en OpenStreetMap> (${place.lat.toFixed(5)}, ${place.lon.toFixed(5)})`,
      footer: ATTRIBUTION
    }

    try {
      const png = await buildMapImage(place.lat, place.lon, place.zoom)
      attachment.image_url = `${publicUrl()}/map/${storeImage(png)}.png`
    } catch (err) {
      robot.logger.error(`map: tiles ${err.kind || 'unknown'} ${err.detail || err.message}`)
      attachment.text = `${attachment.text}\nNo pude generar la imagen, pero el link funciona.`
    }

    msg.send({
      text: `Mapa de ${label}: ${link}`,
      attachments: [attachment],
      unfurl_links: false,
      unfurl_media: false
    })
  })
}

module.exports.cleanAddress = cleanAddress
module.exports.osmLink = osmLink
module.exports.readImage = readImage
module.exports.resetCaches = resetCaches
