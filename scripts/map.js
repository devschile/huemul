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
//   HUBOT_MAP_PROVIDER   - Estilo de tiles: osmfr, hot, osm, osmde (default: osmfr)
//   HUBOT_MAP_STADIA_KEY - API key de Stadia Maps. Si está definida se usa su
//                          Static Maps API (una sola imagen) en vez de coser tiles.
//   HUBOT_MAP_STADIA_STYLE - Estilo de Stadia: outdoors, alidade_smooth,
//                            stamen_terrain, etc. (default: outdoors)
//   HUBOT_MAP_GEOAPIFY_KEY - API key de Geoapify (alternativa a Stadia).
//   HUBOT_MAP_GEOAPIFY_STYLE - Estilo de Geoapify: osm-bright, osm-carto,
//                              positron (default: osm-bright)
//   HUBOT_MAP_CITY_PROVIDER - stadia|geoapify. Proveedor para vistas lejanas
//                             (zoom <= HUBOT_MAP_CITY_MAX_ZOOM, default 13).
//   HUBOT_MAP_CITY_STYLE    - Estilo para esas vistas lejanas, p. ej.
//                             klokantech-basic o alidade_smooth.
//   HUBOT_MAP_WATERMARK     - PNG de la marca de agua (default:
//                             public/images/huemul-watermark.png). "off" la desactiva.
//
// Commands:
//   hubot map <lugar> - Devuelve un mapa según lugar entregado
//
// Notes:
//   Geocoding: Nominatim, con Photon como respaldo. Tiles: OpenStreetMap.
//   El zoom se calcula con el bounding box del resultado: una dirección queda
//   a zoom 17 y una ciudad a zoom ~11.
//   Atribución obligatoria: © OpenStreetMap contributors
//
// Author:
//   @jorgeepunan

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const querystring = require('querystring')
const UPNG = require('upng-js')

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const PHOTON_URL = 'https://photon.komoot.io/api/'
const USER_AGENT = 'HuemulBot/2.0 (+https://devschile.cl; huemul@devschile.cl)'
const ATTRIBUTION = '© OpenStreetMap contributors'
const STADIA_ATTRIBUTION = '© Stadia Maps · © OpenStreetMap contributors'
const GEOAPIFY_ATTRIBUTION = '© Geoapify · © OpenMapTiles · © OpenStreetMap contributors'
const STADIA_STATIC_URL = 'https://tiles.stadiamaps.com/static'
const GEOAPIFY_STATIC_URL = 'https://api.geoapify.com/v1/staticmap'
const DEFAULT_PUBLIC_URL = 'https://huemul.devschile.cl'

const TILE_SIZE = 256
const TILES_PER_SIDE = 3
const MAP_WIDTH = 600
const MAP_HEIGHT = 400
const MAX_ADDRESS_LENGTH = 200
const MIN_ZOOM = 3
const MAX_ZOOM = 17

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

const TILE_PROVIDERS = [
  {
    id: 'osmfr',
    url: (z, x, y) => `https://a.tile.openstreetmap.fr/osmfr/${z}/${x}/${y}.png`,
    attribution: ATTRIBUTION
  },
  {
    id: 'hot',
    url: (z, x, y) => `https://a.tile.openstreetmap.fr/hot/${z}/${x}/${y}.png`,
    attribution: `${ATTRIBUTION} · Humanitarian OSM Team`
  },
  {
    id: 'osm',
    url: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
    attribution: ATTRIBUTION
  },
  {
    id: 'osmde',
    url: (z, x, y) => `https://tile.openstreetmap.de/${z}/${x}/${y}.png`,
    attribution: ATTRIBUTION
  }
]

const tileCache = new Map()
const geoCache = new Map()
const images = new Map()

const timeoutMs = () => Number(process.env.HUBOT_MAP_TIMEOUT_MS) || 8000

const publicUrl = () =>
  (process.env.HUBOT_MAP_PUBLIC_URL || DEFAULT_PUBLIC_URL).replace(/\/+$/, '')

const providerOrder = () => {
  const preferred = TILE_PROVIDERS.find(provider => provider.id === process.env.HUBOT_MAP_PROVIDER)
  if (!preferred) return TILE_PROVIDERS
  return [preferred, ...TILE_PROVIDERS.filter(provider => provider.id !== preferred.id)]
}

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

const getTile = async (provider, zoom, x, y) => {
  const key = `${provider.id}/${zoom}/${x}/${y}`
  const cached = readCache(tileCache, key, TILE_TTL_MS)
  if (cached) return cached

  const response = await fetch(provider.url(zoom, x, y), {
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

const PIN_HEIGHT = 42
const PIN_FILL = [234, 67, 53]
const PIN_EDGE = [166, 38, 30]
const PIN_HOLE = [255, 255, 255]

// Pin clásico tipo mapa: cabeza redonda, cuerpo que se afina y punta exacta
// sobre la coordenada. Se dibuja con supersampling para que el borde no quede
// escalonado y funciona igual a escala 1 (tiles) o 2 (imágenes @2x).
const drawPin = (rgba, width, height, cx, cy, scale = 1) => {
  const total = PIN_HEIGHT * scale
  const radius = total * 0.33
  const tipY = cy
  const headY = cy - total + radius
  const edge = Math.max(1, 1.6 * scale)
  const hole = radius * 0.42
  const samples = 3

  const inside = (x, y, shrink) => {
    const r = radius - shrink
    if (r <= 0) return false
    // la punta se extiende 1 px bajo la coordenada para que el vértice pinte
    const tip = tipY + 1 - shrink
    if (y > tip || y < headY - r) return false

    const dy = y - headY
    const half = dy <= 0
      ? Math.sqrt(Math.max(0, r * r - dy * dy))
      : Math.max(0.6, r * Math.pow(Math.max(0, 1 - dy / (tip - headY)), 0.85))

    return Math.abs(x - cx) <= half
  }

  const coverage = (x, y, shrink) => {
    let hits = 0
    for (let sy = 0; sy < samples; sy++) {
      for (let sx = 0; sx < samples; sx++) {
        if (inside(x + (sx + 0.5) / samples, y + (sy + 0.5) / samples, shrink)) hits++
      }
    }
    return hits / (samples * samples)
  }

  const holeCoverage = (x, y) => {
    let hits = 0
    for (let sy = 0; sy < samples; sy++) {
      for (let sx = 0; sx < samples; sx++) {
        const dx = x + (sx + 0.5) / samples - cx
        const dy = y + (sy + 0.5) / samples - headY
        if (dx * dx + dy * dy <= hole * hole) hits++
      }
    }
    return hits / (samples * samples)
  }

  const top = Math.max(0, Math.floor(headY - radius - edge - 1))
  const bottom = Math.min(height - 1, Math.ceil(tipY + 2))
  const left = Math.max(0, Math.floor(cx - radius - edge - 1))
  const right = Math.min(width - 1, Math.ceil(cx + radius + edge + 1))

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const outer = coverage(x, y, 0)
      if (outer <= 0.01) continue

      const offset = (y * width + x) * 4
      blendPixel(rgba, offset, PIN_EDGE[0], PIN_EDGE[1], PIN_EDGE[2], Math.round(255 * outer))

      const inner = coverage(x, y, edge)
      if (inner > 0.01) {
        blendPixel(rgba, offset, PIN_FILL[0], PIN_FILL[1], PIN_FILL[2], Math.round(255 * inner))
      }

      const white = holeCoverage(x, y)
      if (white > 0.01) {
        blendPixel(rgba, offset, PIN_HOLE[0], PIN_HOLE[1], PIN_HOLE[2], Math.round(255 * white))
      }
    }
  }
}

const applyPin = png => {
  const img = UPNG.decode(png)
  const rgba = new Uint8Array(UPNG.toRGBA8(img)[0])
  drawPin(rgba, img.width, img.height, img.width / 2, img.height / 2, img.width / MAP_WIDTH)
  return Buffer.from(UPNG.encode([rgba.buffer], img.width, img.height, 0))
}

const composeMap = async (provider, lat, lon, zoom) => {
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
            const png = await getTile(provider, zoom, tileX, tileY)
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

  drawPin(output, MAP_WIDTH, MAP_HEIGHT, pixelX - cropX, pixelY - cropY)

  return {
    png: Buffer.from(UPNG.encode([output.buffer], MAP_WIDTH, MAP_HEIGHT, 0)),
    attribution: provider.attribution,
    provider: provider.id
  }
}

const stadiaKey = () => (process.env.HUBOT_MAP_STADIA_KEY || '').trim()
const stadiaStyle = () => (process.env.HUBOT_MAP_STADIA_STYLE || 'outdoors').trim()
const geoapifyKey = () => (process.env.HUBOT_MAP_GEOAPIFY_KEY || '').trim()
const geoapifyStyle = () => (process.env.HUBOT_MAP_GEOAPIFY_STYLE || 'osm-bright').trim()

// Estilo distinto para vistas lejanas (ciudad/región). Ejemplo:
// HUBOT_MAP_CITY_PROVIDER=geoapify y HUBOT_MAP_CITY_STYLE=klokantech-basic
// usan Stadia outdoors para direcciones y Geoapify klokantech-basic para ciudad.
const cityProvider = () => (process.env.HUBOT_MAP_CITY_PROVIDER || '').trim().toLowerCase()
const cityStyle = () => (process.env.HUBOT_MAP_CITY_STYLE || '').trim()
const cityMaxZoom = () => Number(process.env.HUBOT_MAP_CITY_MAX_ZOOM) || 13

const fetchImage = async url => {
  let response
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: timeoutMs()
    })
  } catch (err) {
    if (err.type === 'request-timeout') throw new MapLookupError('timeout', err.type)
    throw new MapLookupError('network', err.message)
  }

  if (response.status === 429) throw new MapLookupError('rate-limit', 'HTTP 429')
  if (!response.ok) throw new MapLookupError('status', `HTTP ${response.status}`)

  const type = response.headers.get('content-type') || ''
  if (!type.startsWith('image/')) throw new MapLookupError('parse', `content-type ${type}`)

  return response.buffer()
}

const buildStadiaImage = async (lat, lon, zoom, style = stadiaStyle()) => {
  const query = [
    `center=${lat},${lon}`,
    `zoom=${Math.min(zoom, MAX_ZOOM)}`,
    `size=${MAP_WIDTH}x${MAP_HEIGHT}@2x`,
    `api_key=${encodeURIComponent(stadiaKey())}`
  ].join('&')
  const url = `${STADIA_STATIC_URL}/${encodeURIComponent(style)}.png?${query}`

  return {
    png: applyPin(await fetchImage(url)),
    attribution: STADIA_ATTRIBUTION,
    provider: `stadia:${stadiaStyle()}`
  }
}

const buildGeoapifyImage = async (lat, lon, zoom, style = geoapifyStyle()) => {
  const query = [
    `style=${encodeURIComponent(style)}`,
    `width=${MAP_WIDTH}`,
    `height=${MAP_HEIGHT}`,
    'format=png',
    'scaleFactor=2',
    `center=lonlat:${lon},${lat}`,
    `zoom=${Math.min(zoom, MAX_ZOOM)}`,
    `apiKey=${encodeURIComponent(geoapifyKey())}`
  ].join('&')

  return {
    png: applyPin(await fetchImage(`${GEOAPIFY_STATIC_URL}?${query}`)),
    attribution: GEOAPIFY_ATTRIBUTION,
    provider: `geoapify:${style}`
  }
}

const WATERMARK_DEFAULT = 'public/images/huemul-watermark.png'
const WATERMARK_HEIGHT = 64

let watermarkCache = null

const loadWatermark = () => {
  if (watermarkCache !== null) return watermarkCache

  const file = (process.env.HUBOT_MAP_WATERMARK || WATERMARK_DEFAULT).trim()
  if (!file || file.toLowerCase() === 'off') {
    watermarkCache = false
    return watermarkCache
  }

  try {
    const full = path.isAbsolute(file) ? file : path.join(__dirname, '..', file)
    const img = UPNG.decode(fs.readFileSync(full))
    const [frame] = UPNG.toRGBA8(img)
    watermarkCache = { width: img.width, height: img.height, data: new Uint8Array(frame) }
  } catch (err) {
    watermarkCache = false
  }

  return watermarkCache
}

// Reduce con promedio de área: suficiente para un logo de 127 px a ~64 px.
const resizeRgba = (src, sw, sh, dw, dh) => {
  const out = new Uint8Array(dw * dh * 4)
  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor((y * sh) / dh)
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * sh) / dh))
    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor((x * sw) / dw)
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * sw) / dw))
      const acc = [0, 0, 0, 0]
      let n = 0
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * sw + xx) * 4
          acc[0] += src[i]
          acc[1] += src[i + 1]
          acc[2] += src[i + 2]
          acc[3] += src[i + 3]
          n++
        }
      }
      const o = (y * dw + x) * 4
      out[o] = Math.round(acc[0] / n)
      out[o + 1] = Math.round(acc[1] / n)
      out[o + 2] = Math.round(acc[2] / n)
      out[o + 3] = Math.round(acc[3] / n)
    }
  }
  return out
}

const blendPixel = (rgba, offset, r, g, b, alpha) => {
  const a = alpha / 255
  rgba[offset] = Math.round(r * a + rgba[offset] * (1 - a))
  rgba[offset + 1] = Math.round(g * a + rgba[offset + 1] * (1 - a))
  rgba[offset + 2] = Math.round(b * a + rgba[offset + 2] * (1 - a))
  rgba[offset + 3] = 255
}

const applyWatermark = png => {
  const logo = loadWatermark()
  if (!logo) return png

  const img = UPNG.decode(png)
  const [frame] = UPNG.toRGBA8(img)
  const rgba = new Uint8Array(frame)

  const dh = Math.max(1, Math.min(WATERMARK_HEIGHT, Math.round(img.height / 4)))
  const dw = Math.max(1, Math.round((logo.width * dh) / logo.height))
  const mark = resizeRgba(logo.data, logo.width, logo.height, dw, dh)

  const margin = Math.max(8, Math.round(img.width * 0.012))
  const pad = Math.round(dh * 0.12)
  const x0 = img.width - dw - margin
  const y0 = margin

  for (let y = y0 - pad; y < y0 + dh + pad; y++) {
    for (let x = x0 - pad; x < x0 + dw + pad; x++) {
      if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue
      blendPixel(rgba, (y * img.width + x) * 4, 255, 255, 255, 110)
    }
  }

  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const px = x0 + x
      const py = y0 + y
      if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue
      const s = (y * dw + x) * 4
      const alpha = mark[s + 3]
      if (!alpha) continue
      blendPixel(rgba, (py * img.width + px) * 4, mark[s], mark[s + 1], mark[s + 2], alpha)
    }
  }

  return Buffer.from(UPNG.encode([rgba.buffer], img.width, img.height, 0))
}

const renderMapImage = async (lat, lon, zoom) => {
  const z = Math.min(zoom, MAX_ZOOM)
  const provider = cityProvider()
  const far = provider && z <= cityMaxZoom()

  if (far && provider === 'stadia' && stadiaKey()) {
    return buildStadiaImage(lat, lon, z, cityStyle() || stadiaStyle())
  }
  if (far && provider === 'geoapify' && geoapifyKey()) {
    return buildGeoapifyImage(lat, lon, z, cityStyle() || geoapifyStyle())
  }

  if (stadiaKey()) return buildStadiaImage(lat, lon, z)
  if (geoapifyKey()) return buildGeoapifyImage(lat, lon, z)

  let failure = null
  for (const provider of providerOrder()) {
    try {
      return await composeMap(provider, lat, lon, Math.min(zoom, MAX_ZOOM))
    } catch (err) {
      failure = failure || err
    }
  }
  throw failure
}

const buildMapImage = async (lat, lon, zoom) => {
  const result = await renderMapImage(lat, lon, zoom)
  return { ...result, png: applyWatermark(result.png) }
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
  watermarkCache = null
}

const zoomForType = type => (CITY_TYPES.has(type) ? 12 : 16)

const ZOOM_BOUNDS = {
  country: [3, 6],
  state: [4, 8],
  region: [4, 8],
  county: [7, 10],
  municipality: [8, 11],
  city: [10, 13],
  town: [11, 14],
  village: [12, 15],
  hamlet: [13, 16],
  suburb: [14, 16],
  neighbourhood: [14, 16],
  quarter: [14, 16],
  borough: [14, 16],
  road: [15, 17],
  house: [16, 17],
  building: [16, 17]
}

const boundsForType = type => ZOOM_BOUNDS[type] || [14, MAX_ZOOM]

const mercatorY = lat => {
  const rad = (lat * Math.PI) / 180
  return (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2
}

const zoomToFit = bbox => {
  if (!Array.isArray(bbox) || bbox.length !== 4) return null
  const [south, north, west, east] = bbox.map(Number)
  if (![south, north, west, east].every(Number.isFinite)) return null

  const latSpan = Math.abs(mercatorY(north) - mercatorY(south))
  const lonSpan = Math.abs((east - west) / 360)
  if (!(latSpan > 0) || !(lonSpan > 0)) return null

  const zoomLat = Math.log2(MAP_HEIGHT / TILE_SIZE / latSpan)
  const zoomLon = Math.log2(MAP_WIDTH / TILE_SIZE / lonSpan)

  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.floor(Math.min(zoomLat, zoomLon))))
}

// El bounding box de algunos lugares viene enorme (relaciones administrativas
// mal delimitadas), así que el zoom calculado se acota según el tipo de lugar.
const zoomForPlace = (bbox, type) => {
  const [min, max] = boundsForType(type)
  const fit = zoomToFit(bbox)
  if (fit === null) return Math.min(max, Math.max(min, zoomForType(type)))
  return Math.min(max, Math.max(min, fit))
}

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

  const placeType = result.addresstype || result.type

  return {
    lat,
    lon,
    label: result.display_name || address,
    zoom: zoomForPlace(result.boundingbox, placeType)
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

  const extent = properties.extent
  const bbox = Array.isArray(extent) && extent.length === 4
    ? [extent[3], extent[1], extent[0], extent[2]]
    : null

  return {
    lat,
    lon,
    label,
    zoom: zoomForPlace(bbox, properties.type)
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

const SHARES_KEY = 'mapShares'
const SHARE_MAX = 500
const SHARE_TTL_MS = 180 * 24 * 60 * 60 * 1000

const escapeHtml = text =>
  String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])

const readShares = robot => {
  const all = robot.brain.get(SHARES_KEY)
  return all && typeof all === 'object' ? all : {}
}

const pruneShares = shares => {
  const now = Date.now()
  const entries = Object.entries(shares)
    .filter(([, share]) => share && now - share.at < SHARE_TTL_MS)
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, SHARE_MAX)
  return Object.fromEntries(entries)
}

const createShare = (robot, place) => {
  const shares = pruneShares(readShares(robot))
  const id = crypto.randomBytes(4).toString('hex')
  shares[id] = {
    lat: place.lat,
    lon: place.lon,
    zoom: place.zoom,
    label: place.label,
    at: Date.now()
  }
  robot.brain.set(SHARES_KEY, shares)
  return id
}

const getShare = (robot, id) => {
  if (!/^[a-f0-9]{8}$/.test(String(id))) return null
  const share = readShares(robot)[id]
  if (!share || Date.now() - share.at > SHARE_TTL_MS) return null
  return share
}

const renderSharePage = (share, id) => {
  const base = publicUrl()
  const image = `${base}/m/${id}.png`
  const title = escapeHtml(truncate(share.label, 120))
  const coords = `${share.lat.toFixed(5)}, ${share.lon.toFixed(5)}`
  const osm = osmLink(share.lat, share.lon, share.zoom)

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · huemul</title>
<meta property="og:title" content="${title}">
<meta property="og:description" content="Mapa de ${title} (${coords})">
<meta property="og:image" content="${image}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 16px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: #f5f4f0; color: #1d1d1b; }
  main { max-width: 680px; margin: 0 auto; padding: 16px; }
  h1 { font-size: 1.25rem; margin: 0 0 4px; }
  p.coords { margin: 0 0 12px; color: #5f5f5a; font-size: .9rem; }
  img { width: 100%; height: auto; border-radius: 10px; display: block; border: 1px solid #ddd9d1; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  button, a.btn { font: inherit; padding: 10px 14px; border-radius: 8px; border: 1px solid #c9c4ba; background: #fff; color: inherit; text-decoration: none; cursor: pointer; }
  button { background: #d93025; border-color: #d93025; color: #fff; }
  footer { margin-top: 14px; font-size: .8rem; color: #6b6b66; }
  @media (prefers-color-scheme: dark) {
    body { background: #14140f; color: #f2efe6; }
    p.coords, footer { color: #a9a49a; }
    img { border-color: #33302a; }
    button, a.btn { background: #23231d; border-color: #3a3a32; }
    button { background: #d93025; border-color: #d93025; }
  }
</style>
</head>
<body>
<main>
  <h1>${title}</h1>
  <p class="coords">${coords}</p>
  <img src="${image}" alt="Mapa de ${title}" loading="lazy">
  <div class="actions">
    <button type="button" id="copy">Copiar link</button>
    <a class="btn" href="${osm}" target="_blank" rel="noopener">Ver en OpenStreetMap</a>
  </div>
  <footer>Mapa de huemul · devsChile.cl</footer>
</main>
<script>
  document.getElementById('copy').addEventListener('click', function () {
    var url = location.href
    var done = function () { this.textContent = '¡Copiado!' }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done.bind(this))
    else { prompt('Copia el link:', url) }
  })
</script>
</body>
</html>`
}

module.exports = robot => {
  if (robot.router && typeof robot.router.get === 'function') {
    robot.router.get('/map/:id.png', (req, res) => {
      const png = readImage(req.params.id)
      if (!png) return res.status(404).type('text/plain').send('not found')

      res.set('Content-Type', 'image/png')
      res.set('Cache-Control', 'public, max-age=1800')
      res.send(png)
    })

    robot.router.get('/m/:id.png', async (req, res) => {
      const share = getShare(robot, req.params.id)
      if (!share) return res.status(404).type('text/plain').send('not found')

      try {
        const map = await buildMapImage(share.lat, share.lon, share.zoom)
        res.set('Content-Type', 'image/png')
        res.set('Cache-Control', 'public, max-age=86400')
        res.send(map.png)
      } catch (err) {
        robot.logger.error(`map: share image ${err.kind || 'unknown'} ${err.detail || err.message}`)
        res.status(502).type('text/plain').send('map unavailable')
      }
    })

    robot.router.get('/m/:id', (req, res) => {
      const share = getShare(robot, req.params.id)
      if (!share) return res.status(404).type('text/html').send('<!doctype html><meta charset="utf-8"><p>Mapa no encontrado.</p>')

      res.set('Content-Type', 'text/html; charset=utf-8')
      res.set('Cache-Control', 'public, max-age=300')
      res.send(renderSharePage(share, req.params.id))
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
    const shareId = createShare(robot, place)
    const shortLink = `${publicUrl()}/m/${shareId}`
    const attachment = {
      fallback: `Mapa de ${label}: ${shortLink}`,
      color: 'good',
      title: label,
      title_link: shortLink,
      text: `:world_map: <${shortLink}|Ver mapa> · <${link}|OpenStreetMap> (${place.lat.toFixed(5)}, ${place.lon.toFixed(5)})`,
      footer: ATTRIBUTION
    }

    try {
      const map = await buildMapImage(place.lat, place.lon, place.zoom)
      attachment.image_url = `${publicUrl()}/map/${storeImage(map.png)}.png`
      attachment.footer = map.attribution
    } catch (err) {
      robot.logger.error(`map: tiles ${err.kind || 'unknown'} ${err.detail || err.message}`)
      attachment.text = `${attachment.text}\nNo pude generar la imagen, pero el link funciona.`
    }

    msg.send({
      text: `Mapa de ${label}: ${shortLink}`,
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
module.exports.zoomToFit = zoomToFit
module.exports.buildMapImage = buildMapImage
module.exports.drawPin = drawPin
module.exports.applyPin = applyPin
module.exports.createShare = createShare
module.exports.getShare = getShare
module.exports.renderSharePage = renderSharePage
