require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')

const helper = new Helper('../scripts/clima.js')
const script = require('../scripts/clima.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

const GEO = 'https://geocoding-api.open-meteo.com'
const FORECAST = 'https://api.open-meteo.com'

const santiago = {
  results: [{
    name: 'Santiago de Chile',
    latitude: -33.45694,
    longitude: -70.64827,
    country: 'Chile',
    country_code: 'CL',
    admin1: 'Región Metropolitana de Santiago de Chile'
  }]
}

const paris = {
  results: [{
    name: 'Paris',
    latitude: 48.85341,
    longitude: 2.3488,
    country: 'France',
    country_code: 'FR',
    admin1: 'Île-de-France'
  }]
}

const climaSantiago = {
  current: {
    temperature_2m: 20.6,
    apparent_temperature: 19.9,
    is_day: 1,
    weather_code: 0,
    wind_speed_10m: 4.7,
    wind_direction_10m: 198,
    relative_humidity_2m: 51
  },
  daily: {
    temperature_2m_max: [27.6],
    temperature_2m_min: [11.3],
    precipitation_probability_max: [7]
  }
}

const mockGeo = (nombre, respuesta) =>
  nock(GEO)
    .get('/v1/search')
    .query({ name: nombre, count: '1', language: 'es', format: 'json' })
    .reply(200, respuesta)

const mockForecast = respuesta =>
  nock(FORECAST).get('/v1/forecast').query(true).reply(200, respuesta)

// Ancho en columnas: los emoji ocupan 2 y el selector de variación 0
const anchoVisible = texto => Array.from(texto).reduce((total, ch) => {
  const codigo = ch.codePointAt(0)
  if (codigo === 0xfe0f) return total
  if (codigo >= 0x1f300 || (codigo >= 0x2600 && codigo <= 0x27bf)) return total + 2
  return total + 1
}, 0)

// Reconstruye la frase final (viene envuelta en varias líneas con prefijo »)
const fraseDe = mensaje => mensaje
  .split('\n')
  .filter(linea => linea.indexOf('» ') === 0)
  .map(linea => linea.slice(2))
  .join(' ')

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => {
  delete process.env.HUBOT_CLIMA_TIMEOUT_MS
  nock.cleanAll()
  return t.context.room.destroy()
})

test.serial('Clima de Santiago por defecto (sin llamar al geocoding)', async t => {
  const geoSinUsar = mockGeo('Santiago, Chile', santiago)
  mockForecast(climaSantiago)

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  const hubot = t.context.room.messages[1]
  const lineas = hubot[1].split('\n')

  t.deepEqual(t.context.room.messages[0], ['user', 'hubot clima'])
  t.is(hubot[0], 'hubot')
  t.deepEqual(lineas.slice(0, 8), [
    '```',
    '      \\   /    Santiago de Chile',
    '       .-.     ☀️ Despejado',
    '    ― (   ) ―  Ahora 21°C (ST 20°C)',
    "       `-'     Mín 11°C / Máx 28°C",
    '      /   \\    Viento 5 km/h S',
    '               Humedad 51%',
    '               Lluvia 7%'
  ])
  t.is(lineas[8], '')
  t.true(lineas[9].indexOf('» ') === 0)
  t.is(lineas[lineas.length - 1], '```')
  t.true(script.frases.despejado.includes(fraseDe(hubot[1])))
  t.false(geoSinUsar.isDone())
})

test.serial('Clima de otra ciudad con país', async t => {
  mockGeo('París, Francia', paris)
  mockForecast({
    ...climaSantiago,
    current: { ...climaSantiago.current, temperature_2m: 31.2, weather_code: 61, wind_direction_10m: 80 }
  })

  t.context.room.user.say('user', 'hubot clima París, Francia')
  await sleep(500)

  const hubot = t.context.room.messages[1]

  t.true(hubot[1].includes('Paris, France'))
  t.true(hubot[1].includes('🌦️ Lluvia débil'))
  t.true(hubot[1].includes('Ahora 31°C'))
  t.true(hubot[1].includes('Viento 5 km/h E'))
})

test.serial('Clima con "santiago" en minúsculas usa la ciudad por defecto', async t => {
  const geoSinUsar = mockGeo('Santiago, Chile', santiago)
  mockForecast(climaSantiago)

  t.context.room.user.say('user', 'hubot tiempo santiago')
  await sleep(500)

  t.true(t.context.room.messages[1][1].includes('Santiago de Chile'))
  t.false(geoSinUsar.isDone())
})

test.serial('Clima de noche usa luna y emoji de luna', async t => {
  mockGeo('Temuco, Chile', { results: [{ name: 'Temuco', latitude: -38.73, longitude: -72.59, country: 'Chile' }] })
  mockForecast({ ...climaSantiago, current: { ...climaSantiago.current, is_day: 0 } })

  t.context.room.user.say('user', 'hubot clima Temuco, Chile')
  await sleep(500)

  const hubot = t.context.room.messages[1][1]

  t.true(hubot.includes('🌙 Despejado'))
  t.true(hubot.includes('*  .-.'))
  t.false(hubot.includes('\\   /'))
  t.true(script.frases.despejadoNoche.includes(fraseDe(hubot)))
})

test.serial('Condición desconocida no rompe el reporte', async t => {
  mockGeo('Temuco, Chile', { results: [{ name: 'Temuco', latitude: -38.73, longitude: -72.59, country: 'Chile' }] })
  mockForecast({ ...climaSantiago, current: { ...climaSantiago.current, weather_code: 42 } })

  t.context.room.user.say('user', 'hubot clima Temuco, Chile')
  await sleep(500)

  const hubot = t.context.room.messages[1][1]

  t.true(hubot.includes('❓ Sin datos'))
  t.true(hubot.includes('Ahora 21°C'))
})

test.serial('El bloque cabe en pantallas angostas', async t => {
  const largo = { results: [{ name: 'San Fernando del Valle de Catamarca', latitude: -28.46, longitude: -65.78, country: 'Argentina' }] }
  mockGeo('San Fernando del Valle de Catamarca, Argentina', largo)
  mockForecast({ ...climaSantiago, current: { ...climaSantiago.current, weather_code: 99, wind_direction_10m: 350 } })

  t.context.room.user.say('user', 'hubot clima San Fernando del Valle de Catamarca, Argentina')
  await sleep(500)

  const mensaje = t.context.room.messages[1][1]
  const anchos = mensaje.split('\n').map(anchoVisible)
  const maximo = Math.max(...anchos)

  t.true(maximo <= 41, `ancho máximo ${maximo} columnas`)
  t.true(mensaje.includes('⛈️ Tormenta con granizo'))
  t.true(mensaje.includes('…'))
  t.true(script.frases.tormenta.includes(fraseDe(mensaje)))
})

test.serial('Cada condición tiene frases y ninguna palabra se sale del ancho', t => {
  const condiciones = script.condiciones
  const frases = script.frases

  Object.keys(condiciones).forEach(codigo => {
    const condicion = condiciones[codigo]
    const claves = [`${condicion.dibujo}`, `${condicion.dibujo}Noche`]
    const existentes = claves.filter(clave => Array.isArray(frases[clave]))
    t.true(existentes.length > 0, `sin frases para ${condicion.dibujo}`)
  })

  Object.keys(frases).forEach(clave => {
    const lista = frases[clave]
    t.true(lista.length >= 2, `${clave} tiene ${lista.length} frases`)
    lista.forEach(frase => {
      t.is(frase.trim(), frase)
      t.true(frase.length <= 140, `frase muy larga en ${clave}: ${frase.length}`)
      frase.split(' ').forEach(palabra => {
        t.true(palabra.length <= 39, `palabra muy larga en ${clave}: ${palabra}`)
      })
    })
  })
})

test.serial('Timeout de la API deja una respuesta al usuario', async t => {
  process.env.HUBOT_CLIMA_TIMEOUT_MS = '200'
  nock(FORECAST).get('/v1/forecast').query(true).delayConnection(1500).reply(200, climaSantiago)

  t.context.room.user.say('user', 'hubot clima')
  await sleep(900)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})

test.serial('Ciudad sin resultados', async t => {
  mockGeo('atlantis', { generationtime_ms: 0.5 })
  const forecast = mockForecast(climaSantiago)

  t.context.room.user.say('user', 'hubot clima atlantis')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], [
    'hubot',
    'no encontré "atlantis", prueba con "ciudad, país"'
  ])
  t.false(forecast.isDone())
})

test.serial('Ciudad sin coordenadas', async t => {
  mockGeo('atlantis', { results: [{ name: 'Atlantis', country: 'Océano' }] })
  const forecast = mockForecast(climaSantiago)

  t.context.room.user.say('user', 'hubot clima atlantis')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], [
    'hubot',
    'no encontré "atlantis", prueba con "ciudad, país"'
  ])
  t.false(forecast.isDone())
})

test.serial('Error de red en la búsqueda de la ciudad', async t => {
  nock(GEO).get('/v1/search').query(true).replyWithError('se cayó la red')
  mockForecast(climaSantiago)

  t.context.room.user.say('user', 'hubot clima temuco')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})

test.serial('Error 500 de la búsqueda de la ciudad', async t => {
  nock(GEO).get('/v1/search').query(true).reply(500)
  mockForecast(climaSantiago)

  t.context.room.user.say('user', 'hubot clima temuco')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})

test.serial('JSON inválido de la búsqueda de la ciudad', async t => {
  nock(GEO).get('/v1/search').query(true).reply(200, '<html>502 Bad Gateway</html>')
  mockForecast(climaSantiago)

  t.context.room.user.say('user', 'hubot clima temuco')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})

test.serial('Error 500 del pronóstico', async t => {
  nock(FORECAST).get('/v1/forecast').query(true).reply(500)

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})

test.serial('JSON inválido del pronóstico', async t => {
  nock(FORECAST).get('/v1/forecast').query(true).reply(200, '{"current": ')

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})

test.serial('Pronóstico con respuesta vacía', async t => {
  nock(FORECAST).get('/v1/forecast').query(true).reply(200, '')

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})

test.serial('Pronóstico sin los datos esperados', async t => {
  mockForecast({ current: {}, daily: {} })

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})
