// Description:
//   Muestra el tiempo de hoy con un dibujo ASCII: condición, tº actual y sensación térmica,
//   mín/máx, viento, humedad y probabilidad de lluvia. No requiere API key.
//   Fuente: Open-Meteo (geocoding + forecast), se consulta con "ciudad, país".
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot clima|tiempo|weather - Tiempo de Santiago, Chile
//   hubot clima <ciudad, país> - Tiempo de la ciudad indicada (ej: hubot clima Temuco, Chile)
//
// Author:
//   @jorgeepunan

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const DEFAULT_CITY = 'Santiago, Chile'

// Ancho de la columna del dibujo: los datos se alinean a su derecha
const ART_WIDTH = 16

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

// Códigos WMO de Open-Meteo
const CONDICIONES = {
  0: { texto: 'Despejado', dibujo: 'despejado' },
  1: { texto: 'Mayormente despejado', dibujo: 'despejado' },
  2: { texto: 'Parcialmente nublado', dibujo: 'parcial' },
  3: { texto: 'Nublado', dibujo: 'nublado' },
  45: { texto: 'Niebla', dibujo: 'niebla' },
  48: { texto: 'Niebla con escarcha', dibujo: 'niebla' },
  51: { texto: 'Llovizna débil', dibujo: 'llovizna' },
  53: { texto: 'Llovizna', dibujo: 'llovizna' },
  55: { texto: 'Llovizna intensa', dibujo: 'llovizna' },
  56: { texto: 'Llovizna helada', dibujo: 'llovizna' },
  57: { texto: 'Llovizna helada intensa', dibujo: 'llovizna' },
  61: { texto: 'Lluvia débil', dibujo: 'lluvia' },
  63: { texto: 'Lluvia', dibujo: 'lluvia' },
  65: { texto: 'Lluvia fuerte', dibujo: 'lluvia' },
  66: { texto: 'Lluvia helada', dibujo: 'lluvia' },
  67: { texto: 'Lluvia helada fuerte', dibujo: 'lluvia' },
  71: { texto: 'Nieve débil', dibujo: 'nieve' },
  73: { texto: 'Nieve', dibujo: 'nieve' },
  75: { texto: 'Nieve fuerte', dibujo: 'nieve' },
  77: { texto: 'Aguanieve', dibujo: 'nieve' },
  80: { texto: 'Chubascos débiles', dibujo: 'chubascos' },
  81: { texto: 'Chubascos', dibujo: 'chubascos' },
  82: { texto: 'Chubascos fuertes', dibujo: 'chubascos' },
  85: { texto: 'Chubascos de nieve', dibujo: 'nieve' },
  86: { texto: 'Chubascos de nieve fuertes', dibujo: 'nieve' },
  95: { texto: 'Tormenta eléctrica', dibujo: 'tormenta' },
  96: { texto: 'Tormenta con granizo', dibujo: 'tormenta' },
  99: { texto: 'Tormenta con granizo fuerte', dibujo: 'tormenta' },
  otro: { texto: 'Sin datos', dibujo: 'nublado' }
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
  const titulo = lugar.country && String(lugar.name).indexOf(lugar.country) === -1
    ? `${lugar.name}, ${lugar.country}`
    : lugar.name

  return {
    condicion,
    deDia: actual.is_day !== 0,
    textos: [
      titulo,
      condicion.texto,
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
  robot
    .http(url)
    .header('Accept', 'application/json')
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

module.exports = robot => {
  robot.respond(/(clima|tiempo|weather)\s?(.*)/i, msg => {
    const consulta = msg.match[2].trim() || DEFAULT_CITY
    const ciudad = consulta.toLowerCase() === 'santiago' ? DEFAULT_CITY : consulta

    const geoUrl = `${GEO_URL}?name=${encodeURIComponent(ciudad)}&count=1&language=es&format=json`

    pedirJSON(robot, geoUrl, (err, geo) => {
      if (err) {
        robot.emit('error', err, msg, 'clima')
        return msg.reply('ocurrió un error con la búsqueda')
      }

      const lugar = geo && Array.isArray(geo.results) ? geo.results[0] : null

      if (!lugar || typeof lugar.latitude !== 'number' || typeof lugar.longitude !== 'number') {
        return msg.send(`no encontré "${consulta}", prueba con "ciudad, país"`)
      }

      const forecastUrl = `${FORECAST_URL}?latitude=${lugar.latitude}&longitude=${lugar.longitude}` +
        '&current=temperature_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m' +
        '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
        '&timezone=auto&forecast_days=1'

      pedirJSON(robot, forecastUrl, (err2, datos) => {
        if (err2) {
          robot.emit('error', err2, msg, 'clima')
          return msg.reply('ocurrió un error con la búsqueda')
        }

        const texto = reporte(lugar, datos)

        if (!texto) {
          robot.emit('error', new Error('Open-Meteo no entregó los datos esperados'), msg, 'clima')
          return msg.reply('ocurrió un error con la búsqueda')
        }

        msg.send('```\n' + texto + '\n```')
      })
    })
  })
}
