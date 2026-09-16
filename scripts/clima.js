// Description:
//   Muestra el tiempo de hoy con un dibujo ASCII: condición, tº actual y sensación térmica,
//   mín/máx, viento, humedad y probabilidad de lluvia. No requiere API key.
//   Fuente: Open-Meteo (geocoding + forecast), se consulta con "ciudad, país".
//
// Dependencies:
//   None
//
// Configuration:
//   HUBOT_CLIMA_TIMEOUT_MS - milisegundos de espera por request a Open-Meteo (default 8000)
//
// Commands:
//   hubot clima|tiempo|weather - Tiempo de Santiago, Chile
//   hubot clima <ciudad, país> - Tiempo de la ciudad indicada (ej: hubot clima Temuco, Chile)
//
// Author:
//   @jorgeepunan

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

// Ciudad por defecto (coordenadas fijas: evita una vuelta al geocoding)
const DEFAULT_PLACE = { name: 'Santiago de Chile', country: 'Chile', latitude: -33.45694, longitude: -70.64827 }

// Corte de la request: si la API no responde a tiempo, se avisa igual
const REQUEST_TIMEOUT_MS = 8000

// Open-Meteo publica los datos con licencia CC-BY 4.0: hay que dar el crédito
const CREDITO = 'datos: open-meteo.com'

// Ancho de la columna del dibujo: los datos se alinean a su derecha
const ART_WIDTH = 15

// Largo máximo del título (ciudad, país): el bloque completo queda en ~40 columnas
const TITULO_MAX = 25

// Dibujos ya hechos: se elige uno según la condición y si es de día o de noche
const ARTS = {
  despejado: [
    '      \\   /',
    '       .-.',
    '    ― (   ) ―',
    "       `-'",
    '      /   \\'
  ],
  despejadoNoche: [
    '    *  .-.',
    '      (   )',
    "       `-'"
  ],
  parcial: [
    '      \\  /',
    '    _`/"".-.',
    '     \\_(   ).',
    '     /(___(__'
  ],
  parcialNoche: [
    '        .-.',
    '     _ (   ).',
    '      \\_(   ).',
    '      /(___(__'
  ],
  nublado: [
    '      .--.',
    '   .-(    ).',
    '  (___.__)__)'
  ],
  niebla: [
    '  _ - _ - _ -',
    '   _ - _ - _',
    '  _ - _ - _ -'
  ],
  llovizna: [
    '      .-.',
    '     (   ).',
    '    (___(__)',
    "     ' ' ' '"
  ],
  lluvia: [
    '      .-.',
    '     (   ).',
    '    (___(__)',
    "    ' ' ' ' '",
    "   ' ' ' ' '"
  ],
  chubascos: [
    '      \\  /',
    '    _`/"".-.',
    '     \\_(   ).',
    '     /(___(__',
    "     ' ' ' '"
  ],
  tormenta: [
    '      .-.',
    '     (   ).',
    '    (___(__)',
    '     /\\/\\/\\'
  ],
  nieve: [
    '      .-.',
    '     (   ).',
    '    (___(__)',
    '    *  *  *  *'
  ]
}

// Códigos WMO de Open-Meteo. Textos cortos para que el bloque quepa en pantallas angostas.
const CONDICIONES = {
  0: { texto: 'Despejado', dibujo: 'despejado', emoji: '☀️', emojiNoche: '🌙' },
  1: { texto: 'Casi despejado', dibujo: 'despejado', emoji: '🌤️', emojiNoche: '🌙' },
  2: { texto: 'Parcial nublado', dibujo: 'parcial', emoji: '⛅', emojiNoche: '☁️' },
  3: { texto: 'Nublado', dibujo: 'nublado', emoji: '☁️' },
  45: { texto: 'Niebla', dibujo: 'niebla', emoji: '🌫️' },
  48: { texto: 'Niebla y escarcha', dibujo: 'niebla', emoji: '🌫️' },
  51: { texto: 'Llovizna débil', dibujo: 'llovizna', emoji: '🌦️' },
  53: { texto: 'Llovizna', dibujo: 'llovizna', emoji: '🌦️' },
  55: { texto: 'Llovizna intensa', dibujo: 'llovizna', emoji: '🌦️' },
  56: { texto: 'Llovizna helada', dibujo: 'llovizna', emoji: '🌧️' },
  57: { texto: 'Llovizna helada fuerte', dibujo: 'llovizna', emoji: '🌧️' },
  61: { texto: 'Lluvia débil', dibujo: 'lluvia', emoji: '🌦️' },
  63: { texto: 'Lluvia', dibujo: 'lluvia', emoji: '🌧️' },
  65: { texto: 'Lluvia fuerte', dibujo: 'lluvia', emoji: '🌧️' },
  66: { texto: 'Lluvia helada', dibujo: 'lluvia', emoji: '🌧️' },
  67: { texto: 'Lluvia helada fuerte', dibujo: 'lluvia', emoji: '🌧️' },
  71: { texto: 'Nieve débil', dibujo: 'nieve', emoji: '🌨️' },
  73: { texto: 'Nieve', dibujo: 'nieve', emoji: '🌨️' },
  75: { texto: 'Nieve fuerte', dibujo: 'nieve', emoji: '🌨️' },
  77: { texto: 'Aguanieve', dibujo: 'nieve', emoji: '🌨️' },
  80: { texto: 'Chubascos débiles', dibujo: 'chubascos', emoji: '🌦️' },
  81: { texto: 'Chubascos', dibujo: 'chubascos', emoji: '🌧️' },
  82: { texto: 'Chubascos fuertes', dibujo: 'chubascos', emoji: '🌧️' },
  85: { texto: 'Chubascos de nieve', dibujo: 'nieve', emoji: '🌨️' },
  86: { texto: 'Nevadas fuertes', dibujo: 'nieve', emoji: '🌨️' },
  95: { texto: 'Tormenta eléctrica', dibujo: 'tormenta', emoji: '⛈️' },
  96: { texto: 'Tormenta con granizo', dibujo: 'tormenta', emoji: '⛈️' },
  99: { texto: 'Tormenta con granizo', dibujo: 'tormenta', emoji: '⛈️' },
  otro: { texto: 'Sin datos', dibujo: 'nublado', emoji: '❓' }
}

const CARDINALES = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']

const entero = valor => (typeof valor === 'number' && isFinite(valor) ? Math.round(valor) : null)

const cardinal = grados => {
  const valor = entero(grados)
  if (valor === null) return ''
  return CARDINALES[Math.round(valor / 45) % 8]
}

const dibujoDe = (condicion, deDia) => {
  const nombre = deDia ? condicion.dibujo : `${condicion.dibujo}Noche`
  return ARTS[nombre] || ARTS[condicion.dibujo]
}

const emojiDe = (condicion, deDia) => (!deDia && condicion.emojiNoche ? condicion.emojiNoche : condicion.emoji)

// Recorta textos largos (nombres de ciudad muy largos) para que el bloque no scrollee en mobile
const recortar = (texto, max) => (String(texto).length > max ? `${String(texto).slice(0, max - 1)}…` : String(texto))

// Datos de texto que acompañan al dibujo; null si faltan los datos esenciales
const datosDe = (lugar, datos) => {
  const actual = datos.current
  const diario = datos.daily

  const ahora = entero(actual.temperature_2m)
  const maxima = entero(diario.temperature_2m_max && diario.temperature_2m_max[0])
  const minima = entero(diario.temperature_2m_min && diario.temperature_2m_min[0])

  if (ahora === null || maxima === null || minima === null) return null

  const sensacion = entero(actual.apparent_temperature)
  const viento = entero(actual.wind_speed_10m)
  const direccion = cardinal(actual.wind_direction_10m)
  const humedad = entero(actual.relative_humidity_2m)
  const lluvia = entero(diario.precipitation_probability_max && diario.precipitation_probability_max[0])

  const condicion = CONDICIONES[actual.weather_code] || CONDICIONES.otro
  const titulo = recortar(
    lugar.country && String(lugar.name).indexOf(lugar.country) === -1
      ? `${lugar.name}, ${lugar.country}`
      : lugar.name,
    TITULO_MAX
  )

  return {
    condicion,
    deDia: actual.is_day !== 0,
    textos: [
      titulo,
      `${emojiDe(condicion, actual.is_day !== 0)} ${condicion.texto}`,
      `Ahora ${ahora}°C${sensacion === null ? '' : ` (ST ${sensacion}°C)`}`,
      `Mín ${minima}°C / Máx ${maxima}°C`,
      viento === null ? null : `Viento ${viento} km/h${direccion ? ` ${direccion}` : ''}`,
      humedad === null ? null : `Humedad ${humedad}%`,
      lluvia === null ? null : `Lluvia ${lluvia}%`
    ].filter(texto => texto !== null)
  }
}

// Junta el dibujo (izquierda) con los datos (derecha); null si faltan datos esenciales
const reporte = (lugar, datos) => {
  if (!datos || !datos.current || !datos.daily) return null

  const contenido = datosDe(lugar, datos)
  if (!contenido) return null

  const dibujo = dibujoDe(contenido.condicion, contenido.deDia)
  const alto = Math.max(dibujo.length, contenido.textos.length)
  const filas = []

  for (let i = 0; i < alto; i++) {
    const izquierda = (dibujo[i] || '').padEnd(ART_WIDTH)
    filas.push((izquierda + (contenido.textos[i] || '')).replace(/\s+$/, ''))
  }

  return filas.join('\n')
}

const pedirJSON = (robot, url, cb) => {
  const tiempoMax = Number(process.env.HUBOT_CLIMA_TIMEOUT_MS) || REQUEST_TIMEOUT_MS

  robot
    .http(url)
    .header('Accept', 'application/json')
    .timeout(tiempoMax)
    .get()((err, res, body) => {
      if (err) return cb(err)
      if (!res || res.statusCode !== 200) return cb(new Error(`status code ${res && res.statusCode}`))
      if (!body) return cb(new Error('respuesta vacía'))
      let json
      try {
        json = JSON.parse(body)
      } catch (e) {
        return cb(e)
      }
      cb(null, json)
    })
}

// Pide el pronóstico del lugar ya resuelto y responde el bloque ASCII
const responder = (robot, msg, lugar) => {
  const forecastUrl = `${FORECAST_URL}?latitude=${lugar.latitude}&longitude=${lugar.longitude}` +
    '&current=temperature_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m' +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
    '&timezone=auto&forecast_days=1'

  pedirJSON(robot, forecastUrl, (err, datos) => {
    if (err) {
      robot.emit('error', err, msg, 'clima')
      return msg.reply('ocurrió un error con la búsqueda')
    }

    const texto = reporte(lugar, datos)

    if (!texto) {
      robot.emit('error', new Error('Open-Meteo no entregó los datos esperados'), msg, 'clima')
      return msg.reply('ocurrió un error con la búsqueda')
    }

    msg.send('```\n' + texto + '\n' + CREDITO + '\n```')
  })
}

module.exports = robot => {
  robot.respond(/(clima|tiempo|weather)\s?(.*)/i, msg => {
    const consulta = msg.match[2].trim()

    // Sin ciudad (o "santiago") se va directo al pronóstico: ahorra la vuelta del geocoding
    if (!consulta || consulta.toLowerCase() === 'santiago') {
      return responder(robot, msg, DEFAULT_PLACE)
    }

    const geoUrl = `${GEO_URL}?name=${encodeURIComponent(consulta)}&count=1&language=es&format=json`

    pedirJSON(robot, geoUrl, (err, geo) => {
      if (err) {
        robot.emit('error', err, msg, 'clima')
        return msg.reply('ocurrió un error con la búsqueda')
      }

      const lugar = geo && Array.isArray(geo.results) ? geo.results[0] : null

      if (!lugar || typeof lugar.latitude !== 'number' || typeof lugar.longitude !== 'number') {
        return msg.send(`no encontré "${consulta}", prueba con "ciudad, país"`)
      }

      responder(robot, msg, lugar)
    })
  })
}
