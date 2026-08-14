// Description:
//   Muestra el horóscopo del día según el signo
//
// Dependencies:
//   https://horoscopo.devschile.cl/api/horoscopo
//   https://horoscopo.devschile.cl/api/horoscopo-dev
//
// Configuration:
//   HOROSCOPO_API_KEY - API key requerida por horoscopo.devschile.cl (ver README del proyecto)
//
// Commands:
//   hubot horóscopo <signo zodiacal> - Muestra el horóscopo del día para el signo indicado. Ejemplo: `hubot horóscopo leo`
//   hubot horoscopo <signo zodiacal> - Muestra el horóscopo del día para el signo indicado. Ejemplo: `hubot horoscopo leo`
//   hubot horoscopo <signo zodiacal> --dev - Como el anterior, pero con la vida de quien programa. Ejemplo: `hubot horoscopo leo --dev`
//
// Author:
//   @jorgeepunan

'use strict'

const CLASSIC_URL = 'https://horoscopo.devschile.cl/api/horoscopo'
const DEV_URL = 'https://horoscopo.devschile.cl/api/horoscopo-dev'
const DEV_FLAG = '--dev'

// Lista solo para el mensaje de ayuda cuando no se indica signo. La
// validación real del signo la hace la API (acepta tildes, "escorpio" como
// alias de "escorpion", etc.) — no se duplica esa lógica acá.
const SIGNS = [
  'aries',
  'tauro',
  'geminis',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'escorpion',
  'sagitario',
  'capricornio',
  'acuario',
  'piscis'
]

const buildOptions = () => ({
  as_user: false,
  link_names: 1,
  icon_url: 'https://horoscopo.devschile.cl/pedrito-engel.png',
  username: 'Pedrito Engel',
  unfurl_links: false,
  attachments: [{}]
})

const buildHelpMessage = () =>
  `Debes agregar un signo zodiacal (${SIGNS.join(', ')}). Agrega "${DEV_FLAG}" al final para la variante para developers.`

const buildErrorMessage = () => 'Ocurrió un error con la búsqueda'

const buildUnknownSignMessage = signosValidos => {
  const lista = Array.isArray(signosValidos) && signosValidos.length ? signosValidos.join(', ') : SIGNS.join(', ')
  return `No reconozco ese signo. Usa uno de: ${lista}.`
}

// Todo lo que sigue a "horóscopo" llega como un solo bloque de texto (ver el
// patrón en `module.exports`), porque el orden entre el signo y "--dev" no
// está fijo ("horoscopo leo --dev" y "horoscopo --dev leo" deben funcionar
// igual). Se separa en tokens y se distingue la bandera del signo por su
// valor literal, no por posición.
const parseArgs = rawArgs => {
  const tokens = rawArgs ? rawArgs.trim().split(/\s+/).filter(Boolean) : []
  const isDev = tokens.some(token => token.toLowerCase() === DEV_FLAG)
  const signoToken = tokens.find(token => token.toLowerCase() !== DEV_FLAG)
  return { signoTexto: signoToken ? signoToken.toLowerCase() : null, isDev }
}

// Con ?signo= la API siempre devuelve un solo signo bajo `horoscopo`. Se lee
// la única entrada en vez de indexar por el texto que escribió la persona,
// porque ese texto puede venir con tilde ("géminis") mientras la respuesta
// usa siempre el slug canónico sin tilde ("geminis") como clave.
const getSinglePrediction = data => {
  const entries = data && data.horoscopo ? Object.entries(data.horoscopo) : []
  if (entries.length !== 1) return null
  const [signo, prediccion] = entries[0]
  return { signo, prediccion }
}

const buildHoroscopeText = data => {
  const entry = getSinglePrediction(data)
  if (!entry) return null
  const { nombre, amor, salud, dinero, color, numero } = entry.prediccion
  const nota = data.vigente === false ? ' (todavía no está listo el de hoy; este es el de ayer)' : ''

  return `
Horóscopo de ${data.titulo} para ${nombre}${nota}:
  · Amor 💖 : ${amor}
  · Salud 🤕 : ${salud}
  · Dinero 💰 : ${dinero}
  · Color 🖌 : ${color}
  · Número 🔢 : ${numero}`
}

const buildHoroscopeFields = data => {
  const entry = getSinglePrediction(data)
  if (!entry) return null
  const { amor, salud, dinero, color, numero } = entry.prediccion

  return [
    { value: `💖 ${amor}`, short: false },
    { value: `🤕 ${salud}`, short: false },
    { value: `💰 ${dinero}`, short: false },
    { value: `🖌 ${color}`, short: true },
    { value: `🔢 ${numero}`, short: true }
  ]
}

module.exports = function (robot) {
  const pattern = /hor[oó]scopo(\s+(.+))?$/i

  robot.respond(pattern, function (res) {
    const send = options => {
      if (['SlackBot', 'Room'].includes(robot.adapter.constructor.name)) {
        robot.adapter.client.web.chat.postMessage(res.message.room, null, options)
      } else {
        res.send(options.attachments[0].fallback)
      }
    }

    const sendError = signoTexto => {
      const options = buildOptions()
      const error = buildErrorMessage()
      options.attachments[0].fallback = error
      options.attachments[0].title = `Horóscopo para ${signoTexto}`
      options.attachments[0].text = error
      options.attachments[0].color = 'danger'
      send(options)
    }

    const { signoTexto, isDev } = parseArgs(res.match[2])
    const url = isDev ? DEV_URL : CLASSIC_URL

    if (!signoTexto) {
      const options = buildOptions()
      const help = buildHelpMessage()
      options.attachments[0].fallback = help
      options.attachments[0].text = help
      options.attachments[0].color = '#004085'
      return send(options)
    }

    const apiKey = process.env.HOROSCOPO_API_KEY
    if (!apiKey) {
      robot.emit('error', new Error('Falta la variable de entorno HOROSCOPO_API_KEY'), res, 'horoscopo')
      return sendError(signoTexto)
    }

    robot
      .http(`${url}?signo=${encodeURIComponent(signoTexto)}`)
      .header('x-api-key', apiKey)
      .timeout(5000)
      .get()(function (err, response, body) {
        if (err) {
          robot.emit('error', err, res, 'horoscopo')
          return sendError(signoTexto)
        }

        let data
        try {
          data = JSON.parse(body)
        } catch (parseErr) {
          robot.emit('error', parseErr, res, 'horoscopo')
          return sendError(signoTexto)
        }

        if (response.statusCode === 400) {
          const options = buildOptions()
          const message = buildUnknownSignMessage(data && data.signos_validos)
          options.attachments[0].fallback = message
          options.attachments[0].text = message
          options.attachments[0].color = '#004085'
          return send(options)
        }

        if (response.statusCode !== 200) {
          robot.emit('error', new Error(`Status code ${response.statusCode}`), res, 'horoscopo')
          return sendError(signoTexto)
        }

        const text = buildHoroscopeText(data)
        const fields = buildHoroscopeFields(data)
        const entry = getSinglePrediction(data)

        if (!text || !fields || !entry) {
          robot.emit('error', new Error(`Respuesta sin el signo "${signoTexto}"`), res, 'horoscopo')
          return sendError(signoTexto)
        }

        const options = buildOptions()
        options.attachments[0].fallback = text
        options.attachments[0].title = `Horóscopo para ${entry.signo}`
        options.attachments[0].color = 'good'
        options.attachments[0].fields = fields
        send(options)
      })
  })
}

module.exports._test = {
  SIGNS,
  parseArgs,
  buildOptions,
  buildHelpMessage,
  buildErrorMessage,
  buildUnknownSignMessage,
  buildHoroscopeText,
  buildHoroscopeFields,
  getSinglePrediction
}
