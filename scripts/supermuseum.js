// Description:
//   Busca y recomienda juegos del SuperMuseum (supermuseum.netlify.app).
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot supermuseum - Retorna un juego al azar de todas las bibliotecas
//   hubot supermuseum <plataforma> - Retorna un juego al azar de esa plataforma (ej: snes, arcade, dos)
//   hubot supermuseum <texto> - Lista hasta 10 juegos cuyo título contenga el texto
//
// Author:
//   @livercake

const BASE_URL = 'https://supermuseum.netlify.app'
const MAX_RESULTS = 10
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h: supermuseum publica nuevo contenido una vez al día

// Fuente de verdad en supermuseum-v2: PLATFORM_ORDER en src/constants/ui.js
const PLATFORMS = ['nes', 'gb', 'pce', 'snes', 'genesis', 'n64', 'saturn', 'psx', 'psp', 'gba', 'arcade', 'dos', 'pico8']

const PLATFORM_LABELS = {
  nes: 'Nintendo',
  snes: 'Super Nintendo',
  genesis: 'Genesis/32X',
  n64: 'Nintendo 64',
  gb: 'Game Boy',
  gba: 'GameBoy Advance',
  dos: 'MS-DOS',
  arcade: 'Arcade',
  pico8: 'PICO-8',
  pce: 'HuCards',
  saturn: 'Saturn',
  psx: 'PlayStation',
  psp: 'PlayStation Portable'
}

// El museo solo acepta browsers y bots conocidos (block-non-browser en
// Netlify: 403 sin Sec-Fetch-* ni UA reconocido). 'hubot' está allowlisteado
// en el museo (src/utils/browser-check.js), así que nos identificamos
// honestamente en vez de spoofear un browser.
const HUBOT_UA = 'huemul-hubot (devsChile Slack bot)'

let cache = { games: null, fetchedAt: 0 }

function fetchLibraries (robot, cb) {
  if (cache.games && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cb(null, cache.games)
  }
  const games = []
  let pending = PLATFORMS.length
  let settled = false
  PLATFORMS.forEach(platform => {
    robot.http(`${BASE_URL}/json/${platform}.json`).header('User-Agent', HUBOT_UA).get()((err, res, body) => {
      if (settled) return
      if (err || !res || res.statusCode !== 200 || !body) {
        settled = true
        return cb(err || new Error(`HTTP ${res && res.statusCode} fetching ${platform}.json`))
      }
      let lib
      try {
        lib = JSON.parse(body)
      } catch (parseErr) {
        settled = true
        return cb(parseErr)
      }
      lib.forEach(game => games.push(game))
      pending -= 1
      if (pending === 0) {
        settled = true
        cache = { games, fetchedAt: Date.now() }
        cb(null, games)
      }
    })
  })
}

function formatGame (game) {
  const label = PLATFORM_LABELS[game.platform] || game.platform
  const line = `${game.title} (${game.year}) - ${game.developer} - ${label}`
  return `${line}\n${BASE_URL}/?play=${game.platform}:${game.serial}`
}

module.exports = function (robot) {
  robot.respond(/supermuseum\s?(.*)/i, function (msg) {
    const query = (msg.match[1] || '').trim()
    fetchLibraries(robot, function (err, games) {
      if (err || !games) {
        if (err) robot.emit('error', err, msg, 'supermuseum')
        return msg.reply('ocurrió un error buscando en el SuperMuseum, intenta de nuevo más tarde')
      }
      if (!query) {
        return msg.send(formatGame(msg.random(games)))
      }
      const platform = query.toLowerCase()
      if (PLATFORMS.indexOf(platform) !== -1) {
        const pool = games.filter(game => game.platform === platform)
        if (pool.length === 0) return msg.reply(`no encontré juegos de "${query}" en el SuperMuseum`)
        return msg.send(formatGame(msg.random(pool)))
      }
      const needle = query.toLowerCase()
      const matches = games.filter(game => String(game.title || '').toLowerCase().includes(needle))
      if (matches.length === 0) return msg.reply(`no encontré juegos para "${query}" en el SuperMuseum`)
      const shown = matches.slice(0, MAX_RESULTS).map(formatGame).join('\n\n')
      const extra = matches.length > MAX_RESULTS ? `\n\n…y ${matches.length - MAX_RESULTS} más` : ''
      // Más de un link: bloque de código para que Slack no despliegue rich links
      if (matches.length > 1) return msg.send('```' + shown + extra + '```')
      return msg.send(shown + extra)
    })
  })
}

module.exports.PLATFORMS = PLATFORMS
module.exports._resetCache = function () {
  cache = { games: null, fetchedAt: 0 }
}
