require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')

const helper = new Helper('../scripts/clima.js')
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

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => {
  nock.cleanAll()
  return t.context.room.destroy()
})

test.serial('Clima de Santiago por defecto', async t => {
  mockGeo('Santiago, Chile', santiago)
  mockForecast(climaSantiago)

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  const hubot = t.context.room.messages[1]

  t.deepEqual(t.context.room.messages[0], ['user', 'hubot clima'])
  t.is(hubot[0], 'hubot')
  t.is(hubot[1], [
    '```',
    '      \\   /     Santiago de Chile',
    '       .-.      Despejado',
    '    ― (   ) ―   Ahora 21°C (ST 20°C)',
    "       `-'      Mín 11°C / Máx 28°C",
    '      /   \\     Viento 5 km/h S',
    '                Humedad 51%',
    '                Lluvia 7%',
    '```'
  ].join('\n'))
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
  t.true(hubot[1].includes('Lluvia débil'))
  t.true(hubot[1].includes('Ahora 31°C'))
  t.true(hubot[1].includes('Viento 5 km/h E'))
})

test.serial('Clima con "santiago" en minúsculas usa la ciudad por defecto', async t => {
  mockGeo('Santiago, Chile', santiago)
  mockForecast(climaSantiago)

  t.context.room.user.say('user', 'hubot tiempo santiago')
  await sleep(500)

  t.true(t.context.room.messages[1][1].includes('Santiago de Chile'))
  t.true(nock.isDone())
})

test.serial('Clima de noche usa el dibujo de luna', async t => {
  mockGeo('Santiago, Chile', santiago)
  mockForecast({ ...climaSantiago, current: { ...climaSantiago.current, is_day: 0 } })

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  const hubot = t.context.room.messages[1][1]

  t.true(hubot.includes('*  .-.'))
  t.false(hubot.includes('\\   /'))
})

test.serial('Condición desconocida no rompe el reporte', async t => {
  mockGeo('Santiago, Chile', santiago)
  mockForecast({ ...climaSantiago, current: { ...climaSantiago.current, weather_code: 42 } })

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  const hubot = t.context.room.messages[1][1]

  t.true(hubot.includes('Sin datos'))
  t.true(hubot.includes('Ahora 21°C'))
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

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})

test.serial('Error 500 de la búsqueda de la ciudad', async t => {
  nock(GEO).get('/v1/search').query(true).reply(500)
  mockForecast(climaSantiago)

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})

test.serial('JSON inválido de la búsqueda de la ciudad', async t => {
  nock(GEO).get('/v1/search').query(true).reply(200, '<html>502 Bad Gateway</html>')
  mockForecast(climaSantiago)

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})

test.serial('Error 500 del pronóstico', async t => {
  mockGeo('Santiago, Chile', santiago)
  nock(FORECAST).get('/v1/forecast').query(true).reply(500)

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})

test.serial('JSON inválido del pronóstico', async t => {
  mockGeo('Santiago, Chile', santiago)
  nock(FORECAST).get('/v1/forecast').query(true).reply(200, '{"current": ')

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})

test.serial('Pronóstico con respuesta vacía', async t => {
  mockGeo('Santiago, Chile', santiago)
  nock(FORECAST).get('/v1/forecast').query(true).reply(200, '')

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})

test.serial('Pronóstico sin los datos esperados', async t => {
  mockGeo('Santiago, Chile', santiago)
  mockForecast({ current: {}, daily: {} })

  t.context.room.user.say('user', 'hubot clima')
  await sleep(500)

  t.deepEqual(t.context.room.messages[1], ['hubot', '@user ocurrió un error con la búsqueda'])
})
