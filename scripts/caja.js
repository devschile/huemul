// Description:
//   Guarda una imagen pública en la caja de devsChile (Garage S3), bajo static.devschile.cl/caja.
//   Exclusivo para socios gold :monea:.
//
// Configuration:
//   CAJA_S3_ENDPOINT, CAJA_S3_BUCKET, CAJA_S3_REGION,
//   CAJA_S3_ACCESS_KEY_ID, CAJA_S3_SECRET_ACCESS_KEY,
//   CAJA_PUBLIC_URL, CAJA_PREFIX (default caja), CAJA_TIMEOUT_MS (default 10000)
//
// Commands:
//   hubot caja <url> [--name="nombre"] - Sube una imagen pública (máx 2 MB) a static.devschile.cl/caja (solo gold)
//
// Author:
//   @huemul

const crypto = require('crypto')
const net = require('net')
const fetch = require('node-fetch')
const { URL } = require('url')
const { GOLD_DENIAL } = require('./helpers/gold-gate')
const s3 = require('./helpers/s3-put')

// Node 24 aborta el primer connect a hosts lejanos con el presupuesto de 250 ms
// de Happy Eyeballs; con 2 s los CDN de imágenes dejan de dar ETIMEDOUT.
if (typeof net.setDefaultAutoSelectFamilyAttemptTimeout === 'function') {
  net.setDefaultAutoSelectFamilyAttemptTimeout(2000)
}

const MAX_BYTES = 2 * 1024 * 1024
const MAX_HOPS = 3
const USER_AGENT = 'devschile-huemul/1.0 (+https://devschile.cl)'

const USAGE = 'Uso: hubot caja <url> [--name="nombre"] · máximo 2 MB · jpg, png, gif, webp, avif, bmp, tiff, ico'

const IMAGE_TYPES = {
  jpg: { mime: 'image/jpeg', ext: 'jpg' },
  png: { mime: 'image/png', ext: 'png' },
  gif: { mime: 'image/gif', ext: 'gif' },
  webp: { mime: 'image/webp', ext: 'webp' },
  avif: { mime: 'image/avif', ext: 'avif' },
  bmp: { mime: 'image/bmp', ext: 'bmp' },
  tiff: { mime: 'image/tiff', ext: 'tiff' },
  ico: { mime: 'image/x-icon', ext: 'ico' }
}

const fail = message => {
  const error = new Error(message)
  error.userMessage = message
  return error
}

const formatSize = bytes => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// Sólo dominios http(s) públicos: sin credenciales embebidas, sin IP literal
// (evita 127.0.0.1, 169.254.169.254 y rangos privados) y sin nombres internos.
const parseImageUrl = raw => {
  if (!raw) return null
  let value = String(raw).trim()
  const slackLink = value.match(/^<([^|>]+)(\|[^>]*)?>$/)
  if (slackLink) value = slackLink[1]
  let url
  try {
    url = new URL(value)
  } catch (err) {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username || url.password) return null
  const host = url.hostname.toLowerCase()
  if (!host || host.indexOf('.') === -1) return null
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/.test(host)) return null
  if (net.isIP(host)) return null
  return url
}

const detectImage = buffer => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return IMAGE_TYPES.jpg
  if (buffer.slice(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return IMAGE_TYPES.png
  const head = buffer.slice(0, 6).toString('ascii')
  if (head === 'GIF87a' || head === 'GIF89a') return IMAGE_TYPES.gif
  if (buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') return IMAGE_TYPES.webp
  if (buffer.slice(4, 8).toString('ascii') === 'ftyp') {
    const brand = buffer.slice(8, 12).toString('ascii')
    if (brand === 'avif' || brand === 'avis') return IMAGE_TYPES.avif
  }
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) return IMAGE_TYPES.bmp
  const tiffLittle = buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00
  const tiffBig = buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a
  if (tiffLittle || tiffBig) return IMAGE_TYPES.tiff
  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) return IMAGE_TYPES.ico
  return null
}

const nameFromUrl = url => {
  const last = url.pathname.split('/').filter(Boolean).pop() || ''
  try {
    return decodeURIComponent(last)
  } catch (err) {
    return last
  }
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|bmp|tiff?|ico)$/i
const NAME_FLAG = /(?:^|\s)--name(?:=|\s+)(?:"([^"]*)"|'([^']*)'|(\S+))/i

const sanitizeBase = value => String(value || '')
  .replace(IMAGE_EXT, '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9._-]+/g, '-')
  .replace(/^[-.]+|[-.]+$/g, '')
  .slice(0, 60) || 'imagen'

// `caja <url>` o `caja <url> --name="hola"` (también --name=hola o --name 'hola').
// El nombre es sólo la base: la extensión siempre sale del formato real de la imagen.
const parseCommand = raw => {
  let rest = String(raw || '').trim()
  let name = null
  const flag = rest.match(NAME_FLAG)
  if (flag) {
    name = flag[1] !== undefined ? flag[1] : (flag[2] !== undefined ? flag[2] : flag[3])
    rest = `${rest.slice(0, flag.index)} ${rest.slice(flag.index + flag[0].length)}`.trim()
  }
  const parts = rest.split(/\s+/).filter(Boolean)
  if (parts.length !== 1) return { url: null, name }
  return { url: parts[0], name }
}

const buildKey = (base, type) => {
  const prefix = (process.env.CAJA_PREFIX || 'caja').replace(/^\/+|\/+$/g, '')
  return `${prefix}/${sanitizeBase(base)}.${type.ext}`
}

const fetchOnce = (url, timeout) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  return fetch(url, {
    redirect: 'manual',
    headers: { 'user-agent': USER_AGENT, accept: 'image/*,*/*;q=0.8' },
    signal: controller.signal
  }).finally(() => clearTimeout(timer))
}

const readCapped = async (res, max) => {
  const chunks = []
  let total = 0
  for await (const chunk of res.body) {
    total += chunk.length
    if (total > max) {
      res.body.destroy()
      throw fail('La imagen pesa más de 2 MB y no la puedo guardar.')
    }
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

const download = async (start, timeout) => {
  let current = start
  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    let res
    try {
      res = await fetchOnce(current, timeout)
    } catch (err) {
      if (err && err.name === 'AbortError') throw fail('La descarga se demoró demasiado (timeout).')
      throw fail('No pude descargar esa imagen (error de red).')
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      const next = location ? parseImageUrl(new URL(location, current).toString()) : null
      if (!next) throw fail('La URL redirige a un destino que no acepto.')
      current = next
      continue
    }

    if (res.status !== 200) throw fail(`No pude descargar la imagen (HTTP ${res.status}).`)

    const declared = String(res.headers.get('content-type') || '').toLowerCase()
    const declaredOk = !declared || declared.indexOf('image/') === 0 || declared.indexOf('application/octet-stream') === 0
    if (!declaredOk) throw fail('Esa URL no entrega una imagen.')

    const length = Number(res.headers.get('content-length'))
    if (length && length > MAX_BYTES) throw fail(`La imagen pesa ${formatSize(length)} y el máximo es 2 MB.`)

    const buffer = await readCapped(res, MAX_BYTES)
    if (!buffer.length) throw fail('La imagen llegó vacía.')
    return { buffer, url: current }
  }
  throw fail('La URL da demasiadas vueltas (redirects).')
}

const keyExists = async key => {
  try {
    return (await s3.headObject(key)) === 200
  } catch (err) {
    return false
  }
}

module.exports = function (robot) {
  robot.respond(/caja$/i, msg => msg.send(USAGE))

  robot.respond(/caja\s+(.+)$/i, async msg => {
    const user = msg.message && msg.message.user
    if (!robot.golden || !robot.golden.isGold(user)) return msg.send(GOLD_DENIAL)

    const cfg = s3.config()
    if (!s3.isConfigured(cfg)) {
      robot.logger.error('caja: faltan CAJA_S3_ACCESS_KEY_ID / CAJA_S3_SECRET_ACCESS_KEY')
      return msg.send('La caja no está configurada todavía :monea: .')
    }

    const parsed = parseCommand(msg.match[1])
    if (!parsed.url) return msg.send(USAGE)
    const url = parseImageUrl(parsed.url)
    if (!url) return msg.send('Mándame una URL http(s) pública de una imagen (sin IPs ni hosts internos).')

    const timeout = Number(process.env.CAJA_TIMEOUT_MS) || 10000

    try {
      const { buffer, url: finalUrl } = await download(url, timeout)
      const type = detectImage(buffer)
      if (!type) throw fail('Eso no es una imagen soportada: jpg, png, gif, webp, avif, bmp, tiff o ico.')

      let key = buildKey(parsed.name || nameFromUrl(finalUrl), type)
      if (await keyExists(key)) {
        const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 8)
        key = key.replace(/(\.[a-z0-9]+)$/, `-${hash}$1`)
      }

      const res = await s3.putObject(key, buffer, type.mime)
      if (!res.ok) throw fail(`No pude guardar la imagen en la caja (S3 ${res.status}).`)

      const link = s3.publicUrl(key)
      msg.send(`:huemul: Guardada en <${link}|${link.replace(/^https?:\/\//, '')}> (${formatSize(buffer.length)})`)
    } catch (err) {
      if (err && err.userMessage) return msg.send(err.userMessage)
      robot.logger.error(`caja: ${err && err.stack ? err.stack : err}`)
      msg.send('No pude completar la subida. Intenta de nuevo en un rato.')
    }
  })
}
